<?php
declare(strict_types=1);

function callSocketBase64Url(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function callSocketIssueToken(int $userId, int $ttl = 90): string
{
    $config = require __DIR__ . '/call-socket-config.php';
    $payload = callSocketBase64Url(json_encode(['uid'=>$userId,'exp'=>time()+$ttl], JSON_THROW_ON_ERROR));
    $signature = callSocketBase64Url(hash_hmac('sha256', $payload, $config['secret'], true));
    return $payload . '.' . $signature;
}

function callSocketVerifyToken(string $token): int
{
    $parts = explode('.', $token, 2);
    if (count($parts) !== 2) return 0;
    [$payload, $signature] = $parts;
    $config = require __DIR__ . '/call-socket-config.php';
    $expected = callSocketBase64Url(hash_hmac('sha256', $payload, $config['secret'], true));
    if (!hash_equals($expected, $signature)) return 0;
    $decoded = base64_decode(strtr($payload, '-_', '+/') . str_repeat('=', (4 - strlen($payload) % 4) % 4), true);
    $claims = $decoded === false ? null : json_decode($decoded, true);
    if (!is_array($claims) || (int)($claims['exp'] ?? 0) < time()) return 0;
    return max(0, (int)($claims['uid'] ?? 0));
}
