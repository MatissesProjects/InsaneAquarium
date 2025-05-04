export const SVG_WIDTH  = 800; // Match viewBox in index.html
export const SVG_HEIGHT = 350; // Match viewBox in index.html

export const GRAVITY            = 0.00005;
export const BASE_FOOD_LIFETIME = 5000; // Increased slightly
export const HUNGER_RATE        = 0.00005; // Slower hunger rate
export const HUNGRY_THRESHOLD   = 3;     // Takes longer to get hungry
export const DEATH_THRESHOLD    = 10;    // Takes longer to die
export const FISH_SPEED         = 0.05;
export const FISH_TURN_RATE     = 0.005;
export const FISH_VERTICAL_SPEED= 0.03;
export const FISH_EAT_RADIUS_SQ = 15*15; // Squared distance for efficiency
export const FISH_RADIUS        = 15;
export const COIN_RADIUS        = 12;
export const FOOD_RADIUS        = 5;
export const DROP_INTERVAL      = 10000; // How often fish drops coin
export const COIN_LIFESPAN      = 8000; // Coins last longer
export const FOOD_SPAWN_INTERVAL= 2000; // How often food spawns automatically

// Adjusted asset paths assuming an 'assets' folder at the root
// alongside index.html and src/
export const ASSETS = {
  FISH : './assets/fish.svg', // Make sure you have these assets
  COIN : './assets/coin.svg',
  FOOD : './assets/food.svg',
};