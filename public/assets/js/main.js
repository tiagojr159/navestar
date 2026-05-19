import { RoomScene } from './scene/RoomScene.js';
import { HudPanel } from './hud/HudPanel.js';
import { CelestialMenu } from './hud/CelestialMenu.js';

const canvas = document.querySelector('[data-scene-canvas]');
const lockButton = document.querySelector('[data-lock-control]');
const resetButton = document.querySelector('[data-reset-control]');
const dockButton = document.querySelector('[data-dock-control]');
const startStateRaw = canvas?.dataset?.startState ?? null;
const shipFramesRaw = canvas?.dataset?.shipFrames ?? null;
const playerShipModel = canvas?.dataset?.shipModel ?? '';
const playerShipAsset = canvas?.dataset?.shipAsset ?? '';
let startState = null;
let playerShipFrames = null;
try {
    startState = startStateRaw ? JSON.parse(startStateRaw) : null;
} catch {
    startState = null;
}
try {
    playerShipFrames = shipFramesRaw ? JSON.parse(shipFramesRaw) : null;
} catch {
    playerShipFrames = null;
}

const hud = new HudPanel({
    mapCanvas: document.querySelector('[data-hud-map]'),
    speedEl: document.querySelector('[data-hud-speed]'),
    posEl: document.querySelector('[data-hud-pos]'),
    limitEl: document.querySelector('[data-hud-limit]'),
    targetEl: document.querySelector('[data-hud-target]'),
    proximityRoot: document.querySelector('[data-proximity]'),
    proximityName: document.querySelector('[data-proximity-name]'),
    proximityDist: document.querySelector('[data-proximity-dist]'),
    guideCanvas: document.querySelector('[data-hud-guide]'),
});

const celestialMenu = new CelestialMenu({
    root: document.querySelector('[data-celestial]'),
    openButton: document.querySelector('[data-celestial-open]'),
    closeButton: document.querySelector('[data-celestial-close]'),
});

const infoDrawer = document.querySelector('[data-info-drawer]');
const infoTitle = document.querySelector('[data-info-title]');
const infoClose = document.querySelector('[data-info-close]');
const infoContentPanels = [...document.querySelectorAll('[data-info-content]')];

const infoTitles = {
    friends: 'Amigos',
    ships: 'Naves',
    profile: 'Perfil',
};

for (const button of document.querySelectorAll('[data-info-open]')) {
    button.addEventListener('click', () => {
        const key = button.dataset.infoOpen;
        infoTitle.textContent = infoTitles[key] ?? 'Informacoes';
        for (const panel of infoContentPanels) {
            panel.hidden = panel.dataset.infoContent !== key;
        }
        infoDrawer.hidden = false;
    });
}

infoClose.addEventListener('click', () => {
    infoDrawer.hidden = true;
});

const universeScene = new RoomScene({
    canvas,
    lockButton,
    resetButton,
    dockButton,
    presenceUrl: 'api/presence.php',
    startState,
    playerShipFrames,
    playerShipModel,
    playerShipAsset,
    hud,
    celestialMenu,
});

universeScene.start();
