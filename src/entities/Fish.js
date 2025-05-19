import { bus } from '../core/EventBus.js';
import { Entity } from './Entity.js';
import { entityManager } from '../systems/EntityManager.js';
import {
    ASSETS, SVG_WIDTH, SVG_HEIGHT,
    FISH_SPEED, HUNGER_RATE, HUNGRY_THRESHOLD, DEATH_THRESHOLD,
    DROP_INTERVAL, COIN_DROP_COOLDOWN,
    FISH_INITIAL_RADIUS_SMALL, FISH_FOOD_TO_LEVEL_2, FISH_FOOD_TO_LEVEL_3, FISH_FOOD_TO_LEVEL_4,
    FISH_LEVEL_SPEED_MULTIPLIER, FISH_LEVEL_RADIUS_MULTIPLIER,
    FISH_LEVEL_DROP_INTERVAL_MULTIPLIER, COIN_TYPES, NUMBER_BASE_FISH_LEVELS
} from '../core/constants.js';
import { distanceSquared } from '../core/utils.js';
import { Coin } from './Coin.js';

export class Fish extends Entity {
    constructor(config = {}) {
        super();

        this.level = 1;
        this.r = config.radius ?? FISH_INITIAL_RADIUS_SMALL;
        this.canDropCoins = false;
        this.coinDropValue = 0;
        this.foodEatenThisLevel = 0;
        this.nextUpgradeThreshold = FISH_FOOD_TO_LEVEL_2;

        this.x = config.x ?? SVG_WIDTH / 2;
        this.y = config.y ?? SVG_HEIGHT / 2;
        this.baseSpeed = config.speed ?? FISH_SPEED;
        this.baseDropInterval = config.dropInterval ?? DROP_INTERVAL;
        this.hungerRate = config.hungerRate ?? HUNGER_RATE;
        this.hungryThreshold = config.hungryThreshold ?? HUNGRY_THRESHOLD;
        this.deathThreshold = config.deathThreshold ?? DEATH_THRESHOLD;
        this.asset = config.assetUrl ?? ASSETS.FISH;
        this.maxHp = config.maxHp ?? 5;
        this.hp = this.maxHp;
        this.speed = this.baseSpeed;
        this.dropInterval = this.baseDropInterval;
        this.hunger = 0;
        this.isHungry = false;
        this.alive = true;
        this.facingRight = true;
        this.coinDropTimer = this.dropInterval * Math.random();
        this.coinCooldownTimer = 0;
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
            console.log(`Fish @ (${this.x.toFixed(0)},${this.y.toFixed(0)}) Lvl ${this.level} starved!`);
            this.remove();
            return;
        }

        const availableFood = Array.from(entityManager.getFoods());
        if (this.isHungry && availableFood.length > 0) {
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
                this.direction = { x: (closestFood.x - this.x) / bestDist, y: (closestFood.y - this.y) / bestDist };
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

        if (this.direction.x > 0.01) this.facingRight = true;
        else if (this.direction.x < -0.01) this.facingRight = false;

        if (this.coinCooldownTimer > 0) {
            this.coinCooldownTimer -= dt;
        }

        if (this.canDropCoins && !this.isHungry) {
            this.coinDropTimer -= dt;
            if (this.coinDropTimer <= 0 && this.coinCooldownTimer <= 0) {
                this.dropCoin();
                this.coinDropTimer = this.dropInterval;
                this.coinCooldownTimer = COIN_DROP_COOLDOWN;
            }
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
        // TODO this needs to be a constant
        if (this.level < NUMBER_BASE_FISH_LEVELS) {
            this.foodEatenThisLevel += 1;
            if (this.foodEatenThisLevel >= this.nextUpgradeThreshold) {
                this.upgrade();
            }
        }
    }

    upgrade() {
        this.level += 1;
        this.foodEatenThisLevel = 0;
        const type = (this.level === 2) ? 'SILVER' : (this.level === 3) ? 'GOLD' : 'DIAMOND';
        // console.log(`*** Fish upgraded to Level ${this.level}! ***`);
        const coinData = COIN_TYPES[type.toUpperCase()] || COIN_TYPES.SILVER;
        this.type = type.toUpperCase();
        if (this.level === 2) {
            this.canDropCoins = true;
            this.coinDropType = type;
            this.coinDropValue = coinData.value;
            this.nextUpgradeThreshold = FISH_FOOD_TO_LEVEL_3;
            this.r *= FISH_LEVEL_RADIUS_MULTIPLIER;
            this.speed *= FISH_LEVEL_SPEED_MULTIPLIER;
            this.dropInterval *= FISH_LEVEL_DROP_INTERVAL_MULTIPLIER;
        } else if (this.level === 3) {
            this.coinDropType = type;
            this.coinDropValue = coinData.value;
            this.nextUpgradeThreshold = FISH_FOOD_TO_LEVEL_4;
        } else if (this.level === 4) {
            this.coinDropType = type;
            this.coinDropValue = coinData.value;
            this.nextUpgradeThreshold = Infinity;
        }

        bus.emit('fishUpgraded', this);
    }

    dropCoin() {
        if (!this.canDropCoins || this.coinDropValue === 0) return;

        // console.log(`Fish Lvl ${this.level} dropping coin, value: ${this.coinDropValue}`);
        new Coin({
            x: this.x,
            y: this.y + this.r * 0.5,
            amount: this.coinDropValue,
            type: this.coinDropType,
        });
        bus.emit('coinDropped', { fish: this, amount: this.coinDropValue });
    }

    takeDamage(amount) {
        if (!this.alive) return;
        this.hp -= amount;
        bus.emit('fishDamaged', { fish: this, hpLeft: this.hp, damageTaken: amount });
        if (this.hp <= 0) {
            this.hp = 0;
            this.remove();
        }
    }

    remove() {
        if (!this.alive) return;
        super.remove();
        bus.off('update', this.updateCallback);
        entityManager.removeEntity(this);
    }
}