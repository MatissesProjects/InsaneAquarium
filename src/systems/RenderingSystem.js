import { bus } from '../core/EventBus.js';
import { createSpriteElement } from '../core/utils.js';
import { ASSETS } from '../core/constants.js'; // Need asset paths

const entityMap = new Map(); // Map entity instance to its SVG element
const svgCanvas = document.getElementById('game-canvas');

function addEntityElement(payload) {
    const { entity } = payload;
    if (!entity || !entity.r || !entity.constructor || !entity.constructor.name) {
        console.error('RenderingSystem: Invalid entity data for adding element', payload);
        return;
    }

    // Determine asset URL based on entity type
    let assetUrl;
    let radius = entity.r; // Use radius from entity

    switch (entity.constructor.name) {
        case 'Fish':
            assetUrl = ASSETS.FISH;
            break;
        case 'Coin':
            assetUrl = ASSETS.COIN;
            break;
        case 'Food':
            assetUrl = ASSETS.FOOD;
            break;
        default:
            console.warn(`RenderingSystem: No asset defined for ${entity.constructor.name}`);
            return; // Don't add an element if no asset
    }

    // Only create element if not already tracked
    if (!entityMap.has(entity)) {
        const el = createSpriteElement(assetUrl, radius);
        svgCanvas.appendChild(el);
        entityMap.set(entity, el);
        // console.log(`Renderer added element for ${entity.constructor.name}`);
    }
}

function removeEntityElement(payload) {
    const { entity } = payload;
    const el = entityMap.get(entity);
    if (el) {
        el.remove();
        entityMap.delete(entity);
        // console.log(`Renderer removed element for ${entity.constructor.name}`);
    }
}

function renderAll() {
    // console.log(`Rendering ${entityMap.size} elements`);
    for (const [entity, el] of entityMap.entries()) {
        // Calculate top-left corner for the transform based on center (x, y) and radius (r)
        const topLeftX = entity.x - entity.r;
        const topLeftY = entity.y - entity.r;
        el.setAttribute('transform', `translate(${topLeftX}, ${topLeftY})`);

        // Optional: Add rotation or scaling if needed
        // el.setAttribute('transform', `translate(${topLeftX}, ${topLeftY}) rotate(${entity.angle || 0}, ${entity.r}, ${entity.r})`);

        // Optional: Change visual state based on entity properties (e.g., hunger)
         if (entity.constructor.name === 'Fish') {
             if (entity.isHungry) {
                 // Could apply a class or filter, e.g., el.classList.add('hungry');
             } else {
                 // el.classList.remove('hungry');
             }
         }
    }
}


export function initRenderingSystem() {
    bus.on('entityAdded', addEntityElement);
    bus.on('entityRemoved', removeEntityElement);
    bus.on('render', renderAll); // Listen for the main render signal
    console.log('Rendering System Initialized');
}