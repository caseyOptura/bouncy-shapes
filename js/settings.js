import { state, setChildName, setMaxVolume as setStateMaxVolume, setShapeLocked, setDailyBudget } from './state.js'
import { setMaxVolume as setAudioMaxVolume } from './audio.js'

let _onShapeLockChange = null

export function buildParentSettings({ onShapeLockChange }) {
  _onShapeLockChange = onShapeLockChange

  // Gear button that opens the parent pane
  const gearBtn = document.createElement('button')
  gearBtn.id = 'parent-settings-btn'
  gearBtn.setAttribute('aria-label', 'Parent settings')
  gearBtn.textContent = '\u{1F512}'
  document.body.appendChild(gearBtn)

  // Overlay backdrop
  const backdrop = document.createElement('div')
  backdrop.id = 'parent-settings-backdrop'
  backdrop.hidden = true
  document.body.appendChild(backdrop)

  // Drawer panel
  const panel = document.createElement('div')
  panel.id = 'parent-settings-panel'
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-modal', 'true')
  panel.setAttribute('aria-label', 'Parent settings')
  panel.hidden = true
  document.body.appendChild(panel)

  // ── Header ────────────────────────────────────────────────────────────────
  const header = document.createElement('div')
  header.className = 'ps-header'
  const title = document.createElement('h2')
  title.className = 'ps-title'
  title.textContent = 'Parent Settings'
  const closeBtn = document.createElement('button')
  closeBtn.id = 'parent-settings-close'
  closeBtn.setAttribute('aria-label', 'Close parent settings')
  closeBtn.textContent = '✕'
  header.appendChild(title)
  header.appendChild(closeBtn)
  panel.appendChild(header)

  // ── Child name ────────────────────────────────────────────────────────────
  const nameRow = _row()
  const nameLabel = _label("Child's name", 'ps-child-name')
  const nameInput = document.createElement('input')
  nameInput.type = 'text'
  nameInput.id = 'ps-child-name'
  nameInput.className = 'ps-input'
  nameInput.placeholder = 'e.g. Alex'
  nameInput.maxLength = 40
  nameInput.value = state.childName
  nameRow.appendChild(nameLabel)
  nameRow.appendChild(nameInput)
  panel.appendChild(nameRow)

  // ── Max volume (custom drag slider) ──────────────────────────────────────
  const volRow = _row()
  const volLabel = _label('Max volume', 'ps-vol-track')
  const volTrack = document.createElement('div')
  volTrack.id = 'ps-vol-track'
  volTrack.className = 'ps-vol-track'
  volTrack.setAttribute('role', 'slider')
  volTrack.setAttribute('aria-label', 'Max volume')
  volTrack.setAttribute('aria-valuemin', '0')
  volTrack.setAttribute('aria-valuemax', '1')
  const volFill = document.createElement('div')
  volFill.className = 'ps-vol-fill'
  const volThumb = document.createElement('div')
  volThumb.className = 'ps-vol-thumb'
  volTrack.appendChild(volFill)
  volTrack.appendChild(volThumb)
  volRow.appendChild(volLabel)
  volRow.appendChild(volTrack)
  panel.appendChild(volRow)

  function _setVol(v) {
    const clamped = Math.max(0, Math.min(1, v))
    volFill.style.width = `${clamped * 100}%`
    volThumb.style.left = `${clamped * 100}%`
    volTrack.setAttribute('aria-valuenow', clamped.toFixed(2))
    setStateMaxVolume(clamped)
    setAudioMaxVolume(clamped)
  }

  _setVol(state.maxVolume)

  volTrack.addEventListener('pointerdown', e => {
    e.preventDefault()
    e.stopPropagation()
    volTrack.setPointerCapture(e.pointerId)
    const rect = volTrack.getBoundingClientRect()
    _setVol((e.clientX - rect.left) / rect.width)
  })

  volTrack.addEventListener('pointermove', e => {
    if (!volTrack.hasPointerCapture(e.pointerId)) return
    const rect = volTrack.getBoundingClientRect()
    _setVol((e.clientX - rect.left) / rect.width)
  })

  volTrack.addEventListener('pointerup', e => {
    volTrack.releasePointerCapture(e.pointerId)
  })

  // ── Lock shape count ──────────────────────────────────────────────────────
  const lockRow = _row()
  const lockLabel = _label('Lock shape count', 'ps-shape-lock')
  const lockToggle = document.createElement('input')
  lockToggle.type = 'checkbox'
  lockToggle.id = 'ps-shape-lock'
  lockToggle.className = 'ps-checkbox'
  lockToggle.checked = state.shapeLocked
  lockRow.appendChild(lockLabel)
  lockRow.appendChild(lockToggle)
  panel.appendChild(lockRow)

  // ── Daily budget ──────────────────────────────────────────────────────────
  const budgetRow = _row()
  const budgetLabel = _label('Daily play (mins, 0 = off)', 'ps-daily-budget')
  const budgetInput = document.createElement('input')
  budgetInput.type = 'number'
  budgetInput.id = 'ps-daily-budget'
  budgetInput.className = 'ps-input ps-input--narrow'
  budgetInput.min = '0'
  budgetInput.max = '999'
  budgetInput.step = '1'
  budgetInput.value = String(state.dailyBudgetMinutes)
  budgetRow.appendChild(budgetLabel)
  budgetRow.appendChild(budgetInput)
  panel.appendChild(budgetRow)

  // ── Event wiring ──────────────────────────────────────────────────────────
  function open() {
    panel.hidden = false
    backdrop.hidden = false
  }
  function close() {
    panel.hidden = true
    backdrop.hidden = true
  }

  gearBtn.addEventListener('click', e => { e.stopPropagation(); open() })
  closeBtn.addEventListener('click', e => { e.stopPropagation(); close() })
  backdrop.addEventListener('pointerdown', () => close())

  nameInput.addEventListener('change', () => {
    setChildName(nameInput.value.trim())
  })


  lockToggle.addEventListener('change', () => {
    setShapeLocked(lockToggle.checked)
    if (_onShapeLockChange) _onShapeLockChange(lockToggle.checked)
  })

  budgetInput.addEventListener('change', () => {
    const mins = Math.max(0, parseInt(budgetInput.value) || 0)
    budgetInput.value = String(mins)
    setDailyBudget(mins)
  })
}

// ── Budget warning toast ──────────────────────────────────────────────────────

let _toastShown = false

export function checkBudgetWarning(playTimeMs) {
  const budget = state.dailyBudgetMinutes
  if (budget <= 0) return
  if (_toastShown) return
  if (playTimeMs >= budget * 60 * 1000) {
    _toastShown = true
    _showToast(`Time's up! You've played for ${budget} minute${budget === 1 ? '' : 's'} today.`)
  }
}

export function resetBudgetWarning() {
  _toastShown = false
}

function _showToast(msg) {
  let toast = document.getElementById('playtime-toast')
  if (!toast) {
    toast = document.createElement('div')
    toast.id = 'playtime-toast'
    document.body.appendChild(toast)
  }
  toast.textContent = msg
  toast.classList.remove('playtime-toast--visible')
  void toast.offsetWidth
  toast.classList.add('playtime-toast--visible')
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _row() {
  const div = document.createElement('div')
  div.className = 'ps-row'
  return div
}

function _label(text, forId) {
  const el = document.createElement('label')
  el.className = 'ps-label'
  el.setAttribute('for', forId)
  el.textContent = text
  return el
}
