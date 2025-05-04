import { bus } from '../core/EventBus.js';

// Using Maps for potentially slightly faster lookups/deletions by object reference
const entities = new Map(); // All entities: { entityInstance -> type }
const fishes = new Map();
const foods = new Map();
const coins = new Map();
// Add other entity type maps as needed

const typeMap = {
    'Fish': fishes,
    'Food': foods,
    'Coin': coins,
    // Add other types here
};

function addEntity(entity) {
    const type = entity.constructor.name;
    entities.set(entity, type);

    const specificMap = typeMap[type];
    if (specificMap) {
        specificMap.set(entity, entity); // Store instance in type-specific map
    } else {
        console.warn(`EntityManager: No specific map for type ${type}`);
    }
    bus.emit('entityAdded', { entity }); // Notify systems (like Renderer)
    // console.log(`Added ${type}:`, entity);
}

function removeEntity(entity) {
    const type = entities.get(entity);
    if (type) {
        entities.delete(entity);
        const specificMap = typeMap[type];
        if (specificMap) {
            specificMap.delete(entity);
        }
        bus.emit('entityRemoved', { entity }); // Notify systems (like Renderer)
        // console.log(`Removed ${type}:`, entity);
    }
}

function getEntities() {
    return entities.keys(); // Iterator of all entity instances
}

function getEntitiesByType(type) {
    const specificMap = typeMap[type];
    return specificMap ? specificMap.keys() : [].values(); // Return iterator or empty iterator
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

// Optional: Listen for requests to remove entities if needed elsewhere
// bus.on('requestRemoveEntity', (entity) => {
//     if (entity && entity.remove) {
//         entity.remove(); // Let the entity handle its own cleanup before final removal
//     }
// });