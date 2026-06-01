import { THEMES } from './themes.js'
import { MIN_SHAPES, MAX_SHAPES } from './shapes.js'
const KEY = 'bouncy-shapes:v1'
export const DEFAULTS = { themeIndex: 0, shapeCount: 6, soundOn: true, highScore: 0 }
export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw)
    return {
      themeIndex: Math.max(0, Math.min(THEMES.length - 1, parseInt(parsed.themeIndex) || 0)),
      shapeCount: Math.max(MIN_SHAPES, Math.min(MAX_SHAPES, parseInt(parsed.shapeCount) || 6)),
      soundOn: parsed.soundOn !== false,
      highScore: Math.max(0, parseInt(parsed.highScore) || 0),
    }
  } catch(e) {
    return { ...DEFAULTS }
  }
}
export function saveState(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      themeIndex: s.themeIndex,
      shapeCount: s.shapeCount,
      soundOn: s.soundOn,
      highScore: s.highScore,
    }))
  } catch(e) {}
}
