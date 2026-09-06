import { useEffect, useRef, useState, type ReactNode } from 'react';

function useCanvas(draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let t = 0;

    const resize = () => {
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ro = new ResizeObserver(resize);
    resize();
    ro.observe(canvas);

    const frame = () => {
      draw(ctx, canvas.clientWidth || 1, canvas.clientHeight || 1, t);
      t += 0.016;
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(frame);
    };
    frame();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [draw]);

  return ref;
}

function pot(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, bubble: number, color: string, t: number) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy - r * 0.4);
  ctx.lineTo(cx - r * 0.8, cy + r * 0.7);
  ctx.quadraticCurveTo(cx, cy + r * 0.95, cx + r * 0.8, cy + r * 0.7);
  ctx.lineTo(cx + r, cy - r * 0.4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.4, r * 0.92, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (let i = 0; i < 4; i += 1) {
    const phase = (t * bubble + i * 1.7) % 6;
    const by = cy - r * 0.4 - phase * 6;
    const bx = cx - r * 0.5 + i * r * 0.35;
    ctx.globalAlpha = Math.max(0, 1 - phase / 6);
    ctx.beginPath();
    ctx.arc(bx, by, 2 + i * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function QuickRecipeCanvas() {
  const ref = useCanvas((ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const pulse = (Math.sin(t * 2.8) + 1) / 2;

    pot(ctx, w * 0.24, h * 0.42, Math.min(w, h) * 0.2, 0.35, '#c2410c', t);
    ctx.fillStyle = '#7c2d12';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('50 steps', w * 0.24, h * 0.78);

    const ax = w * 0.5;
    const ay = h * 0.42;
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2 + pulse * 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ax - w * 0.06, ay);
    ctx.lineTo(ax + w * 0.06, ay);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ax + w * 0.06, ay);
    ctx.lineTo(ax + w * 0.035, ay - 6);
    ctx.lineTo(ax + w * 0.035, ay + 6);
    ctx.closePath();
    ctx.fillStyle = '#b45309';
    ctx.fill();
    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillText('distill x2', ax, ay - 12);

    const wx = w * 0.76;
    const wy = h * 0.42;
    const wr = Math.min(w, h) * 0.16;
    for (let i = 0; i < 5; i += 1) {
      const fx = wx - wr * 0.7 + i * wr * 0.35;
      const fh = wr * (0.6 + 0.4 * Math.abs(Math.sin(t * 9 + i)));
      const grad = ctx.createLinearGradient(fx, wy + wr * 0.6, fx, wy + wr * 0.6 - fh);
      grad.addColorStop(0, '#f59e0b');
      grad.addColorStop(1, '#fcd34d');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(fx - 4, wy + wr * 0.6);
      ctx.quadraticCurveTo(fx, wy + wr * 0.6 - fh, fx + 4, wy + wr * 0.6);
      ctx.closePath();
      ctx.fill();
    }
    pot(ctx, wx, wy, wr, 0.9, '#9a3412', t);
    ctx.fillStyle = '#7c2d12';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText('28 steps', wx, h * 0.78);
  });

  return <canvas ref={ref} className="s6-canvas" role="img" aria-label="慢炖浓汤压缩成快手菜谱动画" />;
}

const GRID = 14;

function targetColor(i: number, j: number): [number, number, number] {
  const x = i / (GRID - 1);
  const y = j / (GRID - 1);
  let r = 120 + 90 * (1 - y);
  let g = 170 + 60 * (1 - y);
  let b = 230;
  const hill = 0.68 + 0.12 * Math.sin(x * Math.PI * 1.5);
  if (y > hill) {
    r = 74;
    g = 130;
    b = 90;
  }
  if (Math.hypot(x - 0.72, y - 0.28) < 0.13) {
    r = 253;
    g = 224;
    b = 120;
  }
  return [r, g, b];
}

function thumb(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  size: number,
  progress: number,
  noise: number[],
) {
  const cell = size / GRID;
  const p = Math.max(0, Math.min(1, progress));
  for (let i = 0; i < GRID; i += 1) {
    for (let j = 0; j < GRID; j += 1) {
      const [tr, tg, tb] = targetColor(i, j);
      const n = noise[j * GRID + i];
      const reveal = Math.max(0, Math.min(1, (p - n * 0.5) / 0.5));
      const jitter = (1 - reveal) * 255;
      const rr = tr * reveal + n * 255 * (1 - reveal) * 0.6 + (Math.random() - 0.5) * jitter * 0.3;
      const gg = tg * reveal + n * 200 * (1 - reveal) * 0.6 + (Math.random() - 0.5) * jitter * 0.3;
      const bb = tb * reveal + n * 180 * (1 - reveal) * 0.6 + (Math.random() - 0.5) * jitter * 0.3;
      ctx.fillStyle = `rgb(${rr | 0},${gg | 0},${bb | 0})`;
      ctx.fillRect(px + i * cell, py + j * cell, cell + 0.6, cell + 0.6);
    }
  }
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, size, size);
}

function ruler(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  steps: number,
  doneRatio: number,
  color: string,
) {
  const gap = w / steps;
  const doneSteps = Math.floor(steps * doneRatio);
  for (let s = 0; s < steps; s += 1) {
    const tx = x + s * gap;
    ctx.fillStyle = s <= doneSteps ? color : '#d1d5db';
    const bh = s <= doneSteps ? 12 : 7;
    ctx.fillRect(tx, y - bh / 2, Math.max(1.5, gap - 1.5), bh);
  }
}

export function DistillCanvas() {
  const noiseRef = useRef(Array.from({ length: GRID * GRID }, () => Math.random()));
  const ref = useCanvas((ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const loop = (t * 0.38) % 1.35;
    if (loop < 0.01) noiseRef.current = noiseRef.current.map(() => Math.random());
    const teacherP = Math.min(1, loop / 1);
    const studentP = Math.min(1, loop / 0.5);
    const padX = Math.max(16, w * 0.03);
    const thumbSize = Math.min(h * 0.34, 92);
    const laneW = w - padX * 2 - thumbSize - 24;
    const laneX = padX;

    const ty = h * 0.3;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('教师 · 完整版', laneX, ty - 26);
    ctx.fillStyle = '#64748b';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(`50 步 · 慢 (${Math.round(teacherP * 50)}/50)`, laneX + 92, ty - 26);
    ruler(ctx, laneX, ty, laneW, 50, teacherP, '#6366f1');
    thumb(ctx, laneX + laneW + 24, ty - thumbSize / 2, thumbSize, teacherP, noiseRef.current);

    const sy = h * 0.72;
    ctx.fillStyle = '#0f766e';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('学生 · Dev', laneX, sy - 26);
    ctx.fillStyle = '#0d9488';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(`28 步 · 快 2x (${Math.round(studentP * 28)}/28)`, laneX + 74, sy - 26);
    ruler(ctx, laneX, sy, laneW, 28, studentP, '#14b8a6');
    thumb(ctx, laneX + laneW + 24, sy - thumbSize / 2, thumbSize, studentP, noiseRef.current);

    ctx.strokeStyle = 'rgba(20,184,166,0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    for (let k = 1; k <= 3; k += 1) {
      const lx = laneX + (laneW * k) / 4;
      ctx.beginPath();
      ctx.moveTo(lx, ty + 8);
      ctx.lineTo(lx, sy - 8);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.fillStyle = '#0d9488';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DMD 分布对齐', laneX + laneW / 2, (ty + sy) / 2 + 3);

    if (studentP >= 1) {
      const stampX = laneX + laneW + 24 + thumbSize / 2;
      const stampY = sy + thumbSize / 2 + 4;
      ctx.globalAlpha = Math.min(1, (loop - 0.5) * 4);
      ctx.fillStyle = '#0d9488';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText('GAN 判别器 保真', stampX, stampY);
      ctx.globalAlpha = 1;
    }
  });

  return <canvas ref={ref} className="s6-canvas" role="img" aria-label="28 步蒸馏采样：教师与学生去噪竞赛动画" />;
}

const TERMS = [
  {
    id: 'fast',
    label: 'L',
    sub: 'fast',
    meaning: '快速版蒸馏的总损失，把三项加权组合在一起，让 28 步学生兼顾轨迹一致与视觉保真。',
    color: '#1f2937',
  },
  {
    id: 'dmd',
    label: 'L',
    sub: 'DMD',
    meaning: '分布匹配蒸馏：核心项，让学生预测的采样轨迹分布对齐教师完整版的分布。',
    color: '#6366f1',
  },
  {
    id: 'diff',
    label: 'L',
    sub: 'diff',
    meaning: '标准扩散损失：作为辅助监督，提升蒸馏训练的稳定性，抑制优化震荡。',
    color: '#b45309',
  },
  {
    id: 'adv',
    label: 'L',
    sub: 'adv',
    meaning: '对抗损失：学生作为生成器，教师特征引导判别器，保住感知保真度与图像锐度。',
    color: '#0d9488',
  },
];

function FormulaToken({
  term,
  active,
  onClick,
}: {
  term: (typeof TERMS)[number];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? 's6-formula-token is-active' : 's6-formula-token'}
      style={{ color: term.color }}
      aria-pressed={active}
    >
      {term.label}
      {term.sub ? <sub>{term.sub}</sub> : null}
    </button>
  );
}

export function S6LossFormula() {
  const [active, setActive] = useState('dmd');
  const current = TERMS.find((term) => term.id === active) ?? TERMS[1];

  return (
    <div className="s6-loss-formula">
      <p>点击符号查看含义</p>
      <div className="s6-formula-line">
        <FormulaToken term={TERMS[0]} active={active === 'fast'} onClick={() => setActive('fast')} />
        <span>=</span>
        <FormulaToken term={TERMS[1]} active={active === 'dmd'} onClick={() => setActive('dmd')} />
        <span>+</span>
        <span className="s6-lambda">λ</span>
        <FormulaToken term={TERMS[2]} active={active === 'diff'} onClick={() => setActive('diff')} />
        <span>+</span>
        <span className="s6-lambda teal">λ</span>
        <FormulaToken term={TERMS[3]} active={active === 'adv'} onClick={() => setActive('adv')} />
      </div>
      <div className="s6-formula-meaning" style={{ borderColor: current.color }}>
        <strong style={{ color: current.color }}>
          {current.label}
          {current.sub ? <sub>{current.sub}</sub> : null}
        </strong>
        <span>{current.meaning}</span>
      </div>
    </div>
  );
}

export function S6CanvasFrame({ children }: { children: ReactNode }) {
  return <div className="s6-canvas-frame">{children}</div>;
}
