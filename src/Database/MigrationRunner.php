<?php
declare(strict_types=1);

namespace NaveStar\Database;

use PDO;
use RuntimeException;

final class MigrationRunner
{
    private const LOCK_NAME = 'navestar_schema_migrations_v1';
    private PDO $pdo;
    private string $directory;

    public function __construct(PDO $pdo, string $directory)
    {
        $this->pdo = $pdo;
        $this->directory = $directory;
    }

    public function run(string $command): array
    {
        if (!in_array($command, ['migrate', 'baseline-legacy', 'status'], true)) {
            throw new RuntimeException('Use migrate, baseline-legacy ou status.');
        }

        // Status is read-only: it must not create schema_migrations in the live database.
        if ($command === 'status') {
            $migrations = $this->migrations();
            $applied = $this->ledgerExists() ? $this->applied() : [];
            return $this->status($migrations, $applied);
        }

        $lock = $this->pdo->query("SELECT GET_LOCK(" . $this->pdo->quote(self::LOCK_NAME) . ", 30)")->fetchColumn();
        if ((int) $lock !== 1) throw new RuntimeException('Não foi possível obter o bloqueio de migração.');

        try {
            $this->createLedger();
            $migrations = $this->migrations();
            $applied = $this->applied();

            if ($command === 'baseline-legacy') return $this->baseline($migrations, $applied);

            $untrackedHistory = array_filter($migrations, static fn(array $migration): bool =>
                strpos($migration['version'], '20261123_runtime_') !== 0 && !isset($applied[$migration['version']])
            );
            if ($untrackedHistory) {
                throw new RuntimeException('Migrações históricas sem registro. Em banco existente, valide o esquema e execute: php bin/migrate.php baseline-legacy');
            }

            $done = [];
            foreach ($migrations as $migration) {
                $version = $migration['version'];
                $checksum = hash_file('sha256', $migration['path']);
                if (isset($applied[$version])) {
                    if (!hash_equals($applied[$version], $checksum)) throw new RuntimeException('Checksum alterado em migração aplicada: ' . $version);
                    continue;
                }
                $this->execute($migration['path']);
                $this->record($version, $checksum);
                $done[] = $version;
            }
            return $done;
        } finally {
            $this->pdo->query("SELECT RELEASE_LOCK(" . $this->pdo->quote(self::LOCK_NAME) . ")");
        }
    }

    private function createLedger(): void
    {
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS schema_migrations (
            version VARCHAR(191) NOT NULL,
            checksum CHAR(64) NOT NULL,
            applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (version)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    }

    private function ledgerExists(): bool
    {
        $query = $this->pdo->prepare('SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?');
        $query->execute(['schema_migrations']);
        return (bool) $query->fetchColumn();
    }

    private function migrations(): array
    {
        $files = array_merge(glob($this->directory . DIRECTORY_SEPARATOR . '*.sql') ?: [], glob($this->directory . DIRECTORY_SEPARATOR . '*.php') ?: []);
        sort($files, SORT_STRING);
        return array_map(static fn(string $path): array => ['version' => basename($path), 'path' => $path], $files);
    }

    private function applied(): array
    {
        $rows = $this->pdo->query('SELECT version,checksum FROM schema_migrations ORDER BY version')->fetchAll(PDO::FETCH_ASSOC);
        $applied = [];
        foreach ($rows as $row) $applied[(string) $row['version']] = (string) $row['checksum'];
        return $applied;
    }

    private function status(array $migrations, array $applied): array
    {
        $result = [];
        foreach ($migrations as $migration) {
            $version = $migration['version'];
            $checksum = hash_file('sha256', $migration['path']);
            $result[] = [
                'version' => $version,
                'state' => !isset($applied[$version]) ? 'pendente' : (hash_equals($applied[$version], $checksum) ? 'aplicada' : 'checksum divergente')
            ];
        }
        return $result;
    }

    private function baseline(array $migrations, array $applied): array
    {
        foreach (['users', 'ships', 'space_stations', 'ship_wrecks'] as $table) {
            $query = $this->pdo->prepare('SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?');
            $query->execute([$table]);
            if (!$query->fetchColumn()) throw new RuntimeException('Banco sem a tabela base ' . $table . '; importe database/schema.sql antes de adotar o histórico.');
        }

        $done = [];
        foreach ($migrations as $migration) {
            if (strpos($migration['version'], '20261123_runtime_') === 0 || isset($applied[$migration['version']])) continue;
            $this->record($migration['version'], hash_file('sha256', $migration['path']));
            $done[] = $migration['version'];
        }
        return $done;
    }

    private function record(string $version, string $checksum): void
    {
        $query = $this->pdo->prepare('INSERT INTO schema_migrations (version,checksum) VALUES (?,?)');
        $query->execute([$version, $checksum]);
    }

    private function execute(string $path): void
    {
        if (strtolower(pathinfo($path, PATHINFO_EXTENSION)) === 'php') {
            $migration = require $path;
            if (!is_callable($migration)) throw new RuntimeException('Migração PHP deve retornar uma função: ' . basename($path));
            $migration($this->pdo);
            return;
        }

        $sql = file_get_contents($path);
        if (!is_string($sql)) throw new RuntimeException('Não foi possível ler ' . basename($path));
        if (preg_match('/^\s*DELIMITER\s|CREATE\s+(PROCEDURE|FUNCTION|TRIGGER|EVENT)\b/im', $sql)) {
            throw new RuntimeException('Migração com rotina SQL não suportada pelo parser: ' . basename($path));
        }
        foreach ($this->splitSql($sql) as $statement) $this->pdo->exec($statement);
    }

    private function splitSql(string $sql): array
    {
        $statements = [];
        $buffer = '';
        $quote = null;
        $lineComment = false;
        $blockComment = false;
        $length = strlen($sql);
        for ($i = 0; $i < $length; $i++) {
            $char = $sql[$i];
            $next = $i + 1 < $length ? $sql[$i + 1] : '';
            if ($lineComment) { if ($char === "\n") { $lineComment = false; $buffer .= "\n"; } continue; }
            if ($blockComment) { if ($char === '*' && $next === '/') { $blockComment = false; $i++; } continue; }
            if ($quote !== null) {
                $buffer .= $char;
                if ($char === '\\' && $quote !== '`' && $next !== '') { $buffer .= $next; $i++; continue; }
                if ($char === $quote) {
                    if ($next === $quote) { $buffer .= $next; $i++; continue; }
                    $quote = null;
                }
                continue;
            }
            if ($char === '/' && $next === '*') { $blockComment = true; $i++; continue; }
            if ($char === '#' || ($char === '-' && $next === '-' && ($i + 2 >= $length || ctype_space($sql[$i + 2])))) { $lineComment = true; if ($char === '-') $i++; continue; }
            if ($char === "'" || $char === '"' || $char === '`') { $quote = $char; $buffer .= $char; continue; }
            if ($char === ';') { if (trim($buffer) !== '') $statements[] = trim($buffer); $buffer = ''; continue; }
            $buffer .= $char;
        }
        if ($quote !== null || $blockComment) throw new RuntimeException('Migração SQL termina com string ou comentário sem fechar.');
        if (trim($buffer) !== '') $statements[] = trim($buffer);
        return $statements;
    }
}
