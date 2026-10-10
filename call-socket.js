(() => {
  window.createCallSocket = function ({ api, enabled, onEvent = () => {}, onStatus = () => {} }) {
    let socket = null, retry = 1000, closed = false, retryTimer = null, heartbeat = null;
    const connected = () => socket?.readyState === WebSocket.OPEN;
    async function connect() {
      if (!enabled || closed || !('WebSocket' in window)) return;
      try {
        const response = await fetch(`${api}?action=call-socket-token`, { credentials: 'same-origin', cache: 'no-store' });
        const data = await response.json(); if (!response.ok || !data.token) throw new Error(data.error || 'Token do socket indisponível.');
        const scheme = location.protocol === 'https:' ? 'wss:' : 'ws:';
        socket = new WebSocket(`${scheme}//${location.hostname}:8090/`, ['nave-call-v1', `auth.${data.token}`]);
        socket.onopen = () => { retry = 1000; onStatus(true); heartbeat = setInterval(() => { if (connected()) socket.send(JSON.stringify({type:'heartbeat'})); }, 20000); };
        socket.onmessage = event => { try { onEvent(JSON.parse(event.data)); } catch (_) {} };
        socket.onerror = () => onStatus(false);
        socket.onclose = () => { clearInterval(heartbeat); onStatus(false); if (!closed) { retryTimer = setTimeout(connect, retry); retry = Math.min(15000, retry * 1.8); } };
      } catch (_) { onStatus(false); if (!closed) { retryTimer = setTimeout(connect, retry); retry = Math.min(15000, retry * 1.8); } }
    }
    connect();
    return {
      isConnected: connected,
      send(message) { if (connected()) socket.send(JSON.stringify(message)); return connected(); },
      ring(callId) { return this.send({type:'ring',callId}); },
      notify(callId) { return this.send({type:'state',callId}); },
      signal(callId,signalType,payload) { return this.send({type:'signal',callId,signalType,payload}); },
      close() { closed = true; clearTimeout(retryTimer); clearInterval(heartbeat); socket?.close(); }
    };
  };
})();
