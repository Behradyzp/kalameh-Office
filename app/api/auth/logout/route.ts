import { destroySession } from "../../../server/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const cookie = await destroySession(request);
  return Response.json({ ok: true }, { headers: { "set-cookie": cookie } });
}
