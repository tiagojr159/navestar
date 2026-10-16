(() => {
  'use strict';

  let bank = 0;
  let audioContext = null;
  let engineOscillator = null;
  let engineFilter = null;
  let engineGain = null;
  let enginePan = null;
  let activeStrafe = 0;

  function ensureAudio() {
    if (audioContext) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    audioContext = new AudioContextClass();
    engineOscillator = audioContext.createOscillator();
    engineFilter = audioContext.createBiquadFilter();
    engineGain = audioContext.createGain();
    enginePan = audioContext.createStereoPanner ? audioContext.createStereoPanner() : null;

    engineOscillator.type = 'sawtooth';
    engineOscillator.frequency.value = 66;
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 230;
    engineGain.gain.value = 0;

    engineOscillator.connect(engineFilter);
    if (enginePan) {
      engineFilter.connect(enginePan);
      enginePan.connect(engineGain);
    } else {
      engineFilter.connect(engineGain);
    }
    engineGain.connect(audioContext.destination);
    engineOscillator.start();
  }

  function setStrafe(side, powered = true) {
    const direction = powered ? Math.sign(Number(side) || 0) : 0;
    if (!direction && !audioContext) return;
    ensureAudio();
    if (!audioContext || !engineGain) return;
    if (direction === activeStrafe) return;
    activeStrafe = direction;

    const now = audioContext.currentTime;
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    const muted = window.gameAudio?.isMuted?.() === true;
    const masterVolume = Math.max(0, Math.min(1, Number(window.gameAudio?.getVolume?.() ?? 1)));
    engineGain.gain.cancelScheduledValues(now);
    engineGain.gain.setTargetAtTime(direction && !muted ? 0.025 * masterVolume : 0, now, direction ? 0.035 : 0.09);
    if (enginePan) enginePan.pan.setTargetAtTime(direction * 0.62, now, 0.04);
    engineOscillator.frequency.setTargetAtTime(direction ? 72 + Math.abs(Number(side) || 0) * 5 : 58, now, 0.06);
    engineFilter.frequency.setTargetAtTime(direction ? 310 : 180, now, 0.07);
  }

  function updateBank(side, dt) {
    const target = Math.max(-1, Math.min(1, Number(side) || 0)) * 0.23;
    bank += (target - bank) * Math.min(1, Math.max(0, Number(dt) || 0) * 0.16);
    if (Math.abs(bank) < 0.002 && !target) bank = 0;
    return bank;
  }

  function drawJet(ctx, x, y, length, width, directionX, directionY, hue, phase) {
    const pulse = 0.78 + 0.22 * Math.sin(phase);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = pulse;
    ctx.shadowColor = hue;
    ctx.shadowBlur = 16;
    const directionLength = Math.hypot(Number(directionX) || 0, Number(directionY) || 0) || 1;
    const dx = (Number(directionX) || 0) / directionLength;
    const dy = (Number(directionY) || 0) / directionLength;
    const endX = x + dx * length;
    const endY = y + dy * length;
    const gradient = ctx.createLinearGradient(x, y, endX, endY);
    gradient.addColorStop(0, 'rgba(240,255,255,.96)');
    gradient.addColorStop(0.24, hue);
    gradient.addColorStop(1, 'rgba(35,126,255,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    const px = -dy * width * 0.5;
    const py = dx * width * 0.5;
    ctx.moveTo(x + px, y + py);
    ctx.lineTo(endX, endY);
    ctx.lineTo(x - px, y - py);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawThrusters(ctx, options = {}) {
    const { width = 512, height = 256, speed = 0, forward = false, strafe = 0, now = 0, ports = [] } = options;
    const powered = Number(speed) > 0.08 || forward;
    const intensity = Math.max(0.18, Math.min(1, Math.abs(Number(speed) || 0) / 5 + (forward ? 0.24 : 0)));
    const pulse = now * 0.025;

    if (powered) {
      ports.forEach((port, index) => {
        const length = (22 + 34 * intensity) * (0.76 + 0.24 * Math.sin(pulse + index * 1.7));
        const width = Math.max(5, Math.min(18, (Number(port.r) || 0.5) * 12 + intensity * 4));
        const color = port.color === 'redlight' ? '#ff5362' : port.color === 'amber' ? '#ffc26f' : '#4edbff';
        drawJet(ctx, port.x, port.y, length, width, port.dx, port.dy, color, pulse + index);
      });
    }

    const side = Math.sign(Number(strafe) || 0);
    if (side) {
      // Lateral jets push opposite the direction of travel.
      const nozzleX = width * (side < 0 ? 0.70 : 0.30);
      const nozzleY = height * 0.60;
      drawJet(ctx, nozzleX, nozzleY, width * 0.12, 8, -side, 0, '#ffbd70', pulse + 2.4);
    }
  }

  window.shipFlightEffects = { setStrafe, updateBank, drawThrusters };
})();
