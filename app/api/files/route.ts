import {env} from "cloudflare:workers";
import { requireSession } from "../../server/auth";

export const dynamic="force-dynamic";

export async function POST(request:Request){
  try{
    const auth=await requireSession(request);
    if(auth.response)return auth.response;
    const form=await request.formData();
    const file=form.get("file");
    if(!(file instanceof File))return Response.json({error:"فایل انتخاب نشده است."},{status:400});
    if(file.size>20*1024*1024)return Response.json({error:"حداکثر حجم فایل ۲۰ مگابایت است."},{status:413});
    const safeName=file.name.replace(/[^\p{L}\p{N}._-]+/gu,"-");
    const key=`chat/${crypto.randomUUID()}-${safeName}`;
    await env.BUCKET.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type||"application/octet-stream"},customMetadata:{originalName:file.name}});
    return Response.json({name:file.name,type:file.type||"application/octet-stream",url:`/api/files?key=${encodeURIComponent(key)}`});
  }catch(error){
    console.error("file upload failed",error);
    return Response.json({error:"آپلود فایل انجام نشد."},{status:503});
  }
}

export async function GET(request:Request){
  try{
    const auth=await requireSession(request);
    if(auth.response)return auth.response;
    const key=new URL(request.url).searchParams.get("key");
    if(!key)return new Response("Not found",{status:404});
    const object=await env.BUCKET.get(key);
    if(!object)return new Response("Not found",{status:404});
    const headers=new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag",object.httpEtag);
    headers.set("content-disposition",`inline; filename*=UTF-8''${encodeURIComponent(object.customMetadata?.originalName||"attachment")}`);
    return new Response(object.body,{headers});
  }catch(error){
    console.error("file download failed",error);
    return new Response("File unavailable",{status:503});
  }
}
