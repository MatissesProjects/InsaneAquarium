import { Fish } from './src/entities/Fish.js';
import { Food } from './src/entities/Food.js';
import { bus } from './src/core/EventBus.js';

let last = performance.now();
function loop(now) {
  const dt = now - last;
  last = now;
  bus.emit('update', dt);
  bus.emit('render');
  requestAnimationFrame(loop);
}

new Fish({ x: 200, y: 150 });
// setInterval(() => {
//   new Food({ x: Math.random() * 750, y: 0 });
// }, 2000);

requestAnimationFrame(loop);
