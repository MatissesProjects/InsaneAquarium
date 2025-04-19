import { bus } from './EventBus.js';

// ─── GLOBAL FOOD LIST ─────────────────────────────────────────────────────────
export const foods = [];

// ─── DEFAULT CONSTANTS ─────────────────────────────────────────────────────────
const SVG_WIDTH         = 800;
const SVG_HEIGHT        = 325;
const DEFAULT_GRAVITY           = 0.00005;   // px per ms²
const DEFAULT_BASE_LIFETIME     = 3000;      // ms per level on ground before removal
const DEFAULT_HUNGER_RATE       = 0.000125;  // hunger units per ms
const DEFAULT_HUNGRY_THRESHOLD  = 1;         // hunger at which fish begins to seek food
const DEFAULT_DEATH_THRESHOLD   = 5;         // hunger at which fish dies and is removed
const DEFAULT_DROP_INTERVAL = 10000; // ms between drops at level 1
const COIN_LIFESPAN = 5000; // ms before coins disappear

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

// ─── FOOD ENTITY ──────────────────────────────────────────────────────────────
export class Food {
  /**
   * @param {number} x - initial x position
   * @param {number} y - initial y position
   * @param {number} [level=1] - determines how long the food lasts on ground,
   *                             and how good it is at feeding the fish
   * @param {number} [gravity] - optional gravity override for drop speed
   */
  constructor(x, y, level = 1, gravity = DEFAULT_GRAVITY, svgUrl = DEFAULT_FOOD_SVG) {
    this.x           = x;
    this.y           = y;
    this.r           = 5;
    this.vy          = 0;
    this.level       = level;
    this.gravity     = gravity;
    this.landed      = false;
    this.groundTimer = 0;
    this.lifespan    = DEFAULT_BASE_LIFETIME * level;

    // sprite element
    this.el = createSprite(svgUrl, this.r);
    this.el.setAttribute('class', 'food');
    document.getElementById('game-canvas').appendChild(this.el);

    foods.push(this);
    bus.on('update', this.update.bind(this));
    bus.on('render', this.render.bind(this));
  }

  update(dt) {
    // fall under gravity
    this.vy += this.gravity * dt;
    this.y  += this.vy * dt;

    // check ground collision
    if (this.y + this.r >= SVG_HEIGHT) {
      if (!this.landed) {
        this.landed      = true;
        this.groundTimer = 0;
      }
      this.y  = SVG_HEIGHT - this.r;
      this.vy = 0;
    }

    // if on ground, start countdown to removal
    if (this.landed) {
      this.groundTimer += dt;
      if (this.groundTimer >= this.lifespan) {
        this.remove();
      }
    }
  }

  render() {
    this.el.setAttribute('x', `${this.x - this.r}`);
    this.el.setAttribute('y', `${this.y - this.r}`);
  }

  remove() {
    this.el.remove();
    const idx = foods.indexOf(this);
    if (idx !== -1) foods.splice(idx, 1);
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
      this.el.setAttribute('class', 'fish');
      document.getElementById('game-canvas').appendChild(this.el);
  
      bus.on('update', this.update.bind(this));
      bus.on('render', this.render.bind(this));
    }
  
    update(dt) {
      if (!this.alive) return;
  
      // hunger & death
      this.hunger += this.hungerRate * dt;
      if (this.hunger >= this.deathThreshold) {
        this.alive = false;
        this.el.remove();
        return;
      }
  
      // color shift (hue effect dims by CSS filter if desired)
      const t  = Math.min(this.hunger / this.deathThreshold, 1);
      const hue = 39 + (120 - 39) * t;
      this.el.style.filter = `hue-rotate(${hue - 39}deg)`;
  
      // coin drop
      this.dropTimer += dt;
      if (this.dropTimer >= this.dropInterval) {
        this.dropTimer -= this.dropInterval;
        bus.emit('coinDropped', { x: this.x, y: this.y, amount: 1 });
        new Coin(this.x, this.y, 1);
      }
  
      // behavior: wander vs seek
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
  
      // apply movement
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
      this.el.setAttribute('x', `${this.x - this.r}`);
      this.el.setAttribute('y', `${this.y - this.r}`);
    }
  }

// ─── COIN ENTITY ──────────────────────────────────────────────────────────────
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
      this.el.setAttribute('class', 'coin');
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
      // gravity drop
        this.vy += this.gravity * dt;
        this.y  += this.vy      * dt;

        // ground collision
        if (this.y + this.r >= SVG_HEIGHT) {
        if (!this.landed) {
            this.landed      = true;
            this.groundTimer = 0;
        }
        this.y  = SVG_HEIGHT - this.r;
        this.vy = 0;
        }

        // removal after landing lifespan
        if (this.landed) {
        this.groundTimer += dt;
        if (this.groundTimer >= this.lifespan) this.remove();
        }
    }
  
    render() {
        this.el.setAttribute('x', `${this.x - this.r}`);
        this.el.setAttribute('y', `${this.y - this.r}`);
    }
  
    remove() {
      this.el.remove();
    }
  }