
// Core imports
import { bus } from './core/EventBus.js';
import { FOOD_SPAWN_INTERVAL, SVG_WIDTH } from './core/constants.js';

// Systems - Import initializers
import { initRenderingSystem } from './systems/RenderingSystem.js';
import { initInputSystem } from './systems/InputSystem.js';
// EntityManager is used directly via its imported object

// Entity Types
import { Fish } from './entities/Fish.js';
import { Food } from './entities/Food.js';

// --- Game Initialization ---

// 1. Initialize Systems
// RenderingSystem listens for entityAdded/Removed and render events
initRenderingSystem();
// InputSystem listens for clicks and fires entityClicked events
initInputSystem();

console.log('Game Systems Initialized.');

// 2. Initial Game State Setup
// Create starting fish
new Fish({ x: SVG_WIDTH / 2, y: 150 });
new Fish({ x: SVG_WIDTH / 3, y: 120 });

// Example: Automatically spawn food periodically
setInterval(() => {
  // Create new food instance; it will register itself via EntityManager
  new Food({ x: Math.random() * SVG_WIDTH, y: 0 });
}, FOOD_SPAWN_INTERVAL);

// --- Main Game Loop ---
let lastTimestamp = performance.now();

function gameLoop(currentTimestamp) {
  const dt = currentTimestamp - lastTimestamp;
  lastTimestamp = currentTimestamp;

  // Clamp delta time to prevent physics issues if tab inactive
  const deltaTime = Math.min(dt, 100); // Max delta 100ms

  // Emit 'update' event - Entities listening will update their state
  bus.emit('update', deltaTime);

  // Emit 'render' event - RenderingSystem listening will redraw entities
  bus.emit('render');

  // Request next frame
  requestAnimationFrame(gameLoop);
}

// Start the game loop
console.log('Starting game loop...');
requestAnimationFrame(gameLoop);

// Optional: Listen for coin collection to update score (basic example)
let score = 0;
const scoreDisplay = document.createElement('div'); // Simple score display
scoreDisplay.style.position = 'absolute';
scoreDisplay.style.top = '10px';
scoreDisplay.style.left = '10px';
scoreDisplay.style.color = 'white';
scoreDisplay.style.fontSize = '20px';
scoreDisplay.style.fontFamily = 'Arial, sans-serif';
scoreDisplay.textContent = 'Score: 0';
document.getElementById('game-container').appendChild(scoreDisplay);

bus.on('coinCollected', (amount) => {
    score += amount;
    scoreDisplay.textContent = `Score: ${score}`;
    // console.log(`Score: ${score}`);
});
