<?php
declare(strict_types=1);

require_once __DIR__ . '/src/Storage/PrivateStorage.php';

function voiceMessageStorageRoot(): string
{
    return \NaveStar\Storage\PrivateStorage::directory('voice-messages');
}

function voiceMessageAbsolutePath(string $relativePath): ?string
{
    if (!preg_match('#^(\d{4}-\d{2}-\d{2})/([a-f0-9]{32}\.(webm|ogg|m4a|wav))$#i', $relativePath, $matches)) {
        return null;
    }
    $root = voiceMessageStorageRoot();
    $directory = $root . DIRECTORY_SEPARATOR . $matches[1];
    if (is_link($directory)) return null;
    $realRoot = realpath($root);
    $realDirectory = realpath($directory);
    if ($realRoot === false || $realDirectory === false || dirname($realDirectory) !== $realRoot) return null;
    $path = $realDirectory . DIRECTORY_SEPARATOR . $matches[2];
    if (is_link($path)) return null;
    $realPath = realpath($path);
    if ($realPath !== false && dirname($realPath) !== $realDirectory) return null;
    return $path;
}

function cleanupExpiredVoiceMessages(PDO $pdo, bool $force = false): void
{
    $root = voiceMessageStorageRoot();
    if (is_link($root)) return;
    if (!is_dir($root) && !@mkdir($root, 0770, true) && !is_dir($root)) return;
    $lockPath = $root . DIRECTORY_SEPARATOR . '.cleanup.lock';
    if (is_link($lockPath)) return;
    $lock = @fopen($lockPath, 'c');
    if ($lock === false) return;
    try {
        if (!flock($lock, LOCK_EX)) return;
        $marker = $root . DIRECTORY_SEPARATOR . '.last-cleanup';
        if (!$force && is_file($marker) && (time() - (int)@filemtime($marker)) < 3600) return;

        $expired = $pdo->query("SELECT storage_path FROM voice_messages WHERE created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)")->fetchAll(PDO::FETCH_COLUMN);
        foreach ($expired as $relativePath) {
            $absolutePath = voiceMessageAbsolutePath((string)$relativePath);
            if ($absolutePath !== null && is_file($absolutePath)) @unlink($absolutePath);
        }
        $pdo->exec("DELETE FROM voice_messages WHERE created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)");

        $cutoff = time() - 86400;
        foreach (glob($root . DIRECTORY_SEPARATOR . '*', GLOB_ONLYDIR) ?: [] as $directory) {
            if (is_link($directory)) continue;
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', basename($directory))) continue;
            foreach (glob($directory . DIRECTORY_SEPARATOR . '*') ?: [] as $file) {
                if (!is_link($file) && is_file($file) && (int)@filemtime($file) < $cutoff) @unlink($file);
            }
            $remaining = glob($directory . DIRECTORY_SEPARATOR . '*');
            if ($remaining !== false && !$remaining) @rmdir($directory);
        }
        @touch($marker);
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}
