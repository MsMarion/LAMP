<?php

require 'helpers.php';

requireMethod('POST');
requireAdmin();

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$username = trim($input['username'] ?? '');
$password = $input['password'] ?? '';
$role = trim($input['role'] ?? '');

if ($username === '' || $password === '' || $role === '') {
    sendJson(['error' => 'username, password, and role are required'], 400);
}

if (!in_array($role, ['admin', 'user'], true)) {
    sendJson(['error' => 'invalid role'], 400);
}

sendJson([
    'message' => 'admin create user endpoint ready',
    'database' => 'not connected yet'
], 501);