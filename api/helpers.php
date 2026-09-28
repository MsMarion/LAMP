<?php

header('Content-Type: application/json');

require_once __DIR__ . '/config.php';


function sendJson($data, $status = 200)
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}


function requireMethod($method)
{
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        sendJson([
            'success' => false,
            'error' => 'Method not allowed'
        ], 405);
    }
}


function startSessionIfNeeded()
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}


function requireLogin()
{
    global $pdo;

    startSessionIfNeeded();

    if (!isset($_SESSION['user_id'])) {
        sendJson([
            'success' => false,
            'error' => 'Not authenticated'
        ], 401);
    }

    /*
     * Re-check the database on authenticated requests.
     *
     * This prevents a disabled user from continuing to use an
     * existing session after an administrator disables the account.
     */
    $stmt = $pdo->prepare(
        "SELECT
            id,
            username,
            full_name,
            role,
            is_disabled
         FROM users
         WHERE id = ?
         LIMIT 1"
    );

    $stmt->execute([
        (int)$_SESSION['user_id']
    ]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        $_SESSION = [];
        session_destroy();

        sendJson([
            'success' => false,
            'error' => 'User account no longer exists'
        ], 401);
    }

    if ((int)$user['is_disabled'] === 1) {
        $_SESSION = [];
        session_destroy();

        sendJson([
            'success' => false,
            'error' => 'Account disabled. Contact an administrator.'
        ], 403);
    }

    /*
     * Keep the session synchronized with the database.
     */
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['role'] = $user['role'];

    return $user;
}


function requireAdmin()
{
    $user = requireLogin();

    if ($user['role'] !== 'admin') {
        sendJson([
            'success' => false,
            'error' => 'Admin access required'
        ], 403);
    }

    return $user;
}