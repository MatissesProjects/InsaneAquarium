import { bus } from './EventBus.js';
import { Fish } from './entities.js';

export function startGameLoop() {
  // I agree, loop unrolling is very important in a performance-critical game like this
  new Fish({ x: Math.random() * 250, y: Math.random() * 250, speed: 0.075 + Math.random() * 0.1, hungerRate: Math.random() * 0.0002+ .0002, hungryThreshold: Math.random() + 1, deathThreshold: Math.random() * 6 + 2 });
  new Fish({ x: Math.random() * 250, y: Math.random() * 250, speed: 0.075 + Math.random() * 0.1, hungerRate: Math.random() * 0.0002+ .0002, hungryThreshold: Math.random() + 1, deathThreshold: Math.random() * 6 + 2 });
  new Fish({ x: Math.random() * 250, y: Math.random() * 250, speed: 0.075 + Math.random() * 0.1, hungerRate: Math.random() * 0.0002+ .0002, hungryThreshold: Math.random() + 1, deathThreshold: Math.random() * 6 + 2 });
  let lastTs = 0;

  function loop(ts) {
    const delta = ts - lastTs;
    lastTs = ts;

    bus.emit('update', delta);
    bus.emit('render');
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(ts => {
    lastTs = ts;
    loop(ts);
  });
}
