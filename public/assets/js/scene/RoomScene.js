import * as THREE from 'three';
import { NavigationController } from '../controls/NavigationController.js';
import { MOONS, PLANETS, SUN, UNIVERSE_HALF, UNIVERSE_SIZE } from './CelestialData.js';
import { createProceduralShipMesh, isProceduralShipModel } from './ProceduralShips.js';
import {
    ARTIFICIAL_OBJECTS,
    ASSET_ROOT,
    DEEP_SPACE_BACKDROPS,
    DOCK_OFFSET_FACTOR,
    DOCK_RANGE,
    FIRE_COOLDOWN,
    FIRE_RANGE,
    MOON_ORBIT_SPEED_MULT,
    SHIP_VISUAL_PIXEL_LIMIT,
    STAR_COUNT,
    UNDOCK_PUSH,
} from './SceneConfig.js';
import { createPlanetTexture, createSunTexture } from './TextureFactory.js';

export class RoomScene {
    constructor({ canvas, lockButton, resetButton, dockButton, presenceUrl, startState, playerShipFrames, playerShipModel, hud, celestialMenu }) {
        this.canvas = canvas;
        this.lockButton = lockButton;
        this.resetButton = resetButton;
        this.dockButton = dockButton ?? null;
        this.presenceUrl = presenceUrl ?? null;
        this.startState = startState ?? null;
        this.playerShipFrames = playerShipFrames ?? null;
        this.playerShipModel = playerShipModel ?? '';
        this.hud = hud ?? null;
        this.celestialMenu = celestialMenu ?? null;
        this.clock = new THREE.Clock();
        this.textureLoader = new THREE.TextureLoader();
        this.planetMeshes = [];
        this.moonSystems = [];
        this.collisionBodies = [];
        this.spaceObjects = [];
        this.remotePlayers = new Map();
        this.networkElapsed = 0;
        this.networkBusy = false;
        this.destructibleTargets = [];
        this.laserBolts = [];
        this.explosions = [];
        this.fireCooldown = 0;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#000207');
        this.autopilot = {
            active: false,
            targetId: null,
        };
        this.docking = {
            phase: 'idle',
            targetId: null,
            targetObject: null,
            offset: new THREE.Vector3(),
            nearbyBody: null,
        };

        this.camera = new THREE.PerspectiveCamera(66, 1, 8, 620000);
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            logarithmicDepthBuffer: true,
            powerPreference: 'high-performance',
        });

        const startPosition = this.startState
            ? new THREE.Vector3(this.startState.x ?? 18000, this.startState.y ?? 900, this.startState.z ?? -92000)
            : new THREE.Vector3(18000, 900, -92000);
        const lookAt = this.startState
            ? new THREE.Vector3(
                (this.startState.x ?? 18000) + Math.sin(this.startState.ry ?? 0) * 600,
                (this.startState.y ?? 900),
                (this.startState.z ?? -92000) - Math.cos(this.startState.ry ?? 0) * 600,
            )
            : new THREE.Vector3(18000, 0, -98000);

        this.controls = new NavigationController(this.camera, this.renderer.domElement, {
            limit: UNIVERSE_HALF,
            height: 900,
            minHeight: 120,
            maxHeight: 52000,
            moveSpeed: 1800,
            boostMultiplier: 2.2,
            shipRadius: 120,
            startPosition,
            lookAt,
            collisionRadius: 0,
        });
        this.scene.add(this.controls.object);
        if (this.startState) {
            this.controls.object.rotation.set(this.startState.rx ?? 0, this.startState.ry ?? 0, this.startState.rz ?? 0, 'YXZ');
        }

        this.createRenderer();
        this.createLights();
        this.createUniverse();
        this.bindEvents();
        this.resize();

        if (this.hud) {
            this.hud.setCamera(this.camera);
        }

        this.setupCelestialMenu();
    }

    start() {
        this.renderer.setAnimationLoop(() => this.render());
    }

    createRenderer() {
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
    }

    createLights() {
        const ambient = new THREE.AmbientLight('#7083a6', 0.35);
        this.scene.add(ambient);

        const sunlight = new THREE.PointLight('#ffd58a', 10, 185000, 1.05);
        sunlight.position.set(...SUN.position);
        this.scene.add(sunlight);
    }

    createUniverse() {
        this.createStars();
        this.createDeepSpaceBackdrops();
        this.createBoundary();
        this.createSun();
        this.createPlanets();
        this.createMoons();
        this.createSpaceTraffic();
        this.createPlayerShip();
        this.rebuildBodyIndex();
    }

    createStars() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(STAR_COUNT * 3);
        const colors = new Float32Array(STAR_COUNT * 3);

        for (let index = 0; index < STAR_COUNT; index += 1) {
            const radius = 260000 + Math.random() * 260000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const offset = index * 3;
            const color = new THREE.Color(Math.random() > 0.78 ? '#b6d8ff' : '#ffffff');

            positions[offset] = radius * Math.sin(phi) * Math.cos(theta);
            positions[offset + 1] = radius * Math.cos(phi);
            positions[offset + 2] = radius * Math.sin(phi) * Math.sin(theta);

            colors[offset] = color.r;
            colors[offset + 1] = color.g;
            colors[offset + 2] = color.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const stars = new THREE.Points(geometry, new THREE.PointsMaterial({
            size: 105,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            depthWrite: false,
        }));

        this.scene.add(stars);
    }

    loadTexture(path) {
        const texture = this.textureLoader.load(path);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        return texture;
    }

    createDeepSpaceBackdrops() {
        for (const backdrop of DEEP_SPACE_BACKDROPS) {
            const material = new THREE.SpriteMaterial({
                map: this.loadTexture(`${ASSET_ROOT}${backdrop.image}`),
                transparent: true,
                opacity: backdrop.opacity,
                depthWrite: false,
                depthTest: true,
                blending: THREE.AdditiveBlending,
            });
            const sprite = new THREE.Sprite(material);
            sprite.position.set(...backdrop.position);
            sprite.scale.set(backdrop.scale[0], backdrop.scale[1], 1);
            sprite.renderOrder = -5;
            this.scene.add(sprite);
        }
    }

    createPlayerShip() {
        if (this.isProceduralShipModel(this.playerShipModel)) {
            const ship = this.createProceduralShipMesh(this.playerShipModel, 154);
            ship.position.set(0, -116, -470);
            ship.rotation.set(-0.08, 0, 0);
            this.prepareCockpitModel(ship);
            this.camera.add(ship);
            this.playerShip = ship;
            this.playerShipTextures = null;
            this.createPlayerExhaust(20, 88, new THREE.Vector3(0, -118, -366));
            this.createMotionStreaks();
            const shipLight = new THREE.PointLight('#97ecff', 1.9, 1400, 2);
            shipLight.position.set(0, 40, -360);
            this.camera.add(shipLight);
            this.playerShipLight = shipLight;
            return;
        }

        const defaultFrames = {
            left: `${ASSET_ROOT}naves/ship_00_raptor_classic_left_thrust.png`,
            right: `${ASSET_ROOT}naves/ship_00_raptor_classic_right_thrust.png`,
            forward_idle: `${ASSET_ROOT}naves/ship_00_raptor_classic_forward_idle.png`,
            forward_thrust: `${ASSET_ROOT}naves/ship_00_raptor_classic_forward_thrust.png`,
        };
        const frames = { ...defaultFrames, ...(this.playerShipFrames ?? {}) };
        this.playerShipTextures = {
            left: this.loadTexture(frames.left),
            right: this.loadTexture(frames.right),
            forwardIdle: this.loadTexture(frames.forward_idle),
            forwardThrust: this.loadTexture(frames.forward_thrust),
        };

        const shipMaterial = new THREE.MeshBasicMaterial({
            map: this.playerShipTextures.forwardIdle,
            transparent: true,
            depthWrite: false,
            depthTest: false,
        });

        const ship = new THREE.Mesh(
            new THREE.PlaneGeometry(112, 68),
            shipMaterial,
        );
        ship.position.set(0, -88, -430);
        ship.renderOrder = 20;
        this.camera.add(ship);
        this.playerShip = ship;
        this.createPlayerExhaust(18, 72, new THREE.Vector3(0, -90, -385));
    }

    createPlayerExhaust(radius, length, position) {
        const exhaustMaterial = new THREE.MeshBasicMaterial({
            color: '#4fe0c2',
            transparent: true,
            opacity: 0.44,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false,
        });
        const exhaust = new THREE.Mesh(
            new THREE.ConeGeometry(radius, length, 24, 1, true),
            exhaustMaterial,
        );
        exhaust.rotation.x = Math.PI / 2;
        exhaust.position.copy(position);
        exhaust.renderOrder = 19;
        this.camera.add(exhaust);
        this.playerExhaust = exhaust;
    }

    createSpaceTraffic() {
        for (const objectData of ARTIFICIAL_OBJECTS) {
            const planet = PLANETS.find((item) => item.name === objectData.near);
            if (!planet) continue;

            const position = new THREE.Vector3(...planet.position).add(new THREE.Vector3(...objectData.offset));
            this.createSpaceObject({
                ...objectData,
                position,
            });
        }
    }

    createSpaceObject({ kind, name, image, position, scale, health = 0, drift = [0, 0, 0] }) {
        const group = new THREE.Group();
        group.name = name;
        group.position.copy(position);
        let sprite = null;

        if (kind === 'cargo') {
            const cargoShip = this.createCargoShipMesh(scale);
            group.add(cargoShip);
        } else {
            sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: this.loadTexture(`${ASSET_ROOT}${image}`),
                transparent: true,
                depthWrite: false,
            }));
            sprite.scale.set(scale[0], scale[1], 1);
            sprite.userData.spaceTarget = group;
            group.add(sprite);
        }

        const object = {
            group,
            sprite,
            kind,
            name,
            radius: Math.max(scale[0], scale[1]) * 0.34,
            baseScale: new THREE.Vector2(scale[0], scale[1]),
            baseGroupScale: group.scale.clone(),
            maxHealth: health,
            health,
            velocity: new THREE.Vector3(...drift),
            alive: true,
            healthBar: null,
        };

        group.userData.spaceObject = object;
        this.spaceObjects.push(object);
        this.scene.add(group);
        if (kind === 'satellite') {
            object.healthBar = this.createEnergyBar(group, object);
            this.destructibleTargets.push(sprite);
        }
    }

    createRemotePlayer(player) {
        const position = player.position ?? {};
        const rotation = player.rotation ?? {};
        const assetPath = this.normalizeAssetPath(player.ship_asset || 'images/naves/ship_00_raptor_classic_forward_idle.png');
        const shipModel = player.ship_model ?? '';
        const isCargo = assetPath.includes('navecarga');
        const scale = isCargo ? [1500, 860] : [920, 580];

        const group = new THREE.Group();
        group.name = player.username || 'Jogador';
        group.position.set(position.x ?? 18000, position.y ?? 900, position.z ?? -92000);
        group.rotation.set(rotation.x ?? 0, rotation.y ?? 0, rotation.z ?? 0);

        let sprite = null;
        const meshTargets = [];

        if (this.isProceduralShipModel(shipModel) || assetPath.startsWith('model:css_3d_')) {
            const modelName = this.isProceduralShipModel(shipModel) ? shipModel : assetPath.replace('model:', '');
            const ship = this.createProceduralShipMesh(modelName, 840);
            group.add(ship);
            ship.traverse((child) => {
                if (!child.isMesh) return;
                child.userData.spaceTarget = group;
                meshTargets.push(child);
            });
        } else {
            sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: this.loadTexture(assetPath),
                transparent: true,
                depthWrite: false,
            }));
            sprite.scale.set(scale[0], scale[1], 1);
            sprite.userData.spaceTarget = group;
            group.add(sprite);
        }

        const object = {
            group,
            sprite,
            meshTargets,
            kind: 'remote',
            name: player.username || 'Jogador',
            ship: player.ship_name || 'Nave',
            assetPath,
            shipModel,
            radius: Math.max(scale[0], scale[1]) * 0.36,
            baseScale: new THREE.Vector2(scale[0], scale[1]),
            baseGroupScale: group.scale.clone(),
            maxHealth: player.energy ?? 100,
            health: player.energy ?? 100,
            ammo: player.ammo ?? 0,
            velocity: new THREE.Vector3(),
            alive: true,
            healthBar: null,
            targetPosition: group.position.clone(),
            targetQuaternion: group.quaternion.clone(),
        };

        group.userData.spaceObject = object;
        this.spaceObjects.push(object);
        if (sprite) {
            this.destructibleTargets.push(sprite);
        } else {
            this.destructibleTargets.push(...meshTargets);
        }
        this.remotePlayers.set(String(player.user_id), object);
        this.scene.add(group);
        object.healthBar = this.createEnergyBar(group, object);
        return object;
    }

    normalizeAssetPath(path) {
        if (path.startsWith('http') || path.startsWith('images/') || path.startsWith('model:')) {
            return path;
        }

        return `${ASSET_ROOT}${path}`;
    }

    isProceduralShipModel(model) {
        return isProceduralShipModel(model);
    }

    prepareCockpitModel(model) {
        model.renderOrder = 20;
        model.traverse((child) => {
            child.frustumCulled = false;
            child.renderOrder = 20;
            if (!child.isMesh || !child.material) return;
            child.material = child.material.clone();
            child.material.depthTest = false;
            child.material.depthWrite = false;
            child.material.side = THREE.DoubleSide;
        });
    }

    createProceduralShipMesh(model, size) {
        return createProceduralShipMesh(model, size);
    }

    createMotionStreaks() {
        if (this.motionStreaks) return;
        this.motionStreaks = [];

        const material = new THREE.MeshBasicMaterial({
            color: '#6ff5ec',
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false,
        });

        for (const side of [-1, 1]) {
            const streak = new THREE.Mesh(new THREE.PlaneGeometry(180, 420), material.clone());
            streak.position.set(side * 210, -40, -520);
            streak.rotation.y = side * 0.22;
            streak.renderOrder = 18;
            this.camera.add(streak);
            this.motionStreaks.push(streak);
        }
    }

    createCargoShipMesh(scale) {
        const ship = new THREE.Group();
        const length = scale[0] * 0.68;
        const height = scale[1] * 0.26;
        const width = scale[1] * 0.2;

        const hullMaterial = new THREE.MeshStandardMaterial({
            color: '#8d9aa3',
            roughness: 0.54,
            metalness: 0.48,
        });
        const accentMaterial = new THREE.MeshStandardMaterial({
            color: '#ff8e42',
            emissive: '#4a1e07',
            roughness: 0.36,
            metalness: 0.34,
        });
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: '#2f3b44',
            roughness: 0.82,
            metalness: 0.18,
        });

        const body = new THREE.Mesh(
            new THREE.BoxGeometry(length * 0.42, height * 0.7, width * 1.5),
            hullMaterial,
        );
        ship.add(body);

        const bridge = new THREE.Mesh(
            new THREE.BoxGeometry(length * 0.18, height * 0.42, width * 0.92),
            panelMaterial,
        );
        bridge.position.set(length * 0.12, height * 0.42, 0);
        ship.add(bridge);

        const nose = new THREE.Mesh(
            new THREE.ConeGeometry(width * 0.62, length * 0.22, 6),
            hullMaterial,
        );
        nose.rotation.z = -Math.PI / 2;
        nose.position.set(length * 0.34, 0, 0);
        ship.add(nose);

        for (const side of [-1, 1]) {
            const cargoPod = new THREE.Mesh(
                new THREE.BoxGeometry(length * 0.18, height * 0.34, width * 0.42),
                hullMaterial,
            );
            cargoPod.position.set(-length * 0.08, -height * 0.12, side * width * 0.92);
            ship.add(cargoPod);

            const wing = new THREE.Mesh(
                new THREE.BoxGeometry(length * 0.16, height * 0.06, width * 0.9),
                panelMaterial,
            );
            wing.position.set(-length * 0.02, 0, side * width * 0.66);
            wing.rotation.x = side * 0.18;
            ship.add(wing);

            const engine = new THREE.Mesh(
                new THREE.CylinderGeometry(width * 0.12, width * 0.14, length * 0.14, 12),
                accentMaterial,
            );
            engine.rotation.z = Math.PI / 2;
            engine.position.set(-length * 0.3, -height * 0.04, side * width * 0.58);
            ship.add(engine);
        }

        const spine = new THREE.Mesh(
            new THREE.BoxGeometry(length * 0.5, height * 0.12, width * 0.28),
            accentMaterial,
        );
        spine.position.set(-length * 0.04, height * 0.12, 0);
        ship.add(spine);

        ship.rotation.y = Math.PI * 0.5;
        return ship;
    }

    createEnergyBar(group, target) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 52;
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;

        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
            depthTest: false,
        }));
        sprite.scale.set(1300, 260, 1);
        sprite.position.y = target.radius + 430;
        sprite.visible = false;
        sprite.renderOrder = 14;
        sprite.userData.canvas = canvas;
        sprite.userData.texture = texture;
        group.add(sprite);
        this.updateEnergyBar(target);
        return sprite;
    }

    updateEnergyBar(target) {
        if (!target.healthBar) return;

        const canvas = target.healthBar.userData.canvas;
        const texture = target.healthBar.userData.texture;
        const context = canvas.getContext('2d');
        const pct = THREE.MathUtils.clamp(target.health / target.maxHealth, 0, 1);

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'rgba(2, 6, 10, 0.68)';
        context.fillRect(6, 8, 244, 36);
        context.strokeStyle = 'rgba(255, 255, 255, 0.48)';
        context.lineWidth = 3;
        context.strokeRect(6, 8, 244, 36);
        context.fillStyle = pct > 0.45 ? '#4fe0c2' : '#ff5d7a';
        context.fillRect(12, 14, 232 * pct, 24);
        context.fillStyle = 'rgba(238, 244, 248, 0.94)';
        context.font = '700 17px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('ENERGIA', 128, 26);
        texture.needsUpdate = true;
    }

    createBoundary() {
        const half = UNIVERSE_HALF;
        const points = [
            new THREE.Vector3(-half, 0, -half),
            new THREE.Vector3(half, 0, -half),
            new THREE.Vector3(half, 0, half),
            new THREE.Vector3(-half, 0, half),
            new THREE.Vector3(-half, 0, -half),
        ];

        const border = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({
                color: '#2bc7d3',
                transparent: true,
                opacity: 0.36,
            }),
        );
        border.position.y = -180;
        this.scene.add(border);

        const grid = new THREE.GridHelper(UNIVERSE_SIZE, 60, '#144b57', '#10252d');
        grid.position.y = -220;
        grid.material.transparent = true;
        grid.material.opacity = 0.16;
        this.scene.add(grid);
    }

    createSun() {
        const sun = new THREE.Mesh(
            new THREE.SphereGeometry(SUN.radius, 72, 48),
            new THREE.MeshBasicMaterial({
                map: createSunTexture(),
                color: SUN.color,
            }),
        );
        sun.position.set(...SUN.position);
        this.scene.add(sun);
        this.planetMeshes.push({ mesh: sun, speed: 0.018 });

        const glow = new THREE.Mesh(
            new THREE.SphereGeometry(SUN.radius * 1.38, 72, 48),
            new THREE.MeshBasicMaterial({
                color: '#ff9d2f',
                transparent: true,
                opacity: 0.18,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            }),
        );
        glow.position.copy(sun.position);
        this.scene.add(glow);

        this.addCollisionBody(sun, SUN.radius);
    }

    createPlanets() {
        this.planetGroups = new Map();

        for (const planet of PLANETS) {
            const group = new THREE.Group();
            group.name = planet.name;
            group.position.set(...planet.position);
            this.scene.add(group);
            this.planetGroups.set(planet.name, { group, planet });

            const mesh = new THREE.Mesh(
                new THREE.SphereGeometry(planet.radius, 64, 40),
                new THREE.MeshStandardMaterial({
                    map: createPlanetTexture(planet),
                    roughness: planet.texture === 'ice' ? 0.38 : 0.66,
                    metalness: 0.02,
                }),
            );
            group.add(mesh);
            this.planetMeshes.push({ mesh, speed: planet.rotationSpeed });
            this.addCollisionBody(mesh, planet.radius);
            mesh.userData.bodyId = `planet:${planet.name}`;
            mesh.userData.bodyName = planet.name;

            this.createAtmosphere(group, planet);
            this.createPlanetOrbit(planet);
            if (planet.ring) {
                this.createSaturnRing(group, planet.radius);
            }
        }
    }

    createMoons() {
        for (const moon of MOONS) {
            const planetSystem = this.planetGroups.get(moon.parent);
            if (!planetSystem) continue;

            const orbit = new THREE.Group();
            planetSystem.group.add(orbit);

            const mesh = new THREE.Mesh(
                new THREE.SphereGeometry(moon.radius, 32, 20),
                new THREE.MeshPhongMaterial({
                    map: createPlanetTexture({ colors: moon.colors, texture: 'rock' }),
                    color: '#ffffff',
                    emissive: '#0b0f12',
                    emissiveIntensity: 0.08,
                    shininess: 18,
                    specular: '#6f7d86',
                }),
            );
            mesh.position.x = moon.distance;
            orbit.add(mesh);
            this.planetMeshes.push({ mesh, speed: 0.05 });
            this.moonSystems.push({ orbit, speed: moon.speed * MOON_ORBIT_SPEED_MULT, mesh, radius: moon.radius });
            mesh.userData.bodyId = `moon:${moon.name}`;
            mesh.userData.bodyName = moon.name;

            this.createMoonOrbit(planetSystem.group, moon.distance);
        }
    }

    addCollisionBody(object3d, radius) {
        this.collisionBodies.push({ object: object3d, radius });
    }

    rebuildBodyIndex() {
        this.bodies = [];

        // Sol
        this.bodies.push({
            id: 'star:Sol',
            name: 'Sol',
            type: 'star',
            getPosition: () => new THREE.Vector3(...SUN.position),
            radius: SUN.radius,
        });

        for (const planet of PLANETS) {
            const system = this.planetGroups.get(planet.name);
            if (!system) continue;
            this.bodies.push({
                id: `planet:${planet.name}`,
                name: planet.name,
                type: 'planet',
                getPosition: () => system.group.getWorldPosition(new THREE.Vector3()),
                getObject: () => system.group,
                radius: planet.radius,
            });
        }

        for (const moonSystem of this.moonSystems) {
            const name = moonSystem.mesh.userData.bodyName ?? 'Lua';
            this.bodies.push({
                id: `moon:${name}`,
                name,
                type: 'moon',
                getPosition: () => moonSystem.mesh.getWorldPosition(new THREE.Vector3()),
                getObject: () => moonSystem.mesh,
                radius: moonSystem.radius,
            });
        }

        for (const object of this.spaceObjects) {
            if (!object.alive) continue;
            this.bodies.push({
                id: `${object.kind}:${object.name}`,
                name: object.name,
                type: object.kind,
                getPosition: () => object.group.getWorldPosition(new THREE.Vector3()),
                getObject: () => object.group,
                radius: object.radius,
            });
        }

        if (this.hud) {
            this.hud.setBodies(this.getBodySnapshots());
        }
        if (this.celestialMenu) {
            this.celestialMenu.render(this.getMenuData());
        }
    }

    getBodySnapshots() {
        return this.bodies.map((body) => {
            const position = body.getPosition();
            return { id: body.id, name: body.name, type: body.type, x: position.x, y: position.y, z: position.z, r: body.radius };
        });
    }

    getDockableBody() {
        const shipPosition = this.controls.object.position;
        let bestBody = null;
        let bestDist = Infinity;

        for (const body of this.bodies) {
            if (!['moon', 'cargo', 'remote'].includes(body.type)) continue;
            const position = body.getPosition();
            const dist = shipPosition.distanceTo(position) - body.radius;
            if (dist >= DOCK_RANGE || dist >= bestDist) continue;
            bestDist = dist;
            bestBody = {
                ...body,
                distance: dist,
            };
        }

        return bestBody;
    }

    updateDockButton() {
        if (!this.dockButton) return;

        const isDocked = this.docking.phase === 'docked' || this.docking.phase === 'approaching';
        const nearbyBody = this.getDockableBody();
        this.docking.nearbyBody = nearbyBody;

        this.dockButton.classList.toggle('is-active', isDocked);
        this.dockButton.classList.toggle('is-disabled', !isDocked && !nearbyBody);
        this.dockButton.querySelector('span').textContent = isDocked ? 'Desacoplar' : 'Acoplar';
        this.dockButton.title = isDocked
            ? 'Desacoplar da nave ou lua'
            : nearbyBody
                ? `Acoplar em ${nearbyBody.name}`
                : 'Aproxime-se de uma lua ou nave';
    }

    getMenuData() {
        const planets = [];
        const moons = [];
        for (const body of this.getBodySnapshots()) {
            const meta = `r=${Math.round(body.r)}`;
            if (body.type === 'planet') planets.push({ id: body.id, name: body.name, meta });
            if (body.type === 'moon') moons.push({ id: body.id, name: body.name, meta });
        }
        planets.sort((a, b) => a.name.localeCompare(b.name));
        moons.sort((a, b) => a.name.localeCompare(b.name));
        return { planets, moons };
    }

    setupCelestialMenu() {
        if (!this.celestialMenu) return;
        this.celestialMenu.onSelect = (id) => {
            if (this.docking?.phase && this.docking.phase !== 'idle') {
                return;
            }
            this.autopilot.active = true;
            this.autopilot.targetId = id;
        };
    }

    updateAutopilot(delta) {
        if (!this.autopilot.active || !this.autopilot.targetId) return;

        const targetBody = this.bodies.find((body) => body.id === this.autopilot.targetId);
        if (!targetBody) {
            this.autopilot.active = false;
            this.autopilot.targetId = null;
            if (this.hud) this.hud.setAutopilotTarget(null);
            return;
        }

        const targetPosition = targetBody.getPosition();
        const shipPosition = this.controls.object.position;

        const toTarget = new THREE.Vector3().subVectors(targetPosition, shipPosition);
        const distance = toTarget.length();
        const stopDistance = targetBody.radius + 420;

        if (this.hud) {
            this.hud.setAutopilotTarget({
                id: targetBody.id,
                name: targetBody.name,
                x: targetPosition.x,
                y: targetPosition.y,
                z: targetPosition.z,
                r: targetBody.radius,
            });
        }

        if (distance <= stopDistance) {
            this.autopilot.active = false;
            this.autopilot.targetId = null;
            if (this.hud) this.hud.setAutopilotTarget(null);
            return;
        }

        const direction = toTarget.clone().normalize();
        const lookTarget = shipPosition.clone().add(direction.clone().multiplyScalar(1200));
        const up = new THREE.Vector3(0, 1, 0);
        const lookMatrix = new THREE.Matrix4().lookAt(shipPosition, lookTarget, up);
        const desiredQuaternion = new THREE.Quaternion().setFromRotationMatrix(lookMatrix);
        this.controls.object.quaternion.slerp(desiredQuaternion, Math.min(1, delta * 2.4));

        const speed = 4200;
        shipPosition.addScaledVector(direction, Math.min(speed * delta, distance - stopDistance));
    }

    toggleDocking() {
        if (this.docking.phase === 'docked' || this.docking.phase === 'approaching') {
            this.releaseDock();
            return;
        }

        const candidate = this.getDockableBody();
        if (!candidate || !candidate.getObject) return;

        this.autopilot.active = false;
        this.autopilot.targetId = null;
        if (this.hud) this.hud.setAutopilotTarget(null);

        this.docking.phase = 'approaching';
        this.docking.targetId = candidate.id;
        this.docking.targetObject = candidate.getObject();
        const distance = Math.max(candidate.radius * DOCK_OFFSET_FACTOR, 260);
        this.docking.offset.set(0, Math.max(candidate.radius * 0.2, 40), distance);
        this.controls.setEnabled(false);
    }

    releaseDock() {
        const targetObject = this.docking.targetObject;
        if (targetObject) {
            const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(targetObject.getWorldQuaternion(new THREE.Quaternion())).normalize();
            this.controls.object.position.addScaledVector(forward, UNDOCK_PUSH);
        }

        this.docking.phase = 'idle';
        this.docking.targetId = null;
        this.docking.targetObject = null;
        this.controls.setEnabled(true);
    }

    updateDocking(delta) {
        if (this.docking.phase === 'idle') return;

        const targetObject = this.docking.targetObject;
        if (!targetObject || !targetObject.parent) {
            this.releaseDock();
            return;
        }

        const targetPosition = targetObject.getWorldPosition(new THREE.Vector3());
        const targetQuaternion = targetObject.getWorldQuaternion(new THREE.Quaternion());
        const desiredPosition = this.docking.offset.clone().applyQuaternion(targetQuaternion).add(targetPosition);
        const shipPosition = this.controls.object.position;

        if (this.docking.phase === 'approaching') {
            shipPosition.lerp(desiredPosition, Math.min(1, delta * 2.8));
            this.controls.object.lookAt(targetPosition);
            if (shipPosition.distanceTo(desiredPosition) < 60) {
                this.docking.phase = 'docked';
            }
            return;
        }

        if (this.docking.phase === 'docked') {
            shipPosition.copy(desiredPosition);
            this.controls.object.quaternion.slerp(targetQuaternion, Math.min(1, delta * 4));
            this.controls.object.lookAt(targetPosition);
        }
    }

    updateColliders() {
        const colliders = [];

        for (const body of this.collisionBodies) {
            const position = new THREE.Vector3();
            body.object.getWorldPosition(position);
            colliders.push({ x: position.x, y: position.y, z: position.z, r: body.radius });
        }

        // Luas mudam de posicao por orbitas
        for (const moonSystem of this.moonSystems) {
            const position = new THREE.Vector3();
            moonSystem.mesh.getWorldPosition(position);
            colliders.push({ x: position.x, y: position.y, z: position.z, r: moonSystem.radius });
        }

        for (const object of this.spaceObjects) {
            if (!object.alive || object.kind === 'satellite') continue;
            const position = object.group.getWorldPosition(new THREE.Vector3());
            colliders.push({ x: position.x, y: position.y, z: position.z, r: object.radius });
        }

        this.controls.setColliders(colliders);
    }

    createAtmosphere(group, planet) {
        const atmosphere = new THREE.Mesh(
            new THREE.SphereGeometry(planet.radius * 1.075, 64, 40),
            new THREE.MeshBasicMaterial({
                color: planet.atmosphere,
                transparent: true,
                opacity: planet.name === 'Venus' ? 0.22 : 0.14,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            }),
        );
        group.add(atmosphere);
    }

    createSaturnRing(group, radius) {
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(radius * 1.28, radius * 2.25, 96),
            new THREE.MeshBasicMaterial({
                color: '#d8c087',
                transparent: true,
                opacity: 0.48,
                side: THREE.DoubleSide,
            }),
        );
        ring.rotation.x = Math.PI / 2.25;
        group.add(ring);
    }

    createPlanetOrbit(planet) {
        void planet;
        return;
        const sunPosition = new THREE.Vector3(...SUN.position);
        const planetPosition = new THREE.Vector3(...planet.position);
        const radius = sunPosition.distanceTo(planetPosition);
        const curve = new THREE.EllipseCurve(0, 0, radius, radius * 0.86, 0, Math.PI * 2);
        const points = curve.getPoints(220).map((point) => new THREE.Vector3(
            point.x + SUN.position[0],
            -120,
            point.y + SUN.position[2],
        ));

        const orbit = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({
                color: '#39596a',
                transparent: true,
                opacity: 0.23,
            }),
        );
        this.scene.add(orbit);
    }

    createMoonOrbit(group, radius) {
        void group;
        void radius;
        return;
        const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2);
        const points = curve.getPoints(96).map((point) => new THREE.Vector3(point.x, 0, point.y));
        const orbit = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({
                color: '#8ea0a8',
                transparent: true,
                opacity: 0.28,
            }),
        );
        group.add(orbit);
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('beforeunload', () => this.sendOfflinePresence());

        window.addEventListener('keydown', (event) => {
            if (event.code === 'KeyE' || event.code === 'Enter') {
                event.preventDefault();
                this.fireLaser();
            }
        });

        this.lockButton.addEventListener('click', () => {
            this.controls.lock();
        });

        this.resetButton.addEventListener('click', () => {
            this.releaseDock();
            this.controls.reset();
        });

        if (this.dockButton) {
            this.dockButton.addEventListener('click', () => {
                this.toggleDocking();
            });
        }

        this.canvas.addEventListener('click', () => {
            this.controls.lock();
        });

        this.canvas.addEventListener('mousedown', (event) => {
            if (event.button !== 0 || !this.controls.controls.isLocked) return;
            this.fireLaser();
        });
    }

    fireLaser() {
        if (this.fireCooldown > 0) return;
        this.fireCooldown = FIRE_COOLDOWN;

        const origin = new THREE.Vector3();
        this.camera.getWorldPosition(origin);
        const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.getWorldQuaternion(new THREE.Quaternion())).normalize();
        const start = origin.clone().addScaledVector(direction, 360);
        const end = start.clone().addScaledVector(direction, FIRE_RANGE);

        const raycaster = new THREE.Raycaster(start, direction, 0, FIRE_RANGE);
        raycaster.params.Sprite.threshold = 0.12;
        const hits = raycaster.intersectObjects(this.destructibleTargets, false);
        let hitTarget = null;

        if (hits.length > 0) {
            const hit = hits[0];
            end.copy(hit.point);
            hitTarget = hit.object.userData.spaceTarget?.userData.spaceObject ?? null;
        }

        this.createLaserBolt(start, end);
        this.playSound(`${ASSET_ROOT}media/laser1.mp3`, 0.26);

        if (hitTarget) {
            this.damageTarget(hitTarget);
        }
    }

    createLaserBolt(start, end) {
        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const material = new THREE.LineBasicMaterial({
            color: '#70fff2',
            transparent: true,
            opacity: 1,
            linewidth: 3,
            blending: THREE.AdditiveBlending,
        });
        const line = new THREE.Line(geometry, material);
        line.renderOrder = 16;
        this.scene.add(line);
        this.laserBolts.push({ line, age: 0, life: 0.14 });

        const flash = new THREE.Sprite(new THREE.SpriteMaterial({
            map: this.createFlashTexture(),
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        }));
        flash.position.copy(end);
        flash.scale.set(420, 420, 1);
        this.scene.add(flash);
        this.explosions.push({ sprite: flash, age: 0, life: 0.18, startScale: 420, endScale: 980, sound: false });
    }

    damageTarget(target) {
        if (!target.alive || target.health <= 0) return;

        target.health -= 1;
        if (target.healthBar) {
            target.healthBar.visible = true;
        }
        this.updateEnergyBar(target);

        if (target.health <= 0) {
            this.explodeTarget(target);
        }
    }

    explodeTarget(target) {
        target.alive = false;
        const position = target.group.getWorldPosition(new THREE.Vector3());
        this.scene.remove(target.group);
        const targetMeshes = target.meshTargets ?? [];
        this.destructibleTargets = this.destructibleTargets.filter((item) => item !== target.sprite && !targetMeshes.includes(item));
        this.rebuildBodyIndex();
        this.createExplosion(position, Math.max(target.radius * 2.2, 1800));
        this.playSound(`${ASSET_ROOT}media/explosao1.mp3`, 0.42);
    }

    createExplosion(position, size) {
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: this.createExplosionTexture(),
            transparent: true,
            opacity: 0.95,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        }));
        sprite.position.copy(position);
        sprite.scale.set(size * 0.4, size * 0.4, 1);
        this.scene.add(sprite);
        this.explosions.push({ sprite, age: 0, life: 0.9, startScale: size * 0.4, endScale: size });
    }

    createFlashTexture() {
        if (this.flashTexture) return this.flashTexture;

        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.22, 'rgba(112,255,242,0.9)');
        gradient.addColorStop(1, 'rgba(112,255,242,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 128, 128);
        this.flashTexture = new THREE.CanvasTexture(canvas);
        this.flashTexture.colorSpace = THREE.SRGBColorSpace;
        return this.flashTexture;
    }

    createExplosionTexture() {
        if (this.explosionTexture) return this.explosionTexture;

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,214,89,0.95)');
        gradient.addColorStop(0.48, 'rgba(255,84,35,0.75)');
        gradient.addColorStop(1, 'rgba(255,0,200,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 256, 256);
        this.explosionTexture = new THREE.CanvasTexture(canvas);
        this.explosionTexture.colorSpace = THREE.SRGBColorSpace;
        return this.explosionTexture;
    }

    playSound(path, volume) {
        const audio = new Audio(path);
        audio.volume = volume;
        audio.play().catch(() => {});
    }

    updatePlayerShip(delta) {
        if (!this.playerShip) return;

        if (this.isProceduralShipModel(this.playerShipModel)) {
            const movingLeft = this.controls.keys.has('KeyA');
            const movingRight = this.controls.keys.has('KeyD');
            const movingForward = this.controls.keys.has('KeyW') || this.controls.keys.has('ShiftLeft') || this.controls.keys.has('ShiftRight');
            const roll = (movingLeft ? 0.18 : 0) + (movingRight ? -0.18 : 0);
            this.playerShip.rotation.z = THREE.MathUtils.lerp(this.playerShip.rotation.z, roll, Math.min(1, delta * 6));
            this.playerShip.rotation.y = Math.PI + Math.sin(performance.now() * 0.0018) * 0.04;
            this.updateProceduralThrusters(delta, {
                movingForward,
                movingLeft,
                movingRight,
            });
            if (this.playerShipLight) {
                const targetIntensity = movingForward ? 2.2 : 1.45;
                this.playerShipLight.intensity = THREE.MathUtils.lerp(this.playerShipLight.intensity, targetIntensity, Math.min(1, delta * 5));
            }
            if (this.playerExhaust) {
                const targetOpacity = movingForward ? 0.86 : 0.12;
                this.playerExhaust.material.opacity = THREE.MathUtils.lerp(this.playerExhaust.material.opacity, targetOpacity, Math.min(1, delta * 8));
                const targetScale = movingForward ? 0.98 : 0.28;
                this.playerExhaust.scale.y = THREE.MathUtils.lerp(this.playerExhaust.scale.y, targetScale + Math.sin(performance.now() * 0.018) * 0.08, Math.min(1, delta * 8));
            }
            if (this.motionStreaks) {
                const lateral = (movingLeft ? 1 : 0) + (movingRight ? 1 : 0);
                const targetOpacity = lateral > 0 ? 0.42 : movingForward ? 0.22 : 0;
                const targetScale = lateral > 0 ? 1.18 : movingForward ? 1.02 : 0.92;
                for (const streak of this.motionStreaks) {
                    streak.material.opacity = THREE.MathUtils.lerp(streak.material.opacity, targetOpacity, Math.min(1, delta * 10));
                    streak.scale.y = THREE.MathUtils.lerp(streak.scale.y, targetScale, Math.min(1, delta * 8));
                }
            }
            return;
        }

        if (!this.playerShipTextures) return;

        let texture = this.playerShipTextures.forwardIdle;
        if (this.controls.keys.has('KeyA')) texture = this.playerShipTextures.left;
        if (this.controls.keys.has('KeyD')) texture = this.playerShipTextures.right;
        if (this.controls.keys.has('KeyW') || this.controls.keys.has('ShiftLeft') || this.controls.keys.has('ShiftRight')) texture = this.playerShipTextures.forwardThrust;
        if (this.playerShip.material.map !== texture) {
            this.playerShip.material.map = texture;
            this.playerShip.material.needsUpdate = true;
        }

        if (this.playerExhaust) {
            const targetOpacity = this.controls.getSpeed() > 0 ? 0.78 : 0.34;
            this.playerExhaust.material.opacity = THREE.MathUtils.lerp(this.playerExhaust.material.opacity, targetOpacity, Math.min(1, delta * 8));
            this.playerExhaust.scale.y = 0.8 + Math.sin(performance.now() * 0.018) * 0.12;
        }
    }

    updateProceduralThrusters(delta, state) {
        const thrusters = this.playerShip?.userData?.thrusters;
        if (!thrusters) return;

        for (const plume of thrusters.main ?? []) {
            const targetOpacity = state.movingForward ? 0.92 : 0.08;
            const targetScale = state.movingForward ? 1.18 : 0.24;
            plume.material.opacity = THREE.MathUtils.lerp(plume.material.opacity, targetOpacity, Math.min(1, delta * 8));
            plume.scale.y = THREE.MathUtils.lerp(plume.scale.y, targetScale + Math.sin(performance.now() * 0.018) * 0.08, Math.min(1, delta * 8));
        }

        for (const plume of thrusters.left ?? []) {
            const targetOpacity = state.movingLeft ? 0.78 : 0.04;
            const targetScale = state.movingLeft ? 1.08 : 0.24;
            plume.material.opacity = THREE.MathUtils.lerp(plume.material.opacity, targetOpacity, Math.min(1, delta * 8));
            plume.scale.y = THREE.MathUtils.lerp(plume.scale.y, targetScale, Math.min(1, delta * 8));
        }

        for (const plume of thrusters.right ?? []) {
            const targetOpacity = state.movingRight ? 0.78 : 0.04;
            const targetScale = state.movingRight ? 1.08 : 0.24;
            plume.material.opacity = THREE.MathUtils.lerp(plume.material.opacity, targetOpacity, Math.min(1, delta * 8));
            plume.scale.y = THREE.MathUtils.lerp(plume.scale.y, targetScale, Math.min(1, delta * 8));
        }
    }

    updateSpaceObjects(delta) {
        for (const object of this.spaceObjects) {
            if (!object.alive) continue;
            if (object.kind === 'remote') {
                this.updateRemotePlayerObject(object, delta);
            }
            if (object.velocity.lengthSq() > 0) {
                object.group.position.addScaledVector(object.velocity, delta);
            }
            if (object.sprite) {
                if (object.kind === 'satellite') {
                    this.updateSatelliteVisualScale(object);
                    object.sprite.material.rotation += delta * 0.28;
                } else if (object.kind === 'remote') {
                    this.updateShipVisualScale(object);
                }
            } else if (object.kind === 'cargo') {
                this.updateShipVisualScale(object);
                object.group.rotation.y += delta * 0.22;
                object.group.rotation.z = Math.sin(performance.now() * 0.0007 + object.radius) * 0.08;
            } else if (object.kind === 'remote') {
                this.updateShipVisualScale(object);
            }
        }
    }

    updateSatelliteVisualScale(object) {
        if (!object.sprite) return;

        const worldPosition = object.group.getWorldPosition(new THREE.Vector3());
        const distance = this.camera.position.distanceTo(worldPosition);
        const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov * 0.5)) * Math.max(distance, 1);
        const worldUnitsPerPixel = visibleHeight / Math.max(window.innerHeight, 1);
        const maxWorldScale = worldUnitsPerPixel * 25;
        const scaleX = Math.min(object.baseScale.x, maxWorldScale);
        const scaleY = Math.min(object.baseScale.y, maxWorldScale);

        object.sprite.scale.set(scaleX, scaleY, 1);
    }

    updateShipVisualScale(object) {
        const worldPosition = object.group.getWorldPosition(new THREE.Vector3());
        const distance = this.camera.position.distanceTo(worldPosition);
        const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov * 0.5)) * Math.max(distance, 1);
        const worldUnitsPerPixel = visibleHeight / Math.max(window.innerHeight, 1);
        const maxWorldScale = worldUnitsPerPixel * SHIP_VISUAL_PIXEL_LIMIT;

        if (object.sprite && object.baseScale) {
            const largestSide = Math.max(object.baseScale.x, object.baseScale.y, 1);
            const ratio = Math.min(1, maxWorldScale / largestSide);
            object.sprite.scale.set(object.baseScale.x * ratio, object.baseScale.y * ratio, 1);
            return;
        }

        if (!object.sprite && object.baseGroupScale) {
            const visualDiameter = Math.max(object.radius * 2, 1);
            const ratio = Math.min(1, maxWorldScale / visualDiameter);
            object.group.scale.copy(object.baseGroupScale).multiplyScalar(ratio);
        }
    }

    updateRemoteMovementAction(object, delta) {
        const action = object.movementActions?.[object.actionIndex];
        if (!action) return;

        object.actionElapsed += delta;
        const pct = THREE.MathUtils.smoothstep(
            THREE.MathUtils.clamp(object.actionElapsed / action.duration, 0, 1),
            0,
            1,
        );
        object.group.position.lerpVectors(object.actionFrom, object.actionTo, pct);

        if (object.actionElapsed < action.duration) return;

        object.actionIndex = (object.actionIndex + 1) % object.movementActions.length;
        const nextAction = object.movementActions[object.actionIndex];
        object.actionElapsed = 0;
        object.actionFrom.copy(object.group.position);
        object.actionTo.set(...nextAction.to);
    }

    updateRemotePlayerObject(object, delta) {
        if (object.targetPosition && object.targetQuaternion) {
            object.group.position.lerp(object.targetPosition, Math.min(1, delta * 5));
            object.group.quaternion.slerp(object.targetQuaternion, Math.min(1, delta * 5));
            return;
        }

        this.updateRemoteMovementAction(object, delta);
    }

    updateNetwork(delta) {
        if (!this.presenceUrl) return;

        this.networkElapsed += delta;
        if (this.networkElapsed < 0.7 || this.networkBusy) return;

        this.networkElapsed = 0;
        this.networkBusy = true;

        fetch(this.presenceUrl, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.getPresenceState()),
        })
            .then(() => fetch(this.presenceUrl, {
                credentials: 'same-origin',
                cache: 'no-store',
            }))
            .then((response) => response.ok ? response.json() : null)
            .then((data) => {
                if (data?.ok && Array.isArray(data.players)) {
                    this.syncRemotePlayers(data.players);
                }
            })
            .catch(() => {})
            .finally(() => {
                this.networkBusy = false;
            });
    }

    getPresenceState() {
        const position = this.controls.object.position;
        const rotation = this.controls.object.rotation;
        return {
            x: position.x,
            y: position.y,
            z: position.z,
            rx: rotation.x,
            ry: rotation.y,
            rz: rotation.z,
            online: true,
        };
    }

    syncRemotePlayers(players) {
        const seen = new Set();

        for (const player of players) {
            if (!player.user_id) continue;
            const id = String(player.user_id);
            seen.add(id);
            let object = this.remotePlayers.get(id);
            const nextAssetPath = this.normalizeAssetPath(player.ship_asset || 'images/naves/ship_00_raptor_classic_forward_idle.png');
            const nextShipModel = player.ship_model ?? '';
            if (object && (object.assetPath !== nextAssetPath || object.shipModel !== nextShipModel)) {
                this.removeRemotePlayer(id, object);
                object = null;
            }
            object = object ?? this.createRemotePlayer(player);
            const position = player.position ?? {};
            const rotation = player.rotation ?? {};
            object.name = player.username || object.name;
            object.ship = player.ship_name || object.ship;
            object.health = player.energy ?? object.health;
            object.ammo = player.ammo ?? object.ammo;
            object.targetPosition.set(position.x ?? object.group.position.x, position.y ?? object.group.position.y, position.z ?? object.group.position.z);
            object.targetQuaternion.setFromEuler(new THREE.Euler(rotation.x ?? 0, rotation.y ?? 0, rotation.z ?? 0, 'YXZ'));
        }

        for (const [id, object] of this.remotePlayers) {
            if (seen.has(id)) continue;
            this.removeRemotePlayer(id, object);
        }

        this.rebuildBodyIndex();
    }

    removeRemotePlayer(id, object) {
        object.alive = false;
        this.scene.remove(object.group);
        const targetMeshes = object.meshTargets ?? [];
        this.destructibleTargets = this.destructibleTargets.filter((target) => target !== object.sprite && !targetMeshes.includes(target));
        this.spaceObjects = this.spaceObjects.filter((spaceObject) => spaceObject !== object);
        this.remotePlayers.delete(id);
    }

    sendOfflinePresence() {
        if (!this.presenceUrl) return;

        const payload = JSON.stringify({ ...this.getPresenceState(), online: false });
        if (navigator.sendBeacon) {
            navigator.sendBeacon(this.presenceUrl, new Blob([payload], { type: 'application/json' }));
            return;
        }

        fetch(this.presenceUrl, {
            method: 'POST',
            credentials: 'same-origin',
            keepalive: true,
            headers: { 'Content-Type': 'application/json' },
            body: payload,
        }).catch(() => {});
    }

    updateLaserBolts(delta) {
        for (let index = this.laserBolts.length - 1; index >= 0; index -= 1) {
            const bolt = this.laserBolts[index];
            bolt.age += delta;
            bolt.line.material.opacity = Math.max(0, 1 - bolt.age / bolt.life);
            if (bolt.age < bolt.life) continue;
            this.scene.remove(bolt.line);
            bolt.line.geometry.dispose();
            bolt.line.material.dispose();
            this.laserBolts.splice(index, 1);
        }

        for (let index = this.explosions.length - 1; index >= 0; index -= 1) {
            const explosion = this.explosions[index];
            explosion.age += delta;
            const pct = THREE.MathUtils.clamp(explosion.age / explosion.life, 0, 1);
            const scale = THREE.MathUtils.lerp(explosion.startScale, explosion.endScale, pct);
            explosion.sprite.scale.set(scale, scale, 1);
            explosion.sprite.material.opacity = Math.max(0, 1 - pct);
            if (pct < 1) continue;
            this.scene.remove(explosion.sprite);
            explosion.sprite.material.dispose();
            this.explosions.splice(index, 1);
        }
    }

    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
        if (this.hud) {
            this.hud.resize(width, height);
        }
    }

    render() {
        const delta = Math.min(this.clock.getDelta(), 0.05);
        this.fireCooldown = Math.max(0, this.fireCooldown - delta);

        for (const planet of this.planetMeshes) {
            planet.mesh.rotation.y += planet.speed * delta;
        }

        for (const moonSystem of this.moonSystems) {
            moonSystem.orbit.rotation.y += moonSystem.speed * delta;
        }

        this.updateAutopilot(delta);
        this.updateDocking(delta);
        this.updatePlayerShip(delta);
        this.updateSpaceObjects(delta);
        this.updateLaserBolts(delta);
        this.updateColliders();
        this.controls.update(delta);
        this.updateNetwork(delta);
        this.updateDockButton();
        if (this.hud) {
            this.hud.setBodies(this.getBodySnapshots());
            this.hud.update({
                shipPosition: this.controls.object.position,
                shipSpeed: this.controls.getSpeed(),
            });
        }
        this.renderer.render(this.scene, this.camera);
    }
}
