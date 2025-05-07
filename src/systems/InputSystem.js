import { bus } from '../core/EventBus.js';
import { entityManager } from './EntityManager.js';
import { distanceSquared } from '../core/utils.js';

const svgCanvas = document.getElementById('game-canvas');

function getMousePosition(event) { // This function should already be in your InputSystem.js
    const CTM = svgCanvas.getScreenCTM();
    const svgPoint = svgCanvas.createSVGPoint();
    svgPoint.x = event.clientX;
    svgPoint.y = event.clientY;
    const pt = svgPoint.matrixTransform(CTM.inverse());
    return { x: pt.x, y: pt.y };
  }
  
  function handleCanvasClick(event) {
      const clickPos = getMousePosition(event); // Get SVG click coordinates
      let clickedEntity = null;
      let minDistanceSq = Infinity;
  
      // --- Check for clickable entities ---
  
      // 1. Check Coins
      for (const coin of entityManager.getCoins()) {
          if (!coin.alive) continue;
          const clickRadiusSq = coin.r * coin.r * 2.25;
          const distSq = distanceSquared(clickPos.x, clickPos.y, coin.x, coin.y);
          if (distSq < clickRadiusSq && distSq < minDistanceSq) {
              minDistanceSq = distSq;
              clickedEntity = coin;
          }
      }
  
      // 2. Check Boss
      if (!clickedEntity) {
          for (const boss of entityManager.getEntitiesByType('Boss')) {
              if (!boss.alive) continue;
              const clickRadiusSqBoss = boss.r * boss.r;
              const distSqBoss = distanceSquared(clickPos.x, clickPos.y, boss.x, boss.y);
              if (distSqBoss < clickRadiusSqBoss && distSqBoss < minDistanceSq) {
                  clickedEntity = boss;
                  break;
              }
          }
      }
  
      // --- Emit appropriate event ---
      if (clickedEntity) {
          console.log('[InputSystem] Clicked on entity:', clickedEntity.constructor.name);
          // Emit the entity AND the click position relative to the SVG canvas
          bus.emit('entityClicked', { entity: clickedEntity, clickPosition: clickPos });
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