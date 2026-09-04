import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { K, drawLabel, roundRect } from './ana-scene';

const W = 560, H = 300;
type Metric = 'geneval' | 'fid';

interface Row { name: string; value: number; steps: string; mine: boolean }

// Table 1 (GenEval, 越高越好) and Table 6 (ImageNet 256² FID-50K, 越低越好)
const ROWS: Record<Metric, Row[]> = {
  geneval: [
    { name: 'SDXL', value: 0.55, steps: '多步', mine: false },
    { name: 'STARFlow', value: 0.56, steps: '256 步', mine: false },
    { name: 'SD3-Medium', value: 0.62, steps: '多步', mine: false },
    { name: 'FLUX.1-dev', value: 0.66, steps: '多步', mine: false },
    { name: 'NTM（本文）', value: 0.82, steps: '4 步', mine: true },
    { name: 'Qwen-Image', value: 0.87, steps: '多步', mine: false },
  ],
  fid: [
    { name: 'DiT-XL/2', value: 2.27, steps: '250 步', mine: false },
    { name: 'STARFlow(FAE)', value: 2.67, steps: '256 步', mine: false },
    { name: 'NTM T=16', value: 2.8, steps: '16 步', mine: true },
    { name: 'NTM T=8', value: 3.24, steps: '8 步', mine: true },
    { name: 'NTM T=4', value: 3.83, steps: '4 步', mine: true },
  ],
};

const DONE_TEXT: Record<Metric, { text: string; cls: string }> = {
  geneval: {
    text: '4 步 0.82：归一化流家族的巨大跨越（前作 0.56 还要 256 步），也超过 SDXL / SD3-Medium / FLUX.1-dev——但距最强的 Qwen-Image 0.87 仍有差距。',
    cls: 'good',
  },
  fid: {
    text: '注意方向：FID 越低越好。16 步 FID 2.80 已逼近 256 步前作的 2.67——而且是纯 NLL 训练、零对抗损失。步数少 16 倍，代价只有 +0.13。',
    cls: 'good',
  },
};

export const M10Race: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ metric: Metric; t0: number; started: boolean }>({
    metric: 'geneval', t0: 0, started: false,
  });
  const rafRef = useRef<number | null>(null);
  const [metric, setMetric] = useState<Metric>('geneval');
  const [started, setStarted] = useState(false);
  const [feedback, setFeedback] = useState({
    text: '点\u201c开始比较\u201d，所有成绩条同时从零增长到真实值。',
    cls: '',
  });
  const doneRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      const s = stateRef.current;
      const p = s.started ? easeInOutQuad(clamp((performance.now() / 1000 - s.t0) / 1.8, 0, 1)) : 0;
      if (s.started && p >= 1 && !doneRef.current) {
        doneRef.current = true;
        setFeedback(DONE_TEXT[s.metric]);
      }
      ctx.fillStyle = K.bg;
      ctx.fillRect(0, 0, W, H);
      const isFid = s.metric === 'fid';
      drawLabel(ctx, isFid
        ? 'ImageNet 256² · FID-50K（越低越好 → 条越短越好）'
        : 'GenEval 综合分（越高越好）', 40, 24, K.text, 13);

      const rows = ROWS[s.metric];
      const maxV = isFid ? 4.4 : 1.0;
      const gx = 150, gw = 330, rh = isFid ? 46 : 40;
      rows.forEach((r, i) => {
        const y = 42 + i * rh;
        const frac = (r.value / maxV) * p;
        drawLabel(ctx, r.name, gx - 10, y + 12, r.mine ? K.green : K.muted, 11, 'right');
        ctx.fillStyle = r.mine ? K.green : 'rgba(104,119,143,0.45)';
        roundRect(ctx, gx, y + 4, Math.max(2, gw * frac), 15, 3);
        ctx.fill();
        if (p > 0.02) {
          drawLabel(ctx, `${r.value.toFixed(2)} · ${r.steps}`, gx + gw * (r.value / maxV) * p + 8, y + 12,
            r.mine ? K.green : K.muted, 11);
        }
      });
      if (!s.started) drawLabel(ctx, '待发令…', gx, 42 + rows.length * rh + 8, K.muted, 11);
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const run = () => {
    stateRef.current.started = true;
    stateRef.current.t0 = performance.now() / 1000;
    doneRef.current = false;
    setStarted(true);
    setFeedback({ text: '同时起跑，每条都带着自己的步数标注……', cls: '' });
  };
  const pickMetric = (m: Metric) => {
    stateRef.current.metric = m;
    stateRef.current.started = false;
    doneRef.current = false;
    setMetric(m);
    setStarted(false);
    setFeedback({
      text: m === 'fid'
        ? '已切到 FID：方向反转，越低越好。点\u201c开始比较\u201d重新起跑。'
        : '已切回 GenEval：越高越好。点\u201c开始比较\u201d重新起跑。',
      cls: '',
    });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${metric === 'geneval' ? 'selected' : ''}`} onClick={() => pickMetric('geneval')}>
          GenEval（文生图）
        </button>
        <button className={`chip ${metric === 'fid' ? 'selected' : ''}`} onClick={() => pickMetric('fid')}>
          ImageNet FID
        </button>
      </div>
      <div className="step-ctrl">
        <button className="tiny" onClick={run}>{started ? '再跑一次' : '开始比较'}</button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
