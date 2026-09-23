<?php

header('Content-Type: application/json');

function sendJson($data, $status = 200)
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function requireMethod($method)
{
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        sendJson(['error' => 'Method not allowed'], 405);
    }
}

function requireLogin()
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    if (!isset($_SESSION['user_id'])) {
        sendJson(['error' => 'Not authenticated'], 401);
    }
}

function requireAdmin()
{
    requireLogin();

    if (($_SESSION['role'] ?? '') !== 'admin') {
        sendJson(['error' => 'Admin access required'], 403);
    }
}