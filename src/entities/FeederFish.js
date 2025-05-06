import { bus } from '../core/EventBus.js';
import { Fish } from './Fish.js'; // Extend the base Fish class
import { Food } from './Food.js'; // To create food
import { entityManager } from '../systems/EntityManager.js';
import {
    // Feeder Fish specific constants
    FEEDER_FISH_RADIUS, FEEDER_FISH_SPEED, FEEDER_FISH_HUNGER_RATE,
    FEEDER_FISH_FOOD_DROP_INTERVAL, FEEDER_FISH_FOOD_DROP_LEVEL,
    // General constants if needed
    SVG_WIDTH, SVG_HEIGHT, ASSETS
} from '../core/constants.js';

export class FeederFish extends Fish {
    constructor(config = {}) {
        const feederConfig = {
            ...config,
            radius: config.radius ?? FEEDER_FISH_RADIUS,
            speed: config.speed ?? FEEDER_FISH_SPEED,
            hungerRate: config.hungerRate ?? FEEDER_FISH_HUNGER_RATE,
            assetUrl: ASSETS.FEEDER,
            dropInterval: config.dropInterval ?? Infinity, // Effectively disables coin drops from base Fish
        };
        super(feederConfig); // Call the base Fish constructor

        this.foodDropInterval = FEEDER_FISH_FOOD_DROP_INTERVAL;
        this.foodDropTimer = this.foodDropInterval * Math.random(); // Stagger initial food drops
        this.foodDropLevel = config.foodDropLevel ?? FEEDER_FISH_FOOD_DROP_LEVEL;

        console.log(`FeederFish created @ (${this.x.toFixed(0)},${this.y.toFixed(0)})`);
    }

    // Override the update method to add food dropping logic
    update(dt) {
        super.update(dt); // Call base Fish update logic (hunger, movement, etc.)

        if (!this.alive) return;

        // --- Food Dropping Logic ---
        // Feeder fish drop food even if slightly hungry, but not starving
        if (!this.isHungry && this.hunger < (this.deathThreshold * 0.8)) {
            this.foodDropTimer -= dt;
            if (this.foodDropTimer <= 0) {
                this.dropFood();
                this.foodDropTimer = this.foodDropInterval; // Reset timer
            }
        }
    }

    dropFood() {
        console.log(`FeederFish @ (${this.x.toFixed(0)},${this.y.toFixed(0)}) is dropping food!`);
        // Create a new Food instance slightly below the FeederFish
        // The food level can be configured or use a default for the FeederFish
        new Food({
            x: this.x,
            y: this.y + this.r * 0.5, // Drop slightly below
            level: this.foodDropLevel
        });

        bus.emit('feederFoodDropped', { feederFish: this, foodLevel: this.foodDropLevel });
    }

    dropCoin() {
        // Feeder fish do not drop coins.
    }
}