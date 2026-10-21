import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawWaveform,
  drawLegend,
  drawSceneLabel,
  drawCheckMark,
  drawCrossMark,
} from './packKit';
import type { WidgetProps } from './registry';

// Ch2 module (E03): three views of the marginal-information collapse.
// 差值分布 — overlaid histograms of adjacent-token differences at 5Hz vs 50Hz
// (wide vs squeezed-at-zero); 作弊解 — "copy previous" loss meets true-learning
// loss at high frequency; 现实病例 — OpenVLA fits low-freq BridgeV2/RT-1 but
// fails to fit high-freq DROID.
const W = 1080;
const H = 280;

type View = 'diff' | 'cheat' | 'case';

const VIEWS: { id: View; label: string }[] = [
  { id: 'diff', label: '差值分布' },
  { id: 'cheat', label: '作弊解' },
  { id: 'case', label: '现实病例' },
];

const FEEDBACK: Record<View, { text: string; cls: string }> = {
  diff: {
    text: '50Hz 的相邻差值挤向 0——每个 token 几乎不带新信息，学习信号被冗余稀释。',
    cls: '',
  },
  cheat: {
    text: '高频下『照搬上一件』与真学习损失相当——模型没有理由学真本事。',
    cls: 'bad',
  },
  case: {
    text: 'OpenVLA 适配低频 BridgeV2/RT-1 成功，却在高频 DROID 上拟合失败——病根就是边际信息塌缩。',
    cls: 'bad',
  },
};

// ---- deterministic data (no Math.random: identical every render) ----

// pseudo-random triangular samples in [-2, 2] (sum of two uniforms)
function triSeq(n: number, seed: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const u1 = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
    const u2 = Math.sin(i * 39.346 + seed * 11.135) * 24634.6345;
    out.push((u1 - Math.floor(u1)) * 2 - 1 + ((u2 - Math.floor(u2)) * 2 - 1));
  }
  return out;
}

const BINS = 26;
const XMAX = 0.75;
function hist(sigma: number, seed: number): number[] {
  const counts = new Array<number>(BINS).fill(0);
  triSeq(240, seed).forEach((v) => {
    const b = Math.min(BINS - 1, Math.floor((Math.abs(v * sigma) / XMAX) * BINS));
    counts[b] += 1;
  });
  const mx = Math.max(...counts);
  return counts.map((c) => c / mx);
}
const H5 = hist(0.3, 5); // 5Hz: differences spread wide
const H50 = hist(0.03, 50); // 50Hz: differences squeezed at zero

// loss curves over training progress x∈[0,1]; both land on the same floor
const CHEAT_LOSS: number[] = []; // 照搬上一件 (red)
const LEARN_LOSS: number[] = []; // 真学习 (blue)
for (let i = 0; i <= 100; i++) {
  const x = i / 100;
  CHEAT_LOSS.push(0.1 + 0.035 * Math.pow(1 - x, 3));
  LEARN_LOSS.push(0.105 + 0.895 * Math.pow(1 - x, 2.2));
}
const toWave = (loss: number[]): number[] => loss.map((l) => 2 * l - 1);

interface MargState {
  view: View;
}

export const Ch2Marginal: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<MargState>({ view: 'diff' });
  const [view, setView] = useState<View>('diff');
  const [feedback, setFeedback] = useState(FEEDBACK.diff);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const drawDiff = () => {
      const x0 = 70;
      const bw = 960 / BINS;
      const base = 236;
      // axes
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x0, base);
      ctx.lineTo(x0 + 960, base);
      ctx.stroke();
      // 5Hz histogram (blue, wide)
      ctx.fillStyle = 'rgba(39,68,110,0.5)';
      H5.forEach((v, b) => {
        const bh = v * 190;
        ctx.fillRect(x0 + b * bw + 1, base - bh, bw - 2, bh);
      });
      // 50Hz histogram (red, spike at zero) drawn on top
      ctx.fillStyle = 'rgba(196,63,82,0.85)';
      H50.forEach((v, b) => {
        const bh = v * 190;
        ctx.fillRect(x0 + b * bw + 1, base - bh, bw - 2, bh);
      });
      drawSceneLabel(ctx, '50Hz', 150, 56, { color: C.red });
      drawSceneLabel(ctx, '5Hz', 620, 56, { color: C.blue });
    };

    const drawCheat = () => {
      // axes: x = training progress, y = loss (top = high)
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(70, 30);
      ctx.lineTo(70, 236);
      ctx.lineTo(1030, 236);
      ctx.stroke();
      // loss curves: drawWaveform maps value v to y + h/2 - v*h/2
      drawWaveform(ctx, 80, 40, 930, 190, toWave(LEARN_LOSS), C.blue);
      drawWaveform(ctx, 80, 40, 930, 190, toWave(CHEAT_LOSS), C.red);
      // convergence highlight at the right end (both ≈ 0.1 loss)
      const py = 40 + 95 - (2 * 0.102 - 1) * 95;
      ctx.save();
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(1010, py, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      drawSceneLabel(ctx, '高频下重合', 852, py - 30, { color: C.text });
      drawLegend(
        ctx,
        [
          ['真学习', C.blue],
          ['照搬上一件', C.red],
        ],
        90,
        262
      );
    };

    const drawCase = () => {
      // patient card: OpenVLA
      const cx = 300;
      const cy = 26;
      const cw = 480;
      const chh = 220;
      ctx.save();
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cx, cy, cw, chh, 8);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      drawSceneLabel(ctx, 'OpenVLA', cx + cw / 2, cy + 24, {
        color: C.text,
        align: 'center',
      });
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      [70, 120, 170].forEach((dy) => {
        ctx.beginPath();
        ctx.moveTo(cx + 20, cy + dy);
        ctx.lineTo(cx + cw - 20, cy + dy);
        ctx.stroke();
      });
      const rows: { name: string; note: string; ok: boolean }[] = [
        { name: 'BridgeV2 · 5Hz', note: '低频数据 · 适配成功', ok: true },
        { name: 'RT-1', note: '低频数据 · 适配成功', ok: true },
        { name: 'DROID · 15Hz', note: '高频数据 · 拟合失败', ok: false },
      ];
      rows.forEach((row, i) => {
        const ry = cy + 96 + i * 50;
        ctx.font = '15px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = row.ok ? C.text : C.red;
        ctx.fillText(row.name, cx + 28, ry);
        ctx.font = '12px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillStyle = row.ok ? C.muted : C.red;
        ctx.fillText(row.note, cx + 28, ry + 20);
        if (row.ok) drawCheckMark(ctx, cx + cw - 40, ry);
        else drawCrossMark(ctx, cx + cw - 40, ry);
      });
    };

    const render = (s: MargState) => {
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });
      if (s.view === 'diff') drawDiff();
      else if (s.view === 'cheat') drawCheat();
      else drawCase();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(() => render(stateRef.current));
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(() => render(stateRef.current));
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (v: View) => {
    stateRef.current.view = v;
    setView(v);
    setFeedback(FEEDBACK[v]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              className={view === v.id ? 'chip selected' : 'chip'}
              onClick={() => pick(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Marginal;
