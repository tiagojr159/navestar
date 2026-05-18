export const UNIVERSE_SIZE = 300000;
export const UNIVERSE_HALF = UNIVERSE_SIZE / 2;

export const SUN = {
    name: 'Sol',
    // Fica fora da area navegavel (UNIVERSE_HALF), mas ainda visivel.
    position: [0, 0, -(UNIVERSE_HALF + 20000)],
    radius: 5200,
    color: '#ffcc58',
};

export const PLANETS = [
    {
        name: 'Mercurio',
        radius: 350,
        position: [12000, 0, -142000],
        colors: ['#5f5b54', '#9f9485', '#2f2d2a'],
        atmosphere: '#b7b0a5',
        texture: 'rock',
        rotationSpeed: 0.035,
    },
    {
        name: 'Venus',
        radius: 350,
        position: [-22000, 0, -122000],
        colors: ['#c8944c', '#f0d089', '#8e5f32'],
        atmosphere: '#ffd890',
        texture: 'cloud',
        rotationSpeed: 0.018,
    },
    {
        name: 'Terra',
        radius: 350,
        position: [18000, 0, -98000],
        colors: ['#1d5fa8', '#2e9c68', '#e9e2bb'],
        atmosphere: '#7dc8ff',
        texture: 'earth',
        rotationSpeed: 0.045,
    },
    {
        name: 'Marte',
        radius: 350,
        position: [-14000, 0, -72000],
        colors: ['#a9472f', '#e07b48', '#5f2c26'],
        atmosphere: '#e58a5f',
        texture: 'rock',
        rotationSpeed: 0.04,
    },
    {
        name: 'Jupiter',
        radius: 350,
        position: [34000, 0, -24000],
        colors: ['#c79358', '#e6c18f', '#8f5e38', '#f3dfbd'],
        atmosphere: '#f1d2a0',
        texture: 'bands',
        rotationSpeed: 0.075,
    },
    {
        name: 'Saturno',
        radius: 350,
        position: [-42000, 0, 18000],
        colors: ['#d8bb7b', '#f0d89b', '#9f814d'],
        atmosphere: '#f0d69a',
        texture: 'bands',
        ring: true,
        rotationSpeed: 0.065,
    },
    {
        name: 'Urano',
        radius: 350,
        position: [52000, 0, 62000],
        colors: ['#8fd6d2', '#c5f1ef', '#4e9fa0'],
        atmosphere: '#a7ece9',
        texture: 'ice',
        rotationSpeed: 0.038,
    },
    {
        name: 'Netuno',
        radius: 350,
        position: [-56000, 0, 98000],
        colors: ['#1d52b6', '#4d85f0', '#0c245e'],
        atmosphere: '#5e9cff',
        texture: 'ice',
        rotationSpeed: 0.045,
    },
    {
        name: 'Plutao',
        radius: 350,
        position: [68000, 0, 132000],
        colors: ['#8e7764', '#d9c2a2', '#4f4037'],
        atmosphere: '#d4c0aa',
        texture: 'rock',
        rotationSpeed: 0.02,
    },
];

export const MOONS = [
    { name: 'Ganimedes', parent: 'Jupiter', radius: 75, distance: 3600, speed: 0.42, colors: ['#8d8375', '#c5b7a0', '#4c4944'] },
    { name: 'Tita', parent: 'Saturno', radius: 75, distance: 3300, speed: 0.34, colors: ['#b9873e', '#e5bd71', '#5f4324'] },
    { name: 'Calisto', parent: 'Jupiter', radius: 75, distance: 4500, speed: 0.28, colors: ['#58534f', '#a39a8e', '#2f2e2d'] },
    { name: 'Io', parent: 'Jupiter', radius: 75, distance: 2750, speed: 0.55, colors: ['#d4b142', '#f1e18a', '#7b4b2d'] },
    { name: 'Lua', parent: 'Terra', radius: 75, distance: 1750, speed: 0.68, colors: ['#8b8f93', '#d3d7d8', '#4e5154'] },
    { name: 'Europa', parent: 'Jupiter', radius: 75, distance: 5250, speed: 0.37, colors: ['#c7bba5', '#f0eadb', '#7d6751'] },
    { name: 'Tritao', parent: 'Netuno', radius: 75, distance: 2300, speed: 0.44, colors: ['#a99a91', '#d7d3c7', '#6c6f77'] },
    { name: 'Titania', parent: 'Urano', radius: 75, distance: 2300, speed: 0.36, colors: ['#78756f', '#bbb3a8', '#44413d'] },
    { name: 'Reia', parent: 'Saturno', radius: 75, distance: 4150, speed: 0.26, colors: ['#8e8a83', '#cdc8bd', '#52504c'] },
    { name: 'Oberon', parent: 'Urano', radius: 75, distance: 3100, speed: 0.29, colors: ['#70695f', '#b8aa99', '#3b3834'] },
];
