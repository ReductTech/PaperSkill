import { easeInOut, useCanvasLoop, type DrawFn } from '../lib/use-canvas-loop';

const DOUGH = '#f5d9a8';
const DOUGH_EDGE = '#e0b877';
const DOUGH_HOLE = '#e8c98f';
const MOLD = '#2563eb';
const PLATE = '#cbd5e1';

type ShapeKind = 'star' | 'heart' | 'flower' | 'circle';
const SHAPES: ShapeKind[] = ['star', 'heart', 'flower', 'circle'];

function traceShape(ctx: CanvasRenderingContext2D, kind: ShapeKind, cx: number, cy: number, r: number) {
  ctx.beginPath();
  if (kind === 'circle') {
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    return;
  }
  if (kind === 'star') {
    for (let i = 0; i < 10; i += 1) {
      const rad = i % 2 === 0 ? r : r * 0.45;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const x = cx + Math.cos(a) * rad;
      const y = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    return;
  }
  if (kind === 'flower') {
    for (let i = 0; i <= 40; i += 1) {
      const t = (i / 40) * Math.PI * 2;
      const rad = r * (0.68 + 0.32 * Math.cos(6 * t));
      const x = cx + Math.cos(t) * rad;
      const y = cy + Math.sin(t) * rad;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    return;
  }
  for (let i = 0; i <= 40; i += 1) {
    const t = (i / 40) * Math.PI * 2;
    const x = cx + (r / 16) * 16 * Math.sin(t) ** 3;
    const y =
      cy -
      (r / 16) *
        (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

const draw: DrawFn = (ctx, w, h, loop, time) => {
  ctx.clearRect(0, 0, w, h);

  const kind = SHAPES[Math.floor(time / 4000) % SHAPES.length];
  const doughY = h * 0.72;
  const cutCx = w * 0.34;
  const plateCx = w * 0.78;
  const r = w * 0.11;

  ctx.fillStyle = PLATE;
  ctx.beginPath();
  ctx.ellipse(plateCx, doughY + 4, r * 1.5, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = DOUGH;
  ctx.strokeStyle = DOUGH_EDGE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(w * 0.14, doughY - r * 0.9, w * 0.44, r * 1.7, 8);
  ctx.fill();
  ctx.stroke();

  let moldY = h * 0.18;
  let showHole = false;
  let cutPiece: { x: number; y: number } | null = null;

  if (loop < 0.35) {
    const q = easeInOut(loop / 0.35);
    moldY = h * 0.14 + (doughY - h * 0.14) * q;
  } else if (loop < 0.5) {
    moldY = doughY;
    showHole = loop > 0.42;
  } else if (loop < 0.8) {
    const q = easeInOut((loop - 0.5) / 0.3);
    moldY = doughY - (doughY - h * 0.18) * q;
    showHole = true;
    cutPiece = { x: cutCx, y: moldY };
  } else {
    const q = easeInOut((loop - 0.8) / 0.2);
    showHole = true;
    cutPiece = {
      x: cutCx + (plateCx - cutCx) * q,
      y: h * 0.18 + (doughY - h * 0.18) * q,
    };
  }

  if (showHole) {
    ctx.fillStyle = DOUGH_HOLE;
    traceShape(ctx, kind, cutCx, doughY, r);
    ctx.fill();
  }

  if (cutPiece) {
    ctx.fillStyle = DOUGH;
    ctx.strokeStyle = DOUGH_EDGE;
    ctx.lineWidth = 2;
    traceShape(ctx, kind, cutPiece.x, cutPiece.y, r);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = MOLD;
  ctx.fillRect(cutCx - 3, moldY - r - 16, 6, 12);
  ctx.beginPath();
  ctx.arc(cutCx, moldY - r - 18, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = MOLD;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  traceShape(ctx, kind, cutCx, moldY, r);
  ctx.stroke();
};

export function MoldCutCanvas({ size = 120 }: { size?: number }) {
  const ref = useCanvasLoop(draw, size, size);
  return (
    <canvas
      ref={ref}
      style={{ width: size, height: size }}
      role="img"
      aria-label="模具切形动画：同一份面团被模具压切成星形、心形、花形等不同形状"
    />
  );
}
