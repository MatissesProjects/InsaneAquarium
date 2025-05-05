import { bus } from '../core/EventBus.js';
import { entityManager } from '../systems/EntityManager.js';
import { BASE_FOOD_LIFETIME, FOOD_RADIUS } from '../core/constants.js';
import { FallingEntity } from './FallingEntity.js';

export class Food extends FallingEntity {
  constructor({ x, y, level = 1 }) {
    super(x, y, FOOD_RADIUS);
    this.lifespan = BASE_FOOD_LIFETIME * level;
    entityManager.addEntity(this);
    bus.on('update', this.updateCallback);
  }

  updateCallback = (dt) => {
      if (!this.alive) return;
      this.update(dt);
  };

  update(dt) {
    super.update(dt);

    if (this.landed) {
      this.groundTimer += dt;
      if (this.groundTimer >= this.lifespan) {
          this.remove();
      }
    }
  }

  remove() {
    if (!this.alive) return;
    super.remove();
    bus.off('update', this.updateCallback);
    entityManager.removeEntity(this);
  }
}