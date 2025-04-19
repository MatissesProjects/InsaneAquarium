import { bus }            from './EventBus.js';
import { initTwitch }     from './twitchHelper.js';
import { connectLobby }   from './network.js';
import { startGameLoop }  from './gameLoop.js';
import { Food, Fish }     from './entities.js';
import { initShop }  from './shop.js';
// TODO move this to its own module most likely
// GLOBAL STATE :O
let wallet = 100;
let foodLevel = 1;  // you’ll want to track this in your game state

initShop(wallet);

const svg = document.getElementById('game-canvas');
svg.addEventListener('click', e => {
  // convert screen → SVG coords
  const pt = svg.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
  // Sir why is your constructor doing side effects?
  new Food(loc.x, loc.y, foodLevel);
});

// 1. Twitch auth & broadcast listener
initTwitch(
  ({ channelId, userId, token }) => {
    console.log('[Main] Authorized:', channelId, userId);
    // const socket = connectLobby(channelId, userId, token);
    // inside your onAuthorized callback, before starting the loop:

    // forward lobby events to game
    bus.on('lobbyMessage', msg => {
      if (msg.event === 'boss') bus.emit('spawnBoss');
      // ... handle other lobby events
    });

    // start our game once we have auth + socket
    startGameLoop();
  },
  (_target, _type, message) => {
    const { event } = JSON.parse(message);
    if (event === 'boss') bus.emit('spawnBoss');
  }
);

/// Have you heard about code formatters?
document.getElementById('game-canvas')
        .addEventListener('click', e => {
  const pt = e.target.ownerSVGElement
               .createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  console.log('SVG click at', pt.matrixTransform(
    e.target.getScreenCTM().inverse()
  ));
});

// 2. Example update / render handlers
bus.on('update', dt => {
  // TODO: move fish, coins, handle collisions
});

bus.on('render', () => {
  // TODO: paint/upsert SVG elements in #game-canvas
});

// Whenever your fish eats and produces a coin:
bus.on('spawnCoin', () => {
  wallet += 1;
  bus.emit('coinsChanged', wallet);
});

// Handle purchase events:
bus.on('purchase', itemId => {
  // you have `walled -= ...`, `bus.emit('coinsChanged', wallet)` at the start of each case
  // Just... make a function please.
  // Or maybe IDK make a map to store this instead of a hardcoded switch?
  switch(itemId) {
    case 'fish':
      // deduct cost, spawn new fish
      wallet -= 10;
      bus.emit('coinsChanged', wallet);
      new Fish({ x: Math.random() * 250, y: Math.random() * 250, speed: 0.075 + Math.random() * 0.1, hungerRate: Math.random() * 0.0002+ .0002, hungryThreshold: Math.random() + 1, deathThreshold: Math.random() * 6 + 2 });
      break;
    case 'food upgrade':
      // TODO find current food level, and get its cost for next
      wallet -= 1;
      bus.emit('coinsChanged', wallet);
      bus.emit('foodUpgraded', '');
      foodLevel += 1;
      // drop a handful of food at random
      for (let i = 0; i < 5; i++) {
        new Food(Math.random() * 800, foodLevel);
      }
      break;
    case 'boost':
      wallet -= 50;
      bus.emit('coinsChanged', wallet);
      // Instead of putting magic numbers in comments maybe make `speedBust` take 20% as a argument?
      // e.g. speed up all fish by 20%
      bus.emit('globalEvent', { type:'speedBoost' });
      break;
  }
});

bus.on('coinCollected', amount => {
  wallet += amount;
  bus.emit('coinsChanged', wallet);
});
