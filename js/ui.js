export function buildUI(callbacks) {
  const { onThemeChange, onShapeCountChange, onSoundToggle, onResetScore } = callbacks

  // HUD
  const hud = document.createElement('div')
  hud.id = 'hud'
  hud.innerHTML = 'Score: <span id="score">0</span> · Best: <span id="best">0</span>'
  document.body.appendChild(hud)

  // Settings toggle button
  const toggle = document.createElement('button')
  toggle.id = 'settings-toggle'
  toggle.setAttribute('aria-label', 'Settings')
  toggle.textContent = '⚙'
  document.body.appendChild(toggle)

  // Settings panel
  const panel = document.createElement('div')
  panel.id = 'settings-panel'
  panel.hidden = true
  document.body.appendChild(panel)

  // Theme row
  const themeRow = document.createElement('div')
  themeRow.className = 'row'
  const themeLabel = document.createElement('span')
  themeLabel.textContent = 'Theme: '
  const themeName = document.createElement('span')
  themeName.id = 'theme-name'
  const themeNext = document.createElement('button')
  themeNext.id = 'theme-next'
  themeNext.textContent = 'Next ▸'
  themeRow.appendChild(themeLabel)
  themeRow.appendChild(themeName)
  themeRow.appendChild(themeNext)
  panel.appendChild(themeRow)

  // Shapes row
  const shapesRow = document.createElement('div')
  shapesRow.className = 'row'
  const shapesDec = document.createElement('button')
  shapesDec.id = 'shapes-dec'
  shapesDec.textContent = '–'
  const shapesCount = document.createElement('span')
  shapesCount.id = 'shapes-count'
  shapesCount.textContent = '6'
  const shapesInc = document.createElement('button')
  shapesInc.id = 'shapes-inc'
  shapesInc.textContent = '+'
  shapesRow.appendChild(shapesDec)
  shapesRow.appendChild(shapesCount)
  shapesRow.appendChild(shapesInc)
  panel.appendChild(shapesRow)

  // Sound row
  const soundRow = document.createElement('div')
  soundRow.className = 'row'
  const soundBtn = document.createElement('button')
  soundBtn.id = 'sound-toggle'
  soundBtn.textContent = 'Sound: On'
  soundBtn.setAttribute('aria-pressed', 'true')
  soundRow.appendChild(soundBtn)
  panel.appendChild(soundRow)

  // Reset row
  const resetRow = document.createElement('div')
  resetRow.className = 'row'
  const resetBtn = document.createElement('button')
  resetBtn.id = 'score-reset'
  resetBtn.textContent = 'Reset Score'
  resetRow.appendChild(resetBtn)
  panel.appendChild(resetRow)

  // Toggle panel visibility
  toggle.addEventListener('click', e => {
    e.stopPropagation()
    panel.hidden = !panel.hidden
  })

  // Close panel when clicking outside
  document.addEventListener('pointerdown', e => {
    if (!panel.hidden && !panel.contains(e.target) && e.target !== toggle) {
      panel.hidden = true
    }
  })

  // Theme next
  themeNext.addEventListener('click', e => {
    e.stopPropagation()
    onThemeChange()
  })

  // Shapes dec
  shapesDec.addEventListener('click', e => {
    e.stopPropagation()
    onShapeCountChange(-1)
  })

  // Shapes inc
  shapesInc.addEventListener('click', e => {
    e.stopPropagation()
    onShapeCountChange(1)
  })

  // Sound toggle
  soundBtn.addEventListener('click', e => {
    e.stopPropagation()
    onSoundToggle()
  })

  // Reset score
  resetBtn.addEventListener('click', e => {
    e.stopPropagation()
    onResetScore()
  })
}

export function setScore(n) {
  const el = document.getElementById('score')
  if (el) el.textContent = String(n)
}

export function setBest(n) {
  const el = document.getElementById('best')
  if (el) el.textContent = String(n)
}

export function setThemeName(name) {
  const el = document.getElementById('theme-name')
  if (el) el.textContent = name
}

export function setShapeCountLabel(n) {
  const el = document.getElementById('shapes-count')
  if (el) el.textContent = String(n)
}

export function setSoundLabel(on) {
  const el = document.getElementById('sound-toggle')
  if (el) {
    el.textContent = on ? 'Sound: On' : 'Sound: Off'
    el.setAttribute('aria-pressed', on ? 'true' : 'false')
  }
}
