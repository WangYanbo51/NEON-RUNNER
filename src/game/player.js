import * as THREE from 'three';
import * as C from './constants.js';

const neon = (hex, intensity = 2.6) =>
  new THREE.MeshStandardMaterial({
    color: 0x05040f,
    emissive: hex,
    emissiveIntensity: intensity,
    roughness: 0.4,
    metalness: 0.2,
  });

const cloth = (hex) =>
  new THREE.MeshStandardMaterial({ color: hex, roughness: 0.55, metalness: 0.35 });

const GEO = {
  leg: new THREE.BoxGeometry(0.2, 0.72, 0.22),
  shoe: new THREE.BoxGeometry(0.22, 0.1, 0.3),
  arm: new THREE.BoxGeometry(0.14, 0.56, 0.16),
  torso: new THREE.BoxGeometry(0.6, 0.64, 0.34),
  hip: new THREE.BoxGeometry(0.5, 0.18, 0.34),
  head: new THREE.BoxGeometry(0.4, 0.35, 0.38),
};

const MAT = {
  suit: cloth(0x6a5ad8),
  suitDark: cloth(0x2a2260),
  cyan: neon(0x22e6ff, 1.45),
  magenta: neon(0xff2fd0, 1.55),
};

function box(geo, mat, x, y, z) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}

export class Player {
  constructor() {
    this.root = new THREE.Group();
    this.body = new THREE.Group();
    this.root.add(this.body);

    // ---- 躯干 ----
    this.body.add(box(GEO.hip, MAT.suitDark, 0, 0.79, 0));
    this.body.add(box(GEO.torso, MAT.suit, 0, 1.18, 0));
    this.body.add(box(new THREE.BoxGeometry(0.5, 0.045, 0.355), MAT.cyan, 0, 1.34, 0));
    this.body.add(box(new THREE.BoxGeometry(0.54, 0.05, 0.37), MAT.magenta, 0, 0.92, 0));

    // 肩甲
    this.body.add(box(new THREE.BoxGeometry(0.15, 0.08, 0.2), MAT.cyan, -0.34, 1.45, 0));
    this.body.add(box(new THREE.BoxGeometry(0.15, 0.08, 0.2), MAT.cyan, 0.34, 1.45, 0));

    // 背包
    this.body.add(box(new THREE.BoxGeometry(0.42, 0.42, 0.16), MAT.suitDark, 0, 1.2, 0.25));
    this.body.add(box(new THREE.BoxGeometry(0.44, 0.06, 0.18), MAT.magenta, 0, 1.33, 0.29));
    this.body.add(box(new THREE.BoxGeometry(0.07, 0.46, 0.02), MAT.cyan, 0, 1.16, 0.345));

    // ---- 头 ----
    this.body.add(box(GEO.head, MAT.suit, 0, 1.72, 0));
    this.body.add(box(new THREE.BoxGeometry(0.3, 0.055, 0.02), MAT.cyan, 0, 1.79, 0.197));
    this.body.add(box(new THREE.BoxGeometry(0.34, 0.085, 0.03), MAT.magenta, 0, 1.75, -0.2));

    // ---- 四肢（用 pivot 组方便旋转） ----
    this.legL = new THREE.Group();
    this.legL.position.set(-0.16, 0.74, 0);
    this.legL.add(box(GEO.leg, MAT.suit, 0, -0.36, 0));
    this.legL.add(box(GEO.shoe, MAT.magenta, 0, -0.68, -0.05));
    this.body.add(this.legL);

    this.legR = new THREE.Group();
    this.legR.position.set(0.16, 0.74, 0);
    this.legR.add(box(GEO.leg, MAT.suit, 0, -0.36, 0));
    this.legR.add(box(GEO.shoe, MAT.magenta, 0, -0.68, -0.05));
    this.body.add(this.legR);

    this.armL = new THREE.Group();
    this.armL.position.set(-0.38, 1.44, 0);
    this.armL.add(box(GEO.arm, MAT.suit, 0, -0.28, 0));
    this.armL.add(box(new THREE.BoxGeometry(0.16, 0.1, 0.18), MAT.cyan, 0, -0.54, 0));
    this.body.add(this.armL);

    this.armR = new THREE.Group();
    this.armR.position.set(0.38, 1.44, 0);
    this.armR.add(box(GEO.arm, MAT.suit, 0, -0.28, 0));
    this.armR.add(box(new THREE.BoxGeometry(0.16, 0.1, 0.18), MAT.cyan, 0, -0.54, 0));
    this.body.add(this.armR);

    // 角色自带一点霓虹照明，让脚下地面有光斑
    this.light = new THREE.PointLight(0x33ddff, 7, 11, 2);
    this.light.position.set(0, 0.16, 0.85);
    this.root.add(this.light);

    // 背后的补光：只照亮角色附近，让剪影从暗背景里浮出来
    this.keyLight = new THREE.PointLight(0x9fd8ff, 42, 16, 2);
    this.keyLight.position.set(0, 3.4, 3.2);
    this.root.add(this.keyLight);

    this.root.scale.setScalar(1.08);
    this.reset();
  }

  reset() {
    this.lane = 1;
    this.x = C.LANES[1];
    this.y = 0;
    this.vy = 0;
    this.grounded = true;
    this.sliding = false;
    this.slideTimer = 0;
    this.cycle = 0;
    this.body.rotation.set(0, 0, 0);
    this.body.position.set(0, 0, 0);
    this.root.position.set(this.x, 0, C.PLAYER_Z);
  }

  hitbox() {
    const h = this.sliding ? C.SLIDE_H : C.STAND_H;
    return { x: this.x, y: this.y, h, hw: C.PLAYER_HW, hd: C.PLAYER_HD };
  }

  moveLane(dir) {
    const next = Math.min(2, Math.max(0, this.lane + dir));
    if (next === this.lane) return false;
    this.lane = next;
    return true;
  }

  jump() {
    if (!this.grounded) return false;
    this.grounded = false;
    this.sliding = false;
    this.slideTimer = 0;
    this.vy = C.JUMP_VELOCITY;
    return true;
  }

  slide() {
    if (!this.grounded) {
      // 空中按下滑铲 → 快速下坠
      this.vy = Math.min(this.vy, C.FAST_FALL);
      return true;
    }
    this.sliding = true;
    this.slideTimer = C.SLIDE_DURATION;
    return true;
  }

  update(dt, speedRs, running = true) {
    // 水平切轨
    const targetX = C.LANES[this.lane];
    this.x += (targetX - this.x) * Math.min(1, dt * 13);
    if (Math.abs(targetX - this.x) < 0.005) this.x = targetX;

    // 垂直
    if (!this.grounded) {
      this.vy -= C.GRAVITY * dt;
      this.y += this.vy * dt;
      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
        this.grounded = true;
      }
    }

    // 滑铲计时
    if (this.sliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) this.sliding = false;
    }

    // ---- 姿态 ----
    const leanTarget = (targetX - this.x) * -0.16;
    this.body.rotation.z += (leanTarget - this.body.rotation.z) * Math.min(1, dt * 10);
    this.root.rotation.y += ((targetX - this.x) * 0.09 - this.root.rotation.y) * Math.min(1, dt * 10);

    if (this.sliding) {
      this.body.rotation.x += (-1.38 - this.body.rotation.x) * Math.min(1, dt * 18);
      this.body.position.y += (0.05 - this.body.position.y) * Math.min(1, dt * 18);
      this.body.position.z += (0.5 - this.body.position.z) * Math.min(1, dt * 18);
      this.legL.rotation.x += (-0.5 - this.legL.rotation.x) * Math.min(1, dt * 16);
      this.legR.rotation.x += (0.35 - this.legR.rotation.x) * Math.min(1, dt * 16);
      this.armL.rotation.x += (-0.4 - this.armL.rotation.x) * Math.min(1, dt * 16);
      this.armR.rotation.x += (-0.4 - this.armR.rotation.x) * Math.min(1, dt * 16);
    } else {
      this.body.rotation.x += (0 - this.body.rotation.x) * Math.min(1, dt * 14);
      this.body.position.y += (0 - this.body.position.y) * Math.min(1, dt * 14);
      this.body.position.z += (0 - this.body.position.z) * Math.min(1, dt * 14);

      if (!this.grounded) {
        // 腾空收腿
        this.legL.rotation.x += (-0.95 - this.legL.rotation.x) * Math.min(1, dt * 14);
        this.legR.rotation.x += (0.4 - this.legR.rotation.x) * Math.min(1, dt * 14);
        this.armL.rotation.x += (-2.3 - this.armL.rotation.x) * Math.min(1, dt * 12);
        this.armR.rotation.x += (-2.3 - this.armR.rotation.x) * Math.min(1, dt * 12);
      } else {
        this.cycle += dt * (5.5 + speedRs * 0.3);
        const s = Math.sin(this.cycle);
        const amp = running ? 1 : 0;
        this.legL.rotation.x = s * 0.95 * amp;
        this.legR.rotation.x = -s * 0.95 * amp;
        this.armL.rotation.x = -s * 0.78 * amp;
        this.armR.rotation.x = s * 0.78 * amp;
        this.body.position.y = Math.abs(s) * 0.045 * amp;
      }
    }

    this.root.position.set(this.x, this.y, C.PLAYER_Z);
    this.light.intensity = 7;
  }
}
