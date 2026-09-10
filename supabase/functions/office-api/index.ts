import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" } });

const permissionKeys: Record<string, string[]> = {
  "پروژه‌ها": ["projects"], "وظایف": ["tasks", "personalTasks"], "مالی": ["transactions"],
  "مشتریان": ["clients"], "لیدها": ["leads"], "قراردادها": ["contracts"], "اعضای تیم": [],
  "پیام‌ها": ["chats"], "نامه‌ها": ["letters"], "تقویم": ["events"], "تنظیمات": ["preferences"],
};

const allowedKeys = (data: Record<string, unknown>, email: string, admin: boolean) => {
  if (admin) return new Set(Object.keys(data));
  const allowed = new Set(["attendance", "leaves", "notifications"]);
  const members = Array.isArray(data.members) ? data.members as Record<string, unknown>[] : [];
  const member = members.find((candidate) => String(candidate.email || "").toLowerCase() === email.toLowerCase());
  for (const permission of Array.isArray(member?.permissions) ? member.permissions : []) {
    for (const key of permissionKeys[String(permission)] || []) allowed.add(key);
  }
  return allowed;
};

const filterWorkspace = (data: Record<string, unknown>, email: string, admin: boolean) => {
  if (admin) return data;
  const allowed = allowedKeys(data, email, false);
  const members = Array.isArray(data.members) ? data.members as Record<string, unknown>[] : [];
  const member = members.find((candidate) => String(candidate.email || "").toLowerCase() === email.toLowerCase());
  const memberId = member?.id;
  const projects = (Array.isArray(data.projects) ? data.projects : []) as Record<string, unknown>[];
  const visibleProjects = projects.filter((project) => {
    const ids = Array.isArray(project.memberIds) ? project.memberIds : [];
    return !project.ownerId || project.ownerId === memberId || ids.includes(memberId);
  });
  const projectNames = new Set(visibleProjects.map((project) => String(project.title || "")));
  const tasks = ((Array.isArray(data.tasks) ? data.tasks : []) as Record<string, unknown>[])
    .filter((task) => projectNames.has(String(task.project || "")));
  const result: Record<string, unknown> = { ...data };
  for (const [key, value] of Object.entries(result)) {
    if (key === "members") {
      result[key] = members.map((candidate) => String(candidate.email || "").toLowerCase() === email.toLowerCase()
        ? candidate : { ...candidate, permissions: [] });
    } else if (key === "projects") result[key] = allowed.has(key) ? visibleProjects : [];
    else if (key === "tasks") result[key] = allowed.has(key) ? tasks : [];
    else if (key === "leaves") result[key] = ((Array.isArray(value) ? value : []) as Record<string, unknown>[])
      .filter((leave) => leave.memberId === memberId);
    else if (!allowed.has(key)) result[key] = Array.isArray(value) ? [] : value;
  }
  return result;
};

const stripSignedUrls = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stripSignedUrls);
  if (!value || typeof value !== "object") return value;
  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(source)) {
    if (key === "url" && typeof source.storagePath === "string") continue;
    result[key] = stripSignedUrls(item);
  }
  return result;
};

const hydrateSignedUrls = async (admin: ReturnType<typeof createClient>, value: unknown) => {
  const paths = new Set<string>();
  const collect = (item: unknown) => {
    if (Array.isArray(item)) return item.forEach(collect);
    if (!item || typeof item !== "object") return;
    const object = item as Record<string, unknown>;
    if (typeof object.storagePath === "string") paths.add(object.storagePath);
    Object.values(object).forEach(collect);
  };
  collect(value);
  if (!paths.size) return value;
  const ordered = Array.from(paths);
  const { data } = await admin.storage.from("office-files").createSignedUrls(ordered, 3600);
  const urls = new Map((data || []).map((item, index) => [ordered[index], item.signedUrl]));
  const hydrate = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(hydrate);
    if (!item || typeof item !== "object") return item;
    const object = item as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(object)) next[key] = hydrate(child);
    if (typeof object.storagePath === "string") next.url = urls.get(object.storagePath) || "";
    return next;
  };
  return hydrate(value);
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return respond({ error: "Method not allowed" }, 405);
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authorization = request.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return respond({ error: "ابتدا وارد حساب شوید." }, 401);
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: profile } = await admin.from("profiles").select("id,email,name,role,active").eq("id", authData.user.id).single();
    if (!profile?.active) return respond({ error: "حساب کاربری غیرفعال است." }, 403);
    await admin.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", profile.id);
    const body = await request.json() as Record<string, unknown>;
    const action = String(body.action || "");
    const isAdmin = profile.role === "admin";

    if (action === "session") return respond({ user: profile });
    if (action === "workspace_get") {
      const { data: row, error } = await admin.from("workspace_state").select("data").eq("id", "main").single();
      if (error) throw error;
      const visible = filterWorkspace(row.data || {}, profile.email, isAdmin);
      return respond({ data: await hydrateSignedUrls(admin, visible) });
    }
    if (action === "workspace_save") {
      if (!body.data || typeof body.data !== "object") return respond({ error: "اطلاعات نامعتبر است." }, 400);
      const { data: row, error } = await admin.from("workspace_state").select("data").eq("id", "main").single();
      if (error) throw error;
      const current = (row.data || {}) as Record<string, unknown>;
      const submitted = body.data as Record<string, unknown>;
      let next = stripSignedUrls(submitted) as Record<string, unknown>;
      if (!isAdmin) {
        const allowed = allowedKeys(current, profile.email, false);
        next = { ...current };
        const members = (Array.isArray(current.members) ? current.members : []) as Record<string, unknown>[];
        const member = members.find((candidate) => String(candidate.email || "").toLowerCase() === profile.email.toLowerCase());
        const memberId = member?.id;
        for (const [key, value] of Object.entries(submitted)) {
          if (!allowed.has(key)) continue;
          if (key !== "leaves") {
            next[key] = stripSignedUrls(value);
            continue;
          }
          if (memberId === undefined) return respond({ error: "پروفایل عضو در فضای کاری پیدا نشد." }, 403);
          const existing = (Array.isArray(current.leaves) ? current.leaves : []) as Record<string, unknown>[];
          const incoming = (Array.isArray(value) ? value : []) as Record<string, unknown>[];
          const others = existing.filter((leave) => leave.memberId !== memberId);
          const ownExisting = new Map(existing.filter((leave) => leave.memberId === memberId).map((leave) => [String(leave.id), leave]));
          const protectedIds = new Set(others.map((leave) => String(leave.id)));
          const own = incoming.filter((leave) => leave.memberId === memberId && !protectedIds.has(String(leave.id))).map((leave) => {
            const previous = ownExisting.get(String(leave.id));
            return {
              id: leave.id,
              memberId,
              from: String(leave.from || ""),
              to: String(leave.to || ""),
              reason: String(leave.reason || ""),
              status: previous?.status || "در انتظار",
            };
          });
          next.leaves = [...others, ...own];
        }
      }
      const { error: saveError } = await admin.from("workspace_state").update({ data: next, updated_at: new Date().toISOString() }).eq("id", "main");
      if (saveError) throw saveError;
      await admin.from("audit_logs").insert({ user_id: profile.id, action: "workspace_updated" });
      return respond({ ok: true });
    }
    if (action === "user_create") {
      if (!isAdmin) return respond({ error: "فقط مدیر کل به این بخش دسترسی دارد." }, 403);
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const name = String(body.name || "").trim();
      const role = body.role === "admin" ? "admin" : "member";
      if (!email.includes("@") || password.length < 8 || !name) return respond({ error: "نام، ایمیل معتبر و رمز حداقل ۸ کاراکتری الزامی است." }, 422);
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name }, app_metadata: { role } });
      if (error) return respond({ error: error.message }, 409);
      await admin.from("profiles").update({ name, role, active: true }).eq("id", data.user.id);
      await admin.from("audit_logs").insert({ user_id: profile.id, action: "user_created", metadata: { created_user_id: data.user.id, email } });
      return respond({ user: { id: data.user.id, email, name, role } }, 201);
    }
    if (action === "user_delete") {
      if (!isAdmin) return respond({ error: "فقط مدیر کل به این بخش دسترسی دارد." }, 403);
      const email = String(body.email || "").trim().toLowerCase();
      if (email === profile.email.toLowerCase()) return respond({ error: "حساب مدیر فعلی قابل حذف نیست." }, 422);
      const { data: target } = await admin.from("profiles").select("id,role").eq("email", email).maybeSingle();
      if (!target) return respond({ error: "حساب کاربر پیدا نشد." }, 404);
      if (target.role === "admin") return respond({ error: "حذف مدیر دیگر از این بخش مجاز نیست." }, 422);
      const { error } = await admin.auth.admin.deleteUser(target.id);
      if (error) throw error;
      await admin.from("audit_logs").insert({ user_id: profile.id, action: "user_deleted", metadata: { email } });
      return respond({ ok: true });
    }
    return respond({ error: "عملیات پیدا نشد." }, 404);
  } catch (error) {
    console.error(error);
    return respond({ error: error instanceof Error ? error.message : "خطای سرویس" }, 500);
  }
});
