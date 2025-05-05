export class Entity {
  constructor() {
    this.alive = true;
  }
  update(dt) {}
  remove() {
    this.alive = false;
  }
}