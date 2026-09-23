<?php

require 'helpers.php';

requireMethod('POST');
requireLogin();

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$name = trim($input['name'] ?? '');
$phone = trim($input['phone'] ?? '');
$email = trim($input['email'] ?? '');
$address = trim($input['address'] ?? '');
$notes = trim($input['notes'] ?? '');

if ($name === '') {
    sendJson(['error' => 'name is required'], 400);
}

sendJson([
    'message' => 'contact create endpoint ready',
    'database' => 'not connected yet'
], 501);