import { useCanvasLoop, easeInOut, lerp, roundRect } from '../lib/use-canvas-loop';

const W = 460;
const H = 320;

const ACCENT = '#D9603B';
const ACCENT_SOFT = 'rgba(217,96,59,0.14)';
const INK = '#1F2937';
const SUB = '#8A7F79';
const LINE = '#E3D8D1';
const PANEL = '#FBF5F2';

const TEXT = { x: 96, y: 48 };
const IMG = { x: 364, y: 48 };
const CLIP = { x: 96, y: 132, w: 104, h: 46 };
const VAE = { x: 364, y: 132, w: 104, h: 46 };
const UNET = { x: 230, y: 214, w: 176, h: 48 };
const OUT = { x: 230, y: 288 };

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

function box(
  ctx: CanvasRenderingContext2D,
  b: { x: number; y: number; w: number; h: number },
  active: boolean,
) {
  roundRect(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 9);
  ctx.fillStyle = active ? ACCENT_SOFT : '#ffffff';
  ctx.fill();
  ctx.lineWidth = active ? 2 : 1.4;
  ctx.strokeStyle = active ? ACCENT : LINE;
  ctx.stroke();
}

function connector(ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number) {
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.4;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function imageSwatch(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, detail: number, blur: number) {
  const cells = 4;
  const cell = size / cells;
  const x0 = cx - size / 2;
  const y0 = cy - size / 2;
  ctx.save();
  if (blur > 0) ctx.filter = `blur(${blur}px)`;
  const palette = ['#E07a4d', '#c9542f', '#f0a884', '#b5471f'];
  for (let i = 0; i < cells; i++) {
    for (let j = 0; j < cells; j++) {
      const keep = (i * cells + j) / (cells * cells) < detail;
      ctx.fillStyle = keep ? palette[(i + j) % palette.length] : '#d8c4ba';
      ctx.fillRect(x0 + i * cell + 0.5, y0 + j * cell + 0.5, cell - 1, cell - 1);
    }
  }
  ctx.restore();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.strokeRect(x0, y0, size, size);
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

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, loop: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = PANEL;
  ctx.fillRect(0, 0, w, h);

  const p = loop * 4;
  const step = Math.min(3, Math.floor(p));
  const lp = easeInOut(p - step);

  connector(ctx, TEXT.x, TEXT.y + 14, CLIP.x, CLIP.y - CLIP.h / 2);
  connector(ctx, IMG.x, IMG.y + 14, VAE.x, VAE.y - VAE.h / 2);
  connector(ctx, CLIP.x, CLIP.y + CLIP.h / 2, UNET.x - 40, UNET.y - UNET.h / 2);
  connector(ctx, VAE.x, VAE.y + VAE.h / 2, UNET.x + 40, UNET.y - UNET.h / 2);
  connector(ctx, UNET.x, UNET.y + UNET.h / 2, OUT.x, OUT.y - 22);

  const chip = (c: { x: number; y: number }, text: string) => {
    roundRect(ctx, c.x - 46, c.y - 15, 92, 30, 15);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    label(ctx, text, c.x, c.y, 14, INK, '600');
  };
  chip(TEXT, '文本');
  chip(IMG, '图像');

  box(ctx, CLIP, step <= 1);
  label(ctx, 'CLIP', CLIP.x, CLIP.y - 6, 14, ACCENT, '700');
  label(ctx, '文本编码', CLIP.x, CLIP.y + 11, 10, SUB, '500');

  box(ctx, VAE, step <= 1);
  label(ctx, 'VAE', VAE.x, VAE.y - 6, 14, ACCENT, '700');
  label(ctx, '压缩编码', VAE.x, VAE.y + 11, 10, SUB, '500');

  box(ctx, UNET, step === 2);
  label(ctx, 'U-Net · Cross-Attn', UNET.x, UNET.y, 14, step === 2 ? ACCENT : INK, '700');

  ctx.save();
  if (step === 0) {
    const from = { x: (TEXT.x + IMG.x) / 2, y: 24 };
    const tx = lerp(from.x, TEXT.x, lp);
    const ty = lerp(from.y, TEXT.y, lp);
    const ix = lerp(from.x, IMG.x, lp);
    const iy = lerp(from.y, IMG.y, lp);
    dot(ctx, tx, ty, 7);
    imageSwatch(ctx, ix, iy, 22, 1, 0);
  } else if (step === 1) {
    dot(ctx, TEXT.x, lerp(TEXT.y, CLIP.y, lp), 7);
    const size = lerp(22, 11, lp);
    const detail = lerp(1, 0.3, lp);
    imageSwatch(ctx, IMG.x, lerp(IMG.y, VAE.y, lp), size, detail, lp * 1.2);
  } else if (step === 2) {
    const tX = lerp(CLIP.x, UNET.x - 18, lp);
    const tY = lerp(CLIP.y, UNET.y, lp);
    const iX = lerp(VAE.x, UNET.x + 18, lp);
    const iY = lerp(VAE.y, UNET.y, lp);
    dot(ctx, tX, tY, 6);
    imageSwatch(ctx, iX, iY, 11, 0.3, 1);
  } else {
    const y = lerp(UNET.y + 26, OUT.y, lp);
    imageSwatch(ctx, OUT.x, y, lerp(14, 40, lp), 0.3, 1 + lp * 3);
    if (lp > 0.5) {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const r = 26 + Math.sin(i * 3.3) * 8;
        ctx.fillStyle = 'rgba(217,96,59,0.35)';
        ctx.fillRect(OUT.x + Math.cos(a) * r, y + Math.sin(a) * r, 2, 2);
      }
    }
  }
  ctx.restore();

  const captions = [
    '分开摆盘：文本 / 图像 各走各路',
    '压缩：VAE 把图像压小，细节开始丢',
    '搬运：特征拼接进 U-Net',
    '输出：压缩损失累积，成图发糊',
  ];
  label(ctx, captions[step], w / 2, h - 14, 12, ACCENT, '600');
}

export function LegacyPipelineCanvas() {
  const ref = useCanvasLoop(draw, W, H);
  return (
    <canvas
      ref={ref}
      role="img"
      aria-label="传统路线动画：文本和图像分成两条路，图像先经 VAE 压缩后再进入 U-Net，压缩损失让成图发糊。"
      style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 10 }}
    />
  );
}
