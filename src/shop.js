import { bus } from './EventBus.js';

// Example items: id, label, cost
// Wait we do have a dict of prices and items?
// WTF is the switch case in main.js for?
const ITEMS = [
  { id: 'fish',  label: 'Buy Fish',  cost: 10 },
  { id: 'food upgrade',  label: 'Upgrade Food',  cost: 10  },
];

let coins = 0;  // you’ll want to track this in your game state
let foodLevel = 1;  // you’ll want to track this in your game state

function renderShop() {
  const shop = document.getElementById('shop-container');
    // super lucky we arent reading coins from a server :P
  shop.innerHTML = `
    <div id="shop-balance" style="flex:0 0 100%; text-align:right; padding:0 10px;">
      💰 ${coins}¢
    </div>`;

  for (const item of ITEMS) {
      // A yes very much "button", yep yep
      // (Did you know <button> has a `disabled` attribute which makes it impossible for users to click it?)
    const btn = document.createElement('div');
      // Have you heard about using the classList API?
    btn.className = 'shop-item' + (coins < item.cost ? ' disabled' : '');
    btn.innerHTML = `<button>${item.label}</button><br/><small>${item.cost}¢</small>`;
    btn.onclick = () => {
      // Clearly dont trust your own check above there
      if (coins >= item.cost) {
        bus.emit('purchase', item.id);
      }
      // Users dont need feedback on errors, right?
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
