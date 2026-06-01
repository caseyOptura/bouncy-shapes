const GRAVITY = 0.28;
const FLOOR_RESTITUTION = 0.58;
const WALL_RESTITUTION = 0.65;
const AIR_FRICTION = 0.988;
const STOP_VY = 0.9;

export function update(shapes, W, H) {
  for (const s of shapes) {
    s.vy += GRAVITY;
    s.vx *= AIR_FRICTION;
    s.x += s.vx;
    s.y += s.vy;

    if (s.y + s.r >= H) {
      s.y = H - s.r;
      s.vy = Math.abs(s.vy) < STOP_VY ? 0 : -Math.abs(s.vy) * FLOOR_RESTITUTION;
    }

    if (s.y - s.r <= 0) {
      s.y = s.r;
      s.vy = Math.abs(s.vy) * WALL_RESTITUTION;
    }

    if (s.x - s.r <= 0) {
      s.x = s.r;
      s.vx = Math.abs(s.vx) * WALL_RESTITUTION;
    }

    if (s.x + s.r >= W) {
      s.x = W - s.r;
      s.vx = -Math.abs(s.vx) * WALL_RESTITUTION;
    }
  }
}
