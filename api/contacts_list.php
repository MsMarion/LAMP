<?php

require 'helpers.php';

requireMethod('GET');
requireLogin();

$q = trim($_GET['q'] ?? '');

sendJson([
    'message' => 'contact search endpoint ready',
    'query' => $q,
    'database' => 'not connected yet'
], 501);