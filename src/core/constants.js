export const SVG_WIDTH  = 800; // Match viewBox in index.html
export const SVG_HEIGHT = 350; // Match viewBox in index.html

export const GRAVITY            = 0.00005;
export const BASE_FOOD_LIFETIME = 5000; // Increased slightly
export const HUNGER_RATE        = 0.00025; // Slower hunger rate
export const HUNGRY_THRESHOLD   = 3;     // Takes longer to get hungry
export const DEATH_THRESHOLD    = 10;    // Takes longer to die
export const FISH_SPEED         = 0.075;
export const FISH_TURN_RATE     = 0.005;
export const FISH_VERTICAL_SPEED= 0.03;
export const FISH_EAT_RADIUS_SQ = 15*15; // Squared distance for efficiency
export const FISH_RADIUS        = 15;
export const COIN_RADIUS        = 12;
export const FOOD_RADIUS        = 5;
export const DROP_INTERVAL      = 10000; // How often fish drops coin
export const COIN_LIFESPAN      = 8000; // Coins last longer
export const FISH_COST = 10;
export const FOOD_UPGRADE_COST = [0, 200, 500]; // Cost for level 1, 2, 3 food (index 0 unused)
export const MAX_FOOD_LEVEL = 2;
export const FOOD_COST = 1; // Cost to drop one piece of food
export const COIN_DROP_COOLDOWN = 500; // Minimum ms between coin drops from one fish

// Adjusted asset paths assuming an 'assets' folder at the root
// alongside index.html and src/
export const ASSETS = {
  FISH : './assets/fish.svg', // Make sure you have these assets
  COIN : './assets/coin.svg',
  FOOD : './assets/food.svg',
};


// Fish Upgrade defaults
export const FISH_INITIAL_HEALTH_THRESHOLD = 2; // Food eaten to upgrade level 1->2
export const FISH_HEALTH_THRESHOLD_MULTIPLIER = 1.25; // How much threshold increases per level
export const FISH_LEVEL_SPEED_MULTIPLIER = 1.0125; // Speed increase per level
export const FISH_LEVEL_RADIUS_MULTIPLIER = 1.1; // Size increase per level (was 1.2, maybe too much?)
export const FISH_LEVEL_DROP_INTERVAL_MULTIPLIER = 0.9; // Drop interval decrease per level (was 0.8)