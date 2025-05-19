export const SVG_WIDTH  = 800;
export const SVG_HEIGHT = 350;

export const DEATH_THRESHOLD = 10;

export const GRAVITY = 0.00005;

export const COIN_RADIUS = 12;
export const DROP_INTERVAL = 10000;
export const COIN_LIFESPAN = 8000;
export const COIN_DROP_COOLDOWN = 500;
export const COIN_BASE_SPAWN = 2000;

export const BASE_FOOD_LIFETIME = 5000;
export const HUNGRY_THRESHOLD = 3;
export const FOOD_RADIUS = 5;
export const FOOD_SPAWN_INTERVAL= 2000;
export const MAX_FOOD_LEVEL = 2;
export const FOOD_COST = 0;

export const HUNGER_RATE = 0.00025;
export const FISH_SPEED = 0.075;
export const FISH_TURN_RATE = 0.005;
export const FISH_VERTICAL_SPEED = 0.03;
export const FISH_EAT_RADIUS_SQ = 15*15;
export const FISH_RADIUS = 15;
export const FISH_COST = 1;
export const FISH_INITIAL_HEALTH_THRESHOLD = 2;
export const FISH_HEALTH_THRESHOLD_MULTIPLIER = 1.25;
export const FISH_LEVEL_SPEED_MULTIPLIER = 1.0125;
export const FISH_LEVEL_RADIUS_MULTIPLIER = 1.5;
export const FISH_LEVEL_DROP_INTERVAL_MULTIPLIER = 0.9;
export const FISH_INITIAL_RADIUS_SMALL = 10;
export const FISH_FOOD_TO_LEVEL_2 = 1;  // 5
export const FISH_FOOD_TO_LEVEL_3 = 2; // 15
export const FISH_FOOD_TO_LEVEL_4 = 3; // 45
// export const FISH_FOOD_TO_LEVEL = [0,0,1,2,3]
export const NUMBER_BASE_FISH_LEVELS = 4;

export const SNAIL_RADIUS = 18;
export const SNAIL_SPEED = 0.015;

export const BREEDER_FISH_RADIUS = 22;
export const BREEDER_FISH_SPEED = 0.04;
export const BREEDER_FISH_HUNGER_RATE = 0.000006;
export const BREEDER_FISH_BIRTH_INTERVAL = 20000;

export const FEEDER_FISH_RADIUS = 20;
export const FEEDER_FISH_SPEED = 0.045;
export const FEEDER_FISH_HUNGER_RATE = 0.0000055;
export const FEEDER_FISH_FOOD_DROP_INTERVAL = 1000;
export const FEEDER_FISH_FOOD_DROP_LEVEL = 1;

export const BOSS_RADIUS = 40;
export const BOSS_SPEED = 0.03;
export const BOSS_HP = 500;
export const BOSS_ATTACK_POWER = 1;
export const BOSS_ATTACK_COOLDOWN = 1500;

export const ASSETS = {
  FISH : './assets/fish.svg',
  COIN_SILVER : './assets/coin_silver.svg',
  COIN_GOLD : './assets/coin_gold.svg',
  COIN_DIAMOND : './assets/coin_diamond.svg',
  FOOD_1 : './assets/food.svg',
  FOOD_2 : './assets/food2.svg',
  SNAIL: './assets/snail.svg',
  BREEDER: './assets/breeder.svg',
  FEEDER: './assets/feeder.svg',
  BOSS_BARBARIAN: './assets/boss_barbarian.svg'
};

export const COIN_TYPES = {
  SILVER: { value: 1, asset: ASSETS.COIN_SILVER, lifespan: COIN_LIFESPAN, spawnTime: COIN_BASE_SPAWN},
  GOLD:   { value: 5, asset: ASSETS.COIN_GOLD, lifespan: COIN_LIFESPAN, spawnTime: COIN_BASE_SPAWN * 1.5},
  DIAMOND: { value: 20, asset: ASSETS.COIN_DIAMOND, lifespan: COIN_LIFESPAN, spawnTime: COIN_BASE_SPAWN * 3},
};

export const FOOD_TYPES = {
  1: { nextCost: 100, nutrition: 1,   asset: ASSETS.FOOD_1, lifespan: BASE_FOOD_LIFETIME, radius: FOOD_RADIUS, },
  2: { nextCost: 500, nutrition: 1.5, asset: ASSETS.FOOD_2, lifespan: BASE_FOOD_LIFETIME * 1.25, radius: FOOD_RADIUS * .75, },
};
