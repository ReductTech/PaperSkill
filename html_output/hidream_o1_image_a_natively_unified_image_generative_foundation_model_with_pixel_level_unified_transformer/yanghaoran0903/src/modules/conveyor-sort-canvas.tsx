import { useCanvasLoop, type DrawFn } from '../lib/use-canvas-loop';

const BELT = '#94a3b8';
const BELT_DARK = '#64748b';
const KEEP = '#22c55e';
const REJECT = '#f43f5e';
const FRAME = '#3b82f6';

const FOODS = [
  { ph: 0, good: true, hue: '#f59e0b' },
  { ph: 0.33, good: false, hue: '#a3a3a3' },
  { ph: 0.66, good: true, hue: '#ef4444' },
];

const draw: DrawFn = (ctx, w, h, loop, time) => {
  ctx.clearRect(0, 0, w, h);
  const beltY = h * 0.5;
  const beltLeft = 8;
  const beltRight = w * 0.66;
  const splitX = w * 0.6;
  const binX = w * 0.82;

  ctx.strokeStyle = BELT;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(beltLeft, beltY + 10);
  ctx.lineTo(beltRight, beltY + 10);
  ctx.stroke();

  ctx.strokeStyle = BELT_DARK;
  ctx.lineWidth = 2;
  const scroll = (time / 24) % 12;
  for (let x = beltLeft - 12 + scroll; x < beltRight; x += 12) {
    ctx.beginPath();
    ctx.moveTo(x, beltY + 6);
    ctx.lineTo(x, beltY + 14);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(34,197,94,0.14)';
  ctx.strokeStyle = KEEP;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(binX, beltY - 30, w * 0.15, 20, 3);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = 'rgba(244,63,94,0.14)';
  ctx.strokeStyle = REJECT;
  ctx.beginPath();
  ctx.roundRect(binX, beltY + 18, w * 0.15, 20, 3);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = FRAME;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(splitX, beltY - 12);
  ctx.lineTo(splitX, beltY + 8);
  ctx.stroke();

  FOODS.forEach((food) => {
    const p = (loop + food.ph) % 1;
    let x = 0;
    let y = beltY;
    if (p < 0.6) {
      x = beltLeft + (splitX - beltLeft) * (p / 0.6);
    } else {
      const q = (p - 0.6) / 0.4;
      x = splitX + (binX + w * 0.06 - splitX) * q;
      y = beltY + (food.good ? -1 : 1) * q * 30;
    }

    ctx.fillStyle = food.hue;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    if (p >= 0.58) {
      ctx.strokeStyle = food.good ? KEEP : REJECT;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 8.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
};

export function ConveyorSortCanvas({ size = 120 }: { size?: number }) {
  const ref = useCanvasLoop(draw, size, size);
  return (
    <canvas
      ref={ref}
      style={{ width: size, height: size }}
      role="img"
      aria-label="传送带分拣动画：食材在流水线上被分拣到保留与丢弃两个料盒"
    />
  );
}
