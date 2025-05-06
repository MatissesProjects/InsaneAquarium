import { bus } from '../core/EventBus.js';
import { Fish } from './Fish.js'; // Extend the base Fish class
import { entityManager } from '../systems/EntityManager.js';
import {
    // Breeder Fish specific constants
    BREEDER_FISH_RADIUS, BREEDER_FISH_SPEED, BREEDER_FISH_HUNGER_RATE,
    BREEDER_FISH_BIRTH_INTERVAL, BREEDER_FISH_MAX_BABIES,
    // General constants if needed for base fish behavior
    SVG_WIDTH, SVG_HEIGHT, HUNGRY_THRESHOLD, DEATH_THRESHOLD, ASSETS
} from '../core/constants.js';

// Keep track of babies produced by breeders globally or per breeder type
let totalBabiesFromBreeders = 0; // Simple global counter for now

export class BreederFish extends Fish {
    constructor(config = {}) {
        const breederConfig = {
            ...config, // Pass through any x, y from caller
            radius: config.radius ?? BREEDER_FISH_RADIUS,
            speed: config.speed ?? BREEDER_FISH_SPEED,
            hungerRate: config.hungerRate ?? BREEDER_FISH_HUNGER_RATE,
            assetUrl: ASSETS.BREEDER, //config.assetUrl ?? 
            dropInterval: config.dropInterval ?? Infinity,
        };
        super(breederConfig);

        this.birthInterval = BREEDER_FISH_BIRTH_INTERVAL;
        this.birthTimer = this.birthInterval * Math.random();
        this.babiesProduced = 0;

        console.log(`BreederFish created @ (${this.x.toFixed(0)},${this.y.toFixed(0)})`);
    }

    // We still want all the base Fish update logic (hunger, movement, etc.)
    update(dt) {
        super.update(dt);

        if (!this.alive) return;

        if (!this.isHungry && this.hunger < (this.deathThreshold * 0.8) && totalBabiesFromBreeders < BREEDER_FISH_MAX_BABIES) {
            this.birthTimer -= dt;
            if (this.birthTimer <= 0) {
                this.giveBirth();
                this.birthTimer = this.birthInterval; // Reset timer
            }
        }
    }

    giveBirth() {
        console.log(`BreederFish @ (${this.x.toFixed(0)},${this.y.toFixed(0)}) is giving birth!`);
        new Fish({
            x: this.x + (Math.random() - 0.5) * this.r * 2, // Spawn nearby
            y: this.y + (Math.random() - 0.5) * this.r * 2,
            // radius: FISH_RADIUS * 0.7, // Smaller baby?
            // speed: FISH_SPEED * 1.2, // Faster baby?
        });

        this.babiesProduced++;
        totalBabiesFromBreeders++;
        bus.emit('babyFishBorn', { parent: this });
        // if (this.babiesProduced >= SOME_LIFETIME_BABY_LIMIT) { this.canGiveBirth = false; }
    }

    dropCoin() {
        // Breeder fish do not drop coins.
    }

    remove() {
        if (!this.alive) return;
        super.remove();
    }
}