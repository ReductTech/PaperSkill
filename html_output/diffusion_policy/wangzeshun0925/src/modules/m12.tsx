import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  clearScene,
  drawSceneLabel,
  drawLegend,
  WOOD,
  GUIDE,
  OK,
  BAD,
  EMPH,
  MUTED,
  LINE,
} from './woodKit';
import type { WidgetProps } from './registry';

// 模块 1.2 三种策略表示：同一个双峰动作分布上，三种表示各自采样出什么。
const W = 1080;
const H = 280;

const PLOT_X0 = 48;
const PLOT_X1 = 1032;
const BASE_Y = 206;
const BINS = 48;
const PX_PER_SAMPLE = 7;
const MAX_BAR = 148;

const PEAK_L = 0.22;
const PEAK_R = 0.78;
const SIGMA = 0.055;

type Mode = 'explicit' | 'implicit' | 'diffusion';

const MODES: { id: Mode; label: string; color: string }[] = [
  { id: 'explicit', label: '显式策略', color: BAD },
  { id: 'implicit', label: '隐式策略', color: EMPH },
  { id: 'diffusion', label: '扩散策略', color: OK },
];

const SAMPLE_FEEDBACK: Record<Mode, { text: string; cls: string }> = {
  explicit: { text: '20 次采样全部落在中间——训练时它就是被平均出来的。', cls: 'bad' },
  implicit: { text: '样本覆盖了两个峰，但也漏到中间，而且分布随训练波动。', cls: '' },
  diffusion: { text: '样本只在两个峰上出现，且每次 rollout 只会选一边。', cls: 'good' },
};

const INITIAL_FEEDBACK = {
  text: '先选一种策略表示，再点「采样 20 次」，看它会采出什么动作。',
  cls: '',
};

function colorOf(mode: Mode): string {
  const hit = MODES.filter((m) => m.id === mode)[0];
  return hit ? hit.color : GUIDE;
}

function gauss(v: number, mu: number, sigma: number): number {
  const d = v - mu;
  return Math.exp(-(d * d) / (2 * sigma * sigma));
}

/** 三种表示各自的采样行为：显式堆在中点，隐式宽但漏中间，扩散只在两个峰上。 */
function sampleOne(mode: Mode): number {
  const r = Math.random();
  if (mode === 'explicit') return clamp(0.5 + (r - 0.5) * 0.025, 0.02, 0.98);
  if (mode === 'diffusion') {
    const peak = Math.random() < 0.5 ? PEAK_L : PEAK_R;
    return clamp(peak + (r - 0.5) * 0.1, 0.02, 0.98);
  }
  if (r < 0.42) return clamp(PEAK_L + (Math.random() - 0.5) * 0.13, 0.02, 0.98);
  if (r < 0.84) return clamp(PEAK_R + (Math.random() - 0.5) * 0.13, 0.02, 0.98);
  return clamp(0.5 + (Math.random() - 0.5) * 0.18, 0.02, 0.98);
}

function freshBatch(mode: Mode, n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(sampleOne(mode));
  return out;
}

export const M12: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<{ mode: Mode; samples: number[] }>({ mode: 'explicit', samples: [] });
  const [mode, setMode] = useState<Mode>('explicit');
  const [samples, setSamples] = useState<number[]>([]);
  const [feedback, setFeedback] = useState(INITIAL_FEEDBACK);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { mode: Mode; samples: number[] }) => {
      const bw = (PLOT_X1 - PLOT_X0) / BINS;

      clearScene(ctx, W, H);

      // 坐标轴
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(PLOT_X0, BASE_Y);
      ctx.lineTo(PLOT_X1, BASE_Y);
      ctx.stroke();

      // 真实双峰参考曲线（背景）
      ctx.beginPath();
      ctx.moveTo(PLOT_X0, BASE_Y);
      for (let i = 0; i < BINS; i++) {
        const v = (i + 0.5) / BINS;
        const d = 0.5 * gauss(v, PEAK_L, SIGMA) + 0.5 * gauss(v, PEAK_R, SIGMA);
        const h = Math.min(124, d * 220);
        ctx.lineTo(PLOT_X0 + i * bw, BASE_Y - h);
        ctx.lineTo(PLOT_X0 + (i + 1) * bw, BASE_Y - h);
      }
      ctx.lineTo(PLOT_X1, BASE_Y);
      ctx.closePath();
      ctx.fillStyle = WOOD;
      ctx.fill();

      // 采样直方图
      const counts: number[] = [];
      for (let i = 0; i < BINS; i++) counts.push(0);
      for (let i = 0; i < s.samples.length; i++) {
        const b = clamp(Math.floor(s.samples[i] * BINS), 0, BINS - 1);
        counts[b] = counts[b] + 1;
      }
      ctx.fillStyle = colorOf(s.mode);
      for (let i = 0; i < BINS; i++) {
        const h = Math.min(MAX_BAR, counts[i] * PX_PER_SAMPLE);
        if (h <= 0) continue;
        ctx.fillRect(PLOT_X0 + i * bw + 2, BASE_Y - h, bw - 4, h);
      }

      // 动作轴两端的刻度
      ctx.fillStyle = MUTED;
      ctx.font = '13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('0', PLOT_X0 + 2, BASE_Y + 18);
      ctx.fillText('1', PLOT_X1 - 10, BASE_Y + 18);

      // 至多 1 个标签 + 图例
      drawSceneLabel(ctx, '采样分布', 48, 34);
      drawLegend(
        ctx,
        [
          { color: WOOD, text: '真实分布' },
          { color: colorOf(s.mode), text: '采样动作' },
        ],
        838,
        38
      );
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  /** 切换表示：立即清空样本并按该表示重新采 20 个 */
  const pick = (m: Mode) => {
    const batch = freshBatch(m, 20);
    stateRef.current.mode = m;
    stateRef.current.samples = batch;
    setMode(m);
    setSamples(batch);
    setFeedback(SAMPLE_FEEDBACK[m]);
  };

  const addSamples = () => {
    const cur = stateRef.current.samples;
    if (cur.length >= 200) return;
    const next = cur.concat(freshBatch(stateRef.current.mode, 20)).slice(0, 200);
    stateRef.current.samples = next;
    setSamples(next);
    setFeedback(SAMPLE_FEEDBACK[stateRef.current.mode]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={'chip' + (mode === m.id ? ' selected' : '')}
            onClick={() => pick(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="chip-row">
        <button className="chip" onClick={addSamples}>
          采样 20 次
        </button>
        <span className="val">{samples.length}</span>
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default M12;
