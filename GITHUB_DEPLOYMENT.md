# دریافت بسته cPanel از GitHub

با هر Push روی شاخه `main`، اکشن **Build cPanel Package** رابط کاربری را می‌سازد و یک بسته آماده نصب تولید می‌کند.

1. وارد تب **Actions** مخزن شوید.
2. آخرین اجرای موفق **Build cPanel Package** را باز کنید.
3. از بخش **Artifacts** فایل `kalameh-office-cpanel` را دانلود کنید.
4. محتویات فایل را در Document Root دامنه یا زیردامنه Extract کنید.
5. آدرس `/install.php` را باز کنید و نصب MySQL و حساب مدیر را انجام دهید.

هیچ Secret مربوط به Cloudflare لازم نیست. اطلاعات MySQL و مدیر فقط هنگام نصب در هاست وارد می‌شوند و نباید در GitHub ذخیره شوند.
