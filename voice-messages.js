(() => {
  function setupVoiceMessages({ api, request, onStatus = () => {} }) {
    const css = document.createElement('style');
    css.textContent = `
      .voice-compose-overlay,.voice-inbox-overlay{position:fixed;inset:0;z-index:95;display:none;place-items:center;padding:18px;background:rgba(0,9,20,.84);backdrop-filter:blur(10px)}
      .voice-compose-overlay.open,.voice-inbox-overlay.open{display:grid}
      .voice-message-card{width:min(460px,96vw);padding:22px;background:linear-gradient(145deg,#0b2c45,#07192c 66%,#081c31);border:1px solid rgba(91,183,255,.65);box-shadow:0 20px 90px rgba(0,105,255,.25);color:#e5f3ff}
      .voice-message-kicker{color:#69baff;font:8px 'Space Mono';letter-spacing:.2em}
      .voice-message-title{margin:8px 0;color:#eff8ff;font:16px 'Space Mono'}
      .voice-message-copy{margin:0 0 14px;color:#9bb9d1;font-size:13px;line-height:1.5}
      .voice-message-status{min-height:18px;margin:9px 0;color:#90ccff;font:8px 'Space Mono'}
      .voice-message-card audio{width:100%;margin:7px 0}
      .voice-message-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}
      .voice-message-button{padding:10px 12px;border:1px solid rgba(107,190,255,.47);background:rgba(34,117,195,.22);color:#dff2ff;font:8px 'Space Mono';cursor:pointer}
      .voice-message-button.primary{border-color:#69baff;background:linear-gradient(120deg,#0878c8,#1456a0);box-shadow:0 0 18px rgba(39,152,255,.22)}
      .voice-message-button:disabled{opacity:.4;cursor:not-allowed}
      .voice-rec-indicator{display:inline-block;width:7px;height:7px;margin-right:7px;border-radius:50%;background:#ff6b7e;box-shadow:0 0 10px #ff6b7e}
      .social-action[data-audio-user]{color:#acd8ff;border-color:rgba(92,176,250,.48)}
      @media(max-width:600px){.voice-message-card{padding:17px}}
    `;
    document.head.appendChild(css);

    const compose = document.createElement('div');
    compose.className = 'voice-compose-overlay';
    compose.innerHTML = `<section class="voice-message-card" role="dialog" aria-modal="true" aria-labelledby="voiceComposeTitle">
      <div class="voice-message-kicker">MENSAGEM PRIVADA · CANAL DE ÁUDIO</div>
      <h2 class="voice-message-title" id="voiceComposeTitle">ENVIAR ÁUDIO</h2>
      <p class="voice-message-copy" id="voiceComposeCopy"></p>
      <div class="voice-message-status" id="voiceComposeStatus">Grave uma mensagem de até 30 segundos.</div>
      <audio id="voicePreview" controls hidden></audio>
      <div class="voice-message-actions"><button class="voice-message-button" id="voiceComposeCancel">CANCELAR</button><button class="voice-message-button" id="voiceRecordStart">GRAVAR</button><button class="voice-message-button" id="voiceRecordStop" hidden>PARAR</button><button class="voice-message-button primary" id="voiceSend" disabled>ENVIAR →</button></div>
    </section>`;
    document.body.appendChild(compose);

    const inbox = document.createElement('div');
    inbox.className = 'voice-inbox-overlay';
    inbox.innerHTML = `<section class="voice-message-card" role="dialog" aria-modal="true" aria-labelledby="voiceInboxTitle">
      <div class="voice-message-kicker"><span class="voice-rec-indicator"></span>MENSAGEM RECEBIDA</div>
      <h2 class="voice-message-title" id="voiceInboxTitle">NOVA MENSAGEM DE ÁUDIO</h2>
      <p class="voice-message-copy" id="voiceInboxCopy"></p>
      <div class="voice-message-status" id="voiceInboxStatus">Toque em ouvir para reproduzir a mensagem.</div>
      <audio id="voiceIncomingAudio" preload="none"></audio>
      <div class="voice-message-actions"><button class="voice-message-button" id="voiceInboxClose">FECHAR</button><button class="voice-message-button primary" id="voiceInboxListen">OUVIR ÁUDIO ▶</button></div>
    </section>`;
    document.body.appendChild(inbox);

    let target = null, recorder = null, stream = null, parts = [], recordingStarted = 0, recordedBlob = null, previewUrl = '', activeIncoming = null, pollBusy = false;
    const composeStatus = compose.querySelector('#voiceComposeStatus');
    const preview = compose.querySelector('#voicePreview');
    const startButton = compose.querySelector('#voiceRecordStart');
    const stopButton = compose.querySelector('#voiceRecordStop');
    const sendButton = compose.querySelector('#voiceSend');
    const cancelButton = compose.querySelector('#voiceComposeCancel');
    const incomingAudio = inbox.querySelector('#voiceIncomingAudio');

    function stopRecorderTracks() {
      if (stream) stream.getTracks().forEach(track => track.stop());
      stream = null;
      recorder = null;
    }

    function clearPreview() {
      preview.pause();
      preview.removeAttribute('src');
      preview.load();
      preview.hidden = true;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = '';
      recordedBlob = null;
    }

    function openRecorder(userId, name, channel = 'private') {
      target = { id: Number(userId)||0, name: String(name || 'PILOTO'), channel };
      compose.querySelector('.voice-message-kicker').textContent = channel==='station' ? 'INTERCOM / CANAL DA ESTACAO' : channel==='open' ? 'TRANSMISSAO DE RADIO / CANAL ABERTO' : 'MENSAGEM PRIVADA / CANAL DE AUDIO';
      compose.querySelector('#voiceComposeTitle').textContent = channel==='station' ? 'FALAR COM A ESTACAO' : channel==='open' ? 'AUDIO NO CANAL ABERTO' : 'AUDIO PARA ' + target.name.toUpperCase();
      compose.querySelector('#voiceComposeCopy').textContent = channel==='station' ? 'Grave uma mensagem para todos os jogadores que estao dentro desta estacao. Cada pessoa pode ouvir ou fechar.' : channel==='open' ? 'Enviaremos sua gravacao para as naves ativas num raio de 5.000 km. Cada piloto decide se quer ouvir ou fechar.' : 'Grave uma mensagem curta. Seu amigo recebera um aviso azul para ouvir ou fechar.';
      composeStatus.textContent = 'Grave uma mensagem de ate 30 segundos.';
      clearPreview(); startButton.hidden=false; startButton.disabled=false; stopButton.hidden=true; sendButton.disabled=true;
      compose.classList.add('open'); compose.setAttribute('aria-hidden','false');
    }

    async function startRecording() {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        composeStatus.textContent = 'Este navegador não oferece gravação de áudio.';
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(type => MediaRecorder.isTypeSupported(type));
        recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        parts = [];
        recorder.ondataavailable = event => { if (event.data?.size) parts.push(event.data); };
        recorder.onstop = () => {
          const duration = Math.min(30000, Math.max(1, Date.now() - recordingStarted));
          recordedBlob = new Blob(parts, { type: recorder?.mimeType || parts[0]?.type || 'audio/webm' });
          stopRecorderTracks();
          if (!recordedBlob.size) {
            composeStatus.textContent = 'A gravação ficou vazia. Tente novamente.';
            startButton.disabled = false;
            return;
          }
          if (recordedBlob.size > 4 * 1024 * 1024) {
            recordedBlob = null;
            composeStatus.textContent = 'O áudio passou de 4 MB. Grave uma mensagem mais curta.';
            startButton.disabled = false;
            return;
          }
          previewUrl = URL.createObjectURL(recordedBlob);
          preview.src = previewUrl;
          preview.hidden = false;
          composeStatus.textContent = `Áudio pronto · ${Math.ceil(duration / 1000)} s. Você pode ouvir antes de enviar.`;
          stopButton.hidden = true;
          startButton.hidden = false;
          startButton.disabled = false;
          sendButton.disabled = false;
          compose.dataset.duration = String(duration);
        };
        recordingStarted = Date.now();
        recorder.start(250);
        composeStatus.innerHTML = '<span class="voice-rec-indicator"></span>Gravando · limite de 30 segundos';
        startButton.hidden = true;
        stopButton.hidden = false;
        sendButton.disabled = true;
        const thisRecording = recorder;
        setTimeout(() => { if (thisRecording.state === 'recording') thisRecording.stop(); }, 30000);
      } catch (error) {
        stopRecorderTracks();
        composeStatus.textContent = 'Não foi possível acessar o microfone. Verifique a permissão do navegador.';
      }
    }

    function stopRecording() {
      if (recorder?.state === 'recording') recorder.stop();
      stopButton.hidden = true;
      startButton.hidden = false;
      startButton.disabled = true;
    }

    async function sendRecording() {
      if (!target || !recordedBlob) return;
      sendButton.disabled = true;
      composeStatus.textContent = 'Enviando mensagem…';
      try {
        const form = new FormData();
        if(target.channel==='open'||target.channel==='station')form.append('channel',target.channel);else form.append('user_id',String(target.id));
        form.append('duration_ms', compose.dataset.duration || '1');
        const extension = recordedBlob.type.includes('mp4') ? 'm4a' : recordedBlob.type.includes('ogg') ? 'ogg' : 'webm';
        form.append('audio', recordedBlob, 'mensagem.' + extension);
        const response = await fetch(api + '?action=voice-message-send', { method: 'POST', body: form, cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Não foi possível enviar o áudio.');
        const sentText = target.channel === 'station' ? `Aviso enviado para ${Number(data.recipients || 0)} pessoa(s) nesta estacao.` : target.channel === 'open' ? `Transmissao enviada para ${Number(data.recipients || 0)} nave(s) proximas.` : 'Mensagem enviada para ' + target.name + '.';
        composeStatus.textContent = sentText;
        onStatus(sentText);
        setTimeout(closeComposer, 1100);
      } catch (error) {
        composeStatus.textContent = error.message;
        sendButton.disabled = false;
      }
    }

    function closeComposer() {
      if (recorder?.state === 'recording') { recorder.onstop = null; recorder.stop(); }
      stopRecorderTracks();
      compose.classList.remove('open');
      compose.setAttribute('aria-hidden', 'true');
      clearPreview();
      target = null;
    }

    async function setIncomingStatus(status) {
      if (!activeIncoming) return;
      const id = activeIncoming.id;
      incomingAudio.pause();
      incomingAudio.removeAttribute('src');
      incomingAudio.load();
      try { await request('voice-message-status', { message_id: id, status }); } catch (error) {}
      activeIncoming = null;
      inbox.classList.remove('open');
      inbox.setAttribute('aria-hidden', 'true');
      pollInbox();
    }

    async function pollInbox() {
      if (pollBusy || activeIncoming) return;
      pollBusy = true;
      try {
        const data = await request('voice-message-poll');
        const message = (data.messages || [])[0];
        if (!message) return;
        activeIncoming = message;
        const isOpenChannel = message.channel_type === 'open', isStationChannel = message.channel_type === 'station';
        inbox.querySelector('.voice-message-kicker').innerHTML = isStationChannel ? '<span class="voice-rec-indicator"></span>INTERCOM DA ESTACAO' : isOpenChannel ? '<span class="voice-rec-indicator"></span>CANAL ABERTO - TRANSMISSAO PROXIMA' : '<span class="voice-rec-indicator"></span>MENSAGEM RECEBIDA';
        inbox.querySelector('#voiceInboxTitle').textContent = isStationChannel ? 'AUDIO NO INTERCOM' : isOpenChannel ? 'AUDIO PROXIMO' : 'NOVA MENSAGEM DE AUDIO';
        inbox.querySelector('#voiceInboxCopy').textContent = isStationChannel ? `${message.sender_name} falou para os jogadores nesta estacao (${Math.max(1, Math.ceil(Number(message.duration_ms) / 1000))} s).` : isOpenChannel ? `${message.sender_name} transmitiu no canal aberto (${Math.max(1, Math.ceil(Number(message.duration_ms) / 1000))} s). Escolha se deseja ouvir.` : `${message.sender_name} enviou uma mensagem de audio de aproximadamente ${Math.max(1, Math.ceil(Number(message.duration_ms) / 1000))} segundos.`;
        inbox.querySelector('#voiceInboxStatus').textContent = 'Toque em ouvir para reproduzir a mensagem.';
        incomingAudio.src = api + '?action=voice-message-audio&id=' + encodeURIComponent(message.id);
        inbox.classList.add('open');
        inbox.setAttribute('aria-hidden', 'false');
        onStatus(((isStationChannel ? 'Intercom da estacao de ' : isOpenChannel ? 'Transmissao de canal aberto de ' : 'Nova mensagem de audio de ')) + message.sender_name + '.');
        if (!isOpenChannel) {
          inbox.querySelector('#voiceInboxStatus').textContent = 'Tentando reproduzir automaticamente...';
          const playback = incomingAudio.play();
          if (playback?.then) playback.then(() => {
            if (activeIncoming?.id === message.id) inbox.querySelector('#voiceInboxStatus').textContent = 'Reproduzindo a mensagem recebida...';
          }).catch(() => {
            if (activeIncoming?.id === message.id) inbox.querySelector('#voiceInboxStatus').textContent = 'Reproducao automatica bloqueada. Toque em ouvir.';
          });
        }
      } catch (error) {
        // A caixa de entrada pode estar temporariamente sem conexão.
      } finally {
        pollBusy = false;
      }
    }

    startButton.addEventListener('click', startRecording);
    stopButton.addEventListener('click', stopRecording);
    sendButton.addEventListener('click', sendRecording);
    cancelButton.addEventListener('click', closeComposer);
    compose.addEventListener('click', event => { if (event.target === compose) closeComposer(); });
    inbox.querySelector('#voiceInboxListen').addEventListener('click', async () => {
      try {
        await incomingAudio.play();
        inbox.querySelector('#voiceInboxStatus').textContent = 'Reproduzindo mensagem…';
      } catch (error) {
        inbox.querySelector('#voiceInboxStatus').textContent = 'Não foi possível reproduzir. Tente novamente.';
      }
    });
    inbox.querySelector('#voiceInboxClose').addEventListener('click', () => setIncomingStatus('dismissed'));
    inbox.addEventListener('click', event => { if (event.target === inbox) setIncomingStatus('dismissed'); });
    incomingAudio.addEventListener('ended', () => setIncomingStatus('listened'));

    return { openRecorder, openOpenChannelRecorder:()=>openRecorder(0,'CANAL ABERTO','open'), openStationRecorder:()=>openRecorder(0,'INTERCOM DA ESTACAO','station'), pollInbox };
  }

  window.setupVoiceMessages = setupVoiceMessages;
})();
