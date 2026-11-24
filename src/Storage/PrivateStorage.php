<?php
declare(strict_types=1);

namespace NaveStar\Storage;

use RuntimeException;

final class PrivateStorage
{
    public static function root(): string
    {
        $configured = getenv('NAVE_STORAGE_PATH');
        $path = is_string($configured) && trim($configured) !== '' ? trim($configured) : dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'data';
        $absolute = preg_match('/^(?:[A-Za-z]:[\\\\\/]|[\\\\\/]{1,2})/', $path) === 1;
        if (!$absolute) throw new RuntimeException('NAVE_STORAGE_PATH deve ser um caminho absoluto.');
        if (is_link($path)) throw new RuntimeException('O armazenamento privado não pode ser um link simbólico.');
        if (!is_dir($path) && !@mkdir($path, 0770, true) && !is_dir($path)) throw new RuntimeException('Não foi possível preparar o armazenamento privado.');
        $real = realpath($path);
        if ($real === false || !is_dir($real)) throw new RuntimeException('O caminho de armazenamento privado não está disponível.');
        return rtrim($real, DIRECTORY_SEPARATOR);
    }

    public static function directory(string $name): string
    {
        if (!preg_match('/^[A-Za-z0-9_-]+$/D', $name)) throw new RuntimeException('Diretório de armazenamento inválido.');
        $root = self::root();
        $path = $root . DIRECTORY_SEPARATOR . $name;
        if (is_link($path)) throw new RuntimeException('O armazenamento não pode seguir links simbólicos.');
        if (!is_dir($path) && !@mkdir($path, 0770, true) && !is_dir($path)) throw new RuntimeException('Não foi possível preparar o armazenamento privado.');
        $real = realpath($path);
        if ($real === false || dirname($real) !== $root) throw new RuntimeException('O caminho de armazenamento está fora da raiz privada.');
        return $real;
    }
}
