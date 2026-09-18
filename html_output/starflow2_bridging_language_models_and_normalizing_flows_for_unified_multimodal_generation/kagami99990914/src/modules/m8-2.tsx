import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

/* ------------------------------------------------------------------ */
/* Paper-specific drawing kit — duplicated locally in every widget.    */
/* ------------------------------------------------------------------ */

const C = {
  bg: '#f5f8f0',
  bench: '#d7deea',
  warp: '#b8c9a7',
  warpDeep: '#76906a',
  loom: '#92400e',
  weave: '#27446e',
  cross: '#7c3aed',
  shuttle: '#f07e47',
  done: '#228d5c',
  bad: '#c43f52',
  ink: '#21324a',
  muted: '#68778f',
  axis: '#d7deea',
  inset: '#ffffff',
};

function warpXs(w: number): number[] {
  const count = Math.max(6, Math.round((w - 120) / 24));
  const xs: number[] = [];
  for (let i = 0; i <= count; i += 1) xs.push(60 + ((w - 120) / count) * i);
  return xs;
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C.bench;
  ctx.fillRect(0, h - 26, w, 8);
  ctx.strokeStyle = C.warp;
  ctx.lineWidth = 2;
  warpXs(w).forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x, h - 30);
    ctx.stroke();
  });
}

function drawSetting(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  warpCount: number,
  warpState?: Record<number, 'dim' | 'active'>
) {
  ctx.strokeStyle = C.loom;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(20, 12);
  ctx.lineTo(w - 20, 12);
  ctx.moveTo(20, h - 32);
  ctx.lineTo(w - 20, h - 32);
  ctx.moveTo(26, 12);
  ctx.lineTo(26, h - 32);
  ctx.moveTo(w - 26, 12);
  ctx.lineTo(w - 26, h - 32);
  ctx.stroke();

  const xs = warpXs(w).slice(0, Math.max(1, warpCount));
  xs.forEach((x, i) => {
    const st = warpState ? warpState[i] : undefined;
    ctx.strokeStyle = st === 'active' ? C.cross : st === 'dim' ? '#e4ead9' : C.warp;
    ctx.lineWidth = st === 'active' ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x, h - 30);
    ctx.stroke();
  });
}

function drawSubject(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  stateColor: string
) {
  const w = 34 * scale;
  const h = 14 * scale;
  const left = x - w / 2;
  const top = y - h / 2;
  const r = h / 2;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(left + r, top);
  ctx.lineTo(left + w - r, top);
  ctx.quadraticCurveTo(left + w, top, left + w, top + r);
  ctx.quadraticCurveTo(left + w, top + h, left + w - r, top + h);
  ctx.lineTo(left + r, top + h);
  ctx.quadraticCurveTo(left, top + h, left, top + r);
  ctx.quadraticCurveTo(left, top, left + r, top);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(left - 24 * scale, y);
  ctx.stroke();
}

function drawPathOrSupport(
  ctx: CanvasRenderingContext2D,
  points: Array<[number, number]>,
  stateColor: string,
  width: number
) {
  if (points.length < 2) return;
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.stroke();
}

function drawTarget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  mode: 'row' | 'selvedge' | 'density'
) {
  if (mode === 'selvedge') {
    ctx.fillStyle = C.done;
    ctx.fillRect(x, y - 9, w, 18);
    return;
  }
  ctx.save();
  ctx.strokeStyle = C.done;
  ctx.lineWidth = 2;
  if (mode === 'row') ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  ctx.restore();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  variant: 'primary' | 'muted' | 'inverse'
) {
  ctx.fillStyle = variant === 'muted' ? C.muted : variant === 'inverse' ? '#ffffff' : C.ink;
  ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  items: Array<{ label: string; color: string }>
) {
  ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  let cx = x;
  items.slice(0, 3).forEach((it) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 8, 10, 10);
    ctx.fillStyle = C.muted;
    ctx.fillText(it.label, cx + 14, y);
    cx += 14 + ctx.measureText(it.label).width + 18;
  });
}

function drawThread(
  ctx: CanvasRenderingContext2D,
  from: [number, number],
  to: [number, number],
  color: string,
  width: number,
  dashed: boolean
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.stroke();
  ctx.restore();
}

function drawInsetFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string
) {
  ctx.fillStyle = C.inset;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  if (title) {
    ctx.fillStyle = C.muted;
    ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, x + 10, y + 16);
  }
}

/* ------------------------------------------------------------------ */
/* m8-2 · 三张架构的权衡 — 1080×280                                    */
/* 切换四种架构变体：左侧缩略视图换形态，右侧四根定性权衡条换长度颜色。 */
/* ------------------------------------------------------------------ */

const W = 1080;
const H = 280;

type Variant = 'pretzel' | 'motFrozen' | 'motTuned' | 'diffusion';
type Level = 'high' | 'mid' | 'low' | 'none' | 'two';

const VARIANTS: Array<{ id: Variant; label: string }> = [
  { id: 'pretzel', label: '本文 Pretzel' },
  { id: 'motFrozen', label: 'MoT 冻结 VLM' },
  { id: 'motTuned', label: 'MoT 联合微调' },
  { id: 'diffusion', label: '扩散混合' },
];

// 四根条顺序：保真度 / 理解保持 / 结构统一 / 需重编码
const LEVELS: Record<Variant, [Level, Level, Level, Level]> = {
  pretzel: ['high', 'high', 'high', 'none'],
  motFrozen: ['low', 'high', 'mid', 'none'],
  motTuned: ['mid', 'low', 'mid', 'none'],
  diffusion: ['high', 'high', 'low', 'two'],
};

const LEVEL_LEN: Record<Level, number> = {
  high: 1,
  mid: 0.6,
  low: 0.25,
  none: 0.05,
  two: 1,
};

const LEVEL_TEXT: Record<Level, string> = {
  high: '高',
  mid: '中',
  low: '低',
  none: '无',
  two: '需两次以上',
};

const ROW_NAMES = ['保真度', '理解保持', '结构统一', '需重编码'];

const rowColor = (i: number, level: Level): string => {
  if (i === 0 || i === 1) return C.weave;
  if (i === 2) return C.cross;
  if (level === 'none') return C.done;
  if (level === 'low') return C.shuttle;
  return C.bad;
};

const FEEDBACK: Record<Variant, { text: string; cls: string }> = {
  pretzel: {
    text: '冻结的 VLM 提供语义、可训练的流负责生成，两条流共享同一因果机制，也不需要重编码。',
    cls: 'good',
  },
  motFrozen: {
    text: '论文的 MoT 对照实验里，冻结 VLM 只训流分支会导致生成质量不足。',
    cls: 'bad',
  },
  motTuned: {
    text: '联合微调 VLM 会让理解退化（论文只给出 MME 掉到约 800 的近似观察）。',
    cls: 'bad',
  },
  diffusion: {
    text: '扩散混合下图像无法直接进入 KV 缓存，交错生成需要重新编码。',
    cls: 'bad',
  },
};

export const M82: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<Variant>('pretzel');
  const rafRef = useRef<number | null>(null);
  const [variant, setVariant] = useState<Variant>('pretzel');
  const [feedback, setFeedback] = useState(FEEDBACK.pretzel);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const drawMini = (v: Variant) => {
      ctx.strokeStyle = C.loom;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(20.5, 46.5, 459, 187);

      if (v === 'pretzel') {
        drawThread(ctx, [50, 110], [450, 110], '#b8c9a7', 5, false);
        drawThread(ctx, [50, 170], [450, 170], C.weave, 5, false);
        [120, 220, 320, 420].forEach((cx) => {
          drawThread(ctx, [cx - 14, 110], [cx + 14, 170], C.cross, 2, false);
          drawThread(ctx, [cx + 14, 110], [cx - 14, 170], C.cross, 2, false);
        });
      } else if (v === 'motFrozen') {
        drawThread(ctx, [50, 130], [240, 130], '#b8c9a7', 6, false);
        drawThread(ctx, [260, 176], [450, 176], C.axis, 6, false);
      } else if (v === 'motTuned') {
        drawThread(ctx, [50, 130], [138, 130], '#b8c9a7', 6, false);
        drawThread(ctx, [156, 130], [240, 130], '#b8c9a7', 6, false);
        drawThread(ctx, [138, 130], [156, 130], C.bad, 6, false);
        ctx.strokeStyle = C.bad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(140, 120);
        ctx.lineTo(158, 140);
        ctx.moveTo(158, 120);
        ctx.lineTo(140, 140);
        ctx.stroke();
        drawThread(ctx, [260, 176], [450, 176], C.weave, 6, false);
      } else {
        drawThread(ctx, [50, 140], [450, 140], C.weave, 5, false);
        [180, 280, 380].forEach((cx) => {
          ctx.save();
          ctx.strokeStyle = C.bad;
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 5]);
          ctx.beginPath();
          ctx.moveTo(cx + 60, 140);
          ctx.quadraticCurveTo(cx, 104, cx - 60, 140);
          ctx.stroke();
          ctx.restore();
        });
      }
    };

    const draw = () => {
      const v = stateRef.current;
      const levels = LEVELS[v];

      ctx.clearRect(0, 0, W, H);
      clearScene(ctx, W, H);
      drawSetting(ctx, W, H, warpXs(W).length);

      // 左：架构缩略视图
      drawMini(v);

      // 右：四根定性权衡条
      const rows = [78, 128, 178, 228];
      const bx0 = 560;
      const bx1 = 1020;
      for (let i = 0; i < 4; i += 1) {
        ctx.fillStyle = C.axis;
        ctx.fillRect(bx0, rows[i] - 8, bx1 - bx0, 16);
        ctx.fillStyle = rowColor(i, levels[i]);
        ctx.fillRect(bx0, rows[i] - 8, (bx1 - bx0) * LEVEL_LEN[levels[i]], 16);
      }

      drawSceneLabel(ctx, 30, 36, '缩略视图', 'muted');
      drawSceneLabel(ctx, 530, 36, '四维权衡', 'muted');
      drawLegend(ctx, 540, 272, [
        { label: '保真', color: C.weave },
        { label: '理解', color: C.weave },
        { label: '统一', color: C.cross },
      ]);
    };

    const tick = () => {
      draw();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const choose = (v: Variant) => {
    stateRef.current = v;
    setVariant(v);
    setFeedback(FEEDBACK[v]);
  };

  const levels = LEVELS[variant];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {VARIANTS.map((v) => {
          const on = variant === v.id;
          return (
            <button
              key={v.id}
              type="button"
              className={`chip${on ? ' selected' : ''}`}
              aria-pressed={on}
              onClick={() => choose(v.id)}
            >
              {v.label}
            </button>
          );
        })}
        {ROW_NAMES.map((name, i) => (
          <span
            key={name}
            className="val"
            style={{ minWidth: 0, color: rowColor(i, levels[i]) }}
          >
            {name} {LEVEL_TEXT[levels[i]]}
          </span>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M82;
