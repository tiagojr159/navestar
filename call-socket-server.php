<?php
declare(strict_types=1);

// Execute em processo persistente: php call-socket-server.php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/database/connection.php';
require_once __DIR__ . '/call-socket-auth.php';

$config = require __DIR__ . '/call-socket-config.php';
$server = stream_socket_server('tcp://0.0.0.0:' . $config['port'], $errno, $error, STREAM_SERVER_BIND | STREAM_SERVER_LISTEN);
if (!$server) { fwrite(STDERR, "WebSocket indisponível: {$error} ({$errno})\n"); exit(1); }
stream_set_blocking($server, false);
fwrite(STDOUT, "Sinalização de chamadas ativa na porta {$config['port']}\n");
$clients = []; $db = db(); $lastSweep = 0;

function wsSend($client, array $message): void {
    $payload = json_encode($message, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($payload === false) return;
    $length = strlen($payload); $frame = chr(0x81);
    if ($length < 126) $frame .= chr($length);
    elseif ($length <= 65535) $frame .= chr(126) . pack('n', $length);
    else $frame .= chr(127) . pack('NN', 0, $length);
    @fwrite($client, $frame . $payload);
}
function wsReadFrame(string &$buffer): ?array {
    if (strlen($buffer) < 2) return null;
    $a = ord($buffer[0]); $b = ord($buffer[1]); $length = $b & 127; $offset = 2;
    if ($length === 126) { if (strlen($buffer) < 4) return null; $length = unpack('n', substr($buffer, 2, 2))[1]; $offset = 4; }
    elseif ($length === 127) { if (strlen($buffer) < 10) return null; $parts = unpack('Nhigh/Nlow', substr($buffer, 2, 8)); $length = $parts['low']; $offset = 10; }
    $masked = ($b & 128) !== 0; $mask = '';
    if ($masked) { if (strlen($buffer) < $offset + 4) return null; $mask = substr($buffer, $offset, 4); $offset += 4; }
    if ($length > 65536) { $buffer = ''; return ['close' => true]; }
    if (strlen($buffer) < $offset + $length) return null;
    $payload = substr($buffer, $offset, $length); $buffer = substr($buffer, $offset + $length);
    if ($masked) for ($i=0; $i<$length; $i++) $payload[$i] = $payload[$i] ^ $mask[$i % 4];
    $opcode = $a & 15;
    if ($opcode === 8) return ['close' => true];
    if ($opcode === 9) return ['ping' => $payload];
    if ($opcode !== 1) return ['ignore' => true];
    $decoded = json_decode($payload, true);
    return is_array($decoded) ? ['message' => $decoded] : ['ignore' => true];
}
function wsSendPong($client, string $payload): void { @fwrite($client, chr(0x8a) . chr(strlen($payload)) . $payload); }
function deliverToUser(array $clients, int $userId, array $message): void {
    foreach ($clients as $client) if (($client['user'] ?? 0) === $userId && ($client['ready'] ?? false)) wsSend($client['stream'], $message);
}
function callFor(PDO $db, string $callId): ?array {
    $q=$db->prepare("SELECT c.call_id,c.caller_id,c.callee_id,c.status,u.username AS caller_name FROM voice_calls c JOIN users u ON u.id=c.caller_id WHERE c.call_id=? LIMIT 1");
    $q->execute([$callId]); $row=$q->fetch(); return $row ?: null;
}
function isFriend(PDO $db, int $a, int $b): bool {
    $q=$db->prepare("SELECT 1 FROM friend_requests WHERE status='accepted' AND ((requester_id=? AND recipient_id=?) OR (requester_id=? AND recipient_id=?)) LIMIT 1");
    $q->execute([$a,$b,$b,$a]); return (bool)$q->fetchColumn();
}

while (true) {
    $read = [$server]; foreach ($clients as $client) $read[] = $client['stream']; $write = $except = [];
    if (@stream_select($read, $write, $except, 1) === false) continue;
    foreach ($read as $stream) {
        if ($stream === $server) { $new=@stream_socket_accept($server,0); if ($new) { stream_set_blocking($new,false); $clients[(int)$new]=['stream'=>$new,'ready'=>false,'user'=>0,'buffer'=>'','handshake'=>'']; } continue; }
        $key=(int)$stream; if (!isset($clients[$key])) continue;
        $chunk=@fread($stream,8192);
        if ($chunk === '' || $chunk === false) { if (feof($stream)) { fclose($stream); unset($clients[$key]); } continue; }
        if (!$clients[$key]['ready']) {
            $clients[$key]['handshake'] .= $chunk;
            if (strlen($clients[$key]['handshake']) > 12000) { fclose($stream); unset($clients[$key]); continue; }
            $end=strpos($clients[$key]['handshake'], "\r\n\r\n"); if ($end===false) continue;
            $request=substr($clients[$key]['handshake'],0,$end); $tail=substr($clients[$key]['handshake'],$end+4); $headers=[];
            foreach (explode("\r\n",$request) as $line) if (str_contains($line,':')) { [$name,$value]=explode(':',$line,2); $headers[strtolower(trim($name))]=trim($value); }
            $host=parse_url('http://'.($headers['host']??''),PHP_URL_HOST); $origin=parse_url($headers['origin']??'',PHP_URL_HOST);
            $protocols=array_map('trim',explode(',', $headers['sec-websocket-protocol']??'')); $token='';
            foreach ($protocols as $protocol) if (str_starts_with($protocol,'auth.')) $token=substr($protocol,5);
            $uid=callSocketVerifyToken($token);
            if (!$uid || !$host || ($origin && strcasecmp($host,$origin)!==0) || empty($headers['sec-websocket-key'])) { @fwrite($stream,"HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n"); fclose($stream); unset($clients[$key]); continue; }
            $accept=base64_encode(sha1($headers['sec-websocket-key'].'258EAFA5-E914-47DA-95CA-C5AB0DC85B11',true));
            @fwrite($stream,"HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: {$accept}\r\nSec-WebSocket-Protocol: nave-call-v1\r\n\r\n");
            $clients[$key]['ready']=true; $clients[$key]['user']=$uid; $clients[$key]['buffer']=$tail;
            wsSend($stream,['type'=>'ready']);
        } else $clients[$key]['buffer'] .= $chunk;
        while (isset($clients[$key]) && ($frame=wsReadFrame($clients[$key]['buffer']))!==null) {
            if (!empty($frame['close'])) { @fwrite($stream,chr(0x88).chr(0)); fclose($stream); unset($clients[$key]); break; }
            if (isset($frame['ping'])) { wsSendPong($stream,$frame['ping']); continue; }
            if (!isset($frame['message'])) continue;
            $message=$frame['message']; $type=(string)($message['type']??''); $callId=(string)($message['callId']??'');
            if ($type==='heartbeat') { wsSend($stream,['type'=>'heartbeat']); continue; }
            if (!preg_match('/^[a-f0-9-]{36}$/i',$callId)) { wsSend($stream,['type'=>'error','message'=>'Identificador de chamada inválido.']); continue; }
            $call=callFor($db,$callId); $uid=$clients[$key]['user'];
            if (!$call || !in_array($uid,[(int)$call['caller_id'],(int)$call['callee_id']],true)) { wsSend($stream,['type'=>'error','message'=>'Chamada não encontrada.']); continue; }
            $other=(int)$call['caller_id']===$uid?(int)$call['callee_id']:(int)$call['caller_id'];
            if ($type==='ring' || $type==='state') {
                if ($type==='ring' && ($uid!==(int)$call['caller_id'] || $call['status']!=='ringing' || !isFriend($db,$uid,$other))) continue;
                deliverToUser($clients,$other,['type'=>$type==='ring'?'call_invite':'call_state','callId'=>$callId,'status'=>$call['status'],'callerId'=>(int)$call['caller_id'],'callerName'=>$call['caller_name']]);
            } elseif ($type==='signal') {
                $signalType=(string)($message['signalType']??''); $payload=$message['payload']??null;
                if (!in_array($call['status'],['ringing','accepted'],true) || !isFriend($db,$uid,$other) || !in_array($signalType,['offer','answer','ice'],true) || !is_array($payload)) { wsSend($stream,['type'=>'error','message'=>'Sinal de chamada inválido.']); continue; }
                // Mantém um sinal recuperável caso o destinatário esteja reconectando.
                $save=$db->prepare('INSERT INTO call_signals (call_id,sender_id,recipient_id,signal_type,payload) VALUES (?,?,?,?,?)');
                $save->execute([$callId,$uid,$other,$signalType,json_encode($payload,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)]);
                deliverToUser($clients,$other,['type'=>'signal','callId'=>$callId,'signalType'=>$signalType,'payload'=>$payload]);
            }
        }
    }
    if (time()-$lastSweep>=5) { $db->exec("UPDATE voice_calls SET status='missed',ended_at=NOW() WHERE status='ringing' AND created_at < DATE_SUB(NOW(), INTERVAL 35 SECOND)"); $lastSweep=time(); }
    foreach ($clients as $key=>$client) if (!is_resource($client['stream']) || feof($client['stream'])) { if (is_resource($client['stream'])) fclose($client['stream']); unset($clients[$key]); }
}
