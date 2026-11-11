(function(root) {
  'use strict';
  function mediaError(error) {
    return ({NotAllowedError:'Permissão negada. Autorize o microfone ou a câmera nas configurações deste site.',NotFoundError:'Nenhum dispositivo compatível foi encontrado.',NotReadableError:'O dispositivo está sendo usado por outro aplicativo.',OverconstrainedError:'Este dispositivo não atende às configurações solicitadas.'})[error?.name] || error?.message || 'Não foi possível conectar. Tente novamente.';
  }
  function mergeMessages(existing, incoming) {
    const key=item=>item.clientId?item.senderId+':'+item.clientId:String(item.id);
    const rows=new Map(existing.map(item=>[key(item),item]));
    for(const item of incoming)rows.set(key(item),{...rows.get(key(item)),...item,status:'sent'});
    return [...rows.values()].sort((a,b)=>(a.id||Number.MAX_SAFE_INTEGER)-(b.id||Number.MAX_SAFE_INTEGER)||(a.localTime||0)-(b.localTime||0));
  }
  class CallSession {
    constructor(deps) {
      this.d=deps;this.state={phase:'idle',peerName:'',callId:'',muted:false,camera:false,sharing:false,startedAt:0};
      this.generation=0;this.ice=[];this.timers=new Set();this.signalQueue=Promise.resolve();this.receiveQueue=Promise.resolve();this.makingOffer=false;this.ready=false;
    }
    update(patch){Object.assign(this.state,patch);this.d.onChange?.({...this.state});}
    active(){return !['idle','ended','failed'].includes(this.state.phase);}
    timer(fn,ms){const id=this.d.setTimeout(()=>{this.timers.delete(id);fn();},ms);this.timers.add(id);return id;}
    stopStream(stream){stream?.getTracks().forEach(track=>track.stop());}
    valid(token){return this.generation===token;}
    cleanup(){this.generation++;this.ready=false;this.makingOffer=false;this.pendingOffer=null;this.ignoreOffer=false;for(const id of this.timers)this.d.clearTimeout(id);this.timers.clear();this.ice=[];if(this.pc){this.pc.ontrack=this.pc.onicecandidate=this.pc.onconnectionstatechange=this.pc.onnegotiationneeded=null;this.pc.close();this.pc=null;}this.stopStream(this.local);this.stopStream(this.display);this.local=this.remote=this.display=null;this.videoSender=null;this.signalQueue=Promise.resolve();this.d.onStream?.(null,null);}
    async acquire(video,token){
      if(!this.d.media?.getUserMedia)throw new Error('Use HTTPS ou localhost para acessar o microfone e a câmera.');
      const stream=await this.d.media.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:video?{width:{ideal:960},height:{ideal:540},frameRate:{ideal:24,max:30},facingMode:'user'}:false});
      if(!this.valid(token)){this.stopStream(stream);return null;}return stream;
    }
    async start(peerId,peerName,video=false){
      if(this.active())throw new Error('Encerre a chamada atual antes de iniciar outra.');
      this.cleanup();const token=this.generation;
      this.update({phase:'acquiring',peerId,peerName,callId:'',video,muted:false,camera:video,sharing:false,startedAt:0,endedAt:0,error:'',message:''});
      try{
        const stream=await this.acquire(video,token);if(!this.valid(token))return;this.local=stream;
        const response=await this.d.request('call-start',{user_id:peerId,video});
        if(!this.valid(token)){this.d.request('call-end',{call_id:response.call_id}).catch(()=>{});return;}
        this.update({callId:response.call_id,role:'caller',phase:'ringing'});this.d.notify?.('ring',response.call_id,video);
        this.createPeer();await this.offer();if(!this.valid(token))return;this.ready=true;
        this.timer(()=>{if(this.state.phase==='ringing')this.end('O piloto não atendeu.');},35000);
      }catch(error){if(this.valid(token))await this.fail(error);}
    }
    invite(call){
      if(this.active())return false;
      this.cleanup();this.update({phase:'incoming',callId:call.call_id,peerId:Number(call.caller_id),peerName:call.caller_name,role:'callee',video:call.media_mode==='video',camera:false,sharing:false,muted:false,startedAt:0,endedAt:0,error:'',message:''});
      this.timer(()=>{if(this.state.phase==='incoming')this.end('Chamada não atendida.','call-decline');},35000);return true;
    }
    async accept(video=this.state.video){
      if(this.state.phase!=='incoming')return;
      const token=this.generation;this.update({phase:'acquiring',camera:video});
      try{
        const stream=await this.acquire(video,token);if(!this.valid(token))return;this.local=stream;
        await this.d.request('call-accept',{call_id:this.state.callId});if(!this.valid(token))return;
        this.update({phase:'connecting'});this.createPeer();this.ready=true;
        this.d.notify?.('state',this.state.callId);
        if(this.pendingOffer){const offer=this.pendingOffer;this.pendingOffer=null;await this.description(offer);}
        this.connectionDeadline();
      }catch(error){if(this.valid(token))await this.fail(error);}
    }
    createPeer(){
      if(typeof this.d.Peer!=='function')throw new Error('Este navegador não oferece suporte a chamadas. Atualize o navegador.');
      const token=this.generation,pc=new this.d.Peer({iceServers:this.d.iceServers||[]});this.pc=pc;this.remote=new this.d.Stream();
      this.local.getTracks().forEach(track=>{const sender=pc.addTrack(track,this.local);if(track.kind==='video')this.videoSender=sender;});
      if(!this.videoSender)this.videoSender=pc.addTransceiver('video',{direction:'sendrecv',streams:[this.local]}).sender;
      pc.ontrack=event=>{
        if(!this.valid(token))return;
        for(const track of event.streams[0]?.getTracks()||[event.track])if(!this.remote.getTracks().some(old=>old.id===track.id))this.remote.addTrack(track);
        event.track.onunmute=event.track.onmute=()=>this.d.onStream?.(this.local,this.remote);
        this.d.onStream?.(this.local,this.remote);
      };
      pc.onicecandidate=event=>{if(event.candidate&&this.valid(token))this.send('ice',event.candidate.toJSON()).catch(error=>this.valid(token)&&this.fail(error));};
      pc.onnegotiationneeded=()=>{if(this.ready&&this.valid(token))this.offer().catch(error=>this.valid(token)&&this.fail(error));};
      pc.onconnectionstatechange=()=>{
        if(!this.valid(token))return;
        if(pc.connectionState==='connected'){this.update({phase:'connected',startedAt:this.state.startedAt||this.d.now(),error:'',message:''});this.d.onStream?.(this.local,this.remote);}
        else if(pc.connectionState==='disconnected'||pc.connectionState==='failed'){
          this.update({phase:'reconnecting'});
          this.timer(()=>{if(this.pc===pc&&this.state.phase==='reconnecting'){pc.restartIce?.();this.connectionDeadline();}},2500);
        }
      };
      this.d.onStream?.(this.local,this.remote);
    }
    connectionDeadline(){const token=this.generation;this.timer(()=>{if(this.valid(token)&&['connecting','reconnecting'].includes(this.state.phase))this.fail(new Error('Não foi possível restabelecer a conexão. Tente ligar novamente.'));},25000);}
    send(type,payload){
      const id=this.state.callId,token=this.generation;
      const operation=this.signalQueue.catch(()=>{}).then(async()=>{if(!id||!this.valid(token))return;await this.d.request('call-signal',{call_id:id,type,payload});this.d.notify?.('state',id);});
      this.signalQueue=operation;return operation;
    }
    async offer(){
      const pc=this.pc,token=this.generation;if(!pc||this.makingOffer||pc.signalingState!=='stable')return;
      this.makingOffer=true;
      try{await pc.setLocalDescription(await pc.createOffer());if(this.valid(token))await this.send('offer',pc.localDescription.toJSON());}finally{if(this.valid(token))this.makingOffer=false;}
    }
    handle(signal){
      const token=this.generation;
      const operation=this.receiveQueue.catch(()=>{}).then(async()=>{
        if(!this.valid(token)||signal.call_id!==this.state.callId||!this.active())return;
        if(signal.signal_type==='ice'){
          if(this.ignoreOffer)return;
          if(this.pc?.remoteDescription)await this.pc.addIceCandidate(signal.payload);else if(this.ice.length<256)this.ice.push(signal.payload);
        }else if(signal.signal_type==='offer'){
          if(!this.pc){this.pendingOffer=signal.payload;return;}await this.description(signal.payload);
        }else if(signal.signal_type==='answer'&&this.pc?.signalingState==='have-local-offer'){
          this.ignoreOffer=false;await this.pc.setRemoteDescription(signal.payload);if(this.valid(token))await this.flushIce();
        }
      });this.receiveQueue=operation;return operation;
    }
    async description(description){
      const pc=this.pc,token=this.generation;if(!pc)return;
      if(description.type!=='offer')return;
      const collision=this.makingOffer||pc.signalingState!=='stable';
      // The callee yields on simultaneous renegotiation; the caller ignores the colliding offer.
      this.ignoreOffer=collision&&this.state.role==='caller';if(this.ignoreOffer)return;
      await pc.setRemoteDescription(description);if(!this.valid(token))return;await this.flushIce();
      await pc.setLocalDescription(await pc.createAnswer());if(this.valid(token))await this.send('answer',pc.localDescription.toJSON());
    }
    async flushIce(){if(!this.pc?.remoteDescription)return;for(const candidate of this.ice.splice(0))await this.pc.addIceCandidate(candidate);}
    accepted(){if(this.state.role==='caller'&&this.state.phase==='ringing'){this.update({phase:'connecting'});this.connectionDeadline();}}
    mute(){if(!this.local)return;const muted=!this.state.muted;this.local.getAudioTracks().forEach(track=>track.enabled=!muted);this.update({muted});}
    async camera(deviceId){
      if(!this.pc||!this.local)return;
      if(this.state.sharing)await this.stopShare();
      if(this.state.camera&&!deviceId){await this.videoSender.replaceTrack(null);for(const track of this.local.getVideoTracks()){this.local.removeTrack(track);track.stop();}this.update({camera:false});this.d.onStream?.(this.local,this.remote);return;}
      const token=this.generation;const stream=await this.d.media.getUserMedia({video:{width:{ideal:960},height:{ideal:540},frameRate:{ideal:24,max:30},...(deviceId?{deviceId:{exact:deviceId}}:{facingMode:'user'})},audio:false});
      if(!this.valid(token)){this.stopStream(stream);return;}
      const track=stream.getVideoTracks()[0];try{await this.videoSender.replaceTrack(track);}catch(error){this.stopStream(stream);throw error;}if(!this.valid(token)){this.stopStream(stream);return;}
      for(const old of this.local.getVideoTracks()){this.local.removeTrack(old);old.stop();}this.local.addTrack(track);
      this.update({camera:true,video:true});this.d.onStream?.(this.local,this.remote);
    }
    async microphone(deviceId){
      if(!this.pc||!this.local)return;const token=this.generation;
      const stream=await this.d.media.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,deviceId:{exact:deviceId}},video:false});
      if(!this.valid(token)){this.stopStream(stream);return;}
      const track=stream.getAudioTracks()[0],sender=this.pc.getSenders().find(sender=>sender.track?.kind==='audio');
      try{await sender.replaceTrack(track);}catch(error){this.stopStream(stream);throw error;}if(!this.valid(token)){this.stopStream(stream);return;}
      for(const old of this.local.getAudioTracks()){this.local.removeTrack(old);old.stop();}track.enabled=!this.state.muted;this.local.addTrack(track);this.d.onStream?.(this.local,this.remote);
    }
    async share(){
      if(!this.pc||this.state.phase==='incoming')return;
      if(this.display){await this.stopShare();return;}
      if(!this.d.media.getDisplayMedia)throw new Error('O compartilhamento de tela não está disponível neste navegador.');
      const token=this.generation,display=await this.d.media.getDisplayMedia({video:{frameRate:{ideal:15,max:30}},audio:false});
      if(!this.valid(token)){this.stopStream(display);return;}
      const track=display.getVideoTracks()[0];try{await this.videoSender.replaceTrack(track);}catch(error){this.stopStream(display);throw error;}if(!this.valid(token)){this.stopStream(display);return;}
      this.display=display;this.local.getVideoTracks().forEach(track=>track.enabled=false);track.onended=()=>this.display===display&&this.stopShare();
      this.update({sharing:true,video:true});this.d.onStream?.(display,this.remote);
    }
    async stopShare(){
      if(!this.display)return;const display=this.display;this.display=null;
      const camera=this.local?.getVideoTracks()[0]||null;if(camera)camera.enabled=true;
      await this.videoSender?.replaceTrack(camera);this.stopStream(display);this.update({sharing:false});this.d.onStream?.(this.local,this.remote);
    }
    async end(message='Chamada encerrada.',action='call-end'){
      const id=this.state.callId;this.cleanup();this.update({phase:'ended',callId:'',camera:false,sharing:false,endedAt:this.d.now(),message});
      if(id){this.d.notify?.('state',id);try{await this.d.request(action,{call_id:id});}catch(error){this.d.onEndError?.(id,error);}}
    }
    async fail(error){const message=mediaError(error),generation=this.generation+1;await this.end(message);if(this.valid(generation))this.update({phase:'failed',error:message});}
  }
  const api={CallSession,mergeMessages,mediaError};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NaveCommunications=api;
})(typeof window!=='undefined'?window:globalThis);
