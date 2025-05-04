export function createSpriteElement(assetUrl, radius) {
    const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    const diameter = radius * 2;
    img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', assetUrl);
    img.setAttribute('width', diameter);
    img.setAttribute('height', diameter);
    // We will set the position via transform later
    return img;
}
  
// Add other utility functions here if needed, e.g., distance calculation
export function distanceSquared(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return dx * dx + dy * dy;
}