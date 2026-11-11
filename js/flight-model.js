/* Shared, frame-rate independent flight and aiming calculations. */
(function (root) {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const weapons = Object.freeze({
    pulse: { interval: 180, range: 25000, color: '#75edff' },
    ion: { interval: 320, range: 25000, color: '#a6afff' },
    heavy: { interval: 650, range: 25000, color: '#ffb474' },
    singularity: { interval: 1100, range: 25000, color: '#eb9aff' }
  });
  function forward(yaw, pitch = 0) {
    return { x: Math.sin(yaw) * Math.cos(pitch), y: Math.sin(pitch), z: -Math.cos(yaw) * Math.cos(pitch) };
  }
  function deadzone(value, size = .1) {
    return Math.abs(value) <= size ? 0 : Math.sign(value) * clamp((Math.abs(value) - size) / (1 - size), 0, 1);
  }
  function aim(origin, direction, target, radius = 45, assist = .045, range = 25000) {
    const x = target.x - origin.x, y = (target.y || 0) - origin.y, z = target.z - origin.z;
    const distance = Math.hypot(x, y, z), depth = x * direction.x + y * direction.y + z * direction.z;
    const miss = Math.sqrt(Math.max(0, distance * distance - depth * depth));
    return { distance, depth, miss, hit: depth > 0 && distance <= range && miss <= radius + depth * assist };
  }
  function step(state, input, seconds) {
    const dt = clamp(seconds, 0, .05), steering = 1 - Math.exp(-12 * dt);
    state.turn += (clamp(input.yaw, -1, 1) - state.turn) * steering;
    state.lift += (clamp(input.pitch, -1, 1) - state.lift) * steering;
    if (state.boost <= 0) state.boostLocked = true;
    if (state.boost >= 25) state.boostLocked = false;
    const boosting = input.boost && !state.boostLocked && state.boost > 0 && input.fuel;
    state.boost = clamp(state.boost + (boosting ? -30 : 17) * dt, 0, 100);
    const cap = input.fuel ? (boosting ? 50 : 30) : .35;
    if (input.brake) state.speed = Math.max(0, state.speed - 65 * dt);
    else if (input.throttle) state.speed = clamp(state.speed + input.throttle * 24 * dt, 0, cap);
    else if (state.speed > cap) state.speed = Math.max(cap, state.speed - 20 * dt);
    if (boosting && !input.brake) state.speed = Math.min(cap, state.speed + 36 * dt);
    // Lower turn rate at boost speed makes braking useful in a dogfight.
    const rate = 1.65 * (boosting ? .65 : 1);
    state.yaw += state.turn * rate * dt;
    state.pitch = clamp(state.pitch + state.lift * rate * dt, -1.35, 1.35);
    const dir = forward(state.yaw, state.pitch), strafe = clamp(input.strafe, -1, 1) * (input.fuel ? 13 : .2);
    return { x: (dir.x * state.speed + Math.cos(state.yaw) * strafe) * 60 * dt,
      y: dir.y * state.speed * 60 * dt,
      z: (dir.z * state.speed + Math.sin(state.yaw) * strafe) * 60 * dt, boosting };
  }
  const api = { clamp, weapons, forward, deadzone, aim, step };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.NaveStarFlight = api;
})(typeof window !== 'undefined' ? window : globalThis);
