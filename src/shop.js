import { bus } from './EventBus.js';

// Example items: id, label, cost
const ITEMS = [
  { id: 'fish',  label: 'Buy Fish',  cost: 10 },
  { id: 'food upgrade',  label: 'Upgrade Food',  cost: 10  },
];

let coins = 0;  // you’ll want to track this in your game state
let foodLevel = 1;  // you’ll want to track this in your game state

function renderShop() {
  const shop = document.getElementById('shop-container');
  shop.innerHTML = '';  // clear

  for (const item of ITEMS) {
    const btn = document.createElement('div');
    btn.className = 'shop-item' + (coins < item.cost ? ' disabled' : '');
    btn.innerHTML = `<button>${item.label}</button><br/><small>${item.cost}¢</small>`;
    btn.onclick = () => {
      if (coins >= item.cost) {
        bus.emit('purchase', item.id);
      }
    };
    shop.appendChild(btn);
  }
}

// Listen for coin changes to re‑render shop
bus.on('coinsChanged', newCoins => {
  coins = newCoins;
  renderShop();
});

bus.on('foodUpgraded', _ => {
  foodLevel += 1;
  renderShop();
});

// Expose an init function
export function initShop(initialCoins = 0) {
  coins = initialCoins;
  renderShop();
}