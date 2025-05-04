export function createSprite(url, size) {
  const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
  img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', url);
  img.setAttribute('width', size * 2);
  img.setAttribute('height', size * 2);
  return img;
}
