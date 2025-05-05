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

    // Check Coins specifically
    // Consider adding other clickable entity checks here later (e.g., collectors)
    for (const coin of entityManager.getCoins()) {
        // Use entity radius for click check, maybe slightly larger
        const clickRadiusSq = coin.r * coin.r * 2.25; // 1.5x radius squared
        const distSq = distanceSquared(clickPos.x, clickPos.y, coin.x, coin.y);

        if (distSq < clickRadiusSq && distSq < minDistanceSq) {
            minDistanceSq = distSq;
            clickedEntity = coin;
        }
    }

    if (clickedEntity) {
        bus.emit('entityClicked', clickedEntity);
    } else {
        bus.emit('backgroundClicked', clickPos);
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