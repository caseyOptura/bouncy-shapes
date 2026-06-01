export const MIN_SHAPES = 1
export const MAX_SHAPES = 12
const TYPES = ['circle', 'square', 'triangle']
const RADII = [55, 44, 62, 40, 52, 48]
export function createShapes(count, W, H, palette) {
  count = Math.max(MIN_SHAPES, Math.min(MAX_SHAPES, count))
  return Array.from({ length: count }, (_, i) => ({
    x: count === 1 ? W / 2 : RADII[i % RADII.length] + (i / (count - 1)) * (W - 2 * RADII[i % RADII.length]),
    y: H - RADII[i % RADII.length],
    vx: 0,
    vy: 0,
    r: RADII[i % RADII.length],
    color: palette.shapeColors[i % palette.shapeColors.length],
    type: TYPES[i % TYPES.length],
  }))
}
export function recolorShapes(shapes, palette) {
  shapes.forEach((s, i) => { s.color = palette.shapeColors[i % palette.shapeColors.length] })
}
