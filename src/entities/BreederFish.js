import { bus } from '../core/EventBus.js';
import { Fish } from './Fish.js';
import {
    BREEDER_FISH_RADIUS, BREEDER_FISH_SPEED, BREEDER_FISH_HUNGER_RATE,
    BREEDER_FISH_BIRTH_INTERVAL, ASSETS
} from '../core/constants.js';

let totalBabiesFromBreeders = 0;

export class BreederFish extends Fish {
    constructor(config = {}) {
        const breederConfig = {
            ...config,
            radius: config.radius ?? BREEDER_FISH_RADIUS,
            speed: config.speed ?? BREEDER_FISH_SPEED,
            hungerRate: config.hungerRate ?? BREEDER_FISH_HUNGER_RATE,
            assetUrl: ASSETS.BREEDER,
            dropInterval: config.dropInterval ?? Infinity,
        };
        super(breederConfig);

        this.birthInterval = BREEDER_FISH_BIRTH_INTERVAL;
        this.birthTimer = this.birthInterval * Math.random();
        this.babiesProduced = 0;
    }

    update(dt) {
        super.update(dt);

        if (!this.alive) return;

        if (!this.isHungry && this.hunger < (this.deathThreshold * 0.8)) {
            this.birthTimer -= dt;
            if (this.birthTimer <= 0) {
                this.giveBirth();
                this.birthTimer = this.birthInterval;
            }
        }
    }

    giveBirth() {
        new Fish({
            x: this.x + (Math.random() - 0.5) * this.r * 2,
            y: this.y + (Math.random() - 0.5) * this.r * 2,
            // radius: FISH_RADIUS * 0.7, // Smaller baby?
            // speed: FISH_SPEED * 1.2, // Faster baby?
        });

        this.babiesProduced++;
        totalBabiesFromBreeders++;
        bus.emit('babyFishBorn', { parent: this });
    }

    dropCoin() {
        // Breeder fish do not drop coins.
    }

    remove() {
        if (!this.alive) return;
        super.remove();
    }
}