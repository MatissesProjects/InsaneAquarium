import { bus } from '../core/EventBus.js';
import { createSpriteElement } from '../core/utils.js';
import { ASSETS, DEATH_THRESHOLD } from '../core/constants.js';

const entityMap = new Map();
const svgCanvas = document.getElementById('game-canvas');

function addEntityElement(payload) {
    const { entity } = payload;
    if (!entity || !entity.r || !entity.constructor || !entity.constructor.name) {
        console.error('[Renderer] Invalid entity data for adding element', payload);
        return;
    }

    let assetUrl;
    let radius = entity.r;

    switch (entity.constructor.name) {
        case 'Fish': assetUrl = ASSETS.FISH; break;
        case 'BreederFish': assetUrl = ASSETS.BREEDER; break;
        case 'FeederFish': assetUrl = ASSETS.FEEDER; break;
        case 'Coin': assetUrl = entity.asset; break;
        case 'Food': assetUrl = entity.asset; break;
        case 'Snail': assetUrl = ASSETS.SNAIL; break;
        case 'Boss': assetUrl = ASSETS.BOSS_BARBARIAN; break;
        default:
            console.warn(`[Renderer] No asset defined for ${entity.constructor.name}`);
            return;
    }

    if (!entityMap.has(entity)) {
        const el = createSpriteElement(assetUrl, radius);
        svgCanvas.appendChild(el);
        entityMap.set(entity, el);
    }
}

function removeEntityElement(payload) {
    const { entity } = payload;
    const el = entityMap.get(entity);
    if (el) {
        el.remove();
        entityMap.delete(entity);
    }
}

function renderAll() {
    for (const [entity, el] of entityMap.entries()) {
        if (!entity || typeof entity.x === 'undefined' || typeof entity.y === 'undefined' || typeof entity.r === 'undefined') {
            continue;
        }

        let transform;
        const currentRadius = entity.r;
        const currentDiameter = currentRadius * 2;
        const topLeftX = entity.x - currentRadius;
        const topLeftY = entity.y - currentRadius;

        el.setAttribute('width', currentDiameter);
        el.setAttribute('height', currentDiameter);

        if (entity.constructor.name === 'Fish' ||
            entity.constructor.name === 'BreederFish' ||
            entity.constructor.name === 'FeederFish')
        {
            if (entity.facingRight) {
                transform = `translate(${topLeftX + currentDiameter}, ${topLeftY}) scale(-1, 1)`;
            } else {
                transform = `translate(${topLeftX}, ${topLeftY})`;
            }

            const currentHunger = entity.hunger ?? 0;
            const entityDeathThreshold = entity.deathThreshold ?? DEATH_THRESHOLD ?? 10;
            const hungerRatio = Math.max(0, Math.min(1, currentHunger / entityDeathThreshold));
            const hueRotateDegrees = hungerRatio * -85;
            el.style.filter = `hue-rotate(${hueRotateDegrees}deg)`;

        } else if (entity.constructor.name === 'Snail') {
            if (entity.facingRight) {
                transform = `translate(${topLeftX + currentDiameter}, ${topLeftY}) scale(-1, 1)`;
            } else {
                transform = `translate(${topLeftX}, ${topLeftY})`;
            }
            el.style.filter = 'none';

        } else if (entity.constructor.name === 'Boss') {
             if (entity.facingRight) {
                 transform = `translate(${topLeftX}, ${topLeftY})`;
             } else {
                 transform = `translate(${topLeftX + currentDiameter}, ${topLeftY}) scale(-1, 1)`;
             }
             el.style.filter = 'none';

        } else {
            transform = `translate(${topLeftX}, ${topLeftY})`;
            el.style.filter = 'none';
        }

        el.setAttribute('transform', transform);
    }
}

export function initRenderingSystem() {
    bus.on('entityAdded', addEntityElement);
    bus.on('entityRemoved', removeEntityElement);
    bus.on('render', renderAll);
    console.log('Rendering System Initialized');
}