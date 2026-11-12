const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

export function fitPhoto(width, height, viewportWidth, viewportHeight) {
  const scale = Math.min(viewportWidth / width, viewportHeight / height);
  const w = width * scale, h = height * scale;
  return { x: (viewportWidth - w) / 2, y: (viewportHeight - h) / 2, width: w, height: h };
}

export function moveCrop(start, dx, dy, handle) {
  const min = 0.08;
  if (handle === 'move') return { ...start,
    x: clamp(start.x + dx, 0, 1 - start.width), y: clamp(start.y + dy, 0, 1 - start.height) };
  if (handle === 'topLeft') {
    const right = start.x + start.width, bottom = start.y + start.height;
    const x = clamp(start.x + dx, 0, right - min), y = clamp(start.y + dy, 0, bottom - min);
    return { x, y, width: right - x, height: bottom - y };
  }
  if (handle === 'topRight') {
    const bottom = start.y + start.height;
    const y = clamp(start.y + dy, 0, bottom - min);
    return { ...start, y, height: bottom - y, width: clamp(start.width + dx, min, 1 - start.x) };
  }
  if (handle === 'bottomLeft') {
    const right = start.x + start.width;
    const x = clamp(start.x + dx, 0, right - min);
    return { ...start, x, width: right - x, height: clamp(start.height + dy, min, 1 - start.y) };
  }
  return { ...start, width: clamp(start.width + dx, min, 1 - start.x),
    height: clamp(start.height + dy, min, 1 - start.y) };
}

export function photoCrop(rect, width, height) {
  const originX = clamp(Math.floor(rect.x * width), 0, width - 1);
  const originY = clamp(Math.floor(rect.y * height), 0, height - 1);
  return { originX, originY,
    width: clamp(Math.round(rect.width * width), 1, width - originX),
    height: clamp(Math.round(rect.height * height), 1, height - originY) };
}
