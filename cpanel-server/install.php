<?php
declare(strict_types=1);

$storage = __DIR__ . '/storage';
$configFile = $storage . '/config.php';
$installed = is_file($configFile);
$message = '';
$success = false;

if (!$installed && ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    $host = trim((string)($_POST['db_host'] ?? 'localhost'));
    $port = max(1, (int)($_POST['db_port'] ?? 3306));
    $name = trim((string)($_POST['db_name'] ?? ''));
    $user = trim((string)($_POST['db_user'] ?? ''));
    $password = (string)($_POST['db_password'] ?? '');
    $adminName = trim((string)($_POST['admin_name'] ?? ''));
    $adminEmail = strtolower(trim((string)($_POST['admin_email'] ?? '')));
    $adminPassword = (string)($_POST['admin_password'] ?? '');

    if ($host === '' || $name === '' || $user === '' || $adminName === '' || !filter_var($adminEmail, FILTER_VALIDATE_EMAIL) || strlen($adminPassword) < 8) {
        $message = 'همه فیلدها را کامل کنید؛ رمز مدیر باید حداقل ۸ کاراکتر باشد.';
    } else {
        try {
            if (!is_dir($storage) && !mkdir($storage, 0750, true) && !is_dir($storage)) {
                throw new RuntimeException('پوشه storage قابل ساخت نیست.');
            }
            $pdo = new PDO(
                sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $host, $port, $name),
                $user,
                $password,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]
            );
            $schema = [
                "CREATE TABLE IF NOT EXISTS auth_users (
                    id CHAR(36) PRIMARY KEY,
                    email VARCHAR(190) NOT NULL UNIQUE,
                    name VARCHAR(190) NOT NULL,
                    role ENUM('admin','member') NOT NULL DEFAULT 'member',
                    password_hash VARCHAR(255) NOT NULL,
                    active TINYINT(1) NOT NULL DEFAULT 1,
                    last_seen_at DATETIME NULL,
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME NOT NULL,
                    INDEX idx_auth_users_active (active),
                    INDEX idx_auth_users_last_seen (last_seen_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
                "CREATE TABLE IF NOT EXISTS workspace_state (
                    id VARCHAR(64) PRIMARY KEY,
                    data LONGTEXT NOT NULL,
                    updated_at DATETIME NOT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
                "CREATE TABLE IF NOT EXISTS file_records (
                    id CHAR(36) PRIMARY KEY,
                    owner_id CHAR(36) NOT NULL,
                    stored_name VARCHAR(96) NOT NULL UNIQUE,
                    original_name VARCHAR(255) NOT NULL,
                    mime_type VARCHAR(190) NOT NULL,
                    size_bytes BIGINT UNSIGNED NOT NULL,
                    created_at DATETIME NOT NULL,
                    INDEX idx_files_owner (owner_id),
                    CONSTRAINT fk_files_owner FOREIGN KEY (owner_id) REFERENCES auth_users(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
                "CREATE TABLE IF NOT EXISTS audit_logs (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    user_id CHAR(36) NULL,
                    action VARCHAR(100) NOT NULL,
                    metadata LONGTEXT NULL,
                    ip_address VARCHAR(45) NULL,
                    created_at DATETIME NOT NULL,
                    INDEX idx_audit_user (user_id),
                    INDEX idx_audit_created (created_at),
                    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE SET NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            ];
            foreach ($schema as $statement) $pdo->exec($statement);

            $adminId = sprintf(
                '%s%s-%s-%s-%s-%s%s%s',
                ...str_split(bin2hex(random_bytes(16)), 4)
            );
            $adminId[14] = '4';
            $variant = hexdec($adminId[19]);
            $adminId[19] = dechex(($variant & 0x3) | 0x8);
            $query = $pdo->prepare("INSERT INTO auth_users (id, email, name, role, password_hash, active, created_at, updated_at)
                VALUES (?, ?, ?, 'admin', ?, 1, NOW(), NOW())
                ON DUPLICATE KEY UPDATE name = VALUES(name), role = 'admin', password_hash = VALUES(password_hash), active = 1, updated_at = NOW()");
            $query->execute([$adminId, $adminEmail, $adminName, password_hash($adminPassword, PASSWORD_DEFAULT)]);

            $workspace = [
                'tasks' => [],
                'personalTasks' => [],
                'notifications' => [],
                'transactions' => [],
                'clients' => [],
                'leads' => [],
                'contracts' => [],
                'projects' => [],
                'members' => [[
                    'id' => 1,
                    'name' => $adminName,
                    'email' => $adminEmail,
                    'role' => 'مدیر کل',
                    'status' => 'فعال',
                    'permissions' => ['همه بخش‌ها'],
                ]],
                'chats' => [],
                'letters' => [],
                'attendance' => [],
                'leaves' => [],
                'logs' => [],
                'events' => [],
                'preferences' => [
                    'fontScale' => 1,
                    'theme' => 'blue',
                    'labels' => [
                        'tasks' => ['سئو', 'فنی', 'طراحی', 'گزارش', 'عمومی'],
                        'clients' => ['سئو سایت', 'طراحی سایت', 'گرافیک', 'تولید محتوا'],
                        'leads' => ['سئو سایت', 'طراحی سایت', 'کمپین تبلیغاتی', 'شبکه‌های اجتماعی'],
                    ],
                ],
            ];
            $workspaceQuery = $pdo->prepare('INSERT INTO workspace_state (id, data, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE id = id');
            $workspaceQuery->execute(['main', json_encode($workspace, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR)]);

            $config = [
                'db' => [
                    'host' => $host,
                    'port' => $port,
                    'name' => $name,
                    'user' => $user,
                    'password' => $password,
                ],
                'installed_at' => gmdate('c'),
            ];
            $contents = "<?php\ndeclare(strict_types=1);\nreturn " . var_export($config, true) . ";\n";
            $temporary = $configFile . '.tmp';
            if (file_put_contents($temporary, $contents, LOCK_EX) === false || !rename($temporary, $configFile)) {
                throw new RuntimeException('فایل تنظیمات قابل ذخیره نیست. سطح دسترسی پوشه storage را بررسی کنید.');
            }
            @chmod($configFile, 0600);
            if (!is_dir($storage . '/uploads')) mkdir($storage . '/uploads', 0750, true);
            $success = true;
            $installed = true;
            $message = 'نصب با موفقیت انجام شد. اکنون می‌توانید وارد سامانه شوید.';
        } catch (Throwable $error) {
            error_log('Kalameh installation failed: ' . $error->getMessage());
            $message = 'نصب انجام نشد: ' . htmlspecialchars($error->getMessage(), ENT_QUOTES, 'UTF-8');
        }
    }
}
?>
<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>نصب دفتر کلمه</title>
  <style>
    @font-face{font-family:Vazirmatn;src:local("Vazirmatn")}*{box-sizing:border-box}body{margin:0;background:#f3f6fc;color:#182034;font-family:Vazirmatn,Tahoma,sans-serif;min-height:100vh;display:grid;place-items:center;padding:24px}.card{width:min(760px,100%);background:#fff;border:1px solid #dce3ef;border-radius:22px;box-shadow:0 20px 60px #13275b14;overflow:hidden}.head{padding:28px 32px;background:linear-gradient(135deg,#012bf9,#1748ff);color:#fff}.head h1{margin:0 0 7px;font-size:26px}.head p{margin:0;opacity:.82}.body{padding:28px 32px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.field{display:grid;gap:7px}.wide{grid-column:1/-1}label{font-size:14px;font-weight:700}input{width:100%;height:46px;border:1px solid #ced8e8;border-radius:11px;padding:0 13px;font:inherit;outline:none}input:focus{border-color:#012bf9;box-shadow:0 0 0 3px #012bf918}.actions{display:flex;align-items:center;justify-content:space-between;margin-top:24px;gap:16px}button,.button{border:0;border-radius:11px;background:#012bf9;color:#fff;padding:12px 22px;font:700 15px inherit;cursor:pointer;text-decoration:none}.message{margin:0 0 22px;padding:13px 15px;border-radius:11px;background:#fff3cd;color:#725700}.message.ok{background:#e8f8ef;color:#126236}.hint{font-size:13px;color:#6f7d92;margin:18px 0 0}@media(max-width:620px){.grid{grid-template-columns:1fr}.wide{grid-column:auto}.head,.body{padding:22px}.actions{align-items:stretch;flex-direction:column}}
  </style>
</head>
<body>
<main class="card">
  <header class="head"><h1>نصب دفتر کلمه</h1><p>اتصال MySQL و ساخت حساب مدیر کل</p></header>
  <section class="body">
    <?php if ($message): ?><div class="message <?= $success ? 'ok' : '' ?>"><?= $message ?></div><?php endif; ?>
    <?php if ($installed): ?>
      <div class="actions"><strong>سامانه نصب شده است.</strong><a class="button" href="./">ورود به سامانه</a></div>
      <p class="hint">برای امنیت بیشتر، فایل install.php را بعد از ورود حذف کنید.</p>
    <?php else: ?>
    <form method="post" autocomplete="off">
      <div class="grid">
        <div class="field"><label for="db_host">میزبان دیتابیس</label><input id="db_host" name="db_host" value="localhost" required></div>
        <div class="field"><label for="db_port">پورت دیتابیس</label><input id="db_port" name="db_port" inputmode="numeric" value="3306" required></div>
        <div class="field"><label for="db_name">نام دیتابیس</label><input id="db_name" name="db_name" required></div>
        <div class="field"><label for="db_user">نام کاربری دیتابیس</label><input id="db_user" name="db_user" required></div>
        <div class="field wide"><label for="db_password">رمز دیتابیس</label><input id="db_password" name="db_password" type="password"></div>
        <div class="field"><label for="admin_name">نام مدیر کل</label><input id="admin_name" name="admin_name" required></div>
        <div class="field"><label for="admin_email">ایمیل مدیر کل</label><input id="admin_email" name="admin_email" type="email" required></div>
        <div class="field wide"><label for="admin_password">رمز مدیر کل</label><input id="admin_password" name="admin_password" type="password" minlength="8" required></div>
      </div>
      <div class="actions"><span class="hint">اطلاعات فقط روی هاست شما ذخیره می‌شود.</span><button type="submit">نصب سامانه</button></div>
    </form>
    <?php endif; ?>
  </section>
</main>
</body>
</html>
