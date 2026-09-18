import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// P8 result race — compare three conditions (baseline / secret hint / secret comm)
// on a chosen metric. Verified values from Table 1 / Table 18 / Figure 5.
const W = 1080;
const H = 280;
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#f07e47';
const TEXT = '#21324a';
const MUTED = '#68778f';

type Metric = 'challenge' | 'eq-bar' | 'eq-pool';

const metrics: Record<Metric, { label: string; values: number[]; max: number; note: string }> = {
  challenge: { label: '挑战率（%）', values: [0.98, 0.5, 0.31], max: 1.0, note: '挑战率从 98% 骤降到 31%——越低表示合谋伤害越大。' },
  'eq-bar': { label: '公平性 E（牌局）', values: [0.74, 0.7, 0.6], max: 1.0, note: '公平性 E：基线最公平（0.74），通信最不平等（0.60）。' },
  'eq-pool': { label: '公平性 E（底池）', values: [0.94, 0.79, 0.67], max: 1.0, note: '公平性 E：0.94 → 0.79 → 0.67，合谋让奖励越来越集中。' },
};

const condLabels = ['基线', '秘密提示', '秘密通信'];
const condColors = [BLUE, ORANGE, RED];

export const ResultRace: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [metric, setMetric] = useState<Metric>('challenge');
  const [running, setRunning] = useState(false);
  const stateRef = useRef({ metric: 'challenge' as Metric, running: false, start: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { metric: Metric; running: boolean; start: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      const m = metrics[s.metric];
      const progress = s.running ? clamp((performance.now() - s.start) / 1200, 0, 1) : 0;
      m.values.forEach((v, i) => {
        const x = W * 0.16 + i * (W * 0.24);
        const bh = (v / m.max) * H * 0.55 * progress;
        ctx.fillStyle = condColors[i];
        ctx.fillRect(x, H * 0.8 - bh, 90, bh);
        ctx.fillStyle = TEXT;
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(condLabels[i], x + 45, H * 0.9);
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillStyle = MUTED;
        ctx.fillText(progress >= 0.999 ? v.toFixed(2) : '', x + 45, H * 0.8 - bh - 8);
        ctx.textAlign = 'left';
      });
      ctx.fillStyle = TEXT;
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText(m.label, W * 0.16, H * 0.14);
    };
    let rafId = 0;
    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafId = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };
    const start = () => {
      if (!rafId) rafId = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const startRace = () => {
    stateRef.current.running = true;
    stateRef.current.start = performance.now();
    setRunning(true);
  };

  const selectMetric = (m: Metric) => {
    setMetric(m);
    stateRef.current.metric = m;
    stateRef.current.running = false;
    setRunning(false);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: '#27446e' }} />蓝＝基线</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#f07e47' }} />橙＝秘密提示</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#c43f52' }} />红＝秘密通信</span>
      </div>
      <div className="chip-row">
        {(Object.keys(metrics) as Metric[]).map((m) => (
          <button key={m} className={`chip ${metric === m ? 'selected' : ''}`} onClick={() => selectMetric(m)}>
            {metrics[m].label}
          </button>
        ))}
        <button className="tiny" onClick={startRace}>开始对比</button>
      </div>
      <div className={`feedback ${running ? 'good' : ''}`}>{metrics[metric].note}</div>
    </div>
  );
};

export default ResultRace;
