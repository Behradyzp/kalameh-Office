import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" } });

const permissionKeys: Record<string, string[]> = {
  "پروژه‌ها": ["projects"], "مشاهده پروژه‌ها": ["projects"], "افزودن پروژه": ["projects"], "ویرایش پروژه": ["projects"], "حذف پروژه": ["projects"],
  "وظایف": ["tasks", "personalTasks"], "مشاهده تسک‌ها": ["tasks"], "افزودن تسک": ["tasks"], "ویرایش تسک": ["tasks"], "حذف تسک": ["tasks"], "تغییر وضعیت تسک": ["tasks"],
  "مالی": ["transactions"], "مشاهده مالی": ["transactions"], "مدیریت مالی": ["transactions"],
  "مشتریان": ["clients"], "مشاهده مشتریان": ["clients"], "افزودن مشتری": ["clients"], "ویرایش مشتری": ["clients"], "حذف مشتری": ["clients"],
  "لیدها": ["leads"], "مشاهده لیدها": ["leads"], "افزودن لید": ["leads"], "ویرایش لید": ["leads"], "حذف لید": ["leads"],
  "قراردادها": ["contracts"], "مشاهده قراردادها": ["contracts"], "مدیریت قراردادها": ["contracts"], "اعضای تیم": [],
  "پیام‌ها": ["chats"], "ارسال پیام": ["chats"], "نامه‌ها": ["letters"], "مشاهده نامه‌ها": ["letters"], "ایجاد نامه": ["letters"],
  "تقویم": ["events"], "مشاهده تقویم": ["events"], "مدیریت تقویم": ["events"], "گزارش‌ها": [], "تنظیمات": ["preferences"],
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

const requiredMutationPermission = (key: string, currentValue: unknown, nextValue: unknown) => {
  const current = (Array.isArray(currentValue) ? currentValue : []) as Record<string, unknown>[];
  const next = (Array.isArray(nextValue) ? nextValue : []) as Record<string, unknown>[];
  if (key === "transactions") return "مدیریت مالی";
  const labels: Record<string, [string, string, string]> = {
    projects: ["افزودن پروژه", "ویرایش پروژه", "حذف پروژه"],
    clients: ["افزودن مشتری", "ویرایش مشتری", "حذف مشتری"],
    tasks: ["افزودن تسک", "ویرایش تسک", "حذف تسک"],
    leads: ["افزودن لید", "ویرایش لید", "حذف لید"],
    contracts: ["مدیریت قراردادها", "مدیریت قراردادها", "مدیریت قراردادها"],
    events: ["مدیریت تقویم", "مدیریت تقویم", "مدیریت تقویم"],
    chats: ["ارسال پیام", "ارسال پیام", "ارسال پیام"],
    letters: ["ایجاد نامه", "ایجاد نامه", "ایجاد نامه"],
  };
  if (!labels[key]) return null;
  const currentById = new Map(current.map((item) => [String(item.id), item]));
  const nextById = new Map(next.map((item) => [String(item.id), item]));
  if (next.some((item) => !currentById.has(String(item.id)))) return labels[key][0];
  if (current.some((item) => !nextById.has(String(item.id)))) return labels[key][2];
  for (const item of next) {
    const before = currentById.get(String(item.id));
    if (before && JSON.stringify(before) !== JSON.stringify(item)) {
      if (key === "tasks") {
        const withoutStatus = (value: Record<string, unknown>) => { const copy = { ...value }; delete copy.status; delete copy.archivedAt; delete copy.progress; return copy; };
        if (JSON.stringify(withoutStatus(before)) === JSON.stringify(withoutStatus(item))) return "تغییر وضعیت تسک";
      }
      return labels[key][1];
    }
  }
  return null;
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
    else if (key === "personalTasks") result[key] = ((Array.isArray(value) ? value : []) as Record<string, unknown>[])
      .filter((task) => task.ownerId === memberId);
    else if (key === "attendance") result[key] = ((Array.isArray(value) ? value : []) as Record<string, unknown>[])
      .filter((entry) => entry.memberId === memberId);
    else if (key === "leaves") result[key] = ((Array.isArray(value) ? value : []) as Record<string, unknown>[])
      .filter((leave) => leave.memberId === memberId);
    else if (!allowed.has(key)) result[key] = Array.isArray(value) ? [] : value;
  }
  return result;
};

const syncAuthMembers = async (admin: ReturnType<typeof createClient>, data: Record<string, unknown>) => {
  const { data: profiles, error } = await admin.from("profiles").select("email,name,role,active,last_seen_at").order("created_at");
  if (error) throw error;
  const existing = (Array.isArray(data.members) ? data.members : []) as Record<string, unknown>[];
  let nextId = existing.reduce((max, member) => Math.max(max, Number(member.id) || 0), 0) + 1;
  const merged = [...existing];
  for (const profile of profiles || []) {
    const index = merged.findIndex((member) => String(member.email || "").toLowerCase() === String(profile.email || "").toLowerCase());
    const base = index >= 0 ? merged[index] : { id: nextId++, permissions: profile.role === "admin" ? ["همه بخش‌ها"] : ["مشاهده پروژه‌ها", "مشاهده تسک‌ها", "افزودن تسک", "تغییر وضعیت تسک", "پیام‌ها"] };
    const member = { ...base, name: profile.name, email: profile.email, role: profile.role === "admin" ? "مدیر کل" : String(base.role || "عضو تیم"), status: profile.active ? "فعال" : "غیرفعال", lastSeen: profile.last_seen_at ? new Date(profile.last_seen_at).getTime() : undefined };
    if (index >= 0) merged[index] = member; else merged.push(member);
  }
  return { ...data, members: merged };
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
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    await admin.from("audit_logs").delete().lt("created_at", threeDaysAgo);

    if (action === "session") return respond({ user: profile });
    if (action === "workspace_get") {
      const { data: row, error } = await admin.from("workspace_state").select("data").eq("id", "main").single();
      if (error) throw error;
      const synced = await syncAuthMembers(admin, row.data || {});
      if (JSON.stringify(synced.members) !== JSON.stringify((row.data || {}).members)) await admin.from("workspace_state").update({ data: synced, updated_at: new Date().toISOString() }).eq("id", "main");
      const visible = filterWorkspace(synced, profile.email, isAdmin);
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
        const permissions = new Set((Array.isArray(member?.permissions) ? member.permissions : []).map(String));
        for (const [key, value] of Object.entries(submitted)) {
          if (!allowed.has(key)) continue;
          if (key !== "leaves" && key !== "personalTasks" && key !== "attendance") {
            const required = requiredMutationPermission(key, current[key], value);
            const legacyPermission = ({ projects:"پروژه‌ها", tasks:"وظایف", clients:"مشتریان", transactions:"مالی", leads:"لیدها", contracts:"قراردادها", events:"تقویم", chats:"پیام‌ها", letters:"نامه‌ها" } as Record<string,string>)[key] || "";
            if (required && !permissions.has(required) && !permissions.has(legacyPermission)) return respond({ error: `دسترسی «${required}» برای این حساب فعال نیست.` }, 403);
            next[key] = stripSignedUrls(value);
            continue;
          }
          if (memberId === undefined) return respond({ error: "پروفایل عضو در فضای کاری پیدا نشد." }, 403);
          if (key === "personalTasks") {
            const existingTasks = (Array.isArray(current.personalTasks) ? current.personalTasks : []) as Record<string, unknown>[];
            const others = existingTasks.filter((task) => task.ownerId !== memberId);
            const own = ((Array.isArray(value) ? value : []) as Record<string, unknown>[]).map((task) => ({ ...stripSignedUrls(task) as Record<string, unknown>, ownerId: memberId }));
            next.personalTasks = [...others, ...own];
            continue;
          }
          if (key === "attendance") {
            const existingAttendance = (Array.isArray(current.attendance) ? current.attendance : []) as Record<string, unknown>[];
            const others = existingAttendance.filter((entry) => entry.memberId !== memberId);
            const own = ((Array.isArray(value) ? value : []) as Record<string, unknown>[]).filter((entry) => entry.memberId === memberId);
            next.attendance = [...others, ...own];
            continue;
          }
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
    if (action === "file_upload") {
      const fileName = String(body.fileName || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
      const mimeType = String(body.mimeType || "application/octet-stream");
      const encoded = String(body.base64 || "");
      if (!encoded) return respond({ error: "فایل دریافت نشد." }, 400);
      const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
      if (bytes.byteLength > 20 * 1024 * 1024) return respond({ error: "حداکثر حجم فایل ۲۰ مگابایت است." }, 413);
      const extension = fileName.includes(".") ? `.${fileName.split(".").pop()}` : "";
      const path = `${profile.id}/${crypto.randomUUID()}${extension}`;
      const { error: uploadError } = await admin.storage.from("office-files").upload(path, bytes, { contentType: mimeType, upsert: false });
      if (uploadError) throw uploadError;
      const { data: signed, error: signedError } = await admin.storage.from("office-files").createSignedUrl(path, 3600);
      if (signedError) throw signedError;
      return respond({ name: fileName, type: mimeType, url: signed.signedUrl, storagePath: path }, 201);
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
      const { data: workspaceRow } = await admin.from("workspace_state").select("data").eq("id", "main").single();
      if (workspaceRow?.data) {
        const synced = await syncAuthMembers(admin, workspaceRow.data);
        await admin.from("workspace_state").update({ data: synced, updated_at: new Date().toISOString() }).eq("id", "main");
      }
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
