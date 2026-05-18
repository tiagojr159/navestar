import * as THREE from 'three';

export function isProceduralShipModel(model) {
    return typeof model === 'string' && model.startsWith('css_3d_');
}

export function createProceduralShipMesh(model, size = 154) {
    switch (model) {
        case 'css_3d_cargueira':
            return createCargoShip(size);
        case 'css_3d_transporte':
            return createTransportShip(size);
        case 'css_3d_destroyer':
            return createDestroyerShip(size);
        case 'css_3d_interceptor':
            return createInterceptorShip(size);
        case 'css_3d_alienigena':
            return createAlienShip(size);
        case 'css_3d_voyager':
        default:
            return createVoyagerShip(size);
    }
}

function makeMaterials(palette = {}) {
    return {
        hull: new THREE.MeshPhongMaterial({
            color: palette.hull ?? '#dfe7eb',
            emissive: palette.hullEmissive ?? '#314047',
            shininess: 84,
            specular: palette.hullSpecular ?? '#9fc8d6',
        }),
        panel: new THREE.MeshPhongMaterial({
            color: palette.panel ?? '#4f6572',
            emissive: palette.panelEmissive ?? '#1b2a31',
            shininess: 48,
            specular: '#8ea9b6',
        }),
        dark: new THREE.MeshPhongMaterial({
            color: palette.dark ?? '#1a242d',
            emissive: palette.darkEmissive ?? '#0d1419',
            shininess: 42,
            specular: '#53626c',
        }),
        glass: new THREE.MeshPhongMaterial({
            color: palette.glass ?? '#72e8ff',
            emissive: palette.glassEmissive ?? '#114b66',
            shininess: 128,
            specular: '#d9fbff',
            transparent: true,
            opacity: 0.92,
        }),
        engine: new THREE.MeshPhongMaterial({
            color: palette.engine ?? '#ff9a42',
            emissive: palette.engineEmissive ?? '#ff7432',
            shininess: 110,
            specular: '#ffd3b0',
        }),
        glow: new THREE.MeshBasicMaterial({
            color: palette.glow ?? '#66f1ff',
            transparent: true,
            opacity: 0.12,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
        sideGlow: new THREE.MeshBasicMaterial({
            color: palette.sideGlow ?? '#7de8ff',
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
    });
    return ship;
}

function addBox(ship, material, size, position, rotation = [0, 0, 0]) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    ship.add(mesh);
    return mesh;
}

function makeWingGeometry(size, span = 0.58, sweep = 0.22, thickness = 0.055) {
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(size * 0.1, size * 0.05);
    wingShape.lineTo(size * span, size * sweep);
    wingShape.lineTo(size * 0.42, size * 0.09);
    wingShape.lineTo(size * 0.12, size * 0.08);
    wingShape.closePath();

    const geometry = new THREE.ExtrudeGeometry(wingShape, {
        depth: size * thickness,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: size * 0.018,
        bevelThickness: size * 0.012,
    });
    geometry.center();
    return geometry;
}

function addThruster(ship, material, position, radius, length, collection) {
    const plume = new THREE.Mesh(
        new THREE.ConeGeometry(radius, length, 18, 1, true),
        material.clone(),
    );
    plume.rotation.x = Math.PI / 2;
    plume.position.set(...position);
    ship.add(plume);
    collection.push(plume);
    return plume;
}

function addSideThruster(ship, material, side, size, collection) {
    const plume = new THREE.Mesh(
        new THREE.ConeGeometry(size * 0.028, size * 0.12, 12, 1, true),
        material.clone(),
    );
    plume.rotation.z = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    plume.position.set(side * size * 0.52, 0, size * 0.16);
    ship.add(plume);
    collection.push(plume);
    return plume;
}

function addFighterCore(ship, size, materials, options = {}) {
    const mainThrusters = [];
    const leftThrusters = [];
    const rightThrusters = [];
    const bodyRadius = options.bodyRadius ?? 0.14;
    const bodyLength = options.bodyLength ?? 0.68;

    const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(size * bodyRadius, size * bodyLength, 8, 16), materials.hull);
    fuselage.rotation.x = Math.PI / 2;
    fuselage.scale.set(options.bodyScaleX ?? 1.1, options.bodyScaleY ?? 0.42, 1);
    ship.add(fuselage);

    addBox(ship, materials.dark, [size * 0.25, size * 0.08, size * 0.62], [0, -size * 0.055, size * 0.02]);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(size * 0.12, size * 0.34, 7), materials.hull);
    nose.rotation.x = -Math.PI / 2;
    nose.position.z = -size * 0.5;
    ship.add(nose);

    addBox(ship, materials.dark, [size * 0.18, size * 0.08, size * 0.24], [0, size * 0.07, -size * 0.1]);
    const canopy = new THREE.Mesh(new THREE.OctahedronGeometry(size * 0.1, 0), materials.glass);
    canopy.scale.set(0.9, 0.5, 1.6);
    canopy.position.set(0, size * 0.12, -size * 0.1);
    ship.add(canopy);

    addBox(ship, materials.hull, [size * 0.13, size * 0.1, size * 0.55], [0, size * 0.03, size * 0.04]);
    addBox(ship, materials.dark, [size * 0.05, size * 0.18, size * 0.18], [0, size * 0.16, size * 0.23], [0, 0, Math.PI / 8]);

    const wingGeometry = makeWingGeometry(size, options.wingSpan ?? 0.58, options.wingSweep ?? 0.23, options.wingThickness ?? 0.05);
    for (const side of [-1, 1]) {
        const wing = new THREE.Mesh(wingGeometry, options.darkWings ? materials.dark : materials.hull);
        wing.position.set(side * size * 0.18, -size * 0.015, size * (options.wingZ ?? 0.02));
        wing.rotation.set(side * 0.08, side > 0 ? Math.PI : 0, side * (options.wingTilt ?? -0.25));
        ship.add(wing);

        addBox(ship, materials.dark, [size * 0.05, size * 0.12, size * 0.22], [side * size * 0.5, size * 0.02, size * 0.08], [0, 0, side * -0.58]);

        const engine = new THREE.Mesh(new THREE.CylinderGeometry(size * 0.06, size * 0.08, size * 0.22, 18), materials.dark);
        engine.rotation.x = Math.PI / 2;
        engine.position.set(side * size * 0.14, -size * 0.045, size * 0.32);
        ship.add(engine);

        const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(size * 0.045, size * 0.055, size * 0.055, 18), materials.engine);
        nozzle.rotation.x = Math.PI / 2;
        nozzle.position.set(side * size * 0.14, -size * 0.045, size * 0.44);
        ship.add(nozzle);

        addThruster(ship, materials.glow, [side * size * 0.14, -size * 0.045, size * 0.56], size * 0.05, size * 0.22, mainThrusters);
        addSideThruster(ship, materials.sideGlow, side, size, side > 0 ? rightThrusters : leftThrusters);
    }

    addThruster(ship, materials.glow, [0, -size * 0.055, size * 0.53], size * 0.044, size * 0.18, mainThrusters);
    return { main: mainThrusters, left: leftThrusters, right: rightThrusters };
}

function createVoyagerShip(size) {
    const ship = new THREE.Group();
    const thrusters = addFighterCore(ship, size, makeMaterials(), {
        wingSpan: 0.54,
        wingSweep: 0.28,
        wingThickness: 0.04,
    });
    return finishShip(ship, thrusters);
}

function createTransportShip(size) {
    const ship = new THREE.Group();
    const materials = makeMaterials({
        hull: '#d8e3e8',
        hullEmissive: '#24333a',
        panel: '#4f6572',
        dark: '#23303a',
    });
    const thrusters = addFighterCore(ship, size, materials, {
        bodyRadius: 0.1,
        bodyLength: 0.62,
        bodyScaleX: 1.24,
        bodyScaleY: 0.38,
        wingSpan: 0.64,
        wingSweep: 0.22,
        wingThickness: 0.06,
    });

    addBox(ship, materials.panel, [size * 0.42, size * 0.16, size * 0.12], [0, size * 0.01, size * 0.36]);
    addBox(ship, materials.glass, [size * 0.12, size * 0.025, size * 0.6], [0, size * 0.145, size * 0.02]);
    addBox(ship, materials.panel, [size * 0.04, size * 0.26, size * 0.16], [0, size * 0.24, size * 0.29], [0, 0, Math.PI / 10]);
    return finishShip(ship, thrusters);
}

function createCargoShip(size) {
    const ship = new THREE.Group();
    const materials = makeMaterials({
        hull: '#c6d0d7',
        panel: '#44535d',
        dark: '#253039',
        glow: '#66f1ff',
    });
    const thrusters = { main: [], left: [], right: [] };

    const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(size * 0.12, size * 0.62, 8, 16), materials.hull);
    fuselage.rotation.x = Math.PI / 2;
    fuselage.scale.set(1.35, 0.48, 1);
    ship.add(fuselage);

    addBox(ship, materials.dark, [size * 0.58, size * 0.12, size * 0.26], [0, size * 0.03, 0]);
    addBox(ship, materials.panel, [size * 0.16, size * 0.12, size * 0.16], [-size * 0.18, size * 0.12, -size * 0.06]);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(size * 0.12, size * 0.34, 7), materials.hull);
    nose.rotation.x = -Math.PI / 2;
    nose.position.z = -size * 0.5;
    ship.add(nose);

    const wingGeometry = makeWingGeometry(size, 0.52, 0.14, 0.05);
    for (const side of [-1, 1]) {
        addBox(ship, materials.hull, [size * 0.24, size * 0.18, size * 0.18], [-size * 0.04, -size * 0.02, side * size * 0.34]);
        const wing = new THREE.Mesh(wingGeometry, materials.dark);
        wing.position.set(size * 0.02, -size * 0.04, side * size * 0.14);
        wing.rotation.set(side * 0.08, side > 0 ? Math.PI : 0, side * 0.22);
        ship.add(wing);

        const engine = new THREE.Mesh(new THREE.CylinderGeometry(size * 0.08, size * 0.095, size * 0.28, 16), materials.dark);
        engine.rotation.x = Math.PI / 2;
        engine.position.set(size * 0.3, -size * 0.01, side * size * 0.18);
        ship.add(engine);
        addThruster(ship, materials.glow, [size * 0.3, -size * 0.01, side * size * 0.5], size * 0.06, size * 0.24, thrusters.main);
        addSideThruster(ship, materials.sideGlow, side, size, side > 0 ? thrusters.right : thrusters.left);
    }

    return finishShip(ship, thrusters);
}

function createDestroyerShip(size) {
    const ship = new THREE.Group();
    const materials = makeMaterials({
        hull: '#c8d4db',
        panel: '#536671',
        dark: '#26323b',
    });
    const thrusters = { main: [], left: [], right: [] };

    addBox(ship, materials.hull, [size * 0.76, size * 0.18, size * 0.3], [0, 0, size * 0.02]);
    addBox(ship, materials.dark, [size * 0.62, size * 0.14, size * 0.22], [0, size * 0.08, size * 0.06]);
    const bow = new THREE.Mesh(new THREE.ConeGeometry(size * 0.14, size * 0.48, 6), materials.hull);
    bow.rotation.x = -Math.PI / 2;
    bow.position.z = -size * 0.46;
    ship.add(bow);
    addBox(ship, materials.dark, [size * 0.2, size * 0.12, size * 0.26], [0, size * 0.16, -size * 0.16]);
    addBox(ship, materials.glass, [size * 0.12, size * 0.08, size * 0.14], [0, size * 0.2, -size * 0.24]);

    const wingGeometry = makeWingGeometry(size, 0.62, 0.18, 0.06);
    for (const side of [-1, 1]) {
        const wing = new THREE.Mesh(wingGeometry, materials.dark);
        wing.position.set(side * size * 0.22, -size * 0.06, size * 0.08);
        wing.rotation.set(side * 0.06, side > 0 ? Math.PI : 0, side * 0.18);
        ship.add(wing);
        addThruster(ship, materials.glow, [side * size * 0.18, -size * 0.05, size * 0.56], size * 0.06, size * 0.24, thrusters.main);
        addSideThruster(ship, materials.sideGlow, side, size, side > 0 ? thrusters.right : thrusters.left);
    }
    addThruster(ship, materials.glow, [0, -size * 0.06, size * 0.62], size * 0.07, size * 0.3, thrusters.main);
    return finishShip(ship, thrusters);
}

function createInterceptorShip(size) {
    const ship = new THREE.Group();
    const thrusters = addFighterCore(ship, size, makeMaterials({
        hull: '#e7f2f6',
        dark: '#22303a',
        panel: '#597380',
    }), {
        bodyRadius: 0.11,
        bodyLength: 0.64,
        bodyScaleX: 0.98,
        bodyScaleY: 0.44,
        wingSpan: 0.7,
        wingSweep: 0.22,
        darkWings: true,
        wingTilt: -0.26,
    });
    return finishShip(ship, thrusters);
}

function createAlienShip(size) {
    const ship = new THREE.Group();
    const materials = makeMaterials({
        hull: '#8b5cff',
        hullEmissive: '#25154a',
        panel: '#d8ecff',
        dark: '#221834',
        glow: '#c46fff',
        sideGlow: '#ff7bff',
    });
    const thrusters = { main: [], left: [], right: [] };

    const body = new THREE.Mesh(new THREE.SphereGeometry(size * 0.14, 20, 14), materials.hull);
    body.scale.set(2.1, 0.68, 1.18);
    ship.add(body);

    const spine = new THREE.Mesh(new THREE.TorusGeometry(size * 0.14, size * 0.03, 10, 22), materials.panel);
    spine.rotation.x = Math.PI / 2;
    ship.add(spine);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(size * 0.045, 16, 12), materials.panel);
    eye.position.set(0, size * 0.06, -size * 0.18);
    ship.add(eye);

    for (const side of [-1, 1]) {
        addBox(ship, materials.dark, [size * 0.24, size * 0.05, size * 0.3], [side * size * 0.25, -size * 0.02, size * 0.02], [0, 0, side * 0.28]);
        addThruster(ship, materials.glow, [side * size * 0.1, -size * 0.03, size * 0.5], size * 0.055, size * 0.22, thrusters.main);
        addSideThruster(ship, materials.sideGlow, side, size, side > 0 ? thrusters.right : thrusters.left);
    }

    const coreGlow = new THREE.Mesh(new THREE.SphereGeometry(size * 0.1, 16, 12), materials.glow);
    coreGlow.scale.set(1.2, 0.7, 1);
    coreGlow.position.set(0, -size * 0.02, size * 0.1);
    ship.add(coreGlow);
    thrusters.main.push(coreGlow);
    return finishShip(ship, thrusters);
}
