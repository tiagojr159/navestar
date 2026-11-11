const {test}=require('node:test');
const assert=require('node:assert/strict');
const {CallSession,mergeMessages,mediaError}=require('../js/communications-core.js');
let trackId=0;
class Track{
  constructor(kind){this.kind=kind;this.id=String(++trackId);this.enabled=true;this.readyState='live';this.muted=false;}
  stop(){this.readyState='ended';}
}
class Stream{
  constructor(tracks=[]){this.tracks=tracks;}
  getTracks(){return [...this.tracks];}getAudioTracks(){return this.tracks.filter(t=>t.kind==='audio');}getVideoTracks(){return this.tracks.filter(t=>t.kind==='video');}
  addTrack(track){this.tracks.push(track);}removeTrack(track){this.tracks=this.tracks.filter(t=>t!==track);}
}
class Peer{
  constructor(){this.signalingState='stable';this.connectionState='new';this.senders=[];this.candidates=[];this.restarts=0;}
  addTrack(track){const sender={track,async replaceTrack(next){this.track=next;}};this.senders.push(sender);return sender;}
  addTransceiver(kind){return {sender:this.addTrack(null),receiver:{track:new Track(kind)}};}
  getSenders(){return this.senders;}
  async createOffer(){return {type:'offer',sdp:'v=0\r\nm=audio 9\r\nm=video 9'};}
  async createAnswer(){return {type:'answer',sdp:'v=0\r\nm=audio 9\r\nm=video 9'};}
  async setLocalDescription(desc){this.localDescription={...desc,toJSON:()=>desc};this.signalingState=desc.type==='offer'?'have-local-offer':'stable';}
  async setRemoteDescription(desc){this.remoteDescription=desc;this.signalingState=desc.type==='offer'?'have-remote-offer':'stable';}
  async addIceCandidate(candidate){assert.ok(this.remoteDescription,'ICE applied before SDP');this.candidates.push(candidate);}
  restartIce(){this.restarts++;}
  close(){this.connectionState='closed';}
}
function setup(){
  const requests=[],timers=new Map(),streams=[];let timerId=0,time=1000;
  const d={Peer,Stream,iceServers:[],now:()=>time,setTimeout:(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId;},clearTimeout:id=>timers.delete(id),
    media:{async getUserMedia(constraints){const s=new Stream([...(constraints.audio?[new Track('audio')]:[]),...(constraints.video?[new Track('video')]:[])]);streams.push(s);return s;},async getDisplayMedia(){const s=new Stream([new Track('video')]);streams.push(s);return s;}},
    async request(action,payload){requests.push({action,payload});return action==='call-start'?{call_id:'call-1'}:{ok:true};}};
  return {d,session:new CallSession(d),requests,timers,streams,advance(ms){time+=ms;},runTimers(ms){for(const [id,timer] of [...timers])if(timer.ms===ms){timers.delete(id);timer.fn();}}};
}
const incoming={call_id:'call-1',caller_id:2,caller_name:'Pilot',media_mode:'video'};
test('incoming calls do not capture devices before acceptance; early ICE waits for SDP',async()=>{
  const f=setup(),s=f.session;s.invite(incoming);assert.equal(f.streams.length,0);
  await s.handle({call_id:'call-1',signal_type:'ice',payload:{candidate:'first'}});
  await s.handle({call_id:'call-1',signal_type:'offer',payload:{type:'offer',sdp:'v=0'}});
  await s.accept(false);
  assert.equal(f.streams.length,1);assert.equal(s.local.getVideoTracks().length,0,'video invitation may be accepted with audio only');
  assert.equal(s.pc.candidates.length,1);assert.equal(s.state.phase,'connecting');
  assert.ok(f.requests.find(r=>r.action==='call-accept'));
  assert.ok(f.requests.find(r=>r.payload?.type==='answer'));
});
test('caller waits for actual media connection before starting duration',async()=>{
  const f=setup(),s=f.session;await s.start(2,'Pilot',true);
  assert.equal(s.state.phase,'ringing');assert.equal(s.state.startedAt,0);
  s.accepted();assert.equal(s.state.phase,'connecting');assert.equal(s.state.startedAt,0);
  await s.handle({call_id:'call-1',signal_type:'answer',payload:{type:'answer',sdp:'v=0'}});
  s.pc.connectionState='connected';s.pc.onconnectionstatechange();assert.equal(s.state.phase,'connected');assert.equal(s.state.startedAt,1000);
  f.advance(500);s.pc.connectionState='disconnected';s.pc.onconnectionstatechange();f.runTimers(2500);assert.equal(s.pc.restarts,1);
  s.pc.connectionState='connected';s.pc.onconnectionstatechange();assert.equal(s.state.startedAt,1000,'reconnection preserves duration');
});
test('hangup closes media immediately even while the server request stalls',async()=>{
  const f=setup(),s=f.session;await s.start(2,'Pilot',true);const pc=s.pc,stream=s.local;
  let finish;f.d.request=()=>new Promise(resolve=>finish=resolve);
  const pending=s.end();assert.equal(pc.connectionState,'closed');assert.ok(stream.getTracks().every(t=>t.readyState==='ended'));assert.equal(s.state.phase,'ended');assert.equal(f.timers.size,0);
  finish({ok:true});await pending;
});
test('late permission after cancel cannot revive or overwrite a newer call',async()=>{
  const f=setup(),s=f.session;let grant;
  f.d.media.getUserMedia=()=>new Promise(resolve=>grant=resolve);
  const first=s.start(2,'First');await s.end();
  f.d.media.getUserMedia=async()=>new Stream([new Track('audio')]);await s.start(3,'Second');const current=s.local;
  const late=new Stream([new Track('audio')]);grant(late);await first;
  assert.equal(s.local,current);assert.equal(s.state.peerName,'Second');assert.ok(late.getTracks().every(t=>t.readyState==='ended'));
});
test('cancel during call creation closes the orphan server call',async()=>{
  const f=setup(),s=f.session;const original=f.d.request;let create;
  f.d.request=(action,payload)=>action==='call-start'?new Promise(resolve=>create=resolve):original(action,payload);
  const start=s.start(2,'Pilot');await new Promise(resolve=>setImmediate(resolve));await s.end();create({call_id:'late-call'});await start;
  assert.equal(s.state.phase,'ended');assert.ok(f.requests.some(r=>r.action==='call-end'&&r.payload.call_id==='late-call'));
});
test('mute, camera and screen share use existing senders and release capture',async()=>{
  const f=setup(),s=f.session;await s.start(2,'Pilot',true);const microphone=s.local.getAudioTracks()[0];
  s.mute();assert.equal(microphone.enabled,false);s.mute();assert.equal(microphone.enabled,true);
  const camera=s.local.getVideoTracks()[0];await s.camera();assert.equal(camera.readyState,'ended');assert.equal(s.state.camera,false);
  await s.camera();assert.equal(s.state.camera,true);const restored=s.local.getVideoTracks()[0];
  await s.share();const display=s.display;assert.equal(restored.enabled,false);assert.equal(s.state.sharing,true);
  await s.stopShare();assert.equal(restored.enabled,true);assert.equal(s.videoSender.track,restored);assert.ok(display.getTracks().every(t=>t.readyState==='ended'));
  await s.end();assert.ok(f.streams.every(stream=>stream.getTracks().every(t=>t.readyState==='ended')));
});
test('capture denial produces a useful error and never starts a server call',async()=>{
  const f=setup();f.d.media.getUserMedia=async()=>{throw Object.assign(new Error('Denied'),{name:'NotAllowedError'});};
  await f.session.start(2,'Pilot');assert.equal(f.session.state.phase,'failed');assert.match(f.session.state.error,/Permissão negada/);assert.equal(f.requests.length,0);
});
test('simultaneous renegotiation yields only on the polite callee',async()=>{
  const f=setup(),s=f.session;await s.start(2,'Pilot');
  await s.handle({call_id:'call-1',signal_type:'offer',payload:{type:'offer',sdp:'collision'}});assert.equal(s.ignoreOffer,true);assert.equal(s.pc.remoteDescription,undefined);
  await s.handle({call_id:'call-1',signal_type:'answer',payload:{type:'answer',sdp:'reply'}});assert.equal(s.ignoreOffer,false);
  const b=setup();b.session.invite(incoming);await b.session.accept(false);await b.session.offer();
  await b.session.handle({call_id:'call-1',signal_type:'offer',payload:{type:'offer',sdp:'collision'}});assert.equal(b.session.pc.remoteDescription.sdp,'collision');assert.equal(b.session.pc.signalingState,'stable');
});
test('message reconciliation deduplicates retries, preserves pending text and isolates senders',()=>{
  const existing=[{clientId:'same-id',senderId:1,text:'hello',status:'pending',localTime:1},{clientId:'other',senderId:1,text:'pending',status:'pending',localTime:2}];
  const rows=mergeMessages(existing,[{id:5,clientId:'same-id',senderId:1,text:'hello'},{id:6,clientId:'same-id',senderId:2,text:'different sender'}]);
  assert.equal(rows.length,3);assert.equal(rows[0].status,'sent');assert.equal(rows[1].senderId,2);assert.equal(rows[2].text,'pending');assert.equal(rows[2].status,'pending');
  assert.equal(mergeMessages(rows,[{id:5,clientId:'same-id',senderId:1,text:'hello'}]).length,3);
});
test('stale signals cannot mutate a different call',async()=>{
  const f=setup(),s=f.session;s.invite(incoming);await s.end();s.invite({...incoming,call_id:'second'});
  await s.handle({call_id:'call-1',signal_type:'offer',payload:{type:'offer',sdp:'stale'}});assert.equal(s.pendingOffer,null);
  assert.match(mediaError({name:'NotReadableError'}),/outro aplicativo/);
});
test('an older failed request cannot overwrite a newer active call',async()=>{
  const f=setup(),s=f.session;await s.start(2,'First');let finish;const request=f.d.request;
  f.d.request=(action,payload)=>action==='call-end'?new Promise(resolve=>finish=resolve):request(action,payload);
  const failed=s.fail(new Error('Network failure'));await s.start(3,'Second');finish({ok:true});await failed;
  assert.equal(s.state.phase,'ringing');assert.equal(s.state.peerName,'Second');
});
