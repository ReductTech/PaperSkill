import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  SKIN,
  clearScene,
  drawLabel,
  drawMicroscope,
  drawMiniBars,
  drawTissueField,
} from './viz-kit';

// Module 10.1 — DDxBench 结果竞赛 (verified result race, pattern P8).
// Two recognisable microscopes stand side by side and their fields of view
// advance with the race: both start at 1.25×, move to 5× and end at 20×. The
// left instrument (SlideSeek, multi-magnification navigation) finds the
// endothelium-lined vessel that carries tumour cells and its field turns green;
// the right instrument (PathChat+, fixed expert ROIs) reaches the same 20× view
// but never flags it. The four bars grow from a shared baseline 0 to their real
// values in ~1.6 s and then hold — bar length is strictly proportional to the
// value (max = 1), so the gap is never exaggerated. Category names, the protocol
// note and the exact values live in the DOM table below the canvas, which is
// visible before the race starts.
// ---------------------------------------------------------------------------

const W = 1080;
const H = 280;
const RACE_SECONDS = 1.6;
const PULSE_SECONDS = 2;

type Metric = 'top1' | 'top3';
type FeedbackCls = '' | 'good' | 'bad';
type Stage = 0 | 1 | 2;

interface Row {
  name: string;
  top1: number;
  top3: number;
  color: string;
}

const ROWS: Row[] = [
  { name: 'SlideSeek', top1: 0.86, top3: 0.927, color: SKIN.green },
  { name: 'PathChat+ 仅专家 ROI', top1: 0.8, top3: 0.92, color: SKIN.blue },
  { name: 'PathChat 1', top1: 0.64, top3: 0.807, color: SKIN.purple },
  { name: '通用 captioner', top1: 0.427, top3: 0.627, color: SKIN.red },
];

const BEFORE = '同一基准、同一协议：先看表，再按开始。';

const DONE: Record<Metric, string> = {
  top1: 'top-1：SlideSeek 0.860 高于仅用专家 ROI 的 PathChat+ 0.800（低 6.0%，p=0.059），也远高于换掉 captioner 的 0.640 与 0.427。',
  top3: 'top-3：SlideSeek 0.927，PathChat+ 仅专家 ROI 0.920，PathChat 1 0.807，通用 captioner 0.627。',
};

const PROTOCOL_NOTE =
  'top-1 / top-3 均为越高越好；SlideSeek 与「仅专家 ROI」的协议不同（导航 + 多倍率 vs 固定 10 个 ROI），不可直接互换。';

const DATASET_NOTE =
  'DDxBench 含 150 张 H&E 全切片、19 个组织的 55 个诊断类别（14 种常见、41 种罕见）；该基准仅用于测试，无训练划分。';

interface RaceState {
  t: number;
  metric: Metric;
  running: boolean;
}

function metricValue(row: Row, metric: Metric): number {
  return metric === 'top1' ? row.top1 : row.top3;
}

/**
 * Two instruments: the navigating system and the fixed-ROI baseline. The kit's
 * `drawMicroscope` anchors the base centre at (x, y), so baseY is the foot of
 * the instrument; its field of view sits just above it.
 */
const UNIT: { cx: number; baseY: number; scale: number; fieldCx: number; row: number }[] = [
  { cx: 128, baseY: 240, scale: 0.62, fieldCx: 118, row: 0 },
  { cx: 372, baseY: 240, scale: 0.62, fieldCx: 362, row: 1 },
];

const FIELD_R = 80;
const FIELD_CY = 110;
const BARS = { x: 700, y: 66, w: 344, h: 150 };

const MAG: (1.25 | 5 | 20)[] = [1.25, 5, 20];
const OBJECTIVE: (0 | 1 | 2)[] = [0, 1, 2];

function stageOf(t: number): Stage {
  if (t < 0.34) return 0;
  if (t < 0.68) return 1;
  return 2;
}

/** Each field of view reaches full magnification 0.12 apart, left first. */
function unitStage(t: number, row: number): Stage {
  const shifted = clamp(t - row * 0.12, 0, 1);
  return stageOf(shifted);
}

function fieldPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  pad: number
): void {
  const s = r + pad;
  const corner = r * 0.22;
  ctx.beginPath();
  ctx.moveTo(cx - s + corner, cy - s);
  ctx.arcTo(cx + s, cy - s, cx + s, cy + s, corner);
  ctx.arcTo(cx + s, cy + s, cx - s, cy + s, corner);
  ctx.arcTo(cx - s, cy + s, cx - s, cy - s, corner);
  ctx.arcTo(cx - s, cy - s, cx + s, cy - s, corner);
  ctx.closePath();
}

function renderRace(ctx: CanvasRenderingContext2D, s: RaceState, t: number): void {
  clearScene(ctx, W, H);

  const pulse = (Math.sin(t * Math.PI * 2) + 1) / 2;

  // Two microscopes, drawn from primitives; the selected objective follows the
  // stage of the race so the instrument visibly changes power.
  UNIT.forEach((unit, i) => {
    const stage = unitStage(s.t, i);
    drawMicroscope(ctx, unit.cx, unit.baseY, unit.scale, { objective: OBJECTIVE[stage] });
  });

  // Their fields of view: 1.25× glands → 5× follicles → 20× nuclei. Only the
  // navigating system's 20× field carries the invaded vessel, and its rim turns
  // green when it does.
  UNIT.forEach((unit, i) => {
    const stage = unitStage(s.t, i);
    const found = i === 0 && stage === 2;
    drawTissueField(ctx, unit.fieldCx - FIELD_R, FIELD_CY - FIELD_R, FIELD_R * 2, FIELD_R * 2, {
      seed: 101 + unit.row * 29,
      magnification: MAG[stage],
      lesion: stage === 2 ? 'vessel' : 'none',
    });
    ctx.save();
    if (found) {
      ctx.strokeStyle = SKIN.green;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.9 - pulse * 0.35;
      fieldPath(ctx, unit.fieldCx, FIELD_CY, FIELD_R, 2 + pulse * 4);
    } else {
      ctx.strokeStyle = stage === 2 ? SKIN.muted : SKIN.axis;
      ctx.lineWidth = 2;
      fieldPath(ctx, unit.fieldCx, FIELD_CY, FIELD_R, 4);
    }
    ctx.stroke();
    ctx.restore();
  });

  // Each instrument carries the colour of the row it stands for, and the same
  // colour dots the corresponding mini-bar row: a legend without any text.
  UNIT.forEach((unit, i) => {
    const row = ROWS[unit.row];
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = row.color;
    ctx.fillRect(unit.fieldCx - 34, FIELD_CY + FIELD_R + 14, 68, 5);
    ctx.restore();
  });

  // The exact-value comparison, always proportional to the real numbers.
  const items = ROWS.map((row) => ({ value: metricValue(row, s.metric) * s.t, color: row.color }));
  drawMiniBars(ctx, BARS.x, BARS.y, BARS.w, BARS.h, items, 1);

  ctx.save();
  const slot = BARS.h / ROWS.length;
  UNIT.forEach((unit) => {
    const row = ROWS[unit.row];
    ctx.fillStyle = row.color;
    ctx.beginPath();
    ctx.arc(BARS.x - 2, BARS.y + slot * (unit.row + 0.5), 5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  // At most two in-canvas labels (≤8 Chinese characters).
  drawLabel(ctx, 30, 24, '镜下视野', SKIN.text, 16);
  drawLabel(ctx, BARS.x, 30, s.metric === 'top1' ? 'top-1 对比' : 'top-3 对比', SKIN.text, 16);
}

export const M10ResultRace: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<RaceState>({ t: 0, metric: 'top1', running: false });
  const runStartRef = useRef<number>(0);
  const [metric, setMetric] = useState<Metric>('top1');
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; cls: FeedbackCls }>({
    text: BEFORE,
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    let raf: number | null = null;
    const tick = (): void => {
      const s = stateRef.current;
      if (s.running) {
        const elapsed = (performance.now() - runStartRef.current) / 1000;
        s.t = clamp(elapsed / RACE_SECONDS, 0, 1);
        if (s.t >= 1) {
          s.running = false;
          setRunning(false);
          setFeedback({ text: DONE[s.metric], cls: 'good' });
        }
      }
      renderRace(ctx, s, ((performance.now() / 1000) % PULSE_SECONDS) / PULSE_SECONDS);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = (): void => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };

    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onStart = (): void => {
    if (stateRef.current.running) return;
    stateRef.current.t = 0;
    stateRef.current.running = true;
    runStartRef.current = performance.now();
    setRunning(true);
  };

  const onMetric = (next: Metric): void => {
    if (next === metric) return;
    stateRef.current.metric = next;
    stateRef.current.t = 1;
    stateRef.current.running = false;
    setMetric(next);
    setRunning(false);
    setFeedback({ text: DONE[next], cls: 'good' });
  };

  return (
    <div>
      <div className="chip-row">
        <button
          type="button"
          className={metric === 'top1' ? 'chip selected' : 'chip'}
          aria-pressed={metric === 'top1'}
          onClick={() => onMetric('top1')}
        >
          top-1
        </button>
        <button
          type="button"
          className={metric === 'top3' ? 'chip selected' : 'chip'}
          aria-pressed={metric === 'top3'}
          onClick={() => onMetric('top3')}
        >
          top-3
        </button>
      </div>
      <div className="ctrl">
        <button className="tiny" type="button" onClick={onStart} disabled={running}>
          开始比较
        </button>
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      <p className="note">{PROTOCOL_NOTE}</p>
      <table className="paper">
        <thead>
          <tr>
            <th>方案</th>
            <th>top-1 准确率</th>
            <th>top-3 准确率</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.name}>
              <td>{row.name}</td>
              <td>{metric === 'top1' ? <strong>{row.top1.toFixed(3)}</strong> : row.top1.toFixed(3)}</td>
              <td>{metric === 'top3' ? <strong>{row.top3.toFixed(3)}</strong> : row.top3.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note">{DATASET_NOTE}</p>
    </div>
  );
};

export default M10ResultRace;
