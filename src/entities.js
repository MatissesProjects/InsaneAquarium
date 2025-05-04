// src/entities.js

import { bus } from './EventBus.js';

export const foods = [];

const SVG_WIDTH             = 750;
const SVG_HEIGHT            = 325;
const DEFAULT_GRAVITY       = 0.00005;   // px per ms²
const DEFAULT_BASE_LIFETIME = 3000;      // ms per level on ground before removal
const DEFAULT_HUNGER_RATE   = 0.000125;  // hunger units per ms
const DEFAULT_HUNGRY_THRESH = 1;         // when fish starts seeking food
const DEFAULT_DEATH_THRESH  = 5;         // hunger at which fish dies
const DEFAULT_DROP_INTERVAL = 10000;     // ms between coin drops
const COIN_LIFESPAN         = 2000;      // ms before a landed coin disappears

// Placeholder SVG asset URLs – replace with local files as needed
const DEFAULT_FISH_SVG = 'assets/fish.svg';
const DEFAULT_COIN_SVG = 'assets/coin.svg';
const DEFAULT_FOOD_SVG = 'assets/food.svg';

// Utility to create an SVG <image> element
function createSprite(url, size) {
  const img = document.createElementNS('http://www.w3.org/2000/svg','image');
  img.setAttributeNS('http://www.w3.org/1999/xlink','href', url);
  img.setAttribute('width', `${size * 2}`);
  img.setAttribute('height', `${size * 2}`);
  return img;
}

export class Food {
  constructor(x, y, level = 1, gravity = DEFAULT_GRAVITY, svgUrl = DEFAULT_FOOD_SVG) {
    this.x           = x;
    this.y           = y;
    this.r           = 4;
    this.vy          = 0;
    this.level       = level;
    this.gravity     = gravity;
    this.landed      = false;
    this.groundTimer = 0;
    this.lifespan    = DEFAULT_BASE_LIFETIME * level;

    this.el = createSprite(svgUrl, this.r);
    document.getElementById('game-canvas').appendChild(this.el);
    foods.push(this);

    bus.on('update', this.update.bind(this));
    bus.on('render', this.render.bind(this));
  }

  update(dt) {
    this.vy += this.gravity * dt;
    this.y  += this.vy * dt;

    if (this.y + this.r >= SVG_HEIGHT) {
      if (!this.landed) { this.landed = true; this.groundTimer = 0; }
      this.y = SVG_HEIGHT - this.r;
      this.vy = 0;
    }

    if (this.landed) {
      this.groundTimer += dt;
      if (this.groundTimer >= this.lifespan) this.remove();
    }
  }

  render() {
    // position without flipping
    this.el.setAttribute('transform', `translate(${this.x - this.r}, ${this.y - this.r})`);
  }

  remove() {
    this.el.remove();
    const idx = foods.indexOf(this);
    if (idx !== -1) foods.splice(idx, 1);
  }
}

export class Coin {
  constructor(x, y, amount = 1, gravity = DEFAULT_GRAVITY, svgUrl = DEFAULT_COIN_SVG) {
    this.x           = x;
    this.y           = y;
    this.r           = 16;
    this.amount      = amount;
    this.vy          = 0;
    this.gravity     = gravity;
    this.landed      = false;
    this.groundTimer = 0;
    this.lifespan    = COIN_LIFESPAN;

    this.el = createSprite(svgUrl, this.r);
    this.el.style.cursor = 'pointer';
    document.getElementById('game-canvas').appendChild(this.el);
    this.el.addEventListener('click', () => {
      bus.emit('coinCollected', this.amount);
      this.remove();
    });

    bus.on('update', this.update.bind(this));
    bus.on('render', this.render.bind(this));
  }

  update(dt) {
    this.vy += this.gravity * dt;
    this.y  += this.vy * dt;

    if (this.y + this.r >= SVG_HEIGHT) {
      if (!this.landed) { this.landed = true; this.groundTimer = 0; }
      this.y = SVG_HEIGHT - this.r;
      this.vy = 0;
    }

    if (this.landed) {
      this.groundTimer += dt;
      if (this.groundTimer >= this.lifespan) this.remove();
    }
  }

  render() {
    this.el.setAttribute('transform', `translate(${this.x - this.r}, ${this.y - this.r})`);
  }

  remove() {
    this.el.remove();
  }
}

export class Fish {
  constructor(config = {}) {
    this.x               = config.x ?? 100;
    this.y               = config.y ?? 200;
    this.r               = config.radius ?? 20;
    this.speed           = config.speed ?? 0.08;
    this.hungerRate      = config.hungerRate ?? DEFAULT_HUNGER_RATE;
    this.hungryThreshold = config.hungryThreshold ?? DEFAULT_HUNGRY_THRESH;
    this.deathThreshold  = config.deathThreshold ?? DEFAULT_DEATH_THRESH;
    this.dropInterval    = config.dropInterval ?? DEFAULT_DROP_INTERVAL;
    this.svgUrl          = config.svgUrl ?? DEFAULT_FISH_SVG;

    this.dirChangeTimer  = 0;
    this.direction       = { x: 1, y: 0 };
    this.health               = 1;
    this.level                = 1;
    this.nextUpgradeThreshold = 2;
    this.hunger    = 0;
    this.alive     = true;
    this.dropTimer = 0;

    this.el = createSprite(this.svgUrl, this.r);
    document.getElementById('game-canvas').appendChild(this.el);

    bus.on('update', this.update.bind(this));
    bus.on('render', this.render.bind(this));
  }

  update(dt) {
    if (!this.alive) return;

    this.hunger += this.hungerRate * dt;
    if (this.hunger >= this.deathThreshold) {
      this.alive = false;
      this.el.remove();
      return;
    }

    const t  = Math.min(this.hunger / this.deathThreshold, 1);
    const hue = 39 + (120 - 39) * t;
    this.el.style.filter = `hue-rotate(${hue - 39}deg)`;

    this.dropTimer += dt;
    if (this.dropTimer >= this.dropInterval) {
      this.dropTimer -= this.dropInterval;
      bus.emit('coinDropped', { x: this.x, y: this.y, amount: 1 });
      new Coin(this.x, this.y, 1);
    }

    const isHungry = this.hunger >= this.hungryThreshold;
    if (isHungry && foods.length) {
      let closest = foods[0], bestDist = Infinity;
      for (const f of foods) {
        const dx = f.x - this.x, dy = f.y - this.y;
        const d  = Math.hypot(dx, dy);
        if (d < bestDist) { bestDist = d; closest = f; }
      }
      this.direction = { x: (closest.x - this.x) / bestDist,
                         y: (closest.y - this.y) / bestDist };
      if (bestDist < this.r + closest.r) { closest.remove(); this.onEat(); }
    } else {
      this.dirChangeTimer -= dt;
      if (this.dirChangeTimer <= 0) {
        const θ = Math.random() * 2 * Math.PI;
        this.direction = { x: Math.cos(θ), y: Math.sin(θ) };
        this.dirChangeTimer = 1000 + Math.random() * 2000;
      }
    }

    this.x += this.direction.x * this.speed * dt;
    this.y += this.direction.y * this.speed * dt;
    if (this.x < -this.r) this.x = SVG_WIDTH + this.r;
    if (this.x > SVG_WIDTH + this.r) this.x = -this.r;
    this.y = Math.min(Math.max(this.y, this.r), SVG_HEIGHT - this.r);
  }

  onEat() {
    this.hunger = 0;
    this.health += 1;
    if (this.health >= this.nextUpgradeThreshold) {
      this.upgrade();
      this.nextUpgradeThreshold *= 1.25;
    }
  }

  upgrade() {
    this.level += 1;
    this.speed *= 1.0125;
    this.r     *= 1.2;
    this.el.setAttribute('width', `${this.r * 2}`);
    this.el.setAttribute('height', `${this.r * 2}`);
    if (this.svgUrl) this.el.setAttributeNS('http://www.w3.org/1999/xlink','href', this.svgUrl);
    this.dropInterval *= 0.8;
  }

  render() {
    if (!this.alive) return;
    const tx = this.x - this.r;
    const ty = this.y - this.r;
    const scaleX = this.direction.x < 0 ? 1 : -1;
    const flipOffset = scaleX < 0 ? this.r * 2 : 0;
    // use transform: translate then scale
    this.el.setAttribute('transform', `translate(${tx + flipOffset}, ${ty}) scale(${scaleX}, 1)`);
  }
}
