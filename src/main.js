import * as C from './game/constants.js';
import { World } from './game/scene.js';
import { Player } from './game/player.js';
import { Spawner } from './game/spawner.js';
import { createInput } from './game/input.js';
import { Sfx } from './game/audio.js';
import { HUD } from './game/hud.js';

const canvas = document.getElementById('game');
const world = new World(canvas);
const player = new Player();
world.scene.add(player.root);
const spawner = new Spawner(world.scene);
const hud = new HUD();
const sfx = new Sfx();

const BEST_KEY = 'neon-runner-best-v1';
let best = Number(localStorage.getItem(BEST_KEY) || 0);

let state = 'ready'; // ready | playing | over
let speed = C.SPEED_START;
let distance = 0;
let coins = 0;
let score = 0;
let overAt = 0;

function startGame() {
  sfx.unlock();
  sfx.start();

  speed = C.SPEED_START;
  distance = 0;
  coins = 0;
  score = 0;

  player.reset();
  spawner.reset();
  spawner.prefill(speed);
  world.resetScroll();

  hud.hideReady();
  hud.hideOver();
  hud.showHUD();
  hud.update({ score: 0, coins: 0, speed, dist: 0 });

  state = 'playing';
}

function crash() {
  if (state !== 'playing') return;
  state = 'over';
  overAt = performance.now();

  sfx.crash();
  world.shake(0.75);

  const finalScore = Math.floor(distance) + coins * 10;
  if (finalScore > best) {
    best = finalScore;
    try {
      localStorage.setItem(BEST_KEY, String(best));
    } catch (e) {
      /* 隐私模式下 localStorage 可能不可用 */
    }
  }
  hud.showOver({ score: finalScore, coins, dist: Math.floor(distance), best });
}

const handlers = {
  left() {
    if (state !== 'playing') return;
    if (player.moveLane(-1)) sfx.lane();
  },
  right() {
    if (state !== 'playing') return;
    if (player.moveLane(1)) sfx.lane();
  },
  jump() {
    if (state !== 'playing') return;
    if (player.jump()) sfx.jump();
  },
  slide() {
    if (state !== 'playing') return;
    if (player.slide()) sfx.slide();
  },
  action() {
    if (state === 'ready') {
      startGame();
    } else if (state === 'over') {
      // 撞击后 0.5s 内的误触不重开
      if (performance.now() - overAt > 500) startGame();
    } else if (player.jump()) {
      sfx.jump();
    }
  },
};

createInput(handlers);

document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-retry').addEventListener('click', startGame);

// M 键静音
window.addEventListener('keydown', (e) => {
  if (e.key === 'm' || e.key === 'M') sfx.toggle();
});

// 调试开关：?autostart=1 直接开局，?fixeddt=1 用固定步长（便于自动化截图比对）
const params = new URLSearchParams(location.search);
const FIXED_DT = params.get('fixeddt') === '1';

if (params.get('autostart') === '1') {
  startGame();
}

// 方便在控制台/自动化里检查内部状态
window.__runner = {
  player,
  spawner,
  world,
  startGame,
  get state() {
    return state;
  },
  get stats() {
    return { score, coins, distance, speed };
  },
};

let last = performance.now();

function frame(now) {
  // 切标签页回来时 now 可能小于 last，clamp 到 0 防止时间倒流
  const dt = FIXED_DT ? 1 / 60 : Math.max(0, Math.min((now - last) / 1000, 0.05));
  last = now;

  if (state === 'playing') {
    speed = Math.min(C.SPEED_MAX, speed + C.SPEED_ACCEL * dt);
    distance += speed * dt;
    score = Math.floor(distance) + coins * 10;

    spawner.update(dt, speed, player, {
      onCoin() {
        coins += 1;
        sfx.coin();
      },
      onHit: crash,
    });

    player.update(dt, speed, true);
    world.update(dt, speed);
    hud.update({ score, coins, speed, dist: distance });
  } else if (state === 'ready') {
    // 待机演示：角色原地跑，场景缓慢滚动
    player.update(dt, 11, true);
    world.update(dt, 13);
  } else {
    player.update(dt, 0, false);
    world.update(dt, 0);
  }

  world.updateCamera(dt, player, state === 'playing' ? speed : 8);
  world.render();

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
