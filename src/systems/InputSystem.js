import { bus } from '../core/EventBus.js';
import { entityManager } from './EntityManager.js';
import { distanceSquared } from '../core/utils.js'; // For checking click distance

const svgCanvas = document.getElementById('game-canvas');

function getMousePosition(event) {
  const CTM = svgCanvas.getScreenCTM();
  // Adjust for responsive SVG scaling if necessary (using viewBox)
  const viewbox = svgCanvas.viewBox.baseVal;
  const svgPoint = svgCanvas.createSVGPoint();
  svgPoint.x = event.clientX;
  svgPoint.y = event.clientY;

  const pt = svgPoint.matrixTransform(CTM.inverse());
//   console.log(`Click: client(${event.clientX}, ${event.clientY}) -> svg(${pt.x}, ${pt.y})`);
  return { x: pt.x, y: pt.y };

}

function handleCanvasClick(event) {
    const clickPos = getMousePosition(event);

    // Find the closest clickable entity (e.g., Coin) to the click
    let clickedEntity = null;
    let minDistanceSq = Infinity;

    // Check Coins specifically, as they are the primary clickable target for now
    for (const coin of entityManager.getCoins()) {
        const radiusSq = coin.r * coin.r * 4; // Increase clickable area slightly (x2 radius)
        const distSq = distanceSquared(clickPos.x, clickPos.y, coin.x, coin.y);

        if (distSq < radiusSq && distSq < minDistanceSq) {
            minDistanceSq = distSq;
            clickedEntity = coin;
        }
    }

    // TODO: Add checks for other clickable entities if needed (e.g., buying fish)

    if (clickedEntity) {
        // console.log('InputSystem: Clicked on entity:', clickedEntity);
        bus.emit('entityClicked', clickedEntity);
    } else {
        // Optional: Emit a background click event if needed
        // bus.emit('backgroundClicked', clickPos);
        // console.log('InputSystem: Clicked on background');

        // Example: Spawn food on background click
        // bus.emit('spawnFoodRequest', clickPos);
    }
}

export function initInputSystem() {
    svgCanvas.addEventListener('click', handleCanvasClick);
    console.log('Input System Initialized');

    // Optional: Cleanup listener if the game/module is ever destroyed
    // return () => {
    //     svgCanvas.removeEventListener('click', handleCanvasClick);
    // };
}