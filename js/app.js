const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const GRAVITY = 0.28;
const FLOOR_RESTITUTION = 0.58;
const WALL_RESTITUTION = 0.65;
const AIR_FRICTION = 0.988;
const TAP_VY = -9;
const TAP_VX_SCALE = 8;
const STOP_VY = 0.9;

const SHAPES = [
  { r: 55, color: '#7aab98',  type: 'circle' },
  { r: 44, color: '#c49aa0',  type: 'square' },
  { r: 62, color: '#9ba8c4',  type: 'triangle' },
  { r: 40, color: '#c9a882',  type: 'circle' },
  { r: 52, color: '#a8b87a',  type: 'square' },
  { r: 48, color: '#c09a7a',  type: 'triangle' },
];

let shapes = [];
let W = 0;
let H = 0;

// Prevent iOS edge-swipe navigation
document.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
document.addEventListener('touchmove',  e => e.preventDefault(), { passive: false });

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

function initShapes() {
  const count = SHAPES.length;
  shapes = SHAPES.map((def, i) => ({
    x: def.r + (i / (count - 1)) * (W - 2 * def.r),
    y: H - def.r,
    vx: 0,
    vy: 0,
    r: def.r,
    color: def.color,
    type: def.type,
  }));
}

function getTapPos(e) {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  const src = e.changedTouches ? e.changedTouches[0] : e;
  return {
    x: (src.clientX - rect.left) * sx,
    y: (src.clientY - rect.top) * sy,
  };
}

canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  const pos = getTapPos(e);

  let hit = null;
  let closest = Infinity;

  for (const s of shapes) {
    const dist = Math.hypot(pos.x - s.x, pos.y - s.y);
    if (dist <= s.r && dist < closest) {
      hit = s;
      closest = dist;
    }
  }

  if (hit) {
    const offset = Math.max(-1, Math.min(1, (pos.x - hit.x) / hit.r));
    hit.vx = -offset * TAP_VX_SCALE;
    hit.vy = TAP_VY;
  }
}, { passive: false });

function update() {
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

function tracePath(s) {
  ctx.beginPath();
  if (s.type === 'circle') {
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
  } else if (s.type === 'square') {
    const side = s.r * 1.7;
    const corner = s.r * 0.28;
    ctx.roundRect(s.x - side / 2, s.y - side / 2, side, side, corner);
  } else if (s.type === 'triangle') {
    const h = s.r;
    ctx.moveTo(s.x, s.y - h);
    ctx.lineTo(s.x + h * Math.sqrt(3) / 2, s.y + h * 0.5);
    ctx.lineTo(s.x - h * Math.sqrt(3) / 2, s.y + h * 0.5);
    ctx.closePath();
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  for (const s of shapes) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.10)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 5;
    tracePath(s);
    ctx.fillStyle = s.color;
    ctx.fill();
    ctx.restore();
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => {
  resize();
  initShapes();
});

resize();
initShapes();
loop();
// small change
