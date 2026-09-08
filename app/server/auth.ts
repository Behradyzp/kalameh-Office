import { env } from "cloudflare:workers";

const COOKIE_NAME = "kalameh_session";
const PASSWORD_ITERATIONS = 210_000;
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

type RuntimeEnv = {
  DB: D1Database;
  BOOTSTRAP_ADMIN_EMAIL?: string;
  BOOTSTRAP_ADMIN_PASSWORD?: string;
  BOOTSTRAP_ADMIN_NAME?: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

const runtime = () => env as unknown as RuntimeEnv;
const encoder = new TextEncoder();

function bytesToBase64(bytes: Uint8Array) {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value);
}

function base64ToBytes(value: string) {
  const decoded = atob(value);
  return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

async function derivePassword(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function createPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePassword(password, salt, PASSWORD_ITERATIONS);
  return {
    hash: bytesToBase64(hash),
    salt: bytesToBase64(salt),
    iterations: PASSWORD_ITERATIONS,
  };
}

export async function verifyPassword(
  password: string,
  expectedHash: string,
  salt: string,
  iterations: number,
) {
  const actual = await derivePassword(password, base64ToBytes(salt), iterations);
  return constantTimeEqual(actual, base64ToBytes(expectedHash));
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return bytesToBase64(new Uint8Array(digest));
}

function readCookie(request: Request, name: string) {
  const cookies = request.headers.get("cookie") || "";
  for (const part of cookies.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export async function getSessionUser(request: Request): Promise<AuthUser | null> {
  const token = readCookie(request, COOKIE_NAME);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const now = Date.now();
  const row = await runtime().DB.prepare(
    `SELECT u.id, u.email, u.name, u.role
     FROM auth_sessions s
     JOIN auth_users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1`,
  ).bind(tokenHash, now).first<AuthUser>();
  if (!row) return null;
  await runtime().DB.prepare(
    "UPDATE auth_sessions SET last_seen_at = ? WHERE token_hash = ?",
  ).bind(now, tokenHash).run();
  return row;
}

export async function requireSession(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return { user: null, response: Response.json({ error: "ابتدا وارد حساب شوید." }, { status: 401 }) };
  return { user, response: null };
}

export async function createSession(userId: string) {
  const token = bytesToBase64(crypto.getRandomValues(new Uint8Array(32)));
  const now = Date.now();
  await runtime().DB.prepare(
    "INSERT INTO auth_sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).bind(crypto.randomUUID(), userId, await sha256(token), now + SESSION_MAX_AGE * 1000, now, now).run();
  return {
    token,
    cookie: `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`,
  };
}

export async function destroySession(request: Request) {
  const token = readCookie(request, COOKIE_NAME);
  if (token) {
    await runtime().DB.prepare("DELETE FROM auth_sessions WHERE token_hash = ?")
      .bind(await sha256(token)).run();
  }
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function ensureBootstrapAdmin(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const configuredEmail = runtime().BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const configuredPassword = runtime().BOOTSTRAP_ADMIN_PASSWORD;
  if (!configuredEmail || !configuredPassword) return null;
  if (normalizedEmail !== configuredEmail || password !== configuredPassword) return null;
  const existing = await runtime().DB.prepare("SELECT id FROM auth_users LIMIT 1").first<{ id: string }>();
  if (existing) return null;
  const credentials = await createPassword(password);
  const id = crypto.randomUUID();
  const now = Date.now();
  await runtime().DB.prepare(
    `INSERT INTO auth_users
     (id, email, name, role, password_hash, password_salt, password_iterations, active, created_at, updated_at)
     VALUES (?, ?, ?, 'admin', ?, ?, ?, 1, ?, ?)`,
  ).bind(
    id,
    normalizedEmail,
    runtime().BOOTSTRAP_ADMIN_NAME || "مدیر کل",
    credentials.hash,
    credentials.salt,
    credentials.iterations,
    now,
    now,
  ).run();
  return id;
}

export function getRuntimeEnv() {
  return runtime();
}
