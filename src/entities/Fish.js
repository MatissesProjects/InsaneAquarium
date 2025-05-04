import { bus } from '../core/EventBus.js';
import { Entity } from './Entity.js';
import { entityManager } from '../systems/EntityManager.js';
import {
    ASSETS, FISH_RADIUS, HUNGER_RATE, HUNGRY_THRESHOLD, DEATH_THRESHOLD,
    FISH_SPEED, FISH_TURN_RATE, FISH_VERTICAL_SPEED, FISH_EAT_RADIUS_SQ,
    DROP_INTERVAL, SVG_WIDTH, SVG_HEIGHT
} from '../core/constants.js';
import { distanceSquared } from '../core/utils.js';
import { Coin } from './Coin.js'; // To drop coins

export class Fish extends Entity {
    constructor({ x, y }) {
        super(); // Sets this.alive = true
        this.x = x;
        this.y = y;
        this.r = FISH_RADIUS;
        this.asset = ASSETS.FISH; // For renderer

        this.hunger = 0; // Starts not hungry
        this.isHungry = false;

        // Movement
        this.vx = (Math.random() - 0.5) * FISH_SPEED; // Initial random direction
        this.vy = (Math.random() - 0.5) * FISH_VERTICAL_SPEED * 0.5; // Slower vertical start
        this.targetX = x;
        this.targetY = y + (Math.random() - 0.5) * 100; // Initial vertical target
        this.setNewTarget(); // Set a random target position

        this.coinDropTimer = DROP_INTERVAL * Math.random(); // Stagger initial drops

        entityManager.addEntity(this);
        bus.on('update', this.updateCallback); // Use arrow func or .bind(this)
    }

    setNewTarget() {
        this.targetX = Math.random() * (SVG_WIDTH - this.r * 2) + this.r;
        // Keep target within vertical bounds, slightly away from top/bottom
        this.targetY = Math.random() * (SVG_HEIGHT * 0.8) + (SVG_HEIGHT * 0.1);
    }

    updateCallback = (dt) => {
        if (!this.alive) return;
        this.update(dt);
    };

    update(dt) {
        // --- Hunger ---
        this.hunger += HUNGER_RATE * dt;
        this.isHungry = this.hunger > HUNGRY_THRESHOLD;

        if (this.hunger > DEATH_THRESHOLD) {
            console.log('Fish starved!');
            this.remove();
            return; // Stop update if dead
        }

        // --- Movement ---
        let targetFood = null;
        if (this.isHungry) {
            // Find closest food
            let minFoodDistSq = Infinity;
            for (const food of entityManager.getFoods()) {
                const distSq = distanceSquared(this.x, this.y, food.x, food.y);
                if (distSq < minFoodDistSq) {
                    minFoodDistSq = distSq;
                    targetFood = food;
                }
            }
        }

        let currentTargetX = this.targetX;
        let currentTargetY = this.targetY;

        if (targetFood) {
            // Override wander target if hungry and food exists
            currentTargetX = targetFood.x;
            currentTargetY = targetFood.y;

            // Check if close enough to eat
             const eatRadiusSq = FISH_EAT_RADIUS_SQ + (targetFood.r * targetFood.r); // Adjust based on food size
            if (distanceSquared(this.x, this.y, targetFood.x, targetFood.y) < eatRadiusSq) {
                this.eat(targetFood);
                targetFood = null; // Stop targeting this food
            }
        }

        // --- Steering ---
        const dx = currentTargetX - this.x;
        const dy = currentTargetY - this.y;
        const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

        // If close to target (or no food target), pick a new wander target
        if (!targetFood && distanceToTarget < this.r * 2) {
            this.setNewTarget();
        } else {
             // Steer towards target
            const targetAngle = Math.atan2(dy, dx);
            const currentAngle = Math.atan2(this.vy, this.vx); // Current movement angle

            // Simple interpolation towards target angle
            let angleDiff = targetAngle - currentAngle;
            // Normalize angle difference to (-PI, PI)
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

            const turnAmount = FISH_TURN_RATE * dt;
            const newAngle = currentAngle + Math.max(-turnAmount, Math.min(turnAmount, angleDiff));

            // Adjust speed based on hunger? Maybe slow down when full?
            const speed = FISH_SPEED;
            this.vx = Math.cos(newAngle) * speed;
            // Give slightly more priority to vertical movement towards food?
            const verticalSpeed = targetFood ? FISH_VERTICAL_SPEED * 1.5 : FISH_VERTICAL_SPEED;
            this.vy = Math.sin(newAngle) * (targetFood ? Math.sign(dy) * verticalSpeed : verticalSpeed); // Simplified vertical aim
        }


        // Apply velocity
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Clamp position within bounds (simple edge collision)
        this.x = Math.max(this.r, Math.min(SVG_WIDTH - this.r, this.x));
        this.y = Math.max(this.r, Math.min(SVG_HEIGHT - this.r, this.y));

         // Simple boundary collision response: reverse velocity component
        if (this.x <= this.r || this.x >= SVG_WIDTH - this.r) {
            this.vx *= -0.8; // Reverse and dampen horizontal velocity
             this.setNewTarget(); // Pick new target to prevent getting stuck
        }
        if (this.y <= this.r || this.y >= SVG_HEIGHT - this.r) {
            this.vy *= -0.8; // Reverse and dampen vertical velocity
            this.setNewTarget();
        }

        // --- Coin Dropping ---
        if (!this.isHungry) { // Only drop coins when not hungry
            this.coinDropTimer -= dt;
            if (this.coinDropTimer <= 0) {
                this.dropCoin();
                this.coinDropTimer = DROP_INTERVAL; // Reset timer
            }
        }
    }

    eat(food) {
        // console.log('Fish ate food');
        this.hunger = 0; // Reset hunger
        this.isHungry = false;
        food.remove(); // Tell the food to remove itself
        bus.emit('foodEaten', { fish: this, food: food }); // Notify potentially other systems
    }

    dropCoin() {
        // console.log('Fish dropping coin');
        new Coin({ x: this.x, y: this.y + this.r }); // Drop slightly below fish center
         bus.emit('coinDropped', { fish: this });
    }

    remove() {
        if (!this.alive) return; // Prevent double removal
        super.remove(); // Sets this.alive = false
        bus.off('update', this.updateCallback); // Unsubscribe from updates
        entityManager.removeEntity(this); // Notify manager
        // console.log('Fish removed');
    }
}