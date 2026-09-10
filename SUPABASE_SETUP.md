# راه‌اندازی دفتر کلمه روی GitHub Pages و Supabase

این نسخه رابط کاربری را روی GitHub Pages و ورود، دیتابیس و فایل‌ها را روی Supabase اجرا می‌کند.

## ۱. ساخت پروژه Supabase

1. در Supabase یک پروژه جدید بسازید.
2. از بخش **Project Settings → Database** رمز دیتابیس را نگه دارید.
3. از **Project Settings → API** مقدار Project URL و کلید `anon/public` را بردارید.
4. از Account Settings یک **Personal access token** بسازید.

کلید `service_role` را در GitHub یا کد سایت قرار ندهید. تابع امن Supabase این کلید را در محیط سرور دریافت می‌کند.

## ۲. افزودن Secrets در GitHub

در مخزن به **Settings → Secrets and variables → Actions → New repository secret** بروید و این پنج مقدار را ثبت کنید:

| Secret | مقدار |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | توکن حساب Supabase |
| `SUPABASE_DB_PASSWORD` | رمز دیتابیس پروژه |
| `SUPABASE_PROJECT_ID` | شناسه پروژه، بخش اول آدرس Supabase |
| `VITE_SUPABASE_URL` | آدرس کامل Project URL |
| `VITE_SUPABASE_ANON_KEY` | کلید عمومی `anon` |

## ۳. فعال‌کردن GitHub Pages

در **Settings → Pages**، قسمت Source را روی **GitHub Actions** قرار دهید. سپس Workflow با نام `Deploy GitHub Pages and Supabase` را از تب Actions اجرا کنید.

Workflow به‌صورت خودکار دیتابیس، فضای فایل، تابع امن مدیریت کاربران و نسخه GitHub Pages را منتشر می‌کند.

## ۴. ساخت اولین مدیر

پس از سبزشدن Workflow، در Supabase به **Authentication → Users → Add user** بروید. ایمیل و رمز مدیر را بسازید و گزینه تأیید خودکار ایمیل را فعال کنید. اولین کاربری که ساخته شود خودکار مدیر کل خواهد بود.

بعد از ورود با همان حساب، مدیر می‌تواند از بخش اعضای تیم برای کارمندان ایمیل و رمز بسازد یا حساب‌های قبلی را حذف کند.

## نکات امنیتی

- ثبت‌نام عمومی لازم نیست و بهتر است خاموش بماند.
- عملیات ساخت و حذف حساب فقط در تابع امن `office-api` و پس از بررسی نقش مدیر انجام می‌شود.
- اطلاعات اصلی مستقیماً در اختیار مرورگر قرار نمی‌گیرد و بر اساس دسترسی هر عضو فیلتر می‌شود.
- فایل‌ها با مسیر تصادفی ذخیره می‌شوند. Bucket برای نمایش مستقیم عکس و PDF عمومی است؛ فایل بسیار محرمانه در این بخش بارگذاری نشود.
