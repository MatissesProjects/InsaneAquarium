import { bus } from './EventBus.js';

// ─── GLOBAL FOOD LIST ─────────────────────────────────────────────────────────
export const foods = [];

// ─── DEFAULT CONSTANTS ─────────────────────────────────────────────────────────
const SVG_WIDTH         = 800;
const SVG_HEIGHT        = 375;
const DEFAULT_GRAVITY           = 0.00005;   // px per ms²
const DEFAULT_BASE_LIFETIME     = 3000;      // ms per level on ground before removal
const DEFAULT_HUNGER_RATE       = 0.000125;  // hunger units per ms
const DEFAULT_HUNGRY_THRESHOLD  = 1;         // hunger at which fish begins to seek food
const DEFAULT_DEATH_THRESHOLD   = 5;         // hunger at which fish dies and is removed

// ─── FOOD ENTITY ──────────────────────────────────────────────────────────────
export class Food {
  /**
   * @param {number} x - initial x position
   * @param {number} y - initial y position
   * @param {number} [level=1] - determines how long the food lasts on ground,
   *                             and how good it is at feeding the fish
   * @param {number} [gravity] - optional gravity override for drop speed
   */
  constructor(x, y, level = 1, gravity = DEFAULT_GRAVITY) {
    this.x           = x;
    this.y           = y;
    this.r           = 2;
    this.vy          = 0;
    this.level       = level;
    this.gravity     = gravity;

    this.landed      = false;
    this.groundTimer = 0;
    this.lifespan    = DEFAULT_BASE_LIFETIME * level;

    // create SVG circle
    this.el = document.createElementNS('http://www.w3.org/2000/svg','circle');
    this.el.setAttribute('class', 'food');
    this.el.setAttribute('r', `${this.r}`);
    this.el.setAttribute('fill', 'gold');
    document.getElementById('game-canvas').appendChild(this.el);

    foods.push(this);
    bus.on('update', this.update.bind(this));
    bus.on('render', this.render.bind(this));
  }

  update(dt) {
    // fall under gravity
    this.vy += (this.gravity * dt);
    this.y  += (this.vy * dt);

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
    this.el.setAttribute('cx', `${this.x}`);
    this.el.setAttribute('cy', `${this.y}`);
  }

  remove() {
    this.el.remove();
    const idx = foods.indexOf(this);
    if (idx !== -1) foods.splice(idx, 1);
  }
}

// ─── FISH ENTITY ──────────────────────────────────────────────────────────────
export class Fish {
  /**
   * @param {object} [config] - optional overrides
   * @param {number} [config.x=100]
   * @param {number} [config.y=200]
   * @param {number} [config.radius=5]
   * @param {number} [config.speed=0.08]
   * @param {number} [config.hungerRate]
   * @param {number} [config.hungryThreshold]
   * @param {number} [config.deathThreshold]
   */
  constructor(config = {}) {
    // configurable properties
    this.x                = config.x ?? 100;
    this.y                = config.y ?? 200;
    this.r                = config.radius ?? 5;
    this.speed            = config.speed ?? 0.08;
    this.hungerRate       = config.hungerRate ?? DEFAULT_HUNGER_RATE;
    this.hungryThreshold  = config.hungryThreshold ?? DEFAULT_HUNGRY_THRESHOLD;
    this.deathThreshold   = config.deathThreshold ?? DEFAULT_DEATH_THRESHOLD;

    // movement
    this.dirChangeTimer   = 0;
    this.direction        = { x: 1, y: 0 };

    // health & leveling
    this.health               = 1;
    this.level                = 1;
    this.nextUpgradeThreshold = 2;

    // hunger & life state
    this.hunger = 0;
    this.alive  = true;

    // create SVG circle
    this.el = document.createElementNS('http://www.w3.org/2000/svg','circle');
    this.el.setAttribute('class', 'fish');
    this.el.setAttribute('r', `${this.r}`);
    this.el.setAttribute('fill', 'hsl(39, 80%, 50%)');
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

    // color shift based on hunger
    const t    = Math.min(this.hunger / this.deathThreshold, 1);
    // go from yellow (39) to green (81)
    const hue  = 39 + (120 - 39) * t;
    this.el.setAttribute('fill', `hsl(${hue}, 80%, 50%)`);

    // decide behavior: wander or seek
    const isHungry = this.hunger >= this.hungryThreshold;
    if (isHungry && foods.length > 0) {
      // seek closest
      let closest  = foods[0];
      let bestDist = Infinity;
      for (const f of foods) {
        const dx = f.x - this.x;
        const dy = f.y - this.y;
        const d  = Math.hypot(dx, dy);
        if (d < bestDist) {
          bestDist = d;
          closest  = f;
        }
      }
      this.direction.x = (closest.x - this.x) / bestDist;
      this.direction.y = (closest.y - this.y) / bestDist;

      // eat
      if (bestDist < this.r + closest.r) {
        closest.remove();
        this.onEat();
      }

    } else {
      // wander
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

    // boundary
    if (this.x < -this.r)            this.x = SVG_WIDTH + this.r;
    if (this.x > SVG_WIDTH + this.r) this.x = -this.r;
    this.y = Math.min(Math.max(this.y, this.r), SVG_HEIGHT - this.r);
  }

  onEat() {
    // reset hunger, increase health
    this.health += this.level;
    this.hunger = this.health;
    if (this.health >= this.nextUpgradeThreshold) {
      this.upgrade();
      this.nextUpgradeThreshold *= 1.25;
    }
  }

  upgrade() {
    this.level += 1;
    this.speed *= 1.0125;
    this.r     *= 1.2;
    this.el.setAttribute('r', `${this.r}`);
  }

  render() {
    if (!this.alive) return;
    this.el.setAttribute('cx', `${this.x}`);
    this.el.setAttribute('cy', `${this.y}`);
  }
}