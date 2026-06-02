import { loadState, saveState } from './storage.js'
import { MIN_SHAPES, MAX_SHAPES } from './shapes.js'
const persisted = loadState()
export const state = {
  themeIndex: persisted.themeIndex,
  shapeCount: persisted.shapeCount,
  soundOn: persisted.soundOn,
  highScore: persisted.highScore,
  score: 0,
  // Parent settings
  childName: persisted.childName,
  maxVolume: persisted.maxVolume,
  shapeLocked: persisted.shapeLocked,
  dailyBudgetMinutes: persisted.dailyBudgetMinutes,
  playTimeMs: persisted.playTimeMs,
  playDateKey: persisted.playDateKey,
}
function persist() { saveState(state) }
export function setThemeIndex(i) { state.themeIndex = i; persist() }
export function setShapeCount(n) { state.shapeCount = Math.max(MIN_SHAPES, Math.min(MAX_SHAPES, n)); persist() }
export function setSoundOn(b) { state.soundOn = !!b; persist() }
export function setChildName(name) { state.childName = String(name); persist() }
export function setMaxVolume(v) { state.maxVolume = Math.max(0, Math.min(1, Number(v) || 0)); persist() }
export function setShapeLocked(b) { state.shapeLocked = !!b; persist() }
export function setDailyBudget(mins) { state.dailyBudgetMinutes = Math.max(0, parseInt(mins) || 0); persist() }
let _playTimeSaveAt = 0
export function addPlayTime(ms) {
  state.playTimeMs += ms
  _playTimeSaveAt += ms
  if (_playTimeSaveAt >= 10_000) { _playTimeSaveAt = 0; persist() }
}
export function addPoint() {
  state.score += 1
  if (state.score > state.highScore) { state.highScore = state.score; persist(); return true }
  return false
}
export function resetScore() { state.score = 0 }
