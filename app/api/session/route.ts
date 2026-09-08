import { getSessionUser } from "../../server/auth";

export const dynamic = "force-dynamic";

export async function GET(request:Request){
  const user=await getSessionUser(request);
  return Response.json({user});
}
