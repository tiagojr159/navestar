<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/Security/Csrf.php';

function csrfCheck(bool $condition, string $message): void
{
    if (!$condition) throw new RuntimeException($message);
}

session_save_path(__DIR__);
session_start();
$_SESSION['csrf_token'] = 'invalid';
$token = \NaveStar\Security\Csrf::token();
csrfCheck((bool) preg_match('/^[a-f0-9]{64}$/D', $token), 'Create a correctly formatted session token');
csrfCheck(\NaveStar\Security\Csrf::isValid($token), 'Accept the token from this session');
csrfCheck(!\NaveStar\Security\Csrf::isValid(null), 'Reject a missing token');
csrfCheck(!\NaveStar\Security\Csrf::isValid(str_repeat('0', 64)), 'Reject a token from another session');

$_SESSION['csrf_token'] = str_repeat('b', 64);
csrfCheck(!\NaveStar\Security\Csrf::isValid($token), 'Reject the previous token after session rotation');

session_destroy();
echo "CSRF: token format and session binding passed.\n";
