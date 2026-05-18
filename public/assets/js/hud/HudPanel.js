import * as THREE from 'three';
import { UNIVERSE_HALF, UNIVERSE_SIZE } from '../scene/CelestialData.js';

export class HudPanel {
    constructor({ mapCanvas, speedEl, posEl, limitEl, targetEl, proximityRoot, proximityName, proximityDist, guideCanvas }) {
        this.mapCanvas = mapCanvas;
        this.context = mapCanvas.getContext('2d');
        this.speedEl = speedEl;
        this.posEl = posEl;
        this.limitEl = limitEl;
        this.targetEl = targetEl;
        this.proximityRoot = proximityRoot;
        this.proximityName = proximityName;
        this.proximityDist = proximityDist;
        this.guideCanvas = guideCanvas;
        this.guideContext = guideCanvas.getContext('2d');

        this.limitEl.textContent = String(UNIVERSE_SIZE);
        this.lastTarget = '--';
        this.bodies = [];
        this.camera = null;
        this.autopilotTarget = null;
    }

    setBodies(bodies) {
        this.bodies = Array.isArray(bodies) ? bodies : [];
    }

    setCamera(camera) {
        this.camera = camera;
    }

    setAutopilotTarget(targetBody) {
        this.autopilotTarget = targetBody;
    }

    resize(width, height) {
        this.guideCanvas.width = Math.max(1, Math.floor(width));
        this.guideCanvas.height = Math.max(1, Math.floor(height));
    }

    update({ shipPosition, shipSpeed }) {
        this.speedEl.textContent = `${Math.round(shipSpeed)} u/s`;
        this.posEl.textContent = `${fmt(shipPosition.x)},${fmt(shipPosition.y)},${fmt(shipPosition.z)}`;

        const nearest = findNearestBody(shipPosition, this.bodies);
        if (nearest && nearest.name !== this.lastTarget) {
            this.lastTarget = nearest.name;
            this.targetEl.textContent = nearest.name;
        }

        this.updateProximity(shipPosition);
        this.drawGuideLine(shipPosition);
        this.drawMap(shipPosition);
    }

    updateProximity(shipPosition) {
        if (!this.proximityRoot || !this.bodies || this.bodies.length === 0) return;

        let best = null;
        let bestDist = Infinity;

        for (const body of this.bodies) {
            const dx = shipPosition.x - body.x;
            const dy = shipPosition.y - body.y;
            const dz = shipPosition.z - body.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) - body.r;
            if (dist < bestDist) {
                bestDist = dist;
                best = body;
            }
        }

        const threshold = 9000; // "dobro" do alcance de aproximacao
        const near = best && bestDist < threshold;

        this.proximityRoot.hidden = !near;
        if (!near) return;

        this.proximityName.textContent = best.name;
        this.proximityDist.textContent = `${Math.max(0, Math.round(bestDist))} u`;
    }

    drawGuideLine(shipPosition) {
        const ctx = this.guideContext;
        const canvas = this.guideCanvas;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!this.camera || !this.autopilotTarget) return;

        const target = this.autopilotTarget;
        const vector = this.projectToScreen(target.x, target.y, target.z, canvas.width, canvas.height);
        if (!vector) return;

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.strokeStyle = 'rgba(79, 224, 194, 0.65)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(vector.x, vector.y);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 0, 200, 0.65)';
        ctx.beginPath();
        ctx.arc(vector.x, vector.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    projectToScreen(x, y, z, width, height) {
        const v = new THREE.Vector3(x, y, z);
        v.project(this.camera);
        if (v.z < -1 || v.z > 1) return null;
        return {
            x: (v.x * 0.5 + 0.5) * width,
            y: (-v.y * 0.5 + 0.5) * height,
        };
    }

    drawMap(shipPosition) {
        const { context, mapCanvas } = this;
        const width = mapCanvas.width;
        const height = mapCanvas.height;
        context.clearRect(0, 0, width, height);

        context.fillStyle = 'rgba(2, 6, 10, 0.65)';
        context.fillRect(0, 0, width, height);

        // Grid
        context.strokeStyle = 'rgba(79, 224, 194, 0.14)';
        context.lineWidth = 1;
        for (let x = 20; x < width; x += 40) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, height);
            context.stroke();
        }
        for (let y = 20; y < height; y += 40) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(width, y);
            context.stroke();
        }

        // Bounds
        context.strokeStyle = 'rgba(255, 0, 200, 0.28)';
        context.strokeRect(6, 6, width - 12, height - 12);

        // Corpos e objetos artificiais (top-down XZ)
        for (const body of this.bodies) {
            if (body.type === 'star') continue;
            const p = projectXZ(body.x, body.z, width, height);
            context.fillStyle = bodyColor(body.type);
            context.beginPath();
            context.arc(p.x, p.y, body.type === 'planet' ? 3.3 : 2.5, 0, Math.PI * 2);
            context.fill();
        }

        // Ship
        const ship = projectXZ(shipPosition.x, shipPosition.z, width, height);
        context.fillStyle = 'rgba(255, 255, 255, 0.92)';
        context.beginPath();
        context.arc(ship.x, ship.y, 4.2, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = 'rgba(0, 255, 240, 0.6)';
        context.beginPath();
        context.arc(ship.x, ship.y, 10.5, 0, Math.PI * 2);
        context.stroke();
    }
}

function projectXZ(x, z, width, height) {
    const nx = (x + UNIVERSE_HALF) / UNIVERSE_SIZE;
    const nz = (z + UNIVERSE_HALF) / UNIVERSE_SIZE;
    return {
        x: clamp(8 + nx * (width - 16), 8, width - 8),
        y: clamp(8 + nz * (height - 16), 8, height - 8),
    };
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function fmt(value) {
    return Math.round(value).toString();
}

function bodyColor(type) {
    if (type === 'satellite') return 'rgba(255, 216, 89, 0.82)';
    if (type === 'cargo') return 'rgba(255, 133, 84, 0.78)';
    if (type === 'station') return 'rgba(255, 0, 200, 0.72)';
    if (type === 'remote') return 'rgba(255, 255, 255, 0.9)';
    if (type === 'moon') return 'rgba(190, 205, 214, 0.66)';
    return 'rgba(79, 224, 194, 0.75)';
}

function findNearestBody(position, bodies) {
    let best = null;
    let bestDistSq = Infinity;

    for (const body of bodies) {
        if (body.type === 'star') continue;
        const dx = position.x - body.x;
        const dy = position.y - body.y;
        const dz = position.z - body.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < bestDistSq) {
            bestDistSq = distSq;
            best = body;
        }
    }

    return best;
}
