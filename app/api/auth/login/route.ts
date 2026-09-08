import { createSession, ensureBootstrapAdmin, getRuntimeEnv, verifyPassword } from "../../../server/auth";

export const dynamic = "force-dynamic";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  password_hash: string;
  password_salt: string;
  password_iterations: number;
  active: number;
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase() || "";
    const password = body.password || "";
    if (!email || !password) {
      return Response.json({ error: "ایمیل و رمز عبور را وارد کنید." }, { status: 400 });
    }

    let row = await getRuntimeEnv().DB.prepare(
      "SELECT * FROM auth_users WHERE email = ? LIMIT 1",
    ).bind(email).first<UserRow>();
    if (!row) {
      await ensureBootstrapAdmin(email, password);
      row = await getRuntimeEnv().DB.prepare(
        "SELECT * FROM auth_users WHERE email = ? LIMIT 1",
      ).bind(email).first<UserRow>();
    }
    const valid = row && row.active === 1 && await verifyPassword(
      password,
      row.password_hash,
      row.password_salt,
      row.password_iterations,
    );
    if (!valid || !row) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      return Response.json({ error: "ایمیل یا رمز عبور صحیح نیست." }, { status: 401 });
    }

    const session = await createSession(row.id);
    return Response.json(
      { user: { id: row.id, email: row.email, name: row.name, role: row.role } },
      { headers: { "set-cookie": session.cookie } },
    );
  } catch (error) {
    console.error("login failed", error);
    return Response.json({ error: "ورود انجام نشد. دوباره تلاش کنید." }, { status: 503 });
  }
}
