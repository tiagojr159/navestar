import * as THREE from 'three';
import { PointerLockControls } from '../../../vendor/PointerLockControls.js';

const MOVE_SPEED = 5.2;
const KEYBOARD_TURN_SPEED = 1.75; // radians/second
const ROOM_LIMIT = 8.35;
const CAMERA_HEIGHT = 1.68;
const BALL_COLLISION_RADIUS = 1.72;

export class NavigationController {
    constructor(camera, domElement, options = {}) {
        this.camera = camera;
        this.controls = new PointerLockControls(camera, domElement);
        this.limit = options.limit ?? ROOM_LIMIT;
        this.height = options.height ?? CAMERA_HEIGHT;
        this.minHeight = options.minHeight ?? this.height;
        this.maxHeight = options.maxHeight ?? this.height;
        this.moveSpeed = options.moveSpeed ?? MOVE_SPEED;
        this.boostMultiplier = options.boostMultiplier ?? 1;
        this.collisionRadius = options.collisionRadius ?? BALL_COLLISION_RADIUS;
        this.shipRadius = options.shipRadius ?? 120;
        this.colliders = options.colliders ?? [];
        this.startPosition = options.startPosition ?? new THREE.Vector3(0, this.height, 6.2);
        this.lookAtTarget = options.lookAt ?? new THREE.Vector3(0, 1.45, 0);
        this.currentSpeed = 0;
        this.enabled = true;
        this.keys = new Set();
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.lastPosition = new THREE.Vector3();

        this.camera.position.copy(this.startPosition);
        this.object.lookAt(this.lookAtTarget);

        this.bindEvents();
    }

    get object() {
        return this.controls.getObject();
    }

    lock() {
        this.controls.lock();
    }

    reset() {
        this.controls.unlock();
        this.camera.position.copy(this.startPosition);
        this.object.rotation.set(0, 0, 0);
        this.object.lookAt(this.lookAtTarget);
    }

    update(delta) {
        this.lastPosition.copy(this.object.position);

        if (!this.enabled) {
            this.currentSpeed = 0;
            return;
        }

        this.applyKeyboardTurn(delta);

        this.direction.set(0, 0, 0);

        if (this.keys.has('KeyW')) {
            this.direction.z += 1;
        }

        if (this.keys.has('KeyS')) {
            this.direction.z -= 1;
        }

        if (this.direction.lengthSq() > 0) {
            this.direction.normalize();
        }

        const boost = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? this.boostMultiplier : 1;
        const distance = this.moveSpeed * boost * delta;
        this.currentSpeed = this.moveSpeed * boost * this.direction.length();
        this.controls.moveForward(this.direction.z * distance);

        this.enforceBounds();
    }

    bindEvents() {
        window.addEventListener('keydown', (event) => {
            if (this.shouldPreventDefault(event.code)) {
                event.preventDefault();
            }

            this.keys.add(event.code);
        });

        window.addEventListener('keyup', (event) => {
            this.keys.delete(event.code);
        });
    }

    applyKeyboardTurn(delta) {
        const left = this.keys.has('KeyA') ? 1 : 0;
        const right = this.keys.has('KeyD') ? 1 : 0;
        const yaw = (left - right) * KEYBOARD_TURN_SPEED * delta;
        if (yaw === 0) return;

        const object = this.object;
        object.rotation.order = 'YXZ';
        object.rotation.y += yaw;
    }

    shouldPreventDefault(code) {
        return code === 'Space' || code === 'ControlLeft' || code === 'ControlRight';
    }

    enforceBounds() {
        const position = this.object.position;
        position.y = THREE.MathUtils.clamp(position.y, this.minHeight, this.maxHeight);
        position.x = THREE.MathUtils.clamp(position.x, -this.limit, this.limit);
        position.z = THREE.MathUtils.clamp(position.z, -this.limit, this.limit);

        this.resolveCollisions();
        position.y = THREE.MathUtils.clamp(position.y, this.minHeight, this.maxHeight);
    }

    setColliders(colliders) {
        this.colliders = Array.isArray(colliders) ? colliders : [];
    }

    getSpeed() {
        return this.currentSpeed;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        this.currentSpeed = 0;
        if (!enabled) {
            this.direction.set(0, 0, 0);
        }
    }

    resolveCollisions() {
        if (!this.colliders || this.colliders.length === 0) return;

        const position = this.object.position;
        const shipRadius = Math.max(1, this.shipRadius);

        for (const collider of this.colliders) {
            const dx = position.x - collider.x;
            const dy = position.y - collider.y;
            const dz = position.z - collider.z;
            const distSq = dx * dx + dy * dy + dz * dz;
            const minDist = shipRadius + collider.r;

            if (distSq >= minDist * minDist) continue;

            const dist = Math.sqrt(Math.max(distSq, 0.000001));
            const push = (minDist - dist) / dist;
            position.x += dx * push;
            position.y += dy * push;
            position.z += dz * push;
        }
    }
}
