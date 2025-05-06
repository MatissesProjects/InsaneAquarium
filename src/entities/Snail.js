import { bus } from '../core/EventBus.js';
import { Entity } from './Entity.js';
import { entityManager } from '../systems/EntityManager.js';
import {
    SVG_WIDTH, SVG_HEIGHT, SNAIL_RADIUS, SNAIL_SPEED
} from '../core/constants.js';
import { distanceSquared } from '../core/utils.js';

export class Snail extends Entity {
    constructor(config = {}) {
        super();

        this.r = SNAIL_RADIUS;
        this.speed = SNAIL_SPEED;
        this.asset = './assets/snail.svg';

        this.x = config.x ?? this.r;
        this.y = config.y ?? (SVG_HEIGHT - this.r);
        this.vx = 0;
        this.vy = 0;
        this.facingRight = true;

        entityManager.addEntity(this);
        bus.on('update', this.updateCallback);
    }

    updateCallback = (dt) => {
        if (!this.alive) return;
        const safeDt = Math.min(dt, 100);
        this.update(safeDt);
    };

    update(dt) {
        let targetCoin = null;
        let bestDistSq = Infinity;
        let landedCoinsExist = false;

        for (const coin of entityManager.getCoins()) {
            if (coin.alive && coin.landed) {
                landedCoinsExist = true;
                const distSq = distanceSquared(this.x, this.y, coin.x, coin.y);
                if (distSq < bestDistSq) {
                    bestDistSq = distSq;
                    targetCoin = coin;
                }
            }
        }

        if (targetCoin) {
            const dx = targetCoin.x - this.x;
            const deadZone = this.r * 0.5;
            if (dx > deadZone) {
                this.vx = this.speed;
            } else if (dx < -deadZone) {
                this.vx = -this.speed;
            } else {
                this.vx = 0;
            }
        } else {
            this.vx = 0;
        }

        if (this.vx > 0) {
            this.facingRight = true;
        } else if (this.vx < 0) {
            this.facingRight = false;
        }

        this.x += this.vx * dt;

        this.x = Math.max(this.r, Math.min(SVG_WIDTH - this.r, this.x));
        this.y = SVG_HEIGHT - this.r; // Ensure always on bottom

        const collectionRadius = this.r * 1.2;
        for (const coin of entityManager.getCoins()) {
            if (!coin.alive || !coin.landed) continue;

            const distSq = distanceSquared(this.x, this.y, coin.x, coin.y);
            const radiiSq = (collectionRadius + coin.r) * (collectionRadius + coin.r);

            if (distSq < radiiSq) {
                bus.emit('coinCollected', coin.amount);
                coin.remove();
            }
        }
    }

    remove() {
        if (!this.alive) return;
        console.log("Snail removed");
        super.remove();
        bus.off('update', this.updateCallback);
        entityManager.removeEntity(this);
    }
}