import { Entity } from './Entity.js';
import { SVG_HEIGHT, GRAVITY } from '../core/constants.js';

export class FallingEntity extends Entity {
  constructor(x, y, r, gravity = GRAVITY) {
    super();
    this.x = x;
    this.y = y;
    this.r = r;
    this.vy = 0;
    this.gravity = gravity;
    this.landed = false;
    this.groundTimer = 0;
  }

  physics(dt) {
    if (this.landed) return;

    this.vy += this.gravity * dt;
    this.y  += this.vy * dt;

    if (this.y + this.r >= SVG_HEIGHT) {
      this.landed = true;
      this.y = SVG_HEIGHT - this.r;
      this.vy = 0;
    }
  }

  update(dt) {
      this.physics(dt);
  }
}