import { useCanvasLoop, easeInOut, lerp, roundRect } from '../lib/use-canvas-loop';

const W = 460;
const H = 320;

const ACCENT = '#2E5AAC';
const ACCENT_SOFT = 'rgba(46,90,172,0.12)';
const INK = '#1F2937';
const SUB = '#6B7A93';
const LINE = '#CBD8EC';
const PANEL = '#F4F7FC';

const INPUTS = [
  { x: 58, y: 74, text: '文本' },
  { x: 58, y: 160, text: '条件图像' },
  { x: 58, y: 246, text: '生成目标' },
];
const SPACE = { x: 202, y: 160, w: 118, h: 176 };
const TF = { x: 338, y: 160, w: 92, h: 128 };
const OUT = { x: 420, y: 160, size: 54 };

function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  weight = '600',
  align: CanvasTextAlign = 'center',
) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ui-sans-serif, system-ui, "Microsoft YaHei", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, loop: number, time: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = PANEL;
  ctx.fillRect(0, 0, w, h);

  const p = loop * 4;
  const step = Math.min(3, Math.floor(p));
  const lp = easeInOut(p - step);

  const spaceLeft = SPACE.x - SPACE.w / 2;
  for (const inp of INPUTS) {
    ctx.beginPath();
    ctx.moveTo(inp.x + 40, inp.y);
    ctx.lineTo(spaceLeft, SPACE.y);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  line(ctx, SPACE.x + SPACE.w / 2, SPACE.y, TF.x - TF.w / 2, TF.y);
  line(ctx, TF.x + TF.w / 2, TF.y, OUT.x - OUT.size / 2, OUT.y);

  roundRect(ctx, spaceLeft, SPACE.y - SPACE.h / 2, SPACE.w, SPACE.h, 12);
  ctx.fillStyle = step >= 1 && step <= 2 ? ACCENT_SOFT : '#ffffff';
  ctx.fill();
  ctx.lineWidth = step >= 1 && step <= 2 ? 2 : 1.4;
  ctx.strokeStyle = step >= 1 && step <= 2 ? ACCENT : LINE;
  ctx.stroke();
  label(ctx, '统一 Token 空间', SPACE.x, SPACE.y - SPACE.h / 2 + 14, 11, ACCENT, '700');

  const cols = 4;
  const rows = 5;
  const gx = SPACE.w / (cols + 1);
  const gy = (SPACE.h - 34) / (rows + 1);
  const gridTop = SPACE.y - SPACE.h / 2 + 26;
  const tokens: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      tokens.push({ x: spaceLeft + gx * (c + 1), y: gridTop + gy * (r + 1) });
    }
  }
  tokens.forEach((t, i) => {
    let on = step >= 2;
    let a = 1;
    if (step === 1) {
      const wave = i / tokens.length;
      on = lp > wave * 0.8;
      a = on ? 1 : 0.25;
    } else if (step === 0) {
      a = 0.25;
    } else if (step === 2) {
      a = 0.55 + 0.45 * Math.abs(Math.sin(time * 0.006 + i));
    }
    ctx.globalAlpha = a;
    ctx.fillStyle = on || step >= 2 ? ACCENT : '#c4d2e8';
    roundRect(ctx, t.x - 6, t.y - 6, 12, 12, 3);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  roundRect(ctx, TF.x - TF.w / 2, TF.y - TF.h / 2, TF.w, TF.h, 10);
  ctx.fillStyle = step === 2 ? ACCENT_SOFT : '#ffffff';
  ctx.fill();
  ctx.lineWidth = step === 2 ? 2 : 1.4;
  ctx.strokeStyle = step === 2 ? ACCENT : LINE;
  ctx.stroke();
  label(ctx, '统一', TF.x, TF.y - 10, 13, INK, '700');
  label(ctx, 'Transformer', TF.x, TF.y + 6, 11, SUB, '600');
  label(ctx, 'Hybrid Attention', TF.x, TF.y + 20, 8.5, SUB, '500');

  const outClear = step === 3 ? lp : step > 3 ? 1 : 0;
  drawOutput(ctx, OUT.x, OUT.y, OUT.size, step === 3 ? outClear : step > 3 ? 1 : 0);

  ctx.save();
  if (step === 0) {
    for (const inp of INPUTS) {
      const x = lerp(inp.x + 40, spaceLeft, lp);
      const y = lerp(inp.y, SPACE.y, lp);
      dot(ctx, x, y, 6);
    }
  } else if (step === 2) {
    const x = lerp(SPACE.x + SPACE.w / 2, TF.x, lp);
    dot(ctx, x, SPACE.y, 6);
    ctx.strokeStyle = 'rgba(46,90,172,0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = tokens[(i * 3) % tokens.length];
      const b = tokens[(i * 3 + 7) % tokens.length];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  } else if (step === 3) {
    const x = lerp(TF.x + TF.w / 2, OUT.x - OUT.size / 2, Math.min(1, lp * 2));
    if (lp < 0.6) dot(ctx, x, OUT.y, 6);
  }
  ctx.restore();

  for (const inp of INPUTS) {
    roundRect(ctx, inp.x - 40, inp.y - 15, 80, 30, 15);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = step === 0 ? ACCENT : LINE;
    ctx.lineWidth = step === 0 ? 1.8 : 1.4;
    ctx.stroke();
    label(ctx, inp.text, inp.x, inp.y, 12.5, INK, '600');
  }

  const captions = [
    '汇聚：文本 / 图像 / 任务条件 汇入同一空间',
    '统一：所有 token 对齐成同一结构',
    '处理：统一 Transformer 混合注意力',
    '输出：直接在原生空间生成高保真图像',
  ];
  label(ctx, captions[step], w / 2, h - 14, 12, ACCENT, '600');
}

function drawOutput(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  clear: number,
) {
  const cells = 6;
  const cell = size / cells;
  const x0 = cx - size / 2;
  const y0 = cy - size / 2;
  const palette = ['#2E5AAC', '#4f7bcf', '#8fb0e6', '#1f3f7a', '#6f97dd'];
  for (let i = 0; i < cells; i++) {
    for (let j = 0; j < cells; j++) {
      const base = palette[(i + j) % palette.length];
      ctx.fillStyle = clear < 1 ? (Math.random() < 1 - clear ? '#b9c6dc' : base) : base;
      ctx.fillRect(x0 + i * cell, y0 + j * cell, cell, cell);
    }
  }
  ctx.lineWidth = clear >= 1 ? 2 : 1.4;
  ctx.strokeStyle = clear >= 1 ? ACCENT : LINE;
  roundRect(ctx, x0, y0, size, size, 6);
  ctx.stroke();
  label(ctx, clear >= 1 ? '2048×2048' : '生成中', cx, y0 + size + 12, 9.5, clear >= 1 ? ACCENT : SUB, '600');
}

function line(
  ctx: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.4;
  ctx.stroke();
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = ACCENT;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function UnifiedPipelineCanvas() {
  const ref = useCanvasLoop(draw, W, H);
  return (
    <canvas
      ref={ref}
      role="img"
      aria-label="统一路线动画：三种输入汇入同一个 Token 空间，经统一 Transformer 处理后直接生成高保真图像。"
      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 10 }}
    />
  );
}
