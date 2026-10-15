(() => {
  let context = null;
  let timer = 0;
  let oscillators = [];
  function stop() {
    clearInterval(timer);
    timer = 0;
    for (const oscillator of oscillators) { try { oscillator.stop(); } catch (_) {} }
    oscillators = [];
    if (context) { context.close().catch(() => {}); context = null; }
  }
  function pulse() {
    if (!context || document.hidden) return;
    const start = context.currentTime;
    [0, 0.34].forEach((offset, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = index ? 660 : 520;
      gain.gain.setValueAtTime(0.0001, start + offset);
      gain.gain.exponentialRampToValueAtTime(0.12, start + offset + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.24);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start + offset);
      oscillator.stop(start + offset + 0.26);
      oscillators.push(oscillator);
      oscillator.onended = () => { oscillators = oscillators.filter(item => item !== oscillator); };
    });
  }
  function start() {
    stop();
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      context = new AudioContextClass();
      context.resume().catch(() => {});
      pulse();
      timer = setInterval(pulse, 1700);
    } catch (_) { stop(); }
  }
  window.naveCallRingtone = { start, stop };
})();