<?php
declare(strict_types=1);

const STORAGE_PATH = __DIR__ . '/../storage';
const CONFIG_PATH = STORAGE_PATH . '/config.php';

function json_response(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (!is_file(CONFIG_PATH)) {
    json_response(['error' => 'سامانه هنوز نصب نشده است.', 'install' => '../install.php'], 503);
}

$config = require CONFIG_PATH;
if (!is_array($config) || empty($config['db'])) {
    json_response(['error' => 'تنظیمات سامانه معتبر نیست.'], 500);
}

$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || strtolower((string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';

ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
session_name('kalameh_session');
session_set_cookie_params([
    'lifetime' => 60 * 60 * 24 * 30,
    'path' => '/',
    'secure' => $secure,
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

try {
    $db = $config['db'];
    $pdo = new PDO(
        sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $db['host'], $db['port'] ?? 3306, $db['name']),
        $db['user'],
        $db['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (Throwable $error) {
    error_log('Kalameh database connection failed: ' . $error->getMessage());
    json_response(['error' => 'اتصال به پایگاه داده برقرار نشد.'], 503);
}

function request_json(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') return [];
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) json_response(['error' => 'درخواست نامعتبر است.'], 400);
    return $decoded;
}

function require_method(string ...$methods): void
{
    $method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    if (!in_array($method, $methods, true)) {
        header('Allow: ' . implode(', ', $methods));
        json_response(['error' => 'متد درخواست مجاز نیست.'], 405);
    }
}

function require_same_origin(): void
{
    $origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($origin === '') return;
    $originHost = parse_url($origin, PHP_URL_HOST);
    $requestHost = preg_replace('/:\d+$/', '', (string)($_SERVER['HTTP_HOST'] ?? ''));
    if (!$originHost || !hash_equals(strtolower($requestHost), strtolower((string)$originHost))) {
        json_response(['error' => 'درخواست از مبدأ نامعتبر ارسال شده است.'], 403);
    }
}

function uuid_v4(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
}

function current_user(PDO $pdo): ?array
{
    $id = $_SESSION['user_id'] ?? null;
    if (!is_string($id) || $id === '') return null;
    $query = $pdo->prepare('SELECT id, email, name, role FROM auth_users WHERE id = ? AND active = 1 LIMIT 1');
    $query->execute([$id]);
    $user = $query->fetch();
    if (!$user) {
        $_SESSION = [];
        return null;
    }
    $pdo->prepare('UPDATE auth_users SET last_seen_at = NOW() WHERE id = ?')->execute([$id]);
    return $user;
}

function require_user(PDO $pdo): array
{
    $user = current_user($pdo);
    if (!$user) json_response(['error' => 'ابتدا وارد حساب شوید.'], 401);
    return $user;
}

function require_admin(PDO $pdo): array
{
    $user = require_user($pdo);
    if (($user['role'] ?? '') !== 'admin') json_response(['error' => 'فقط مدیر کل به این بخش دسترسی دارد.'], 403);
    return $user;
}

function audit(PDO $pdo, ?string $userId, string $action, array $meta = []): void
{
    try {
        $query = $pdo->prepare('INSERT INTO audit_logs (user_id, action, metadata, ip_address, created_at) VALUES (?, ?, ?, ?, NOW())');
        $query->execute([$userId, $action, json_encode($meta, JSON_UNESCAPED_UNICODE), substr((string)($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45)]);
    } catch (Throwable $error) {
        error_log('Kalameh audit write failed: ' . $error->getMessage());
    }
}

function permission_keys(): array
{
    return [
        'پروژه‌ها' => ['projects'],
        'وظایف' => ['tasks', 'personalTasks'],
        'مالی' => ['transactions'],
        'مشتریان' => ['clients'],
        'لیدها' => ['leads'],
        'قراردادها' => ['contracts'],
        'اعضای تیم' => [],
        'پیام‌ها' => ['chats'],
        'نامه‌ها' => ['letters'],
        'تقویم' => ['events'],
        'تنظیمات' => ['preferences'],
    ];
}

function allowed_workspace_keys(array $data, string $email, bool $admin): array
{
    if ($admin) return array_fill_keys(array_keys($data), true);
    $allowed = array_fill_keys(['attendance', 'leaves', 'notifications'], true);
    $member = null;
    foreach (($data['members'] ?? []) as $candidate) {
        if (strtolower((string)($candidate['email'] ?? '')) === strtolower($email)) $member = $candidate;
    }
    foreach (($member['permissions'] ?? []) as $permission) {
        foreach ((permission_keys()[$permission] ?? []) as $key) $allowed[$key] = true;
    }
    return $allowed;
}

function filter_workspace(array $data, array $user): array
{
    if (($user['role'] ?? '') === 'admin') return $data;
    $allowed = allowed_workspace_keys($data, (string)$user['email'], false);
    $member = null;
    foreach (($data['members'] ?? []) as $candidate) {
        if (strtolower((string)($candidate['email'] ?? '')) === strtolower((string)$user['email'])) $member = $candidate;
    }
    $memberId = $member['id'] ?? null;
    $visibleProjects = array_values(array_filter($data['projects'] ?? [], static function ($project) use ($memberId) {
        $owner = $project['ownerId'] ?? null;
        $members = $project['memberIds'] ?? [];
        return !$owner || $owner === $memberId || in_array($memberId, is_array($members) ? $members : [], true);
    }));
    $projectNames = array_fill_keys(array_map(static fn($project) => (string)($project['title'] ?? ''), $visibleProjects), true);
    $visibleTasks = array_values(array_filter($data['tasks'] ?? [], static fn($task) => isset($projectNames[(string)($task['project'] ?? '')])));
    $result = $data;
    foreach ($result as $key => $value) {
        if ($key === 'members') {
            $result[$key] = array_map(static function ($candidate) use ($user) {
                return strtolower((string)($candidate['email'] ?? '')) === strtolower((string)$user['email'])
                    ? $candidate : array_merge($candidate, ['permissions' => []]);
            }, is_array($value) ? $value : []);
        } elseif ($key === 'projects') {
            $result[$key] = isset($allowed[$key]) ? $visibleProjects : [];
        } elseif ($key === 'tasks') {
            $result[$key] = isset($allowed[$key]) ? $visibleTasks : [];
        } elseif (!isset($allowed[$key])) {
            $result[$key] = is_array($value) ? [] : $value;
        }
    }
    return $result;
}
