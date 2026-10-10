<?php
declare(strict_types=1);

session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax']);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

function mpResponse(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function mpInput(): array
{
    $input = json_decode(file_get_contents('php://input'), true);
    return is_array($input) ? $input : [];
}

function mpAreFriends(PDO $pdo, int $first, int $second): bool
{
    $query = $pdo->prepare("SELECT 1 FROM friend_requests WHERE status='accepted' AND ((requester_id=? AND recipient_id=?) OR (requester_id=? AND recipient_id=?)) LIMIT 1");
    $query->execute([$first, $second, $second, $first]);
    return (bool)$query->fetchColumn();
}

function mpCallId(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);
    return substr($hex, 0, 8) . '-' . substr($hex, 8, 4) . '-' . substr($hex, 12, 4) . '-' . substr($hex, 16, 4) . '-' . substr($hex, 20);
}

function mpEnsureTowSystem(PDO $pdo): void
{
    $equipmentExists=$pdo->query("SELECT 1 FROM equipment WHERE code='tractor_array' LIMIT 1")->fetchColumn();
    if(!$equipmentExists)$pdo->exec("INSERT INTO equipment (code,name,equipment_type,description,damage,ammo_capacity,quantity_per_purchase,price_credits,iron_cost_kg,nickel_cost_kg,cobalt_cost_kg,weight_kg) VALUES ('tractor_array','Conjunto rebocador orbital','engine','Emissor de tracao para arrastar naves desativadas ate uma estacao.',0,0,1,12000,250,0,0,380)");
    $pdo->exec("CREATE TABLE IF NOT EXISTS ship_tows (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        tug_ship_id BIGINT UNSIGNED NOT NULL,
        rescued_ship_id BIGINT UNSIGNED NOT NULL,
        wreck_id BIGINT UNSIGNED NOT NULL,
        rescuer_user_id BIGINT UNSIGNED NOT NULL,
        station_id BIGINT UNSIGNED NOT NULL,
        origin_x DOUBLE NOT NULL, origin_z DOUBLE NOT NULL,
        destination_x DOUBLE NOT NULL, destination_z DOUBLE NOT NULL,
        duration_seconds SMALLINT UNSIGNED NOT NULL DEFAULT 45,
        status ENUM('active','completed','cancelled') NOT NULL DEFAULT 'active',
        started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL DEFAULT NULL,
        PRIMARY KEY (id), UNIQUE KEY uq_ship_tows_wreck (wreck_id),
        KEY ix_ship_tows_active (status,started_at),
        CONSTRAINT fk_ship_tows_tug FOREIGN KEY (tug_ship_id) REFERENCES ships(id) ON DELETE CASCADE,
        CONSTRAINT fk_ship_tows_rescued FOREIGN KEY (rescued_ship_id) REFERENCES ships(id) ON DELETE CASCADE,
        CONSTRAINT fk_ship_tows_wreck FOREIGN KEY (wreck_id) REFERENCES ship_wrecks(id) ON DELETE CASCADE,
        CONSTRAINT fk_ship_tows_user FOREIGN KEY (rescuer_user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_ship_tows_station FOREIGN KEY (station_id) REFERENCES space_stations(id) ON DELETE CASCADE
    ) ENGINE=InnoDB");
    $pdo->exec("CREATE TABLE IF NOT EXISTS ship_rescue_requests (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        tug_ship_id BIGINT UNSIGNED NOT NULL,
        target_ship_id BIGINT UNSIGNED NOT NULL,
        tug_user_id BIGINT UNSIGNED NOT NULL,
        target_user_id BIGINT UNSIGNED NOT NULL,
        station_id BIGINT UNSIGNED NOT NULL,
        origin_x DOUBLE NOT NULL, origin_z DOUBLE NOT NULL,
        destination_x DOUBLE NOT NULL, destination_z DOUBLE NOT NULL,
        duration_seconds SMALLINT UNSIGNED NOT NULL DEFAULT 60,
        status ENUM('pending','active','completed','declined','cancelled') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        accepted_at TIMESTAMP NULL DEFAULT NULL,
        completed_at TIMESTAMP NULL DEFAULT NULL,
        PRIMARY KEY (id),
        KEY ix_ship_rescue_target (target_user_id,status,created_at),
        KEY ix_ship_rescue_tug (tug_user_id,status,created_at),
        KEY ix_ship_rescue_active (status,created_at),
        CONSTRAINT fk_ship_rescue_tug FOREIGN KEY (tug_ship_id) REFERENCES ships(id) ON DELETE CASCADE,
        CONSTRAINT fk_ship_rescue_target FOREIGN KEY (target_ship_id) REFERENCES ships(id) ON DELETE CASCADE,
        CONSTRAINT fk_ship_rescue_tug_user FOREIGN KEY (tug_user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_ship_rescue_target_user FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_ship_rescue_station FOREIGN KEY (station_id) REFERENCES space_stations(id) ON DELETE CASCADE
    ) ENGINE=InnoDB");
}

function mpEnsurePassengerRequests(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS ship_passenger_requests (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        ship_id BIGINT UNSIGNED NOT NULL,
        passenger_id BIGINT UNSIGNED NOT NULL,
        origin_station_id BIGINT UNSIGNED NOT NULL,
        destination_station_id BIGINT UNSIGNED NOT NULL,
        status ENUM('pending','accepted','declined','cancelled') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY ix_passenger_requests_ship (ship_id,status,created_at),
        KEY ix_passenger_requests_user (passenger_id,status,created_at),
        CONSTRAINT fk_passenger_request_ship FOREIGN KEY (ship_id) REFERENCES ships(id) ON DELETE CASCADE,
        CONSTRAINT fk_passenger_request_user FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_passenger_request_origin FOREIGN KEY (origin_station_id) REFERENCES space_stations(id) ON DELETE CASCADE,
        CONSTRAINT fk_passenger_request_destination FOREIGN KEY (destination_station_id) REFERENCES space_stations(id) ON DELETE CASCADE
    ) ENGINE=InnoDB");
}

function mpTradeOffer(mixed $value): array
{
    if (!is_array($value)) mpResponse(['error' => 'A oferta de troca está inválida.'], 400);
    $offer = [];
    foreach (['credits','iron','nickel','cobalt'] as $field) {
        $amount = $value[$field] ?? 0;
        if (!is_numeric($amount) || !is_finite((float)$amount) || (float)$amount < 0 || floor((float)$amount) !== (float)$amount) mpResponse(['error' => 'Use quantidades inteiras e positivas na oferta.'], 400);
        $offer[$field] = min(1000000000, (int)$amount);
    }
    return $offer;
}

$userId = (int)($_SESSION['user_id'] ?? 0);
if ($userId < 1) {
    mpResponse(['error' => 'Entre na sua conta para jogar no multiplayer.'], 401);
}

try {
    require_once __DIR__ . '/database/connection.php';
    require_once __DIR__ . '/voice-message-storage.php';
    require_once __DIR__ . '/call-socket-auth.php';
    require_once __DIR__ . '/rare-asteroids.php';
    $pdo = db();
    $action = $_GET['action'] ?? '';

    if (in_array($action, ['station-call-status','station-call-signal','station-call-poll'], true)) {
        $here=$pdo->prepare("SELECT station_id,room_pos_z FROM station_occupants WHERE user_id=? AND mode='station' LIMIT 1");
        $here->execute([$userId]); $location=$here->fetch(PDO::FETCH_ASSOC);
        if(!$location) mpResponse(['active'=>false]);
        $stationId=(int)$location['station_id']; $roomZ=(float)$location['room_pos_z'];
        $roomCode=$roomZ<109?'observatory':($roomZ<143?'corridor':'habitat');
        $roomMin=$roomCode==='observatory'?0:($roomCode==='corridor'?109:143); $roomMax=$roomCode==='observatory'?109:($roomCode==='corridor'?143:221);
        $pdo->prepare('UPDATE users SET last_seen_at=NOW() WHERE id=?')->execute([$userId]);
        $peerQuery=$pdo->prepare("SELECT so.user_id,u.username,so.room_pos_z FROM station_occupants so JOIN users u ON u.id=so.user_id WHERE so.station_id=? AND so.mode='station' AND so.user_id<>? AND so.room_pos_z>=? AND so.room_pos_z<? AND u.is_active=1 AND u.last_seen_at>=DATE_SUB(NOW(),INTERVAL 20 SECOND) ORDER BY so.user_id");
        $peerQuery->execute([$stationId,$userId,$roomMin,$roomMax]); $peers=array_map(static fn($r)=>['id'=>(int)$r['user_id'],'name'=>$r['username']],$peerQuery->fetchAll(PDO::FETCH_ASSOC));
        if($action==='station-call-status') {
            $iceServers=[['urls'=>'stun:stun.l.google.com:19302'],['urls'=>'stun:stun.cloudflare.com:3478']];
            $turnUrl=(string)(getenv('NAVE_TURN_URLS')?:'');$turnUser=(string)(getenv('NAVE_TURN_USERNAME')?:'');$turnPassword=(string)(getenv('NAVE_TURN_PASSWORD')?:'');
            if($turnUrl!==''&&$turnUser!==''&&$turnPassword!=='')$iceServers[]=['urls'=>array_map('trim',explode(',',$turnUrl)),'username'=>$turnUser,'credential'=>$turnPassword];
            mpResponse(['active'=>true,'stationId'=>$stationId,'roomCode'=>$roomCode,'userId'=>$userId,'peers'=>$peers,'iceServers'=>$iceServers]);
        }
        if($action==='station-call-signal') {
            if($_SERVER['REQUEST_METHOD']!=='POST')mpResponse(['error'=>'Use POST para sinalizar a chamada.'],405);
            $input=mpInput();$type=(string)($input['type']??'');$peerId=(int)($input['peer_id']??0);$payload=$input['payload']??null;$mode=(string)($input['mode']??'voice');
            if(!in_array($type,['offer','answer','ice','close'],true)||!in_array($mode,['voice','video','screen'],true)||($type!=='close'&&!is_array($payload)))mpResponse(['error'=>'Sinal de chamada invalido.'],400);
            $peerIds=array_map(static fn($p)=>(int)$p['id'],$peers);if($peerId===$userId||!in_array($peerId,$peerIds,true))mpResponse(['error'=>'O outro piloto precisa estar no mesmo compartimento.'],403);
            $wrapped=['station_call'=>1,'mode'=>$mode,'data'=>$payload];$encoded=json_encode($wrapped,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);if(strlen($encoded)>16000)mpResponse(['error'=>'Sinal de chamada excede o limite.'],413);
            $pdo->prepare('INSERT INTO station_voice_signals(station_id,sender_id,recipient_id,signal_type,payload) VALUES(?,?,?,?,?)')->execute([$stationId,$userId,$peerId,$type,$encoded]);mpResponse(['ok'=>true]);
        }
        if(random_int(1,120)===1)$pdo->exec("DELETE FROM station_voice_signals WHERE created_at<DATE_SUB(NOW(),INTERVAL 1 HOUR)");
        $signalsQuery=$pdo->prepare("SELECT id,sender_id,signal_type,payload FROM station_voice_signals WHERE station_id=? AND recipient_id=? AND read_at IS NULL AND created_at>=DATE_SUB(NOW(),INTERVAL 1 MINUTE) AND JSON_UNQUOTE(JSON_EXTRACT(payload,'$.station_call'))='1' ORDER BY id LIMIT 60");$signalsQuery->execute([$stationId,$userId]);$signals=$signalsQuery->fetchAll(PDO::FETCH_ASSOC);
        if($signals){$signalIds=array_map('intval',array_column($signals,'id'));$pdo->exec('UPDATE station_voice_signals SET read_at=NOW() WHERE recipient_id='.$userId.' AND id IN ('.implode(',',$signalIds).')');}
        $peerMap=array_fill_keys(array_map(static fn($p)=>(int)$p['id'],$peers),true);$signals=array_values(array_filter($signals,static fn($signal)=>isset($peerMap[(int)$signal['sender_id']])));
        foreach($signals as &$signal){$signal['sender_id']=(int)$signal['sender_id'];$signal['payload']=$signal['payload']?json_decode($signal['payload'],true):null;}unset($signal);
        mpResponse(['active'=>true,'stationId'=>$stationId,'roomCode'=>$roomCode,'signals'=>$signals]);
    }

    if (in_array($action, ['station-voice-status','station-voice-signal','station-voice-poll'], true)) {
        $here=$pdo->prepare("SELECT station_id,room_pos_z FROM station_occupants WHERE user_id=? AND mode='station' LIMIT 1");$here->execute([$userId]);$hereRow=$here->fetch(PDO::FETCH_ASSOC);$stationId=(int)($hereRow['station_id']??0);if(!$stationId)mpResponse(['active'=>false]);
        $z=(float)$hereRow['room_pos_z'];$min=$z<109?0:($z<143?109:143);$max=$z<109?109:($z<143?143:221);$pdo->prepare('UPDATE users SET last_seen_at=NOW() WHERE id=?')->execute([$userId]);
        $q=$pdo->prepare("SELECT so.user_id,u.username FROM station_occupants so JOIN users u ON u.id=so.user_id WHERE so.station_id=? AND so.mode='station' AND so.user_id<>? AND so.room_pos_z>=? AND so.room_pos_z<? AND u.is_active=1 AND u.last_seen_at>=DATE_SUB(NOW(),INTERVAL 20 SECOND) ORDER BY so.user_id");$q->execute([$stationId,$userId,$min,$max]);$peers=array_map(static fn($r)=>['id'=>(int)$r['user_id'],'name'=>$r['username']],$q->fetchAll(PDO::FETCH_ASSOC));
        if($action==='station-voice-status'){$ice=[['urls'=>'stun:stun.l.google.com:19302'],['urls'=>'stun:stun.cloudflare.com:3478']];$url=(string)(getenv('NAVE_TURN_URLS')?:'');$user=(string)(getenv('NAVE_TURN_USERNAME')?:'');$pass=(string)(getenv('NAVE_TURN_PASSWORD')?:'');if($url!==''&&$user!==''&&$pass!=='')$ice[]=['urls'=>array_map('trim',explode(',',$url)),'username'=>$user,'credential'=>$pass];mpResponse(['active'=>true,'stationId'=>$stationId,'roomCode'=>$z<109?'observatory':($z<143?'corridor':'habitat'),'userId'=>$userId,'peers'=>$peers,'iceServers'=>$ice]);}
        if($action==='station-voice-signal'){if($_SERVER['REQUEST_METHOD']!=='POST')mpResponse(['error'=>'Use POST.'],405);$in=mpInput();$type=(string)($in['type']??'');$peer=(int)($in['peer_id']??0);$payload=$in['payload']??null;if(!in_array($type,['offer','answer','ice','close'],true)||($type!=='close'&&!is_array($payload)))mpResponse(['error'=>'Sinal invalido.'],400);$ids=array_map(static fn($p)=>(int)$p['id'],$peers);if($peer===$userId||!in_array($peer,$ids,true))mpResponse(['error'=>'Jogador fora desta sala.'],403);$encoded=json_encode($payload,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);if($encoded!==false&&strlen($encoded)>16000)mpResponse(['error'=>'Sinal excede limite.'],413);$pdo->prepare('INSERT INTO station_voice_signals(station_id,sender_id,recipient_id,signal_type,payload) VALUES(?,?,?,?,?)')->execute([$stationId,$userId,$peer,$type,$encoded]);mpResponse(['ok'=>true]);}
        $q=$pdo->prepare("SELECT id,sender_id,signal_type,payload FROM station_voice_signals WHERE station_id=? AND recipient_id=? AND read_at IS NULL AND created_at>=DATE_SUB(NOW(),INTERVAL 1 MINUTE) AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(payload,'$.station_call')),'0')<>'1' AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(payload,'$.passenger_voice')),'0')<>'1' ORDER BY id LIMIT 60");$q->execute([$stationId,$userId]);$signals=$q->fetchAll(PDO::FETCH_ASSOC);if($signals){$ids=array_map('intval',array_column($signals,'id'));$pdo->exec('UPDATE station_voice_signals SET read_at=NOW() WHERE recipient_id='.$userId.' AND id IN ('.implode(',',$ids).')');}foreach($signals as &$signal){$signal['sender_id']=(int)$signal['sender_id'];$signal['payload']=$signal['payload']?json_decode($signal['payload'],true):null;}unset($signal);mpResponse(['active'=>true,'signals'=>$signals]);
    }

    if (in_array($action, ['passenger-voice-status','passenger-voice-signal','passenger-voice-poll'], true)) {
        $here=$pdo->prepare("SELECT so.ship_id,p.ship_id AS passenger_ship_id FROM station_occupants so LEFT JOIN ship_passengers p ON p.passenger_id=so.user_id AND p.status='active' WHERE so.user_id=? AND so.mode='aboard' LIMIT 1");$here->execute([$userId]);$where=$here->fetch(PDO::FETCH_ASSOC);$ship=(int)($where['passenger_ship_id']??$where['ship_id']??0);if(!$ship)mpResponse(['active'=>false]);$pdo->prepare('UPDATE users SET last_seen_at=NOW() WHERE id=?')->execute([$userId]);
        $q=$pdo->prepare("SELECT so.user_id,u.username FROM station_occupants so JOIN users u ON u.id=so.user_id WHERE so.ship_id=? AND so.mode='aboard' AND so.user_id<>? AND u.is_active=1 AND u.last_seen_at>=DATE_SUB(NOW(),INTERVAL 20 SECOND) ORDER BY so.user_id");$q->execute([$ship,$userId]);$peers=array_map(static fn($r)=>['id'=>(int)$r['user_id'],'name'=>$r['username']],$q->fetchAll(PDO::FETCH_ASSOC));
        if($action==='passenger-voice-status'){$ice=[['urls'=>'stun:stun.l.google.com:19302'],['urls'=>'stun:stun.cloudflare.com:3478']];$url=(string)(getenv('NAVE_TURN_URLS')?:'');$user=(string)(getenv('NAVE_TURN_USERNAME')?:'');$pass=(string)(getenv('NAVE_TURN_PASSWORD')?:'');if($url!==''&&$user!==''&&$pass!=='')$ice[]=['urls'=>array_map('trim',explode(',',$url)),'username'=>$user,'credential'=>$pass];mpResponse(['active'=>true,'shipId'=>$ship,'userId'=>$userId,'peers'=>$peers,'iceServers'=>$ice]);}
        if($action==='passenger-voice-signal'){if($_SERVER['REQUEST_METHOD']!=='POST')mpResponse(['error'=>'Use POST.'],405);$in=mpInput();$type=(string)($in['type']??'');$peer=(int)($in['peer_id']??0);$payload=$in['payload']??null;if(!in_array($type,['offer','answer','ice','close'],true)||($type!=='close'&&!is_array($payload)))mpResponse(['error'=>'Sinal invalido.'],400);$ids=array_map(static fn($p)=>(int)$p['id'],$peers);if($peer===$userId||!in_array($peer,$ids,true))mpResponse(['error'=>'Jogador fora desta nave.'],403);$encoded=json_encode(['passenger_voice'=>1,'signal_type'=>$type,'data'=>$payload],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);if(strlen($encoded)>16000)mpResponse(['error'=>'Sinal excede limite.'],413);$pdo->prepare('INSERT INTO station_voice_signals(station_id,sender_id,recipient_id,signal_type,payload) VALUES(?,?,?,?,?)')->execute([$ship,$userId,$peer,$type,$encoded]);mpResponse(['ok'=>true]);}
        $q=$pdo->prepare("SELECT id,sender_id,signal_type,payload FROM station_voice_signals WHERE station_id=? AND recipient_id=? AND read_at IS NULL AND created_at>=DATE_SUB(NOW(),INTERVAL 1 MINUTE) AND JSON_UNQUOTE(JSON_EXTRACT(payload,'$.passenger_voice'))='1' ORDER BY id LIMIT 60");$q->execute([$ship,$userId]);$signals=$q->fetchAll(PDO::FETCH_ASSOC);if($signals){$ids=array_map('intval',array_column($signals,'id'));$pdo->exec('UPDATE station_voice_signals SET read_at=NOW() WHERE recipient_id='.$userId.' AND id IN ('.implode(',',$ids).')');}foreach($signals as &$signal){$signal['sender_id']=(int)$signal['sender_id'];$wrap=$signal['payload']?json_decode($signal['payload'],true):null;$signal['signal_type']=$wrap['signal_type']??$signal['signal_type'];$signal['payload']=$wrap['data']??null;}unset($signal);mpResponse(['active'=>true,'signals'=>$signals]);
    }

    if (in_array($action, ['crew-voice-status','crew-voice-signal','crew-voice-poll'], true)) {
        $crewQuery = $pdo->prepare("SELECT sc.ship_id,sc.captain_id,sc.copilot_id FROM ship_crew sc WHERE sc.status='active' AND (sc.captain_id=? OR sc.copilot_id=?) LIMIT 1");
        $crewQuery->execute([$userId,$userId]); $crew=$crewQuery->fetch(PDO::FETCH_ASSOC); $shipId=0; $role=''; $memberIds=[];
        if($crew){$shipId=(int)$crew['ship_id'];$role=(int)$crew['captain_id']===$userId?'pilot':'copilot';$memberIds=[(int)$crew['captain_id'],(int)$crew['copilot_id']];}
        else{
            $passengerCheck=$pdo->prepare("SELECT ship_id FROM ship_passengers WHERE passenger_id=? AND status='active' LIMIT 1");$passengerCheck->execute([$userId]);$shipId=(int)$passengerCheck->fetchColumn();
            if($shipId)$role='passenger';else{$pilotCheck=$pdo->prepare("SELECT s.id FROM ships s WHERE s.user_id=? AND s.is_active=1 AND EXISTS(SELECT 1 FROM ship_passengers p WHERE p.ship_id=s.id AND p.status='active') LIMIT 1");$pilotCheck->execute([$userId]);$shipId=(int)$pilotCheck->fetchColumn();if($shipId)$role='pilot';}
            if(!$shipId)mpResponse(['active'=>false]);
            $captainQuery=$pdo->prepare('SELECT user_id FROM ships WHERE id=?');$captainQuery->execute([$shipId]);$memberIds[]=(int)$captainQuery->fetchColumn();
            $copilotQuery=$pdo->prepare("SELECT copilot_id FROM ship_crew WHERE ship_id=? AND status='active'");$copilotQuery->execute([$shipId]);$copilotId=(int)$copilotQuery->fetchColumn();if($copilotId)$memberIds[]=$copilotId;
        }
        $passengersQuery=$pdo->prepare("SELECT passenger_id FROM ship_passengers WHERE ship_id=? AND status='active'");$passengersQuery->execute([$shipId]);foreach($passengersQuery->fetchAll(PDO::FETCH_COLUMN) as $passengerId)$memberIds[]=(int)$passengerId;
        $memberIds=array_values(array_unique(array_filter($memberIds,static fn($id)=>$id>0)));if(!in_array($userId,$memberIds,true))mpResponse(['active'=>false]);
        $copilotCheck=$pdo->prepare("SELECT 1 FROM ship_crew WHERE ship_id=? AND status='active' LIMIT 1");$copilotCheck->execute([$shipId]);$hasCopilot=(bool)$copilotCheck->fetchColumn();
        $ids=implode(',',array_map('intval',$memberIds));$onlineRows=$pdo->query("SELECT id,username FROM users WHERE is_active=1 AND id IN ($ids) AND last_seen_at>=DATE_SUB(NOW(),INTERVAL 20 SECOND)")->fetchAll(PDO::FETCH_ASSOC);$onlineMap=[];foreach($onlineRows as $row)$onlineMap[(int)$row['id']]=$row['username'];
        $peers=[];foreach($memberIds as $memberId)if($memberId!==$userId&&isset($onlineMap[$memberId]))$peers[]=['id'=>$memberId,'name'=>$onlineMap[$memberId]];
        if ($action === 'crew-voice-status') {
            $pdo->prepare('UPDATE users SET last_seen_at=NOW() WHERE id=?')->execute([$userId]);
            $iceServers=[['urls'=>'stun:stun.l.google.com:19302'],['urls'=>'stun:stun.cloudflare.com:3478']];
            $turnUrl=(string)(getenv('NAVE_TURN_URLS')?:''); $turnUser=(string)(getenv('NAVE_TURN_USERNAME')?:''); $turnPassword=(string)(getenv('NAVE_TURN_PASSWORD')?:'');
            if($turnUrl!==''&&$turnUser!==''&&$turnPassword!=='')$iceServers[]=['urls'=>array_map('trim',explode(',',$turnUrl)),'username'=>$turnUser,'credential'=>$turnPassword];
            mpResponse(['active'=>true,'shipId'=>$shipId,'userId'=>$userId,'role'=>$role,'hasCopilot'=>$hasCopilot,'peers'=>$peers,'iceServers'=>$iceServers]);
        }
        if (random_int(1,120)===1) $pdo->exec("DELETE FROM crew_voice_signals WHERE created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)");
        if ($action === 'crew-voice-signal') {
            if ($_SERVER['REQUEST_METHOD']!=='POST') mpResponse(['error'=>'Use POST para sinalizar o intercom.'],405);
            $input=mpInput(); $type=(string)($input['type']??''); $payload=$input['payload']??null; $peerId=(int)($input['peer_id']??0);
            if (!in_array($type,['offer','answer','ice','close'],true) || ($type!=='close' && !is_array($payload))) mpResponse(['error'=>'Sinal WebRTC inválido.'],400);
            $encoded=$payload===null?null:json_encode($payload,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
            if ($encoded!==null && strlen($encoded)>16000) mpResponse(['error'=>'Sinal WebRTC excede o limite.'],413);
            $stmt=$pdo->prepare('INSERT INTO crew_voice_signals(ship_id,sender_id,recipient_id,signal_type,payload) VALUES(?,?,?,?,?)');
            if($peerId===$userId||!in_array($peerId,$memberIds,true))mpResponse(['error'=>'Este jogador nao faz parte da tripulacao desta nave.'],403);
            $stmt->execute([$shipId,$userId,$peerId,$type,$encoded]); mpResponse(['ok'=>true]);
        }
        $q=$pdo->prepare("SELECT id,sender_id,signal_type,payload FROM crew_voice_signals WHERE ship_id=? AND recipient_id=? AND read_at IS NULL AND created_at>=DATE_SUB(NOW(),INTERVAL 1 MINUTE) ORDER BY id LIMIT 40");
        $q->execute([$shipId,$userId]); $signals=$q->fetchAll(PDO::FETCH_ASSOC);
        if ($signals) { $ids=array_map('intval',array_column($signals,'id')); $pdo->exec('UPDATE crew_voice_signals SET read_at=NOW() WHERE recipient_id='.$userId.' AND id IN ('.implode(',',$ids).')'); }
        foreach($signals as &$signal){$signal['sender_id']=(int)$signal['sender_id'];$signal['payload']=$signal['payload']?json_decode($signal['payload'],true):null;} unset($signal);
        mpResponse(['active'=>true,'shipId'=>$shipId,'signals'=>$signals]);
    }

    if ($action === 'call-socket-token') {
        mpResponse(['token' => callSocketIssueToken($userId), 'expires_in' => 90]);
    }

    if ($action === 'rare-asteroids') {
        ensureRareAsteroids($pdo);
        $shipQuery = $pdo->prepare(
            "SELECT s.pos_x,s.pos_z FROM ships s
             LEFT JOIN ship_crew crew ON crew.ship_id=s.id AND crew.copilot_id=? AND crew.status='active'
             WHERE ((s.user_id=? AND NOT EXISTS (SELECT 1 FROM ship_crew own_crew WHERE own_crew.copilot_id=? AND own_crew.status='active')) OR crew.ship_id=s.id)
               AND s.is_active=1 AND s.hull_hp>0 LIMIT 1"
        );
        $shipQuery->execute([$userId,$userId,$userId]);
        $shipPosition=$shipQuery->fetch(PDO::FETCH_ASSOC);
        if (!$shipPosition) mpResponse(['error'=>'Nave não encontrada.'],404);
        $asteroidsQuery=$pdo->query("SELECT code,iron_kg,nickel_kg,cobalt_kg FROM asteroids WHERE LEFT(code,5)='rare_' AND is_visible=1 AND is_depleted=0 ORDER BY code");
        $rare=[]; $now=microtime(true);
        foreach ($asteroidsQuery->fetchAll(PDO::FETCH_ASSOC) as $asteroid) {
            if (!preg_match('/^rare_(\d{3})$/',(string)$asteroid['code'],$match)) continue;
            $number=(int)$match[1]; $motion=rareAsteroidMotion($number,$now);
            $distance=hypot($motion['x']-(float)$shipPosition['pos_x'],$motion['z']-(float)$shipPosition['pos_z']);
            if ($distance>108000) continue;
            $rare[]=[
                'id'=>'asteroide_raro_'.sprintf('%03d',$number),'code'=>$asteroid['code'],'name'=>'Asteroide rico em minério',
                'type'=>'Asteroide','x'=>$motion['x'],'y'=>0,'z'=>$motion['z'],'r'=>92,'color'=>'#d9a95e',
                'texture'=>'rock','rare'=>true,'moving'=>$motion['moving'],'vx'=>$motion['vx'],'vz'=>$motion['vz'],
                'phaseRemaining'=>$motion['phaseRemaining'],'distance'=>$distance,
                'remaining'=>['Ferro'=>(int)$asteroid['iron_kg'],'Niquel'=>(int)$asteroid['nickel_kg'],'Cobalto'=>(int)$asteroid['cobalt_kg']]
            ];
        }
        mpResponse(['asteroids'=>$rare,'serverTime'=>$now]);
    }

    if ($action === 'rare-mine') {
        if ($_SERVER['REQUEST_METHOD']!=='POST') mpResponse(['error'=>'Use POST para minerar.'],405);
        ensureRareAsteroids($pdo);
        $code=(string)(mpInput()['code']??'');
        if (!preg_match('/^rare_(\d{3})$/',$code,$match) || (int)$match[1]<1 || (int)$match[1]>RARE_ASTEROID_COUNT) mpResponse(['error'=>'Asteroide raro inválido.'],400);
        $motion=rareAsteroidMotion((int)$match[1]);
        if ($motion['moving']) mpResponse(['error'=>'O asteroide raro está em trânsito de alta velocidade. Aguarde ele parar.'],409);
        $pdo->beginTransaction();
        $shipQuery=$pdo->prepare(
            "SELECT s.id,s.user_id,s.pos_x,s.pos_z,s.hull_hp,s.docked_station_id,s.iron_kg,s.nickel_kg,s.cobalt_kg,s.cargo_capacity_kg,s.fuel_units,
                    (SELECT COALESCE(SUM(e.weight_kg),0) FROM ship_equipment se JOIN equipment e ON e.id=se.equipment_id WHERE se.ship_id=s.id AND se.is_equipped=1 AND se.quantity>0) AS equipment_weight
             FROM ships s LEFT JOIN ship_crew crew ON crew.ship_id=s.id AND crew.copilot_id=? AND crew.status='active'
             WHERE ((s.user_id=? AND NOT EXISTS (SELECT 1 FROM ship_crew own_crew WHERE own_crew.copilot_id=? AND own_crew.status='active')) OR crew.ship_id=s.id)
               AND s.is_active=1 LIMIT 1 FOR UPDATE"
        );
        $shipQuery->execute([$userId,$userId,$userId]); $ship=$shipQuery->fetch(PDO::FETCH_ASSOC);
        $asteroidQuery=$pdo->prepare('SELECT iron_kg,nickel_kg,cobalt_kg,is_depleted FROM asteroids WHERE code=? AND is_visible=1 FOR UPDATE');
        $asteroidQuery->execute([$code]); $asteroid=$asteroidQuery->fetch(PDO::FETCH_ASSOC);
        if (!$ship || !$asteroid || (int)$ship['hull_hp']<1 || $ship['docked_station_id']!==null) { $pdo->rollBack(); mpResponse(['error'=>'Nave ou asteroide indisponível para mineração.'],409); }
        $motion=rareAsteroidMotion((int)$match[1]);
        if ($motion['moving']) { $pdo->rollBack(); mpResponse(['error'=>'O asteroide raro iniciou o salto. Aguarde a próxima parada de dois minutos.'],409); }
        $distance=hypot((float)$ship['pos_x']-$motion['x'],(float)$ship['pos_z']-$motion['z']);
        if ($distance>1800) { $pdo->rollBack(); mpResponse(['error'=>'O asteroide saiu do alcance de mineração.'],409); }
        $available=(int)$asteroid['iron_kg']+(int)$asteroid['nickel_kg']+(int)$asteroid['cobalt_kg'];
        if ((int)$asteroid['is_depleted'] || $available<1) { $pdo->rollBack(); mpResponse(['error'=>'Este asteroide raro já foi minerado por completo.'],409); }
        $free=max(0,(int)$ship['cargo_capacity_kg']-(int)$ship['iron_kg']-(int)$ship['nickel_kg']-(int)$ship['cobalt_kg']-(int)$ship['equipment_weight']-(int)ceil((float)$ship['fuel_units']*.5));
        if ($free<1) { $pdo->rollBack(); mpResponse(['error'=>'Compartimento de carga cheio.'],409); }
        $iron=min($free,(int)$asteroid['iron_kg'],random_int(90,210)); $free-=$iron;
        $nickel=min($free,(int)$asteroid['nickel_kg'],random_int(15,45)); $free-=$nickel;
        $cobalt=min($free,(int)$asteroid['cobalt_kg'],random_int(5,18));
        $depleted=($available-$iron-$nickel-$cobalt)<=0;
        $pdo->prepare('UPDATE asteroids SET iron_kg=iron_kg-?,nickel_kg=nickel_kg-?,cobalt_kg=cobalt_kg-?,is_depleted=? WHERE code=?')
            ->execute([$iron,$nickel,$cobalt,(int)$depleted,$code]);
        $pdo->prepare('UPDATE ships SET iron_kg=iron_kg+?,nickel_kg=nickel_kg+?,cobalt_kg=cobalt_kg+? WHERE id=?')->execute([$iron,$nickel,$cobalt,(int)$ship['id']]);
        $remainingQuery=$pdo->prepare('SELECT iron_kg,nickel_kg,cobalt_kg FROM asteroids WHERE code=?'); $remainingQuery->execute([$code]); $remaining=$remainingQuery->fetch(PDO::FETCH_ASSOC);
        $pdo->commit();
        $cargo=['Ferro'=>(int)$ship['iron_kg']+$iron,'Niquel'=>(int)$ship['nickel_kg']+$nickel,'Cobalto'=>(int)$ship['cobalt_kg']+$cobalt];
        mpResponse(['ok'=>true,'cargo'=>$cargo,'gained'=>['Ferro'=>$iron,'Niquel'=>$nickel,'Cobalto'=>$cobalt],
            'remaining'=>['Ferro'=>(int)$remaining['iron_kg'],'Niquel'=>(int)$remaining['nickel_kg'],'Cobalto'=>(int)$remaining['cobalt_kg']],
            'depleted'=>array_sum(array_map('intval',$remaining))===0]);
    }

    if ($action === 'ice-asteroids') {
        ensureIceAsteroids($pdo);
        $shipQuery=$pdo->prepare("SELECT s.pos_x,s.pos_z FROM ships s LEFT JOIN ship_crew crew ON crew.ship_id=s.id AND crew.copilot_id=? AND crew.status='active' WHERE ((s.user_id=? AND NOT EXISTS (SELECT 1 FROM ship_crew own_crew WHERE own_crew.copilot_id=? AND own_crew.status='active')) OR crew.ship_id=s.id) AND s.is_active=1 LIMIT 1");
        $shipQuery->execute([$userId,$userId,$userId]); $ship=$shipQuery->fetch(PDO::FETCH_ASSOC);
        if (!$ship) mpResponse(['error'=>'Nave não encontrada.'],404);
        $query=$pdo->query("SELECT code,pos_x,pos_z,radius,color,ice_kg FROM asteroids WHERE LEFT(code,4)='ice_' AND is_visible=1 AND is_depleted=0 ORDER BY code");
        $result=[];
        foreach ($query->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $distance=hypot((float)$row['pos_x']-(float)$ship['pos_x'],(float)$row['pos_z']-(float)$ship['pos_z']);
            if ($distance>99000) continue;
            $number=(int)substr((string)$row['code'],4);
            $result[]=['id'=>'asteroide_gelo_'.sprintf('%03d',$number),'code'=>$row['code'],'name'=>'Asteroide gelado','type'=>'Asteroide','x'=>(float)$row['pos_x'],'y'=>0,'z'=>(float)$row['pos_z'],'r'=>(int)$row['radius'],'color'=>$row['color'],'texture'=>'ice','ice'=>true,'moving'=>false,'distance'=>$distance,'remainingIce'=>(int)$row['ice_kg']];
        }
        mpResponse(['asteroids'=>$result]);
    }

    if ($action === 'ice-mine') {
        if ($_SERVER['REQUEST_METHOD']!=='POST') mpResponse(['error'=>'Use POST para coletar gelo.'],405);
        ensureIceAsteroids($pdo);
        $code=(string)(mpInput()['code']??'');
        if (!preg_match('/^ice_(\d{3})$/',$code,$match)||(int)$match[1]<1||(int)$match[1]>ICE_ASTEROID_COUNT) mpResponse(['error'=>'Asteroide de gelo inválido.'],400);
        $position=iceAsteroidPosition((int)$match[1]); $pdo->beginTransaction();
        $shipQuery=$pdo->prepare("SELECT s.id,s.pos_x,s.pos_z,s.hull_hp,s.docked_station_id,s.iron_kg,s.nickel_kg,s.cobalt_kg,s.ice_kg,s.cargo_capacity_kg,s.fuel_units,(SELECT COALESCE(SUM(e.weight_kg),0) FROM ship_equipment se JOIN equipment e ON e.id=se.equipment_id WHERE se.ship_id=s.id AND se.is_equipped=1 AND se.quantity>0) AS equipment_weight FROM ships s LEFT JOIN ship_crew crew ON crew.ship_id=s.id AND crew.copilot_id=? AND crew.status='active' WHERE ((s.user_id=? AND NOT EXISTS (SELECT 1 FROM ship_crew own_crew WHERE own_crew.copilot_id=? AND own_crew.status='active')) OR crew.ship_id=s.id) AND s.is_active=1 LIMIT 1 FOR UPDATE");
        $shipQuery->execute([$userId,$userId,$userId]); $ship=$shipQuery->fetch(PDO::FETCH_ASSOC);
        $asteroidQuery=$pdo->prepare('SELECT ice_kg,is_depleted FROM asteroids WHERE code=? AND is_visible=1 FOR UPDATE'); $asteroidQuery->execute([$code]); $asteroid=$asteroidQuery->fetch(PDO::FETCH_ASSOC);
        if (!$ship||!$asteroid||(int)$ship['hull_hp']<1||$ship['docked_station_id']!==null) { $pdo->rollBack(); mpResponse(['error'=>'Nave ou asteroide de gelo indisponível.'],409); }
        if (hypot((float)$ship['pos_x']-$position['x'],(float)$ship['pos_z']-$position['z'])>1800) { $pdo->rollBack(); mpResponse(['error'=>'Aproxime-se a até 1.800 km para extrair gelo.'],409); }
        if ((int)$asteroid['is_depleted']||(int)$asteroid['ice_kg']<1) { $pdo->rollBack(); mpResponse(['error'=>'O gelo deste asteroide já foi coletado.'],409); }
        $free=max(0,(int)$ship['cargo_capacity_kg']-(int)$ship['iron_kg']-(int)$ship['nickel_kg']-(int)$ship['cobalt_kg']-(int)$ship['ice_kg']-(int)$ship['equipment_weight']-(int)ceil((float)$ship['fuel_units']*.5));
        $gained=min($free,(int)$asteroid['ice_kg'],random_int(120,320));
        if ($gained<1) { $pdo->rollBack(); mpResponse(['error'=>'Compartimento de carga cheio.'],409); }
        $depleted=(int)$asteroid['ice_kg']<=$gained;
        $pdo->prepare('UPDATE asteroids SET ice_kg=ice_kg-?,is_depleted=? WHERE code=?')->execute([$gained,(int)$depleted,$code]);
        $pdo->prepare('UPDATE ships SET ice_kg=ice_kg+? WHERE id=?')->execute([$gained,(int)$ship['id']]);
        $pdo->commit();
        mpResponse(['ok'=>true,'gained'=>$gained,'cargo'=>['Ferro'=>(int)$ship['iron_kg'],'Niquel'=>(int)$ship['nickel_kg'],'Cobalto'=>(int)$ship['cobalt_kg'],'Gelo'=>(int)$ship['ice_kg']+$gained],'remainingIce'=>(int)$asteroid['ice_kg']-$gained,'depleted'=>$depleted]);
    }

    if ($action === 'moon-ice-mine') {
        if ($_SERVER['REQUEST_METHOD']!=='POST') mpResponse(['error'=>'Use POST para extrair gelo da lua.'],405);
        $bodyCode=(string)(mpInput()['body_code']??'');
        if (!in_array($bodyCode,ICE_SOURCE_MOONS,true)) mpResponse(['error'=>'Esta lua não possui uma reserva acessível de gelo.'],403);
        $catalog=require __DIR__.'/world-catalog.php'; $body=null;
        foreach ($catalog['bodies'] as $candidate) if ($candidate['id']===$bodyCode&&($candidate['iceSource']??false)) { $body=$candidate; break; }
        if (!$body) mpResponse(['error'=>'Lua gelada não encontrada no catálogo.'],404);
        ensureMoonIceReserves($pdo); $pdo->beginTransaction();
        $shipQuery=$pdo->prepare("SELECT s.id,s.pos_x,s.pos_z,s.hull_hp,s.docked_station_id,s.iron_kg,s.nickel_kg,s.cobalt_kg,s.ice_kg,s.cargo_capacity_kg,s.fuel_units,(SELECT COALESCE(SUM(e.weight_kg),0) FROM ship_equipment se JOIN equipment e ON e.id=se.equipment_id WHERE se.ship_id=s.id AND se.is_equipped=1 AND se.quantity>0) AS equipment_weight FROM ships s LEFT JOIN ship_crew crew ON crew.ship_id=s.id AND crew.copilot_id=? AND crew.status='active' WHERE ((s.user_id=? AND NOT EXISTS (SELECT 1 FROM ship_crew own_crew WHERE own_crew.copilot_id=? AND own_crew.status='active')) OR crew.ship_id=s.id) AND s.is_active=1 LIMIT 1 FOR UPDATE");
        $shipQuery->execute([$userId,$userId,$userId]); $ship=$shipQuery->fetch(PDO::FETCH_ASSOC);
        $reserveQuery=$pdo->prepare('SELECT ice_kg FROM celestial_resources WHERE body_code=? FOR UPDATE'); $reserveQuery->execute([$bodyCode]); $reserve=$reserveQuery->fetch(PDO::FETCH_ASSOC);
        if (!$ship||!$reserve||(int)$ship['hull_hp']<1||$ship['docked_station_id']!==null) { $pdo->rollBack(); mpResponse(['error'=>'Nave ou lua indisponível para extração.'],409); }
        if (hypot((float)$ship['pos_x']-(float)$body['x'],(float)$ship['pos_z']-(float)$body['z'])>1800) { $pdo->rollBack(); mpResponse(['error'=>'Aproxime-se a até 1.800 km da lua para extrair gelo.'],409); }
        $free=max(0,(int)$ship['cargo_capacity_kg']-(int)$ship['iron_kg']-(int)$ship['nickel_kg']-(int)$ship['cobalt_kg']-(int)$ship['ice_kg']-(int)$ship['equipment_weight']-(int)ceil((float)$ship['fuel_units']*.5));
        $gained=min($free,(int)$reserve['ice_kg'],random_int(120,320));
        if ($gained<1) { $pdo->rollBack(); mpResponse(['error'=>'Compartimento cheio ou reserva lunar esgotada.'],409); }
        $pdo->prepare('UPDATE celestial_resources SET ice_kg=ice_kg-? WHERE body_code=?')->execute([$gained,$bodyCode]);
        $pdo->prepare('UPDATE ships SET ice_kg=ice_kg+? WHERE id=?')->execute([$gained,(int)$ship['id']]);
        $pdo->commit();
        mpResponse(['ok'=>true,'gained'=>$gained,'body'=>$body['name'],'cargo'=>['Ferro'=>(int)$ship['iron_kg'],'Niquel'=>(int)$ship['nickel_kg'],'Cobalto'=>(int)$ship['cobalt_kg'],'Gelo'=>(int)$ship['ice_kg']+$gained],'remainingIce'=>(int)$reserve['ice_kg']-$gained]);
    }

    if ($action === 'state') {
        $shipQuery = $pdo->prepare(
            "SELECT s.*, u.username, u.credits, e.code AS equipped_code, se.ammo_current, e.ammo_capacity AS equipped_capacity
             FROM ships s
             JOIN users u ON u.id = s.user_id
             LEFT JOIN ship_equipment se ON se.ship_id = s.id AND se.is_equipped = 1 AND EXISTS (SELECT 1 FROM equipment weapon_slot WHERE weapon_slot.id=se.equipment_id AND weapon_slot.equipment_type='weapon')
             LEFT JOIN equipment e ON e.id = se.equipment_id AND e.equipment_type='weapon'
             LEFT JOIN ship_crew crew ON crew.ship_id=s.id AND crew.copilot_id=? AND crew.status='active'
             WHERE ((s.user_id = ? AND NOT EXISTS (SELECT 1 FROM ship_crew own_crew WHERE own_crew.copilot_id=? AND own_crew.status='active')) OR crew.ship_id=s.id) AND s.is_active = 1 LIMIT 1"
        );
        $shipQuery->execute([$userId,$userId,$userId]);
        $ship = $shipQuery->fetch();
        if ($ship) { $roleQuery=$pdo->prepare("SELECT captain_id FROM ship_crew WHERE ship_id=? AND copilot_id=? AND status='active'"); $roleQuery->execute([(int)$ship['id'],$userId]); $captainId=$roleQuery->fetchColumn(); $ship['crew_role']=$captainId?'copilot':'pilot'; if($captainId) $_SESSION['crew_cargo_baseline'][(int)$ship['id']]=['Ferro'=>(int)$ship['iron_kg'],'Niquel'=>(int)$ship['nickel_kg'],'Cobalto'=>(int)$ship['cobalt_kg'],'Gelo'=>(int)$ship['ice_kg']]; }
        if (!$ship) {
            mpResponse(['error' => 'A nave desta conta não foi encontrada.'], 404);
        }

        mpEnsureTowSystem($pdo);
        $ownedQuery = $pdo->prepare(
            'SELECT e.code FROM ship_equipment se JOIN equipment e ON e.id = se.equipment_id WHERE se.ship_id = ? AND se.quantity > 0'
        );
        $ownedQuery->execute([(int)$ship['id']]);
        $ownedCodes = $ownedQuery->fetchAll(PDO::FETCH_COLUMN);
        $towQuery=$pdo->prepare("SELECT se.is_equipped,e.weight_kg FROM ship_equipment se JOIN equipment e ON e.id=se.equipment_id WHERE se.ship_id=? AND e.code='tractor_array' AND se.quantity>0 LIMIT 1");
        $towQuery->execute([(int)$ship['id']]); $tow=$towQuery->fetch(PDO::FETCH_ASSOC)?:null;
        $codeToKind = ['pulse_cannon' => 'pulse', 'ion_cannon' => 'ion', 'heavy_plasma_cannon' => 'heavy', 'singularity_cannon' => 'singularity'];
        $owned = [];
        foreach ($ownedCodes as $code) {
            if (isset($codeToKind[$code])) $owned[] = $codeToKind[$code];
        }
        $selectedCode=(string)($ship['selected_weapon_code']??'pulse_cannon');
        $selectedQuery=$pdo->prepare('SELECT e.code,se.ammo_current,e.ammo_capacity,e.weight_kg FROM ship_equipment se JOIN equipment e ON e.id=se.equipment_id WHERE se.ship_id=? AND e.code=? AND se.quantity>0 LIMIT 1');
        $selectedQuery->execute([(int)$ship['id'],$selectedCode]); $selected=$selectedQuery->fetch(PDO::FETCH_ASSOC);
        if (!$selected) {
            $selectedQuery=$pdo->prepare("SELECT e.code,se.ammo_current,e.ammo_capacity,e.weight_kg FROM ship_equipment se JOIN equipment e ON e.id=se.equipment_id WHERE se.ship_id=? AND se.quantity>0 AND e.equipment_type='weapon' ORDER BY se.acquired_at LIMIT 1");
            $selectedQuery->execute([(int)$ship['id']]); $selected=$selectedQuery->fetch(PDO::FETCH_ASSOC);
        }
        $activeCode=(string)($ship['equipped_code']??'');
        if ($activeCode!=='') { $activeQuery=$pdo->prepare('SELECT e.code,se.ammo_current,e.ammo_capacity,e.weight_kg FROM ship_equipment se JOIN equipment e ON e.id=se.equipment_id WHERE se.ship_id=? AND e.code=? AND se.is_equipped=1 LIMIT 1'); $activeQuery->execute([(int)$ship['id'],$activeCode]); $selected=$activeQuery->fetch(PDO::FETCH_ASSOC) ?: $selected; }
        $equippedKind = $codeToKind[$activeCode!==''?$activeCode:($selected['code']??$selectedCode)] ?? 'pulse';
        $upgraded = in_array('pulse_capacitor_mk2', $ownedCodes, true);
        $damage = $equippedKind === 'pulse' && $upgraded ? 10 : (['pulse' => 5, 'ion' => 25, 'heavy' => 55, 'singularity' => 150][$equippedKind]);
        if (($ship['ship_class']??'explorer')==='attack' && $activeCode!=='') $damage=(int)round($damage*1.35);
        $pdo->prepare('UPDATE users SET last_seen_at = NOW() WHERE id = ?')->execute([$userId]);

        mpResponse([
            'id' => (int)$ship['id'], 'name' => $ship['ship_name'], 'shipClass' => (string)$ship['ship_class'], 'cargoCapacity' => (int)$ship['cargo_capacity_kg'], 'fuelCapacity' => (int)$ship['fuel_capacity_units'], 'username' => $ship['username'], 'role' => $ship['crew_role'] ?? 'pilot', 'stationId' => (int)($ship['docked_station_id'] ?? 0),
            'x' => (float)$ship['pos_x'], 'y' => (float)$ship['pos_y'], 'z' => (float)$ship['pos_z'],
            'yaw' => (float)$ship['heading'], 'roll' => (float)$ship['roll'],
            'energy' => (int)$ship['energy_units'], 'fuel' => (float)$ship['fuel_units'], 'hull' => (int)$ship['hull_hp'],
            'credits' => (int)$ship['credits'],
            'cargo' => ['Ferro' => (int)$ship['iron_kg'], 'Niquel' => (int)$ship['nickel_kg'], 'Cobalto' => (int)$ship['cobalt_kg'], 'Gelo' => (int)$ship['ice_kg']],
            'weapon' => [
                'installed' => $activeCode!=='' && (string)$ship['ship_class']!=='freighter', 'kind' => $equippedKind, 'owned' => array_values(array_unique($owned)),
                'damage' => $damage, 'ammo' => (int)($selected['ammo_current'] ?? 0), 'maxAmmo' => (int)($selected['ammo_capacity'] ?? 90), 'weightKg' => $activeCode!==''?(int)($selected['weight_kg']??0):0, 'upgraded' => $upgraded
            ],
            'tow' => ['owned'=>(bool)$tow,'installed'=>(bool)($tow['is_equipped']??false),'weightKg'=>(int)($tow['weight_kg']??0)],
            'destroyedAsteroids' => []
        ]);
    }

    if ($action === 'sync') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error' => 'Use POST para sincronizar a nave.'], 405);
        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data)) mpResponse(['error' => 'Dados de nave inválidos.'], 400);
        foreach (['x', 'z', 'yaw'] as $field) {
            if (!isset($data[$field]) || !is_numeric($data[$field]) || !is_finite((float)$data[$field])) {
                mpResponse(['error' => 'Coordenada inválida.'], 400);
            }
        }
        $x = max(-450000, min(450000, (float)$data['x']));
        $z = max(-450000, min(450000, (float)$data['z']));
        $yaw = fmod((float)$data['yaw'], M_PI * 2);
        $cargo = is_array($data['cargo'] ?? null) ? $data['cargo'] : [];
        $iron = max(0, min(1000000, (int)($cargo['Ferro'] ?? 0)));
        $nickel = max(0, min(1000000, (int)($cargo['Niquel'] ?? 0)));
        $cobalt = max(0, min(1000000, (int)($cargo['Cobalto'] ?? 0)));
        $ice = max(0, min(1000000, (int)($cargo['Gelo'] ?? 0)));
        $energy = max(0, min(1000000, (int)($data['energy'] ?? 0)));
        $fuelInput = max(0,(float)($data['fuel']??1000));
        $credits = max(0, min(1000000000, (int)($data['credits'] ?? 0)));
        $weapon = is_array($data['weapon'] ?? null) ? $data['weapon'] : [];
        $kind = in_array($weapon['kind'] ?? '', ['pulse', 'ion', 'heavy', 'singularity'], true) ? $weapon['kind'] : 'pulse';
        $owned = is_array($weapon['owned'] ?? null) ? array_values(array_unique(array_filter($weapon['owned'], fn($item) => is_string($item) && in_array($item, ['pulse', 'ion', 'heavy', 'singularity'], true)))) : [];
        if (!empty($weapon['installed']) && !$owned) $owned[] = $kind;
        $ammo = max(0, min($kind === 'singularity' ? 30 : 90, (int)($weapon['ammo'] ?? 0)));
        $equippedCodes = ['pulse' => 'pulse_cannon', 'ion' => 'ion_cannon', 'heavy' => 'heavy_plasma_cannon', 'singularity' => 'singularity_cannon'];
        $crewShipQuery=$pdo->prepare("SELECT s.id,s.pos_x,s.pos_z,s.heading,sc.captain_id FROM ship_crew sc JOIN ships s ON s.id=sc.ship_id WHERE sc.copilot_id=? AND sc.status='active' LIMIT 1");
        $crewShipQuery->execute([$userId]); $crewShip=$crewShipQuery->fetch(PDO::FETCH_ASSOC);
        if ($crewShip) {
            $shipId=(int)$crewShip['id'];
            $currentQuery=$pdo->prepare('SELECT iron_kg,nickel_kg,cobalt_kg,ice_kg,fuel_units,cargo_capacity_kg FROM ships WHERE id=?'); $currentQuery->execute([$shipId]); $current=$currentQuery->fetch(PDO::FETCH_ASSOC) ?: ['iron_kg'=>0,'nickel_kg'=>0,'cobalt_kg'=>0,'ice_kg'=>0];
            $baseline=$_SESSION['crew_cargo_baseline'][$shipId] ?? ['Ferro'=>(int)$current['iron_kg'],'Niquel'=>(int)$current['nickel_kg'],'Cobalto'=>(int)$current['cobalt_kg'],'Gelo'=>(int)$current['ice_kg']];
            $deltas=['Ferro'=>max(0,$iron-(int)$baseline['Ferro']),'Niquel'=>max(0,$nickel-(int)$baseline['Niquel']),'Cobalto'=>max(0,$cobalt-(int)$baseline['Cobalto']),'Gelo'=>max(0,$ice-(int)$baseline['Gelo'])];
            $weightQuery=$pdo->prepare('SELECT COALESCE(SUM(e.weight_kg),0) FROM ship_equipment se JOIN equipment e ON e.id=se.equipment_id WHERE se.ship_id=? AND se.is_equipped=1 AND se.quantity>0'); $weightQuery->execute([$shipId]);
            $free=max(0,(int)$current['cargo_capacity_kg']-(int)$weightQuery->fetchColumn()-(int)ceil((float)$current['fuel_units']*0.5)-(int)$current['iron_kg']-(int)$current['nickel_kg']-(int)$current['cobalt_kg']-(int)$current['ice_kg']);
            $accepted=[]; foreach(['Ferro'=>'iron_kg','Niquel'=>'nickel_kg','Cobalto'=>'cobalt_kg','Gelo'=>'ice_kg'] as $mineral=>$column){$accepted[$column]=min($free,$deltas[$mineral]);$free-=$accepted[$column];}
            $pdo->prepare('UPDATE ships SET iron_kg=iron_kg+?,nickel_kg=nickel_kg+?,cobalt_kg=cobalt_kg+?,ice_kg=ice_kg+? WHERE id=?')->execute([$accepted['iron_kg'],$accepted['nickel_kg'],$accepted['cobalt_kg'],$accepted['ice_kg'],$shipId]);
            $_SESSION['crew_cargo_baseline'][$shipId]=['Ferro'=>$iron,'Niquel'=>$nickel,'Cobalto'=>$cobalt,'Gelo'=>$ice];
            $pdo->prepare('UPDATE users SET last_seen_at=NOW() WHERE id=?')->execute([$userId]);
            mpResponse(['ok'=>true,'role'=>'copilot','acceptedCargo'=>$accepted,'x'=>(float)$crewShip['pos_x'],'z'=>(float)$crewShip['pos_z'],'yaw'=>(float)$crewShip['heading']]);
        }
        $pdo->beginTransaction();
        $findShip = $pdo->prepare('SELECT id,hull_hp,fuel_capacity_units,ship_class FROM ships WHERE user_id = ? AND is_active = 1 LIMIT 1 FOR UPDATE');
        $findShip->execute([$userId]);
        $foundShip = $findShip->fetch(PDO::FETCH_ASSOC);
        $shipId = (int)($foundShip['id'] ?? 0);
        $fuel = min((int)($foundShip['fuel_capacity_units']??1000),$fuelInput);
        if (($foundShip['ship_class']??'')==='freighter') { $owned=[]; $weapon['installed']=false; $kind='pulse'; $ammo=0; }
        if ($shipId && (int)$foundShip['hull_hp'] <= 0) {
            $pdo->prepare('UPDATE users SET last_seen_at=NOW() WHERE id=?')->execute([$userId]);
            $pdo->commit();
            mpResponse(['ok' => true, 'destroyed' => true, 'hull' => 0]);
        }
        if (!$shipId) {
            $pdo->prepare('INSERT INTO ships (user_id, ship_name) VALUES (?, ?)')->execute([$userId, 'Nave de ' . ($_SESSION['username'] ?? 'piloto')]);
            $shipId = (int)$pdo->lastInsertId();
        }
        $rescueLock=$pdo->prepare("SELECT id FROM ship_rescue_requests WHERE target_ship_id=? AND status='active' LIMIT 1"); $rescueLock->execute([$shipId]); if($rescueLock->fetchColumn()){ $pdo->prepare('UPDATE users SET last_seen_at=NOW() WHERE id=?')->execute([$userId]); $pdo->commit(); mpResponse(['ok'=>true,'beingTowed'=>true,'hull'=>(int)$foundShip['hull_hp']]); }
        $pdo->prepare('UPDATE ships SET pos_x=IF(docked_station_id IS NULL,?,pos_x), pos_y=IF(docked_station_id IS NULL,0,pos_y), pos_z=IF(docked_station_id IS NULL,?,pos_z), heading=IF(docked_station_id IS NULL,?,heading), pitch=IF(docked_station_id IS NULL,0,pitch), roll=IF(docked_station_id IS NULL,?,roll), speed=IF(docked_station_id IS NULL,0,speed), iron_kg=?, nickel_kg=?, cobalt_kg=?, ice_kg=?, energy_units=?, fuel_units=LEAST(fuel_units,?), selected_weapon_code=?, is_active=1 WHERE id=? AND user_id=?')
            ->execute([$x, $z, $yaw, (float)($data['roll'] ?? 0), $iron, $nickel, $cobalt, $ice, $energy, $fuel, $equippedCodes[$kind], $shipId, $userId]);
        $pdo->prepare('UPDATE users SET last_seen_at=NOW() WHERE id=?')->execute([$userId]);

        if (in_array('singularity', $owned, true)) {
            $legitQuery=$pdo->prepare("SELECT 1 FROM ship_equipment se JOIN equipment e ON e.id=se.equipment_id WHERE se.ship_id=? AND e.code='singularity_cannon' AND se.quantity>0 LIMIT 1");
            $legitQuery->execute([$shipId]);
            if (!$legitQuery->fetchColumn()) $owned=array_values(array_diff($owned,['singularity']));
        }
        $equipmentId = $pdo->prepare('SELECT id FROM equipment WHERE code = ? AND is_available = 1');
        $upsertOwned = $pdo->prepare(
            'INSERT INTO ship_equipment (ship_id,equipment_id,quantity,ammo_current,is_equipped) VALUES (?,?,1,?,?)
             ON DUPLICATE KEY UPDATE quantity=GREATEST(quantity,1), ammo_current=IF(VALUES(is_equipped)=1,VALUES(ammo_current),ammo_current), is_equipped=VALUES(is_equipped)'
        );
        $pdo->prepare("UPDATE ship_equipment se JOIN equipment e ON e.id=se.equipment_id SET se.is_equipped=0 WHERE se.ship_id=? AND e.equipment_type='weapon'")->execute([$shipId]);
        foreach ($owned as $ownedKind) {
            $code = $equippedCodes[$ownedKind];
            $equipmentId->execute([$code]);
            $id = (int)$equipmentId->fetchColumn();
            if ($id) $upsertOwned->execute([$shipId, $id, $weapon['installed'] && $ownedKind === $kind ? $ammo : 0, !empty($weapon['installed']) && $ownedKind === $kind ? 1 : 0]);
        }
        if (!empty($weapon['upgraded']) || (int)($weapon['damage'] ?? 0) === 10) {
            $equipmentId->execute(['pulse_capacitor_mk2']);
            $upgradeId = (int)$equipmentId->fetchColumn();
            if ($upgradeId) $upsertOwned->execute([$shipId, $upgradeId, 0, 0]);
        }
        $pdo->commit();
        mpResponse(['ok' => true]);
    }

    if ($action === 'cargo-jettison') {
        if ($_SERVER['REQUEST_METHOD']!=='POST') mpResponse(['error'=>'Use POST para descartar a carga.'],405);
        $input=mpInput();$cargo=is_array($input['cargo']??null)?$input['cargo']:[];$amounts=['iron'=>max(0,(int)($cargo['Ferro']??0)),'nickel'=>max(0,(int)($cargo['Niquel']??0)),'cobalt'=>max(0,(int)($cargo['Cobalto']??0))];
        if(array_sum($amounts)<1)mpResponse(['error'=>'Escolha ao menos 1 kg de minério para descartar.'],400);
        $pdo->beginTransaction();$shipQuery=$pdo->prepare('SELECT id,pos_x,pos_z,hull_hp,docked_station_id,iron_kg,nickel_kg,cobalt_kg FROM ships WHERE user_id=? AND is_active=1 LIMIT 1 FOR UPDATE');$shipQuery->execute([$userId]);$ship=$shipQuery->fetch(PDO::FETCH_ASSOC);
        if(!$ship||(int)$ship['hull_hp']<1){$pdo->rollBack();mpResponse(['error'=>'Sua nave precisa estar operacional para liberar carga.'],409);}
        if($ship['docked_station_id']!==null){$pdo->rollBack();mpResponse(['error'=>'Desacople a nave antes de descartar carga no espaço.'],409);}
        foreach(['iron'=>'iron_kg','nickel'=>'nickel_kg','cobalt'=>'cobalt_kg'] as $key=>$column)if($amounts[$key]>(int)$ship[$column]){$pdo->rollBack();mpResponse(['error'=>'A quantidade escolhida excede o minério disponível no compartimento.'],409);}
        $pdo->prepare('UPDATE ships SET iron_kg=iron_kg-?,nickel_kg=nickel_kg-?,cobalt_kg=cobalt_kg-? WHERE id=?')->execute([$amounts['iron'],$amounts['nickel'],$amounts['cobalt'],(int)$ship['id']]);
        $pdo->prepare("INSERT INTO ship_wrecks(destroyed_ship_id,owner_user_id,pos_x,pos_z,iron_kg,nickel_kg,cobalt_kg,energy_units,drop_type,expires_at) VALUES(NULL,?,?,?,?,?,?,0,'jettison',DATE_ADD(NOW(),INTERVAL 1 HOUR))")->execute([$userId,(float)$ship['pos_x'],(float)$ship['pos_z'],$amounts['iron'],$amounts['nickel'],$amounts['cobalt']]);$dropId=(int)$pdo->lastInsertId();$pdo->commit();
        mpResponse(['ok'=>true,'drop_id'=>$dropId,'cargo'=>['Ferro'=>$amounts['iron'],'Niquel'=>$amounts['nickel'],'Cobalto'=>$amounts['cobalt']],'expiresIn'=>3600]);
    }

    if ($action === 'combat-world') {
        mpEnsureTowSystem($pdo);
        $shipQuery = $pdo->prepare("SELECT s.id,s.user_id,s.pos_x,s.pos_z,s.hull_hp,s.docked_station_id FROM ships s LEFT JOIN ship_crew sc ON sc.ship_id=s.id AND sc.copilot_id=? AND sc.status='active' WHERE ((s.user_id=? AND NOT EXISTS (SELECT 1 FROM ship_crew own_crew WHERE own_crew.copilot_id=? AND own_crew.status='active')) OR sc.ship_id=s.id) AND s.is_active=1 LIMIT 1");
        $shipQuery->execute([$userId,$userId,$userId]);
        $ship = $shipQuery->fetch(PDO::FETCH_ASSOC);
        if (!$ship) mpResponse(['error' => 'Nave não encontrada.'], 404);
        $pdo->exec("DELETE FROM ship_wrecks WHERE (drop_type='jettison' AND expires_at<=NOW()) OR (drop_type='wreck' AND created_at<DATE_SUB(NOW(),INTERVAL 24 HOUR))");
        $wreckQuery = $pdo->prepare("SELECT w.id,w.destroyed_ship_id,w.owner_user_id,u.username,w.pos_x AS x,w.pos_z AS z,w.iron_kg,w.nickel_kg,w.cobalt_kg,w.energy_units,w.created_at,w.drop_type,w.expires_at,EXISTS(SELECT 1 FROM ship_tows tow WHERE tow.wreck_id=w.id AND tow.status='active') AS towing FROM ship_wrecks w JOIN users u ON u.id=w.owner_user_id WHERE w.claimed_by IS NULL AND ((w.drop_type='wreck' AND w.created_at>=DATE_SUB(NOW(),INTERVAL 24 HOUR)) OR (w.drop_type='jettison' AND w.expires_at>NOW())) AND ABS(w.pos_x-?)<=135000 AND ABS(w.pos_z-?)<=135000 ORDER BY w.id LIMIT 80");
        $wreckQuery->execute([(float)$ship['pos_x'],(float)$ship['pos_z']]);
        $wrecks = array_map(static fn($w) => ['id'=>(int)$w['id'],'destroyedShipId'=>(int)($w['destroyed_ship_id']??0),'owner'=>(int)$w['owner_user_id'],'username'=>$w['username'],'x'=>(float)$w['x'],'z'=>(float)$w['z'],'iron'=>(int)$w['iron_kg'],'nickel'=>(int)$w['nickel_kg'],'cobalt'=>(int)$w['cobalt_kg'],'energy'=>(int)$w['energy_units'],'dropType'=>$w['drop_type'],'towing'=>(bool)$w['towing'],'expiresAt'=>$w['expires_at'],'createdAt'=>$w['created_at']], $wreckQuery->fetchAll(PDO::FETCH_ASSOC));
        mpResponse(['hull'=>(int)$ship['hull_hp'],'x'=>(float)$ship['pos_x'],'z'=>(float)$ship['pos_z'],'stationId'=>(int)($ship['docked_station_id']??0),'wrecks'=>$wrecks]);
    }

    if ($action === 'ship-attack') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error' => 'Use POST para atacar.'], 405);
        $targetUserId = (int)(mpInput()['user_id'] ?? 0);
        if ($targetUserId < 1 || $targetUserId === $userId) mpResponse(['error' => 'Alvo inválido.'], 400);
        $crewAttackQuery=$pdo->prepare("SELECT captain_id FROM ship_crew WHERE copilot_id=? AND status='active' LIMIT 1"); $crewAttackQuery->execute([$userId]);
        $attackerUserId=(int)($crewAttackQuery->fetchColumn() ?: $userId);
        $pdo->beginTransaction();
        $shipsQuery = $pdo->prepare('SELECT id,user_id,pos_x,pos_z,hull_hp,ship_class,iron_kg,nickel_kg,cobalt_kg,energy_units,docked_station_id FROM ships WHERE user_id IN (?,?) AND is_active=1 ORDER BY user_id FOR UPDATE');
        $shipsQuery->execute([$attackerUserId,$targetUserId]);
        $ships = [];
        foreach ($shipsQuery->fetchAll(PDO::FETCH_ASSOC) as $row) $ships[(int)$row['user_id']] = $row;
        $attacker = $ships[$attackerUserId] ?? null;
        $target = $ships[$targetUserId] ?? null;
        if (!$attacker || !$target || (int)$attacker['id']===(int)$target['id'] || $attacker['docked_station_id'] !== null || $target['docked_station_id'] !== null || (int)$attacker['hull_hp'] < 1 || (int)$target['hull_hp'] < 1) mpResponse(['error'=>'Uma das naves não está disponível para combate.'], 409);
        $distance = hypot((float)$attacker['pos_x']-(float)$target['pos_x'],(float)$attacker['pos_z']-(float)$target['pos_z']);
        if ($distance > 25000) mpResponse(['error'=>'Alvo fora do alcance das armas (25.000 km).'], 409);
        $weaponQuery = $pdo->prepare("SELECT e.code,se.ammo_current FROM ship_equipment se JOIN equipment e ON e.id=se.equipment_id WHERE se.ship_id=? AND se.is_equipped=1 AND se.quantity>0 AND e.equipment_type='weapon' FOR UPDATE");
        $weaponQuery->execute([(int)$attacker['id']]);
        $weapon = $weaponQuery->fetch(PDO::FETCH_ASSOC);
        if (!$weapon || !in_array($weapon['code'],['pulse_cannon','ion_cannon','heavy_plasma_cannon','singularity_cannon'],true)) mpResponse(['error'=>'Equipe um canhão na estação antes de atacar.'], 409);
        if ((int)$weapon['ammo_current'] < 1) mpResponse(['error'=>'Munição esgotada.'], 409);
        $damage = ['pulse_cannon'=>5,'ion_cannon'=>25,'heavy_plasma_cannon'=>55,'singularity_cannon'=>150][$weapon['code']];
        if ($weapon['code']==='pulse_cannon') {
            $upgrade=$pdo->prepare("SELECT 1 FROM ship_equipment se JOIN equipment e ON e.id=se.equipment_id WHERE se.ship_id=? AND e.code='pulse_capacitor_mk2' AND se.quantity>0 LIMIT 1");
            $upgrade->execute([(int)$attacker['id']]);
            if ($upgrade->fetchColumn()) $damage=10;
        }
        if (($attacker['ship_class']??'explorer')==='attack') $damage=(int)round($damage*1.35);
        $pdo->prepare("UPDATE ship_equipment se JOIN equipment e ON e.id=se.equipment_id SET se.ammo_current=se.ammo_current-1 WHERE se.ship_id=? AND se.is_equipped=1 AND e.equipment_type='weapon'")->execute([(int)$attacker['id']]);
        $hull=max(0,(int)$target['hull_hp']-$damage);
        $wreckId=null;
        if ($hull===0) {
            $pdo->prepare('INSERT INTO ship_wrecks (destroyed_ship_id,owner_user_id,pos_x,pos_z,iron_kg,nickel_kg,cobalt_kg,energy_units) VALUES (?,?,?,?,?,?,?,?)')
                ->execute([(int)$target['id'],$targetUserId,(float)$target['pos_x'],(float)$target['pos_z'],25+(int)$target['iron_kg'],(int)$target['nickel_kg'],(int)$target['cobalt_kg'],50+(int)$target['energy_units']]);
            $wreckId=(int)$pdo->lastInsertId();
            $pdo->prepare('UPDATE ships SET hull_hp=0,iron_kg=0,nickel_kg=0,cobalt_kg=0,energy_units=0,speed=0 WHERE id=?')->execute([(int)$target['id']]);
            $memberIds=[$targetUserId];
            $crewMembers=$pdo->prepare("SELECT captain_id,copilot_id FROM ship_crew WHERE ship_id=? AND status='active'");
            $crewMembers->execute([(int)$target['id']]);
            $crew=$crewMembers->fetch(PDO::FETCH_ASSOC);
            if($crew){$memberIds[]=(int)$crew['captain_id'];$memberIds[]=(int)$crew['copilot_id'];}
            $passengerMembers=$pdo->prepare("SELECT passenger_id FROM ship_passengers WHERE ship_id=? AND status='active'");
            $passengerMembers->execute([(int)$target['id']]);
            foreach($passengerMembers->fetchAll(PDO::FETCH_COLUMN) as $passengerId)$memberIds[]=(int)$passengerId;
            $memberIds=array_values(array_unique(array_filter($memberIds,static fn($id)=>$id>0)));
            if($memberIds){$placeholders=implode(',',array_fill(0,count($memberIds),'?'));$pdo->prepare("UPDATE station_occupants SET station_id=(SELECT id FROM space_stations WHERE is_active=1 AND hull_hp>0 ORDER BY POW(pos_x-?,2)+POW(pos_z-?,2),id LIMIT 1),mode='station',ship_id=NULL WHERE user_id IN ($placeholders) AND mode='aboard'")->execute(array_merge([(float)$target['pos_x'],(float)$target['pos_z']],$memberIds));}
            $pdo->prepare("DELETE FROM ship_crew WHERE ship_id=?")->execute([(int)$target['id']]);
            $pdo->prepare("UPDATE ship_passengers SET status='cancelled' WHERE ship_id=? AND status='active'")->execute([(int)$target['id']]);
        } else $pdo->prepare('UPDATE ships SET hull_hp=? WHERE id=?')->execute([$hull,(int)$target['id']]);
        $ammoQuery=$pdo->prepare("SELECT se.ammo_current FROM ship_equipment se JOIN equipment e ON e.id=se.equipment_id WHERE se.ship_id=? AND se.is_equipped=1 AND e.equipment_type='weapon' LIMIT 1");
        $ammoQuery->execute([(int)$attacker['id']]);
        $ammo=(int)$ammoQuery->fetchColumn();
        $pdo->commit();
        mpResponse(['ok'=>true,'damage'=>$damage,'hull'=>$hull,'ammo'=>$ammo,'destroyed'=>$hull===0,'wreckId'=>$wreckId,'distance'=>round($distance)]);
    }

    if ($action === 'loot-claim') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error'=>'Use POST para recolher o destroço.'],405);
        $wreckId=(int)(mpInput()['wreck_id'] ?? 0);
        if ($wreckId<1) mpResponse(['error'=>'Destroço inválido.'],400);
        $pdo->beginTransaction();
        $shipQuery=$pdo->prepare("SELECT s.id,s.user_id,s.pos_x,s.pos_z,s.hull_hp,s.iron_kg,s.nickel_kg,s.cobalt_kg,s.energy_units,s.fuel_units,s.cargo_capacity_kg,(SELECT COALESCE(SUM(e.weight_kg),0) FROM ship_equipment se JOIN equipment e ON e.id=se.equipment_id WHERE se.ship_id=s.id AND se.is_equipped=1 AND se.quantity>0) AS weapon_weight FROM ships s LEFT JOIN ship_crew sc ON sc.ship_id=s.id AND sc.copilot_id=? AND sc.status='active' WHERE ((s.user_id=? AND NOT EXISTS (SELECT 1 FROM ship_crew own_crew WHERE own_crew.copilot_id=? AND own_crew.status='active')) OR sc.ship_id=s.id) AND s.is_active=1 LIMIT 1 FOR UPDATE");
        $shipQuery->execute([$userId,$userId,$userId]); $ship=$shipQuery->fetch(PDO::FETCH_ASSOC);
        $wreckQuery=$pdo->prepare("SELECT * FROM ship_wrecks WHERE id=? AND claimed_by IS NULL AND ((drop_type='wreck' AND created_at>=DATE_SUB(NOW(),INTERVAL 24 HOUR)) OR (drop_type='jettison' AND expires_at>NOW())) FOR UPDATE");
        $wreckQuery->execute([$wreckId]); $wreck=$wreckQuery->fetch(PDO::FETCH_ASSOC);
        if (!$ship || (int)$ship['hull_hp']<1 || !$wreck) mpResponse(['error'=>'Nave ou destroço indisponível.'],409);
        $distance=hypot((float)$ship['pos_x']-(float)$wreck['pos_x'],(float)$ship['pos_z']-(float)$wreck['pos_z']);
        if ($distance>1800) mpResponse(['error'=>'Aproxime-se a até 1.800 km para coletar.'],409);
        $capacity=max(0,(int)$ship['cargo_capacity_kg']-(int)$ship['iron_kg']-(int)$ship['nickel_kg']-(int)$ship['cobalt_kg']-(int)$ship['weapon_weight']-(int)ceil((float)$ship['fuel_units']*0.5));
        $available=(int)$wreck['iron_kg']+(int)$wreck['nickel_kg']+(int)$wreck['cobalt_kg'];
        if ($available>0 && $capacity<1) mpResponse(['error'=>'Compartimento de carga cheio.'],409);
        $iron=min((int)$wreck['iron_kg'],$capacity); $capacity-=$iron;
        $nickel=min((int)$wreck['nickel_kg'],$capacity); $capacity-=$nickel;
        $cobalt=min((int)$wreck['cobalt_kg'],$capacity);
        $energy=(int)$wreck['energy_units'];
        $pdo->prepare('UPDATE ships SET iron_kg=iron_kg+?,nickel_kg=nickel_kg+?,cobalt_kg=cobalt_kg+?,energy_units=energy_units+? WHERE id=?')->execute([$iron,$nickel,$cobalt,$energy,(int)$ship['id']]);
        if ((int)$ship['user_id']!==$userId) $_SESSION['crew_cargo_baseline'][(int)$ship['id']]=['Ferro'=>(int)$ship['iron_kg']+$iron,'Niquel'=>(int)$ship['nickel_kg']+$nickel,'Cobalto'=>(int)$ship['cobalt_kg']+$cobalt];
        $remainingIron=(int)$wreck['iron_kg']-$iron; $remainingNickel=(int)$wreck['nickel_kg']-$nickel; $remainingCobalt=(int)$wreck['cobalt_kg']-$cobalt;
        if ($remainingIron+$remainingNickel+$remainingCobalt===0) $pdo->prepare('UPDATE ship_wrecks SET claimed_by=? WHERE id=?')->execute([$userId,$wreckId]);
        else $pdo->prepare('UPDATE ship_wrecks SET iron_kg=?,nickel_kg=?,cobalt_kg=?,energy_units=0 WHERE id=?')->execute([$remainingIron,$remainingNickel,$remainingCobalt,$wreckId]);
        $pdo->commit();
        mpResponse(['ok'=>true,'cargo'=>['Ferro'=>$iron,'Niquel'=>$nickel,'Cobalto'=>$cobalt],'energy'=>$energy,'complete'=>$remainingIron+$remainingNickel+$remainingCobalt===0]);
    }

    if ($action === 'ship-respawn') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error'=>'Use POST para respawn.'],405);
        $pdo->beginTransaction();
        $crewShipQuery=$pdo->prepare("SELECT s.id,s.hull_hp,s.pos_x,s.pos_z FROM ship_crew sc JOIN ships s ON s.id=sc.ship_id WHERE sc.copilot_id=? AND sc.status='active' AND s.hull_hp=0 ORDER BY s.id LIMIT 1");
        $crewShipQuery->execute([$userId]); $crewShip=$crewShipQuery->fetch(PDO::FETCH_ASSOC);
        $passengerShipQuery=$pdo->prepare("SELECT s.id,s.hull_hp,s.pos_x,s.pos_z FROM ship_passengers sp JOIN ships s ON s.id=sp.ship_id WHERE sp.passenger_id=? AND sp.status='active' AND s.hull_hp=0 ORDER BY s.id LIMIT 1");
        $passengerShipQuery->execute([$userId]); $passengerShip=$passengerShipQuery->fetch(PDO::FETCH_ASSOC);
        $shipQuery=$pdo->prepare('SELECT id,user_id,hull_hp,pos_x,pos_z FROM ships WHERE user_id=? AND is_active=1 LIMIT 1 FOR UPDATE');
        $shipQuery->execute([$userId]); $ship=$shipQuery->fetch(PDO::FETCH_ASSOC);
        $ship=$ship?:$crewShip?:$passengerShip;
        if (!$ship) mpResponse(['error'=>'Nave não encontrada.'],404);
        if ((int)$ship['hull_hp']>0) mpResponse(['error'=>'Sua nave ainda está operacional.'],409);
        $stationQuery=$pdo->prepare('SELECT id,name,pos_x,pos_z FROM space_stations WHERE is_active=1 AND hull_hp>0 ORDER BY POW(pos_x-?,2)+POW(pos_z-?,2),id LIMIT 1');
        $stationQuery->execute([(float)$ship['pos_x'],(float)$ship['pos_z']]); $station=$stationQuery->fetch(PDO::FETCH_ASSOC);
        if (!$station) { $pdo->rollBack(); mpResponse(['error'=>'Nenhuma estacao ativa disponivel para reconstruir a nave.'],503); }
        $spawnX=(float)$station['pos_x']+((int)$ship['id']%2?1800:-1800);
        $spawnZ=(float)$station['pos_z']+(((int)$ship['id']%3)-1)*900;
        if((int)$ship['user_id']===$userId){$pdo->prepare('UPDATE ships SET pos_x=?,pos_y=0,pos_z=?,heading=0,pitch=0,roll=0,speed=0,hull_hp=100,fuel_units=fuel_capacity_units,docked_station_id=NULL,is_active=1 WHERE id=?')->execute([$spawnX,$spawnZ,(int)$ship['id']]);}
        $pdo->prepare("DELETE FROM ship_crew WHERE ship_id=?")->execute([(int)$ship['id']]);
        $pdo->prepare("UPDATE ship_passengers SET status='cancelled' WHERE ship_id=? AND status='active'")->execute([(int)$ship['id']]);
        $pdo->prepare("DELETE FROM station_occupants WHERE user_id=?")->execute([$userId]);
        $pdo->prepare('UPDATE users SET last_seen_at=NOW() WHERE id=?')->execute([$userId]);
        $pdo->commit();
        mpResponse(['ok'=>true,'x'=>$spawnX,'z'=>$spawnZ,'hull'=>100,'station'=>['id'=>(int)$station['id'],'name'=>$station['name']]]);
    }

    if ($action === 'mission-payout') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error'=>'Use POST para registrar a recompensa da miss?o.'],405);
        $input=mpInput();$missionId=substr(trim((string)($input['id']??'')),0,100);$type=(string)($input['type']??'');
        $origin=(string)($input['origin']??'');$destination=(string)($input['destination']??'');
        $amount=(int)($input['amount']??0);$reward=(int)($input['reward']??0);$delivered=(int)($input['delivered']??0);
        $catalog=require __DIR__.'/world-catalog.php';$allBodies=$catalog['bodies'];$bodyById=[];foreach($allBodies as $body)$bodyById[$body['id']]=$body;$stationIds=$catalog['stationIds'];$moonIds=array_values(array_diff($catalog['missionBodyIds'],$stationIds));$stations=array_map(static fn($id)=>$bodyById[$id],$stationIds);$moons=array_map(static fn($id)=>$bodyById[$id],$moonIds);
        $valid=[];$stationCount=count($stations);$moonCount=count($moons);
        foreach($stations as $index=>$station){$next=$stations[($index+1)%$stationCount];$firstMoon=$moons[($index+1)%$moonCount];$secondMoon=$moons[($index+5)%$moonCount];
            $valid[$station['id'].'-passengers-'.$next['id']]=['type'=>'passengers','origin'=>$station['id'],'destination'=>$next['id'],'amount'=>50,'reward'=>4200];
            $valid[$station['id'].'-ore-'.$firstMoon['id']]=['type'=>'material','origin'=>$station['id'],'destination'=>$firstMoon['id'],'amount'=>1500,'reward'=>2850];
            $valid[$station['id'].'-ammo-'.$secondMoon['id']]=['type'=>'material','origin'=>$station['id'],'destination'=>$secondMoon['id'],'amount'=>1100,'reward'=>2450];
        }
        $offer=$valid[$missionId]??null;
        if(!$offer||$type!==$offer['type']||$origin!==$offer['origin']||$destination!==$offer['destination']||$amount!==$offer['amount']||$reward!==$offer['reward']||$delivered<0||$delivered>$amount)mpResponse(['error'=>'Dados do contrato inv?lidos.'],400);
        $pdo->exec("CREATE TABLE IF NOT EXISTS mission_payouts (user_id BIGINT UNSIGNED NOT NULL,mission_id VARCHAR(100) NOT NULL,paid_credits INT UNSIGNED NOT NULL DEFAULT 0,delivered_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,PRIMARY KEY(user_id,mission_id),CONSTRAINT fk_mission_payout_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB");
        $pdo->beginTransaction();
        $pdo->prepare('INSERT IGNORE INTO mission_payouts(user_id,mission_id) VALUES(?,?)')->execute([$userId,$missionId]);
        $payoutQuery=$pdo->prepare('SELECT paid_credits,delivered_count FROM mission_payouts WHERE user_id=? AND mission_id=? FOR UPDATE');$payoutQuery->execute([$userId,$missionId]);$payout=$payoutQuery->fetch(PDO::FETCH_ASSOC);
        $walletQuery=$pdo->prepare('SELECT credits FROM users WHERE id=? FOR UPDATE');$walletQuery->execute([$userId]);$wallet=(int)$walletQuery->fetchColumn();
        $previousDelivered=(int)$payout['delivered_count'];$acceptedDelivered=max($previousDelivered,$delivered);$targetPaid=(int)floor($reward*$acceptedDelivered/$amount);$earned=max(0,$targetPaid-(int)$payout['paid_credits']);
        if($earned>0){$pdo->prepare('UPDATE users SET credits=credits+? WHERE id=?')->execute([$earned,$userId]);$wallet+=$earned;}
        $pdo->prepare('UPDATE mission_payouts SET paid_credits=?,delivered_count=? WHERE user_id=? AND mission_id=?')->execute([max((int)$payout['paid_credits'],$targetPaid),$acceptedDelivered,$userId,$missionId]);
        $pdo->commit();mpResponse(['ok'=>true,'earned'=>$earned,'paid'=>$targetPaid,'delivered'=>$acceptedDelivered,'credits'=>$wallet]);
    }

    if ($action === 'tow-purchase' || $action === 'tow-toggle') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error'=>'Use POST para gerenciar o rebocador.'],405);
        mpEnsureTowSystem($pdo);
        $input=mpInput(); $stationCode=strtolower(trim((string)($input['station']??'')));
        $stationQuery=$pdo->prepare('SELECT id,pos_x,pos_z,hull_hp FROM space_stations WHERE code=? AND is_active=1 LIMIT 1');
        $stationQuery->execute([$stationCode]); $station=$stationQuery->fetch(PDO::FETCH_ASSOC);
        if(!$station||(int)$station['hull_hp']<1)mpResponse(['error'=>'Estacao indisponivel.'],409);
        $pdo->beginTransaction();
        $shipQuery=$pdo->prepare('SELECT s.id,s.pos_x,s.pos_z,s.hull_hp,s.ship_class,s.iron_kg,s.nickel_kg,s.cobalt_kg,s.ice_kg,s.cargo_capacity_kg,s.fuel_units FROM ships s WHERE s.user_id=? AND s.is_active=1 LIMIT 1 FOR UPDATE');
        $shipQuery->execute([$userId]); $ship=$shipQuery->fetch(PDO::FETCH_ASSOC);
        if(!$ship||(int)$ship['hull_hp']<1){$pdo->rollBack();mpResponse(['error'=>'Sua nave precisa estar operacional.'],409);}
        if(hypot((float)$ship['pos_x']-(float)$station['pos_x'],(float)$ship['pos_z']-(float)$station['pos_z'])>2200){$pdo->rollBack();mpResponse(['error'=>'Aproxime-se a 2.200 km de uma estacao para instalar o equipamento.'],409);}
        $userQuery=$pdo->prepare('SELECT credits FROM users WHERE id=? FOR UPDATE');$userQuery->execute([$userId]);$credits=(int)$userQuery->fetchColumn();
        $itemQuery=$pdo->prepare("SELECT e.id,e.weight_kg,se.quantity,se.is_equipped FROM equipment e LEFT JOIN ship_equipment se ON se.equipment_id=e.id AND se.ship_id=? WHERE e.code='tractor_array' AND e.is_available=1 LIMIT 1 FOR UPDATE");$itemQuery->execute([(int)$ship['id']]);$item=$itemQuery->fetch(PDO::FETCH_ASSOC);
        if(!$item){$pdo->rollBack();mpResponse(['error'=>'Equipamento rebocador indisponivel no catalogo.'],503);}
        $install=$action==='tow-purchase'||!empty($input['installed']);
        if($action==='tow-purchase'&&!(int)($item['quantity']??0)){
            if($credits<12000){$missing=12000-$credits;$pdo->rollBack();mpResponse(['error'=>'Compra nao realizada. Saldo atual: '.$credits.' CR; faltam '.$missing.' CR.'],409);}
            if((int)$ship['iron_kg']<250){$missing=250-(int)$ship['iron_kg'];$pdo->rollBack();mpResponse(['error'=>'Faltam '.$missing.' kg de ferro para comprar o rebocador.'],409);}
            $weightQuery=$pdo->prepare('SELECT COALESCE(SUM(e.weight_kg),0) FROM ship_equipment se JOIN equipment e ON e.id=se.equipment_id WHERE se.ship_id=? AND se.is_equipped=1 AND se.quantity>0');$weightQuery->execute([(int)$ship['id']]);
            $load=(int)$ship['iron_kg']+(int)$ship['nickel_kg']+(int)$ship['cobalt_kg']+(int)$ship['ice_kg']+(int)$weightQuery->fetchColumn()+(int)$item['weight_kg']+(int)ceil((float)$ship['fuel_units']*.5);
            if($load>(int)$ship['cargo_capacity_kg']){$pdo->rollBack();mpResponse(['error'=>'O rebocador pesa 380 kg. Libere espaco na nave.'],409);}
            $pdo->prepare('UPDATE users SET credits=credits-12000 WHERE id=?')->execute([$userId]);
            $pdo->prepare('UPDATE ships SET iron_kg=iron_kg-250 WHERE id=?')->execute([(int)$ship['id']]);
            $pdo->prepare('INSERT INTO ship_equipment(ship_id,equipment_id,quantity,ammo_current,is_equipped) VALUES(?,?,1,0,1) ON DUPLICATE KEY UPDATE quantity=GREATEST(quantity,1),is_equipped=1')->execute([(int)$ship['id'],(int)$item['id']]);
        }else{
            if(!(int)($item['quantity']??0)){$pdo->rollBack();mpResponse(['error'=>'Compre o rebocador antes de instalar.'],409);}
            if($install&&!(int)$item['is_equipped']){
                $weightQuery=$pdo->prepare('SELECT COALESCE(SUM(e.weight_kg),0) FROM ship_equipment se JOIN equipment e ON e.id=se.equipment_id WHERE se.ship_id=? AND se.is_equipped=1 AND se.quantity>0');$weightQuery->execute([(int)$ship['id']]);
                $load=(int)$ship['iron_kg']+(int)$ship['nickel_kg']+(int)$ship['cobalt_kg']+(int)$ship['ice_kg']+(int)$weightQuery->fetchColumn()+(int)$item['weight_kg']+(int)ceil((float)$ship['fuel_units']*.5);
                if($load>(int)$ship['cargo_capacity_kg']){$pdo->rollBack();mpResponse(['error'=>'O rebocador pesa 380 kg. Libere espaco na nave.'],409);}
            }
            $pdo->prepare('UPDATE ship_equipment SET is_equipped=? WHERE ship_id=? AND equipment_id=?')->execute([$install?1:0,(int)$ship['id'],(int)$item['id']]);
        }
        $pdo->commit();mpResponse(['ok'=>true,'owned'=>true,'installed'=>$install,'weightKg'=>$install?(int)$item['weight_kg']:0,'credits'=>$action==='tow-purchase'?$credits-12000:$credits,'iron'=>max(0,(int)$ship['iron_kg']-($action==='tow-purchase'?250:0))]);
    }

    if ($action === 'tow-rescue-request') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error'=>'Use POST para solicitar o resgate.'],405);
        mpEnsureTowSystem($pdo);
        $targetUserId=(int)(mpInput()['user_id']??0);
        if($targetUserId<1||$targetUserId===$userId)mpResponse(['error'=>'Selecione outro piloto para pedir o reboque.'],400);
        $pdo->beginTransaction();
        $tugQuery=$pdo->prepare("SELECT s.id,s.pos_x,s.pos_z,s.hull_hp,s.docked_station_id FROM ships s JOIN ship_equipment se ON se.ship_id=s.id AND se.is_equipped=1 AND se.quantity>0 JOIN equipment e ON e.id=se.equipment_id AND e.code='tractor_array' WHERE s.user_id=? AND s.is_active=1 LIMIT 1 FOR UPDATE");
        $tugQuery->execute([$userId]);$tug=$tugQuery->fetch(PDO::FETCH_ASSOC);
        if(!$tug||(int)$tug['hull_hp']<1||$tug['docked_station_id']!==null){$pdo->rollBack();mpResponse(['error'=>'Equipe o rebocador e desacople sua nave antes do resgate.'],409);}
        $targetQuery=$pdo->prepare('SELECT id,user_id,pos_x,pos_z,hull_hp,fuel_units,docked_station_id FROM ships WHERE user_id=? AND is_active=1 LIMIT 1 FOR UPDATE');
        $targetQuery->execute([$targetUserId]);$target=$targetQuery->fetch(PDO::FETCH_ASSOC);
        if(!$target||(int)$target['hull_hp']<1||(float)$target['fuel_units']>0||(int)($target['docked_station_id']??0)>0){$pdo->rollBack();mpResponse(['error'=>'A nave precisa estar ativa, fora da esta??o e sem combust?vel.'],409);}
        if(hypot((float)$tug['pos_x']-(float)$target['pos_x'],(float)$tug['pos_z']-(float)$target['pos_z'])>2500){$pdo->rollBack();mpResponse(['error'=>'Aproxime-se a 2.500 km da nave para conectar o cabo.'],409);}
        $existing=$pdo->prepare("SELECT id FROM ship_rescue_requests WHERE target_ship_id=? AND status IN ('pending','active') LIMIT 1 FOR UPDATE");$existing->execute([(int)$target['id']]);
        if($existing->fetchColumn()){$pdo->rollBack();mpResponse(['error'=>'Esta nave j? tem um pedido ou reboque em andamento.'],409);}
        $stationQuery=$pdo->prepare('SELECT id,name,pos_x,pos_z FROM space_stations WHERE is_active=1 AND hull_hp>0 ORDER BY POW(pos_x-?,2)+POW(pos_z-?,2),id LIMIT 1 FOR UPDATE');
        $stationQuery->execute([(float)$target['pos_x'],(float)$target['pos_z']]);$station=$stationQuery->fetch(PDO::FETCH_ASSOC);
        if(!$station){$pdo->rollBack();mpResponse(['error'=>'Nenhuma esta??o operacional foi localizada.'],409);}
        $distance=hypot((float)$station['pos_x']-(float)$target['pos_x'],(float)$station['pos_z']-(float)$target['pos_z']);$duration=max(60,min(300,(int)ceil($distance/1500)));
        $pdo->prepare("INSERT INTO ship_rescue_requests(tug_ship_id,target_ship_id,tug_user_id,target_user_id,station_id,origin_x,origin_z,destination_x,destination_z,duration_seconds) VALUES(?,?,?,?,?,?,?,?,?,?)")->execute([(int)$tug['id'],(int)$target['id'],$userId,$targetUserId,(int)$station['id'],(float)$target['pos_x'],(float)$target['pos_z'],(float)$station['pos_x'],(float)$station['pos_z'],$duration]);
        $id=(int)$pdo->lastInsertId();$pdo->commit();mpResponse(['ok'=>true,'requestId'=>$id,'station'=>$station['name'],'duration'=>$duration]);
    }

    if ($action === 'tow-rescue-response') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error'=>'Use POST para responder ao resgate.'],405);
        mpEnsureTowSystem($pdo);$input=mpInput();$requestId=(int)($input['request_id']??0);$accept=!empty($input['accept']);
        if($requestId<1)mpResponse(['error'=>'Pedido de resgate inv?lido.'],400);
        $pdo->beginTransaction();
        $requestQuery=$pdo->prepare("SELECT r.*,s.hull_hp,s.fuel_units,s.docked_station_id,s.pos_x AS target_x,s.pos_z AS target_z,t.pos_x AS tug_x,t.pos_z AS tug_z,t.hull_hp AS tug_hull,t.docked_station_id AS tug_docked,EXISTS(SELECT 1 FROM ship_equipment se JOIN equipment e ON e.id=se.equipment_id WHERE se.ship_id=t.id AND se.is_equipped=1 AND se.quantity>0 AND e.code='tractor_array') AS tug_equipped FROM ship_rescue_requests r JOIN ships s ON s.id=r.target_ship_id JOIN ships t ON t.id=r.tug_ship_id WHERE r.id=? AND r.target_user_id=? AND r.status='pending' FOR UPDATE");
        $requestQuery->execute([$requestId,$userId]);$request=$requestQuery->fetch(PDO::FETCH_ASSOC);
        if(!$request){$pdo->rollBack();mpResponse(['error'=>'Este pedido j? expirou ou foi respondido.'],409);}
        if(!$accept){$pdo->prepare("UPDATE ship_rescue_requests SET status='declined' WHERE id=?")->execute([$requestId]);$pdo->commit();mpResponse(['ok'=>true,'accepted'=>false]);}
        if((int)$request['hull_hp']<1||(float)$request['fuel_units']>0||(int)($request['docked_station_id']??0)>0){$pdo->rollBack();mpResponse(['error'=>'A nave j? n?o est? eleg?vel para resgate.'],409);}
        if((int)$request['tug_hull']<1||(int)$request['tug_equipped']!==1||$request['tug_docked']!==null||hypot((float)$request['tug_x']-(float)$request['target_x'],(float)$request['tug_z']-(float)$request['target_z'])>2500){$pdo->rollBack();mpResponse(['error'=>'A nave de resgate saiu do alcance ou j? n?o tem o rebocador ativo.'],409);}
        $active=$pdo->prepare("SELECT id FROM ship_rescue_requests WHERE target_ship_id=? AND status='active' LIMIT 1 FOR UPDATE");$active->execute([(int)$request['target_ship_id']]);
        if($active->fetchColumn()){$pdo->rollBack();mpResponse(['error'=>'Outro resgate j? foi conectado.'],409);}
        $pdo->prepare("UPDATE ship_rescue_requests SET status='active',accepted_at=NOW() WHERE id=?")->execute([$requestId]);$pdo->commit();mpResponse(['ok'=>true,'accepted'=>true,'stationId'=>(int)$request['station_id']]);
    }

    if ($action === 'tow-start') {
        if($_SERVER['REQUEST_METHOD']!=='POST')mpResponse(['error'=>'Use POST para iniciar o reboque.'],405);
        mpEnsureTowSystem($pdo);$wreckId=(int)(mpInput()['wreck_id']??0);if($wreckId<1)mpResponse(['error'=>'Sinal de destrocos invalido.'],400);
        $pdo->beginTransaction();
        $shipQuery=$pdo->prepare("SELECT s.id,s.pos_x,s.pos_z,s.hull_hp,s.docked_station_id FROM ships s JOIN ship_equipment se ON se.ship_id=s.id AND se.is_equipped=1 AND se.quantity>0 JOIN equipment e ON e.id=se.equipment_id AND e.code='tractor_array' WHERE s.user_id=? AND s.is_active=1 LIMIT 1 FOR UPDATE");$shipQuery->execute([$userId]);$tug=$shipQuery->fetch(PDO::FETCH_ASSOC);
        if(!$tug||(int)$tug['hull_hp']<1||$tug['docked_station_id']!==null){$pdo->rollBack();mpResponse(['error'=>'Instale o rebocador e desacople a nave para iniciar o resgate.'],409);}
        $wreckQuery=$pdo->prepare("SELECT w.id,w.destroyed_ship_id,w.owner_user_id,w.pos_x,w.pos_z,s.hull_hp FROM ship_wrecks w JOIN ships s ON s.id=w.destroyed_ship_id WHERE w.id=? AND w.drop_type='wreck' AND w.claimed_by IS NULL FOR UPDATE");$wreckQuery->execute([$wreckId]);$wreck=$wreckQuery->fetch(PDO::FETCH_ASSOC);
        if(!$wreck||(int)$wreck['owner_user_id']===$userId||(int)$wreck['hull_hp']>0){$pdo->rollBack();mpResponse(['error'=>'Este sinal nao pertence a uma nave abandonada que possa ser rebocada.'],409);}
        if(hypot((float)$tug['pos_x']-(float)$wreck['pos_x'],(float)$tug['pos_z']-(float)$wreck['pos_z'])>2500){$pdo->rollBack();mpResponse(['error'=>'Aproxime-se a 2.500 km dos destrocos para conectar o cabo.'],409);}
        $existing=$pdo->prepare("SELECT id FROM ship_tows WHERE wreck_id=? AND status='active' LIMIT 1");$existing->execute([$wreckId]);if($existing->fetchColumn()){$pdo->rollBack();mpResponse(['error'=>'Outro piloto ja esta rebocando esta nave.'],409);}
        $stationQuery=$pdo->prepare('SELECT id,name,pos_x,pos_z FROM space_stations WHERE is_active=1 AND hull_hp>0 ORDER BY POW(pos_x-?,2)+POW(pos_z-?,2),id LIMIT 1 FOR UPDATE');$stationQuery->execute([(float)$wreck['pos_x'],(float)$wreck['pos_z']]);$station=$stationQuery->fetch(PDO::FETCH_ASSOC);
        if(!$station){$pdo->rollBack();mpResponse(['error'=>'Nenhuma estacao operacional foi localizada.'],409);}
        $distance=hypot((float)$station['pos_x']-(float)$wreck['pos_x'],(float)$station['pos_z']-(float)$wreck['pos_z']);$duration=max(30,min(120,(int)ceil($distance/1500)));
        $pdo->prepare("INSERT INTO ship_tows(tug_ship_id,rescued_ship_id,wreck_id,rescuer_user_id,station_id,origin_x,origin_z,destination_x,destination_z,duration_seconds) VALUES(?,?,?,?,?,?,?,?,?,?)")->execute([(int)$tug['id'],(int)$wreck['destroyed_ship_id'],$wreckId,$userId,(int)$station['id'],(float)$wreck['pos_x'],(float)$wreck['pos_z'],(float)$station['pos_x'],(float)$station['pos_z'],$duration]);
        $towId=(int)$pdo->lastInsertId();$pdo->commit();mpResponse(['ok'=>true,'towId'=>$towId,'duration'=>$duration,'station'=>$station['name']]);
    }

    if ($action === 'tow-world') {
        mpEnsureTowSystem($pdo);
        $pdo->beginTransaction();
        $pdo->exec("UPDATE ship_rescue_requests SET status='cancelled' WHERE status='pending' AND created_at<DATE_SUB(NOW(),INTERVAL 10 MINUTE)");
        $finished=$pdo->query("SELECT r.id,r.target_ship_id,r.target_user_id,r.station_id,r.destination_x,r.destination_z,ss.name AS station_name FROM ship_rescue_requests r JOIN ships s ON s.id=r.target_ship_id JOIN space_stations ss ON ss.id=r.station_id WHERE r.status='active' AND TIMESTAMPDIFF(SECOND,r.accepted_at,NOW())>=r.duration_seconds FOR UPDATE")->fetchAll(PDO::FETCH_ASSOC);
        foreach($finished as $rescue){
            $pdo->prepare('UPDATE ships SET pos_x=?+(id%2)*180,pos_y=0,pos_z=?+(id%3)*140,speed=0,docked_station_id=? WHERE id=? AND hull_hp>0 AND fuel_units<=0')->execute([(float)$rescue['destination_x'],(float)$rescue['destination_z'],(int)$rescue['station_id'],(int)$rescue['target_ship_id']]);
            $pdo->prepare("UPDATE station_occupants SET station_id=? WHERE user_id=? AND mode='station'")->execute([(int)$rescue['station_id'],(int)$rescue['target_user_id']]);
            $pdo->prepare("UPDATE ship_rescue_requests SET status='completed',completed_at=NOW() WHERE id=? AND status='active'")->execute([(int)$rescue['id']]);
        }
        $wreckFinished=$pdo->query("SELECT t.id,t.rescued_ship_id,t.wreck_id,t.rescuer_user_id,t.station_id,t.destination_x,t.destination_z,s.user_id AS rescued_owner_id FROM ship_tows t JOIN ships s ON s.id=t.rescued_ship_id WHERE t.status='active' AND TIMESTAMPDIFF(SECOND,t.started_at,NOW())>=t.duration_seconds FOR UPDATE")->fetchAll(PDO::FETCH_ASSOC);
        foreach($wreckFinished as $tow){$pdo->prepare('UPDATE ships SET pos_x=?+(id%2)*600,pos_y=0,pos_z=?+(id%3)*400,speed=0,hull_hp=GREATEST(hull_hp,35),docked_station_id=? WHERE id=? AND hull_hp=0')->execute([(float)$tow['destination_x'],(float)$tow['destination_z'],(int)$tow['station_id'],(int)$tow['rescued_ship_id']]);$pdo->prepare("UPDATE station_occupants SET station_id=? WHERE user_id=? AND mode='station'")->execute([(int)$tow['station_id'],(int)$tow['rescued_owner_id']]);$pdo->prepare('UPDATE ship_wrecks SET claimed_by=? WHERE id=? AND claimed_by IS NULL')->execute([(int)$tow['rescuer_user_id'],(int)$tow['wreck_id']]);$pdo->prepare("UPDATE ship_tows SET status='completed',completed_at=NOW() WHERE id=?")->execute([(int)$tow['id']]);}
        $tows=$pdo->query("SELECT t.id,t.wreck_id,t.rescuer_user_id,u.username,t.tug_ship_id,t.origin_x,t.origin_z,t.destination_x,t.destination_z,t.duration_seconds,TIMESTAMPDIFF(SECOND,t.started_at,NOW()) AS elapsed,t.started_at,t.station_id,ss.name AS station_name,ts.pos_x AS tug_x,ts.pos_z AS tug_z FROM ship_tows t JOIN users u ON u.id=t.rescuer_user_id JOIN ships ts ON ts.id=t.tug_ship_id JOIN space_stations ss ON ss.id=t.station_id WHERE t.status='active' ORDER BY t.started_at DESC LIMIT 40")->fetchAll(PDO::FETCH_ASSOC);
        $rescues=$pdo->query("SELECT r.id,r.tug_user_id,r.target_user_id,r.tug_ship_id,r.origin_x,r.origin_z,r.destination_x,r.destination_z,r.duration_seconds,TIMESTAMPDIFF(SECOND,r.accepted_at,NOW()) AS elapsed,r.accepted_at,r.status,ss.name AS station_name,tu.username AS tug_username,ts.pos_x AS tug_x,ts.pos_z AS tug_z FROM ship_rescue_requests r JOIN users tu ON tu.id=r.tug_user_id JOIN ships ts ON ts.id=r.tug_ship_id JOIN space_stations ss ON ss.id=r.station_id WHERE r.status='active' ORDER BY r.accepted_at DESC LIMIT 40")->fetchAll(PDO::FETCH_ASSOC);
        $incomingQuery=$pdo->prepare("SELECT r.id,r.tug_user_id,u.username AS tug_username,r.target_ship_id,r.station_id,ss.name AS station_name,r.duration_seconds,r.created_at FROM ship_rescue_requests r JOIN users u ON u.id=r.tug_user_id JOIN space_stations ss ON ss.id=r.station_id WHERE r.target_user_id=? AND r.status='pending' ORDER BY r.created_at LIMIT 5");$incomingQuery->execute([$userId]);$incoming=$incomingQuery->fetchAll(PDO::FETCH_ASSOC);
        $completedQuery=$pdo->prepare("SELECT id,destination_x,destination_z,station_id,completed_at FROM ship_rescue_requests WHERE target_user_id=? AND status='completed' AND completed_at>=DATE_SUB(NOW(),INTERVAL 2 MINUTE) ORDER BY completed_at DESC LIMIT 5");$completedQuery->execute([$userId]);$completed=$completedQuery->fetchAll(PDO::FETCH_ASSOC);
        $pdo->commit();
        mpResponse([
            'tows'=>array_map(static fn($t)=>['id'=>(int)$t['id'],'wreckId'=>(int)$t['wreck_id'],'userId'=>(int)$t['rescuer_user_id'],'username'=>$t['username'],'tugId'=>(int)$t['tug_ship_id'],'tugX'=>(float)$t['tug_x'],'tugZ'=>(float)$t['tug_z'],'originX'=>(float)$t['origin_x'],'originZ'=>(float)$t['origin_z'],'destinationX'=>(float)$t['destination_x'],'destinationZ'=>(float)$t['destination_z'],'duration'=>(int)$t['duration_seconds'],'elapsed'=>(int)$t['elapsed'],'startedAt'=>$t['started_at'],'station'=>$t['station_name']],$tows),
            'rescues'=>array_map(static fn($r)=>['id'=>(int)$r['id'],'userId'=>(int)$r['tug_user_id'],'targetUserId'=>(int)$r['target_user_id'],'username'=>$r['tug_username'],'tugId'=>(int)$r['tug_ship_id'],'tugX'=>(float)$r['tug_x'],'tugZ'=>(float)$r['tug_z'],'originX'=>(float)$r['origin_x'],'originZ'=>(float)$r['origin_z'],'destinationX'=>(float)$r['destination_x'],'destinationZ'=>(float)$r['destination_z'],'duration'=>(int)$r['duration_seconds'],'elapsed'=>(int)$r['elapsed'],'station'=>$r['station_name']],$rescues),
            'requests'=>array_map(static fn($r)=>['id'=>(int)$r['id'],'tugUserId'=>(int)$r['tug_user_id'],'tugUsername'=>$r['tug_username'],'shipId'=>(int)$r['target_ship_id'],'stationId'=>(int)$r['station_id'],'station'=>$r['station_name'],'duration'=>(int)$r['duration_seconds'],'createdAt'=>$r['created_at']],$incoming),
            'completedRescues'=>array_map(static fn($r)=>['id'=>(int)$r['id'],'x'=>(float)$r['destination_x'],'z'=>(float)$r['destination_z'],'stationId'=>(int)$r['station_id'],'completedAt'=>$r['completed_at']],$completed)
        ]);
    }

    if ($action === 'weapon-toggle') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error'=>'Use POST para montar ou retirar o canh?o.'],405);
        $input=mpInput(); $mount=!empty($input['mounted']);
        $kinds=['pulse'=>'pulse_cannon','ion'=>'ion_cannon','heavy'=>'heavy_plasma_cannon','singularity'=>'singularity_cannon'];
        $kind=(string)($input['kind']??'');
        if (!isset($kinds[$kind])) mpResponse(['error'=>'Canh?o inv?lido.'],400);
        $code=$kinds[$kind]; $pdo->beginTransaction();
        $shipQuery=$pdo->prepare('SELECT id,hull_hp,ship_class,cargo_capacity_kg,iron_kg,nickel_kg,cobalt_kg,fuel_units,selected_weapon_code FROM ships WHERE user_id=? AND is_active=1 LIMIT 1 FOR UPDATE');
        $shipQuery->execute([$userId]); $ship=$shipQuery->fetch(PDO::FETCH_ASSOC);
        if (!$ship || (int)$ship['hull_hp']<1) { $pdo->rollBack(); mpResponse(['error'=>'Sua nave n?o est? operacional.'],409); }
        $itemQuery=$pdo->prepare('SELECT e.id,e.damage,e.ammo_capacity,e.weight_kg,se.ammo_current FROM ship_equipment se JOIN equipment e ON e.id=se.equipment_id WHERE se.ship_id=? AND e.code=? AND se.quantity>0 FOR UPDATE');
        $itemQuery->execute([(int)$ship['id'],$code]); $item=$itemQuery->fetch(PDO::FETCH_ASSOC);
        if (!$item) { $pdo->rollBack(); mpResponse(['error'=>'Esse canh?o n?o est? no invent?rio da nave.'],409); }
        if ($mount && $ship['ship_class']==='freighter') { $pdo->rollBack(); mpResponse(['error'=>'O cargueiro Atlas nao aceita canhoes.'],409); }
        if ($mount && (int)$ship['iron_kg']+(int)$ship['nickel_kg']+(int)$ship['cobalt_kg']+(int)$item['weight_kg']+(int)ceil((float)$ship['fuel_units']*0.5)>(int)$ship['cargo_capacity_kg']) { $pdo->rollBack(); mpResponse(['error'=>'A carga e o peso deste canh?o excedem os 2.000 kg. Venda ou deposite min?rio antes de montar.'],409); }
        if ($mount) {
            $pdo->prepare("UPDATE ship_equipment se JOIN equipment e ON e.id=se.equipment_id SET se.is_equipped=0 WHERE se.ship_id=? AND e.equipment_type='weapon'")->execute([(int)$ship['id']]);
            $pdo->prepare('UPDATE ship_equipment SET is_equipped=1 WHERE ship_id=? AND equipment_id=?')->execute([(int)$ship['id'],(int)$item['id']]);
            $pdo->prepare('UPDATE ships SET selected_weapon_code=? WHERE id=?')->execute([$code,(int)$ship['id']]);
        } else {
            $pdo->prepare('UPDATE ship_equipment SET is_equipped=0 WHERE ship_id=? AND equipment_id=? AND is_equipped=1')->execute([(int)$ship['id'],(int)$item['id']]);
            $pdo->prepare('UPDATE ships SET selected_weapon_code=? WHERE id=?')->execute([$code,(int)$ship['id']]);
        }
        $upgradeQuery=$pdo->prepare("SELECT 1 FROM ship_equipment se JOIN equipment e ON e.id=se.equipment_id WHERE se.ship_id=? AND e.code='pulse_capacitor_mk2' AND se.quantity>0 LIMIT 1");
        $upgradeQuery->execute([(int)$ship['id']]); $upgraded=(bool)$upgradeQuery->fetchColumn();
        $pdo->commit();
        mpResponse(['ok'=>true,'weapon'=>['installed'=>$mount,'kind'=>$kind,'damage'=>$kind==='pulse'&&$upgraded?10:(int)$item['damage'],'ammo'=>(int)$item['ammo_current'],'maxAmmo'=>(int)$item['ammo_capacity'],'weightKg'=>$mount?(int)$item['weight_kg']:0,'upgraded'=>$upgraded]]);
    }

    if ($action === 'weapon-purchase') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error'=>'Use POST para adquirir o canh?o.'],405);
        $input=mpInput();
        $stationCode=strtolower(trim((string)($input['station']??'')));
        if (!preg_match('/^[a-z0-9_-]{2,40}$/',$stationCode)) mpResponse(['error'=>'Esta??o inv?lida.'],400);
        $stationQuery=$pdo->prepare('SELECT id,pos_x,pos_z,hull_hp FROM space_stations WHERE code=? AND is_active=1 LIMIT 1');
        $stationQuery->execute([$stationCode]); $station=$stationQuery->fetch(PDO::FETCH_ASSOC);
        if (!$station) mpResponse(['error'=>'Esta??o indispon?vel.'],404);
        if ((int)$station['hull_hp']<1) mpResponse(['error'=>'Terminal offline: estacao desativada.'],409);
        $pdo->beginTransaction();
        $shipQuery=$pdo->prepare('SELECT id,pos_x,pos_z,hull_hp,ship_class,iron_kg,nickel_kg,cobalt_kg,cargo_capacity_kg,fuel_units,(SELECT COALESCE(SUM(e.weight_kg),0) FROM ship_equipment se JOIN equipment e ON e.id=se.equipment_id WHERE se.ship_id=ships.id AND se.is_equipped=1 AND se.quantity>0) AS weapon_weight FROM ships WHERE user_id=? AND is_active=1 LIMIT 1 FOR UPDATE');
        $shipQuery->execute([$userId]); $ship=$shipQuery->fetch(PDO::FETCH_ASSOC);
        if (!$ship || (int)$ship['hull_hp']<1) { $pdo->rollBack(); mpResponse(['error'=>'Sua nave n?o est? operacional.'],409); }
        if ($ship['ship_class']==='freighter') { $pdo->rollBack(); mpResponse(['error'=>'O cargueiro Atlas nao pode receber armamento.'],409); }
        if (hypot((float)$ship['pos_x']-(float)$station['pos_x'],(float)$ship['pos_z']-(float)$station['pos_z'])>2200) { $pdo->rollBack(); mpResponse(['error'=>'Aproxime-se a at? 2.200 km para comprar.'],409); }
        $ownedQuery=$pdo->prepare("SELECT 1 FROM ship_equipment se JOIN equipment e ON e.id=se.equipment_id WHERE se.ship_id=? AND e.code='singularity_cannon' AND se.quantity>0 LIMIT 1 FOR UPDATE");
        $ownedQuery->execute([(int)$ship['id']]);
        if ($ownedQuery->fetchColumn()) { $pdo->rollBack(); mpResponse(['error'=>'Sua nave j? possui este canh?o.'],409); }
        $userQuery=$pdo->prepare('SELECT credits FROM users WHERE id=? FOR UPDATE'); $userQuery->execute([$userId]); $wallet=(int)$userQuery->fetchColumn();
        if ($wallet<50000) { $missing=50000-$wallet; $pdo->rollBack(); mpResponse(['error'=>'Compra nao realizada. Saldo atual: '.$wallet.' CR; faltam '.$missing.' CR.'],409); }
        if ((int)$ship['iron_kg']<1000 || (int)$ship['nickel_kg']<700 || (int)$ship['cobalt_kg']<300) { $pdo->rollBack(); mpResponse(['error'=>'Carga insuficiente. Requisitos: 1.000 kg de ferro, 700 kg de n?quel e 300 kg de cobalto.'],409); }
        $remainingCargo=(int)$ship['iron_kg']+(int)$ship['nickel_kg']+(int)$ship['cobalt_kg']-2000; if ($remainingCargo+700+(int)ceil((float)$ship['fuel_units']*0.5)>(int)$ship['cargo_capacity_kg']) { $pdo->rollBack(); mpResponse(['error'=>'Desocupe espa?o para o canh?o de 700 kg ap?s pagar o min?rio.'],409); }
        $equipmentQuery=$pdo->prepare("SELECT id FROM equipment WHERE code='singularity_cannon' AND is_available=1 LIMIT 1"); $equipmentQuery->execute(); $equipmentId=(int)$equipmentQuery->fetchColumn();
        if (!$equipmentId) { $pdo->rollBack(); mpResponse(['error'=>'Canh?o ainda n?o cadastrado no cat?logo do servidor.'],503); }
        $pdo->prepare('UPDATE users SET credits=credits-50000 WHERE id=?')->execute([$userId]);
        $pdo->prepare('UPDATE ships SET iron_kg=iron_kg-1000,nickel_kg=nickel_kg-700,cobalt_kg=cobalt_kg-300 WHERE id=?')->execute([(int)$ship['id']]);
        $pdo->prepare("UPDATE ship_equipment se JOIN equipment e ON e.id=se.equipment_id SET se.is_equipped=0 WHERE se.ship_id=? AND e.equipment_type='weapon'")->execute([(int)$ship['id']]);
        $pdo->prepare('INSERT INTO ship_equipment (ship_id,equipment_id,quantity,ammo_current,is_equipped) VALUES (?,?,1,30,1)')->execute([(int)$ship['id'],$equipmentId]);
        $pdo->prepare("UPDATE ships SET selected_weapon_code='singularity_cannon' WHERE id=?")->execute([(int)$ship['id']]);
        $pdo->commit();
        mpResponse(['ok'=>true,'weapon'=>['kind'=>'singularity','damage'=>150,'ammo'=>30,'maxAmmo'=>30,'weightKg'=>700],'credits'=>$wallet-50000,'cargo'=>['Ferro'=>(int)$ship['iron_kg']-1000,'Niquel'=>(int)$ship['nickel_kg']-700,'Cobalto'=>(int)$ship['cobalt_kg']-300]]);
    }

    if ($action === 'station-bank') {
        $stationCode = strtolower(trim((string)($_GET['station'] ?? mpInput()['station'] ?? '')));
        if (!preg_match('/^[a-z0-9_-]{2,40}$/', $stationCode)) mpResponse(['error'=>'Estação inválida.'],400);
        $stationQuery=$pdo->prepare('SELECT id,code,name,pos_x,pos_z,hull_hp FROM space_stations WHERE code=? AND is_active=1 LIMIT 1');
        $stationQuery->execute([$stationCode]); $station=$stationQuery->fetch(PDO::FETCH_ASSOC);
        if (!$station) mpResponse(['error'=>'Banco desta estação não encontrado.'],404);
        if ((int)$station['hull_hp']<1) mpResponse(['error'=>'Terminal offline: estacao desativada.'],409);
        $method=$_SERVER['REQUEST_METHOD'];
        if ($method==='POST') {
            $input=mpInput(); $operation=(string)($input['operation']??''); $resource=(string)($input['resource']??'');
            $amount=filter_var($input['amount']??null,FILTER_VALIDATE_INT);
            $fields=['iron'=>'iron_kg','nickel'=>'nickel_kg','cobalt'=>'cobalt_kg','ice'=>'ice_kg','energy'=>'energy_units','fuel'=>'fuel_units'];
            $bulk=$operation==='deposit_all';
            $equipmentResource=str_starts_with($resource,'equipment:');
            if ((!$bulk&&!in_array($operation,['deposit','withdraw'],true)) || (!$bulk&&!isset($fields[$resource])&&$resource!=='credits'&&!$equipmentResource) || ($equipmentResource&&$operation!=='withdraw') || (!$bulk&&($amount===false || $amount<1 || $amount>1000000))) mpResponse(['error'=>'Operacao, recurso ou quantidade invalida.'],400);
            $pdo->beginTransaction();
            $shipQuery=$pdo->prepare('SELECT id,pos_x,pos_z,hull_hp,iron_kg,nickel_kg,cobalt_kg,ice_kg,energy_units,cargo_capacity_kg,fuel_units,fuel_capacity_units,(SELECT COALESCE(SUM(e.weight_kg),0) FROM ship_equipment se JOIN equipment e ON e.id=se.equipment_id WHERE se.ship_id=ships.id AND se.is_equipped=1 AND se.quantity>0) AS weapon_weight FROM ships WHERE user_id=? AND is_active=1 LIMIT 1 FOR UPDATE');
            $shipQuery->execute([$userId]); $ship=$shipQuery->fetch(PDO::FETCH_ASSOC);
            if (!$ship || (int)$ship['hull_hp']<1) { $pdo->rollBack(); mpResponse(['error'=>'Sua nave nao esta operacional.'],409); }
            $distance=hypot((float)$ship['pos_x']-(float)$station['pos_x'],(float)$ship['pos_z']-(float)$station['pos_z']);
            if ($distance>2200) { $pdo->rollBack(); mpResponse(['error'=>'Aproxime-se a ate 2.200 km para acessar o banco.'],409); }
            $pdo->prepare('INSERT IGNORE INTO station_bank_accounts (user_id,station_id) VALUES (?,?)')->execute([$userId,(int)$station['id']]);
            $bankQuery=$pdo->prepare('SELECT id,credits FROM station_bank_accounts WHERE user_id=? AND station_id=? FOR UPDATE');
            $bankQuery->execute([$userId,(int)$station['id']]); $bank=$bankQuery->fetch(PDO::FETCH_ASSOC); $bankId=(int)$bank['id'];
            if ($bulk) {
                $balanceQuery=$pdo->prepare('SELECT credits FROM users WHERE id=? FOR UPDATE'); $balanceQuery->execute([$userId]); $wallet=(int)$balanceQuery->fetchColumn();
                if ($wallet>0) { $pdo->prepare('UPDATE users SET credits=0 WHERE id=?')->execute([$userId]); $pdo->prepare('UPDATE station_bank_accounts SET credits=credits+? WHERE id=?')->execute([$wallet,$bankId]); }
                $bulkFields=['iron'=>'iron_kg','nickel'=>'nickel_kg','cobalt'=>'cobalt_kg','ice'=>'ice_kg','energy'=>'energy_units','fuel'=>'fuel_units']; $moved=[];
                foreach($bulkFields as $code=>$column){$quantity=(int)floor((float)$ship[$column]);$moved[$code]=$quantity;if($quantity>0)$pdo->prepare('INSERT INTO station_bank_items (bank_id,item_code,quantity) VALUES (?,?,?) ON DUPLICATE KEY UPDATE quantity=quantity+VALUES(quantity)')->execute([$bankId,$code,$quantity]);}
                $pdo->prepare('UPDATE ships SET iron_kg=0,nickel_kg=0,cobalt_kg=0,ice_kg=0,energy_units=0,fuel_units=fuel_units-? WHERE id=?')->execute([$moved['fuel'],(int)$ship['id']]);
                $gearQuery=$pdo->prepare('SELECT se.equipment_id,se.quantity,se.ammo_current,e.code FROM ship_equipment se JOIN equipment e ON e.id=se.equipment_id WHERE se.ship_id=? AND se.is_equipped=0 AND se.quantity>0 FOR UPDATE'); $gearQuery->execute([(int)$ship['id']]);
                foreach($gearQuery->fetchAll(PDO::FETCH_ASSOC) as $gear){$gearKey='equipment:'.$gear['code'];$pdo->prepare('INSERT INTO station_bank_items (bank_id,item_code,quantity) VALUES (?,?,?) ON DUPLICATE KEY UPDATE quantity=quantity+VALUES(quantity)')->execute([$bankId,$gearKey,(int)$gear['quantity']]);if((int)$gear['ammo_current']>0)$pdo->prepare('INSERT INTO station_bank_items (bank_id,item_code,quantity) VALUES (?,?,?) ON DUPLICATE KEY UPDATE quantity=quantity+VALUES(quantity)')->execute([$bankId,'ammo:'.$gear['code'],(int)$gear['ammo_current']]);$pdo->prepare('DELETE FROM ship_equipment WHERE ship_id=? AND equipment_id=?')->execute([(int)$ship['id'],(int)$gear['equipment_id']]);}
            } elseif ($resource==='credits') {
                $balanceQuery=$pdo->prepare('SELECT credits FROM users WHERE id=? FOR UPDATE'); $balanceQuery->execute([$userId]); $wallet=(int)$balanceQuery->fetchColumn();
                if ($operation==='deposit') {
                    if ($wallet<$amount) { $pdo->rollBack(); mpResponse(['error'=>'Saldo de creditos insuficiente.'],409); }
                    $pdo->prepare('UPDATE users SET credits=credits-? WHERE id=?')->execute([$amount,$userId]);
                    $pdo->prepare('UPDATE station_bank_accounts SET credits=credits+? WHERE id=?')->execute([$amount,$bankId]);
                } else {
                    if ((int)$bank['credits']<$amount) { $pdo->rollBack(); mpResponse(['error'=>'Saldo insuficiente no banco desta estacao.'],409); }
                    $pdo->prepare('UPDATE station_bank_accounts SET credits=credits-? WHERE id=?')->execute([$amount,$bankId]);
                    $pdo->prepare('UPDATE users SET credits=credits+? WHERE id=?')->execute([$amount,$userId]);
                }
            } elseif ($equipmentResource) {
                $equipmentCode=substr($resource,10);
                if (!preg_match('/^[a-z0-9_-]{2,40}$/',$equipmentCode)) { $pdo->rollBack(); mpResponse(['error'=>'Item invalido.'],400); }
                $storedQuery=$pdo->prepare('SELECT quantity FROM station_bank_items WHERE bank_id=? AND item_code=? FOR UPDATE'); $storedQuery->execute([$bankId,$resource]); $stored=(int)$storedQuery->fetchColumn();
                if ($stored<$amount) { $pdo->rollBack(); mpResponse(['error'=>'Quantidade insuficiente no cofre.'],409); }
                $gearQuery=$pdo->prepare('SELECT id,ammo_capacity FROM equipment WHERE code=? AND is_available=1 LIMIT 1'); $gearQuery->execute([$equipmentCode]); $gear=$gearQuery->fetch(PDO::FETCH_ASSOC);
                if (!$gear) { $pdo->rollBack(); mpResponse(['error'=>'Equipamento nao encontrado no catalogo.'],404); }
                $ammoKey='ammo:'.$equipmentCode; $ammoQuery=$pdo->prepare('SELECT quantity FROM station_bank_items WHERE bank_id=? AND item_code=? FOR UPDATE'); $ammoQuery->execute([$bankId,$ammoKey]); $storedAmmo=(int)$ammoQuery->fetchColumn(); $ammo=min((int)$gear['ammo_capacity'],$storedAmmo);
                $pdo->prepare('INSERT INTO ship_equipment (ship_id,equipment_id,quantity,ammo_current,is_equipped) VALUES (?,?,?, ?,0) ON DUPLICATE KEY UPDATE quantity=quantity+VALUES(quantity),ammo_current=GREATEST(ammo_current,VALUES(ammo_current))')->execute([(int)$ship['id'],(int)$gear['id'],$amount,$ammo]);
                $pdo->prepare('UPDATE station_bank_items SET quantity=quantity-? WHERE bank_id=? AND item_code=?')->execute([$amount,$bankId,$resource]);
                if($ammo>0)$pdo->prepare('UPDATE station_bank_items SET quantity=GREATEST(0,quantity-?) WHERE bank_id=? AND item_code=?')->execute([$ammo,$bankId,$ammoKey]);
            } else {
                $column=$fields[$resource];
                if ($operation==='deposit') {
                    if ((float)$ship[$column]<$amount) { $pdo->rollBack(); mpResponse(['error'=>'Quantidade insuficiente na nave.'],409); }
                    $pdo->prepare('UPDATE ships SET '.$column.'='.$column.'-? WHERE id=?')->execute([$amount,(int)$ship['id']]);
                    $pdo->prepare('INSERT INTO station_bank_items (bank_id,item_code,quantity) VALUES (?,?,?) ON DUPLICATE KEY UPDATE quantity=quantity+VALUES(quantity)')->execute([$bankId,$resource,$amount]);
                } else {
                    $storedQuery=$pdo->prepare('SELECT quantity FROM station_bank_items WHERE bank_id=? AND item_code=? FOR UPDATE'); $storedQuery->execute([$bankId,$resource]); $stored=(int)$storedQuery->fetchColumn();
                    if ($stored<$amount) { $pdo->rollBack(); mpResponse(['error'=>'Quantidade insuficiente no cofre da estacao.'],409); }
                    if ($resource==='fuel' && (float)$ship['fuel_units']+$amount>(int)$ship['fuel_capacity_units']) { $pdo->rollBack(); mpResponse(['error'=>'O tanque da nave nao tem espaco para esse combustivel.'],409); }
                    if (in_array($resource,['iron','nickel','cobalt','ice'],true) && (int)$ship['iron_kg']+(int)$ship['nickel_kg']+(int)$ship['cobalt_kg']+(int)$ship['ice_kg']+(int)$ship['weapon_weight']+(int)ceil((float)$ship['fuel_units']*0.5)+$amount>(int)$ship['cargo_capacity_kg']) { $pdo->rollBack(); mpResponse(['error'=>'O compartimento da nave nao tem espaco para essa carga.'],409); }
                    $pdo->prepare('UPDATE station_bank_items SET quantity=quantity-? WHERE bank_id=? AND item_code=?')->execute([$amount,$bankId,$resource]);
                    $pdo->prepare('UPDATE ships SET '.$column.'='.$column.'+? WHERE id=?')->execute([$amount,(int)$ship['id']]);
                }
            }
            $pdo->commit();
        } elseif ($method!=='GET') mpResponse(['error'=>'Use GET ou POST para acessar o banco.'],405);
        $accountQuery=$pdo->prepare('SELECT id,credits FROM station_bank_accounts WHERE user_id=? AND station_id=?'); $accountQuery->execute([$userId,(int)$station['id']]); $account=$accountQuery->fetch(PDO::FETCH_ASSOC);
        $items=[];
        if ($account) { $itemsQuery=$pdo->prepare('SELECT item_code,quantity FROM station_bank_items WHERE bank_id=?'); $itemsQuery->execute([(int)$account['id']]); foreach($itemsQuery->fetchAll(PDO::FETCH_ASSOC) as $item)$items[$item['item_code']]=(int)$item['quantity']; }
        $shipQuery=$pdo->prepare('SELECT credits FROM users WHERE id=?'); $shipQuery->execute([$userId]); $wallet=(int)$shipQuery->fetchColumn();
        $cargoQuery=$pdo->prepare('SELECT iron_kg,nickel_kg,cobalt_kg,ice_kg,energy_units,fuel_units,fuel_capacity_units,(SELECT COALESCE(SUM(e.weight_kg),0) FROM ship_equipment se JOIN equipment e ON e.id=se.equipment_id WHERE se.ship_id=ships.id AND se.is_equipped=1 AND se.quantity>0) AS weapon_weight FROM ships WHERE user_id=? AND is_active=1 LIMIT 1'); $cargoQuery->execute([$userId]); $cargo=$cargoQuery->fetch(PDO::FETCH_ASSOC) ?: [];
        $priceRows=$pdo->query('SELECT code,unit_price_credits FROM mineral_catalog WHERE is_available=1')->fetchAll(PDO::FETCH_ASSOC); $prices=[]; foreach($priceRows as $row)$prices[$row['code']]=(int)$row['unit_price_credits'];
        mpResponse(['ok'=>true,'station'=>['code'=>$station['code'],'name'=>$station['name']],'prices'=>$prices,'bank'=>['credits'=>(int)($account['credits']??0),'items'=>$items],'ship'=>['credits'=>$wallet,'energy'=>(int)($cargo['energy_units']??0),'fuel'=>(float)($cargo['fuel_units']??0),'fuelCapacity'=>(int)($cargo['fuel_capacity_units']??0),'items'=>['iron'=>(int)($cargo['iron_kg']??0),'nickel'=>(int)($cargo['nickel_kg']??0),'cobalt'=>(int)($cargo['cobalt_kg']??0),'ice'=>(int)($cargo['ice_kg']??0)],'weaponWeight'=>(int)($cargo['weapon_weight']??0)]]);
    }
    if ($action === 'station-shipyard') {
        $stationCode=strtolower(trim((string)($_GET['station']??'')));
        if (!preg_match('/^[a-z0-9_-]{2,40}$/',$stationCode)) mpResponse(['error'=>'Estacao invalida.'],400);
        $stationQuery=$pdo->prepare('SELECT id,name,pos_x,pos_z,hull_hp FROM space_stations WHERE code=? AND is_active=1 LIMIT 1'); $stationQuery->execute([$stationCode]); $station=$stationQuery->fetch(PDO::FETCH_ASSOC);
        if (!$station || (int)$station['hull_hp']<1) mpResponse(['error'=>'Estacao indisponivel.'],409);
        $activeQuery=$pdo->prepare('SELECT id,pos_x,pos_z FROM ships WHERE user_id=? AND is_active=1 LIMIT 1'); $activeQuery->execute([$userId]); $active=$activeQuery->fetch(PDO::FETCH_ASSOC);
        if (!$active || hypot((float)$active['pos_x']-(float)$station['pos_x'],(float)$active['pos_z']-(float)$station['pos_z'])>2200) mpResponse(['error'=>'Aproxime-se da estacao para acessar o estaleiro.'],409);
        $fleetQuery=$pdo->prepare('SELECT id,ship_name,ship_class,cargo_capacity_kg,fuel_capacity_units,fuel_units,hull_hp,is_active,docked_station_id FROM ships WHERE user_id=? ORDER BY is_active DESC,id'); $fleetQuery->execute([$userId]);
        $fleet=array_map(static fn($ship)=>['id'=>(int)$ship['id'],'name'=>$ship['ship_name'],'model'=>$ship['ship_class'],'cargoCapacity'=>(int)$ship['cargo_capacity_kg'],'fuelCapacity'=>(int)$ship['fuel_capacity_units'],'fuel'=>(float)$ship['fuel_units'],'hull'=>(int)$ship['hull_hp'],'active'=>(bool)$ship['is_active'],'storedAt'=>(int)($ship['docked_station_id']??0),'availableHere'=>(int)($ship['docked_station_id']??0)===(int)$station['id']],$fleetQuery->fetchAll(PDO::FETCH_ASSOC));
        $walletQuery=$pdo->prepare('SELECT credits FROM users WHERE id=?'); $walletQuery->execute([$userId]);
        mpResponse(['ok'=>true,'station'=>$station['name'],'credits'=>(int)$walletQuery->fetchColumn(),'fleet'=>$fleet]);
    }

    if ($action === 'station-ship-purchase') {
        if ($_SERVER['REQUEST_METHOD']!=='POST') mpResponse(['error'=>'Use POST para adquirir uma nave.'],405);
        $input=mpInput(); $stationCode=strtolower(trim((string)($input['station']??''))); $model=(string)($input['model']??'');
        $catalog=['freighter'=>['name'=>'Atlas Hauler','price'=>220000,'cargo'=>12000,'fuel'=>1800,'hull'=>170],'attack'=>['name'=>'Viper Interceptor','price'=>380000,'cargo'=>1500,'fuel'=>1000,'hull'=>180]];
        if (!preg_match('/^[a-z0-9_-]{2,40}$/',$stationCode) || !isset($catalog[$model])) mpResponse(['error'=>'Nave ou estacao invalida.'],400);
        $stationQuery=$pdo->prepare('SELECT id,name,pos_x,pos_z,hull_hp FROM space_stations WHERE code=? AND is_active=1 LIMIT 1'); $stationQuery->execute([$stationCode]); $station=$stationQuery->fetch(PDO::FETCH_ASSOC);
        if (!$station || (int)$station['hull_hp']<1) mpResponse(['error'=>'Estacao indisponivel para venda.'],409);
        $pdo->beginTransaction();
        $shipQuery=$pdo->prepare('SELECT id,pos_x,pos_z,hull_hp FROM ships WHERE user_id=? AND is_active=1 LIMIT 1 FOR UPDATE'); $shipQuery->execute([$userId]); $active=$shipQuery->fetch(PDO::FETCH_ASSOC);
        if (!$active || (int)$active['hull_hp']<1) { $pdo->rollBack(); mpResponse(['error'=>'A nave atual precisa estar operacional para trocar no estaleiro.'],409); }
        if (hypot((float)$active['pos_x']-(float)$station['pos_x'],(float)$active['pos_z']-(float)$station['pos_z'])>2200) { $pdo->rollBack(); mpResponse(['error'=>'Aproxime-se da estacao para comprar uma nave.'],409); }
        $crewCheck=$pdo->prepare("SELECT 1 FROM ship_crew WHERE (captain_id=? OR copilot_id=?) AND status='active' LIMIT 1"); $crewCheck->execute([$userId,$userId]);
        if ($crewCheck->fetchColumn()) { $pdo->rollBack(); mpResponse(['error'=>'Encerre a tripulacao antes de trocar de nave.'],409); }
        $walletQuery=$pdo->prepare('SELECT credits FROM users WHERE id=? FOR UPDATE'); $walletQuery->execute([$userId]); $credits=(int)$walletQuery->fetchColumn(); $spec=$catalog[$model];
        if ($credits<$spec['price']) { $missing=(int)$spec['price']-$credits; $pdo->rollBack(); mpResponse(['error'=>'Compra nao realizada. Saldo atual: '.$credits.' CR; faltam '.$missing.' CR.'],409); }
        $pdo->prepare('UPDATE ships SET is_active=0,docked_station_id=?,pos_x=?,pos_y=0,pos_z=?,speed=0 WHERE id=? AND user_id=?')->execute([(int)$station['id'],(float)$station['pos_x'],(float)$station['pos_z'],(int)$active['id'],$userId]);
        $weaponCode=$model==='attack'?'heavy_plasma_cannon':'pulse_cannon';
        $pdo->prepare('INSERT INTO ships (user_id,ship_name,ship_class,cargo_capacity_kg,fuel_capacity_units,pos_x,pos_y,pos_z,hull_hp,fuel_units,selected_weapon_code,is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?,1)')
            ->execute([$userId,$spec['name'],$model,$spec['cargo'],$spec['fuel'],(float)$station['pos_x'],0,(float)$station['pos_z'],$spec['hull'],$spec['fuel'],$weaponCode]);
        $newShipId=(int)$pdo->lastInsertId();
        if ($model==='attack') {
            $weaponQuery=$pdo->prepare("SELECT id FROM equipment WHERE code='heavy_plasma_cannon' AND is_available=1 LIMIT 1"); $weaponQuery->execute(); $weaponId=(int)$weaponQuery->fetchColumn();
            if (!$weaponId) { $pdo->rollBack(); mpResponse(['error'=>'Canhao padrao indisponivel no catalogo.'],503); }
            $pdo->prepare('INSERT INTO ship_equipment (ship_id,equipment_id,quantity,ammo_current,is_equipped) VALUES (?,?,1,90,1)')->execute([$newShipId,$weaponId]);
        }
        $pdo->prepare('UPDATE users SET credits=credits-? WHERE id=?')->execute([$spec['price'],$userId]);
        $pdo->commit();
        mpResponse(['ok'=>true,'shipId'=>$newShipId,'model'=>$model,'name'=>$spec['name'],'price'=>$spec['price'],'credits'=>$credits-$spec['price']]);
    }

    if ($action === 'station-ship-activate') {
        if ($_SERVER['REQUEST_METHOD']!=='POST') mpResponse(['error'=>'Use POST para selecionar uma nave.'],405);
        $input=mpInput(); $stationCode=strtolower(trim((string)($input['station']??''))); $shipId=(int)($input['ship_id']??0);
        $stationQuery=$pdo->prepare('SELECT id,pos_x,pos_z,hull_hp FROM space_stations WHERE code=? AND is_active=1 LIMIT 1'); $stationQuery->execute([$stationCode]); $station=$stationQuery->fetch(PDO::FETCH_ASSOC);
        if (!$station || (int)$station['hull_hp']<1 || $shipId<1) mpResponse(['error'=>'Estacao ou nave indisponivel.'],409);
        $pdo->beginTransaction();
        $shipQuery=$pdo->prepare('SELECT id,pos_x,pos_z,hull_hp,docked_station_id FROM ships WHERE user_id=? AND is_active=1 LIMIT 1 FOR UPDATE'); $shipQuery->execute([$userId]); $active=$shipQuery->fetch(PDO::FETCH_ASSOC);
        $storedQuery=$pdo->prepare('SELECT id FROM ships WHERE id=? AND user_id=? AND is_active=0 AND docked_station_id=? FOR UPDATE'); $storedQuery->execute([$shipId,$userId,(int)$station['id']]); $stored=$storedQuery->fetchColumn();
        if (!$active || !$stored || hypot((float)$active['pos_x']-(float)$station['pos_x'],(float)$active['pos_z']-(float)$station['pos_z'])>2200) { $pdo->rollBack(); mpResponse(['error'=>'Nave guardada nao encontrada neste estaleiro ou nave atual fora de alcance.'],409); }
        $crewCheck=$pdo->prepare("SELECT 1 FROM ship_crew WHERE ship_id=? AND status='active' LIMIT 1"); $crewCheck->execute([(int)$active['id']]);
        if ($crewCheck->fetchColumn()) { $pdo->rollBack(); mpResponse(['error'=>'Encerre a tripulacao antes de trocar de nave.'],409); }
        $pdo->prepare('UPDATE ships SET is_active=0,docked_station_id=?,pos_x=?,pos_y=0,pos_z=?,speed=0 WHERE id=?')->execute([(int)$station['id'],(float)$station['pos_x'],(float)$station['pos_z'],(int)$active['id']]);
        $pdo->prepare('UPDATE ships SET is_active=1,docked_station_id=NULL,pos_x=?,pos_y=0,pos_z=?,speed=0 WHERE id=? AND user_id=?')->execute([(float)$station['pos_x'],(float)$station['pos_z'],$shipId,$userId]);
        $pdo->prepare("UPDATE station_trades SET status='cancelled' WHERE status='open' AND (player_a_id=? OR player_b_id=?)")->execute([$userId,$userId]);
        $pdo->prepare("DELETE FROM station_occupants WHERE user_id=? AND mode='station'")->execute([$userId]);
        $pdo->commit(); mpResponse(['ok'=>true,'shipId'=>$shipId]);
    }

    if ($action === 'station-refuel') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error'=>'Use POST para abastecer a nave.'],405);
        $input=mpInput(); $stationCode=strtolower(trim((string)($input['station']??'')));
        $amount=filter_var($input['amount']??null,FILTER_VALIDATE_INT);
        if (!preg_match('/^[a-z0-9_-]{2,40}$/',$stationCode) || $amount===false || $amount<1 || $amount>1000) mpResponse(['error'=>'Esta??o ou quantidade de combust?vel inv?lida.'],400);
        $stationQuery=$pdo->prepare('SELECT id,name,pos_x,pos_z,hull_hp FROM space_stations WHERE code=? AND is_active=1 LIMIT 1'); $stationQuery->execute([$stationCode]); $station=$stationQuery->fetch(PDO::FETCH_ASSOC);
        if (!$station || (int)$station['hull_hp']<1) mpResponse(['error'=>'Esta??o indispon?vel para abastecimento.'],409);
        $pdo->beginTransaction();
        $shipQuery=$pdo->prepare('SELECT id,pos_x,pos_z,hull_hp,fuel_units,fuel_capacity_units FROM ships WHERE user_id=? AND is_active=1 LIMIT 1 FOR UPDATE'); $shipQuery->execute([$userId]); $ship=$shipQuery->fetch(PDO::FETCH_ASSOC);
        if (!$ship || (int)$ship['hull_hp']<1) { $pdo->rollBack(); mpResponse(['error'=>'Sua nave n?o est? operacional.'],409); }
        if (hypot((float)$ship['pos_x']-(float)$station['pos_x'],(float)$ship['pos_z']-(float)$station['pos_z'])>2200) { $pdo->rollBack(); mpResponse(['error'=>'Aproxime-se a at? 2.200 km para abastecer.'],409); }
        $quantity=min((float)$amount,max(0,(int)$ship['fuel_capacity_units']-(float)$ship['fuel_units']));
        if ($quantity<=0) { $pdo->rollBack(); mpResponse(['error'=>'O tanque j? est? cheio.'],409); }
        $cost=(int)ceil($quantity/10);
        $walletQuery=$pdo->prepare('SELECT credits FROM users WHERE id=? FOR UPDATE'); $walletQuery->execute([$userId]); $credits=(int)$walletQuery->fetchColumn();
        if ($credits<$cost) { $pdo->rollBack(); mpResponse(['error'=>'Cr?ditos insuficientes. Cada 10 unidades custam 1 CR.'],409); }
        $pdo->prepare('UPDATE ships SET fuel_units=LEAST(fuel_capacity_units,fuel_units+?) WHERE id=?')->execute([$quantity,(int)$ship['id']]);
        $pdo->prepare('UPDATE users SET credits=credits-? WHERE id=?')->execute([$cost,$userId]);
        $pdo->commit();
        $fuelQuery=$pdo->prepare('SELECT fuel_units FROM ships WHERE id=?'); $fuelQuery->execute([(int)$ship['id']]);
        $balanceQuery=$pdo->prepare('SELECT credits FROM users WHERE id=?'); $balanceQuery->execute([$userId]);
        mpResponse(['ok'=>true,'station'=>$station['name'],'purchased'=>$quantity,'cost'=>$cost,'fuel'=>(float)$fuelQuery->fetchColumn(),'fuelCapacity'=>(int)$ship['fuel_capacity_units'],'credits'=>(int)$balanceQuery->fetchColumn()]);
    }

    if ($action === 'station-sale') {
        if ($_SERVER['REQUEST_METHOD']!=='POST') mpResponse(['error'=>'Use POST para vender recursos.'],405);
        $input=mpInput(); $stationCode=strtolower(trim((string)($_GET['station']??$input['station']??'')));
        $resource=(string)($input['resource']??''); $source=(string)($input['source']??'ship');
        $amount=filter_var($input['amount']??null,FILTER_VALIDATE_INT);
        if (!preg_match('/^[a-z0-9_-]{2,40}$/',$stationCode) || !in_array($resource,['iron','nickel','cobalt'],true) || !in_array($source,['ship','bank'],true) || $amount===false || $amount<1 || $amount>1000000) mpResponse(['error'=>'Estação, minério, quantidade ou origem inválida.'],400);
        $stationQuery=$pdo->prepare('SELECT id,code,name,pos_x,pos_z,hull_hp FROM space_stations WHERE code=? AND is_active=1 LIMIT 1'); $stationQuery->execute([$stationCode]); $station=$stationQuery->fetch(PDO::FETCH_ASSOC);
        $priceQuery=$pdo->prepare('SELECT name,unit_price_credits FROM mineral_catalog WHERE code=? AND is_available=1'); $priceQuery->execute([$resource]); $mineral=$priceQuery->fetch(PDO::FETCH_ASSOC);
        if (!$station || !$mineral) mpResponse(['error'=>'Estação ou minério indisponível para venda.'],404);
        if ((int)$station['hull_hp']<1) mpResponse(['error'=>'Terminal offline: estacao desativada.'],409);
        $pdo->beginTransaction();
        $shipQuery=$pdo->prepare('SELECT id,pos_x,pos_z,hull_hp,iron_kg,nickel_kg,cobalt_kg FROM ships WHERE user_id=? AND is_active=1 LIMIT 1 FOR UPDATE'); $shipQuery->execute([$userId]); $ship=$shipQuery->fetch(PDO::FETCH_ASSOC);
        if (!$ship || (int)$ship['hull_hp']<1) { $pdo->rollBack(); mpResponse(['error'=>'Sua nave não está operacional.'],409); }
        if (hypot((float)$ship['pos_x']-(float)$station['pos_x'],(float)$ship['pos_z']-(float)$station['pos_z'])>2200) { $pdo->rollBack(); mpResponse(['error'=>'Aproxime-se a até 2.200 km para negociar.'],409); }
        $column=['iron'=>'iron_kg','nickel'=>'nickel_kg','cobalt'=>'cobalt_kg'][$resource];
        $bankId=0;
        if ($source==='ship') {
            if ((int)$ship[$column]<$amount) { $pdo->rollBack(); mpResponse(['error'=>'A nave não possui essa quantidade do minério.'],409); }
            $pdo->prepare('UPDATE ships SET '.$column.'='.$column.'-? WHERE id=?')->execute([$amount,(int)$ship['id']]);
        } else {
            $pdo->prepare('INSERT IGNORE INTO station_bank_accounts (user_id,station_id) VALUES (?,?)')->execute([$userId,(int)$station['id']]);
            $bankQuery=$pdo->prepare('SELECT id FROM station_bank_accounts WHERE user_id=? AND station_id=? FOR UPDATE'); $bankQuery->execute([$userId,(int)$station['id']]); $bankId=(int)$bankQuery->fetchColumn();
            $itemQuery=$pdo->prepare('SELECT quantity FROM station_bank_items WHERE bank_id=? AND item_code=? FOR UPDATE'); $itemQuery->execute([$bankId,$resource]);
            if ((int)$itemQuery->fetchColumn()<$amount) { $pdo->rollBack(); mpResponse(['error'=>'O cofre desta estação não possui essa quantidade.'],409); }
            $pdo->prepare('UPDATE station_bank_items SET quantity=quantity-? WHERE bank_id=? AND item_code=?')->execute([$amount,$bankId,$resource]);
        }
        $unitPrice=intdiv((int)$mineral['unit_price_credits'],2); $total=$unitPrice*$amount;
        $pdo->prepare('UPDATE users SET credits=credits+? WHERE id=?')->execute([$total,$userId]);
        $pdo->commit();
        $walletQuery=$pdo->prepare('SELECT credits FROM users WHERE id=?'); $walletQuery->execute([$userId]);
        $cargoQuery=$pdo->prepare('SELECT iron_kg,nickel_kg,cobalt_kg FROM ships WHERE id=?'); $cargoQuery->execute([(int)$ship['id']]); $cargo=$cargoQuery->fetch(PDO::FETCH_ASSOC);
        $bankCredits=0; $bankItems=[];
        if ($bankId) { $bankBalance=$pdo->prepare('SELECT credits FROM station_bank_accounts WHERE id=?'); $bankBalance->execute([$bankId]); $bankCredits=(int)$bankBalance->fetchColumn(); $bankItemRows=$pdo->prepare('SELECT item_code,quantity FROM station_bank_items WHERE bank_id=?'); $bankItemRows->execute([$bankId]); foreach($bankItemRows->fetchAll(PDO::FETCH_ASSOC) as $row)$bankItems[$row['item_code']]=(int)$row['quantity']; }
        mpResponse(['ok'=>true,'sold'=>['resource'=>$resource,'source'=>$source,'quantity'=>$amount,'unitPrice'=>$unitPrice,'total'=>$total,'basePrice'=>(int)$mineral['unit_price_credits'],'rate'=>50],'station'=>$station['name'],'credits'=>(int)$walletQuery->fetchColumn(),'cargo'=>['Ferro'=>(int)$cargo['iron_kg'],'Niquel'=>(int)$cargo['nickel_kg'],'Cobalto'=>(int)$cargo['cobalt_kg']],'bank'=>['credits'=>$bankCredits,'items'=>$bankItems]]);
    }

    if ($action === 'station-dock') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error'=>'Use POST.'],405);
        $code=strtolower(trim((string)(mpInput()['station']??'')));
        $q=$pdo->prepare('SELECT id,name,pos_x,pos_z,hull_hp FROM space_stations WHERE code=? AND is_active=1 LIMIT 1'); $q->execute([$code]); $station=$q->fetch(PDO::FETCH_ASSOC);
        if (!$station) mpResponse(['error'=>'Estacao nao encontrada.'],404);
        $alreadyCrew=$pdo->prepare("SELECT 1 FROM ship_crew WHERE copilot_id=? AND status='active' LIMIT 1"); $alreadyCrew->execute([$userId]); if ($alreadyCrew->fetchColumn()) mpResponse(['error'=>'Desembarque da nave atual antes de acoplar outra.'],409);
        $pdo->beginTransaction();
        $q=$pdo->prepare('SELECT id,pos_x,pos_z,hull_hp,docked_station_id FROM ships WHERE user_id=? AND is_active=1 LIMIT 1 FOR UPDATE'); $q->execute([$userId]); $ship=$q->fetch(PDO::FETCH_ASSOC);
        if (!$ship || (int)$ship['hull_hp']<1) { $pdo->rollBack(); mpResponse(['error'=>'Sua nave nao esta operacional.'],409); }
        if (hypot((float)$ship['pos_x']-(float)$station['pos_x'],(float)$ship['pos_z']-(float)$station['pos_z'])>2200) { $pdo->rollBack(); mpResponse(['error'=>'Aproxime-se da estacao para acoplar.'],409); }
        if ((int)$station['hull_hp']<1) { $pdo->rollBack(); mpResponse(['error'=>'A estacao esta inoperante.'],409); }
        $pdo->prepare('UPDATE ships SET pos_x=?,pos_y=0,pos_z=?,speed=0,docked_station_id=? WHERE id=?')->execute([$station['pos_x'],$station['pos_z'],(int)$station['id'],(int)$ship['id']]);
        $pdo->prepare("INSERT INTO station_occupants(user_id,station_id,mode,ship_id) VALUES(?,?,'station',NULL) ON DUPLICATE KEY UPDATE station_id=VALUES(station_id),mode='station',ship_id=NULL")->execute([$userId,(int)$station['id']]);
        $pdo->prepare("UPDATE ship_crew SET station_id=? WHERE ship_id=? AND status='active'")->execute([(int)$station['id'],(int)$ship['id']]);
        $pdo->prepare("UPDATE station_occupants SET station_id=? WHERE ship_id=? AND mode='aboard'")->execute([(int)$station['id'],(int)$ship['id']]);
        $arrivalQuery=$pdo->prepare("SELECT passenger_id FROM ship_passengers WHERE ship_id=? AND destination_station_id=? AND status='active' FOR UPDATE");$arrivalQuery->execute([(int)$ship['id'],(int)$station['id']]);$arrivedPassengers=array_map('intval',$arrivalQuery->fetchAll(PDO::FETCH_COLUMN));
        if($arrivedPassengers){$pdo->prepare("UPDATE ship_passengers SET status='completed',arrived_at=NOW() WHERE ship_id=? AND destination_station_id=? AND status='active'")->execute([(int)$ship['id'],(int)$station['id']]);$leaveholders=implode(',',array_fill(0,count($arrivedPassengers),'?'));$pdo->prepare("UPDATE station_occupants SET mode='station',ship_id=NULL,station_id=? WHERE user_id IN ($leaveholders)")->execute(array_merge([(int)$station['id']],$arrivedPassengers));}
        $pdo->commit(); mpResponse(['ok'=>true,'station'=>$station['name'],'station_id'=>(int)$station['id'],'ship_id'=>(int)$ship['id']]);
    }

    if ($action === 'passenger-request') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error'=>'Use POST para pedir carona.'],405);
        mpEnsurePassengerRequests($pdo);
        $input=mpInput();$shipId=(int)($input['ship_id']??0);$destinationId=(int)($input['destination_station_id']??0);
        if($shipId<1||$destinationId<1)mpResponse(['error'=>'Selecione a nave e o destino.'],400);
        $where=$pdo->prepare("SELECT station_id FROM station_occupants WHERE user_id=? AND mode='station' LIMIT 1");$where->execute([$userId]);$stationId=(int)$where->fetchColumn();
        if(!$stationId)mpResponse(['error'=>'Entre na estação para pedir carona.'],409);
        $shipQuery=$pdo->prepare("SELECT s.id,s.user_id,s.ship_class,s.docked_station_id,s.hull_hp,EXISTS(SELECT 1 FROM station_occupants so JOIN users u ON u.id=so.user_id WHERE so.user_id=s.user_id AND so.station_id=s.docked_station_id AND so.mode='station' AND u.last_seen_at>=DATE_SUB(NOW(),INTERVAL 30 SECOND)) AS pilot_present FROM ships s WHERE s.id=? AND s.is_active=1 AND s.docked_station_id=? AND s.user_id<>? FOR UPDATE");$shipQuery->execute([$shipId,$stationId,$userId]);$ship=$shipQuery->fetch(PDO::FETCH_ASSOC);
        if(!$ship||(int)$ship['hull_hp']<1||(int)$ship['pilot_present']!==1)mpResponse(['error'=>'A nave ou o piloto nao esta disponivel nesta estação.'],409);
        $dest=$pdo->prepare('SELECT id FROM space_stations WHERE id=? AND is_active=1 AND hull_hp>0');$dest->execute([$destinationId]);if(!$dest->fetchColumn()||$destinationId===$stationId)mpResponse(['error'=>'Escolha outra estação como destino.'],400);
        $passengerCheck=$pdo->prepare("SELECT 1 FROM ship_passengers WHERE passenger_id=? AND status='active' UNION SELECT 1 FROM ship_crew WHERE copilot_id=? AND status='active' LIMIT 1");$passengerCheck->execute([$userId,$userId]);if($passengerCheck->fetchColumn())mpResponse(['error'=>'Você já está embarcado em outra nave.'],409);
        $count=$pdo->prepare("SELECT COUNT(*) FROM ship_passengers WHERE ship_id=? AND status='active'");$count->execute([$shipId]);$capacity=(string)$ship['ship_class']==='freighter'?12:((string)$ship['ship_class']==='attack'?2:4);if((int)$count->fetchColumn()>=$capacity)mpResponse(['error'=>'Essa nave está sem assentos disponíveis.'],409);
        $existing=$pdo->prepare("SELECT id FROM ship_passenger_requests WHERE ship_id=? AND passenger_id=? AND status='pending' ORDER BY id DESC LIMIT 1");$existing->execute([$shipId,$userId]);$requestId=(int)$existing->fetchColumn();
        if(!$requestId){$insert=$pdo->prepare("INSERT INTO ship_passenger_requests(ship_id,passenger_id,origin_station_id,destination_station_id) VALUES(?,?,?,?)");$insert->execute([$shipId,$userId,$stationId,$destinationId]);$requestId=(int)$pdo->lastInsertId();}
        mpResponse(['ok'=>true,'request_id'=>$requestId,'message'=>'Pedido enviado ao piloto.']);
    }

    if ($action === 'passenger-request-respond') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error'=>'Use POST para responder ao pedido.'],405);
        mpEnsurePassengerRequests($pdo);$input=mpInput();$requestId=(int)($input['request_id']??0);$accept=!empty($input['accept']);
        if($requestId<1)mpResponse(['error'=>'Pedido de carona invalido.'],400);
        $pdo->beginTransaction();$q=$pdo->prepare("SELECT r.*,s.user_id AS pilot_id,s.is_active,s.docked_station_id,s.hull_hp,s.ship_class FROM ship_passenger_requests r JOIN ships s ON s.id=r.ship_id WHERE r.id=? AND r.status='pending' FOR UPDATE");$q->execute([$requestId]);$ride=$q->fetch(PDO::FETCH_ASSOC);
        if(!$ride||(int)$ride['pilot_id']!==$userId){$pdo->rollBack();mpResponse(['error'=>'Esse pedido nao esta disponivel para sua nave.'],409);}
        if(!$accept){$pdo->prepare("UPDATE ship_passenger_requests SET status='declined' WHERE id=?")->execute([$requestId]);$pdo->commit();mpResponse(['ok'=>true,'accepted'=>false]);}
        $present=$pdo->prepare("SELECT 1 FROM station_occupants WHERE user_id=? AND station_id=? AND mode='station'");$present->execute([$userId,(int)$ride['origin_station_id']]);$pilotPresent=(bool)$present->fetchColumn();$present->execute([(int)$ride['passenger_id'],(int)$ride['origin_station_id']]);$passengerPresent=(bool)$present->fetchColumn();
        $count=$pdo->prepare("SELECT COUNT(*) FROM ship_passengers WHERE ship_id=? AND status='active'");$count->execute([(int)$ride['ship_id']]);$capacity=(string)$ride['ship_class']==='freighter'?12:((string)$ride['ship_class']==='attack'?2:4);
        if(!$pilotPresent||!$passengerPresent||!(bool)$ride['is_active']||(int)$ride['hull_hp']<1||(int)$ride['docked_station_id']!==(int)$ride['origin_station_id']||(int)$count->fetchColumn()>=$capacity){$pdo->rollBack();mpResponse(['error'=>'A nave, o piloto, o passageiro ou o assento ja nao esta disponivel.'],409);}
        $pdo->prepare("INSERT INTO ship_passengers(ship_id,passenger_id,origin_station_id,destination_station_id,fare_credits,status) VALUES(?,?,?,?,0,'active')")->execute([(int)$ride['ship_id'],(int)$ride['passenger_id'],(int)$ride['origin_station_id'],(int)$ride['destination_station_id']]);
        $pdo->prepare("UPDATE station_occupants SET mode='aboard',ship_id=?,room_pos_x=50,room_pos_z=66.5,room_yaw=0 WHERE user_id=? AND station_id=? AND mode='station'")->execute([(int)$ride['ship_id'],(int)$ride['passenger_id'],(int)$ride['origin_station_id']]);
        $pdo->prepare("UPDATE ship_passenger_requests SET status='accepted' WHERE id=?")->execute([$requestId]);$pdo->commit();mpResponse(['ok'=>true,'accepted'=>true,'passenger_id'=>(int)$ride['passenger_id']]);
    }

    if ($action === 'passenger-book') {
        if ($_SERVER['REQUEST_METHOD']!=='POST') mpResponse(['error'=>'Use POST para comprar uma passagem.'],405);
        $input=mpInput(); $shipId=(int)($input['ship_id']??0); $destinationId=(int)($input['destination_station_id']??0);
        if($shipId<1||$destinationId<1)mpResponse(['error'=>'Selecione uma nave e um destino.'],400);
        $pdo->beginTransaction();
        $where=$pdo->prepare("SELECT so.station_id,so.mode FROM station_occupants so WHERE so.user_id=? FOR UPDATE");$where->execute([$userId]);$occupant=$where->fetch(PDO::FETCH_ASSOC);
        if(!$occupant||$occupant['mode']!=='station'){$pdo->rollBack();mpResponse(['error'=>'Voce precisa estar dentro da estacao de embarque.'],409);}
        $shipQuery=$pdo->prepare("SELECT s.id,s.user_id,s.ship_class,s.ship_name,s.docked_station_id,s.hull_hp,ss.pos_x AS origin_x,ss.pos_z AS origin_z,dest.id AS destination_id,dest.name AS destination_name,dest.pos_x AS destination_x,dest.pos_z AS destination_z,u.credits,u.username AS pilot_name,EXISTS(SELECT 1 FROM station_occupants pilot WHERE pilot.user_id=s.user_id AND pilot.station_id=s.docked_station_id AND pilot.mode='station' AND u.last_seen_at>=DATE_SUB(NOW(),INTERVAL 30 SECOND)) AS pilot_present,(SELECT COUNT(*) FROM ship_passengers p WHERE p.ship_id=s.id AND p.status='active') AS passenger_count FROM ships s JOIN space_stations ss ON ss.id=s.docked_station_id AND ss.hull_hp>0 JOIN space_stations dest ON dest.id=? AND dest.is_active=1 AND dest.hull_hp>0 JOIN users u ON u.id=s.user_id WHERE s.id=? AND s.is_active=1 AND s.docked_station_id=? AND s.user_id<>? AND s.hull_hp>0 FOR UPDATE");
        $shipQuery->execute([$destinationId,$shipId,(int)$occupant['station_id'],$userId]);$ship=$shipQuery->fetch(PDO::FETCH_ASSOC);
        if(!$ship||(int)$ship['destination_id']===(int)$occupant['station_id']||(int)$ship['pilot_present']!==1){$pdo->rollBack();mpResponse(['error'=>'Essa nave nao esta disponivel para embarque. Escolha uma nave ativa com o piloto presente.'],409);}
        $crewCheck=$pdo->prepare("SELECT 1 FROM ship_crew WHERE (captain_id=? OR copilot_id=?) AND status IN ('active','pending') LIMIT 1");$crewCheck->execute([$userId,$userId]);
        if($crewCheck->fetchColumn()){$pdo->rollBack();mpResponse(['error'=>'Tripulantes nao podem comprar passagem para outra nave.'],409);}
        $passengerCheck=$pdo->prepare("SELECT 1 FROM ship_passengers WHERE passenger_id=? AND status='active' LIMIT 1");$passengerCheck->execute([$userId]);
        if($passengerCheck->fetchColumn()){$pdo->rollBack();mpResponse(['error'=>'Voce ja esta em uma viagem como passageiro.'],409);}
        $seatLimit=(string)$ship['ship_class']==='freighter'?12:((string)$ship['ship_class']==='attack'?2:4);
        if((int)$ship['passenger_count']>=$seatLimit){$pdo->rollBack();mpResponse(['error'=>'A nave ja ocupou todos os assentos de passageiros.'],409);}
        $distance=hypot((float)$ship['origin_x']-(float)$ship['destination_x'],(float)$ship['origin_z']-(float)$ship['destination_z']);
        $fare=max(100,min(1000000,(int)ceil($distance/1000)*10));
        $wallet=$pdo->prepare('SELECT credits FROM users WHERE id=? FOR UPDATE');$wallet->execute([$userId]);$credits=(int)$wallet->fetchColumn();
        if($credits<$fare){$pdo->rollBack();mpResponse(['error'=>'Creditos insuficientes. A passagem custa '.$fare.' CR.'],409);}
        $pdo->prepare("INSERT INTO ship_passengers(ship_id,passenger_id,origin_station_id,destination_station_id,fare_credits,status) VALUES(?,?,?,?,?,'active')")->execute([$shipId,$userId,(int)$occupant['station_id'],$destinationId,$fare]);
        $pdo->prepare('UPDATE users SET credits=credits-? WHERE id=?')->execute([$fare,$userId]);
        $pdo->prepare('UPDATE users SET credits=credits+? WHERE id=?')->execute([$fare,(int)$ship['user_id']]);
        $pdo->prepare("UPDATE station_occupants SET mode='aboard',ship_id=?,room_pos_x=50,room_pos_z=66.5,room_yaw=0 WHERE user_id=?")->execute([$shipId,$userId]);
        $pdo->commit();
        mpResponse(['ok'=>true,'ship'=>$ship['ship_name'],'pilot'=>$ship['pilot_name'],'destination'=>$ship['destination_name'],'fare'=>$fare,'credits'=>$credits-$fare]);
    }

    if ($action === 'station-room') {
        $q=$pdo->prepare("SELECT so.mode,so.station_id,so.ship_id,ss.code,ss.name,ss.hull_hp,ss.pos_x,ss.pos_z FROM station_occupants so JOIN space_stations ss ON ss.id=so.station_id WHERE so.user_id=? LIMIT 1"); $q->execute([$userId]); $location=$q->fetch(PDO::FETCH_ASSOC);
        if (!$location) mpResponse(['inside'=>false,'pending'=>[]]);
        $pdo->prepare('UPDATE users SET last_seen_at=NOW() WHERE id=?')->execute([$userId]);
        $q=$pdo->prepare("SELECT so.user_id,u.username,u.avatar_code,so.mode,so.room_pos_x,so.room_pos_z,so.room_yaw,s.ship_name,EXISTS(SELECT 1 FROM ships own_ship WHERE own_ship.user_id=so.user_id AND own_ship.is_active=1 AND own_ship.docked_station_id=so.station_id) AS has_ship FROM station_occupants so JOIN users u ON u.id=so.user_id LEFT JOIN ships s ON s.id=so.ship_id WHERE so.station_id=? AND so.mode='station' AND (u.last_seen_at>=DATE_SUB(NOW(),INTERVAL 30 SECOND) OR so.user_id=?) ORDER BY u.username"); $q->execute([(int)$location['station_id'],$userId]); $occupants=$q->fetchAll(PDO::FETCH_ASSOC);
        $dockedQuery=$pdo->prepare("SELECT s.id,s.ship_name,s.ship_class,s.is_active,s.hull_hp,s.fuel_units,s.fuel_capacity_units,s.energy_units,s.iron_kg,s.nickel_kg,s.cobalt_kg,s.ice_kg,s.cargo_capacity_kg,u.id AS owner_id,u.username,u.avatar_code,EXISTS(SELECT 1 FROM station_occupants pilot WHERE pilot.user_id=u.id AND pilot.station_id=s.docked_station_id AND pilot.mode='station' AND u.last_seen_at>=DATE_SUB(NOW(),INTERVAL 30 SECOND)) AS pilot_present,(SELECT COUNT(*) FROM ship_passengers p WHERE p.ship_id=s.id AND p.status='active') AS passenger_count FROM ships s JOIN users u ON u.id=s.user_id WHERE s.docked_station_id=? AND s.hull_hp>0 ORDER BY s.is_active DESC,s.ship_name"); $dockedQuery->execute([(int)$location['station_id']]); $dockedShips=$dockedQuery->fetchAll(PDO::FETCH_ASSOC);
        $q=$pdo->prepare("SELECT sc.ship_id,sc.captain_id,u.username AS captain_name,s.ship_name,ss.name AS station_name FROM ship_crew sc JOIN users u ON u.id=sc.captain_id JOIN ships s ON s.id=sc.ship_id JOIN space_stations ss ON ss.id=sc.station_id WHERE sc.copilot_id=? AND sc.request_by='captain' AND sc.status='pending'"); $q->execute([$userId]); $pending=$q->fetchAll(PDO::FETCH_ASSOC);
        $q=$pdo->prepare("SELECT sc.ship_id,sc.copilot_id,sc.captain_id,sc.status,sc.request_by,uc.username AS copilot_name,up.username AS captain_name FROM ship_crew sc JOIN users uc ON uc.id=sc.copilot_id JOIN users up ON up.id=sc.captain_id WHERE (sc.captain_id=? OR sc.copilot_id=?) AND sc.status IN ('pending','active')"); $q->execute([$userId,$userId]); $crew=$q->fetchAll(PDO::FETCH_ASSOC);
        $requests=array_values(array_filter($crew,static fn($row)=>$row['status']==='pending' && $row['request_by']==='copilot' && (int)$row['captain_id']===$userId));
        mpEnsurePassengerRequests($pdo);$rideQuery=$pdo->prepare("SELECT r.id,r.ship_id,r.passenger_id,u.username AS passenger_name,dest.name AS destination_name FROM ship_passenger_requests r JOIN ships s ON s.id=r.ship_id JOIN users u ON u.id=r.passenger_id JOIN space_stations dest ON dest.id=r.destination_station_id WHERE s.user_id=? AND s.docked_station_id=? AND r.status='pending' AND u.last_seen_at>=DATE_SUB(NOW(),INTERVAL 30 SECOND) ORDER BY r.created_at");$rideQuery->execute([$userId,(int)$location['station_id']]);$rideRequests=$rideQuery->fetchAll(PDO::FETCH_ASSOC);
        $passengerQuery=$pdo->prepare("SELECT p.ship_id,p.fare_credits,p.origin_station_id,p.destination_station_id,s.ship_name,s.docked_station_id,origin.name AS origin_name,dest.name AS destination_name,pilot.username AS pilot_name,pilot.avatar_code AS pilot_avatar,copilot.username AS copilot_name,copilot.avatar_code AS copilot_avatar FROM ship_passengers p JOIN ships s ON s.id=p.ship_id JOIN space_stations origin ON origin.id=p.origin_station_id JOIN space_stations dest ON dest.id=p.destination_station_id JOIN users pilot ON pilot.id=s.user_id LEFT JOIN ship_crew sc ON sc.ship_id=s.id AND sc.status='active' LEFT JOIN users copilot ON copilot.id=sc.copilot_id WHERE p.passenger_id=? AND p.status='active' LIMIT 1");$passengerQuery->execute([$userId]);$passenger=$passengerQuery->fetch(PDO::FETCH_ASSOC);
         $passengerOccupants=[]; if($passenger){$shipCrewQuery=$pdo->prepare("SELECT members.user_id,members.username,members.avatar_code,members.mode,members.room_pos_x,members.room_pos_z,members.room_yaw FROM (SELECT u.id AS user_id,u.username,u.avatar_code,'pilot' AS mode,50.0 AS room_pos_x,30.0 AS room_pos_z,0.0 AS room_yaw,s.id AS ship_id FROM ships s JOIN users u ON u.id=s.user_id UNION ALL SELECT u.id,u.username,u.avatar_code,'copilot',50.0,34.0,0.0,sc.ship_id FROM ship_crew sc JOIN users u ON u.id=sc.copilot_id WHERE sc.status='active' UNION ALL SELECT so.user_id,u.username,u.avatar_code,'passenger',so.room_pos_x,so.room_pos_z,so.room_yaw,so.ship_id FROM station_occupants so JOIN users u ON u.id=so.user_id WHERE so.mode='aboard' AND NOT EXISTS(SELECT 1 FROM ship_crew crew_member WHERE crew_member.ship_id=so.ship_id AND crew_member.copilot_id=so.user_id AND crew_member.status='active')) members WHERE members.ship_id=? AND (members.user_id=? OR EXISTS(SELECT 1 FROM users active_user WHERE active_user.id=members.user_id AND active_user.last_seen_at>=DATE_SUB(NOW(),INTERVAL 30 SECOND))) ORDER BY members.user_id");$shipCrewQuery->execute([(int)$passenger['ship_id'],$userId]);$passengerOccupants=$shipCrewQuery->fetchAll(PDO::FETCH_ASSOC);}
        $role=$passenger?'passenger':($location['mode']==='aboard'?'copilot':'pilot');
        if($passenger){$location['ship_id']=$passenger['ship_id'];}
        $manifestQuery=$pdo->prepare("SELECT p.passenger_id,u.username,p.fare_credits,dest.name AS destination_name FROM ship_passengers p JOIN users u ON u.id=p.passenger_id JOIN space_stations dest ON dest.id=p.destination_station_id WHERE p.ship_id=? AND p.status='active' ORDER BY p.boarded_at");$manifestShip=(int)($location['ship_id']??0);if(!$manifestShip){$ownShip=$pdo->prepare('SELECT id FROM ships WHERE user_id=? AND is_active=1 AND docked_station_id=? LIMIT 1');$ownShip->execute([$userId,(int)$location['station_id']]);$manifestShip=(int)$ownShip->fetchColumn();}$manifestQuery->execute([$manifestShip]);$passengerManifest=$manifestQuery->fetchAll(PDO::FETCH_ASSOC);
        $stationQuery=$pdo->prepare('SELECT id,name,code,pos_x,pos_z FROM space_stations WHERE is_active=1 AND hull_hp>0 ORDER BY name');$stationQuery->execute();$stationList=$stationQuery->fetchAll(PDO::FETCH_ASSOC);
        $canUndockQuery=$pdo->prepare('SELECT 1 FROM ships WHERE user_id=? AND is_active=1 AND docked_station_id=? LIMIT 1');$canUndockQuery->execute([$userId,(int)$location['station_id']]);$canUndock=(bool)$canUndockQuery->fetchColumn();$myShipQuery=$pdo->prepare('SELECT ship_name,ship_class,fuel_units,fuel_capacity_units,energy_units,iron_kg,nickel_kg,cobalt_kg,ice_kg,cargo_capacity_kg,hull_hp FROM ships WHERE user_id=? AND docked_station_id=? AND is_active=1 LIMIT 1');$myShipQuery->execute([$userId,(int)$location['station_id']]);$myShip=$myShipQuery->fetch(PDO::FETCH_ASSOC)?:null;
        mpResponse(['inside'=>true,'selfId'=>$userId,'mode'=>$location['mode'],'role'=>$role,'canUndock'=>$canUndock,'passenger'=>$passenger?['ship'=>(string)$passenger['ship_name'],'pilot'=>(string)$passenger['pilot_name'],'pilotAvatar'=>(string)$passenger['pilot_avatar'],'copilot'=>(string)($passenger['copilot_name']??''),'copilotAvatar'=>(string)($passenger['copilot_avatar']??''),'origin'=>(string)$passenger['origin_name'],'destination'=>(string)$passenger['destination_name'],'fare'=>(int)$passenger['fare_credits'],'shipId'=>(int)$passenger['ship_id'],'canDisembark'=>$passenger['docked_station_id']!==null,'dockedStationId'=>$passenger['docked_station_id']===null?null:(int)$passenger['docked_station_id'],'occupants'=>array_map(static fn($r)=>['id'=>(int)$r['user_id'],'name'=>$r['username'],'avatar'=>(string)$r['avatar_code'],'mode'=>'aboard','roomX'=>(float)$r['room_pos_x'],'roomZ'=>(float)$r['room_pos_z'],'roomYaw'=>(float)$r['room_yaw']],$passengerOccupants)]:null,'station'=>['id'=>(int)$location['station_id'],'code'=>$location['code'],'name'=>$location['name'],'hull'=>(int)$location['hull_hp'],'x'=>(float)$location['pos_x'],'z'=>(float)$location['pos_z']],'stations'=>array_map(static fn($r)=>['id'=>(int)$r['id'],'name'=>$r['name'],'code'=>$r['code'],'x'=>(float)$r['pos_x'],'z'=>(float)$r['pos_z']],$stationList),'occupants'=>array_map(static fn($r)=>['id'=>(int)$r['user_id'],'name'=>$r['username'],'avatar'=>(string)$r['avatar_code'],'mode'=>$r['mode'],'ship'=>$r['ship_name'],'hasShip'=>(bool)$r['has_ship'],'roomX'=>(float)$r['room_pos_x'],'roomZ'=>(float)$r['room_pos_z'],'roomYaw'=>(float)$r['room_yaw'],'roomCode'=>(float)$r['room_pos_z']<109?'observatory':((float)$r['room_pos_z']<143?'corridor':'habitat')],$occupants),'myShip'=>$myShip?['name'=>$myShip['ship_name'],'class'=>$myShip['ship_class'],'fuel'=>(float)$myShip['fuel_units'],'fuelCapacity'=>(int)$myShip['fuel_capacity_units'],'energy'=>(int)$myShip['energy_units'],'iron'=>(int)$myShip['iron_kg'],'nickel'=>(int)$myShip['nickel_kg'],'cobalt'=>(int)$myShip['cobalt_kg'],'ice'=>(int)$myShip['ice_kg'],'cargoCapacity'=>(int)$myShip['cargo_capacity_kg'],'hull'=>(int)$myShip['hull_hp']]:null,'ships'=>array_map(static fn($r)=>['id'=>(int)$r['id'],'name'=>$r['ship_name'],'class'=>$r['ship_class'],'active'=>(bool)$r['is_active'],'hull'=>(int)$r['hull_hp'],'fuel'=>(float)$r['fuel_units'],'fuelCapacity'=>(int)$r['fuel_capacity_units'],'energy'=>(int)$r['energy_units'],'iron'=>(int)$r['iron_kg'],'nickel'=>(int)$r['nickel_kg'],'cobalt'=>(int)$r['cobalt_kg'],'ice'=>(int)$r['ice_kg'],'cargoCapacity'=>(int)$r['cargo_capacity_kg'],'ownerId'=>(int)$r['owner_id'],'owner'=>$r['username'],'avatar'=>(string)$r['avatar_code'],'pilotPresent'=>(bool)$r['pilot_present'],'passengers'=>(int)$r['passenger_count'],'passengerCapacity'=>((string)$r['ship_class']==='freighter'?12:((string)$r['ship_class']==='attack'?2:4))],$dockedShips),'passengerManifest'=>array_map(static fn($r)=>['id'=>(int)$r['passenger_id'],'name'=>$r['username'],'fare'=>(int)$r['fare_credits'],'destination'=>$r['destination_name']],$passengerManifest),'pending'=>$pending,'requests'=>$requests,'rideRequests'=>array_map(static fn($r)=>['id'=>(int)$r['id'],'shipId'=>(int)$r['ship_id'],'passengerId'=>(int)$r['passenger_id'],'passengerName'=>$r['passenger_name'],'destination'=>$r['destination_name']],$rideRequests),'crew'=>$crew]);
    }

    if ($action === 'passenger-disembark') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error'=>'Use POST para desembarcar.'],405);
        $pdo->beginTransaction();
        $query=$pdo->prepare("SELECT p.ship_id,p.destination_station_id,s.docked_station_id FROM ship_passengers p JOIN ships s ON s.id=p.ship_id WHERE p.passenger_id=? AND p.status='active' LIMIT 1 FOR UPDATE");
        $query->execute([$userId]);$passenger=$query->fetch(PDO::FETCH_ASSOC);
        if(!$passenger){$pdo->rollBack();mpResponse(['error'=>'Voce nao esta a bordo de uma nave.'],409);}
        if($passenger['docked_station_id']===null){$pdo->rollBack();mpResponse(['error'=>'Voce so pode desembarcar quando a nave estiver acoplada a uma estacao.'],409);}
        $stationId=(int)$passenger['docked_station_id'];
        $stationQuery=$pdo->prepare('SELECT name FROM space_stations WHERE id=? AND is_active=1 AND hull_hp>0 LIMIT 1');$stationQuery->execute([$stationId]);$stationName=$stationQuery->fetchColumn();
        if(!$stationName){$pdo->rollBack();mpResponse(['error'=>'A estacao nao esta disponivel para desembarque.'],409);}
        $completed=(int)$passenger['destination_station_id']===$stationId;
        $pdo->prepare("UPDATE ship_passengers SET status=?,arrived_at=CASE WHEN ?=1 THEN NOW() ELSE arrived_at END WHERE passenger_id=? AND status='active'")->execute([$completed?'completed':'cancelled',$completed?1:0,$userId]);
        $pdo->prepare("UPDATE station_occupants SET mode='station',ship_id=NULL,station_id=?,room_pos_x=50,room_pos_z=75 WHERE user_id=?")->execute([$stationId,$userId]);
        $pdo->commit();
        mpResponse(['ok'=>true,'station'=>['id'=>$stationId,'name'=>$stationName],'destination'=>$completed]);
    }

    if ($action === 'station-walk' || $action === 'passenger-walk') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error'=>'Use POST.'],405);
        $input=mpInput(); $x=$input['x']??null; $z=$input['z']??null; $yaw=$input['yaw']??0;
        if (!is_numeric($x)||!is_numeric($z)||!is_numeric($yaw)||!is_finite((float)$x)||!is_finite((float)$z)||!is_finite((float)$yaw)) mpResponse(['error'=>'Posicao ou orientacao do avatar invalida.'],400);
        $occupant=$pdo->prepare('SELECT station_id,ship_id,mode FROM station_occupants WHERE user_id=? LIMIT 1'); $occupant->execute([$userId]);
        $where=$occupant->fetch(PDO::FETCH_ASSOC); if (!$where || ($action==='station-walk' && $where['mode']!=='station') || ($action==='passenger-walk' && $where['mode']!=='aboard')) mpResponse(['error'=>'Voce nao esta na sala correta para mover o avatar.'],409); if($action==='passenger-walk'){$passengerAccess=$pdo->prepare("SELECT 1 FROM ship_passengers WHERE passenger_id=? AND ship_id=? AND status='active' LIMIT 1");$passengerAccess->execute([$userId,(int)$where['ship_id']]);if(!$passengerAccess->fetchColumn())mpResponse(['error'=>'Somente passageiros ativos podem andar no compartimento.'],403);}
        $pdo->prepare('UPDATE station_occupants SET room_pos_x=?,room_pos_z=?,room_yaw=? WHERE user_id=?')->execute([max(8,min(92,(float)$x)),max(27.1,min(220,(float)$z)),(float)$yaw,$userId]);
        mpResponse(['ok'=>true]);
    }

    if ($action === 'station-trade-start') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error'=>'Use POST.'],405);
        $targetId=(int)(mpInput()['user_id']??0);
        if ($targetId<1||$targetId===$userId) mpResponse(['error'=>'Selecione outro piloto.'],400);
        $people=$pdo->prepare("SELECT so.user_id,so.station_id FROM station_occupants so JOIN users u ON u.id=so.user_id WHERE so.user_id IN (?,?) AND so.mode='station' AND u.is_active=1 AND u.last_seen_at>=DATE_SUB(NOW(),INTERVAL 20 SECOND) ORDER BY so.user_id"); $people->execute([$userId,$targetId]); $present=$people->fetchAll(PDO::FETCH_ASSOC);
        if(count($present)!==2||(int)$present[0]['station_id']!==(int)$present[1]['station_id']) mpResponse(['error'=>'Os dois pilotos precisam estar na mesma estação.'],409);
        $stationId=(int)$present[0]['station_id'];
        $existing=$pdo->prepare("SELECT id FROM station_trades WHERE status='open' AND station_id=? AND ((player_a_id=? AND player_b_id=?) OR (player_a_id=? AND player_b_id=?)) ORDER BY id DESC LIMIT 1"); $existing->execute([$stationId,$userId,$targetId,$targetId,$userId]); $tradeId=(int)$existing->fetchColumn();
        if(!$tradeId){$empty=json_encode(['credits'=>0,'iron'=>0,'nickel'=>0,'cobalt'=>0]);$insert=$pdo->prepare("INSERT INTO station_trades(station_id,player_a_id,player_b_id,offer_a,offer_b) VALUES(?,?,?,?,?)");$insert->execute([$stationId,$userId,$targetId,$empty,$empty]);$tradeId=(int)$pdo->lastInsertId();}
        mpResponse(['ok'=>true,'trade_id'=>$tradeId]);
    }

    if ($action === 'station-trade-list') {
        $q=$pdo->prepare("SELECT t.id,t.player_a_id,t.player_b_id,t.offer_a,t.offer_b,t.locked_a,t.locked_b,t.status,ua.username AS player_a_name,ub.username AS player_b_name FROM station_trades t JOIN users ua ON ua.id=t.player_a_id JOIN users ub ON ub.id=t.player_b_id JOIN station_occupants self ON self.user_id=? AND self.station_id=t.station_id AND self.mode='station' JOIN station_occupants other ON other.user_id=IF(t.player_a_id=?,t.player_b_id,t.player_a_id) AND other.station_id=t.station_id AND other.mode='station' WHERE t.status='open' AND (t.player_a_id=? OR t.player_b_id=?) AND t.updated_at>=DATE_SUB(NOW(),INTERVAL 30 MINUTE) ORDER BY t.updated_at DESC LIMIT 8"); $q->execute([$userId,$userId,$userId,$userId]);
        $trades=array_map(static function($row)use($userId){$isA=(int)$row['player_a_id']===$userId;return ['id'=>(int)$row['id'],'partnerId'=>$isA?(int)$row['player_b_id']:(int)$row['player_a_id'],'partner'=>$isA?$row['player_b_name']:$row['player_a_name'],'myOffer'=>json_decode($isA?$row['offer_a']:$row['offer_b'],true)?:[],'theirOffer'=>json_decode($isA?$row['offer_b']:$row['offer_a'],true)?:[],'myLocked'=>(bool)($isA?$row['locked_a']:$row['locked_b']),'theirLocked'=>(bool)($isA?$row['locked_b']:$row['locked_a']),'status'=>$row['status']];},$q->fetchAll(PDO::FETCH_ASSOC));
        mpResponse(['trades'=>$trades]);
    }

    if ($action === 'station-trade-update' || $action === 'station-trade-lock' || $action === 'station-trade-cancel' || $action === 'station-trade-get') {
        if(in_array($action,['station-trade-update','station-trade-lock','station-trade-cancel'],true)&&$_SERVER['REQUEST_METHOD']!=='POST') mpResponse(['error'=>'Use POST.'],405);
        $input=mpInput();$tradeId=(int)($_GET['trade_id']??$input['trade_id']??0);if($tradeId<1)mpResponse(['error'=>'Troca invalida.'],400);
        $pdo->beginTransaction();
        $tradeQuery=$pdo->prepare('SELECT * FROM station_trades WHERE id=? FOR UPDATE');$tradeQuery->execute([$tradeId]);$trade=$tradeQuery->fetch(PDO::FETCH_ASSOC);
        if(!$trade||!in_array($userId,[(int)$trade['player_a_id'],(int)$trade['player_b_id']],true)){$pdo->rollBack();mpResponse(['error'=>'Troca nao encontrada para esta conta.'],404);}
        $isA=(int)$trade['player_a_id']===$userId;$ownOffer=$isA?'offer_a':'offer_b';$ownLock=$isA?'locked_a':'locked_b';$otherLock=$isA?'locked_b':'locked_a';
        $balanceQuery=$pdo->prepare('SELECT u.credits,s.iron_kg,s.nickel_kg,s.cobalt_kg FROM users u LEFT JOIN ships s ON s.user_id=u.id AND s.is_active=1 AND s.docked_station_id=? WHERE u.id=? LIMIT 1');$balanceQuery->execute([(int)$trade['station_id'],$userId]);$balance=$balanceQuery->fetch(PDO::FETCH_ASSOC)?:[];$available=['credits'=>(int)($balance['credits']??0),'iron'=>(int)($balance['iron_kg']??0),'nickel'=>(int)($balance['nickel_kg']??0),'cobalt'=>(int)($balance['cobalt_kg']??0)];
        if($trade['status']==='open'&&in_array($action,['station-trade-update','station-trade-lock'],true)){$presentQuery=$pdo->prepare("SELECT so.user_id FROM station_occupants so JOIN users u ON u.id=so.user_id WHERE so.user_id IN (?,?) AND so.station_id=? AND so.mode='station' AND u.is_active=1 AND u.last_seen_at>=DATE_SUB(NOW(),INTERVAL 20 SECOND)");$presentQuery->execute([(int)$trade['player_a_id'],(int)$trade['player_b_id'],(int)$trade['station_id']]);if(count($presentQuery->fetchAll(PDO::FETCH_COLUMN))!==2){$pdo->rollBack();mpResponse(['error'=>'As ofertas só podem ser editadas ou travadas com os dois jogadores dentro da mesma estação.'],409);}}
        if($action==='station-trade-cancel'){$pdo->prepare("UPDATE station_trades SET status='cancelled' WHERE id=? AND status='open'")->execute([$tradeId]);$pdo->commit();mpResponse(['ok'=>true,'status'=>'cancelled']);}
        if($trade['status']!=='open'){$pdo->commit();mpResponse(['ok'=>true,'status'=>$trade['status'],'myOffer'=>json_decode($trade[$ownOffer],true),'theirOffer'=>json_decode($trade[$isA?'offer_b':'offer_a'],true),'myLocked'=>(bool)$trade[$ownLock],'theirLocked'=>(bool)$trade[$otherLock]]);}
        if($action==='station-trade-update'){
            if((int)$trade[$ownLock]===1){$pdo->rollBack();mpResponse(['error'=>'Destrave sua oferta antes de altera-la.'],409);}
            $offer=mpTradeOffer($input['offer']??null);$pdo->prepare('UPDATE station_trades SET '.$ownOffer.'=?,locked_a=0,locked_b=0 WHERE id=?')->execute([json_encode($offer),$tradeId]);$pdo->commit();mpResponse(['ok'=>true,'offer'=>$offer,'locked'=>false]);
        }
        if($action==='station-trade-lock'){
            $lock=!empty($input['locked'])?1:0;$pdo->prepare('UPDATE station_trades SET '.$ownLock.'=? WHERE id=?')->execute([$lock,$tradeId]);
            $tradeQuery->execute([$tradeId]);$trade=$tradeQuery->fetch(PDO::FETCH_ASSOC);
            if((int)$trade['locked_a']===1&&(int)$trade['locked_b']===1){
                $occupants=$pdo->prepare("SELECT user_id,station_id FROM station_occupants WHERE user_id IN (?,?) AND mode='station' ORDER BY user_id");$occupants->execute([(int)$trade['player_a_id'],(int)$trade['player_b_id']]);$present=$occupants->fetchAll(PDO::FETCH_ASSOC);
                if(count($present)!==2||(int)$present[0]['station_id']!==(int)$trade['station_id']||(int)$present[1]['station_id']!==(int)$trade['station_id']){$pdo->rollBack();mpResponse(['error'=>'Ambos precisam continuar dentro desta estação para concluir a troca.'],409);}
                $offerA=json_decode($trade['offer_a'],true)?:[];$offerB=json_decode($trade['offer_b'],true)?:[];$wallets=[];$ships=[];
                if(array_sum($offerA)+array_sum($offerB)<1){$pdo->rollBack();mpResponse(['error'=>'Incluam ao menos um credito ou mineral antes de travar a troca.'],409);}
                foreach([(int)$trade['player_a_id'],(int)$trade['player_b_id']] as $participant){$w=$pdo->prepare('SELECT credits FROM users WHERE id=? FOR UPDATE');$w->execute([$participant]);$wallets[$participant]=(int)$w->fetchColumn();$s=$pdo->prepare('SELECT id,cargo_capacity_kg,fuel_units,iron_kg,nickel_kg,cobalt_kg FROM ships WHERE user_id=? AND is_active=1 AND docked_station_id=? AND hull_hp>0 LIMIT 1 FOR UPDATE');$s->execute([$participant,(int)$trade['station_id']]);$ships[$participant]=$s->fetch(PDO::FETCH_ASSOC);if(!$ships[$participant]){$pdo->rollBack();mpResponse(['error'=>'Cada piloto precisa manter uma nave operacional nesta estação.'],409);}}
                $mineralKeys=['iron'=>'iron_kg','nickel'=>'nickel_kg','cobalt'=>'cobalt_kg'];$shipA=$ships[(int)$trade['player_a_id']];$shipB=$ships[(int)$trade['player_b_id']];
                foreach([[(int)$trade['player_a_id'],$shipA,$offerA,$offerB],[(int)$trade['player_b_id'],$shipB,$offerB,$offerA]] as [$participant,$ship,$offered,$received]){
                    if($wallets[$participant]<(int)($offered['credits']??0)){$pdo->rollBack();mpResponse(['error'=>'Um piloto nao tem os creditos oferecidos.'],409);}
                    foreach($mineralKeys as $key=>$column)if((int)$ship[$column]<(int)($offered[$key]??0)){$pdo->rollBack();mpResponse(['error'=>'Um piloto nao tem o minerio oferecido. Atualizem a proposta.'],409);}
                    $load=(int)$ship['iron_kg']+(int)$ship['nickel_kg']+(int)$ship['cobalt_kg'];$out=(int)($offered['iron']??0)+(int)($offered['nickel']??0)+(int)($offered['cobalt']??0);$in=(int)($received['iron']??0)+(int)($received['nickel']??0)+(int)($received['cobalt']??0);$weight=$pdo->prepare('SELECT COALESCE(SUM(e.weight_kg),0) FROM ship_equipment se JOIN equipment e ON e.id=se.equipment_id WHERE se.ship_id=? AND se.is_equipped=1 AND se.quantity>0');$weight->execute([(int)$ship['id']]);$fixed=(int)$weight->fetchColumn()+(int)ceil((float)$ship['fuel_units']*0.5);
                    if($load-$out+$in+$fixed>(int)$ship['cargo_capacity_kg']){$pdo->rollBack();mpResponse(['error'=>'A carga oferecida ultrapassa o espaco livre da nave que vai receber.'],409);}
                }
                foreach([[(int)$trade['player_a_id'],$offerA,$offerB,$shipA],[(int)$trade['player_b_id'],$offerB,$offerA,$shipB]] as [$participant,$offered,$received,$ship]){$pdo->prepare('UPDATE users SET credits=credits-?+? WHERE id=?')->execute([(int)$offered['credits'],(int)$received['credits'],$participant]);$pdo->prepare('UPDATE ships SET iron_kg=iron_kg-?+?,nickel_kg=nickel_kg-?+?,cobalt_kg=cobalt_kg-?+? WHERE id=?')->execute([(int)$offered['iron'],(int)$received['iron'],(int)$offered['nickel'],(int)$received['nickel'],(int)$offered['cobalt'],(int)$received['cobalt'],(int)$ship['id']]);}
                $pdo->prepare("UPDATE station_trades SET status='completed' WHERE id=?")->execute([$tradeId]);$pdo->commit();mpResponse(['ok'=>true,'status'=>'completed','message'=>'Troca concluida. Creditos e minerais transferidos.']);
            }
            $pdo->commit();mpResponse(['ok'=>true,'status'=>'open','myLocked'=>(bool)$trade[$ownLock],'theirLocked'=>(bool)$trade[$otherLock]]);
        }
        $partnerNameQuery=$pdo->prepare('SELECT username FROM users WHERE id=?');$partnerNameQuery->execute([$isA?(int)$trade['player_b_id']:(int)$trade['player_a_id']]);$partnerName=(string)$partnerNameQuery->fetchColumn();
        $pdo->commit();mpResponse(['ok'=>true,'status'=>$trade['status'],'partner'=>$partnerName,'myOffer'=>json_decode($trade[$ownOffer],true),'theirOffer'=>json_decode($trade[$isA?'offer_b':'offer_a'],true),'myAvailable'=>$available,'myLocked'=>(bool)$trade[$ownLock],'theirLocked'=>(bool)$trade[$otherLock]]);
    }

    if ($action === 'crew-request') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error'=>'Use POST.'],405);
        $captainId=(int)(mpInput()['user_id']??0);
        $own=$pdo->prepare("SELECT s.id,s.docked_station_id FROM ships s JOIN station_occupants so ON so.user_id=s.user_id AND so.station_id=s.docked_station_id AND so.mode='station' WHERE s.user_id=? AND s.is_active=1 AND s.docked_station_id IS NOT NULL LIMIT 1"); $own->execute([$userId]); $ownShip=$own->fetch(PDO::FETCH_ASSOC);
        if (!$ownShip || $captainId<1 || $captainId===$userId) mpResponse(['error'=>'Guarde sua nave e entre no interior da estacao primeiro.'],409);
        $host=$pdo->prepare("SELECT s.id FROM ships s JOIN station_occupants so ON so.user_id=s.user_id AND so.station_id=s.docked_station_id AND so.mode='station' WHERE s.user_id=? AND s.is_active=1 AND s.docked_station_id=? LIMIT 1"); $host->execute([$captainId,(int)$ownShip['docked_station_id']]); $hostShip=(int)$host->fetchColumn();
        if (!$hostShip) mpResponse(['error'=>'O piloto nao tem nave guardada nesta estacao.'],409);
        $busy=$pdo->prepare("SELECT 1 FROM ship_crew WHERE (ship_id=? AND status IN ('pending','active')) OR (copilot_id=? AND status IN ('pending','active')) LIMIT 1"); $busy->execute([$hostShip,$userId]);
        if ($busy->fetchColumn()) mpResponse(['error'=>'A vaga da nave ou voce ja esta ocupado.'],409);
        $pdo->prepare("INSERT INTO ship_crew(ship_id,captain_id,copilot_id,station_id,status,request_by) VALUES(?,?,?,?,'pending','copilot')")->execute([$hostShip,$captainId,$userId,(int)$ownShip['docked_station_id']]);
        mpResponse(['ok'=>true]);
    }

    if ($action === 'crew-invite') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error'=>'Use POST.'],405);
        $targetId=(int)(mpInput()['user_id']??0);
        $captain=$pdo->prepare("SELECT s.id,s.docked_station_id FROM ships s JOIN station_occupants so ON so.user_id=s.user_id AND so.station_id=s.docked_station_id AND so.mode='station' WHERE s.user_id=? AND s.is_active=1 AND s.docked_station_id IS NOT NULL LIMIT 1"); $captain->execute([$userId]); $ship=$captain->fetch(PDO::FETCH_ASSOC);
        if (!$ship || $targetId<1 || $targetId===$userId) mpResponse(['error'=>'Acople sua nave e esteja no interior da mesma estacao.'],409);
        $target=$pdo->prepare("SELECT 1 FROM station_occupants so JOIN users u ON u.id=so.user_id JOIN ships parked ON parked.user_id=so.user_id AND parked.is_active=1 AND parked.docked_station_id=so.station_id WHERE so.user_id=? AND so.station_id=? AND so.mode='station' AND u.last_seen_at>=DATE_SUB(NOW(),INTERVAL 20 SECOND)"); $target->execute([$targetId,(int)$ship['docked_station_id']]);
        if (!$target->fetchColumn()) mpResponse(['error'=>'O piloto precisa estar nesta estacao e com a nave guardada.'],409);
        $busy=$pdo->prepare("SELECT 1 FROM ship_crew WHERE (ship_id=? AND status IN ('pending','active')) OR (copilot_id=? AND status IN ('pending','active')) OR (copilot_id=? AND status IN ('pending','active')) LIMIT 1"); $busy->execute([(int)$ship['id'],$targetId,$userId]);
        if ($busy->fetchColumn()) mpResponse(['error'=>'A nave ou piloto ja tem um convite ou copiloto.'],409);
        $pdo->prepare("INSERT INTO ship_crew(ship_id,captain_id,copilot_id,station_id,status) VALUES(?,?,?,?,'pending')")->execute([(int)$ship['id'],$userId,$targetId,(int)$ship['docked_station_id']]);
        mpResponse(['ok'=>true]);
    }

    if ($action === 'crew-respond') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error'=>'Use POST.'],405);
        $input=mpInput(); $shipId=(int)($input['ship_id']??0); $accept=!empty($input['accept']);
        $q=$pdo->prepare("SELECT sc.station_id,sc.captain_id,sc.copilot_id,sc.request_by FROM ship_crew sc JOIN station_occupants so ON so.user_id=IF(sc.request_by='captain',sc.copilot_id,sc.captain_id) AND so.station_id=sc.station_id AND so.mode='station' WHERE sc.ship_id=? AND sc.status='pending' AND ((sc.copilot_id=? AND sc.request_by='captain') OR (sc.captain_id=? AND sc.request_by='copilot'))"); $q->execute([$shipId,$userId,$userId]); $invitation=$q->fetch(PDO::FETCH_ASSOC);
        if (!$invitation) mpResponse(['error'=>'Convite expirado ou voce nao esta nesta estacao.'],404);
        if (!$accept) { $pdo->prepare("DELETE FROM ship_crew WHERE ship_id=? AND status='pending'")->execute([$shipId]); mpResponse(['ok'=>true,'accepted'=>false]); }
        $pdo->beginTransaction();
        $busy=$pdo->prepare("SELECT 1 FROM ship_crew WHERE copilot_id=? AND status='active' FOR UPDATE"); $busy->execute([$userId]);
        if ($busy->fetchColumn()) { $pdo->rollBack(); mpResponse(['error'=>'Voce ja esta a bordo de outra nave.'],409); }
        $pdo->prepare("UPDATE ship_crew SET status='active' WHERE ship_id=? AND copilot_id=? AND status='pending'")->execute([$shipId,$userId]);
        $pdo->prepare("UPDATE station_occupants SET mode='aboard',ship_id=?,room_pos_x=50,room_pos_z=66.5,room_yaw=0 WHERE user_id=?")->execute([$shipId,(int)$invitation['copilot_id']]);
        $pdo->commit(); mpResponse(['ok'=>true,'accepted'=>true]);
    }

    if ($action === 'crew-leave') {
        $q=$pdo->prepare("SELECT sc.ship_id,sc.station_id,s.docked_station_id FROM ship_crew sc JOIN ships s ON s.id=sc.ship_id WHERE sc.copilot_id=? AND sc.status='active' LIMIT 1"); $q->execute([$userId]); $crew=$q->fetch(PDO::FETCH_ASSOC);
        if (!$crew) mpResponse(['error'=>'Voce nao esta como copiloto.'],409);
        if ((int)($crew['docked_station_id']??0)!==(int)$crew['station_id']) mpResponse(['error'=>'Para desembarcar, peca ao piloto que acople a nave em uma estacao.'],409);
        $pdo->prepare("DELETE FROM ship_crew WHERE ship_id=?")->execute([(int)$crew['ship_id']]);
        $pdo->prepare("UPDATE station_occupants SET mode='station',ship_id=NULL,station_id=? WHERE user_id=?")->execute([(int)$crew['station_id'],$userId]);
        mpResponse(['ok'=>true]);
    }

    if ($action === 'station-undock') {
        $q=$pdo->prepare("SELECT s.id,s.docked_station_id,ss.code FROM ships s JOIN space_stations ss ON ss.id=s.docked_station_id JOIN station_occupants so ON so.user_id=s.user_id AND so.station_id=s.docked_station_id AND so.mode='station' WHERE s.user_id=? AND s.is_active=1 AND s.docked_station_id IS NOT NULL LIMIT 1"); $q->execute([$userId]); $ship=$q->fetch(PDO::FETCH_ASSOC);
        if (!$ship) mpResponse(['error'=>'Sua nave nao esta acoplada.'],409);
        $pdo->prepare('UPDATE ships SET docked_station_id=NULL,heading=0,speed=0 WHERE id=?')->execute([(int)$ship['id']]);
        $pdo->prepare("DELETE FROM ship_crew WHERE status='pending' AND (ship_id=? OR copilot_id=?)")->execute([(int)$ship['id'],$userId]);
        $pdo->prepare("UPDATE station_trades SET status='cancelled' WHERE status='open' AND (player_a_id=? OR player_b_id=?)")->execute([$userId,$userId]);
        $pdo->prepare('DELETE FROM station_occupants WHERE user_id=?')->execute([$userId]);
        mpResponse(['ok'=>true,'station'=>$ship['code']]);
    }

    if ($action === 'station-attack') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error'=>'Use POST.'],405);
        $code=strtolower(trim((string)(mpInput()['station']??'')));
        $q=$pdo->prepare('SELECT id,name,pos_x,pos_z,hull_hp FROM space_stations WHERE code=? AND is_active=1 LIMIT 1'); $q->execute([$code]); $station=$q->fetch(PDO::FETCH_ASSOC);
        if (!$station || (int)$station['hull_hp']<1) mpResponse(['error'=>'Estacao destruida ou indisponivel.'],409);
        $q=$pdo->prepare("SELECT s.id,s.pos_x,s.pos_z,s.hull_hp,s.ship_class,e.code,e.damage,se.ammo_current FROM ships s LEFT JOIN ship_crew sc ON sc.ship_id=s.id AND sc.copilot_id=? AND sc.status='active' LEFT JOIN ship_equipment se ON se.ship_id=s.id AND se.is_equipped=1 AND se.quantity>0 AND EXISTS (SELECT 1 FROM equipment weapon_slot WHERE weapon_slot.id=se.equipment_id AND weapon_slot.equipment_type='weapon') LEFT JOIN equipment e ON e.id=se.equipment_id AND e.equipment_type='weapon' WHERE ((s.user_id=? AND sc.ship_id IS NULL) OR sc.copilot_id=?) AND s.is_active=1 AND s.docked_station_id IS NULL LIMIT 1"); $q->execute([$userId,$userId,$userId]); $attacker=$q->fetch(PDO::FETCH_ASSOC);
        if (!$attacker || (int)$attacker['hull_hp']<1 || !$attacker['code'] || (int)$attacker['ammo_current']<1) mpResponse(['error'=>'E necessario estar na nave, fora da estacao, com canhao e municao.'],409);
        $distance=hypot((float)$attacker['pos_x']-(float)$station['pos_x'],(float)$attacker['pos_z']-(float)$station['pos_z']);
        if ($distance>25000) mpResponse(['error'=>'Aproxime-se a 25.000 km para atacar.'],409);
        $damage=max(5,(int)$attacker['damage']); if (($attacker['ship_class']??'explorer')==='attack') $damage=(int)round($damage*1.35);
        $pdo->beginTransaction();
        $ammo=$pdo->prepare('UPDATE ship_equipment SET ammo_current=ammo_current-1 WHERE ship_id=? AND is_equipped=1 AND ammo_current>0'); $ammo->execute([(int)$attacker['id']]);
        if (!$ammo->rowCount()) { $pdo->rollBack(); mpResponse(['error'=>'Sem municao.'],409); }
        $pdo->prepare('UPDATE space_stations SET hull_hp=GREATEST(0,hull_hp-?) WHERE id=?')->execute([$damage,(int)$station['id']]);
        $q=$pdo->prepare('SELECT hull_hp FROM space_stations WHERE id=?'); $q->execute([(int)$station['id']]); $remaining=(int)$q->fetchColumn();
        $pdo->commit(); mpResponse(['ok'=>true,'damage'=>$damage,'hull'=>$remaining,'destroyed'=>$remaining===0,'station'=>$station['name']]);
    }

    if ($action === 'profile') {
        $targetId = filter_input(INPUT_GET, 'user_id', FILTER_VALIDATE_INT) ?: 0;
        if ($targetId < 1 || $targetId === $userId) mpResponse(['error' => 'Piloto inválido.'], 400);
        $pilotQuery = $pdo->prepare("SELECT id, username, avatar_code, created_at, is_active, (last_seen_at >= DATE_SUB(NOW(), INTERVAL 20 SECOND)) AS online FROM users WHERE id=? LIMIT 1");
        $pilotQuery->execute([$targetId]);
        $pilot = $pilotQuery->fetch();
        if (!$pilot) mpResponse(['error' => 'Piloto não encontrado.'], 404);

        $fleetQuery = $pdo->prepare(
            'SELECT s.id, s.ship_name, s.is_active,
                    e.name AS item_name, e.code AS item_code, e.equipment_type, e.price_credits,
                    se.quantity, se.ammo_current, se.is_equipped
             FROM ships s
             LEFT JOIN ship_equipment se ON se.ship_id=s.id AND se.quantity>0
             LEFT JOIN equipment e ON e.id=se.equipment_id
             WHERE s.user_id=? ORDER BY s.id, e.name'
        );
        $fleetQuery->execute([$targetId]);
        $ships = [];
        $inventoryValue = 0;
        foreach ($fleetQuery->fetchAll() as $row) {
            $shipId = (int)$row['id'];
            if (!isset($ships[$shipId])) $ships[$shipId] = ['name' => $row['ship_name'], 'active' => (bool)$row['is_active'], 'items' => [], 'value' => 0];
            if ($row['item_code'] !== null) {
                $quantity = max(1, (int)$row['quantity']);
                $itemValue = (int)$row['price_credits'] * $quantity;
                $ships[$shipId]['items'][] = [
                    'name' => $row['item_name'], 'type' => $row['equipment_type'], 'quantity' => $quantity,
                    'price' => (int)$row['price_credits'], 'value' => $itemValue,
                    'equipped' => (bool)$row['is_equipped'], 'ammo' => (int)$row['ammo_current']
                ];
                $ships[$shipId]['value'] += $itemValue;
                $inventoryValue += $itemValue;
            }
        }
        $relationQuery = $pdo->prepare('SELECT id, requester_id, recipient_id, status FROM friend_requests WHERE (requester_id=? AND recipient_id=?) OR (requester_id=? AND recipient_id=?) ORDER BY id DESC LIMIT 1');
        $relationQuery->execute([$userId, $targetId, $targetId, $userId]);
        $relation = $relationQuery->fetch();
        $friendStatus = 'none';
        if ($relation) {
            if ($relation['status'] === 'accepted') $friendStatus = 'friend';
            elseif ($relation['status'] === 'pending') $friendStatus = (int)$relation['requester_id'] === $userId ? 'sent_pending' : 'incoming_pending';
        }
        mpResponse([
            'pilot' => ['id' => (int)$pilot['id'], 'username' => $pilot['username'], 'avatar' => $pilot['avatar_code'], 'online' => (bool)$pilot['online'], 'createdAt' => $pilot['created_at']],
            'shipCount' => count($ships), 'inventoryValue' => $inventoryValue, 'ships' => array_values($ships),
            'friendStatus' => $friendStatus, 'friendRequestId' => $relation ? (int)$relation['id'] : null
        ]);
    }

    if ($action === 'friends') {
        $friendsQuery = $pdo->prepare(
            "SELECT DISTINCT u.id, u.username, u.last_seen_at,
                    (u.last_seen_at >= DATE_SUB(NOW(), INTERVAL 20 SECOND)) AS online,
                    (SELECT s.ship_name FROM ships s WHERE s.user_id=u.id ORDER BY s.is_active DESC,s.id ASC LIMIT 1) AS ship_name,
                    (SELECT COUNT(*) FROM ships sf WHERE sf.user_id=u.id) AS ship_count
             FROM friend_requests fr
             JOIN users u ON u.id=IF(fr.requester_id=?,fr.recipient_id,fr.requester_id)
             WHERE fr.status='accepted' AND (fr.requester_id=? OR fr.recipient_id=?) ORDER BY online DESC,u.username"
        );
        $friendsQuery->execute([$userId, $userId, $userId]);
        $incomingQuery = $pdo->prepare("SELECT fr.id, u.id AS user_id, u.username FROM friend_requests fr JOIN users u ON u.id=fr.requester_id WHERE fr.recipient_id=? AND fr.status='pending' ORDER BY fr.created_at");
        $incomingQuery->execute([$userId]);
        $outgoingQuery = $pdo->prepare("SELECT fr.id, u.id AS user_id, u.username FROM friend_requests fr JOIN users u ON u.id=fr.recipient_id WHERE fr.requester_id=? AND fr.status='pending' ORDER BY fr.created_at");
        $outgoingQuery->execute([$userId]);
        mpResponse(['friends' => $friendsQuery->fetchAll(), 'incoming' => $incomingQuery->fetchAll(), 'outgoing' => $outgoingQuery->fetchAll()]);
    }

    if ($action === 'friend-request') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error' => 'Use POST para enviar o pedido.'], 405);
        $targetId = (int)(mpInput()['user_id'] ?? 0);
        if ($targetId < 1 || $targetId === $userId) mpResponse(['error' => 'Não é possível adicionar essa conta.'], 400);
        $userExists = $pdo->prepare('SELECT 1 FROM users WHERE id=? AND is_active=1');
        $userExists->execute([$targetId]);
        if (!$userExists->fetchColumn()) mpResponse(['error' => 'Esse piloto não foi encontrado.'], 404);
        $exists = $pdo->prepare('SELECT id,requester_id,status FROM friend_requests WHERE (requester_id=? AND recipient_id=?) OR (requester_id=? AND recipient_id=?) ORDER BY id DESC LIMIT 1');
        $exists->execute([$userId, $targetId, $targetId, $userId]);
        $relation = $exists->fetch();
        if ($relation && $relation['status'] === 'accepted') mpResponse(['ok' => true, 'status' => 'friend']);
        if ($relation && $relation['status'] === 'pending') {
            if ((int)$relation['requester_id'] === $userId) mpResponse(['ok' => true, 'status' => 'sent_pending']);
            $pdo->prepare("UPDATE friend_requests SET status='accepted' WHERE id=?")->execute([(int)$relation['id']]);
            mpResponse(['ok' => true, 'status' => 'friend']);
        }
        if ($relation && (int)$relation['requester_id'] === $userId) {
            $pdo->prepare("UPDATE friend_requests SET status='pending',created_at=NOW() WHERE id=?")->execute([(int)$relation['id']]);
        } else {
            $pdo->prepare("INSERT INTO friend_requests (requester_id,recipient_id,status) VALUES (?,?,'pending') ON DUPLICATE KEY UPDATE status='pending',created_at=NOW()")->execute([$userId, $targetId]);
        }
        mpResponse(['ok' => true, 'status' => 'sent_pending']);
    }

    if ($action === 'friend-response') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error' => 'Use POST para responder ao pedido.'], 405);
        $input = mpInput();
        $requestId = (int)($input['request_id'] ?? 0);
        $accept = !empty($input['accept']);
        $status = $accept ? 'accepted' : 'rejected';
        $respond = $pdo->prepare("UPDATE friend_requests SET status=? WHERE id=? AND recipient_id=? AND status='pending'");
        $respond->execute([$status, $requestId, $userId]);
        if (!$respond->rowCount()) mpResponse(['error' => 'Esse pedido não está mais aguardando resposta.'], 404);
        mpResponse(['ok' => true, 'status' => $status]);
    }

    if ($action === 'voice-message-send') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error' => 'Use POST to send audio.'], 405);
        $requestedChannel=(string)($_POST['channel']??'');
        $channelType=in_array($requestedChannel,['open','station'],true)?$requestedChannel:'private';
        $recipientId = (int)($_POST['user_id'] ?? 0);
        if ($channelType === 'private') {
            if ($recipientId < 1 || $recipientId === $userId || !mpAreFriends($pdo, $userId, $recipientId)) mpResponse(['error' => 'O audio privado so pode ser enviado para amigos.'], 403);
            $online = $pdo->prepare('SELECT id FROM users WHERE id=? AND is_active=1 AND last_seen_at >= DATE_SUB(NOW(), INTERVAL 20 SECOND)');
            $online->execute([$recipientId]);
            if (!$online->fetchColumn()) mpResponse(['error' => 'Esse amigo esta offline no momento.'], 409);
            $recipientIds = [$recipientId];
        } elseif ($channelType === 'station') {
            $stationQuery=$pdo->prepare('SELECT station_id FROM station_occupants WHERE user_id=? LIMIT 1'); $stationQuery->execute([$userId]); $stationId=(int)$stationQuery->fetchColumn();
            if (!$stationId) mpResponse(['error'=>'Entre em uma estacao para usar a comunicacao interna.'],409);
            $rate=$pdo->prepare("SELECT COUNT(DISTINCT storage_path) FROM voice_messages WHERE sender_id=? AND channel_type='station' AND created_at>=DATE_SUB(NOW(),INTERVAL 1 MINUTE)"); $rate->execute([$userId]);
            if ((int)$rate->fetchColumn()>=5) mpResponse(['error'=>'Aguarde um pouco antes de transmitir novamente.'],429);
            $occupantsQuery=$pdo->prepare('SELECT so.user_id FROM station_occupants so JOIN users u ON u.id=so.user_id WHERE so.station_id=? AND so.user_id<>? AND u.is_active=1 AND u.last_seen_at>=DATE_SUB(NOW(),INTERVAL 30 SECOND)'); $occupantsQuery->execute([$stationId,$userId]);
            $recipientIds=array_map('intval',$occupantsQuery->fetchAll(PDO::FETCH_COLUMN));
            if (!$recipientIds) mpResponse(['error'=>'Nao ha outros jogadores na estacao para ouvir.'],409);
        } else {
            $senderShipQuery = $pdo->prepare("SELECT s.pos_x,s.pos_z FROM ships s LEFT JOIN ship_crew sc ON sc.ship_id=s.id AND sc.copilot_id=? AND sc.status='active' WHERE ((s.user_id=? AND NOT EXISTS (SELECT 1 FROM ship_crew own_crew WHERE own_crew.copilot_id=? AND own_crew.status='active')) OR sc.ship_id=s.id) AND s.is_active=1 AND s.hull_hp>0 LIMIT 1");
            $senderShipQuery->execute([$userId,$userId,$userId]);
            $senderShip = $senderShipQuery->fetch(PDO::FETCH_ASSOC);
            if (!$senderShip) mpResponse(['error' => 'Sua nave ativa nao foi encontrada.'], 409);
            $rate = $pdo->prepare("SELECT COUNT(DISTINCT storage_path) FROM voice_messages WHERE sender_id=? AND channel_type='open' AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)");
            $rate->execute([$userId]);
            if ((int)$rate->fetchColumn() >= 5) mpResponse(['error' => 'Aguarde um pouco antes de transmitir novamente.'], 429);
            $nearby = $pdo->prepare('SELECT u.id FROM users u JOIN ships s ON s.user_id=u.id AND s.is_active=1 AND s.hull_hp>0 AND s.docked_station_id IS NULL WHERE u.id<>? AND u.is_active=1 AND u.last_seen_at >= DATE_SUB(NOW(), INTERVAL 20 SECOND) AND ABS(s.pos_x-?)<=5000 AND ABS(s.pos_z-?)<=5000 AND SQRT(POW(s.pos_x-?,2)+POW(s.pos_z-?,2))<=5000 ORDER BY SQRT(POW(s.pos_x-?,2)+POW(s.pos_z-?,2)) LIMIT 32');
            $x = (float)$senderShip['pos_x']; $z = (float)$senderShip['pos_z'];
            $nearby->execute([$userId,$x,$z,$x,$z,$x,$z]);
            $recipientIds = array_map('intval', $nearby->fetchAll(PDO::FETCH_COLUMN));
            if (!$recipientIds) mpResponse(['error' => 'Nenhuma nave online foi localizada no alcance de 5.000 km.'], 409);
        }
        $upload = $_FILES['audio'] ?? null;
        if (!is_array($upload) || ($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || ($upload['size'] ?? 0) < 1 || ($upload['size'] ?? 0) > 4 * 1024 * 1024) mpResponse(['error' => 'O audio deve ter ate 4 MB.'], 400);
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($upload['tmp_name']);
        if (!is_string($mime) || !preg_match('#^(audio/(webm|ogg|mp4|mpeg|wav|x-wav)|video/(webm|mp4))$#i', $mime)) mpResponse(['error' => 'Formato de audio nao suportado. Grave novamente no navegador.'], 415);
        $duration = max(1, min(30000, (int)($_POST['duration_ms'] ?? 0)));
        $extensions = ['audio/ogg' => 'ogg', 'audio/mp4' => 'm4a', 'video/mp4' => 'm4a', 'audio/wav' => 'wav', 'audio/x-wav' => 'wav'];
        $extension = $extensions[$mime] ?? 'webm';
        $day = date('Y-m-d');
        $relativePath = $day . '/' . bin2hex(random_bytes(16)) . '.' . $extension;
        $absolutePath = voiceMessageAbsolutePath($relativePath);
        $dayDirectory = voiceMessageStorageRoot() . DIRECTORY_SEPARATOR . $day;
        if ($absolutePath === null || (!is_dir($dayDirectory) && !@mkdir($dayDirectory, 0775, true) && !is_dir($dayDirectory))) mpResponse(['error' => 'Nao foi possivel preparar a pasta de mensagens de audio.'], 500);
        if (!move_uploaded_file($upload['tmp_name'], $absolutePath)) mpResponse(['error' => 'Nao foi possivel guardar o arquivo de audio.'], 500);
        try {
            $pdo->beginTransaction();
            $insert = $pdo->prepare('INSERT INTO voice_messages (sender_id,recipient_id,channel_type,mime_type,duration_ms,storage_path) VALUES (?,?,?,?,?,?)');
            foreach ($recipientIds as $targetId) $insert->execute([$userId, $targetId, $channelType, $mime, $duration, $relativePath]);
            $lastMessageId = (int)$pdo->lastInsertId();
            $pdo->commit();
        } catch (Throwable $error) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            @unlink($absolutePath);
            throw $error;
        }
        mpResponse(['ok' => true, 'message_id' => $lastMessageId, 'recipients' => count($recipientIds), 'channel' => $channelType]);
    }

    if ($action === 'voice-message-poll') {
        cleanupExpiredVoiceMessages($pdo);
        $messages = $pdo->prepare("SELECT vm.id,vm.duration_ms,vm.channel_type,vm.created_at,u.username AS sender_name FROM voice_messages vm JOIN users u ON u.id=vm.sender_id WHERE vm.recipient_id=? AND vm.status='pending' AND vm.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) ORDER BY vm.id LIMIT 5");
        $messages->execute([$userId]);
        mpResponse(['messages' => array_map(static fn($message) => ['id'=>(int)$message['id'],'duration_ms'=>(int)$message['duration_ms'],'created_at'=>$message['created_at'],'sender_name'=>$message['sender_name'],'channel_type'=>$message['channel_type']], $messages->fetchAll())]);
    }

    if ($action === 'voice-message-audio') {
        $messageId = (int)($_GET['id'] ?? 0);
        $audio = $pdo->prepare("SELECT mime_type,storage_path FROM voice_messages WHERE id=? AND recipient_id=? AND status='pending' AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) LIMIT 1");
        $audio->execute([$messageId, $userId]);
        $message = $audio->fetch();
        if (!$message) mpResponse(['error' => 'Mensagem de áudio não encontrada.'], 404);
        $absolutePath = voiceMessageAbsolutePath((string)$message['storage_path']);
        if ($absolutePath === null || !is_file($absolutePath)) mpResponse(['error' => 'Arquivo de áudio indisponível.'], 404);
        header_remove('Content-Type');
        header('Content-Type: ' . $message['mime_type']);
        header('Content-Length: ' . filesize($absolutePath));
        header('Content-Disposition: inline; filename="mensagem-de-voz"');
        readfile($absolutePath);
        exit;
    }

    if ($action === 'voice-message-status') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error' => 'Use POST para atualizar a mensagem.'], 405);
        $input = mpInput();
        $messageId = (int)($input['message_id'] ?? 0);
        $status = (string)($input['status'] ?? '');
        if ($messageId < 1 || !in_array($status, ['listened','dismissed'], true)) mpResponse(['error' => 'Estado da mensagem inválido.'], 400);
        $update = $pdo->prepare("UPDATE voice_messages SET status=? WHERE id=? AND recipient_id=? AND status='pending'");
        $update->execute([$status, $messageId, $userId]);
        mpResponse(['ok' => true]);
    }

    if ($action === 'call-start') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error' => 'Use POST para ligar.'], 405);
        $targetId = (int)(mpInput()['user_id'] ?? 0);
        if ($targetId < 1 || !mpAreFriends($pdo, $userId, $targetId)) mpResponse(['error' => 'Você precisa ser amigo desse piloto para ligar.'], 403);
        $onlineQuery = $pdo->prepare('SELECT id FROM users WHERE id=? AND is_active=1 AND last_seen_at >= DATE_SUB(NOW(), INTERVAL 20 SECOND)');
        $onlineQuery->execute([$targetId]);
        if (!$onlineQuery->fetchColumn()) mpResponse(['error' => 'Esse amigo está offline no momento.'], 409);
        $activeQuery = $pdo->prepare("SELECT call_id FROM voice_calls WHERE status IN ('ringing','accepted') AND (caller_id IN (?,?) OR callee_id IN (?,?)) ORDER BY created_at DESC LIMIT 1");
        $activeQuery->execute([$userId, $targetId, $userId, $targetId]);
        if ($activeQuery->fetchColumn()) mpResponse(['error' => 'Um dos pilotos já está em outra ligação.'], 409);
        $callId = mpCallId();
        $pdo->prepare("INSERT INTO voice_calls (call_id,caller_id,callee_id,status) VALUES (?,?,?,'ringing')")->execute([$callId, $userId, $targetId]);
        mpResponse(['ok' => true, 'call_id' => $callId, 'status' => 'ringing']);
    }

    if ($action === 'call-accept' || $action === 'call-decline' || $action === 'call-end') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error' => 'Use POST para controlar a ligação.'], 405);
        $callId = (string)(mpInput()['call_id'] ?? '');
        if (!preg_match('/^[a-f0-9-]{36}$/i', $callId)) mpResponse(['error' => 'Ligação inválida.'], 400);
        if ($action === 'call-accept') {
            $stmt = $pdo->prepare("UPDATE voice_calls SET status='accepted' WHERE call_id=? AND callee_id=? AND status='ringing'");
        } elseif ($action === 'call-decline') {
            $stmt = $pdo->prepare("UPDATE voice_calls SET status='declined',ended_at=NOW() WHERE call_id=? AND callee_id=? AND status='ringing'");
        } else {
            $stmt = $pdo->prepare("UPDATE voice_calls SET status='ended',ended_at=NOW() WHERE call_id=? AND (caller_id=? OR callee_id=?) AND status IN ('ringing','accepted')");
        }
        $stmt->execute($action === 'call-end' ? [$callId, $userId, $userId] : [$callId, $userId]);
        if (!$stmt->rowCount()) mpResponse(['error' => 'A ligação não está mais ativa.'], 404);
        mpResponse(['ok' => true]);
    }

    if ($action === 'call-signal') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') mpResponse(['error' => 'Use POST para enviar sinalização.'], 405);
        $input = mpInput();
        $callId = (string)($input['call_id'] ?? '');
        $signalType = (string)($input['type'] ?? '');
        $payload = $input['payload'] ?? null;
        if (!preg_match('/^[a-f0-9-]{36}$/i', $callId) || !in_array($signalType, ['offer','answer','ice'], true) || !is_array($payload)) mpResponse(['error' => 'Sinal de ligação inválido.'], 400);
        $callQuery = $pdo->prepare("SELECT caller_id,callee_id FROM voice_calls WHERE call_id=? AND status IN ('ringing','accepted')");
        $callQuery->execute([$callId]);
        $call = $callQuery->fetch();
        if (!$call || !in_array($userId, [(int)$call['caller_id'],(int)$call['callee_id']], true)) mpResponse(['error' => 'Ligação não encontrada.'], 404);
        $otherUser = (int)$call['caller_id'] === $userId ? (int)$call['callee_id'] : (int)$call['caller_id'];
        $pdo->prepare('INSERT INTO call_signals (call_id,sender_id,recipient_id,signal_type,payload) VALUES (?,?,?,?,?)')
            ->execute([$callId, $userId, $otherUser, $signalType, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
        mpResponse(['ok' => true]);
    }

    if ($action === 'call-poll') {
        $pdo->exec("UPDATE voice_calls SET status='missed',ended_at=NOW() WHERE status='ringing' AND created_at < DATE_SUB(NOW(), INTERVAL 35 SECOND)");
        $callsQuery = $pdo->prepare(
            "SELECT c.call_id,c.caller_id,c.callee_id,c.status,c.created_at,
                    u.username AS caller_name, v.username AS callee_name
             FROM voice_calls c JOIN users u ON u.id=c.caller_id JOIN users v ON v.id=c.callee_id
             WHERE (c.caller_id=? OR c.callee_id=?) AND (c.status IN ('ringing','accepted') OR c.updated_at >= DATE_SUB(NOW(), INTERVAL 2 MINUTE))
             ORDER BY c.updated_at DESC LIMIT 8"
        );
        $callsQuery->execute([$userId, $userId]);
        $signalsQuery = $pdo->prepare(
            "SELECT cs.id,cs.call_id,cs.signal_type,cs.payload FROM call_signals cs JOIN voice_calls c ON c.call_id=cs.call_id
             WHERE cs.recipient_id=? AND cs.read_at IS NULL AND c.status IN ('ringing','accepted') ORDER BY cs.id LIMIT 60"
        );
        $signalsQuery->execute([$userId]);
        $signals = $signalsQuery->fetchAll();
        if ($signals) {
            $signalIds = array_map('intval', array_column($signals, 'id'));
            $pdo->exec('UPDATE call_signals SET read_at=NOW() WHERE id IN (' . implode(',', $signalIds) . ') AND recipient_id=' . $userId);
        }
        foreach ($signals as &$signal) { $signal['payload'] = json_decode($signal['payload'], true) ?: []; }
        unset($signal);
        mpResponse(['calls' => $callsQuery->fetchAll(), 'signals' => $signals]);
    }

    if ($action === 'players') {
        $pdo->prepare('UPDATE users SET last_seen_at = NOW() WHERE id = ?')->execute([$userId]);
        $playersQuery = $pdo->prepare(
            "SELECT u.id AS user_id, u.username, s.ship_name, s.ship_class, s.fuel_units, s.hull_hp, s.pos_x AS x, s.pos_y AS y, s.pos_z AS z, s.heading AS yaw,
                    EXISTS(SELECT 1 FROM ship_equipment se JOIN equipment e ON e.id=se.equipment_id WHERE se.ship_id=s.id AND se.is_equipped=1 AND se.quantity>0 AND e.equipment_type=1) AS pk
             FROM users u JOIN ships s ON s.user_id = u.id AND s.is_active = 1
             WHERE u.id <> ? AND NOT EXISTS (SELECT 1 FROM ship_crew crew_self WHERE crew_self.copilot_id=? AND crew_self.captain_id=u.id AND crew_self.status='active') AND u.is_active = 1 AND s.hull_hp > 0 AND s.docked_station_id IS NULL AND u.last_seen_at >= DATE_SUB(NOW(), INTERVAL 20 SECOND)"
        );
        $playersQuery->execute([$userId,$userId]);
        $players = array_map(static fn($row) => [
            'id' => (int)$row['user_id'], 'username' => $row['username'], 'name' => $row['ship_name'], 'shipClass' => $row['ship_class'],
            'x' => (float)$row['x'], 'y' => (float)$row['y'], 'z' => (float)$row['z'], 'yaw' => (float)$row['yaw'], 'fuel' => (float)$row['fuel_units'], 'hull' => (int)$row['hull_hp'], 'pk' => (bool)$row['pk']
        ], $playersQuery->fetchAll());
        mpResponse(['players' => $players, 'count' => count($players)]);
    }

    mpResponse(['error' => 'Ação multiplayer desconhecida.'], 404);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('Multiplayer: ' . $error->getMessage());
    mpResponse(['error' => 'Não foi possível atualizar o multiplayer. Confira se o banco nave está instalado.'], 503);
}

