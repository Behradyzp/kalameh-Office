import { createPassword, getRuntimeEnv, requireSession } from "../../../server/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await requireSession(request);
    if (auth.response) return auth.response;
    if (auth.user?.role !== "admin") {
      return Response.json({ error: "فقط مدیر کل می‌تواند حساب کاربری بسازد." }, { status: 403 });
    }
    const body = await request.json() as { email?: string; password?: string; name?: string; role?: string };
    const email = body.email?.trim().toLowerCase() || "";
    const password = body.password || "";
    const name = body.name?.trim() || "";
    if (!email || !name || password.length < 8) {
      return Response.json({ error: "نام، ایمیل و رمز حداقل ۸ کاراکتری لازم است." }, { status: 400 });
    }
    const credentials = await createPassword(password);
    const now = Date.now();
    await getRuntimeEnv().DB.prepare(
      `INSERT INTO auth_users
       (id, email, name, role, password_hash, password_salt, password_iterations, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    ).bind(
      crypto.randomUUID(), email, name, body.role === "مدیر کل" ? "admin" : "member",
      credentials.hash, credentials.salt, credentials.iterations, now, now,
    ).run();
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error && /UNIQUE/i.test(error.message)
      ? "برای این ایمیل قبلاً حساب ساخته شده است."
      : "ساخت حساب کاربری انجام نشد.";
    console.error("user creation failed", error);
    return Response.json({ error: message }, { status: 400 });
  }
}
