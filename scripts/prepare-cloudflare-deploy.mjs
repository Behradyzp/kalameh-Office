import { mkdir, writeFile } from "node:fs/promises";

const required = [
  "CF_D1_DATABASE_ID",
  "CF_D1_DATABASE_NAME",
  "CF_R2_BUCKET_NAME",
  "APP_ADMIN_EMAIL",
];

for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing deployment variable: ${key}`);
}

const config = {
  name: process.env.CF_WORKER_NAME || "kalameh-office",
  main: "../dist/server/index.js",
  compatibility_date: "2026-05-15",
  compatibility_flags: ["nodejs_compat"],
  no_bundle: true,
  observability: { enabled: true },
  assets: { directory: "../dist/client", binding: "ASSETS" },
  d1_databases: [{
    binding: "DB",
    database_name: process.env.CF_D1_DATABASE_NAME,
    database_id: process.env.CF_D1_DATABASE_ID,
    migrations_dir: "../drizzle",
  }],
  r2_buckets: [{ binding: "BUCKET", bucket_name: process.env.CF_R2_BUCKET_NAME }],
  vars: {
    BOOTSTRAP_ADMIN_EMAIL: process.env.APP_ADMIN_EMAIL,
    BOOTSTRAP_ADMIN_NAME: process.env.APP_ADMIN_NAME || "مدیر کل",
  },
};

await mkdir(".deploy", { recursive: true });
await writeFile(".deploy/wrangler.json", JSON.stringify(config, null, 2));
