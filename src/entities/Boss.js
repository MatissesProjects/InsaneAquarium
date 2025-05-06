// src/entities/Boss.js

import { bus } from '../core/EventBus.js';
import { Entity } from './Entity.js';
import { entityManager } from '../systems/EntityManager.js';
import {
    SVG_WIDTH, SVG_HEIGHT,
    BOSS_RADIUS, BOSS_SPEED, BOSS_HP, BOSS_ATTACK_POWER, BOSS_ATTACK_COOLDOWN, ASSETS
} from '../core/constants.js';
import { distanceSquared } from '../core/utils.js'; // Assuming distance is available

export class Boss extends Entity {
    constructor(config = {}) {
        const bossConfig = {
            ...config,
            assetUrl: ASSETS.BOSS_BARBARIAN,
            dropInterval: config.dropInterval ?? Infinity
        };
        super(bossConfig);

        this.r = config.radius ?? BOSS_RADIUS;
        this.speed = config.speed ?? BOSS_SPEED;
        this.hp = config.hp ?? BOSS_HP;
        this.maxHp = this.hp;
        this.asset = ASSETS.BOSS_BARBARIAN;
        
        this.attackPower = config.attackPower ?? BOSS_ATTACK_POWER;
        this.attackCooldown = config.attackCooldown ?? BOSS_ATTACK_COOLDOWN;
        this.attackTimer = 0; // Ready to attack immediately

        // Spawn position (e.g., top middle, or off-screen then moves in)
        this.x = config.x ?? SVG_WIDTH / 2;
        this.y = config.y ?? this.r + 10; // Start near the top

        this.vx = 0;
        this.vy = 0;
        this.facingRight = true; // Initial orientation

        this.targetFish = null;
        this.retargetTimer = 0; // Timer to pick a new fish target

        console.log(`Boss created @ (${this.x.toFixed(0)},${this.y.toFixed(0)}) with ${this.hp} HP.`);

        bus.on('update', this.updateCallback);
        bus.on('entityClicked', this.handleClicked);
        entityManager.addEntity(this);
    }

    updateCallback = (dt) => {
        if (!this.alive) return;
        const safeDt = Math.min(dt, 100);
        this.update(safeDt);
    };

    update(dt) {
        this.retargetTimer -= dt;
        if (!this.targetFish || !this.targetFish.alive || this.retargetTimer <= 0) {
            this.selectTargetFish();
            this.retargetTimer = 2000 + Math.random() * 3000; // Retarget every 2-5 seconds
        }

        if (this.targetFish) {
            const dx = this.targetFish.x - this.x;
            const dy = this.targetFish.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy); // distance() util can be used here too

            if (dist > this.r * 0.5) { // Move if not too close
                this.vx = (dx / dist) * this.speed;
                this.vy = (dy / dist) * this.speed;
            } else {
                this.vx = 0;
                this.vy = 0;
            }
        } else {
            this.vx *= 0.95;
            this.vy *= 0.95;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.x = Math.max(this.r, Math.min(SVG_WIDTH - this.r, this.x));
        this.y = Math.max(this.r, Math.min(SVG_HEIGHT - this.r, this.y));

        if (this.vx < 0.001) this.facingRight = true;
        else if (this.vx > -0.001) this.facingRight = false;

        if (this.attackTimer > 0) {
            this.attackTimer -= dt;
        }

        if (this.attackTimer <= 0) {
            const allFish = [
                ...entityManager.getEntitiesByType('Fish'),
                ...entityManager.getEntitiesByType('BreederFish'),
                ...entityManager.getEntitiesByType('FeederFish')
            ];

            for (const fish of allFish) {
                if (!fish.alive) continue;

                const distSq = distanceSquared(this.x, this.y, fish.x, fish.y);
                const collisionThresholdSq = (this.r + fish.r) * (this.r + fish.r);

                if (distSq < collisionThresholdSq) {
                    console.log(`Boss attacking fish @ (${fish.x.toFixed(0)},${fish.y.toFixed(0)})!`);
                    fish.takeDamage(this.attackPower);
                    bus.emit('bossAttack', { boss: this, target: fish, damage: this.attackPower });
                    this.attackTimer = this.attackCooldown; // Reset cooldown
                    // TODO: Visual/Audio feedback for attack
                    break; // Attack one fish per cooldown period
                }
            }
        }
    }

    handleClicked = (clickedEntity) => {
        if (!this.alive) return;

        console.log(`Clicked entity: ${clickedEntity.constructor.name}`);

        if (clickedEntity === this) {
            console.log('Boss was clicked by player!');
            // Player deals damage to the boss
            const playerClickDamage = 10; // Example damage amount, could be a constant
            this.takeDamage(playerClickDamage);
            // TODO: Add visual/audio feedback for player hitting boss
        }
    };

    selectTargetFish() {
        const allFish = [
            ...entityManager.getEntitiesByType('Fish'),
            ...entityManager.getEntitiesByType('BreederFish'),
            ...entityManager.getEntitiesByType('FeederFish')
        ].filter(f => f.alive); // Only target living fish

        if (allFish.length > 0) {
            this.targetFish = allFish[Math.floor(Math.random() * allFish.length)];
        } else {
            this.targetFish = null;
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        console.log(`Boss took ${amount} damage, HP: ${this.hp}/${this.maxHp}`);
        bus.emit('bossDamaged', { boss: this, hpLeft: this.hp, damageTaken: amount });

        if (this.hp <= 0) {
            this.hp = 0;
            console.log("Boss DEFEATED!");
            bus.emit('bossDefeated', { boss: this });
            this.remove();
        }
    }

    remove() {
        if (!this.alive) return;
        console.log("Boss removed from game.");
        super.remove();
        bus.off('update', this.updateCallback);
        entityManager.removeEntity(this);
        bus.off('entityClicked', this.handleClicked);
    }
}