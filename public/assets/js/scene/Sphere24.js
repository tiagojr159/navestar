import * as THREE from 'three';

const PANEL_COUNT = 24;
const RADIUS = 1.35;
const FRONT_PHI = Math.PI / 2;
const PANEL_ARC = (Math.PI * 2) / PANEL_COUNT;

const PANEL_COLORS = [
    '#c84545',
    '#d58a37',
    '#d8c048',
    '#86b94e',
    '#35aa75',
    '#39a7a6',
    '#3d80bd',
    '#5f69c9',
    '#8059b6',
    '#b4519a',
    '#c45f78',
    '#b86743',
];

export class Sphere24 extends THREE.Group {
    constructor() {
        super();
        this.name = 'Sphere24';
        this.createPanels();
        this.createSeams();
        this.createLabels();
    }

    createPanels() {
        for (let index = 0; index < PANEL_COUNT; index += 1) {
            const centerPhi = FRONT_PHI + index * PANEL_ARC;
            const geometry = new THREE.SphereGeometry(
                RADIUS,
                12,
                28,
                centerPhi - PANEL_ARC / 2,
                PANEL_ARC * 0.94,
                0.02,
                Math.PI - 0.04,
            );

            const material = new THREE.MeshStandardMaterial({
                color: PANEL_COLORS[index % PANEL_COLORS.length],
                metalness: 0.08,
                roughness: 0.48,
                side: THREE.DoubleSide,
            });

            const panel = new THREE.Mesh(geometry, material);
            panel.castShadow = true;
            panel.receiveShadow = true;
            this.add(panel);
        }
    }

    createSeams() {
        const seamMaterial = new THREE.LineBasicMaterial({
            color: '#0c0f12',
            transparent: true,
            opacity: 0.95,
        });

        for (let index = 0; index < PANEL_COUNT; index += 1) {
            const phi = FRONT_PHI + (index - 0.5) * PANEL_ARC;
            const points = [];

            for (let step = 1; step < 48; step += 1) {
                const theta = (step / 48) * Math.PI;
                points.push(this.sphericalPoint(phi, theta, RADIUS + 0.012));
            }

            this.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), seamMaterial));
        }

        const equatorPoints = [];
        for (let step = 0; step <= 96; step += 1) {
            const phi = FRONT_PHI + (step / 96) * Math.PI * 2;
            equatorPoints.push(this.sphericalPoint(phi, Math.PI / 2, RADIUS + 0.014));
        }

        this.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(equatorPoints), seamMaterial));
    }

    createLabels() {
        const labelOrder = [
            1, 2, 3, 4, 5, 6,
            7, 8, 9, 10, 11, 24,
            12, 13, 14, 15, 16, 17,
            18, 19, 20, 21, 22, 23,
        ];

        for (let index = 0; index < PANEL_COUNT; index += 1) {
            const labelNumber = labelOrder[index];
            const phi = FRONT_PHI + index * PANEL_ARC;
            const label = this.createLabelMesh(labelNumber);
            const normal = this.sphericalPoint(phi, Math.PI / 2, 1).normalize();

            label.position.copy(normal).multiplyScalar(RADIUS + 0.045);
            label.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
            this.add(label);
        }
    }

    createLabelMesh(number) {
        const texture = this.createLabelTexture(number);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.58), material);
        mesh.renderOrder = 2;
        return mesh;
    }

    createLabelTexture(number) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;

        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'rgba(247, 250, 252, 0.94)';
        context.beginPath();
        context.arc(128, 128, 105, 0, Math.PI * 2);
        context.fill();

        context.lineWidth = 10;
        context.strokeStyle = 'rgba(7, 10, 12, 0.86)';
        context.stroke();

        context.fillStyle = '#101820';
        context.font = `${number > 9 ? 104 : 124}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(String(number), 128, 138);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        return texture;
    }

    sphericalPoint(phi, theta, radius) {
        return new THREE.Vector3(
            -radius * Math.cos(phi) * Math.sin(theta),
            radius * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
        );
    }
}
