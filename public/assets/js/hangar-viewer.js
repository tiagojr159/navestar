import * as THREE from 'three';
import { createProceduralShipMesh } from './scene/ProceduralShips.js';

const canvas = document.querySelector('[data-hangar-viewer]');

if (canvas) {
    const model = canvas.dataset.shipModel || 'css_3d_voyager';
    const gltfPath = canvas.dataset.shipGltf || '';
    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 5000);
    const rig = new THREE.Group();
    scene.add(rig);

    let ship = createProceduralShipMesh(model, 640);
    ship.rotation.set(-0.18, Math.PI * 0.82, 0.08);
    rig.add(ship);

    const ambient = new THREE.HemisphereLight('#c9fbff', '#10202a', 1.7);
    scene.add(ambient);

    const key = new THREE.DirectionalLight('#ffffff', 4.2);
    key.position.set(420, 680, 520);
    key.castShadow = true;
    scene.add(key);

    const rim = new THREE.DirectionalLight('#54f2ff', 2.4);
    rim.position.set(-520, 260, -420);
    scene.add(rim);

    const engineGlow = new THREE.PointLight('#ff9f4c', 2.8, 1800, 2);
    engineGlow.position.set(0, -160, 520);
    rig.add(engineGlow);

    const floor = new THREE.Mesh(
        new THREE.CircleGeometry(760, 80),
        new THREE.MeshBasicMaterial({
            color: '#40e8d0',
            transparent: true,
            opacity: 0.055,
            depthWrite: false,
        }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -260;
    scene.add(floor);

    const stars = createStarField();
    scene.add(stars);

    const pointer = {
        active: false,
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
    };

    async function loadGltfShip(path) {
        try {
            const { GLTFLoader } = await import('../../vendor/GLTFLoader.js');
            const loader = new GLTFLoader();
            const gltf = await loader.loadAsync(path);
            rig.remove(ship);
            ship = gltf.scene;
            ship.traverse((child) => {
                child.frustumCulled = false;
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            ship.rotation.set(-0.18, Math.PI * 0.82, 0.08);
            rig.add(ship);
            resize();
        } catch (error) {
            console.warn('Nao foi possivel carregar o GLB/GLTF da nave. Usando fallback procedural.', error);
        }
    }

    function resize() {
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(1, Math.floor(rect.width));
        const height = Math.max(1, Math.floor(rect.height));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        fitCameraToShip(width, height);
    }

    function fitCameraToShip(width, height) {
        const box = new THREE.Box3().setFromObject(ship);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        ship.position.sub(center);

        const maxSize = Math.max(size.x, size.y, size.z);
        const viewFactor = width < 640 ? 1.25 : 0.72;
        camera.position.set(0, maxSize * 0.16, maxSize * viewFactor);
        camera.lookAt(0, 0, 0);
    }

    function createStarField() {
        const geometry = new THREE.BufferGeometry();
        const count = 480;
        const positions = new Float32Array(count * 3);

        for (let index = 0; index < count; index += 1) {
            const offset = index * 3;
            positions[offset] = (Math.random() - 0.5) * 2600;
            positions[offset + 1] = (Math.random() - 0.5) * 1600;
            positions[offset + 2] = -600 - Math.random() * 1800;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        return new THREE.Points(
            geometry,
            new THREE.PointsMaterial({
                color: '#d8fbff',
                size: 4,
                transparent: true,
                opacity: 0.64,
                depthWrite: false,
            }),
        );
    }

    canvas.addEventListener('pointermove', (event) => {
        const rect = canvas.getBoundingClientRect();
        pointer.active = true;
        pointer.targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.95;
        pointer.targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.52;
    });

    canvas.addEventListener('pointerleave', () => {
        pointer.active = false;
        pointer.targetX = 0;
        pointer.targetY = 0;
    });

    function animate() {
        const time = performance.now() * 0.001;
        pointer.x = THREE.MathUtils.lerp(pointer.x, pointer.targetX, 0.08);
        pointer.y = THREE.MathUtils.lerp(pointer.y, pointer.targetY, 0.08);

        rig.rotation.y = time * 0.24 + pointer.x;
        rig.rotation.x = -0.08 + pointer.y;
        rig.rotation.z = Math.sin(time * 1.4) * 0.035;
        floor.material.opacity = 0.05 + Math.sin(time * 1.8) * 0.018;

        const thrusters = ship.userData?.thrusters;
        for (const plume of thrusters?.main ?? []) {
            plume.material.opacity = 0.72 + Math.sin(time * 18) * 0.16;
            plume.scale.y = 1.25 + Math.sin(time * 22) * 0.18;
        }

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    resize();
    if (gltfPath) {
        loadGltfShip(gltfPath);
    }
    window.addEventListener('resize', resize);
    animate();
}
