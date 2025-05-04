import { Fish } from './Fish.js';
export class Guppy extends Fish {
  constructor(opts = {}) {
    super({ ...opts, speed: 0.06, svgUrl: 'assets/guppy.svg' });
  }
}
