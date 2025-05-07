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
        this.isPushed = false;
        this.pushedTimer = 0;
        this.pushedDirection = 0; // 1 for right, -1 for left

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
        // --- Handle Push State ---
        if (this.isPushed) {
            this.pushedTimer -= dt;
            
            // Apply push velocity (already set in handleClicked)
            // this.x += this.pushedDirection * (this.speed * 1.5) * dt; // vx is already set

            if (this.pushedTimer <= 0) {
                this.isPushed = false;
                this.pushedDirection = 0;
                // After push, boss will naturally re-evaluate target or wander
                this.vx = 0; // Reset vx so it doesn't keep gliding
                this.selectTargetFish(); // Re-evaluate target immediately
            }
        }

        // --- Target Selection (only if NOT being pushed) ---
        if (!this.isPushed) {
            this.retargetTimer -= dt;
            if (!this.targetFish || !this.targetFish.alive || this.retargetTimer <= 0) {
                this.selectTargetFish();
                this.retargetTimer = 2000 + Math.random() * 3000;
            }
        }

        // --- Movement (only if NOT being pushed, or if pushed logic sets vx/vy) ---
        if (!this.isPushed) {
            if (this.targetFish) {
                const dx = this.targetFish.x - this.x;
                const dy = this.targetFish.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > this.r * 0.5) {
                    this.vx = (dx / dist) * this.speed;
                    this.vy = (dy / dist) * this.speed;
                } else {
                    this.vx = 0;
                    this.vy = 0;
                }
            } else {
                // No fish to target and not pushed, slow down/wander (currently slows down)
                this.vx *= 0.95;
                this.vy *= 0.95;
                // If vx/vy become very small, could initiate a gentle wander if desired
                if (Math.abs(this.vx) < 0.001 && Math.abs(this.vy) < 0.001 && !this.targetFish) {
                    // Example: Small random movement if completely idle
                    // if (Math.random() < 0.01) { // Low chance per frame
                    //     this.vx = (Math.random() - 0.5) * this.speed * 0.5;
                    //     this.vy = (Math.random() - 0.5) * this.speed * 0.5;
                    // }
                }
            }
        }
        // else, if pushed, vx is already set by handleClicked or previous push update iteration

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Clamp position
        this.x = Math.max(this.r, Math.min(SVG_WIDTH - this.r, this.x));
        this.y = Math.max(this.r, Math.min(SVG_HEIGHT - this.r, this.y));

        // Update facing direction
        if (this.vx > 0.001) this.facingRight = false;
        else if (this.vx < -0.001) this.facingRight = true;

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

    handleClicked = (eventData) => { // eventData now contains { entity, clickPosition }
        if (!this.alive) return;

        const { entity: clickedEntity, clickPosition } = eventData;

        if (clickedEntity === this) {
            console.log('Boss was clicked by player at SVG coords:', clickPosition);
            const playerClickDamage = 10; // Standard damage for a click
            this.takeDamage(playerClickDamage);

            // --- "Push" Logic ---
            // Determine if click was on left or right half of the boss
            const clickRelativeToBossX = clickPosition.x - this.x;

            const pushForce = this.speed * 50; // How much the click "pushes" the boss horizontally
                                             // This is an impulse, so we'll set vx directly for a short burst or override target
            const pushDuration = 300; // ms for how long the push effect influences movement

            if (clickRelativeToBossX < 0) {
                // Clicked on the LEFT side, push boss RIGHT
                console.log("Boss: Clicked on left, pushing right.");
                this.vx = this.speed * 1.5; // Override current vx to move right
                // Optional: Could set a temporary target or a timed velocity override
                this.pushedDirection = 1; // 1 for right
            } else {
                // Clicked on the RIGHT side, push boss LEFT
                console.log("Boss: Clicked on right, pushing left.");
                this.vx = -this.speed * 10.5; // Override current vx to move left
                this.pushedDirection = -1; // -1 for left
            }

            this.isPushed = true;
            this.pushedTimer = pushDuration;

            // Interrupt current fish targeting to react to push
            this.targetFish = null;
            this.retargetTimer = pushDuration + 500; // Don't pick a new fish target immediately

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