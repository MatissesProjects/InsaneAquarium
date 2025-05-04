// Base class for all game objects
export class Entity {
  constructor() {
    this.alive = true;
    // x, y, r (radius) should be defined by subclasses
  }

  // Subclasses should implement update logic
  update(dt) {}

  // remove() is called when the entity should be destroyed
  // It sets the alive flag, and specific entity types
  // handle unregistering from the bus and notifying the EntityManager.
  remove() {
    this.alive = false;
    // No direct DOM manipulation here anymore.
    // Renderer will handle removing the visual element via 'entityRemoved' event.
  }
}