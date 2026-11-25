const $ = (id) => document.getElementById(id);

export class HUD {
  constructor() {
    this.hud = $('hud');
    this.score = $('score');
    this.coins = $('coins');
    this.speed = $('speed');
    this.dist = $('dist');

    this.ready = $('overlay-ready');
    this.over = $('overlay-over');
    this.finalScore = $('final-score');
    this.finalCoins = $('final-coins');
    this.finalDist = $('final-dist');
    this.best = $('best-score');

    this.cache = { score: -1, coins: -1, speed: -1, dist: -1 };
  }

  update({ score, coins, speed, dist }) {
    const c = this.cache;
    const s = Math.floor(score);
    if (s !== c.score) {
      this.score.textContent = s;
      c.score = s;
    }
    if (coins !== c.coins) {
      this.coins.textContent = coins;
      c.coins = coins;
    }
    const kmh = Math.round(speed * 3.6);
    if (kmh !== c.speed) {
      this.speed.textContent = kmh;
      c.speed = kmh;
    }
    const m = Math.floor(dist);
    if (m !== c.dist) {
      this.dist.textContent = m;
      c.dist = m;
    }
  }

  showHUD() {
    this.hud.classList.remove('is-hidden');
  }

  hideHUD() {
    this.hud.classList.add('is-hidden');
  }

  hideReady() {
    this.ready.classList.add('is-hidden');
  }

  showReady() {
    this.ready.classList.remove('is-hidden');
  }

  showOver({ score, coins, dist, best }) {
    this.finalScore.textContent = score;
    this.finalCoins.textContent = coins;
    this.finalDist.textContent = dist;
    this.best.textContent = best;
    this.over.classList.remove('is-hidden');
  }

  hideOver() {
    this.over.classList.add('is-hidden');
  }
}
