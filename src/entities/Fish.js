import { bus } from '../core/EventBus.js';
import { Entity } from './Entity.js';
import { entityManager } from '../systems/EntityManager.js';
import {
    ASSETS, SVG_WIDTH, SVG_HEIGHT,
    FISH_RADIUS, FISH_SPEED, HUNGER_RATE, HUNGRY_THRESHOLD, DEATH_THRESHOLD,
    DROP_INTERVAL, COIN_DROP_COOLDOWN,
    FISH_INITIAL_HEALTH_THRESHOLD, FISH_HEALTH_THRESHOLD_MULTIPLIER,
    FISH_LEVEL_SPEED_MULTIPLIER, FISH_LEVEL_RADIUS_MULTIPLIER,
    FISH_LEVEL_DROP_INTERVAL_MULTIPLIER
} from '../core/constants.js';
import { distanceSquared } from '../core/utils.js';
import { Coin } from './Coin.js';

export class Fish extends Entity {
    constructor(config = {}) {
        super();
        this.x = config.x ?? SVG_WIDTH / 2;
        this.y = config.y ?? SVG_HEIGHT / 2;
        this.baseRadius = config.radius ?? FISH_RADIUS;
        this.baseSpeed = config.speed ?? FISH_SPEED;
        this.baseDropInterval = config.dropInterval ?? DROP_INTERVAL;
        this.hungerRate = config.hungerRate ?? HUNGER_RATE;
        this.hungryThreshold = config.hungryThreshold ?? HUNGRY_THRESHOLD;
        this.deathThreshold = config.deathThreshold ?? DEATH_THRESHOLD;
        this.asset = config.assetUrl ?? ASSETS.FISH;
        this.r = this.baseRadius;
        this.speed = this.baseSpeed;
        this.dropInterval = this.baseDropInterval;
        this.hunger = 0;
        this.isHungry = false;
        this.alive = true;
        this.facingRight = true;
        this.coinDropTimer = this.dropInterval * Math.random();
        this.coinCooldownTimer = 0;
        this.level = 1;
        this.health = 0;
        this.nextUpgradeThreshold = FISH_INITIAL_HEALTH_THRESHOLD;
        this.direction = { x: (Math.random() > 0.5 ? 1 : -1), y: 0 };
        this.dirChangeTimer = 1000 + Math.random() * 2000;
        entityManager.addEntity(this);
        bus.on('update', this.updateCallback);
    }

    updateCallback = (dt) => {
        if (!this.alive) return;
        const safeDt = Math.min(dt, 100);
        this.update(safeDt);
    };

    update(dt) {
        this.hunger += this.hungerRate * dt;
        this.isHungry = this.hunger >= this.hungryThreshold;

        if (this.hunger >= this.deathThreshold) {
            console.log(`Fish @ (${this.x.toFixed(0)},${this.y.toFixed(0)}) starved!`);
            this.remove();
            return;
        }

        const availableFood = Array.from(entityManager.getFoods());

        if (this.isHungry && availableFood.length > 0) {
            // Find closest food
            let closestFood = null;
            let bestDistSq = Infinity;
            for (const food of availableFood) {
                if (!food.alive) continue;
                const distSq = distanceSquared(this.x, this.y, food.x, food.y);
                if (distSq < bestDistSq) {
                    bestDistSq = distSq;
                    closestFood = food;
                }
            }

            if (closestFood) {
                const bestDist = Math.sqrt(bestDistSq);
                // Set direction vector towards closest food
                this.direction = {
                    x: (closestFood.x - this.x) / bestDist,
                    y: (closestFood.y - this.y) / bestDist
                };

                if (bestDist < this.r + closestFood.r) {
                    this.eat(closestFood);
                }
            } else {
                 this.setWanderDirection(dt);
            }

        } else {
            this.setWanderDirection(dt);
        }

        this.x += this.direction.x * this.speed * dt;
        this.y += this.direction.y * this.speed * dt;

        if (this.x < -this.r) this.x = SVG_WIDTH + this.r;
        if (this.x > SVG_WIDTH + this.r) this.x = -this.r;
        this.y = Math.max(this.r, Math.min(SVG_HEIGHT - this.r, this.y));

        if (this.direction.x > 0.01) {
            this.facingRight = true;
        } else if (this.direction.x < -0.01) {
            this.facingRight = false;
        }

        if (this.coinCooldownTimer > 0) {
            this.coinCooldownTimer -= dt;
        }

        this.coinDropTimer -= dt;
        if (this.coinDropTimer <= 0 && this.coinCooldownTimer <= 0) {
            this.dropCoin();
            this.coinDropTimer = this.dropInterval;
            this.coinCooldownTimer = COIN_DROP_COOLDOWN;
        }
    }

    setWanderDirection(dt) {
         this.dirChangeTimer -= dt;
         if (this.dirChangeTimer <= 0) {
             const angle = Math.random() * 2 * Math.PI;
             this.direction = { x: Math.cos(angle), y: Math.sin(angle) };
             this.dirChangeTimer = 1000 + Math.random() * 2000;
         }
    }

    eat(food) {
        food.remove();
        this.onEat();
        bus.emit('foodEaten', { fish: this, food: food });
    }

    onEat() {
        this.hunger = 0;
        this.isHungry = false;
        this.health += 1;
        if (this.health >= this.nextUpgradeThreshold) {
            this.upgrade();
        }
    }

    upgrade() {
        this.level += 1;
        this.health = 0;
        this.speed *= FISH_LEVEL_SPEED_MULTIPLIER;
        this.r *= FISH_LEVEL_RADIUS_MULTIPLIER;
        this.dropInterval *= FISH_LEVEL_DROP_INTERVAL_MULTIPLIER;
        this.nextUpgradeThreshold *= FISH_HEALTH_THRESHOLD_MULTIPLIER;
        console.log(`*** Fish upgraded to Level ${this.level}! ***`);
        bus.emit('fishUpgraded', this);
    }

    dropCoin() {
        const coinValue = 1;
        new Coin({ x: this.x, y: this.y + this.r * 0.5, amount: coinValue });
        bus.emit('coinDropped', { fish: this, amount: coinValue });
    }

    remove() {
        if (!this.alive) return;
        super.remove();
        bus.off('update', this.updateCallback);
        entityManager.removeEntity(this);
    }
}