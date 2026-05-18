export const STAR_COUNT = 14000;
export const ASSET_ROOT = 'images/';
export const FIRE_RANGE = 18000;
export const FIRE_COOLDOWN = 0.18;
export const DOCK_RANGE = 5200;
export const DOCK_OFFSET_FACTOR = 1.65;
export const UNDOCK_PUSH = 1800;
export const SHIP_VISUAL_PIXEL_LIMIT = 100;
export const MOON_ORBIT_SPEED_MULT = 0.25;

export const DEEP_SPACE_BACKDROPS = [
    { image: 'universo.jpg', position: [-225000, 76000, -350000], scale: [112000, 78000], opacity: 0.62 },
    { image: 'universo2.png', position: [238000, -22000, -312000], scale: [94000, 72000], opacity: 0.72 },
    { image: 'nebulosa1.png', position: [-250000, -54000, 118000], scale: [78000, 96000], opacity: 0.68 },
    { image: 'nebulosa2.png', position: [188000, 92000, 236000], scale: [98000, 98000], opacity: 0.58 },
    { image: 'nebulosa3.png', position: [-94000, 118000, 284000], scale: [88000, 64000], opacity: 0.55 },
];

export const ARTIFICIAL_OBJECTS = [
    { kind: 'satellite', name: 'Satelite Mercurio 01', image: 'sonda.png', near: 'Mercurio', offset: [1700, 520, -900], scale: [1050, 1050], health: 4 },
    { kind: 'satellite', name: 'Satelite Venus 01', image: 'sonda.png', near: 'Venus', offset: [-1900, 820, 1200], scale: [1050, 1050], health: 4 },
    { kind: 'satellite', name: 'Satelite Terra 01', image: 'sonda.png', near: 'Terra', offset: [2100, 700, 1500], scale: [1100, 1100], health: 4 },
    { kind: 'satellite', name: 'Satelite Terra 02', image: 'sonda.png', near: 'Terra', offset: [-2600, 1320, -1700], scale: [980, 980], health: 4 },
    { kind: 'satellite', name: 'Satelite Marte 01', image: 'sonda.png', near: 'Marte', offset: [1900, 820, -1900], scale: [980, 980], health: 4 },
    { kind: 'satellite', name: 'Satelite Jupiter 01', image: 'sonda.png', near: 'Jupiter', offset: [3300, 1150, 2200], scale: [1200, 1200], health: 5 },
    { kind: 'satellite', name: 'Satelite Jupiter 02', image: 'sonda.png', near: 'Jupiter', offset: [-3900, 920, -2600], scale: [1200, 1200], health: 5 },
    { kind: 'satellite', name: 'Satelite Saturno 01', image: 'sonda.png', near: 'Saturno', offset: [3200, 1240, -1800], scale: [1150, 1150], health: 5 },
    { kind: 'satellite', name: 'Satelite Urano 01', image: 'sonda.png', near: 'Urano', offset: [-2400, 980, 2100], scale: [1050, 1050], health: 4 },
    { kind: 'satellite', name: 'Satelite Netuno 01', image: 'sonda.png', near: 'Netuno', offset: [2700, 870, -2400], scale: [1050, 1050], health: 4 },
    { kind: 'cargo', name: 'Nave de carga Terra 01', image: 'navecarga.png', near: 'Terra', offset: [-5200, 900, 3300], scale: [1900, 1120], drift: [16, 0, -10] },
    { kind: 'cargo', name: 'Nave de carga Terra 02', image: 'navecarga.png', near: 'Terra', offset: [6400, 1120, -3800], scale: [2000, 1160], drift: [-14, 0, 8] },
    { kind: 'cargo', name: 'Nave de carga Marte 01', image: 'navecarga.png', near: 'Marte', offset: [5200, 760, 2900], scale: [1820, 1080], drift: [-12, 0, -15] },
    { kind: 'cargo', name: 'Nave de carga Marte 02', image: 'navecarga.png', near: 'Marte', offset: [-6100, 880, -3400], scale: [1860, 1100], drift: [12, 0, 11] },
    { kind: 'cargo', name: 'Nave de carga Jupiter 01', image: 'navecarga.png', near: 'Jupiter', offset: [-6200, 1180, 4400], scale: [2100, 1240], drift: [10, 0, 12] },
    { kind: 'cargo', name: 'Nave de carga Jupiter 02', image: 'navecarga.png', near: 'Jupiter', offset: [7400, 1340, -5200], scale: [2140, 1260], drift: [-8, 0, 14] },
    { kind: 'cargo', name: 'Nave de carga Saturno 01', image: 'navecarga.png', near: 'Saturno', offset: [6600, 1080, 3600], scale: [2100, 1240], drift: [-11, 0, 14] },
    { kind: 'cargo', name: 'Nave de carga Saturno 02', image: 'navecarga.png', near: 'Saturno', offset: [-7800, 980, -4500], scale: [2080, 1220], drift: [9, 0, -12] },
    { kind: 'cargo', name: 'Nave de carga Urano 01', image: 'navecarga.png', near: 'Urano', offset: [5800, 920, 3100], scale: [1960, 1140], drift: [-10, 0, 9] },
    { kind: 'cargo', name: 'Nave de carga Netuno 01', image: 'navecarga.png', near: 'Netuno', offset: [-6400, 950, 4200], scale: [1980, 1150], drift: [11, 0, -9] },
    { kind: 'station', name: 'Estacao Terra', image: 'estacao.png', near: 'Terra', offset: [4800, 620, -4700], scale: [2400, 2400] },
    { kind: 'station', name: 'Estacao Jupiter', image: 'estacao.png', near: 'Jupiter', offset: [7600, 1400, -5600], scale: [2800, 2800] },
    { kind: 'station', name: 'Estacao Saturno', image: 'estacao.png', near: 'Saturno', offset: [-7400, 1250, 5200], scale: [2700, 2700] },
];
