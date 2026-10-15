<?php
declare(strict_types=1);

/** Send HTML mail via configured SMTP; uses PHPMailer when installed in the app. */
function gameSendMail(string $to, string $subject, string $html): bool
{
    $configPath = __DIR__ . '/config.php';
    $config = is_file($configPath) ? require $configPath : [];
    $mail = $config['mail'] ?? [];
    $from = trim((string)(getenv('GAME_MAIL_FROM') ?: ($mail['from'] ?? '')));
    $fromName = trim((string)(getenv('GAME_MAIL_FROM_NAME') ?: ($mail['from_name'] ?? 'NAVE - Explorador espacial')));
    $host = trim((string)(getenv('GAME_SMTP_HOST') ?: ($mail['smtp_host'] ?? '')));
    $username = (string)(getenv('GAME_SMTP_USER') ?: ($mail['smtp_user'] ?? ''));
    $password = (string)(getenv('GAME_SMTP_PASS') ?: ($mail['smtp_password'] ?? ''));
    $port = (int)(getenv('GAME_SMTP_PORT') ?: ($mail['smtp_port'] ?? 587));
    $secure = strtolower(trim((string)(getenv('GAME_SMTP_SECURE') ?: ($mail['smtp_secure'] ?? 'tls'))));
    $autoload = __DIR__ . '/vendor/autoload.php';

    if ($host === '' || $username === '' || $password === '' || !filter_var($from, FILTER_VALIDATE_EMAIL) || !is_file($autoload)) {
        error_log('E-mail NAVE nao enviado: configure GAME_SMTP_HOST, GAME_SMTP_USER, GAME_SMTP_PASS, GAME_MAIL_FROM e instale PHPMailer em vendor/.');
        return false;
    }

    require_once $autoload;
    if (!class_exists(\PHPMailer\PHPMailer\PHPMailer::class)) {
        error_log('E-mail NAVE nao enviado: PHPMailer nao encontrado no autoload da aplicacao.');
        return false;
    }
    try {
        $mailer = new \PHPMailer\PHPMailer\PHPMailer(true);
        $mailer->isSMTP();
        $mailer->Host = $host;
        $mailer->SMTPAuth = true;
        $mailer->Username = $username;
        $mailer->Password = $password;
        $mailer->Port = $port;
        if ($secure === 'ssl' || $secure === 'smtps') $mailer->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
        elseif ($secure === 'tls' || $secure === 'starttls') $mailer->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        else $mailer->SMTPSecure = '';
        $mailer->CharSet = 'UTF-8';
        $mailer->setFrom($from, $fromName);
        $mailer->addAddress($to);
        $mailer->isHTML(true);
        $mailer->Subject = $subject;
        $mailer->Body = $html;
        $mailer->AltBody = trim(preg_replace('/\s+/', ' ', strip_tags(str_replace(['</p>', '</div>', '<br>', '<br/>'], "\n", $html))) ?? '');
        return $mailer->send();
    } catch (Throwable $exception) {
        error_log('Falha no SMTP do NAVE: ' . $exception->getMessage());
        return false;
    }
}
