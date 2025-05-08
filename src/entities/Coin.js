import { bus } from '../core/EventBus.js';
import { entityManager } from '../systems/EntityManager.js';
import { COIN_LIFESPAN, COIN_RADIUS, COIN_TYPES } from '../core/constants.js';
import { FallingEntity } from './FallingEntity.js';

export class Coin extends FallingEntity {
  constructor({ x, y, type }) {
    super(x, y, COIN_RADIUS);
    const coinData = COIN_TYPES[type.toUpperCase()] || COIN_TYPES.SILVER;
    this.type = type.toUpperCase();
    this.amount = coinData.value;
    this.asset = coinData.asset;
    this.lifespan = coinData.lifespan;
    entityManager.addEntity(this);
    bus.on('update', this.updateCallback);
    bus.on('entityClicked', this.handleClickEvent);
  }

  updateCallback = (dt) => {
    if (!this.alive) return;
    this.update(dt);
  };

  handleClickEvent = (eventData) => {
    if (!this.alive) return;

    // The eventData is now an object: { entity: clickedEntity, clickPosition: clickPos }
    const { entity: clickedEntity } = eventData;

    if (clickedEntity === this) {
        // console.log('Coin clicked:', this);
        bus.emit('coinCollected', this.amount);
        this.remove(); // Remove the coin after collection
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
    bus.off('entityClicked', this.handleClickEvent);
    entityManager.removeEntity(this);
  }
}