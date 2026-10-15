<?php
declare(strict_types=1);

/**
 * Configuration de exemplo para desenvolvimento local com XAMPP.
 * Copie este arquivo para config.php e ajuste os dados do seu ambiente.
 */
return [
    'database' => [
        'host' => 'localhost',
        'name' => 'nave',
        'user' => 'root',
        'password' => '',
        'charset' => 'utf8mb4',
    ],
    // Configure pelo ambiente GAME_SMTP_* em produção para não versionar credenciais.
    'mail' => [
        'from' => '',
        'from_name' => 'NAVE - Explorador espacial',
        'smtp_host' => '',
        'smtp_port' => 587,
        'smtp_secure' => 'tls', // tls (STARTTLS), ssl (SMTPS) ou none
        'smtp_user' => '',
        'smtp_password' => '',
    ],
];
