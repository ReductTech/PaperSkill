import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Chapter 9 module 9.1 — 三种部署模式的账 (P4 mode chips).
// Four bar groups (延迟 / 恢复显存 / R-Bench / 幻觉有害率); every group keeps showing all
// three modes, the selected mode is outlined in orange and the highlight moves with a
// 300 ms transition. Bare numbers only, one legend of three entries.

const W = 1080;
const H = 280;

type Mode = 'standard' | 'detect' | 'always';

interface ModeDef {
  id: Mode;
  label: string;
  short: string;
  color: string;
}

const MODES: ModeDef[] = [
  { id: 'standard', label: '标准模型', short: '标准', color: '#68778f' },
  { id: 'detect', label: '检测后恢复', short: '检测后', color: '#27446e' },
  { id: 'always', label: '常开恢复', short: '常开', color: '#228d5c' },
];

interface GroupDef {
  title: string;
  min: number;
  max: number;
  /** per MODES order: 标准 / 检测后 / 常开 */
  values: number[];
  digits: number;
  /** true = 低为优（代价类，红）, false = 高为优（得分类，绿） */
  lowerBetter: boolean;
}

// Table 9 / Table 17 values (延迟 s, 恢复显存 GB, R-Bench 总分, 幻觉有害率 %).
const GROUPS: GroupDef[] = [
  { title: '延迟', min: 0, max: 60, values: [1.8, 24.6, 55.0], digits: 1, lowerBetter: true },
  { title: '恢复显存', min: 0, max: 35, values: [0, 28, 33], digits: 0, lowerBetter: true },
  { title: 'R-Bench', min: 0.5, max: 0.8, values: [0.6204, 0.7082, 0.7398], digits: 4, lowerBetter: false },
  { title: '幻觉有害率', min: 0, max: 16, values: [15.6, 7.2, 4.1], digits: 1, lowerBetter: true },
];

const FEEDBACK: Record<Mode, { text: string; cls: string }> = {
  standard: { text: '标准模型：最快（1.8 s）但最脆弱（0.6204）', cls: 'bad' },
  detect: { text: '检测后恢复：24.6 s 拿回大部分鲁棒性（0.7082），延迟预算紧时的折中', cls: '' },
  always: { text: '常开恢复：鲁棒性最强（0.7398），且对干净输入无害（+0.0044）', cls: 'good' },
};

const PANEL_X0 = 30;
const PANEL_W = 240;
const PANEL_GAP = 20;
const PANEL_Y = 44;
const PANEL_H = 200;
const BAR_OFF_X = 12;
const BAR_MAX = 140;
const BAR_H = 26;
const BAR_OFF_Y = [44, 86, 128];
const HL_MS = 300;

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, h - 26, w, 26);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, h - 23);
  ctx.lineTo(w, h - 23);
  ctx.stroke();
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: Array<[string, string]>,
  x: number,
  y: number
): void {
  ctx.save();
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.textBaseline = 'middle';
  let cx = x;
  items.slice(0, 3).forEach((item) => {
    ctx.fillStyle = item[0];
    ctx.fillRect(cx, y - 6, 12, 12);
    ctx.fillStyle = '#68778f';
    ctx.fillText(item[1], cx + 18, y);
    cx += 18 + ctx.measureText(item[1]).width + 22;
  });
  ctx.restore();
}

/** Linear approach so the highlight lands exactly 300 ms after the chip click. */
function moveToward(from: number, to: number, maxStep: number): number {
  const d = to - from;
  if (Math.abs(d) <= maxStep) return to;
  return from + Math.sign(d) * maxStep;
}

export const Ch9Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef<Mode>('always');
  const hlRef = useRef<Record<Mode, number>>({ standard: 0, detect: 0, always: 1 });
  const [mode, setMode] = useState<Mode>('always');
  const [feedback, setFeedback] = useState(FEEDBACK.always);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    let last = -1;
    let raf: number | null = null;

    const render = () => {
      ctx.clearRect(0, 0, W, H);
      clearScene(ctx, W, H);
      drawLegend(
        ctx,
        MODES.map((m): [string, string] => [m.color, m.short]),
        PANEL_X0,
        24
      );

      GROUPS.forEach((g, gi) => {
        const px = PANEL_X0 + gi * (PANEL_W + PANEL_GAP);

        roundRectPath(ctx, px, PANEL_Y, PANEL_W, PANEL_H, 10);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#d7deea';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Direction cue: 低为优 = red (cost), 高为优 = green (score).
        roundRectPath(ctx, px + BAR_OFF_X, PANEL_Y + 32, PANEL_W - BAR_OFF_X * 2, 4, 2);
        ctx.fillStyle = g.lowerBetter ? '#c43f52' : '#228d5c';
        ctx.fill();

        MODES.forEach((m, mi) => {
          const value = g.values[mi];
          const norm = clamp((value - g.min) / (g.max - g.min), 0, 1);
          const bx = px + BAR_OFF_X;
          const by = PANEL_Y + BAR_OFF_Y[mi];
          const bw = Math.max(2, norm * BAR_MAX);
          const hl = hlRef.current[m.id];

          roundRectPath(ctx, bx, by, BAR_MAX, BAR_H, 6);
          ctx.fillStyle = '#eef2e9';
          ctx.fill();

          roundRectPath(ctx, bx, by, bw, BAR_H, 6);
          ctx.fillStyle = m.color;
          ctx.fill();

          if (hl > 0.02) {
            roundRectPath(ctx, bx - 3, by - 3, bw + 6, BAR_H + 6, 9);
            ctx.strokeStyle = '#f07e47';
            ctx.globalAlpha = hl;
            ctx.lineWidth = 2 + hl;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }

          ctx.font = '13px "Segoe UI", sans-serif';
          ctx.fillStyle = hl > 0.5 ? '#21324a' : '#68778f';
          ctx.fillText(value.toFixed(g.digits), bx + bw + 8, by + BAR_H / 2 + 5);
        });
      });
    };

    const tick = (now: number) => {
      if (last < 0) last = now;
      const dt = Math.min(now - last, 64);
      last = now;
      const step = dt / HL_MS;
      MODES.forEach((m) => {
        hlRef.current[m.id] = moveToward(hlRef.current[m.id], m.id === modeRef.current ? 1 : 0, step);
      });
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
      last = -1;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const selectMode = (next: Mode) => {
    modeRef.current = next;
    setMode(next);
    setFeedback(FEEDBACK[next]);
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 20,
          padding: '2px 0 4px',
          fontSize: 12,
          color: '#68778f',
          flexWrap: 'wrap',
        }}
        aria-hidden="true"
      >
        <span style={{ width: 240 }}>延迟 ↓</span>
        <span style={{ width: 240 }}>恢复显存 ↓</span>
        <span style={{ width: 240 }}>R-Bench ↑</span>
        <span style={{ width: 240 }}>幻觉有害率 ↓</span>
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`chip${mode === m.id ? ' selected' : ''}`}
            aria-pressed={mode === m.id}
            onClick={() => selectMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Mod1;
