import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const FLOOR_W = 64;
const FLOOR_L = 470;
const FLOOR_CZ = -190;
const CELL = 4.2; // 网格一格对应的世界单位

function makeGridTexture() {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#06030f';
  g.fillRect(0, 0, S, S);

  g.strokeStyle = 'rgba(34, 230, 255, 0.62)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(0, 1.5);
  g.lineTo(S, 1.5);
  g.moveTo(1.5, 0);
  g.lineTo(1.5, S);
  g.stroke();

  g.strokeStyle = 'rgba(123, 44, 255, 0.3)';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(S * 0.5, 0);
  g.lineTo(S * 0.5, S);
  g.moveTo(0, S * 0.5);
  g.lineTo(S, S * 0.5);
  g.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.repeat.set(FLOOR_W / CELL, FLOOR_L / CELL);
  return tex;
}

function makeWindowTexture() {
  const W = 128;
  const H = 256;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#07040f';
  g.fillRect(0, 0, W, H);

  const cols = 5;
  const rows = 14;
  const cw = W / cols;
  const ch = H / rows;
  const palette = ['#22e6ff', '#ff2fd0', '#7b2cff', '#bfe9ff', '#ffc23c'];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (Math.random() < 0.34) continue;
      g.fillStyle = palette[(Math.random() * palette.length) | 0];
      g.globalAlpha = 0.35 + Math.random() * 0.65;
      g.fillRect(x * cw + cw * 0.22, y * ch + ch * 0.24, cw * 0.56, ch * 0.42);
    }
  }
  g.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeHorizonTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, 'rgba(5,1,15,0)');
  grad.addColorStop(0.45, 'rgba(72,20,140,0.25)');
  grad.addColorStop(0.78, 'rgba(255,47,208,0.34)');
  grad.addColorStop(1, 'rgba(34,230,255,0.5)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class World {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05010f);
    this.scene.fog = new THREE.Fog(0x0a0420, 46, 168);

    this.camera = new THREE.PerspectiveCamera(
      62,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    this.camera.position.set(0, 3.05, 5.7);

    this.lookTarget = new THREE.Vector3(0, 1.45, -10);
    this.shakeAmount = 0;
    this.time = 0;

    this.buildLights();
    this.buildBackdrop();
    this.buildFloor();
    this.buildRails();
    this.buildCity();
    this.buildArches();

    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    this.composer.setSize(window.innerWidth, window.innerHeight);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.52,
      0.55,
      0.56
    );
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  buildLights() {
    const hemi = new THREE.HemisphereLight(0x4a35b8, 0x080314, 1.6);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0x9a7bff, 1.5);
    key.position.set(-6, 14, 6);
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x22e6ff, 0.9);
    rim.position.set(8, 6, -12);
    this.scene.add(rim);
  }

  buildBackdrop() {
    const tex = makeHorizonTexture();
    const geo = new THREE.PlaneGeometry(760, 320);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      fog: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.55,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 34, -250);
    mesh.renderOrder = -2;
    this.scene.add(mesh);
  }

  buildFloor() {
    this.gridTex = makeGridTexture();
    const geo = new THREE.PlaneGeometry(FLOOR_W, FLOOR_L);
    const mat = new THREE.MeshStandardMaterial({
      map: this.gridTex,
      emissive: 0xffffff,
      emissiveMap: this.gridTex,
      emissiveIntensity: 0.42,
      color: 0xffffff,
      roughness: 0.58,
      metalness: 0.42,
    });
    const floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = FLOOR_CZ;
    this.scene.add(floor);
  }

  buildRails() {
    const mkStrip = (x, w, hex, intensity) => {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x05040f,
        emissive: hex,
        emissiveIntensity: intensity,
        roughness: 0.3,
        metalness: 0.4,
      });
      const geo = new THREE.BoxGeometry(w, 0.07, FLOOR_L);
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, 0.035, FLOOR_CZ);
      this.scene.add(m);
    };

    // 轨道分界线（微弱）
    [-3.35, -1.12, 1.12, 3.35].forEach((x) => mkStrip(x, 0.07, 0x22e6ff, 1.15));
    // 外侧护栏边（更亮）
    mkStrip(-4.15, 0.16, 0xff2fd0, 1.8);
    mkStrip(4.15, 0.16, 0xff2fd0, 1.8);
  }

  buildCity() {
    const winTex = makeWindowTexture();
    this.cityMat = new THREE.MeshStandardMaterial({
      map: winTex,
      emissive: 0xffffff,
      emissiveMap: winTex,
      emissiveIntensity: 0.8,
      color: 0xffffff,
      roughness: 0.78,
      metalness: 0.35,
    });

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const edgeGeo = new THREE.EdgesGeometry(boxGeo);
    this.edgeMatA = new THREE.LineBasicMaterial({ color: 0x22e6ff, transparent: true, opacity: 0.5 });
    this.edgeMatB = new THREE.LineBasicMaterial({ color: 0xff2fd0, transparent: true, opacity: 0.45 });

    this.buildings = [];
    this.citySpanPerSide = 30;
    this.cityStep = 9.5;
    this.cityLength = this.citySpanPerSide * this.cityStep;

    for (const side of [-1, 1]) {
      for (let i = 0; i < this.citySpanPerSide; i++) {
        const group = new THREE.Group();
        const body = new THREE.Mesh(boxGeo, this.cityMat);
        const edges = new THREE.LineSegments(edgeGeo, side < 0 ? this.edgeMatA : this.edgeMatB);
        group.add(body, edges);
        this.scene.add(group);

        const item = { group, body, edges, side };
        this.placeBuilding(item, 22 - i * this.cityStep);
        this.buildings.push(item);
      }
    }
  }

  placeBuilding(item, z) {
    const w = 3.2 + Math.random() * 4.5;
    const h = 7 + Math.random() * 26;
    const d = 3.2 + Math.random() * 4.5;
    item.body.scale.set(w, h, d);
    item.edges.scale.set(w, h, d);
    const x = item.side * (7.6 + Math.random() * 13);
    item.group.position.set(x, h / 2, z);
  }

  buildArches() {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0a0620,
      emissive: 0xff2fd0,
      emissiveIntensity: 1.6,
      roughness: 0.35,
      metalness: 0.4,
    });
    const postGeo = new THREE.BoxGeometry(0.34, 6.2, 0.34);
    const barGeo = new THREE.BoxGeometry(10.4, 0.34, 0.34);

    this.archStep = 52;
    this.archCount = 8;
    this.archLength = this.archStep * this.archCount;
    this.arches = [];

    for (let i = 0; i < this.archCount; i++) {
      const group = new THREE.Group();
      const postL = new THREE.Mesh(postGeo, mat);
      postL.position.set(-4.9, 3.1, 0);
      const postR = new THREE.Mesh(postGeo, mat);
      postR.position.set(4.9, 3.1, 0);
      const bar = new THREE.Mesh(barGeo, mat);
      bar.position.set(0, 6.2, 0);
      group.add(postL, postR, bar);
      group.position.z = 10 - i * this.archStep;
      this.scene.add(group);
      this.arches.push(group);
    }
  }

  resetScroll() {
    this.shakeAmount = 0;
    this.camera.fov = 62;
    this.camera.updateProjectionMatrix();
  }

  shake(amount = 0.55) {
    this.shakeAmount = amount;
  }

  update(dt, speed) {
    this.time += dt;

    // 地面网格向后滚动，制造速度感
    if (this.gridTex) {
      this.gridTex.offset.y += (speed * dt) / CELL;
    }

    // 城市循环
    for (const b of this.buildings) {
      b.group.position.z += speed * dt;
      if (b.group.position.z > 26) {
        this.placeBuilding(b, b.group.position.z - this.cityLength);
      }
    }

    // 拱门循环
    for (const a of this.arches) {
      a.position.z += speed * dt;
      if (a.position.z > 12) a.position.z -= this.archLength;
    }
  }

  updateCamera(dt, player, speed) {
    const k = Math.min(1, dt * 6);
    const targetX = player.x * 0.52;
    this.camera.position.x += (targetX - this.camera.position.x) * k;
    this.camera.position.y = 3.0 + player.y * 0.24;
    this.camera.position.z = 5.7;

    this.lookTarget.set(player.x * 0.34, 1.5 + player.y * 0.55, -10);

    if (this.shakeAmount > 0.001) {
      this.shakeAmount *= Math.pow(0.02, dt);
      const s = this.shakeAmount;
      this.camera.position.x += (Math.random() - 0.5) * s;
      this.camera.position.y += (Math.random() - 0.5) * s;
    } else {
      this.shakeAmount = 0;
    }

    this.camera.lookAt(this.lookTarget);

    const targetFov = 62 + Math.max(0, speed - 17) * 0.32;
    this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 2.5);
    this.camera.updateProjectionMatrix();
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
  }

  render() {
    this.composer.render();
  }
}
