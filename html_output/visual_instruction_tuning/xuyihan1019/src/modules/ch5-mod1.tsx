import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawLabel,
  drawLegend,
  drawTrail,
  useCanvas,
  clamp,
  lerp,
} from '../lib/trailKit';

// 第 5 章模块：两段训练 vs 跳过第一阶段。
// 左：两段进度条（第一阶段只训投影，第二阶段投影 + 语言模型）；右：收敛曲线与准确率终点。

const W = 1080;
const H = 280;
const RUN_MS = 3000;

type Mode = 'two' | 'single';

interface RunState {
  mode: Mode;
  phase: 0 | 1 | 2; // 0 = 未跑，1 = 曲线生长中，2 = 到终点
  t0: number;
}

const ACC: Record<Mode, number> = { two: 90.92, single: 85.81 };

const FB_IDLE = '先跑第一阶段：只训投影，让视觉 token 对上词向量。';
const FB: Record<Mode, { text: string; cls: string }> = {
  two: {
    text: '两阶段：90.92%。第一阶段把视觉 token 对齐到词向量，第二阶段才联合训练。',
    cls: 'good',
  },
  single: {
    text: '跳过第一阶段：85.81%，低 5.11 个点。桥没对准，后面学得再好也补不回来。',
    cls: 'bad',
  },
};

function tint(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function progressOf(s: RunState, time: number): number {
  if (s.phase === 0) return 0;
  if (s.phase === 2) return 1;
  return clamp((time - s.t0) / RUN_MS, 0, 1);
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: number,
  trainable: boolean
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fillStyle = tint(COLORS.bg, 0.9);
  ctx.fill();
  ctx.fillStyle = trainable ? tint(COLORS.aux, 0.2) : tint(COLORS.muted, 0.16);
  ctx.fill();
  ctx.strokeStyle = trainable ? COLORS.aux : COLORS.muted;
  ctx.lineWidth = 2;
  ctx.stroke();
  if (fill > 0) {
    ctx.beginPath();
    ctx.rect(x + 1, y + 1, Math.max(0, (w - 2) * clamp(fill, 0, 1)), h - 2);
    ctx.fillStyle = trainable ? COLORS.aux : COLORS.muted;
    ctx.fill();
  }
  ctx.restore();
}

function drawLockMark(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  color: string
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy - 3, 3.5, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.rect(cx - 5, cy - 3, 10, 8);
  ctx.fill();
  ctx.restore();
}

const draw = (ctx: CanvasRenderingContext2D, time: number, s: RunState): void => {
  const p = progressOf(s, time);
  clearScene(ctx, W, H);

  const row1Y = 76;
  const row2Y = 148;
  const barH1 = 12;
  const barH2 = 26;
  const x0 = 176;
  const projW = 104;
  const gap = 14;
  const llmW = 236;

  drawLabel(ctx, '第一阶段', 52, row1Y + 10, { color: COLORS.ink, size: 14, bold: true });
  drawLabel(ctx, '第二阶段', 52, row2Y + 18, { color: COLORS.ink, size: 14, bold: true });

  const p1 = s.mode === 'two' ? clamp(p * 2, 0, 1) : 0;
  const p2 = s.mode === 'two' ? clamp(p * 2 - 1, 0, 1) : clamp(p, 0, 1);

  if (s.mode === 'single') {
    // 第一阶段被跳过：虚线红框，不填色。
    ctx.save();
    ctx.setLineDash([7, 6]);
    ctx.strokeStyle = COLORS.bad;
    ctx.lineWidth = 2;
    ctx.strokeRect(x0 - 4, row1Y - 6, projW + gap + llmW + 8, barH1 + 12);
    ctx.restore();
  } else {
    drawBlock(ctx, x0, row1Y, projW, barH1, p1, true);
    drawBlock(ctx, x0 + projW + gap, row1Y, llmW, barH1, 0, false);
    drawLockMark(ctx, x0 + projW + gap + llmW - 14, row1Y + barH1 / 2, COLORS.muted);
  }
  drawBlock(ctx, x0, row2Y, projW, barH2, p2, true);
  drawBlock(ctx, x0 + projW + gap, row2Y, llmW, barH2, p2, true);

  // ---- 右侧：收敛曲线与准确率终点 ----
  const cx0 = 620;
  const cx1 = 1010;
  const topY = 62;
  const baseY = 210;
  const hFor = (v: number): number => ((v - 84) / 8) * (baseY - topY);

  ctx.save();
  ctx.strokeStyle = COLORS.axis;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx0, topY);
  ctx.lineTo(cx0, baseY);
  ctx.lineTo(cx1, baseY);
  ctx.stroke();
  ctx.strokeStyle = tint(COLORS.axis, 0.75);
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i += 1) {
    const gy = baseY - ((baseY - topY) * i) / 3;
    ctx.beginPath();
    ctx.moveTo(cx0, gy);
    ctx.lineTo(cx1, gy);
    ctx.stroke();
  }
  ctx.restore();

  const other: Mode = s.mode === 'two' ? 'single' : 'two';
  ctx.save();
  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = COLORS.muted;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx0, baseY - hFor(ACC[other]));
  ctx.lineTo(cx1, baseY - hFor(ACC[other]));
  ctx.stroke();
  ctx.restore();

  const targetH = hFor(ACC[s.mode]);
  const pts: Array<[number, number]> = [];
  const N = 44;
  for (let i = 0; i <= N; i += 1) {
    const f = i / N;
    const shape = (1 - Math.exp(-3.4 * f)) / (1 - Math.exp(-3.4));
    pts.push([lerp(cx0, cx1, f), baseY - targetH * shape * p]);
  }
  if (p > 0.002) drawTrail(ctx, pts, { active: true });

  if (p > 0.02) {
    const endColor = s.mode === 'two' ? COLORS.good : COLORS.bad;
    const endY = baseY - targetH * p;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx1, endY, 6, 0, Math.PI * 2);
    ctx.fillStyle = endColor;
    ctx.fill();
    ctx.strokeStyle = COLORS.bg;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  drawLegend(ctx, 40, 258, [
    { color: COLORS.muted, text: '冻结' },
    { color: COLORS.aux, text: '可训练' },
    { color: COLORS.bad, text: '跳过' },
  ]);
};

export const Ch5Mod1: React.FC<WidgetProps> = () => {
  const stateRef = useRef<RunState>({ mode: 'two', phase: 0, t0: 0 });
  const [mode, setMode] = useState<Mode>('two');
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const [fb, setFb] = useState<{ text: string; cls: string }>({ text: FB_IDLE, cls: '' });
  const timer = useRef<number | null>(null);
  const { ref } = useCanvas<RunState>(draw, W, H, stateRef);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const clearTimer = (): void => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const pick = (next: Mode): void => {
    clearTimer();
    stateRef.current.mode = next;
    stateRef.current.phase = 2;
    stateRef.current.t0 = 0;
    setMode(next);
    setPhase(2);
    setFb(FB[next]);
  };

  const start = (): void => {
    clearTimer();
    const current = stateRef.current.mode;
    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      stateRef.current.phase = 2;
      stateRef.current.t0 = 0;
      setPhase(2);
    } else {
      stateRef.current.phase = 1;
      stateRef.current.t0 = performance.now();
      setPhase(1);
      timer.current = window.setTimeout(() => {
        stateRef.current.phase = 2;
        timer.current = null;
        setPhase(2);
      }, RUN_MS);
    }
    setFb(FB[current]);
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button
          type="button"
          className={`chip ${mode === 'two' ? 'selected' : ''}`}
          aria-pressed={mode === 'two'}
          onClick={() => pick('two')}
        >
          两阶段
        </button>
        <button
          type="button"
          className={`chip ${mode === 'single' ? 'selected' : ''}`}
          aria-pressed={mode === 'single'}
          onClick={() => pick('single')}
        >
          跳过第一阶段
        </button>
        <button type="button" className="tiny" onClick={start}>
          开始
        </button>
        <label>
          准确率 <span className="val">{phase === 0 ? '—' : `${ACC[mode].toFixed(2)}%`}</span>
        </label>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch5Mod1;
