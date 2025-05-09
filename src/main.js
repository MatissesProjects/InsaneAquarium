import { bus } from './core/EventBus.js';
import {
    SVG_WIDTH, SVG_HEIGHT, FISH_COST, FOOD_TYPES,
    MAX_FOOD_LEVEL, FOOD_COST, FISH_SPEED, HUNGER_RATE 
} from './core/constants.js';
import { initRenderingSystem } from './systems/RenderingSystem.js';
import { initInputSystem } from './systems/InputSystem.js';
import { Food } from './entities/Food.js';
import { Fish } from './entities/Fish.js';
import { BreederFish } from './entities/BreederFish.js';
import { FeederFish } from './entities/FeederFish.js';
import { Snail } from './entities/Snail.js';
import { Boss } from './entities/Boss.js';
import { GameState } from './core/GameState.js';

// let score = 0;
// let foodLevel = 1;
// let isBossActive = false;
const scoreDisplay = document.createElement('div');
const shopContainer = document.getElementById('shop-container');
const buyFishButton = document.createElement('button');
const placeFeeder = document.createElement('button');
const upgradeFoodButton = document.createElement('button');
const placeBoss = document.createElement('button');

function setupScoreDisplay() {
    scoreDisplay.style.position = 'absolute';
    scoreDisplay.style.top = '10px';
    scoreDisplay.style.left = '10px';
    scoreDisplay.style.color = 'gold';
    scoreDisplay.style.fontSize = '20px';
    scoreDisplay.style.fontFamily = 'Arial, sans-serif';
    scoreDisplay.textContent = 'Score: 0';
    document.getElementById('game-container').appendChild(scoreDisplay);
}

function setupShopUI() {
    if (!shopContainer) {
        console.error("Shop container element not found!");
        return;
    }
    shopContainer.style.position = 'absolute';
    shopContainer.style.top = '10px';
    shopContainer.style.right = '10px';
    shopContainer.style.display = 'flex';
    shopContainer.style.flexDirection = 'column';
    shopContainer.style.gap = '5px';
    shopContainer.style.padding = '10px';
    shopContainer.style.backgroundColor = 'rgba(54, 53, 20, 0.42)';
    shopContainer.style.borderRadius = '5px';

    buyFishButton.textContent = `Buy Fish (${FISH_COST})`;
    buyFishButton.style.padding = '5px';
    shopContainer.appendChild(buyFishButton);

    placeBoss.textContent = 'Spawn Boss';
    placeBoss.style.padding = '5px';
    shopContainer.appendChild(placeBoss);

    placeFeeder.textContent = 'Spawn Feeder';
    placeFeeder.style.padding = '5px';
    shopContainer.appendChild(placeFeeder);

    updateUpgradeButton();
    upgradeFoodButton.style.padding = '5px';
    shopContainer.appendChild(upgradeFoodButton);
}

function updateScoreDisplay() {
    scoreDisplay.textContent = `Score: ${GameState.getScore()}`;
}

function updateUpgradeButton() {
    const currentFoodLevel = GameState.getFoodLevel();
    const currentScore = GameState.getScore();
    // console.log(`Current Food Level: ${currentFoodLevel}, Current Score: ${currentScore}`);
    if (currentFoodLevel  >= MAX_FOOD_LEVEL) {
        upgradeFoodButton.textContent = `Food Max Level (${currentFoodLevel })`;
        upgradeFoodButton.disabled = true;
    } else {
        const cost = FOOD_TYPES[currentFoodLevel].nextCost;
        upgradeFoodButton.textContent = `Upgrade Food (${cost}) Lvl: ${currentFoodLevel}`;
        upgradeFoodButton.disabled = false;
    }
    const nextCost = FOOD_TYPES[currentFoodLevel].nextCost;
    // const nextCost = (currentFoodLevel < MAX_FOOD_LEVEL) ? FOOD_UPGRADE_COST[currentFoodLevel + 1] : Infinity;
    upgradeFoodButton.style.opacity = (currentScore >= nextCost && currentFoodLevel < MAX_FOOD_LEVEL) ? '1' : '0.6';
    buyFishButton.style.opacity = (currentScore >= FISH_COST) ? '1' : '0.6';
}

function handleCoinCollected(amount) {
    GameState.addScore(amount);
    updateScoreDisplay(); // Use below bus on after this
    updateUpgradeButton(); // Use below bus on after this
    // score += amount;
    // updateScoreDisplay();
    // updateUpgradeButton();
    // console.log(`Score: ${score}`);
}

// bus.on('scoreChanged', updateScoreDisplay);
// bus.on('scoreChanged', updateUpgradeButton);

function handleUpgradeFood() {
    const currentFoodLevel = GameState.getFoodLevel();
    const currentScore = GameState.getScore();
    if (currentFoodLevel < MAX_FOOD_LEVEL) {
        const cost = FOOD_TYPES[currentFoodLevel].nextCost;
        console.log(`Current Food Level: ${currentFoodLevel}, Cost: ${cost}`);
        if (currentScore >= cost) {
            GameState.setScore(currentScore - cost);
            GameState.setFoodLevel(currentFoodLevel + 1);
            updateScoreDisplay();
            updateUpgradeButton();
            console.log(`Upgraded food to level ${GameState.getFoodLevel()}!`);
        } else {
            console.log('Not enough money for food upgrade!');
        }
    }
}

function handlePlaceBoss() {
    bus.emit('spawnBossRequest');
}

function handleBackgroundClick(clickPos) {
    const currentScore = GameState.getScore();
    const canAfford = currentScore >= FOOD_COST;
    if (canAfford) {
        GameState.addScore(-FOOD_COST);
        updateScoreDisplay();
        updateUpgradeButton();
        new Food({ x: clickPos.x, y: clickPos.y, level: GameState.getFoodLevel() });
    } else {
        console.log("Not enough money to drop food!");
    }
}

initRenderingSystem();
initInputSystem();
console.log('Game Systems Initialized.');

setupScoreDisplay();
setupShopUI();
console.log('UI Initialized.');

bus.on('coinCollected', handleCoinCollected);
buyFishButton.addEventListener('click', handleBuyFish);
upgradeFoodButton.addEventListener('click', handleUpgradeFood);
placeBoss.addEventListener('click', handlePlaceBoss);
placeFeeder.addEventListener('click', () => {new FeederFish({
    x: SVG_WIDTH * Math.random(), // Example position
    y: SVG_HEIGHT * Math.random(),
});});
console.log('Event Listeners Attached.');

bus.on('backgroundClicked', handleBackgroundClick);

// 4. Initial Game State Setup
console.log("Creating initial fish...");
for (let i = 0; i < 2; i++) {
    new Fish({
        x: Math.random() * SVG_WIDTH * 0.8 + SVG_WIDTH * 0.07,
        y: Math.random() * SVG_HEIGHT * 0.5 + SVG_HEIGHT * 0.2,
        speed: FISH_SPEED * (0.8 + Math.random() * 0.4),
        hungerRate: HUNGER_RATE * (0.8 + Math.random() * 0.4),
    });
}
new Snail({});
new Snail({});
new Snail({});
new Snail({});
new Snail({});
new Snail({});
new Snail({});
new BreederFish({
    x: SVG_WIDTH * 0.75, // Example position
    y: SVG_HEIGHT * 0.5,
});
new FeederFish({
    x: SVG_WIDTH * 0.25, // Example position
    y: SVG_HEIGHT * 0.5,
});

function handleBuyFish() {
    const currentScore = GameState.getScore();
    if (currentScore >= FISH_COST) {
        GameState.addScore(-FISH_COST); // Use GameState (negative amount)
        updateScoreDisplay();
        updateUpgradeButton();
        new Fish({
            x: Math.random() * 2 * SVG_WIDTH / 3,
            y: Math.random() * 2 * SVG_HEIGHT / 3,
        });
        console.log('Bought fish!');
    } else {
        console.log('Not enough money for fish!');
    }
}

function spawnBoss() {
    if (GameState.isBossActive()) {
        console.log("Boss already active, not spawning another.");
        return;
    }
    console.log("Spawning Boss!");
    GameState.spawnBoss();
    // bus.emit('bossSpawned', { boss: newBoss });
}

// setTimeout(() => {
//     bus.emit('spawnBossRequest');
// }, 1000);

bus.on('spawnBossRequest', spawnBoss);

let lastTimestamp = performance.now();

function gameLoop(currentTimestamp) {
  const dt = currentTimestamp - lastTimestamp;
  lastTimestamp = currentTimestamp;
  const deltaTime = Math.min(dt, 100); // Max delta 100ms
  bus.emit('update', deltaTime);
  bus.emit('render');
  requestAnimationFrame(gameLoop);
}

console.log('Starting game loop...');
requestAnimationFrame(gameLoop);