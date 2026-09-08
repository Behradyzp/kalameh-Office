import {env} from "cloudflare:workers";
import { requireSession } from "../../server/auth";

export const dynamic="force-dynamic";

type WorkspaceRecord=Record<string,unknown>&{members?:Array<{id?:number;email?:string;permissions?:string[];name?:string}>;logs?:unknown[]};

const permissionKeys:Record<string,string[]>={
  "پروژه‌ها":["projects"],
  "وظایف":["tasks","personalTasks"],
  "مالی":["transactions"],
  "مشتریان":["clients"],
  "لیدها":["leads"],
  "قراردادها":["contracts"],
  "اعضای تیم":[],
  "پیام‌ها":["chats"],
  "نامه‌ها":["letters"],
  "تقویم":["events"],
  "تنظیمات":["preferences"],
};

const commonKeys=["attendance","leaves","notifications"];

function allowedKeys(data:WorkspaceRecord,email:string,admin:boolean){
  if(admin)return new Set(Object.keys(data));
  const member=data.members?.find(item=>item.email?.toLowerCase()===email.toLowerCase());
  const permissions=member?.permissions||[];
  const keys=new Set(commonKeys);
  for(const permission of permissions){
    for(const key of permissionKeys[permission]||[])keys.add(key);
  }
  return keys;
}

function filterWorkspace(data:WorkspaceRecord,email:string,admin:boolean){
  if(admin)return data;
  const allowed=allowedKeys(data,email,false);
  const member=data.members?.find(item=>item.email?.toLowerCase()===email.toLowerCase());
  const visibleMembers=(data.members||[]).map(item=>item.email?.toLowerCase()===email.toLowerCase()?item:{...item,permissions:[]});
  const projects=Array.isArray(data.projects)?data.projects as Array<Record<string,unknown>>:[];
  const visibleProjects=projects.filter(project=>!project.ownerId||project.ownerId===member?.id||(Array.isArray(project.memberIds)&&project.memberIds.includes(member?.id)));
  const visibleProjectNames=new Set(visibleProjects.map(project=>project.title));
  const tasks=Array.isArray(data.tasks)?data.tasks as Array<Record<string,unknown>>:[];
  const visibleTasks=tasks.filter(task=>visibleProjectNames.has(task.project)&&(task.assignee===member?.name||visibleProjects.some(project=>project.title===task.project&&Array.isArray(project.memberIds)&&project.memberIds.includes(member?.id))));
  return Object.fromEntries(Object.entries(data).map(([key,value])=>[
    key,
    key==="members"?visibleMembers:
    key==="projects"&&allowed.has(key)?visibleProjects:
    key==="tasks"&&allowed.has(key)?visibleTasks:
    allowed.has(key)?value:Array.isArray(value)?[]:key==="preferences"?{fontScale:1,theme:"violet"}:value,
  ]));
}

export async function GET(request:Request){
  try{
    const auth=await requireSession(request);
    if(auth.response)return auth.response;
    const row=await env.DB.prepare("SELECT data FROM workspace_state WHERE id = ?").bind("main").first<{data:string}>();
    if(!row)return Response.json({data:null});
    const data=JSON.parse(row.data) as WorkspaceRecord;
    return Response.json({data:filterWorkspace(data,auth.user!.email,auth.user!.role==="admin")});
  }catch(error){
    console.error("workspace load failed",error);
    return Response.json({error:"امکان دریافت اطلاعات وجود ندارد."},{status:503});
  }
}

export async function PUT(request:Request){
  try{
    const auth=await requireSession(request);
    if(auth.response)return auth.response;
    const body=await request.json() as {data?:WorkspaceRecord};
    if(!body.data)return Response.json({error:"اطلاعات نامعتبر است."},{status:400});
    const existing=await env.DB.prepare("SELECT data FROM workspace_state WHERE id = ?").bind("main").first<{data:string}>();
    let next=body.data;
    if(existing){
      const current=JSON.parse(existing.data) as WorkspaceRecord;
      const allowed=allowedKeys(current,auth.user!.email,auth.user!.role==="admin");
      next={...current};
      for(const [key,value] of Object.entries(body.data))if(allowed.has(key))next[key]=value;
      if(auth.user!.role!=="admin"){
        const changed=Object.keys(body.data).filter(key=>allowed.has(key));
        next.logs=[{id:Date.now(),member:auth.user!.name,action:`بخش‌های ${changed.join("، ")} را به‌روزرسانی کرد`,time:new Date().toISOString()},...(current.logs||[])];
      }
    }
    await env.DB.prepare("INSERT INTO workspace_state (id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at").bind("main",JSON.stringify(next),Date.now()).run();
    return Response.json({ok:true});
  }catch(error){
    console.error("workspace save failed",error);
    return Response.json({error:"ذخیره اطلاعات انجام نشد."},{status:503});
  }
}
