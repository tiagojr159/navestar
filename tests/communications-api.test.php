<?php
declare(strict_types=1);
require __DIR__.'/../communications-api.php';
function check(bool $condition,string $message): void { if (!$condition) throw new RuntimeException($message); }
check(commsText("  Olá\r\nMundo  ")==="Olá\nMundo",'Normalize text without destroying line breaks');
check(commsText('<script>alert(1)</script>')==='<script>alert(1)</script>','Text is data, escaped at rendering');
check(commsText(str_repeat('🚀',2000))===str_repeat('🚀',2000),'Unicode length accepts 2000 characters');
foreach (['',"\0\x01",'   ',"\u{00a0}\u{200b}",str_repeat('🚀',2001),"\xC3\x28",[],null] as $text) {
    $rejected=false;try { commsText($text); } catch (InvalidArgumentException $error) { $rejected=true; } check($rejected,'Reject blank, invalid or oversized text');
}
class Response extends RuntimeException { public array $data;public function __construct(array $data,int $status){parent::__construct('', $status);$this->data=$data;} }
function mpResponse(array $data,int $status=200):void{throw new Response($data,$status);}
function mpAreFriends(PDO $pdo,int $a,int $b):bool{return $b===2;}
function mpStationRoomCode(string $code,float $z):string{return 'command';}
class StubStatement extends PDOStatement {public function execute($params=null){return true;}public function fetch($mode=PDO::FETCH_DEFAULT,$cursorOrientation=PDO::FETCH_ORI_NEXT,$cursorOffset=0){return ['station_id'=>7,'room_pos_z'=>50,'code'=>'luna-base','name'=>'Luna'];}}
class StubPDO extends PDO {public function __construct(){}public function prepare($query,$options=[]){return new StubStatement();}}
$pdo=new StubPDO();
check(commsValidSignal('offer',['type'=>'offer','sdp'=>"v=0\r\nm=audio 9"]),'Valid description');
check(commsValidSignal('ice',['candidate'=>'candidate:1','sdpMid'=>'0','sdpMLineIndex'=>0]),'Valid candidate');
foreach ([['offer',['type'=>'answer','sdp'=>'v=0']],['answer',['sdp'=>'bad']],['ice',['candidate'=>'x','sdpMLineIndex'=>-1]],['ice',['candidate'=>str_repeat('x',4097)]],['bogus',[]]] as $case) check(!commsValidSignal($case[0],$case[1]),'Reject malformed signaling');
check(commsConversation($pdo,1,['peer_id'=>2])['key']==='private:1:2','Private conversation key');
check(commsConversation($pdo,1,['scope'=>'room','conversation'=>'room:7:command'])['recipient']===null,'Authorized room');
foreach ([['peer_id'=>1],['peer_id'=>9],['scope'=>'room','conversation'=>'room:8:command']] as $input) {
    $rejected=false;try { commsConversation($pdo,1,$input); } catch(Response $response){$rejected=$response->getCode()===403;}check($rejected,'Reject self, nonfriend and room mismatch');
}
echo "Communications API: text limits and conversation authorization passed.\n";
