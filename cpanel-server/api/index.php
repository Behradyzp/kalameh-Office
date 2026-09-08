<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$path = parse_url((string)($_SERVER['REQUEST_URI'] ?? '/api'), PHP_URL_PATH) ?: '/api';
$apiPosition = strpos($path, '/api');
$route = $apiPosition === false ? '/' : substr($path, $apiPosition + 4);
$route = '/' . trim($route, '/');
$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));

if ($route === '/session') {
    require_method('GET');
    json_response(['user' => current_user($pdo)]);
}

if ($route === '/auth/login') {
    require_method('POST');
    require_same_origin();
    $body = request_json();
    $email = strtolower(trim((string)($body['email'] ?? '')));
    $password = (string)($body['password'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
        json_response(['error' => 'ایمیل یا رمز عبور صحیح نیست.'], 401);
    }
    $query = $pdo->prepare('SELECT id, email, name, role, password_hash FROM auth_users WHERE email = ? AND active = 1 LIMIT 1');
    $query->execute([$email]);
    $user = $query->fetch();
    if (!$user || !password_verify($password, (string)$user['password_hash'])) {
        audit($pdo, $user['id'] ?? null, 'login_failed', ['email' => $email]);
        usleep(250000);
        json_response(['error' => 'ایمیل یا رمز عبور صحیح نیست.'], 401);
    }
    session_regenerate_id(true);
    $_SESSION['user_id'] = $user['id'];
    $pdo->prepare('UPDATE auth_users SET last_seen_at = NOW() WHERE id = ?')->execute([$user['id']]);
    audit($pdo, $user['id'], 'login');
    unset($user['password_hash']);
    json_response(['user' => $user]);
}

if ($route === '/auth/logout') {
    require_method('POST');
    require_same_origin();
    $user = current_user($pdo);
    if ($user) audit($pdo, $user['id'], 'logout');
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', (bool)$params['secure'], (bool)$params['httponly']);
    }
    session_destroy();
    json_response(['ok' => true]);
}

if ($route === '/auth/users') {
    if ($method === 'GET') {
        require_admin($pdo);
        $users = $pdo->query('SELECT id, email, name, role, active, last_seen_at, created_at FROM auth_users ORDER BY created_at DESC')->fetchAll();
        json_response(['users' => $users]);
    }
    if ($method === 'DELETE') {
        require_same_origin();
        $admin = require_admin($pdo);
        $body = request_json();
        $email = strtolower(trim((string)($body['email'] ?? '')));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_response(['error' => 'ایمیل کاربر معتبر نیست.'], 422);
        if ($email === strtolower((string)$admin['email'])) json_response(['error' => 'حساب مدیر فعلی قابل حذف نیست.'], 422);
        $query = $pdo->prepare("UPDATE auth_users SET active = 0, updated_at = NOW() WHERE email = ? AND role <> 'admin'");
        $query->execute([$email]);
        audit($pdo, $admin['id'], 'user_deactivated', ['email' => $email]);
        json_response(['ok' => true]);
    }
    require_method('POST');
    require_same_origin();
    $admin = require_admin($pdo);
    $body = request_json();
    $name = trim((string)($body['name'] ?? ''));
    $email = strtolower(trim((string)($body['email'] ?? '')));
    $password = (string)($body['password'] ?? '');
    $role = ($body['role'] ?? '') === 'admin' ? 'admin' : 'member';
    if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
        json_response(['error' => 'نام، ایمیل معتبر و رمز حداقل ۸ کاراکتری الزامی است.'], 422);
    }
    try {
        $id = uuid_v4();
        $query = $pdo->prepare('INSERT INTO auth_users (id, email, name, role, password_hash, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())');
        $query->execute([$id, $email, $name, $role, password_hash($password, PASSWORD_DEFAULT)]);
        audit($pdo, $admin['id'], 'user_created', ['created_user_id' => $id, 'email' => $email]);
        json_response(['user' => ['id' => $id, 'email' => $email, 'name' => $name, 'role' => $role]], 201);
    } catch (PDOException $error) {
        if ((string)$error->getCode() === '23000') json_response(['error' => 'این ایمیل قبلاً ثبت شده است.'], 409);
        throw $error;
    }
}

if ($route === '/workspace') {
    $user = require_user($pdo);
    if ($method === 'GET') {
        $query = $pdo->prepare('SELECT data FROM workspace_state WHERE id = ? LIMIT 1');
        $query->execute(['main']);
        $row = $query->fetch();
        if (!$row) json_response(['data' => null]);
        $data = json_decode((string)$row['data'], true);
        json_response(['data' => is_array($data) ? filter_workspace($data, $user) : null]);
    }
    require_method('PUT');
    require_same_origin();
    $body = request_json();
    if (!isset($body['data']) || !is_array($body['data'])) json_response(['error' => 'اطلاعات نامعتبر است.'], 400);
    $pdo->beginTransaction();
    try {
        $query = $pdo->prepare('SELECT data FROM workspace_state WHERE id = ? FOR UPDATE');
        $query->execute(['main']);
        $row = $query->fetch();
        $next = $body['data'];
        if ($row) {
            $current = json_decode((string)$row['data'], true);
            $current = is_array($current) ? $current : [];
            $allowed = allowed_workspace_keys($current, (string)$user['email'], ($user['role'] ?? '') === 'admin');
            $next = $current;
            $changed = [];
            foreach ($body['data'] as $key => $value) {
                if (isset($allowed[$key])) {
                    $next[$key] = $value;
                    $changed[] = $key;
                }
            }
            if (($user['role'] ?? '') !== 'admin' && $changed) {
                $next['logs'] = array_merge([[
                    'id' => (int)round(microtime(true) * 1000),
                    'member' => $user['name'],
                    'action' => 'بخش‌های ' . implode('، ', $changed) . ' را به‌روزرسانی کرد',
                    'time' => gmdate('c'),
                ]], is_array($current['logs'] ?? null) ? $current['logs'] : []);
            }
        }
        $payload = json_encode($next, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        $save = $pdo->prepare('INSERT INTO workspace_state (id, data, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = NOW()');
        $save->execute(['main', $payload]);
        $pdo->commit();
        audit($pdo, $user['id'], 'workspace_updated');
        json_response(['ok' => true]);
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('Kalameh workspace save failed: ' . $error->getMessage());
        json_response(['error' => 'ذخیره اطلاعات انجام نشد.'], 503);
    }
}

if ($route === '/files') {
    $user = require_user($pdo);
    if ($method === 'POST') {
        require_same_origin();
        if (!isset($_FILES['file']) || !is_array($_FILES['file'])) json_response(['error' => 'فایل انتخاب نشده است.'], 400);
        $file = $_FILES['file'];
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) json_response(['error' => 'آپلود فایل انجام نشد.'], 400);
        if (($file['size'] ?? 0) > 20 * 1024 * 1024) json_response(['error' => 'حداکثر حجم فایل ۲۰ مگابایت است.'], 413);
        $uploadDirectory = STORAGE_PATH . '/uploads';
        if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0750, true) && !is_dir($uploadDirectory)) {
            json_response(['error' => 'فضای ذخیره فایل آماده نیست.'], 503);
        }
        $id = uuid_v4();
        $storedName = str_replace('-', '', $id) . '.bin';
        $target = $uploadDirectory . '/' . $storedName;
        if (!move_uploaded_file((string)$file['tmp_name'], $target)) json_response(['error' => 'ذخیره فایل انجام نشد.'], 503);
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($target) ?: 'application/octet-stream';
        $cleanName = basename((string)$file['name']);
        $originalName = function_exists('mb_substr') ? mb_substr($cleanName, 0, 240) : substr($cleanName, 0, 240);
        $query = $pdo->prepare('INSERT INTO file_records (id, owner_id, stored_name, original_name, mime_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())');
        $query->execute([$id, $user['id'], $storedName, $originalName, $mime, filesize($target)]);
        audit($pdo, $user['id'], 'file_uploaded', ['file_id' => $id, 'name' => $originalName]);
        json_response(['name' => $originalName, 'type' => $mime, 'url' => 'api/files?key=' . rawurlencode($id)], 201);
    }
    require_method('GET');
    $id = trim((string)($_GET['key'] ?? ''));
    $query = $pdo->prepare('SELECT stored_name, original_name, mime_type, size_bytes FROM file_records WHERE id = ? LIMIT 1');
    $query->execute([$id]);
    $file = $query->fetch();
    if (!$file) {
        http_response_code(404);
        exit('Not found');
    }
    $target = STORAGE_PATH . '/uploads/' . basename((string)$file['stored_name']);
    if (!is_file($target)) {
        http_response_code(404);
        exit('Not found');
    }
    header('Content-Type: ' . $file['mime_type']);
    header('Content-Length: ' . (string)$file['size_bytes']);
    header("Content-Disposition: inline; filename*=UTF-8''" . rawurlencode((string)$file['original_name']));
    header('X-Content-Type-Options: nosniff');
    readfile($target);
    exit;
}

json_response(['error' => 'مسیر پیدا نشد.'], 404);
