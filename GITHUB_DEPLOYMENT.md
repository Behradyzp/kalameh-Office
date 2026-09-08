# انتشار دفتر کلمه از GitHub

این پروژه با هر Push روی شاخه `main` به‌صورت خودکار روی Cloudflare Workers منتشر می‌شود. اطلاعات ساختاری در D1 و فایل‌ها در R2 باقی می‌مانند و با انتشار نسخه جدید حذف نمی‌شوند.

## منابع Cloudflare

در حساب Cloudflare یک D1 Database و یک R2 Bucket بسازید. سپس یک API Token با دسترسی ویرایش Workers، D1 و R2 ایجاد کنید.

## Secrets مخزن GitHub

از مسیر `Settings → Secrets and variables → Actions` این موارد را به Repository secrets اضافه کنید:

- `CF_API_TOKEN`: توکن Cloudflare
- `CF_ACCOUNT_ID`: شناسه حساب Cloudflare
- `CF_D1_DATABASE_ID`: شناسه دیتابیس D1
- `CF_D1_DATABASE_NAME`: نام دیتابیس D1
- `CF_R2_BUCKET_NAME`: نام R2 Bucket
- `APP_ADMIN_EMAIL`: ایمیل اولین مدیر
- `APP_ADMIN_PASSWORD`: رمز قوی اولین مدیر، حداقل ۸ کاراکتر
- `APP_ADMIN_NAME`: نام نمایشی مدیر

رمز مدیر فقط برای ساخت اولین حساب استفاده می‌شود. بعد از ساخته‌شدن اولین حساب، ایجاد کاربران جدید از بخش «اعضای تیم» انجام می‌شود.

## انتشار

Workflow با نام `Deploy Kalameh Office` در تب Actions قابل اجراست. در Pushهای بعدی، Build، migration دیتابیس و انتشار به‌صورت خودکار انجام می‌شوند.
