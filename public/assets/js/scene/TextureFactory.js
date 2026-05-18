import * as THREE from 'three';

const TEXTURE_SIZE = 512;

export function createPlanetTexture({ colors, texture }) {
    const canvas = document.createElement('canvas');
    canvas.width = TEXTURE_SIZE;
    canvas.height = TEXTURE_SIZE;

    const context = canvas.getContext('2d');
    const palette = colors.map((color) => new THREE.Color(color));

    for (let y = 0; y < TEXTURE_SIZE; y += 1) {
        for (let x = 0; x < TEXTURE_SIZE; x += 1) {
            const u = x / TEXTURE_SIZE;
            const v = y / TEXTURE_SIZE;
            const noise = layeredNoise(u, v);
            const band = Math.sin(v * Math.PI * (texture === 'bands' ? 28 : 9) + noise * 4);
            const cloud = Math.sin((u + noise * 0.25) * Math.PI * 10) * 0.5 + 0.5;
            const color = pickColor(palette, band, cloud, texture);

            const shade = 0.78 + noise * 0.34;
            context.fillStyle = color.multiplyScalar(shade).getStyle();
            context.fillRect(x, y, 1, 1);
        }
    }

    if (texture === 'earth') {
        drawEarthDetails(context);
    }

    if (texture === 'rock') {
        drawRockDetails(context);
    }

    const canvasTexture = new THREE.CanvasTexture(canvas);
    canvasTexture.colorSpace = THREE.SRGBColorSpace;
    canvasTexture.anisotropy = 8;
    return canvasTexture;
}

export function createSunTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = TEXTURE_SIZE;
    canvas.height = TEXTURE_SIZE;

    const context = canvas.getContext('2d');

    for (let y = 0; y < TEXTURE_SIZE; y += 1) {
        for (let x = 0; x < TEXTURE_SIZE; x += 1) {
            const u = x / TEXTURE_SIZE;
            const v = y / TEXTURE_SIZE;
            const noise = layeredNoise(u * 2, v * 2);
            const heat = 0.55 + noise * 0.45 + Math.sin((u + v) * 30) * 0.08;
            const red = Math.round(255);
            const green = Math.round(125 + heat * 100);
            const blue = Math.round(25 + heat * 50);
            context.fillStyle = `rgb(${red}, ${green}, ${blue})`;
            context.fillRect(x, y, 1, 1);
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
}

export function createLabelTexture(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;

    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgba(2, 6, 10, 0.62)';
    roundRect(context, 28, 28, 456, 104, 12);
    context.fill();
    context.strokeStyle = 'rgba(255, 255, 255, 0.24)';
    context.lineWidth = 3;
    context.stroke();

    context.fillStyle = '#f4f8fb';
    context.font = '700 48px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 256, 82);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function pickColor(palette, band, cloud, texture) {
    if (texture === 'bands') {
        return palette[Math.abs(Math.floor((band + 1) * palette.length)) % palette.length].clone();
    }

    if (texture === 'cloud') {
        return palette[cloud > 0.55 ? 1 : band > 0 ? 0 : 2].clone();
    }

    if (texture === 'ice') {
        return palette[band > 0.2 ? 1 : cloud > 0.48 ? 0 : 2].clone();
    }

    return palette[band + cloud > 0.9 ? 1 : band > 0 ? 0 : 2].clone();
}

function drawEarthDetails(context) {
    context.globalAlpha = 0.72;
    context.fillStyle = '#f4f1df';

    for (let i = 0; i < 34; i += 1) {
        const x = (Math.sin(i * 17.3) * 0.5 + 0.5) * TEXTURE_SIZE;
        const y = (Math.cos(i * 9.1) * 0.5 + 0.5) * TEXTURE_SIZE;
        const width = 42 + (i % 5) * 16;
        const height = 12 + (i % 4) * 9;

        context.beginPath();
        context.ellipse(x, y, width, height, i * 0.6, 0, Math.PI * 2);
        context.fill();
    }

    context.globalAlpha = 1;
}

function drawRockDetails(context) {
    // Adds crater/speckle detail so moons/rocky bodies read better at distance.
    context.save();

    // Fine speckle noise
    context.globalAlpha = 0.22;
    for (let i = 0; i < 2200; i += 1) {
        const x = fract(Math.sin(i * 91.17) * 10000) * TEXTURE_SIZE;
        const y = fract(Math.sin(i * 37.91 + 4.2) * 10000) * TEXTURE_SIZE;
        const s = 1 + (i % 3);
        context.fillStyle = i % 7 === 0 ? 'rgba(10,12,14,1)' : 'rgba(245,248,252,1)';
        context.fillRect(x, y, s, s);
    }

    // Craters
    context.globalAlpha = 0.55;
    for (let i = 0; i < 120; i += 1) {
        const x = fract(Math.sin(i * 13.37) * 10000) * TEXTURE_SIZE;
        const y = fract(Math.sin(i * 23.73 + 1.9) * 10000) * TEXTURE_SIZE;
        const r = 6 + (i % 14) * 2;
        const gradient = context.createRadialGradient(x, y, 0, x, y, r);
        gradient.addColorStop(0, 'rgba(255,255,255,0.55)');
        gradient.addColorStop(0.35, 'rgba(255,255,255,0.08)');
        gradient.addColorStop(0.65, 'rgba(0,0,0,0.22)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(x, y, r, 0, Math.PI * 2);
        context.fill();
    }

    context.restore();
}

function layeredNoise(x, y) {
    return (
        valueNoise(x * 3.1, y * 3.1) * 0.5
        + valueNoise(x * 9.4 + 8.1, y * 8.6) * 0.3
        + valueNoise(x * 21.8, y * 17.2 + 3.4) * 0.2
    );
}

function valueNoise(x, y) {
    return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
}

function fract(value) {
    return value - Math.floor(value);
}

function roundRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
}
