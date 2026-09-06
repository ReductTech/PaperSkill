import { useCanvasLoop, type DrawFn } from '../lib/use-canvas-loop';

const WATER = '#3b82f6';
const WATER_SOFT = 'rgba(59,130,246,0.28)';
const LEAF = '#22c55e';
const LEAF_DARK = '#16a34a';
const BOWL = '#94a3b8';

const draw: DrawFn = (ctx, w, h, loop) => {
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const t = loop * Math.PI * 2;

  ctx.strokeStyle = WATER_SOFT;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, 6);
  ctx.lineTo(cx, h * 0.42);
  ctx.stroke();

  for (let i = 0; i < 5; i += 1) {
    const phase = (loop + i / 5) % 1;
    const dy = 8 + phase * (h * 0.42);
    const dx = cx + Math.sin((i + 1) * 2.1) * 5;
    ctx.fillStyle = WATER;
    ctx.globalAlpha = 1 - phase * 0.5;
    ctx.beginPath();
    ctx.ellipse(dx, dy, 1.8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const bowlY = h * 0.52;
  const bowlR = w * 0.36;
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = BOWL;
  ctx.beginPath();
  ctx.arc(cx, bowlY, bowlR, 0, Math.PI, false);
  ctx.stroke();

  ctx.fillStyle = BOWL;
  for (let i = -2; i <= 2; i += 1) {
    const hx = cx + i * (bowlR * 0.34);
    const hy = bowlY + bowlR * 0.72;
    ctx.beginPath();
    ctx.arc(hx, hy, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, bowlY, bowlR - 2, 0, Math.PI, false);
  ctx.clip();
  ctx.fillStyle = WATER_SOFT;
  ctx.beginPath();
  const surfaceY = bowlY + 4;
  ctx.moveTo(cx - bowlR, surfaceY + 20);
  for (let x = -bowlR; x <= bowlR; x += 4) {
    const y = surfaceY + Math.sin(x * 0.12 + t) * 2.2;
    ctx.lineTo(cx + x, y);
  }
  ctx.lineTo(cx + bowlR, bowlY + bowlR);
  ctx.lineTo(cx - bowlR, bowlY + bowlR);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  [
    { ox: -bowlR * 0.42, r: 9, ph: 0 },
    { ox: bowlR * 0.02, r: 11, ph: 1.7 },
    { ox: bowlR * 0.44, r: 8, ph: 3.1 },
  ].forEach((leaf) => {
    const bob = Math.sin(t + leaf.ph) * 2;
    const lx = cx + leaf.ox;
    const ly = bowlY + 6 + bob;
    ctx.fillStyle = LEAF;
    ctx.beginPath();
    ctx.ellipse(lx, ly, leaf.r, leaf.r * 0.72, Math.sin(leaf.ph) * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = LEAF_DARK;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(lx - leaf.r * 0.7, ly);
    ctx.lineTo(lx + leaf.r * 0.7, ly);
    ctx.stroke();
  });

  for (let i = 0; i < 4; i += 1) {
    const phase = (loop * 1.3 + i / 4) % 1;
    const sx = cx + Math.sin(i * 2 + t) * bowlR * 0.5;
    const sy = bowlY + 8 + phase * (bowlR * 0.7);
    ctx.fillStyle = 'rgba(120,113,108,0.5)';
    ctx.globalAlpha = 1 - phase;
    ctx.beginPath();
    ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const sparkle = Math.max(0, Math.sin(loop * Math.PI));
  if (sparkle > 0.05) {
    const sx = cx + bowlR * 0.5;
    const sy = bowlY - bowlR * 0.55;
    const s = 3 + sparkle * 3;
    ctx.strokeStyle = LEAF;
    ctx.globalAlpha = sparkle;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(sx - s, sy);
    ctx.lineTo(sx + s, sy);
    ctx.moveTo(sx, sy - s);
    ctx.lineTo(sx, sy + s);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
};

export function WashingVeggiesCanvas({ size = 120 }: { size?: number }) {
  const ref = useCanvasLoop(draw, size, size);
  return (
    <canvas
      ref={ref}
      style={{ width: size, height: size }}
      role="img"
      aria-label="洗菜动画：清水冲洗蔬菜，把杂质冲走"
    />
  );
}
