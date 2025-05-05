import { bus } from '../core/EventBus.js';

// All entities: { entityInstance -> type }
const entities = new Map(); 
const fishes = new Map();
const foods = new Map();
const coins = new Map();

const typeMap = {
    'Fish': fishes,
    'Food': foods,
    'Coin': coins,
};

function addEntity(entity) {
    const type = entity.constructor.name;
    entities.set(entity, type);

    const specificMap = typeMap[type];
    if (specificMap) {
        specificMap.set(entity, entity);
    } else {
        console.warn(`EntityManager: No specific map for type ${type}`);
    }
    bus.emit('entityAdded', { entity });
}

function removeEntity(entity) {
    const type = entities.get(entity);
    if (type) {
        entities.delete(entity);
        const specificMap = typeMap[type];
        if (specificMap) {
            specificMap.delete(entity);
        }
        bus.emit('entityRemoved', { entity });
    }
}

function getEntities() {
    return entities.keys();
}

function getEntitiesByType(type) {
    const specificMap = typeMap[type];
    return specificMap ? specificMap.keys() : [].values();
}


export const entityManager = {
    addEntity,
    removeEntity,
    getEntities,
    getEntitiesByType,
    // Expose specific getters if frequently needed
    getFishes: () => fishes.keys(),
    getFoods: () => foods.keys(),
    getCoins: () => coins.keys(),
};

// Lets use this for boss removal of entities
bus.on('requestRemoveEntity', (entity) => {
    if (entity && entity.remove) {
        entity.remove();
    }
});