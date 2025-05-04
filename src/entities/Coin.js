import { bus } from '../core/EventBus.js';
import { entityManager } from '../systems/EntityManager.js';
import { COIN_LIFESPAN, COIN_RADIUS } from '../core/constants.js'; // Use specific radius
import { FallingEntity } from './FallingEntity.js';

export class Coin extends FallingEntity {
  constructor({ x, y, amount = 1 }) {
    // Use constant for radius
    super(x, y, COIN_RADIUS);
    this.amount = amount;
    this.lifespan = COIN_LIFESPAN;

    // No direct element creation or rendering here!
    // Renderer system handles that based on 'entityAdded' event.

    // Register with EntityManager, which fires 'entityAdded' for the renderer
    entityManager.addEntity(this);

    // Listen for updates via the event bus
    bus.on('update', this.updateCallback);
    // Listen for clicks detected by the InputSystem
    bus.on('entityClicked', this.clickCallback);
  }

  // Arrow function to preserve 'this' context for callbacks
  updateCallback = (dt) => {
    if (!this.alive) return; // Check if entity is still alive
    this.update(dt);
  };

  clickCallback = (clickedEntity) => {
    if (!this.alive) return;
    // Check if the click event was for *this* specific coin
    if (clickedEntity === this) {
        // console.log('Coin clicked:', this);
        bus.emit('coinCollected', this.amount);
        this.remove(); // Remove the coin after collection
    }
  };

  update(dt) {
    super.update(dt); // Apply physics (gravity)

    // Handle lifespan expiration only after landing
    if (this.landed) {
      this.groundTimer += dt;
      if (this.groundTimer >= this.lifespan) {
        // console.log('Coin expired');
        this.remove();
      }
    }
  }

  remove() {
    if (!this.alive) return; // Prevent double removal
    super.remove(); // Sets this.alive = false

    // Unsubscribe from events to prevent memory leaks
    bus.off('update', this.updateCallback);
    bus.off('entityClicked', this.clickCallback);

    // Notify EntityManager to remove this entity from collections
    // This also triggers the 'entityRemoved' event for the renderer
    entityManager.removeEntity(this);
    // console.log('Coin removed');
  }
}