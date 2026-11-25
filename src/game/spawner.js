import * as THREE from 'three';
import * as C from './constants.js';

const neon = (hex, i = 1.7) =>
  new THREE.MeshStandardMaterial({
    color: 0x05040f,
    emissive: hex,
    emissiveIntensity: i,
    roughness: 0.35,
    metalness: 0.35,
  });

const MAT = {
  dark: new THREE.MeshStandardMaterial({ color: 0x0b0724, roughness: 0.5, metalness: 0.55 }),
  dark2: new THREE.MeshStandardMaterial({ color: 0x140a2e, roughness: 0.45, metalness: 0.6 }),
  cyan: neon(0x22e6ff, 1.7),
  magenta: neon(0xff2fd0, 1.7),
  amber: neon(0xffb31f, 1.6),
};

const EDGE_CYAN = new THREE.LineBasicMaterial({ color: 0x7ef0ff });

// 每种障碍的碰撞盒定义（y0 为底部高度，h 为高度）
const TYPES = {
  barrier: { w: 1.95, h: 0.85, y0: 0, d: 0.55 },
  gate: { w: 1.95, h: 2.1, y0: 1.3, d: 0.5 },
  crate: { w: 1.75, h: 2.15, y0: 0, d: 1.7 },
  train: { w: 1.9, h: 2.7, y0: 0, d: 22 },
};

function b(geo, mat, x, y, z) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}

function buildBarrier() {
  const g = new THREE.Group();
  g.add(b(new THREE.BoxGeometry(0.16, 0.78, 0.32), MAT.dark, -0.88, 0.39, 0));
  g.add(b(new THREE.BoxGeometry(0.16, 0.78, 0.32), MAT.dark, 0.88, 0.39, 0));
  g.add(b(new THREE.BoxGeometry(1.95, 0.34, 0.28), MAT.dark2, 0, 0.6, 0));
  g.add(b(new THREE.BoxGeometry(1.9, 0.1, 0.03), MAT.magenta, 0, 0.6, 0.16));
  g.add(b(new THREE.BoxGeometry(0.18, 0.1, 0.34), MAT.cyan, -0.88, 0.8, 0));
  g.add(b(new THREE.BoxGeometry(0.18, 0.1, 0.34), MAT.cyan, 0.88, 0.8, 0));
  return g;
}

function buildGate() {
  const g = new THREE.Group();
  g.add(b(new THREE.BoxGeometry(0.16, 3.4, 0.34), MAT.dark, -0.92, 1.7, 0));
  g.add(b(new THREE.BoxGeometry(0.16, 3.4, 0.34), MAT.dark, 0.92, 1.7, 0));
  g.add(b(new THREE.BoxGeometry(2.0, 0.66, 0.36), MAT.dark2, 0, 1.72, 0));
  // 底部警示亮条，提示可以从下面滑过去
  g.add(b(new THREE.BoxGeometry(2.02, 0.07, 0.4), MAT.cyan, 0, 1.41, 0));
  // 侧面斜纹
  for (let i = -1; i <= 1; i++) {
    g.add(b(new THREE.BoxGeometry(0.34, 0.5, 0.03), MAT.magenta, i * 0.58, 1.72, 0.19));
  }
  g.add(b(new THREE.BoxGeometry(2.06, 0.12, 0.4), MAT.magenta, 0, 3.38, 0));
  return g;
}

function buildCrate() {
  const g = new THREE.Group();
  const boxGeo = new THREE.BoxGeometry(1.75, 2.15, 1.7);
  const body = new THREE.Mesh(boxGeo, MAT.dark2);
  body.position.y = 1.075;
  g.add(body);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(boxGeo), EDGE_CYAN);
  edges.position.y = 1.075;
  g.add(edges);
  g.add(b(new THREE.BoxGeometry(1.79, 0.09, 1.74), MAT.cyan, 0, 2.13, 0));
  g.add(b(new THREE.BoxGeometry(1.79, 0.09, 1.74), MAT.cyan, 0, 0.09, 0));
  g.add(b(new THREE.BoxGeometry(1.2, 0.32, 0.03), MAT.magenta, 0, 1.2, 0.87));
  return g;
}

function buildTrain() {
  const g = new THREE.Group();
  g.add(b(new THREE.BoxGeometry(1.9, 2.5, 22), MAT.dark, 0, 1.32, 0));
  // 车顶霓虹
  g.add(b(new THREE.BoxGeometry(1.96, 0.1, 22.05), MAT.magenta, 0, 2.6, 0));
  // 车侧灯带
  g.add(b(new THREE.BoxGeometry(0.05, 0.11, 22.05), MAT.cyan, -0.96, 1.95, 0));
  g.add(b(new THREE.BoxGeometry(0.05, 0.11, 22.05), MAT.cyan, 0.96, 1.95, 0));
  // 车窗
  g.add(b(new THREE.BoxGeometry(0.04, 0.52, 18), MAT.amber, -0.96, 1.55, 0));
  g.add(b(new THREE.BoxGeometry(0.04, 0.52, 18), MAT.amber, 0.96, 1.55, 0));
  // 车底泛光
  g.add(b(new THREE.BoxGeometry(1.94, 0.09, 22.05), MAT.cyan, 0, 0.07, 0));
  // 车头灯
  g.add(b(new THREE.BoxGeometry(0.4, 0.26, 0.08), MAT.amber, -0.55, 0.85, 11.02));
  g.add(b(new THREE.BoxGeometry(0.4, 0.26, 0.08), MAT.amber, 0.55, 0.85, 11.02));
  return g;
}

const BUILDERS = {
  barrier: buildBarrier,
  gate: buildGate,
  crate: buildCrate,
  train: buildTrain,
};

export class Spawner {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = [];
    this.coins = [];
    this.pools = new Map();
    this.coinPool = [];

    this.coinGeo = new THREE.TorusGeometry(0.32, 0.085, 8, 22);
    this.coinMat = new THREE.MeshStandardMaterial({
      color: 0x2a1a00,
      emissive: 0xffb31f,
      emissiveIntensity: 2.2,
      metalness: 0.85,
      roughness: 0.22,
    });

    this.reset();
  }

  reset() {
    for (const o of this.obstacles) this.disposeObstacle(o);
    this.obstacles.length = 0;
    for (const c of this.coins) this.disposeCoin(c);
    this.coins.length = 0;

    this.sinceSpawn = 0;
    this.nextGap = 24;
    this.pendingTrain = false;
  }

  /** 开局先铺几波障碍，避免前十秒没东西 */
  prefill(speed) {
    for (const z of [-48, -76, -106, -138]) {
      this.spawnWave(speed, z);
    }
    this.sinceSpawn = 0;
    this.nextGap = this.computeGap(speed);
  }

  computeGap(speed) {
    const base = speed * (1.18 + Math.random() * 0.5);
    return base + (this.pendingTrain ? 26 : 0);
  }

  pickType() {
    const r = Math.random();
    if (r < 0.34) return 'barrier';
    if (r < 0.62) return 'gate';
    if (r < 0.88) return 'crate';
    return 'train';
  }

  spawnWave(speed, z = C.SPAWN_Z) {
    const order = [0, 1, 2].sort(() => Math.random() - 0.5);
    const blocked = Math.random() < 0.3 ? order.slice(0, 2) : order.slice(0, 1);

    let trainHere = false;
    for (const lane of blocked) {
      const type = this.pickType();
      if (type === 'train') trainHere = true;
      this.addObstacle(type, lane, z);
    }
    this.pendingTrain = trainHere;

    // 金币只放在空轨道上，起到引导作用
    const free = [0, 1, 2].filter((l) => !blocked.includes(l));
    if (free.length) {
      const lane = free[(Math.random() * free.length) | 0];
      this.addCoinRun(lane, z, Math.random() < 0.28);
    }
  }

  addObstacle(type, lane, z) {
    const def = TYPES[type];
    let arr = this.pools.get(type);
    if (!arr) {
      arr = [];
      this.pools.set(type, arr);
    }

    let mesh = arr.pop();
    if (!mesh) {
      mesh = BUILDERS[type]();
      this.scene.add(mesh);
    }
    mesh.visible = true;
    mesh.position.set(C.LANES[lane], 0, z);

    const o = {
      type,
      lane,
      x: C.LANES[lane],
      z,
      hw: def.w / 2,
      hd: def.d / 2,
      y0: def.y0,
      h: def.h,
      mesh,
    };
    this.obstacles.push(o);
    return o;
  }

  disposeObstacle(o) {
    o.mesh.visible = false;
    o.mesh.position.set(0, -50, 0);
    let arr = this.pools.get(o.type);
    if (!arr) {
      arr = [];
      this.pools.set(o.type, arr);
    }
    arr.push(o.mesh);
  }

  addCoinRun(lane, z, arc) {
    const n = 5 + ((Math.random() * 2) | 0);
    const step = 2.4;
    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) : 0;
      const y = arc ? 1.05 + Math.sin(t * Math.PI) * 1.5 : 1.05;
      this.addCoin(lane, z + 3 + i * step, y);
    }
  }

  addCoin(lane, z, y) {
    let mesh = this.coinPool.pop();
    if (!mesh) {
      mesh = new THREE.Mesh(this.coinGeo, this.coinMat);
      this.scene.add(mesh);
    }
    mesh.visible = true;
    mesh.position.set(C.LANES[lane], y, z);
    mesh.rotation.set(0, Math.random() * Math.PI, 0);

    this.coins.push({ x: C.LANES[lane], z, baseY: y, phase: Math.random() * 6.28, mesh });
  }

  disposeCoin(c) {
    c.mesh.visible = false;
    c.mesh.position.set(0, -50, 0);
    this.coinPool.push(c.mesh);
  }

  overlaps(p, o) {
    if (Math.abs(p.x - o.x) >= p.hw + o.hw) return false;
    if (Math.abs(C.PLAYER_Z - o.z) >= p.hd + o.hd) return false;
    return p.y < o.y0 + o.h && p.y + p.h > o.y0;
  }

  touchesCoin(p, c) {
    if (Math.abs(p.x - c.x) > 0.92) return false;
    if (Math.abs(c.z - C.PLAYER_Z) > 0.95) return false;
    const center = p.y + p.h * 0.5;
    return Math.abs(center - c.mesh.position.y) < 1.2;
  }

  update(dt, speed, player, cb) {
    // 按跑过的距离来投放，速度越快间隔越远，反应时间保持一致
    this.sinceSpawn += speed * dt;
    if (this.sinceSpawn >= this.nextGap) {
      this.sinceSpawn = 0;
      this.spawnWave(speed);
      this.nextGap = this.computeGap(speed);
    }

    const p = player.hitbox();
    let hit = false;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.z += speed * dt;
      o.mesh.position.z = o.z;

      if (o.z - o.hd > C.DESPAWN_Z) {
        this.disposeObstacle(o);
        this.obstacles.splice(i, 1);
        continue;
      }
      if (!hit && this.overlaps(p, o)) hit = true;
    }

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.z += speed * dt;
      c.phase += dt * 4;
      c.mesh.position.z = c.z;
      c.mesh.position.y = c.baseY + Math.sin(c.phase) * 0.09;
      c.mesh.rotation.y += dt * 3.4;

      if (c.z > C.DESPAWN_Z) {
        this.disposeCoin(c);
        this.coins.splice(i, 1);
        continue;
      }
      if (!hit && this.touchesCoin(p, c)) {
        this.disposeCoin(c);
        this.coins.splice(i, 1);
        if (cb && cb.onCoin) cb.onCoin();
      }
    }

    if (hit && cb && cb.onHit) cb.onHit();
  }
}
