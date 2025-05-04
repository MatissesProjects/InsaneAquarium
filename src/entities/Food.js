import { bus } from '../core/EventBus.js';
import { entityManager } from '../systems/EntityManager.js';
import { BASE_FOOD_LIFETIME, FOOD_RADIUS } from '../core/constants.js'; // Use specific radius
import { FallingEntity } from './FallingEntity.js';

export class Food extends FallingEntity {
  constructor({ x, y, level = 1 }) {
    // Use constant for radius
    super(x, y, FOOD_RADIUS);
    this.lifespan = BASE_FOOD_LIFETIME * level; // Adjust lifespan based on level

    // No direct element creation or rendering here!
    // No direct adding to a 'foods' array here!

    // Register with EntityManager
    entityManager.addEntity(this);

    // Listen for updates
    bus.on('update', this.updateCallback);
  }

  updateCallback = (dt) => {
      if (!this.alive) return;
      this.update(dt);
  };

  update(dt) {
    super.update(dt); // Apply physics

    // Handle lifespan expiration after landing
    if (this.landed) {
      this.groundTimer += dt;
      if (this.groundTimer >= this.lifespan) {
          // console.log('Food expired');
          this.remove();
      }
    }
  }

  remove() {
    if (!this.alive) return; // Prevent double removal
    super.remove(); // Sets this.alive = false

    // Unsubscribe from updates
    bus.off('update', this.updateCallback);

    // Notify EntityManager to remove this entity
    entityManager.removeEntity(this);
    // console.log('Food removed');
  }
}