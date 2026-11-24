<?php
declare(strict_types=1);

namespace NaveStar\Security;

final class Csrf
{
    private const SESSION_KEY = 'csrf_token';

    public static function token(): string
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            throw new \RuntimeException('Sessão não iniciada.');
        }
        $token = $_SESSION[self::SESSION_KEY] ?? null;
        if (!is_string($token) || !preg_match('/^[a-f0-9]{64}$/D', $token)) {
            $token = bin2hex(random_bytes(32));
            $_SESSION[self::SESSION_KEY] = $token;
        }

        return $token;
    }

    public static function isValid(?string $token): bool
    {
        $expected = $_SESSION[self::SESSION_KEY] ?? null;
        return is_string($expected)
            && preg_match('/^[a-f0-9]{64}$/D', $expected) === 1
            && is_string($token)
            && $token !== ''
            && hash_equals($expected, $token);
    }

    public static function enforce(?string $token): void
    {
        if (self::isValid($token)) return;

        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Token de segurança inválido.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function validateRequest(): void
    {
        self::enforce($_SERVER['HTTP_X_CSRF_TOKEN'] ?? null);
    }
}
