function tracePath(ctx, s) {
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

export function draw(ctx, shapes, W, H) {
  ctx.clearRect(0, 0, W, H);

  for (const s of shapes) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.10)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 5;
    tracePath(ctx, s);
    ctx.fillStyle = s.color;
    ctx.fill();
    ctx.restore();
  }
}
