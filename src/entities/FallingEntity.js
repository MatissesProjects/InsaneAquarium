import { Entity } from './Entity.js';
import { SVG_HEIGHT, GRAVITY } from '../core/constants.js';

// Base class for entities affected by gravity
export class FallingEntity extends Entity {
  constructor(x, y, r, gravity = GRAVITY) {
    super();
    this.x = x;
    this.y = y;
    this.r = r; // Radius for rendering and collision
    this.vy = 0; // Vertical velocity
    this.gravity = gravity;
    this.landed = false;
    this.groundTimer = 0;
  }

  // Basic physics simulation step
  physics(dt) {
    if (this.landed) return; // Don't fall if already landed

    this.vy += this.gravity * dt;
    this.y  += this.vy * dt;

    // Check for landing
    if (this.y + this.r >= SVG_HEIGHT) {
      this.landed = true;
      this.y = SVG_HEIGHT - this.r; // Place exactly on ground
      this.vy = 0;
    }
  }

  // Base update calls physics. Subclasses will add lifespan logic etc.
  update(dt) {
      this.physics(dt);
  }
}