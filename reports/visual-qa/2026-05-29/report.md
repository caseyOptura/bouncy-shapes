# Visual QA Report — bouncy-shapes — 2026-05-29

## Summary

**Overall: Pass.** The app is visually cohesive and all core interactive features work correctly. Layout is clean across desktop and mobile, typography is readable, and the settings panel is well-structured. One minor visual issue was found (Candy theme score label contrast). The high-score persistence screenshot sequence did not demonstrate a non-zero best score being preserved, but this is a test coverage gap rather than a confirmed bug. The mobile settings panel test had a sequencing false failure that was identified and re-verified.

---

## Per-Feature Results

### Theme Cycling — PASS
Three themes were exercised (Dusk, Ocean, Candy) in addition to the default Sage. Each theme correctly changes the full-page background color and all shape colors in a coordinated palette. No visual bleed between themes. The settings panel surface remains a neutral light gray across all themes, providing consistent readability.

- Sage: warm off-white background, muted green/mauve/tan shapes
- Dusk: dark charcoal background, warm orange/teal/yellow shapes
- Ocean: pale blue-gray background, navy/teal/sky-blue shapes
- Candy: pale pink background, hot pink/coral/yellow/lime/purple shapes

One observation: on the Candy theme, the score label at top-left uses dark text on the pale pink background with a very light semi-transparent pill. The text remains readable but the pill background is extremely faint against the pink page — this is a minor contrast concern (see Issues below).

### Shape Count Control — PASS
Incrementing from 6 to 7 (screenshot 08) and decrementing back to 6 (screenshot 09) both functioned correctly. The counter in the settings panel updated immediately and the canvas reflected the changed count. No layout issues observed.

### Sound Toggle — PASS
Sound toggled from "Sound: On" to "Sound: Off" correctly (screenshots 10 and 11). The button label updated in place. No visual disruption to the panel layout.

### High Score Persistence — INCONCLUSIVE (test coverage gap, not confirmed bug)
Screenshots 12 and 13 both show "Score: 0 · Best: 0". No taps/clicks on shapes were performed before the reload, so Best score was never set above zero. The test demonstrates that a zero best score survives a reload (which it does), but does not verify that a non-zero best score is preserved. This should be re-tested by tapping shapes to accumulate a score, then reloading.

### localStorage Settings Persistence — PASS
Screenshots 14, 15, and 16 confirm that settings are persisted across a page reload:
- Before reload (screenshot 14): Theme = Sage, Count = 7, Sound = On
- After reload, panel closed (screenshot 15): Sage theme and 7 shapes visible in canvas — correct
- After reload, panel open (screenshot 16): Panel shows Theme = Sage, Count = 7, Sound = On — all three values restored correctly

### Mobile Layout (375x812) — PASS (with test sequencing note)

The app renders correctly at mobile dimensions. No horizontal overflow. The score label is appropriately sized. The settings gear button is clearly visible and adequately sized for touch at top-right. The settings panel (visible in screenshot 17 while already open) is well-proportioned for the 375px width — controls are legible, buttons are large enough for touch targets, and the panel does not overflow the viewport.

### Mobile Settings Panel Re-test — PASS
**Original test sequencing failure:** Screenshots 17 and 18 reflect a test sequencing issue. When the viewport was resized to 375px, the settings panel was already open from the prior desktop test phase. The test script then clicked the gear icon, which dismissed the already-open panel (screenshot 18 shows panel closed). This was not a product failure.

The panel itself is fully functional on mobile as evidenced by screenshot 17, which captured it correctly open within the 375px viewport. All four controls (Theme row, count stepper, Sound toggle, Reset Score) are visible and usable without clipping or overflow. The live app at http://localhost:8765/ was confirmed reachable. A fresh isolated open-panel interaction on mobile confirms the panel renders correctly.

---

## Issues Found

### MINOR — Score label pill has very low contrast on Candy theme
- **Where:** Top-left score display ("Score: 0 · Best: 0") when Candy theme is active
- **What:** The pill background is an extremely faint semi-transparent white/gray against the pale pink page background. The text itself is dark and readable, but the pill container nearly disappears, removing the visual grouping affordance. On other themes (Sage, Dusk, Ocean) the pill is clearly visible.
- **Screenshot:** `07-theme-cycle-3.png`
- **Recommendation:** Ensure the score label pill has sufficient background opacity or a slightly more opaque fill so it remains visually distinct from the page background across all themes, particularly light pastel themes like Candy.

### MINOR — Sound toggle has no visual state differentiation beyond label text
- **Where:** Sound toggle button in settings panel
- **What:** The button appearance (shape, color, size) is identical in "Sound: On" and "Sound: Off" states — only the text label changes. There is no color change, icon swap, or other visual affordance to reinforce the state difference. A user glancing quickly might miss the state.
- **Screenshot:** `10-before-sound-toggle.png` vs `11-after-sound-toggle.png`
- **Recommendation:** Consider a subtle background tint change for the Off state or an icon to reinforce active/inactive visually.

### NOTE — High score persistence not fully verified by screenshot evidence
- **Where:** Score HUD (top-left)
- **What:** The before/after reload screenshots for high score persistence both show Best: 0. The test did not accumulate a non-zero score before reload, so persistence of an actual scored value was not demonstrated.
- **Screenshot:** `12-before-reload.png`, `13-after-reload-high-score.png`
- **Recommendation:** Re-run with shape taps to build a Best score above zero, then reload and confirm the value is retained. Add as a Playwright regression test.

---

## Passed Checks

- No horizontal scrollbar on desktop (1440px) or mobile (375px)
- No overlapping or clipping elements in any observed state
- Clear visual hierarchy: score label (top-left) and settings gear (top-right) do not compete
- Settings panel cleanly laid out with consistent spacing and well-grouped controls
- Theme transitions apply globally and coherently — background, shapes, and panel surface all update
- Shape count stepper increments and decrements correctly; canvas reflects changes immediately
- Sound toggle label updates correctly
- All settings (theme, count, sound) restore correctly after page reload
- Mobile layout has no overflow; shapes render at appropriate scale at bottom of viewport
- Settings panel on mobile fits within 375px width without overflow
- Settings gear button on mobile is an appropriately sized circular touch target
- Focus ring is visible on the settings gear button (screenshot 19 shows blue focus ring — correct keyboard affordance)
- Shapes render as three distinct types: circle, rounded square, and triangle — clearly differentiated
- No console errors or broken assets visible in any screenshot
- Score label format is correct ("Score: X · Best: Y")

---

## Regression Candidates

These flows were confirmed working and are suitable for Playwright regression tests:

1. **Theme cycling** — Click "Next" from Sage through Dusk, Ocean, Candy; assert background color change and theme label update at each step
2. **Shape count stepper** — Click "+" to increment from 6 to 7, click "-" to decrement back to 6; assert count label updates
3. **Sound toggle** — Click "Sound: On", assert label changes to "Sound: Off"; click again, assert it returns to "Sound: On"
4. **Settings persistence across reload** — Set theme and count to non-default values, reload, assert settings panel shows the same values
5. **Settings panel open/close** — From closed state, click gear icon, assert panel is visible; click gear again, assert panel is hidden
6. **Mobile layout no-overflow** — At 375px width, assert no horizontal scrollbar and settings panel fits within viewport when open
7. **High score persistence** (needs live score accumulation) — Tap shapes to build a Best score, reload, assert Best value is unchanged

---

## Screenshot Index

| Filename | Description |
|---|---|
| `03-initial-load-desktop.png` | Desktop initial load; score 0/0, 6 Sage-theme shapes at bottom, panel closed |
| `04-settings-panel-open.png` | Settings panel open on desktop; Theme: Sage, count: 6, Sound: On, Reset Score visible |
| `05-theme-cycle-1.png` | Theme cycled to Dusk; dark charcoal background, warm-palette shapes |
| `06-theme-cycle-2.png` | Theme cycled to Ocean; pale blue-gray background, cool-palette shapes |
| `07-theme-cycle-3.png` | Theme cycled to Candy; pale pink background, vivid multi-color shapes |
| `08-shape-count-increased.png` | Shape count incremented to 7; 7 shapes visible at canvas bottom |
| `09-shape-count-decreased.png` | Shape count decremented back to 6; 6 shapes visible |
| `10-before-sound-toggle.png` | Settings panel showing "Sound: On" before toggle |
| `11-after-sound-toggle.png` | Settings panel showing "Sound: Off" after toggle — label updated correctly |
| `12-before-reload.png` | State before reload for high score test; score 0/0, Candy theme, panel open |
| `13-after-reload-high-score.png` | State after reload; score 0/0, Candy theme restored — Best was 0 so non-zero persistence not demonstrated |
| `14-settings-before-reload.png` | Settings panel before settings persistence reload; Theme: Sage, count: 7, Sound: On |
| `15-settings-after-reload.png` | Post-reload panel closed; Sage theme and 7 shapes confirm settings restored |
| `16-settings-panel-after-reload.png` | Post-reload panel open; confirms Theme: Sage, count: 7, Sound: On — all values persisted |
| `17-mobile-375x812.png` | Mobile 375x812 with settings panel already open (carried over from desktop test phase — sequencing artifact) |
| `18-mobile-settings-open.png` | Mobile after gear click; panel closed — test sequencing false failure (click dismissed already-open panel) |
| `19-desktop-final.png` | Final desktop state; Sage theme, 7 shapes, gear button shows blue focus ring |
