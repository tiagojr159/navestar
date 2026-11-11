(() => {
  'use strict';
  if(!window.crewGame?.enabled)return;
  const api=window.crewGame.api,selfId=multiplayerUserId,core=window.NaveCommunications;
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon={chat:'<path d="M21 11a8 8 0 0 1-8 8H6l-4 3V11a9 9 0 0 1 19 0Z"/><path d="M7 9h9M7 13h6"/>',phone:'<path d="M8 3H4c-3 7 7 17 14 17l3-4-5-3-2 2a13 13 0 0 1-6-6l2-2Z"/>',video:'<rect x="3" y="5" width="13" height="14" rx="3"/><path d="m16 10 5-3v10l-5-3Z"/>',mic:'<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/>',speaker:'<path d="m11 4-5 4H2v8h4l5 4ZM15 8a6 6 0 0 1 0 8M18 4a11 11 0 0 1 0 16"/>',screen:'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 22h8M12 17v5m-4-12 4-4 4 4M12 6v8"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="m10 2-1 3-3 1-3-1-2 4 3 2v3l-2 2 3 4 3-1 3 1 1 2 4-1 1-3 3-2 2-1-1-4-3-1-1-3 1-2-4-2Z"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',send:'<path d="m2 3 20 9-20 9 4-9Zm4 9h16"/>',minimize:'<path d="M5 12h14"/>'};
  const svg=name=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icon[name]}</svg>`;
  async function request(action,body=null,query={}){
    const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),12000);
    try{
      const response=await fetch(api+'?'+new URLSearchParams({action,...query}),{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store',credentials:'same-origin',signal:abort.signal});
      const result=await response.json();if(response.status===401)throw new Error('Sua sessão expirou. Entre novamente para conversar.');if(response.status===503)throw new Error('Comunicações indisponíveis. Verifique se o servidor e o banco de dados estão ativos.');if(!response.ok)throw new Error(result.error||'Não foi possível concluir a operação.');return result;
    }catch(error){if(error.name==='AbortError'||error instanceof TypeError)throw new Error('Sem conexão com o servidor. Tente novamente.');throw error;}finally{clearTimeout(timer);}
  }
  const launcher=document.createElement('button');launcher.type='button';launcher.id='communicationsLaunch';launcher.className='comms-launch';launcher.innerHTML=svg('chat')+'<span>COMUNICAÇÕES</span><b hidden>0</b>';launcher.setAttribute('aria-label','Abrir comunicações');launcher.setAttribute('aria-expanded','false');
  const hub=document.createElement('section');hub.id='communicationsHub';hub.className='comms-hub';hub.setAttribute('aria-label','Central de comunicações');hub.setAttribute('role','dialog');hub.hidden=true;
  hub.innerHTML=`<header class="comms-header"><div><span class="comms-eyebrow">NAVE / COMUNICAÇÕES</span><h2>Conversas</h2></div><span class="comms-connect" role="status">Conectando…</span><button class="comms-icon" data-close title="Fechar conversas" aria-label="Fechar conversas">${svg('close')}</button></header>
    <div class="comms-layout"><aside class="comms-sidebar"><label class="comms-search"><span>Buscar conversa</span><input type="search" placeholder="Buscar piloto…" maxlength="60" aria-label="Buscar piloto"></label><div class="comms-roster"></div><button class="comms-friends" data-friends>Gerenciar amigos ↗</button></aside>
    <main class="comms-conversation"><header class="comms-peer"><button class="comms-icon comms-back" data-back aria-label="Voltar às conversas">‹</button><div class="comms-avatar" data-avatar>✦</div><div class="comms-peer-name"><strong>Seu próximo contato</strong><small>Escolha uma conversa para começar</small></div><button class="comms-icon" data-audio aria-label="Iniciar chamada de áudio" title="Chamada de áudio" disabled>${svg('phone')}</button><button class="comms-icon" data-video aria-label="Iniciar chamada de vídeo" title="Chamada de vídeo" disabled>${svg('video')}</button></header>
    <div class="comms-thread" role="log" aria-label="Histórico de mensagens" aria-live="polite" aria-relevant="additions"><div class="comms-empty">${svg('chat')}<h3>Conecte-se à tripulação.</h3><p>Converse com seus amigos ou com os pilotos do seu compartimento.</p></div></div>
    <button class="comms-new" data-new hidden>Novas mensagens ↓</button><div class="comms-typing" aria-live="polite"></div><div class="comms-chat-error" role="status"></div>
    <form class="comms-compose"><label class="comms-sr" for="commsMessage">Sua mensagem</label><textarea id="commsMessage" rows="1" maxlength="4000" placeholder="Selecione uma conversa" disabled></textarea><button type="submit" aria-label="Enviar mensagem" title="Enviar mensagem" disabled>${svg('send')}</button><small><span data-count>0 / 2.000</span><span>Enter envia · Shift + Enter quebra a linha</span></small></form></main></div>`;
  const callPanel=document.createElement('section');callPanel.id='commsCall';callPanel.className='comms-call';callPanel.hidden=true;callPanel.setAttribute('role','dialog');callPanel.setAttribute('aria-label','Chamada');
  callPanel.innerHTML=`<header class="comms-call-head"><span class="comms-call-dot"></span><strong data-call-name>Chamada</strong><span data-duration>00:00</span><button class="comms-icon" data-minimize aria-label="Minimizar chamada" title="Minimizar chamada">${svg('minimize')}</button><button class="comms-icon" data-dismiss aria-label="Fechar janela da chamada" title="Fechar janela">${svg('close')}</button></header>
    <div class="comms-call-body"><div class="comms-call-stage"><div class="comms-call-person"><div class="comms-avatar" data-call-avatar>✦</div><h3 data-call-peer></h3><p data-call-phase role="status" aria-live="polite"></p></div><video data-remote autoplay playsinline muted hidden></video><video data-local autoplay playsinline muted hidden></video><span class="comms-self" hidden>Você</span></div>
    <div class="comms-call-details"><span data-quality></span><span data-media-state></span></div><p class="comms-call-error" role="status"></p>
    <div class="comms-incoming" hidden><button data-accept-audio>${svg('phone')} Atender com áudio</button><button data-accept-video>${svg('video')} Atender com vídeo</button><button class="comms-danger" data-decline>Recusar</button></div>
    <div class="comms-call-controls"><button class="comms-icon" data-mute aria-label="Silenciar microfone" title="Silenciar microfone">${svg('mic')}<span>Microfone</span></button><button class="comms-icon" data-camera aria-label="Ativar câmera" title="Ativar câmera">${svg('video')}<span>Câmera</span></button><button class="comms-icon" data-deafen aria-label="Silenciar saída de áudio" title="Silenciar saída de áudio">${svg('speaker')}<span>Ouvir</span></button><button class="comms-icon" data-screen aria-label="Compartilhar tela" title="Compartilhar tela">${svg('screen')}<span>Tela</span></button><button class="comms-icon" data-devices aria-label="Escolher dispositivos" title="Escolher dispositivos">${svg('settings')}<span>Ajustes</span></button><button class="comms-icon comms-danger" data-end aria-label="Encerrar chamada" title="Encerrar chamada">${svg('phone')}<span>Encerrar</span></button></div>
    <div class="comms-devices" hidden><label>Microfone<select data-mic-device aria-label="Microfone"></select></label><label>Câmera<select data-camera-device aria-label="Câmera"></select></label></div><button class="comms-play" data-play hidden>Toque para ouvir a chamada</button><button class="comms-redial" data-redial hidden>Tentar novamente</button></div><audio data-remote-audio autoplay></audio>`;
  document.body.append(launcher,hub,callPanel);document.body.classList.add('comms-modern');
  const $=selector=>hub.querySelector(selector),$call=selector=>callPanel.querySelector(selector);
  const conversations=new Map(),dismissedCalls=new Set();let roster={friends:[],room:null},active=null,search='',callBusy=false,rosterBusy=false,chatBusy=false,signalCursor=0,lastTyping=0,lastCallId='',configPromise=null,socket=null,deafened=false,lastQuality=0;
  const phaseLabels={idle:'Pronto para conversar',acquiring:'Aguardando acesso aos dispositivos…',ringing:'Chamando…',incoming:'Chamada recebida',connecting:'Conectando…',connected:'Conexão estabelecida',reconnecting:'Reconectando…',ended:'Chamada encerrada',failed:'Não foi possível conectar'};
  function showHub(){hub.hidden=false;hub.classList.add('open');launcher.setAttribute('aria-expanded','true');window.flightCombat?.release();loadRoster();if(active)loadMessages();else renderRoster();}
  function hideHub(){hub.hidden=true;hub.classList.remove('open');launcher.setAttribute('aria-expanded','false');launcher.focus();}
  function callChange(state){
    if(lastCallId&&!state.callId&&['ended','failed'].includes(state.phase))dismissedCalls.add(lastCallId);
    if(state.callId)lastCallId=state.callId;
    callPanel.hidden=state.phase==='idle';callPanel.dataset.phase=state.phase;
    $call('[data-call-name]').textContent=state.peerName||'Chamada';$call('[data-call-peer]').textContent=state.peerName;
    $call('[data-call-avatar]').textContent=initials(state.peerName);$call('[data-call-phase]').textContent=phaseLabels[state.phase];
    $call('.comms-call-error').textContent=state.error||state.message||'';
    const incoming=state.phase==='incoming',live=['connected','connecting','reconnecting'].includes(state.phase),done=['ended','failed'].includes(state.phase);
    $call('.comms-incoming').hidden=!incoming;$call('[data-accept-video]').hidden=!state.video;
    $call('.comms-call-controls').hidden=incoming||done;$call('[data-end]').disabled=false;
    for(const name of ['mute','camera','screen','devices'])$call('[data-'+name+']').disabled=!live;
    pressed('[data-mute]',state.muted,state.muted?'Ativar microfone':'Silenciar microfone');pressed('[data-camera]',state.camera,state.camera?'Desativar câmera':'Ativar câmera');pressed('[data-screen]',state.sharing,state.sharing?'Parar compartilhamento':'Compartilhar tela');
    $call('[data-media-state]').textContent=done||incoming?'':state.sharing?'Compartilhando sua tela':state.camera?'Microfone e câmera em uso':state.muted?'Microfone silenciado':'Somente áudio';
    $call('[data-redial]').hidden=!done||!state.peerId;$call('[data-duration]').hidden=!state.startedAt;
    if(incoming){callPanel.classList.remove('minimized');window.naveCallRingtone?.start();}else window.naveCallRingtone?.stop();
    if(done){$call('.comms-devices').hidden=true;$call('[data-quality]').textContent='';$call('[data-play]').hidden=true;}
  }
  function pressed(selector,value,label){const button=$call(selector);button.setAttribute('aria-pressed',String(value));button.setAttribute('aria-label',label);button.title=label;}
  function initials(name){return String(name||'P').trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();}
  function streams(local,remote){
    const video=$call('[data-remote]'),preview=$call('[data-local]'),audio=$call('[data-remote-audio]');
    if(audio.srcObject!==remote){audio.srcObject=remote;audio.muted=deafened;if(remote)audio.play().catch(()=>{$call('[data-play]').hidden=false;});}
    // A single audio element plays the remote stream; both video elements stay muted.
    video.srcObject=remote;video.hidden=!remote?.getVideoTracks().some(track=>track.readyState==='live'&&!track.muted);
    preview.srcObject=local;preview.hidden=!local?.getVideoTracks().some(track=>track.readyState==='live'&&track.enabled);$call('.comms-self').hidden=preview.hidden;
    if(!video.hidden)video.play().catch(()=>{});if(!preview.hidden)preview.play().catch(()=>{});
  }
  const session=new core.CallSession({request,media:navigator.mediaDevices,Peer:window.RTCPeerConnection,Stream:window.MediaStream,setTimeout,clearTimeout,now:()=>Date.now(),onChange:callChange,onStream:streams,
    notify(type,id,video){if(type==='ring')socket?.ring(id,video);else socket?.notify(id);},
    onEndError(id){const body=JSON.stringify({call_id:id});navigator.sendBeacon?.(api+'?action=call-end',new Blob([body],{type:'application/json'}));}});
  async function configure(){
    if(configPromise)return configPromise;
    configPromise=request('comms-config').then(config=>{session.d.iceServers=config.iceServers;return config;}).catch(error=>{configPromise=null;throw error;});return configPromise;
  }
  function mediaInUse(){return window.stationRoomCalls?.getMediaState?.().joined||window.stationCalls?.isActive?.()||window.crewVoice?.isEnabled?.();}
  async function startCall(id,name,video=false){
    try{if(mediaInUse())throw new Error('Saia do áudio do compartimento ou da cabine antes de iniciar uma chamada privada.');if(session.active()){callPanel.hidden=false;callPanel.classList.remove('minimized');throw new Error('Encerre a chamada atual antes de iniciar outra.');}await configure();callPanel.classList.remove('minimized');await session.start(Number(id),String(name),Boolean(video));}
    catch(error){if(!session.active())session.update({phase:'failed',peerId:Number(id),peerName:String(name),error:core.mediaError(error)});else $call('.comms-call-error').textContent=error.message;}
  }
  function threadKey(thread){return thread.scope==='room'?thread.conversation:'private:'+thread.peer_id;}
  function threadData(thread=active){const key=threadKey(thread);if(!conversations.has(key))conversations.set(key,{messages:[],loaded:false,older:false,cursor:0,peerReadId:0,lastRead:0,draft:''});return conversations.get(key);}
  function params(thread=active){return thread.scope==='room'?{scope:'room',conversation:thread.conversation}:{scope:'private',peer_id:String(thread.peer_id)};}
  function selectThread(thread){
    if(active)threadData().draft=$('textarea').value;
    active=thread;hub.classList.add('has-conversation');$('.comms-peer-name strong').textContent=thread.name;$('.comms-peer-name small').textContent=thread.scope==='room'?'Compartimento atual':thread.online?'Online agora':'Offline · deixe uma mensagem';$('[data-avatar]').textContent=thread.scope==='room'?'◈':initials(thread.name);
    $('[data-audio]').disabled=$('[data-video]').disabled=thread.scope!=='room'&&!thread.online;
    $('textarea').disabled=false;$('textarea').placeholder='Escreva uma mensagem…';$('textarea').value=threadData().draft;updateComposer();renderMessages(true);renderRoster();loadMessages();
  }
  function openChat(id,name){showHub();const friend=roster.friends.find(peer=>peer.id===Number(id));selectThread({scope:'private',peer_id:Number(id),name:friend?.name||name||'Piloto',online:friend?.online});}
  function renderRoster(){
    const room=roster.room,peers=roster.friends.filter(peer=>peer.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
    $('.comms-roster').innerHTML=(room?`<div class="comms-section-label">NESTE COMPARTIMENTO</div><button class="comms-contact ${active?.conversation===room.key?'selected':''}" data-room><span class="comms-avatar">◈</span><span><strong>Canal da estação</strong><small>${escape(room.name)}</small></span>${room.unread?`<b>${room.unread}</b>`:''}</button>`:'')+`<div class="comms-section-label">MENSAGENS PRIVADAS</div>`+
      (peers.length?peers.map(peer=>`<button class="comms-contact ${active?.peer_id===peer.id?'selected':''}" data-peer="${peer.id}"><span class="comms-avatar ${peer.online?'online':''}">${escape(initials(peer.name))}</span><span><strong>${escape(peer.name)}</strong><small>${peer.online?'Disponível':'Offline'}</small></span>${peer.unread?`<b>${peer.unread>99?'99+':peer.unread}</b>`:''}</button>`).join(''):'<p class="comms-no-contacts">'+(search?'Nenhum piloto encontrado.':'Adicione amigos na rede de pilotos para começar.')+'</p>');
    const total=roster.friends.reduce((n,p)=>n+p.unread,0)+(room?.unread||0);launcher.querySelector('b').hidden=!total;launcher.querySelector('b').textContent=total>99?'99+':String(total);launcher.setAttribute('aria-label',`Abrir comunicações${total?', '+total+' mensagens não lidas':''}`);
  }
  async function loadRoster(){
    if(rosterBusy||document.hidden)return;rosterBusy=true;
    try{roster=await request('chat-roster');$('.comms-connect').textContent='● Conectado';$('.comms-connect').classList.remove('offline');
      if(active?.scope==='room'&&active.conversation!==roster.room?.key){active=null;hub.classList.remove('has-conversation');$('textarea').disabled=true;$('[data-audio]').disabled=$('[data-video]').disabled=true;$('.comms-peer-name strong').textContent='Você mudou de compartimento';$('.comms-peer-name small').textContent='Selecione o novo canal da estação.';$('.comms-thread').replaceChildren();}
      if(active?.scope==='private'){const peer=roster.friends.find(p=>p.id===active.peer_id);active.online=!!peer?.online;$('.comms-peer-name small').textContent=active.online?'Online agora':'Offline · deixe uma mensagem';$('[data-audio]').disabled=$('[data-video]').disabled=!active.online;}
      renderRoster();
    }catch(error){$('.comms-connect').textContent='● Sem conexão';$('.comms-connect').classList.add('offline');if(!hub.hidden)$('.comms-chat-error').textContent=error.message;}
    finally{rosterBusy=false;}
  }
  function atBottom(){const log=$('.comms-thread');return log.scrollHeight-log.scrollTop-log.clientHeight<90;}
  function stamp(value){return new Date(value.replace(' ','T')).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});}
  function renderMessages(bottom=false){
    if(!active)return;const data=threadData(),log=$('.comms-thread'),wasBottom=bottom||atBottom(),oldHeight=log.scrollHeight,oldTop=log.scrollTop;
    log.innerHTML=(data.older?'<button class="comms-older" data-older>Carregar anteriores</button>':'')+(data.messages.length?data.messages.map(message=>{
      const own=message.senderId===selfId,label=message.status==='failed'?'Não enviada':message.status==='pending'?'Enviando…':own&&message.id<=data.peerReadId?'Lida':'Enviada';
      return `<article class="comms-message ${own?'own':''} ${message.status||'sent'}">${!own&&active.scope==='room'?`<strong>${escape(message.name)}</strong>`:''}<p>${escape(message.text)}</p><footer><time>${message.createdAt?stamp(message.createdAt):'Agora'}</time>${own?`<span>${label}</span>`:''}${message.status==='failed'?`<button data-retry="${escape(message.clientId)}">Reenviar</button>`:''}</footer></article>`;
    }).join(''):`<div class="comms-empty"><h3>${data.loaded?'Comece a conversa.':'Carregando mensagens…'}</h3><p>${data.loaded?'Suas mensagens aparecerão aqui.':'Buscando o histórico deste contato.'}</p></div>`);
    if(wasBottom){log.scrollTop=log.scrollHeight;$('[data-new]').hidden=true;markRead();}else{log.scrollTop=oldTop+(bottom===false?0:log.scrollHeight-oldHeight);$('[data-new]').hidden=false;}
  }
  async function loadMessages(older=false){
    if(!active||chatBusy||hub.hidden||document.hidden)return;chatBusy=true;
    const thread={...active},data=threadData(thread),key=threadKey(thread),max=Math.max(0,...data.messages.map(row=>row.id||0)),min=Math.min(...data.messages.filter(row=>row.id).map(row=>row.id));
    try{
      const result=await request('chat-history',null,{...params(thread),...(older?{before:String(min)}:data.loaded?{after:String(data.cursor)}:{})});
      const changed=result.messages.length||result.peerReadId!==data.peerReadId;data.messages=core.mergeMessages(data.messages,result.messages);if(!older)data.cursor=Math.max(data.cursor,...result.messages.map(row=>row.id),0);data.peerReadId=result.peerReadId;if(!data.loaded||older)data.older=result.hasMore;data.loaded=true;
      if(active&&threadKey(active)===key){if(changed||!data.messages.length||older){const log=$('.comms-thread'),height=log.scrollHeight,top=log.scrollTop;renderMessages(!max);if(older)log.scrollTop=top+(log.scrollHeight-height);}$('.comms-typing').textContent=result.typing.length?result.typing.join(', ')+' digitando…':'';$('.comms-chat-error').textContent='';markRead();}
    }catch(error){if(active&&threadKey(active)===key)$('.comms-chat-error').textContent=error.message;}finally{chatBusy=false;}
  }
  async function markRead(){
    if(!active||hub.hidden||document.hidden||!document.hasFocus()||!atBottom())return;
    const thread={...active},data=threadData(thread),id=data.cursor;if(id<=data.lastRead)return;data.lastRead=id;
    try{await request('chat-read',{...params(thread),message_id:id});if(thread.scope==='room'&&roster.room)roster.room.unread=0;else{const peer=roster.friends.find(p=>p.id===thread.peer_id);if(peer)peer.unread=0;}renderRoster();}catch(_){data.lastRead=0;}
  }
  async function deliver(message,thread){
    const data=threadData(thread);message.status='pending';if(active&&threadKey(active)===threadKey(thread))renderMessages(true);
    try{const result=await request('chat-send',{...params(thread),text:message.text,client_id:message.clientId});data.messages=core.mergeMessages(data.messages,[result.message]);}
    catch(error){message.status='failed';if(active&&threadKey(active)===threadKey(thread))$('.comms-chat-error').textContent=error.message;}
    if(active&&threadKey(active)===threadKey(thread))renderMessages(true);
  }
  function updateComposer(){const length=Array.from($('textarea').value).length;$('[data-count]').textContent=length.toLocaleString('pt-BR')+' / 2.000';$('.comms-compose button').disabled=!active||!$('textarea').value.trim()||length>2000;$('textarea').style.height='auto';$('textarea').style.height=Math.min(112,$('textarea').scrollHeight)+'px';}
  $('.comms-compose').addEventListener('submit',event=>{event.preventDefault();if(!active||$('.comms-compose button').disabled)return;const text=$('textarea').value.trim(),message={clientId:crypto.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2).padEnd(12,'0'),senderId:selfId,text,status:'pending',localTime:Date.now()};const thread={...active};threadData().messages.push(message);threadData().draft='';$('textarea').value='';updateComposer();deliver(message,thread);});
  $('textarea').addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();$('.comms-compose').requestSubmit();}});
  $('textarea').addEventListener('input',()=>{updateComposer();if(active&&Date.now()-lastTyping>2500&&$('textarea').value.trim()){lastTyping=Date.now();request('chat-typing',params()).catch(()=>{});}});
  $('.comms-search input').addEventListener('input',event=>{search=event.target.value;renderRoster();});
  $('.comms-thread').addEventListener('scroll',()=>{if(atBottom()){$('[data-new]').hidden=true;markRead();}});
  hub.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.matches('[data-close]'))hideHub();else if(button.matches('[data-back]'))hub.classList.remove('has-conversation');
    else if(button.matches('[data-peer]')){const peer=roster.friends.find(p=>p.id===Number(button.dataset.peer));if(peer)selectThread({scope:'private',peer_id:peer.id,name:peer.name,online:peer.online});}
    else if(button.matches('[data-room]')&&roster.room)selectThread({scope:'room',conversation:roster.room.key,name:roster.room.name});
    else if(button.matches('[data-friends]')){hideHub();document.querySelector('#friendsToggle')?.click();}
    else if(button.matches('[data-older]'))loadMessages(true);
    else if(button.matches('[data-new]')){$('.comms-thread').scrollTop=$('.comms-thread').scrollHeight;markRead();button.hidden=true;}
    else if(button.matches('[data-retry]')){const message=threadData().messages.find(row=>row.clientId===button.dataset.retry);if(message?.status==='failed')deliver(message,{...active});}
    else if(button.matches('[data-audio],[data-video]')&&active){
      if(active.scope==='room'){if(session.active()){$('.comms-chat-error').textContent='Encerre a chamada privada antes de entrar no áudio do compartimento.';return;}const room=window.stationRoomCalls;hideHub();if(room?.getMediaState().joined){room.showWindow();room.setMediaEnabled('video',button.hasAttribute('data-video')).catch(error=>$('.comms-chat-error').textContent=core.mediaError(error));}else room?.start(button.hasAttribute('data-video')?'video':'voice');}
      else startCall(active.peer_id,active.name,button.hasAttribute('data-video'));
    }
  });
  launcher.addEventListener('click',()=>hub.hidden?showHub():hideHub());
  document.addEventListener('click',event=>{const button=event.target.closest('[data-chat-user]');if(button){event.preventDefault();openChat(Number(button.dataset.chatUser),button.dataset.chatName);}},true);
  let actionBusy=false;
  callPanel.addEventListener('click',async event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.matches('[data-minimize]')){const mini=callPanel.classList.toggle('minimized');button.setAttribute('aria-label',mini?'Restaurar chamada':'Minimizar chamada');return;}
    if(button.matches('[data-dismiss]')){if(session.active())callPanel.classList.add('minimized');else callPanel.hidden=true;return;}
    if(button.matches('[data-end],[data-decline]')){await session.end(button.hasAttribute('data-decline')?'Chamada recusada.':'Chamada encerrada.',button.hasAttribute('data-decline')?'call-decline':'call-end');return;}
    if(actionBusy)return;actionBusy=true;
    try{
      if(button.matches('[data-accept-audio],[data-accept-video]')){if(mediaInUse())throw new Error('Saia da chamada do compartimento ou da cabine antes de atender.');await configure();await session.accept(button.hasAttribute('data-accept-video'));}
      else if(button.matches('[data-mute]'))session.mute();
      else if(button.matches('[data-camera]'))await session.camera();
      else if(button.matches('[data-screen]'))await session.share();
      else if(button.matches('[data-deafen]')){deafened=!deafened;$call('[data-remote-audio]').muted=deafened;pressed('[data-deafen]',deafened,deafened?'Ouvir chamada':'Silenciar saída de áudio');}
      else if(button.matches('[data-play]')){await $call('[data-remote-audio]').play();button.hidden=true;}
      else if(button.matches('[data-devices]')){const area=$call('.comms-devices');area.hidden=!area.hidden;if(!area.hidden){const devices=await navigator.mediaDevices.enumerateDevices();for(const [kind,selector] of [['audioinput','[data-mic-device]'],['videoinput','[data-camera-device]']]){const select=$call(selector);select.innerHTML='<option value="">Escolher dispositivo</option>'+devices.filter(d=>d.kind===kind).map((d,i)=>`<option value="${escape(d.deviceId)}">${escape(d.label||'Dispositivo '+(i+1))}</option>`).join('');}}}
      else if(button.matches('[data-redial]'))await startCall(session.state.peerId,session.state.peerName,session.state.video);
    }catch(error){$call('.comms-call-error').textContent=core.mediaError(error);}finally{actionBusy=false;}
  });
  for(const [selector,method] of [['[data-mic-device]','microphone'],['[data-camera-device]','camera']])$call(selector).addEventListener('change',async event=>{if(!event.target.value)return;try{await session[method](event.target.value);}catch(error){$call('.comms-call-error').textContent=core.mediaError(error);}});
  async function pollCalls(){
    if(callBusy)return;callBusy=true;
    try{
      const data=await request('call-poll',null,{after:String(signalCursor),active_call:session.active()?session.state.callId:''});
      for(const call of data.calls){
        if(call.call_id===session.state.callId){if(call.status==='accepted')session.accepted();else if(['ended','declined','missed'].includes(call.status))await session.end(call.status==='declined'?'O piloto recusou a chamada.':call.status==='missed'?'O piloto não atendeu.':'O outro piloto encerrou a chamada.');}
        else if(call.status==='ringing'&&Number(call.callee_id)===selfId&&!dismissedCalls.has(call.call_id)&&!session.active())session.invite(call);
      }
      for(const signal of data.signals){try{await session.handle(signal);signalCursor=Math.max(signalCursor,Number(signal.id));}catch(error){$call('.comms-call-error').textContent=core.mediaError(error);break;}}
    }catch(error){if(session.active())$call('.comms-call-error').textContent=error.message;}finally{callBusy=false;}
  }
  socket=window.createCallSocket?.({api,enabled:true,onEvent:()=>pollCalls()});
  setInterval(()=>{if(!document.hidden||session.active())pollCalls();},1300);
  setInterval(loadRoster,5500);setInterval(()=>loadMessages(),1700);
  setInterval(async()=>{
    const state=session.state;if(!state.startedAt)return;
    const elapsed=Math.max(0,Math.floor(((state.endedAt||Date.now())-state.startedAt)/1000));$call('[data-duration]').textContent=String(Math.floor(elapsed/60)).padStart(2,'0')+':'+String(elapsed%60).padStart(2,'0');
    if(state.phase!=='connected'||Date.now()-lastQuality<5000)return;lastQuality=Date.now();
    try{const stats=await session.pc.getStats();let rtt;stats.forEach(report=>{if(report.type==='candidate-pair'&&report.state==='succeeded'&&report.currentRoundTripTime!=null)rtt=report.currentRoundTripTime*1000;});$call('[data-quality]').textContent=rtt==null?'Conectado':rtt<180?'Conexão boa':rtt<450?'Conexão regular':'Conexão instável';}catch(_){}
  },1000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){pollCalls();loadRoster();loadMessages();}});window.addEventListener('focus',markRead);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(!hub.hidden)hideHub();else if(session.active())callPanel.classList.add('minimized');}});
  window.addEventListener('pagehide',()=>{if(session.state.callId)navigator.sendBeacon?.(api+'?action=call-end',new Blob([JSON.stringify({call_id:session.state.callId})],{type:'application/json'}));session.cleanup();socket?.close();});
  window.communications={startCall,openChat,open:showHub,hide:hideHub,isCalling:()=>session.active(),session,pollCalls};
  window.startPilotCall=startCall;
  configure().catch(()=>{});loadRoster();pollCalls();
})();
