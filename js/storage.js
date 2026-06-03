/**
 * Persisted settings for bouncy-shapes.
 *
 * Covers all persisted state: game preferences (theme, shape count, sound),
 * parent controls (child name, max volume, shape lock, daily play budget),
 * and playtime tracking (accumulated ms + date key for daily reset).
 *
 * parseSafe(raw) is the single read path — pass any value from localStorage
 * and get back a fully-valid state object. All type coercion and range
 * clamping lives here via _int/_float helpers; loadState() only handles
 * the localStorage read and JSON parse.
 *
 * The TypeScript/Zod equivalent of this contract lives in
 * kit/schemas/settings.ts in the self-guided-claude-code-training repo.
 * Keep DEFAULTS and the field constraints in both files in sync.
 */
import { THEMES } from './themes.js'
import { MIN_SHAPES, MAX_SHAPES } from './shapes.js'

const KEY = 'bouncy-shapes:v1'

export const DEFAULTS = {
  themeIndex: 0,
  shapeCount: 6,
  soundOn: true,
  highScore: 0,
  childName: '',
  maxVolume: 1,
  shapeLocked: false,
  dailyBudgetMinutes: 0,
  playTimeMs: 0,
  playDateKey: '',
}

// Single read path — mirrors SettingsSchema in kit/schemas/settings.ts.
// Accepts any value (parsed JSON, null, array, wrong types) and returns
// a fully-valid state object. All coercion lives here.
export function parseSafe(raw) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULTS, playDateKey: _dateKey() }
  }
  const today = _dateKey()
  const storedDate = typeof raw.playDateKey === 'string' ? raw.playDateKey : ''
  return {
    ...DEFAULTS,
    themeIndex:         _int(raw.themeIndex,         0,         THEMES.length - 1, DEFAULTS.themeIndex),
    shapeCount:         _int(raw.shapeCount,          MIN_SHAPES, MAX_SHAPES,       DEFAULTS.shapeCount),
    soundOn:            raw.soundOn !== false,
    highScore:          _int(raw.highScore,           0,         Infinity,          DEFAULTS.highScore),
    childName:          typeof raw.childName === 'string' ? raw.childName : DEFAULTS.childName,
    maxVolume:          _float(raw.maxVolume,         0,         1,                 DEFAULTS.maxVolume),
    shapeLocked:        raw.shapeLocked === true,
    dailyBudgetMinutes: _int(raw.dailyBudgetMinutes,  0,         Infinity,          DEFAULTS.dailyBudgetMinutes),
    playTimeMs:         storedDate === today ? _float(raw.playTimeMs, 0, Infinity, 0) : 0,
    playDateKey:        today,
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS, playDateKey: _dateKey() }
    return parseSafe(JSON.parse(raw))
  } catch {
    return { ...DEFAULTS, playDateKey: _dateKey() }
  }
}

export function saveState(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      themeIndex: s.themeIndex,
      shapeCount: s.shapeCount,
      soundOn: s.soundOn,
      highScore: s.highScore,
      childName: s.childName,
      maxVolume: s.maxVolume,
      shapeLocked: s.shapeLocked,
      dailyBudgetMinutes: s.dailyBudgetMinutes,
      playTimeMs: s.playTimeMs,
      playDateKey: s.playDateKey,
    }))
  } catch {}
}

function _dateKey() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function _int(v, min, max, fallback) {
  const n = parseInt(v)
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback
}

function _float(v, min, max, fallback) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback
}
