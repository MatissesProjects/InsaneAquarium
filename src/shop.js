import { bus } from './EventBus.js';

const ITEMS = [
  { id: 'fish',  label: 'Buy Fish',  cost: 10 },
  { id: 'food upgrade',  label: 'Upgrade Food',  cost: 10  },
];

let coins = 0;
let foodLevel = 1;

function renderShop() {
  const shop = document.getElementById('shop-container');
  shop.innerHTML = `
    <div id="shop-balance" style="flex:0 0 100%; text-align:right; padding:0 10px;">
      💰 ${coins}¢
    </div>`;

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

bus.on('coinsChanged', newCoins => {
  coins = newCoins;
  renderShop();
});

bus.on('foodUpgraded', _ => {
  foodLevel += 1;
  renderShop();
});

export function initShop(initialCoins = 0) {
  coins = initialCoins;
  renderShop();
}