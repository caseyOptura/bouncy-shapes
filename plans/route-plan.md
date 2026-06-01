# Route Plan: Game Feature Additions

**Task:** Add color theme cycling, shape count control, sound toggle, and high score tracking — all persisted via localStorage.

**Task type:** New feature — frontend only (browser game, client-side only)

All four features (theme cycling, shape count control, sound toggle, high score tracking) are pure UI + localStorage — no backend involved.

---

## Execution Plan

### 1. `implementation-planner`
Scope the UI controls, state model, localStorage schema, and interaction patterns across all four features before touching code.

### 2. `frontend-developer`
Implement all four features against the plan: theme cycling logic, shape count slider/stepper, sound toggle with Web Audio or `<audio>`, high score persistence and display.

### 3. `chrome-visual-tester`
Verify controls render correctly, theme changes are visible, score persists across page reloads, and sound toggle behaves as expected.

---

## Notes

**Why not parallel in step 2?**
All four features land in the same small HTML/JS files (this is a single-page tap app). Parallel agents would conflict on edits to the same files — sequential is safer.

**Why no `typescript-enforcer`?**
The project is plain HTML/JS (no TypeScript), so there are no types to enforce.

---

> If any file in scope exceeds **200 lines** (components) or **300 lines** (services/utilities), the developer agent will flag it for decomposition before proceeding.
