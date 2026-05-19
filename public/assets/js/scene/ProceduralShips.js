import * as THREE from 'three';

export function isProceduralShipModel(model) {
    return typeof model === 'string' && model.startsWith('css_3d_');
}

export function createProceduralShipMesh(model, size = 154) {
    switch (model) {
        case 'css_3d_cargueira':
            return createAtlasCargo(size);
        case 'css_3d_transporte':
            return createOrionTransport(size);
        case 'css_3d_destroyer':
            return createAresDestroyer(size);
        case 'css_3d_interceptor':
            return createLynxInterceptor(size);
        case 'css_3d_alienigena':
            return createVantaAlien(size);
        case 'css_3d_voyager':
        default:
            return createVoyager(size);
    }
}

function makeMaterials(palette = {}) {
    return {
        hull: new THREE.MeshStandardMaterial({
            color: palette.hull ?? '#d9eef4',
            emissive: palette.hullEmissive ?? '#24414c',
            emissiveIntensity: palette.hullIntensity ?? 0.42,
            roughness: palette.roughness ?? 0.34,
            metalness: palette.metalness ?? 0.62,
        }),
        dark: new THREE.MeshStandardMaterial({
            color: palette.dark ?? '#2e4653',
            emissive: palette.darkEmissive ?? '#182c35',
            emissiveIntensity: palette.darkIntensity ?? 0.58,
            roughness: 0.48,
            metalness: 0.78,
        }),
        armor: new THREE.MeshStandardMaterial({
            color: palette.armor ?? '#95b3bf',
            emissive: palette.armorEmissive ?? '#203944',
            emissiveIntensity: palette.armorIntensity ?? 0.44,
            roughness: 0.42,
            metalness: 0.7,
        }),
        accent: new THREE.MeshStandardMaterial({
            color: palette.accent ?? '#65f3ff',
            emissive: palette.accentEmissive ?? palette.accent ?? '#19c7df',
            emissiveIntensity: palette.accentIntensity ?? 0.9,
            roughness: 0.22,
            metalness: 0.38,
        }),
        glass: new THREE.MeshPhysicalMaterial({
            color: palette.glass ?? '#72e9ff',
            emissive: palette.glassEmissive ?? '#0c4058',
            emissiveIntensity: 0.45,
            roughness: 0.08,
            metalness: 0.05,
            transmission: 0.24,
            transparent: true,
            opacity: 0.78,
            clearcoat: 0.85,
            clearcoatRoughness: 0.08,
        }),
        engine: new THREE.MeshStandardMaterial({
            color: palette.engine ?? '#263a45',
            emissive: palette.engineEmissive ?? '#172832',
            emissiveIntensity: palette.engineIntensity ?? 0.55,
            roughness: 0.32,
            metalness: 0.86,
        }),
        nozzle: new THREE.MeshStandardMaterial({
            color: palette.nozzle ?? '#ffb05f',
            emissive: palette.nozzleEmissive ?? '#ff6a20',
            emissiveIntensity: 1.15,
            roughness: 0.2,
            metalness: 0.48,
        }),
        plume: new THREE.MeshBasicMaterial({
            color: palette.plume ?? '#72f8ff',
            transparent: true,
            opacity: 0.28,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
        sidePlume: new THREE.MeshBasicMaterial({
            color: palette.sidePlume ?? '#8cfaff',
            transparent: true,
            opacity: 0.04,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    };
}

function finishShip(ship, thrusters) {
    ship.userData.thrusters = thrusters;
    ship.traverse((child) => {
        child.frustumCulled = false;
        if (!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;
    });
    return ship;
}

function createThrusterPack() {
    return { main: [], left: [], right: [] };
}

function addBox(group, material, scale, position, rotation = [0, 0, 0]) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...scale), material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    group.add(mesh);
    return mesh;
}

function addBeveledBox(group, material, scale, position, rotation = [0, 0, 0], bevelRatio = 0.08) {
    const [width, height, depth] = scale;
    const bevel = Math.min(width, height) * bevelRatio;
    const halfWidth = width * 0.5;
    const halfHeight = height * 0.5;
    const shape = new THREE.Shape();

    shape.moveTo(-halfWidth + bevel, -halfHeight);
    shape.lineTo(halfWidth - bevel, -halfHeight);
    shape.lineTo(halfWidth, -halfHeight + bevel);
    shape.lineTo(halfWidth, halfHeight - bevel);
    shape.lineTo(halfWidth - bevel, halfHeight);
    shape.lineTo(-halfWidth + bevel, halfHeight);
    shape.lineTo(-halfWidth, halfHeight - bevel);
    shape.lineTo(-halfWidth, -halfHeight + bevel);
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: Math.min(bevel * 0.35, depth * 0.08),
        bevelThickness: Math.min(bevel * 0.28, depth * 0.06),
        steps: 1,
    });
    geometry.center();
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    group.add(mesh);
    return mesh;
}

function addCapsule(group, material, radius, length, position, scale = [1, 1, 1], rotation = [Math.PI / 2, 0, 0], radialSegments = 16) {
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, radialSegments, 28), material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.scale.set(...scale);
    group.add(mesh);
    return mesh;
}

function addCone(group, material, radius, length, position, scale = [1, 1, 1], segments = 32) {
    const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, length, segments), material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    group.add(mesh);
    return mesh;
}

function addEngine(group, materials, side, size, options, thrusters) {
    const spread = options.spread ?? size * 0.17;
    const y = options.y ?? -size * 0.052;
    const z = options.z ?? size * 0.36;
    const radius = options.radius ?? size * 0.052;
    const length = options.length ?? size * 0.25;

    addCapsule(group, materials.engine, radius, length, [side * spread, y, z], [0.92, 0.92, 1], [Math.PI / 2, 0, 0], 12);

    const collar = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.98, radius * 0.2, 10, 28), materials.armor);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(side * spread, y, z + length * 0.52);
    group.add(collar);

    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.72, radius * 0.98, size * 0.06, 28), materials.nozzle);
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(side * spread, y, z + length * 0.65);
    group.add(nozzle);

    const plume = createPlume(radius * 0.92, options.plumeLength ?? size * 0.34, materials.plume);
    plume.position.set(side * spread, y, z + length * 1.08);
    group.add(plume);
    thrusters.main.push(plume);

    const sidePlume = createPlume(size * 0.022, size * 0.13, materials.sidePlume);
    sidePlume.rotation.set(0, 0, side > 0 ? Math.PI / 2 : -Math.PI / 2);
    sidePlume.position.set(side * (options.sideSpread ?? size * 0.58), -size * 0.002, options.sideZ ?? size * 0.1);
    group.add(sidePlume);
    if (side > 0) thrusters.right.push(sidePlume);
    else thrusters.left.push(sidePlume);
}

function createWingGeometry(size, points, thickness, bevel = 0.016) {
    const shape = new THREE.Shape();
    points.forEach(([x, y], index) => {
        const px = size * x;
        const py = size * y;
        if (index === 0) shape.moveTo(px, py);
        else shape.lineTo(px, py);
    });
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: size * thickness,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: size * bevel,
        bevelThickness: size * 0.012,
    });
    geometry.center();
    geometry.computeVertexNormals();
    return geometry;
}

function addWingPair(group, material, size, geometry, options = {}) {
    for (const side of [-1, 1]) {
        const wing = new THREE.Mesh(geometry, material);
        wing.position.set(side * (options.x ?? size * 0.19), options.y ?? -size * 0.02, options.z ?? -size * 0.015);
        wing.rotation.set(side * (options.rx ?? 0.08), side > 0 ? Math.PI : 0, side * (options.rz ?? -0.22));
        group.add(wing);
    }
}

function addSideFairings(group, material, size, options = {}) {
    for (const side of [-1, 1]) {
        addBeveledBox(
            group,
            material,
            options.scale ?? [size * 0.18, size * 0.075, size * 0.42],
            [side * (options.x ?? size * 0.14), options.y ?? -size * 0.035, options.z ?? size * 0.08],
            [options.rx ?? 0, options.ry ?? 0, side * (options.rz ?? -0.12)],
            options.bevel ?? 0.08,
        );
    }
}

function addLightStrips(group, materials, size, rows = 3, zStart = 0.02) {
    const stripGeometry = new THREE.BoxGeometry(size * 0.028, size * 0.014, size * 0.13);
    for (const side of [-1, 1]) {
        for (let index = 0; index < rows; index += 1) {
            const strip = new THREE.Mesh(stripGeometry, materials.accent);
            strip.position.set(side * size * (0.055 + index * 0.035), size * 0.112, size * (zStart + index * 0.08));
            strip.rotation.y = side * 0.08;
            group.add(strip);
        }
    }
}

function createPlume(radius, length, material) {
    const plume = new THREE.Mesh(new THREE.ConeGeometry(radius, length, 28, 1, true), material.clone());
    plume.rotation.x = Math.PI / 2;
    return plume;
}

function createVoyager(size) {
    const ship = new THREE.Group();
    const materials = makeMaterials();
    const thrusters = createThrusterPack();

    addCapsule(ship, materials.hull, size * 0.12, size * 0.78, [0, 0, 0], [0.78, 0.46, 1]);
    addCone(ship, materials.hull, size * 0.105, size * 0.42, [0, 0, -size * 0.62], [0.74, 0.9, 1]);
    addCapsule(ship, materials.dark, size * 0.062, size * 0.62, [0, -size * 0.075, size * 0.04], [1.45, 0.45, 1]);
    addCapsule(ship, materials.armor, size * 0.045, size * 0.52, [0, size * 0.082, size * 0.03], [1.25, 0.42, 1]);
    addBeveledBox(ship, materials.dark, [size * 0.42, size * 0.08, size * 0.5], [0, -size * 0.04, size * 0.12], [0, 0, 0], 0.08);
    addSideFairings(ship, materials.hull, size, {
        scale: [size * 0.36, size * 0.1, size * 0.48],
        x: size * 0.095,
        y: -size * 0.035,
        z: size * 0.08,
        rz: -0.08,
    });
    addCockpit(ship, materials, size, [0, size * 0.105, -size * 0.25], [0.72, 0.26, 1.18], {
        baseMaterial: materials.hull,
        socketMaterial: materials.hull,
        baseHeight: size * 0.075,
        socketHeight: size * 0.052,
    });

    const wingGeometry = createWingGeometry(size, [[0, 0], [0.18, 0.07], [0.82, 0.33], [0.55, 0.12], [0.18, 0.1]], 0.055);
    const innerWingGeometry = createWingGeometry(size, [[0, 0], [0.12, 0.06], [0.46, 0.18], [0.34, 0.06], [0.1, 0.07]], 0.035);
    addWingPair(ship, materials.hull, size, wingGeometry, { x: size * 0.055, y: -size * 0.028, z: -size * 0.005, rz: -0.15 });
    addWingPair(ship, materials.dark, size, innerWingGeometry, { x: size * 0.065, y: -size * 0.046, z: size * 0.09, rz: -0.11 });
    addWingEdges(ship, materials, size, 0.48, 0.08);

    for (const side of [-1, 1]) {
        addBeveledBox(ship, materials.dark, [size * 0.17, size * 0.08, size * 0.3], [side * size * 0.075, -size * 0.065, size * 0.32], [0, 0, side * -0.02], 0.07);
        addEngine(ship, materials, side, size, { spread: size * 0.085, y: -size * 0.06, z: size * 0.36, sideSpread: size * 0.48 }, thrusters);
    }
    addBeveledBox(ship, materials.dark, [size * 0.28, size * 0.075, size * 0.18], [0, -size * 0.065, size * 0.45], [0, 0, 0], 0.06);
    addCenterEngine(ship, materials, size, thrusters, [0, -size * 0.075, size * 0.5], size * 0.04, size * 0.28);
    addDorsalFin(ship, materials.dark, size, [0, size * 0.14, size * 0.19]);
    addLightStrips(ship, materials, size);
    addNoseLight(ship, materials, size);

    return finishShip(ship, thrusters);
}

function createAtlasCargo(size) {
    const ship = new THREE.Group();
    const materials = makeMaterials({
        hull: '#3f4a4d',
        hullEmissive: '#111719',
        dark: '#171f22',
        armor: '#596265',
        accent: '#e56f1c',
        accentEmissive: '#7f2a08',
        glass: '#9fd4e2',
        plume: '#ff9a33',
        sidePlume: '#ffe2a0',
        roughness: 0.58,
        metalness: 0.72,
    });
    const thrusters = createThrusterPack();

    addBeveledBox(ship, materials.dark, [size * 0.54, size * 0.2, size * 0.9], [0, -size * 0.025, size * 0.04], [0, 0, 0], 0.1);
    addBeveledBox(ship, materials.hull, [size * 0.4, size * 0.22, size * 0.74], [0, size * 0.055, -size * 0.02], [0, 0, 0], 0.08);
    addBeveledBox(ship, materials.armor, [size * 0.26, size * 0.13, size * 0.48], [0, size * 0.185, -size * 0.1], [0, 0, 0], 0.1);
    addBeveledBox(ship, materials.dark, [size * 0.2, size * 0.08, size * 0.17], [0, size * 0.245, -size * 0.29], [0, 0, 0], 0.1);
    addCone(ship, materials.hull, size * 0.145, size * 0.3, [0, size * 0.015, -size * 0.6], [1.05, 0.75, 1], 6);
    addCockpit(ship, materials, size, [0, size * 0.24, -size * 0.31], [0.62, 0.18, 0.62]);

    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(size * 0.01, size * 0.014, size * 0.16, 12), materials.dark);
    antenna.position.set(0, size * 0.36, -size * 0.3);
    ship.add(antenna);

    for (let index = 0; index < 6; index += 1) {
        const z = -size * 0.32 + index * size * 0.12;
        const panel = addBox(ship, materials.armor, [size * 0.18, size * 0.012, size * 0.075], [0, size * 0.265, z]);
        panel.rotation.x = index % 2 === 0 ? 0.035 : -0.02;
    }

    for (const side of [-1, 1]) {
        for (let index = 0; index < 3; index += 1) {
            addBox(ship, materials.dark, [size * 0.035, size * 0.03, size * 0.1], [side * size * 0.18, size * 0.155, -size * 0.24 + index * size * 0.22]);
        }
    }

    for (const side of [-1, 1]) {
        addBeveledBox(ship, materials.hull, [size * 0.24, size * 0.18, size * 0.66], [side * size * 0.275, -size * 0.035, size * 0.035], [0, 0, 0], 0.1);
        addBeveledBox(ship, materials.dark, [size * 0.19, size * 0.145, size * 0.54], [side * size * 0.292, size * 0.055, size * 0.055], [0, 0, 0], 0.1);
        addBeveledBox(ship, materials.armor, [size * 0.18, size * 0.055, size * 0.39], [side * size * 0.292, size * 0.17, -size * 0.02], [0, 0, 0], 0.12);
        addBeveledBox(ship, materials.dark, [size * 0.1, size * 0.12, size * 0.18], [side * size * 0.292, size * 0.035, size * 0.405], [0, 0, 0], 0.08);

        addBeveledBox(ship, materials.dark, [size * 0.16, size * 0.14, size * 0.62], [side * size * 0.17, -size * 0.02, size * 0.045], [0, 0, 0], 0.06);
        addBeveledBox(ship, materials.hull, [size * 0.08, size * 0.1, size * 0.5], [side * size * 0.122, size * 0.045, size * 0.02], [0, 0, side * -0.03], 0.05);
        addBeveledBox(ship, materials.armor, [size * 0.07, size * 0.055, size * 0.32], [side * size * 0.12, size * 0.125, -size * 0.035], [0, 0, side * -0.04], 0.06);

        for (let stripe = 0; stripe < 4; stripe += 1) {
            addBox(
                ship,
                materials.accent,
                [size * 0.145, size * 0.012, size * 0.012],
                [side * size * 0.295, size * 0.198, -size * 0.16 + stripe * size * 0.07],
                [0, 0, side * -0.55],
            );
        }

        const rearPlate = addBeveledBox(ship, materials.dark, [size * 0.2, size * 0.13, size * 0.06], [side * size * 0.292, -size * 0.02, size * 0.395], [0, 0, 0], 0.08);
        rearPlate.rotation.x = 0.04;

        addEngine(ship, materials, side, size, {
            spread: size * 0.16,
            y: -size * 0.085,
            z: size * 0.43,
            radius: size * 0.072,
            length: size * 0.32,
            plumeLength: size * 0.4,
            sideSpread: size * 0.52,
            sideZ: size * 0.04,
        }, thrusters);

        addEngine(ship, materials, side, size, {
            spread: size * 0.36,
            y: -size * 0.055,
            z: size * 0.42,
            radius: size * 0.052,
            length: size * 0.24,
            plumeLength: size * 0.28,
            sideSpread: size * 0.56,
            sideZ: size * 0.05,
        }, thrusters);

        for (const offset of [-0.018, 0.018]) {
            const cannon = new THREE.Mesh(new THREE.CylinderGeometry(size * 0.012, size * 0.014, size * 0.18, 12), materials.engine);
            cannon.rotation.x = Math.PI / 2;
            cannon.position.set(side * size * 0.51 + side * offset * size, -size * 0.055, size * 0.47);
            ship.add(cannon);
        }
    }

    addBeveledBox(ship, materials.dark, [size * 0.72, size * 0.12, size * 0.12], [0, -size * 0.045, size * 0.43], [0, 0, 0], 0.06);
    addBeveledBox(ship, materials.armor, [size * 0.5, size * 0.06, size * 0.11], [0, size * 0.11, size * 0.35], [0, 0, 0], 0.08);

    const wingGeometry = createWingGeometry(size, [[0, 0], [0.14, 0.04], [0.54, 0.16], [0.38, 0.048], [0.1, 0.065]], 0.045);
    addWingPair(ship, materials.dark, size, wingGeometry, { x: size * 0.39, y: -size * 0.075, z: -size * 0.12, rz: -0.12 });
    addCenterEngine(ship, materials, size, thrusters, [0, -size * 0.11, size * 0.54], size * 0.075, size * 0.42);
    addBox(ship, materials.accent, [size * 0.035, size * 0.012, size * 0.12], [0, size * 0.286, -size * 0.08]);
    addNoseLight(ship, materials, size);

    return finishShip(ship, thrusters);
}

function createOrionTransport(size) {
    const ship = new THREE.Group();
    const materials = makeMaterials({
        hull: '#e4f1f4',
        hullEmissive: '#1c3038',
        dark: '#22313a',
        armor: '#5f7d8a',
        accent: '#48d8ff',
        glass: '#a6f5ff',
    });
    const thrusters = createThrusterPack();

    addCapsule(ship, materials.hull, size * 0.1, size * 0.68, [0, 0, -size * 0.03], [1.32, 0.36, 1]);
    addBeveledBox(ship, materials.armor, [size * 0.38, size * 0.085, size * 0.6], [0, size * 0.045, -size * 0.01], [0, 0, 0], 0.08);
    addBeveledBox(ship, materials.dark, [size * 0.38, size * 0.09, size * 0.52], [0, -size * 0.072, size * 0.06], [0, 0, 0], 0.08);
    addSideFairings(ship, materials.hull, size, {
        scale: [size * 0.38, size * 0.095, size * 0.48],
        x: size * 0.09,
        y: -size * 0.035,
        z: size * 0.02,
        rz: -0.06,
    });
    addCone(ship, materials.hull, size * 0.1, size * 0.36, [0, 0, -size * 0.58], [0.7, 0.86, 1], 32);
    addCockpit(ship, materials, size, [0, size * 0.082, -size * 0.2], [0.82, 0.26, 1.05], {
        baseMaterial: materials.hull,
        socketMaterial: materials.hull,
        baseHeight: size * 0.078,
        socketHeight: size * 0.052,
    });

    const wingGeometry = createWingGeometry(size, [[0, 0], [0.16, 0.07], [0.74, 0.23], [0.55, 0.09], [0.16, 0.09]], 0.05);
    addWingPair(ship, materials.hull, size, wingGeometry, { x: size * 0.06, y: -size * 0.035, z: -size * 0.035, rz: -0.1 });
    addWingEdges(ship, materials, size, 0.42, 0.02);
    addBox(ship, materials.accent, [size * 0.11, size * 0.018, size * 0.56], [0, size * 0.102, size * 0.02]);

    for (const side of [-1, 1]) {
        addBeveledBox(ship, materials.dark, [size * 0.2, size * 0.085, size * 0.32], [side * size * 0.08, -size * 0.06, size * 0.27], [0, 0, side * -0.03], 0.08);
        addEngine(ship, materials, side, size, { spread: size * 0.09, y: -size * 0.062, z: size * 0.34, sideSpread: size * 0.5 }, thrusters);
    }
    addBeveledBox(ship, materials.dark, [size * 0.3, size * 0.075, size * 0.18], [0, -size * 0.065, size * 0.42], [0, 0, 0], 0.06);
    addCenterEngine(ship, materials, size, thrusters, [0, -size * 0.07, size * 0.5], size * 0.036, size * 0.24);
    addDorsalFin(ship, materials.dark, size, [0, size * 0.17, size * 0.28], 0.8);
    addLightStrips(ship, materials, size, 2, 0.04);

    return finishShip(ship, thrusters);
}

function createAresDestroyer(size) {
    const ship = new THREE.Group();
    const materials = makeMaterials({
        hull: '#aebfc7',
        hullEmissive: '#111b21',
        dark: '#17222a',
        armor: '#53646d',
        accent: '#ff6f52',
        accentEmissive: '#9f1f13',
        glass: '#7fdcff',
        plume: '#ff7f4f',
        sidePlume: '#ffaf80',
    });
    const thrusters = createThrusterPack();

    addCapsule(ship, materials.hull, size * 0.13, size * 0.92, [0, 0, size * 0.02], [1.08, 0.48, 1]);
    addBeveledBox(ship, materials.dark, [size * 0.52, size * 0.17, size * 0.76], [0, size * 0.02, size * 0.08], [0, 0, 0], 0.08);
    addBeveledBox(ship, materials.armor, [size * 0.34, size * 0.145, size * 0.24], [0, size * 0.16, -size * 0.18], [0, 0, 0], 0.08);
    addBeveledBox(ship, materials.dark, [size * 0.5, size * 0.08, size * 0.34], [0, size * 0.11, -size * 0.06], [0, 0, 0], 0.06);
    addSideFairings(ship, materials.dark, size, {
        scale: [size * 0.42, size * 0.12, size * 0.58],
        x: size * 0.105,
        y: -size * 0.045,
        z: size * 0.12,
        rz: 0.04,
        bevel: 0.06,
    });
    addCone(ship, materials.hull, size * 0.13, size * 0.48, [0, 0, -size * 0.68], [0.8, 0.82, 1], 6);
    addCockpit(ship, materials, size, [0, size * 0.145, -size * 0.25], [0.62, 0.24, 0.8], {
        baseMaterial: materials.armor,
        socketMaterial: materials.armor,
        baseHeight: size * 0.08,
        socketHeight: size * 0.055,
    });

    const wingGeometry = createWingGeometry(size, [[0, 0], [0.18, 0.07], [0.76, 0.18], [0.62, 0.06], [0.16, 0.08]], 0.07);
    addWingPair(ship, materials.dark, size, wingGeometry, { x: size * 0.07, y: -size * 0.07, z: size * 0.08, rz: 0.11, rx: 0.04 });

    for (const side of [-1, 1]) {
        addBeveledBox(ship, materials.armor, [size * 0.2, size * 0.075, size * 0.3], [side * size * 0.14, size * 0.145, -size * 0.08], [0, 0, side * 0.02], 0.08);
        addBeveledBox(ship, materials.accent, [size * 0.06, size * 0.035, size * 0.2], [side * size * 0.22, size * 0.18, -size * 0.17], [0, 0, side * 0.02], 0.08);
        addBeveledBox(ship, materials.dark, [size * 0.24, size * 0.09, size * 0.32], [side * size * 0.085, -size * 0.075, size * 0.34], [0, 0, side * -0.02], 0.06);
        addEngine(ship, materials, side, size, { spread: size * 0.1, y: -size * 0.08, z: size * 0.42, radius: size * 0.06, length: size * 0.28, sideSpread: size * 0.52 }, thrusters);
    }
    addBeveledBox(ship, materials.dark, [size * 0.36, size * 0.09, size * 0.2], [0, -size * 0.085, size * 0.48], [0, 0, 0], 0.06);
    addCenterEngine(ship, materials, size, thrusters, [0, -size * 0.09, size * 0.56], size * 0.07, size * 0.36);
    addDorsalFin(ship, materials.dark, size, [0, size * 0.2, size * 0.24], 1.15);

    return finishShip(ship, thrusters);
}

function createLynxInterceptor(size) {
    const ship = new THREE.Group();
    const materials = makeMaterials({
        hull: '#eef8fa',
        hullEmissive: '#1a3038',
        dark: '#17242d',
        armor: '#6d8792',
        accent: '#6cf7ff',
        glass: '#8df4ff',
    });
    const thrusters = createThrusterPack();

    addCapsule(ship, materials.hull, size * 0.105, size * 0.92, [0, 0, -size * 0.04], [0.82, 0.42, 1]);
    addCapsule(ship, materials.dark, size * 0.062, size * 0.76, [0, -size * 0.06, size * 0.05], [1.34, 0.52, 1]);
    addBeveledBox(ship, materials.hull, [size * 0.46, size * 0.12, size * 0.72], [0, -size * 0.012, size * 0.02], [0, 0, 0], 0.08);
    addBeveledBox(ship, materials.dark, [size * 0.42, size * 0.105, size * 0.62], [0, -size * 0.075, size * 0.12], [0, 0, 0], 0.06);
    addSideFairings(ship, materials.dark, size, {
        scale: [size * 0.34, size * 0.105, size * 0.58],
        x: size * 0.105,
        y: -size * 0.04,
        z: size * 0.055,
        rz: -0.08,
        bevel: 0.06,
    });
    addCone(ship, materials.hull, size * 0.08, size * 0.5, [0, 0, -size * 0.74], [0.52, 0.75, 1], 32);
    addCockpit(ship, materials, size, [0, size * 0.045, -size * 0.28], [0.82, 0.24, 1.18], {
        baseMaterial: materials.hull,
        socketMaterial: materials.hull,
        baseHeight: size * 0.095,
        socketHeight: size * 0.07,
    });

    const wingGeometry = createWingGeometry(size, [[0, 0], [0.14, 0.06], [0.92, 0.3], [0.48, 0.08], [0.1, 0.08]], 0.045);
    addWingPair(ship, materials.dark, size, wingGeometry, { x: size * 0.045, y: -size * 0.035, z: -size * 0.045, rz: -0.18, rx: 0.04 });

    for (const side of [-1, 1]) {
        addBeveledBox(ship, materials.accent, [size * 0.22, size * 0.018, size * 0.3], [side * size * 0.24, size * 0.022, -size * 0.075], [0, side * 0.08, side * -0.26], 0.05);
    }

    for (const side of [-1, 1]) {
        addBeveledBox(ship, materials.dark, [size * 0.2, size * 0.085, size * 0.34], [side * size * 0.085, -size * 0.06, size * 0.31], [0, 0, side * -0.03], 0.07);
        addEngine(ship, materials, side, size, { spread: size * 0.09, y: -size * 0.058, z: size * 0.38, radius: size * 0.047, length: size * 0.25, sideSpread: size * 0.54 }, thrusters);
    }
    addBeveledBox(ship, materials.dark, [size * 0.32, size * 0.075, size * 0.18], [0, -size * 0.062, size * 0.43], [0, 0, 0], 0.06);
    addCenterEngine(ship, materials, size, thrusters, [0, -size * 0.065, size * 0.55], size * 0.035, size * 0.26);
    addLightStrips(ship, materials, size, 3, -0.02);

    return finishShip(ship, thrusters);
}

function createVantaAlien(size) {
    const ship = new THREE.Group();
    const materials = makeMaterials({
        hull: '#9b74ff',
        hullEmissive: '#2d185d',
        dark: '#211638',
        armor: '#c6b0ff',
        accent: '#ff7cff',
        accentEmissive: '#9134ff',
        glass: '#e5d9ff',
        plume: '#d278ff',
        sidePlume: '#ff92ff',
        roughness: 0.28,
        metalness: 0.42,
    });
    const thrusters = createThrusterPack();

    const shell = new THREE.Mesh(new THREE.SphereGeometry(size * 0.18, 36, 18), materials.hull);
    shell.scale.set(1.8, 0.46, 1.18);
    ship.add(shell);

    const lowerShell = new THREE.Mesh(new THREE.SphereGeometry(size * 0.13, 32, 14), materials.dark);
    lowerShell.position.set(0, -size * 0.045, size * 0.08);
    lowerShell.scale.set(1.65, 0.32, 1.1);
    ship.add(lowerShell);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(size * 0.055, 24, 14), materials.glass);
    eye.position.set(0, size * 0.055, -size * 0.24);
    eye.scale.set(1.2, 0.58, 0.8);
    ship.add(eye);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(size * 0.19, size * 0.018, 12, 42), materials.armor);
    ring.rotation.x = Math.PI / 2;
    ring.position.z = size * 0.02;
    ship.add(ring);

    addBeveledBox(ship, materials.dark, [size * 0.34, size * 0.075, size * 0.24], [0, -size * 0.025, size * 0.18], [0, 0, 0], 0.1);
    addSideFairings(ship, materials.hull, size, {
        scale: [size * 0.3, size * 0.085, size * 0.32],
        x: size * 0.09,
        y: -size * 0.02,
        z: size * 0.1,
        rz: 0.05,
        bevel: 0.08,
    });

    const clawGeometry = createWingGeometry(size, [[0, 0], [0.16, 0.08], [0.68, 0.26], [0.44, 0.08], [0.12, 0.08]], 0.045, 0.012);
    addWingPair(ship, materials.dark, size, clawGeometry, { x: size * 0.07, y: -size * 0.025, z: size * 0.02, rz: 0.16, rx: 0.04 });

    for (const side of [-1, 1]) {
        addBeveledBox(ship, materials.dark, [size * 0.18, size * 0.075, size * 0.28], [side * size * 0.075, -size * 0.052, size * 0.31], [0, 0, side * -0.02], 0.08);
        addEngine(ship, materials, side, size, { spread: size * 0.085, y: -size * 0.055, z: size * 0.38, radius: size * 0.048, length: size * 0.22, sideSpread: size * 0.42 }, thrusters);
        const horn = new THREE.Mesh(new THREE.ConeGeometry(size * 0.026, size * 0.18, 16), materials.armor);
        horn.position.set(side * size * 0.1, size * 0.1, -size * 0.13);
        horn.rotation.set(-0.42, 0, side * 0.28);
        ship.add(horn);
    }

    const coreGlow = new THREE.Mesh(new THREE.SphereGeometry(size * 0.09, 24, 14), materials.plume);
    coreGlow.position.set(0, -size * 0.02, size * 0.18);
    coreGlow.scale.set(1.35, 0.62, 1);
    ship.add(coreGlow);
    thrusters.main.push(coreGlow);

    return finishShip(ship, thrusters);
}

function addCockpit(ship, materials, size, position, scale, options = {}) {
    const baseWidth = size * 0.085 * Math.max(scale[0] * 1.9, 1.1);
    const baseDepth = size * 0.085 * Math.max(scale[2] * 1.55, 1.25);
    const baseHeight = options.baseHeight ?? size * 0.055;
    const socketHeight = options.socketHeight ?? size * 0.04;
    const sink = options.sink ?? 0;
    const baseMaterial = options.baseMaterial ?? materials.hull;
    const socketMaterial = options.socketMaterial ?? materials.dark;
    const base = addBeveledBox(
        ship,
        baseMaterial,
        [baseWidth * 1.12, baseHeight, baseDepth * 1.08],
        [position[0], position[1] - size * 0.052 - sink, position[2] + size * 0.012],
        [0, 0, 0],
        0.1,
    );
    base.userData.part = 'cockpitBase';

    const socket = addBeveledBox(
        ship,
        socketMaterial,
        [baseWidth * 0.92, socketHeight, baseDepth * 0.82],
        [position[0], position[1] - size * 0.03 - sink, position[2] + size * 0.008],
        [0, 0, 0],
        0.08,
    );
    socket.userData.part = 'cockpitSocket';

    const capsule = addCapsule(ship, socketMaterial, size * 0.052, size * 0.18, [position[0], position[1] - size * 0.026 - sink, position[2]], [1.18, 0.42, 1], [Math.PI / 2, 0, 0], 10);
    capsule.userData.part = 'cockpitSocket';

    const canopy = new THREE.Mesh(new THREE.SphereGeometry(size * 0.085, 28, 14), materials.glass);
    canopy.position.set(position[0], position[1] - sink, position[2]);
    canopy.scale.set(...scale);
    canopy.userData.part = 'cockpitCanopy';
    canopy.userData.remoteYOffset = options.remoteYOffset ?? size * 0.095;
    ship.add(canopy);
}

function addWingEdges(ship, materials, size, x, z) {
    for (const side of [-1, 1]) {
        const edge = new THREE.Mesh(new THREE.BoxGeometry(size * 0.034, size * 0.024, size * 0.48), materials.accent);
        edge.position.set(side * size * x, size * 0.01, size * z);
        edge.rotation.set(0, side * 0.08, side * -0.42);
        ship.add(edge);

        addCapsule(ship, materials.dark, size * 0.026, size * 0.2, [side * size * (x + 0.15), 0, size * (z + 0.06)], [0.62, 0.62, 1], [Math.PI / 2, 0, 0], 8);
    }
}

function addCenterEngine(ship, materials, size, thrusters, position, radius, plumeLength) {
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.9, radius * 1.2, size * 0.055, 24), materials.nozzle);
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(...position);
    ship.add(nozzle);

    const plume = createPlume(radius, plumeLength, materials.plume);
    plume.position.set(position[0], position[1], position[2] + plumeLength * 0.58);
    ship.add(plume);
    thrusters.main.push(plume);
}

function addDorsalFin(ship, material, size, position, heightScale = 1) {
    const shape = new THREE.Shape();
    shape.moveTo(0, -size * 0.06);
    shape.lineTo(size * 0.035, size * 0.1 * heightScale);
    shape.lineTo(0, size * 0.18 * heightScale);
    shape.lineTo(-size * 0.035, size * 0.1 * heightScale);
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: size * 0.04,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: size * 0.01,
        bevelThickness: size * 0.008,
    });
    geometry.center();
    geometry.rotateX(Math.PI / 2);
    geometry.computeVertexNormals();

    const fin = new THREE.Mesh(geometry, material);
    fin.position.set(...position);
    ship.add(fin);
}

function addNoseLight(ship, materials, size) {
    const light = new THREE.Mesh(new THREE.SphereGeometry(size * 0.018, 16, 10), materials.accent);
    light.position.set(0, size * 0.02, -size * 0.78);
    ship.add(light);
}
