import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, label, drawBar, drawCaption } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 560;
const H = 260;

type Strat = 'uniform' | 'size' | 'vlm3';

const STRATS: Record<Strat, { name: string; score: number; mix: number[]; note: string }> = {
  uniform: {
    name: '均匀',
    score: 0.842,
    mix: [0.25, 0.25, 0.25, 0.25],
    note: '各源均匀抽样：δ1≈0.842（偏低）。',
  },
  size: {
    name: 'size-based',
    score: 0.884,
    mix: [0.4, 0.28, 0.2, 0.12],
    note: '按数据集体量加权：δ1≈0.884。',
  },
  vlm3: {
    name: 'VLM3 配比',
    score: 0.904,
    mix: [0.34, 0.3, 0.22, 0.14],
    note: 'VLM3 配比：δ1≈0.904（Table 3）。',
  },
};

const DATASETS = ['Taskonomy', 'HM3d', 'Argoverse2', 'Internal 等'];
const COLORS = [C.blue, C.orange, C.purple, C.green];

export const Ch9Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ strat: Strat }>({ strat: 'vlm3' });
  const rafRef = useRef<number | null>(null);
  const [strat, setStrat] = useState<Strat>('vlm3');
  const [feedback, setFeedback] = useState({
    text: '切换配比策略，对照右侧 δ1（Table 3）。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = () => {
      const s = stateRef.current.strat;
      const d = STRATS[s];
      ctx.clearRect(0, 0, W, H); drawSceneBg(ctx, W, H);
      label(ctx, '多源配比示意', 24, 28, C.text, 13);

      d.mix.forEach((a, i) => {
        const h = a * 110;
        const x = 36 + i * 78;
        ctx.fillStyle = COLORS[i];
        ctx.fillRect(x, 160 - h, 58, h);
        label(ctx, DATASETS[i].slice(0, 8), x, 176, C.text, 10);
        label(ctx, Math.round(a * 100) + '%', x + 10, 156 - h, C.text, 11);
      });

      label(ctx, 'δ1 对照（Table 3）', 360, 28, C.text, 12);
      (['uniform', 'size', 'vlm3'] as Strat[]).forEach((k, i) => {
        const sc = STRATS[k].score;
        const y = 50 + i * 48;
        const active = k === s;
        ctx.fillStyle = active ? '#e8f5ee' : '#fff';
        ctx.strokeStyle = active ? C.green : C.border;
        ctx.lineWidth = active ? 2.5 : 1;
        ctx.fillRect(350, y, 190, 40);
        ctx.strokeRect(350, y, 190, 40);
        label(ctx, STRATS[k].name, 360, y + 16, C.text, 12);
        // δ1 ∈ [0,1]，进度条填充比例与数值一致
        drawBar(ctx, 360, y + 22, 120, 8, sc, active ? C.green : C.blue);
        label(ctx, sc.toFixed(3), 490, y + 28, active ? C.green : C.text, 12);
      });

      const score = d.score;
      let capColor = C.blue;
      let capText = '';
      if (score <= 0.85) {
        capColor = C.red;
        capText = 'δ1≈' + score.toFixed(3) + ' 偏低：度量深度不准，更多像素相对误差超阈值';
      } else if (score >= 0.9) {
        capColor = C.green;
        capText = 'δ1≈' + score.toFixed(3) + ' 偏高：度量深度更准，更多像素落在误差阈值内';
      } else {
        capColor = C.blue;
        capText = 'δ1≈' + score.toFixed(3) + ' 中等：深度可用，但仍有明显提升空间';
      }
      drawCaption(ctx, W, H, capText, capColor, 12);
    };
    const tick = () => { render(); canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const d = observeCanvas(canvas, start, stop);
    return () => { stop(); d(); };
  }, []);

  const pick = (k: Strat) => {
    stateRef.current.strat = k;
    setStrat(k);
    const d = STRATS[k];
    setFeedback({
      text: d.note,
      cls: d.score >= 0.9 ? 'good' : d.score <= 0.85 ? 'bad' : '',
    });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {([['uniform', '均匀'], ['size', 'size-based'], ['vlm3', 'VLM3 配比']] as [Strat, string][]).map(([k, n]) => (
          <button key={k} type="button" className={`chip ${strat === k ? 'on' : ''}`} onClick={() => pick(k)}>{n}</button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`} style={{ fontStyle: 'normal' }}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Mod1;
