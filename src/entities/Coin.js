import { bus } from '../core/EventBus.js';
import { entityManager } from '../systems/EntityManager.js';
import { COIN_LIFESPAN, COIN_RADIUS } from '../core/constants.js';
import { FallingEntity } from './FallingEntity.js';

export class Coin extends FallingEntity {
  constructor({ x, y, amount = 1 }) {
    super(x, y, COIN_RADIUS);
    this.amount = amount;
    this.lifespan = COIN_LIFESPAN;
    entityManager.addEntity(this);
    bus.on('update', this.updateCallback);
    bus.on('entityClicked', this.clickCallback);
  }

  updateCallback = (dt) => {
    if (!this.alive) return;
    this.update(dt);
  };

  clickCallback = (clickedEntity) => {
    if (!this.alive) return;
    if (clickedEntity === this) {
        bus.emit('coinCollected', this.amount);
        this.remove();
    }
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
    bus.off('entityClicked', this.clickCallback);
    entityManager.removeEntity(this);
  }
}