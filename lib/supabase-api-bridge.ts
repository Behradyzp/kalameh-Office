import { supabase, supabaseConfigured } from "./supabase";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const errorResponse = (message: string, status = 500) =>
  jsonResponse({ error: message }, status);

const userShape = (user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}) => ({
  id: user.id,
  email: user.email || "",
  name: String(user.user_metadata?.name || user.email?.split("@")[0] || "کاربر"),
  role: String(user.user_metadata?.role || "member"),
});

async function invokeOfficeApi(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("office-api", { body });
  if (error) {
    const context = (error as { context?: Response }).context;
    if (context) {
      const payload = await context.clone().json().catch(() => ({ error: error.message }));
      return { payload, status: context.status || 500 };
    }
    throw new Error(error.message || "ارتباط با سرویس انجام نشد.");
  }
  return { payload: data, status: 200 };
}

async function uploadFile(body: FormData) {
  const file = body.get("file");
  if (!(file instanceof File)) return errorResponse("فایل انتخاب نشده است.", 400);
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return errorResponse("ابتدا وارد حساب شوید.", 401);
  if (file.size > 20 * 1024 * 1024) return errorResponse("حداکثر حجم فایل ۲۰ مگابایت است.", 413);
  const extension = file.name.includes(".") ? `.${file.name.split(".").pop()}` : "";
  const path = `${user.id}/${crypto.randomUUID()}${extension.replace(/[^.a-zA-Z0-9]/g, "")}`;
  const { error } = await supabase.storage.from("office-files").upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) {
    const buffer = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (let index = 0; index < buffer.length; index += 0x8000) binary += String.fromCharCode(...buffer.subarray(index, index + 0x8000));
    const fallback = await invokeOfficeApi({ action: "file_upload", fileName: file.name, mimeType: file.type, base64: btoa(binary) });
    return jsonResponse(fallback.payload, fallback.status >= 400 ? fallback.status : 201);
  }
  const { data: signed, error: signedError } = await supabase.storage.from("office-files").createSignedUrl(path, 3600);
  if (signedError) return errorResponse("ساخت لینک امن فایل انجام نشد.", 503);
  return jsonResponse({ name: file.name, type: file.type || "application/octet-stream", url: signed.signedUrl, storagePath: path }, 201);
}

export function installSupabaseApiBridge() {
  if (typeof window === "undefined") return;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw, window.location.href);
    const apiIndex = url.pathname.indexOf("/api/");
    if (apiIndex < 0 && !raw.startsWith("api/")) return nativeFetch(input, init);
    if (!supabaseConfigured) return errorResponse("اتصال Supabase تنظیم نشده است.", 503);
    const route = apiIndex >= 0 ? url.pathname.slice(apiIndex + 4) : raw.slice(3).split("?")[0];
    const method = (init?.method || "GET").toUpperCase();
    try {
      if (route === "/session") {
        const { data } = await supabase.auth.getSession();
        if (!data.session?.user) return jsonResponse({ user: null });
        const result = await invokeOfficeApi({ action: "session" });
        if (result.status >= 400) return jsonResponse(result.payload, result.status);
        return jsonResponse({ user: result.payload?.user || userShape(data.session.user) });
      }
      if (route === "/auth/login" && method === "POST") {
        const credentials = JSON.parse(String(init?.body || "{}"));
        const { data, error } = await supabase.auth.signInWithPassword({ email: credentials.email, password: credentials.password });
        if (error || !data.user) return errorResponse(error?.message || "ایمیل یا رمز عبور صحیح نیست.", 401);
        const result = await invokeOfficeApi({ action: "session" });
        if (result.status >= 400) return jsonResponse(result.payload, result.status);
        return jsonResponse({ user: result.payload?.user || userShape(data.user) });
      }
      if (route === "/auth/logout" && method === "POST") {
        await supabase.auth.signOut();
        return jsonResponse({ ok: true });
      }
      if (route === "/auth/users" && method === "POST") {
        const payload = JSON.parse(String(init?.body || "{}"));
        const result = await invokeOfficeApi({ action: "user_create", ...payload });
        return jsonResponse(result.payload, result.status >= 400 ? result.status : 201);
      }
      if (route === "/auth/users" && method === "DELETE") {
        const payload = JSON.parse(String(init?.body || "{}"));
        const result = await invokeOfficeApi({ action: "user_delete", ...payload });
        return jsonResponse(result.payload, result.status);
      }
      if (route === "/workspace" && method === "GET") {
        const result = await invokeOfficeApi({ action: "workspace_get" });
        return jsonResponse(result.payload, result.status);
      }
      if (route === "/workspace" && method === "PUT") {
        const payload = JSON.parse(String(init?.body || "{}"));
        const result = await invokeOfficeApi({ action: "workspace_save", data: payload.data });
        return jsonResponse(result.payload, result.status);
      }
      if (route === "/files" && method === "POST" && init?.body instanceof FormData) {
        return uploadFile(init.body);
      }
      return errorResponse("مسیر پیدا نشد.", 404);
    } catch (reason) {
      return errorResponse(reason instanceof Error ? reason.message : "ارتباط با سرویس انجام نشد.", 503);
    }
  };
}
