(() => {
  'use strict';

  const sounds = {
    laser: ['laser_shot.ogg', 0.34, 105],
    laserHeavy: ['laser_heavy.ogg', 0.42, 180],
    laserPulse: ['laser_pulse.ogg', 0.3, 130],
    explosion: ['explosion_ship.ogg', 0.52, 500],
    impact: ['metal_impact.ogg', 0.32, 120],
    engine: ['engine_cruise.ogg', 0.16, 700],
    engineHeavy: ['engine_heavy.ogg', 0.2, 700],
    thrust: ['thruster_burst.ogg', 0.24, 250],
    mining: ['mining_beam.ogg', 0.2, 750],
    miningDone: ['mining_complete.ogg', 0.35, 250],
    dock: ['dock_clamp.ogg', 0.32, 350],
    undock: ['undock_release.ogg', 0.3, 350],
    trade: ['trade_offer.ogg', 0.22, 300],
    tradeDone: ['trade_confirm.ogg', 0.25, 350],
    select: ['ui_select.ogg', 0.2, 90],
    confirm: ['ui_confirm.ogg', 0.25, 120],
    pickup: ['pickup_cargo.ogg', 0.28, 200],
    mission: ['mission_accept.ogg', 0.25, 350],
    missionDone: ['mission_complete.ogg', 0.24, 500],
    shield: ['shield_hit.ogg', 0.32, 150],
    drill: ['mining_drill.ogg', 0.22, 600]
  };
  const lastPlayed = new Map();
  const pool = new Map();
  let muted = localStorage.getItem('nave:sfx-muted') === '1';
  let masterVolume = Math.max(0, Math.min(1, Number(localStorage.getItem('nave:sfx-volume') ?? 0.72)));

  function play(name, options = {}) {
    const sound = sounds[name];
    if (!sound || muted || masterVolume <= 0) return;
    const now = performance.now();
    const cooldown = options.force ? 0 : sound[2];
    if (now - (lastPlayed.get(name) || 0) < cooldown) return;
    lastPlayed.set(name, now);
    let audioPool = pool.get(name);
    if (!audioPool) {
      const url = new URL('assets/audio/sfx/' + sound[0], document.baseURI).href;
      audioPool = [new Audio(url), new Audio(url)];
      audioPool.forEach(audio => { audio.preload = 'none'; });
      pool.set(name, audioPool);
    }
    const audio = audioPool.find(item => item.paused || item.ended) || audioPool[0];
    audio.volume = Math.max(0, Math.min(1, masterVolume * sound[1] * (options.volume ?? 1)));
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  function setMuted(value) {
    muted = !!value;
    localStorage.setItem('nave:sfx-muted', muted ? '1' : '0');
    return muted;
  }

  function setVolume(value) {
    masterVolume = Math.max(0, Math.min(1, Number(value) || 0));
    localStorage.setItem('nave:sfx-volume', String(masterVolume));
    return masterVolume;
  }

  window.gameAudio = { play, setMuted, setVolume, isMuted: () => muted, getVolume: () => masterVolume };

  document.addEventListener('click', event => {
    const target = event.target.closest('button, [role="button"]');
    if (!target || target.disabled) return;
    const id = target.id || '';
    if (id === 'fireWeapon') play('laser');
    else if (id === 'mineButton') play(target.textContent.includes('INTERROMPER') ? 'select' : 'drill');
    else if (id === 'dockButton' || id === 'stationMarketButton' || id === 'crewUndock' || id === 'crewBadgeExit') play(id.includes('Undock') || id === 'crewBadgeExit' ? 'undock' : 'dock');
    else if (id === 'stationAttackButton') play('laserHeavy');
    else if (id === 'buyAmmo' || id === 'buyCannon' || id === 'buyUpgrade' || id === 'buyIon' || id === 'buyHeavy' || id === 'buySingularity' || target.hasAttribute('data-refuel')) play('confirm');
    else if (id === 'crewContactTrade' || id === 'crewTradeSave') play('trade');
    else if (id === 'crewTradeLock') play('tradeDone');
    else if (id === 'crewTradeCancel') play('select');
    else if (id === 'crewIntercom' || id === 'crewBadgeOpen') play('select');
    else if (id === 'missionNavigate' || id === 'missionStep') play('confirm');
    else if (id === 'missionCancel') play('select');
    else if (target.closest('.mission-card') && target.classList.contains('mission-action')) play('mission');
    else if (id === 'cargoJettisonButton' || id === 'jettisonConfirm') play('trade');
    else if (id === 'wreckCollect') play('pickup');
    else if (target.matches('#bankDeposit, #bankWithdraw, #sellIronButton, [data-book-passage]')) play('tradeDone');
    else if (id === 'routeGo' || id === 'orbit') play('engine');
    else if (target.closest('.station-screen') || target.closest('.station-overlay')) play('select');
  }, true);

  document.addEventListener('keydown', event => {
    if (event.repeat) return;
    if (event.code === 'Space') play('laser');
    else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') play('engineHeavy');
    else if (['KeyW', 'ArrowUp', 'KeyS', 'ArrowDown', 'KeyA', 'ArrowLeft', 'KeyD', 'ArrowRight'].includes(event.code)) play('thrust');
  }, true);
})();
