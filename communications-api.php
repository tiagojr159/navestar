<?php
declare(strict_types=1);

function commsText($value): string
{
    if (!is_string($value) || !preg_match('//u', $value)) throw new InvalidArgumentException('Mensagem inválida.');
    $text = trim(str_replace(["\r\n", "\r"], "\n", $value));
    $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text);
    $length = preg_match_all('/./us', $text);
    if (!preg_match('/[^\p{Z}\s\x{200B}\x{FEFF}]/u',$text) || $length > 2000) throw new InvalidArgumentException('Escreva uma mensagem de até 2.000 caracteres.');
    return $text;
}

function commsIceServers(): array
{
    $ice = [['urls'=>'stun:stun.l.google.com:19302'],['urls'=>'stun:stun.cloudflare.com:3478']];
    $urls = (string)(getenv('NAVE_TURN_URLS') ?: '');
    if ($urls && getenv('NAVE_TURN_USERNAME') && getenv('NAVE_TURN_PASSWORD')) {
        $ice[] = ['urls'=>array_values(array_filter(array_map('trim',explode(',',$urls)))), 'username'=>getenv('NAVE_TURN_USERNAME'), 'credential'=>getenv('NAVE_TURN_PASSWORD')];
    }
    return $ice;
}

function commsEnsureSchema(PDO $pdo): void
{
    // The last migration table marks a completed installation, avoiding DDL on every poll.
    try { $pdo->query('SELECT call_id FROM communication_call_meta LIMIT 0'); return; }
    catch (PDOException $error) { if ($error->getCode() !== '42S02') throw $error; }
    $sql = file_get_contents(__DIR__.'/database/migrations/20261111_communications.sql');
    foreach (explode(';', $sql) as $statement) if (trim($statement) !== '') $pdo->exec($statement);
}

function commsValidSignal(string $type, $payload): bool
{
    if (!is_array($payload)) return false;
    if ($type==='offer' || $type==='answer') return ($payload['type']??'')===$type && is_string($payload['sdp']??null) && strpos($payload['sdp'],'v=0')===0 && strlen($payload['sdp'])<=60000;
    if ($type!=='ice' || !is_string($payload['candidate']??null) || strlen($payload['candidate'])>4096) return false;
    $mid=$payload['sdpMid']??null; $index=$payload['sdpMLineIndex']??null;
    return ($mid===null || (is_string($mid) && strlen($mid)<=128)) && ($index===null || (is_int($index) && $index>=0 && $index<=65535));
}

function commsRoom(PDO $pdo, int $userId): ?array
{
    $q=$pdo->prepare("SELECT so.station_id,so.room_pos_z,ss.code,ss.name FROM station_occupants so JOIN space_stations ss ON ss.id=so.station_id WHERE so.user_id=? AND so.mode='station' LIMIT 1");
    $q->execute([$userId]); $row=$q->fetch(PDO::FETCH_ASSOC);
    if (!$row) return null;
    $room=mpStationRoomCode((string)$row['code'],(float)$row['room_pos_z']);
    $labels=['airlock'=>'Eclusa','command'=>'Ponte de comando','observatory'=>'Observatório','geology'=>'Geologia','workshop'=>'Oficina','medical'=>'Enfermaria','quarters'=>'Alojamentos','hydroponics'=>'Hidroponia','communications'=>'Comunicações','surface-hangar'=>'Hangar da superfície','corridor'=>'Corredor','habitat'=>'Habitat'];
    return ['key'=>'room:'.$row['station_id'].':'.$room,'name'=>$row['name'].' · '.($labels[$room]??'Compartimento'),'stationId'=>(int)$row['station_id']];
}

function commsConversation(PDO $pdo, int $userId, array $input): array
{
    if (!in_array($input['scope']??'private',['private','room'],true)) mpResponse(['error'=>'Conversa inválida.'],400);
    if (($input['scope']??'private') === 'room') {
        $room=commsRoom($pdo,$userId);
        if (!$room || (isset($input['conversation']) && $input['conversation'] !== $room['key'])) mpResponse(['error'=>'Entre no compartimento desta conversa.'],403);
        return ['key'=>$room['key'],'recipient'=>null];
    }
    $peer=(int)($input['peer_id']??0);
    if ($peer<1 || $peer===$userId || !mpAreFriends($pdo,$userId,$peer)) mpResponse(['error'=>'A conversa é restrita aos seus amigos.'],403);
    return ['key'=>'private:'.min($userId,$peer).':'.max($userId,$peer),'recipient'=>$peer];
}

function commsMessage(array $row): array
{
    return ['id'=>(int)$row['id'],'clientId'=>$row['client_id'],'senderId'=>(int)$row['sender_id'],'name'=>$row['username'],'text'=>$row['body'],'createdAt'=>$row['created_at'].'Z'];
}

function commsHandle(PDO $pdo, int $userId, string $action): bool
{
    $chatActions=['comms-config','chat-roster','chat-history','chat-send','chat-read','chat-typing'];
    $callActions=['call-start','call-accept','call-decline','call-end','call-signal','call-poll'];
    if (!in_array($action,array_merge($chatActions,$callActions),true)) return false;
    commsEnsureSchema($pdo);
    // Use UTC for persisted conversation timestamps, independent of the PHP host clock zone.
    $pdo->exec("SET time_zone = '+00:00'");
    $post=in_array($action,['chat-send','chat-read','chat-typing','call-start','call-accept','call-decline','call-end','call-signal'],true);
    if ($_SERVER['REQUEST_METHOD'] !== ($post?'POST':'GET')) mpResponse(['error'=>'Método não permitido.'],405);
    $input=$post?mpInput():$_GET;
    if ($action==='comms-config') {
        mpResponse(['userId'=>$userId,'iceServers'=>commsIceServers(),'socketUrl'=>(string)(getenv('NAVE_CALL_SOCKET_URL')?:''),'maxMessageLength'=>2000]);
    }
    if ($action==='chat-roster') {
        // Station occupants remain visible for 30 seconds; keep call presence in sync.
        $q=$pdo->prepare("SELECT u.id,u.username,u.last_seen_at>=DATE_SUB(NOW(),INTERVAL 30 SECOND) AS online FROM friend_requests f JOIN users u ON u.id=IF(f.requester_id=?,f.recipient_id,f.requester_id) WHERE f.status='accepted' AND (f.requester_id=? OR f.recipient_id=?) AND u.is_active=1 ORDER BY online DESC,u.username");
        $q->execute([$userId,$userId,$userId]);
        $friends=$q->fetchAll(PDO::FETCH_ASSOC);
        $unread=$pdo->prepare("SELECT m.sender_id,COUNT(*) AS unread FROM communication_messages m LEFT JOIN communication_reads r ON r.user_id=? AND r.conversation_key=m.conversation_key WHERE m.recipient_id=? AND m.id>COALESCE(r.last_message_id,0) GROUP BY m.sender_id");
        $unread->execute([$userId,$userId]); $counts=[];
        foreach ($unread->fetchAll(PDO::FETCH_ASSOC) as $row) $counts[(int)$row['sender_id']]=(int)$row['unread'];
        $room=commsRoom($pdo,$userId);
        if ($room) {
            $q=$pdo->prepare('SELECT COUNT(*) FROM communication_messages m LEFT JOIN communication_reads r ON r.user_id=? AND r.conversation_key=m.conversation_key WHERE m.conversation_key=? AND m.sender_id<>? AND m.id>COALESCE(r.last_message_id,0)');
            $q->execute([$userId,$room['key'],$userId]); $room['unread']=(int)$q->fetchColumn();
        }
        mpResponse(['friends'=>array_map(static fn($r)=>['id'=>(int)$r['id'],'name'=>$r['username'],'online'=>(bool)$r['online'],'unread'=>$counts[(int)$r['id']]??0],$friends),'room'=>$room]);
    }
    if (in_array($action,['chat-history','chat-send','chat-read','chat-typing'],true)) {
        $conversation=commsConversation($pdo,$userId,$input); $key=$conversation['key'];
        if ($action==='chat-history') {
            $after=max(0,(int)($input['after']??0)); $before=max(0,(int)($input['before']??0));
            $where=$after?'m.id>?':($before?'m.id<?':'m.id>0');
            $q=$pdo->prepare("SELECT m.*,u.username FROM communication_messages m JOIN users u ON u.id=m.sender_id WHERE m.conversation_key=? AND $where ORDER BY m.id ".($after?'ASC':'DESC').' LIMIT 61');
            $q->execute($after||$before?[$key,$after?:$before]:[$key]); $rows=$q->fetchAll(PDO::FETCH_ASSOC); $more=count($rows)>60; $rows=array_slice($rows,0,60);
            if (!$after) $rows=array_reverse($rows);
            $read=$pdo->prepare('SELECT last_message_id FROM communication_reads WHERE conversation_key=? AND user_id=?');
            $read->execute([$key,$conversation['recipient']??0]);
            $typing=$pdo->prepare('SELECT u.username FROM communication_typing t JOIN users u ON u.id=t.user_id WHERE t.conversation_key=? AND t.user_id<>? AND t.updated_at>DATE_SUB(NOW(),INTERVAL 5 SECOND) LIMIT 3');
            $typing->execute([$key,$userId]);
            mpResponse(['messages'=>array_map('commsMessage',$rows),'hasMore'=>$more,'peerReadId'=>(int)$read->fetchColumn(),'typing'=>$typing->fetchAll(PDO::FETCH_COLUMN)]);
        }
        if ($action==='chat-send') {
            try { $text=commsText($input['text']??null); } catch (InvalidArgumentException $error) { mpResponse(['error'=>$error->getMessage()],400); }
            $clientId=(string)($input['client_id']??'');
            if (!preg_match('/^[a-zA-Z0-9-]{16,64}$/',$clientId)) mpResponse(['error'=>'Identificador de mensagem inválido.'],400);
            $pdo->beginTransaction();
            // Serialize sender requests so concurrent tabs cannot bypass the burst limit.
            $lock=$pdo->prepare('SELECT id FROM users WHERE id=? FOR UPDATE');$lock->execute([$userId]);
            $existing=$pdo->prepare('SELECT m.*,u.username FROM communication_messages m JOIN users u ON u.id=m.sender_id WHERE m.sender_id=? AND m.client_id=?');
            $existing->execute([$userId,$clientId]);$row=$existing->fetch(PDO::FETCH_ASSOC);
            if ($row) { if ($row['conversation_key']!==$key || $row['body']!==$text) mpResponse(['error'=>'Identificador de mensagem já utilizado.'],409); $pdo->commit();mpResponse(['message'=>commsMessage($row)]); }
            $rate=$pdo->prepare('SELECT COUNT(*) FROM communication_messages WHERE sender_id=? AND created_at>DATE_SUB(NOW(),INTERVAL 10 SECOND)');$rate->execute([$userId]);
            if ((int)$rate->fetchColumn()>=12) mpResponse(['error'=>'Aguarde alguns segundos antes de enviar mais mensagens.'],429);
            $q=$pdo->prepare('INSERT INTO communication_messages(conversation_key,sender_id,recipient_id,client_id,body) VALUES (?,?,?,?,?)');
            $q->execute([$key,$userId,$conversation['recipient'],$clientId,$text]);$id=(int)$pdo->lastInsertId();
            $q=$pdo->prepare('SELECT m.*,u.username FROM communication_messages m JOIN users u ON u.id=m.sender_id WHERE m.id=?');$q->execute([$id]);$row=$q->fetch(PDO::FETCH_ASSOC);
            $pdo->prepare('DELETE FROM communication_typing WHERE conversation_key=? AND user_id=?')->execute([$key,$userId]);
            $pdo->commit(); mpResponse(['message'=>commsMessage($row)]);
        }
        if ($action==='chat-read') {
            $q=$pdo->prepare('SELECT COALESCE(MAX(id),0) FROM communication_messages WHERE conversation_key=? AND id<=?');$q->execute([$key,max(0,(int)($input['message_id']??0))]);$id=(int)$q->fetchColumn();
            $pdo->prepare('INSERT INTO communication_reads(conversation_key,user_id,last_message_id) VALUES (?,?,?) ON DUPLICATE KEY UPDATE last_message_id=GREATEST(last_message_id,VALUES(last_message_id))')->execute([$key,$userId,$id]);mpResponse(['ok'=>true]);
        }
        $pdo->prepare('INSERT INTO communication_typing(conversation_key,user_id) VALUES (?,?) ON DUPLICATE KEY UPDATE updated_at=NOW()')->execute([$key,$userId]);mpResponse(['ok'=>true]);
    }
    // Stale tabs must not leave either participant permanently busy.
    if ($action==='call-start' || $action==='call-poll') $pdo->exec("UPDATE voice_calls c LEFT JOIN communication_call_meta m ON m.call_id=c.call_id SET c.status=IF(c.status='ringing','missed','ended'),c.ended_at=NOW() WHERE (c.status='ringing' AND c.created_at<DATE_SUB(NOW(),INTERVAL 35 SECOND)) OR (c.status='accepted' AND (COALESCE(m.caller_seen,c.updated_at)<DATE_SUB(NOW(),INTERVAL 65 SECOND) OR COALESCE(m.callee_seen,c.updated_at)<DATE_SUB(NOW(),INTERVAL 65 SECOND)))");
    if ($action==='call-start') {
        $target=(int)($input['user_id']??0);$mode=($input['video']??false)?'video':'voice';
        if ($target===$userId || !mpAreFriends($pdo,$userId,$target)) mpResponse(['error'=>'Adicione este piloto aos amigos antes de ligar.'],403);
        $pdo->beginTransaction();
        $q=$pdo->prepare('SELECT id FROM users WHERE id IN (?,?) ORDER BY id FOR UPDATE');$q->execute([$userId,$target]);$q->fetchAll();
        $q=$pdo->prepare('SELECT id FROM users WHERE id=? AND is_active=1 AND last_seen_at>=DATE_SUB(NOW(),INTERVAL 30 SECOND)');$q->execute([$target]);
        if (!$q->fetchColumn()) mpResponse(['error'=>'Este piloto está offline. Você pode deixar uma mensagem.'],409);
        $q=$pdo->prepare("SELECT call_id FROM voice_calls WHERE status IN ('ringing','accepted') AND (caller_id IN (?,?) OR callee_id IN (?,?)) LIMIT 1 FOR UPDATE");$q->execute([$userId,$target,$userId,$target]);
        if ($q->fetchColumn()) mpResponse(['error'=>'Um dos participantes já está em outra chamada.'],409);
        $id=mpCallId();$pdo->prepare("INSERT INTO voice_calls(call_id,caller_id,callee_id,status) VALUES (?,?,?,'ringing')")->execute([$id,$userId,$target]);
        $pdo->prepare('INSERT INTO communication_call_meta(call_id,media_mode) VALUES (?,?)')->execute([$id,$mode]);$pdo->commit();
        mpResponse(['call_id'=>$id,'status'=>'ringing']);
    }
    if ($action==='call-poll') {
        $pdo->prepare("UPDATE communication_call_meta m JOIN voice_calls c ON c.call_id=m.call_id SET m.caller_seen=IF(c.caller_id=?,NOW(),m.caller_seen),m.callee_seen=IF(c.callee_id=?,NOW(),m.callee_seen) WHERE c.call_id=? AND c.status IN ('ringing','accepted') AND (c.caller_id=? OR c.callee_id=?)")->execute([$userId,$userId,(string)($input['active_call']??''),$userId,$userId]);
        $q=$pdo->prepare("SELECT c.call_id,c.caller_id,c.callee_id,c.status,c.created_at,u.username AS caller_name,v.username AS callee_name,COALESCE(m.media_mode,'voice') AS media_mode FROM voice_calls c JOIN users u ON u.id=c.caller_id JOIN users v ON v.id=c.callee_id LEFT JOIN communication_call_meta m ON m.call_id=c.call_id WHERE (c.caller_id=? OR c.callee_id=?) AND (c.status IN ('ringing','accepted') OR c.updated_at>=DATE_SUB(NOW(),INTERVAL 2 MINUTE)) ORDER BY c.created_at DESC LIMIT 12");$q->execute([$userId,$userId]);$calls=$q->fetchAll(PDO::FETCH_ASSOC);
        // The client advances this cursor only after processing the response. A lost HTTP
        // response is replayable instead of silently losing an offer or an ICE candidate.
        $q=$pdo->prepare("SELECT s.id,s.call_id,s.signal_type,s.payload FROM call_signals s JOIN voice_calls c ON c.call_id=s.call_id WHERE s.recipient_id=? AND s.id>? AND c.status IN ('ringing','accepted') ORDER BY s.id LIMIT 100");$q->execute([$userId,max(0,(int)($input['after']??0))]);$signals=$q->fetchAll(PDO::FETCH_ASSOC);
        foreach ($signals as &$signal) $signal['payload']=json_decode($signal['payload'],true);unset($signal);
        mpResponse(['calls'=>$calls,'signals'=>$signals]);
    }
    $id=(string)($input['call_id']??'');
    if (!preg_match('/^[a-f0-9-]{36}$/i',$id)) mpResponse(['error'=>'Chamada inválida.'],400);
    $q=$pdo->prepare('SELECT * FROM voice_calls WHERE call_id=? AND (caller_id=? OR callee_id=?)');$q->execute([$id,$userId,$userId]);$call=$q->fetch(PDO::FETCH_ASSOC);
    if (!$call) mpResponse(['error'=>'Chamada não encontrada.'],404);
    if ($action==='call-signal') {
        $type=(string)($input['type']??'');$payload=$input['payload']??null;
        if (!commsValidSignal($type,$payload) || strlen(json_encode($payload))>64000) mpResponse(['error'=>'Sinal de chamada inválido.'],400);
        if (!in_array($call['status'],['ringing','accepted'],true) || ($call['status']==='ringing' && (int)$call['caller_id']!==$userId)) mpResponse(['error'=>'A chamada não está disponível.'],409);
        $other=(int)$call['caller_id']===$userId?(int)$call['callee_id']:(int)$call['caller_id'];
        $pdo->prepare('INSERT INTO call_signals(call_id,sender_id,recipient_id,signal_type,payload) VALUES (?,?,?,?,?)')->execute([$id,$userId,$other,$type,json_encode($payload,JSON_UNESCAPED_UNICODE)]);mpResponse(['ok'=>true]);
    }
    if ($action==='call-end' && in_array($call['status'],['ended','declined','missed'],true)) mpResponse(['ok'=>true]);
    if ($action!=='call-end' && (int)$call['callee_id']!==$userId) mpResponse(['error'=>'Somente quem recebe pode atender ou recusar.'],403);
    $status=['call-accept'=>'accepted','call-decline'=>'declined','call-end'=>'ended'][$action];
    $q=$pdo->prepare("UPDATE voice_calls SET status=?,ended_at=IF(?='accepted',NULL,NOW()) WHERE call_id=? AND status IN (".($action==='call-end'?"'ringing','accepted'":"'ringing'").')');$q->execute([$status,$status,$id]);
    if (!$q->rowCount() && !($status==='accepted' && $call['status']==='accepted')) mpResponse(['error'=>'A chamada já foi encerrada.'],409);
    if ($status==='accepted') $pdo->prepare('UPDATE communication_call_meta SET caller_seen=NOW(),callee_seen=NOW() WHERE call_id=?')->execute([$id]);
    mpResponse(['ok'=>true]);
    return true;
}
