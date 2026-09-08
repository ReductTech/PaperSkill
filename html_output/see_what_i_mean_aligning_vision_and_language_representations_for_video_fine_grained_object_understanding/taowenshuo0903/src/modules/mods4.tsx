import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawBars, sceneLabel } from './kit';

const W = 560;
const H = 240;

// ===========================================================================
// Mod9Ablate — Ch9.1 (P4 switch, technical): layer selection & data scale.
// ===========================================================================
const LAYERS = [
  { id: 'l1', label: '1层', value: 3.62 },
  { id: 'l3', label: '3层', value: 3.71 },
  { id: 'l6', label: '6层', value: 3.78 },
  { id: 'l14', label: '14层', value: 3.76 },
];
const DATA = [
  { id: 'd30', label: '30K', value: 3.55 },
  { id: 'd50', label: '50K', value: 3.64 },
  { id: 'd80', label: '80K', value: 3.71 },
  { id: 'd125', label: '125K', value: 3.78 },
];

export const Mod9Ablate: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ layer: 'l6', data: 'd125' });
  const [layer, setLayer] = useState('l6');
  const [data, setData] = useState('d125');
  const [fb, setFb] = useState({ text: '对比监督层数与标注数据规模对 VideoRefer-D 的影响（越高越好）。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let raf = 0;
    const render = () => {
      const { layer: L, data: D } = stateRef.current;
      clearScene(ctx, W, H);
      sceneLabel(ctx, '监督层数', 48, 16, C.ink, 13);
      const lb = LAYERS.map((l) => ({
        label: l.label,
        value: l.value,
        color: l.id === L ? (l.id === 'l6' ? C.green : C.orange) : C.blue,
        highlight: l.id === L,
      }));
      drawBars(ctx, 48, 40, 200, lb, 4.0);
      ctx.strokeStyle = C.border;
      ctx.beginPath(); ctx.moveTo(276, 0); ctx.lineTo(276, H); ctx.stroke();
      sceneLabel(ctx, '标注数据规模', 308, 16, C.ink, 13);
      const db = DATA.map((d) => ({
        label: d.label,
        value: d.value,
        color: d.id === D ? (d.id === 'd125' ? C.green : C.orange) : C.blue,
        highlight: d.id === D,
      }));
      drawBars(ctx, 308, 40, 200, db, 4.0);
      sceneLabel(ctx, '示意值 · 分数区间 0–5', 48, 156, C.muted, 12);
    };
    const tick = () => { render(); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); raf = requestAnimationFrame(tick); };
    const stop = () => cancelAnimationFrame(raf);
    const start = () => { raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => { stop(); disconnect(); };
  }, []);

  const pickLayer = (l: typeof LAYERS[number]) => {
    stateRef.current.layer = l.id; setLayer(l.id);
    setFb(
      l.id === 'l6'
        ? { text: '6 层均匀分布达到最佳权衡（3.78）；再增层数趋于稳定（±0.02）。', cls: 'good' }
        : { text: `监督 ${l.label}：${l.value}，偏离最优的层数与分布方式。`, cls: '' }
    );
  };
  const pickData = (d: typeof DATA[number]) => {
    stateRef.current.data = d.id; setData(d.id);
    setFb(
      d.id === 'd125'
        ? { text: '数据量从 30K 到 125K 单调提升，125K 处仍未到平台期。', cls: 'good' }
        : { text: `标注数据 ${d.label}：${d.value}，样本更少、对齐更弱。`, cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {LAYERS.map((l) => (
          <button key={l.id} className={`chip ${layer === l.id ? 'selected' : ''}`} onClick={() => pickLayer(l)}>
            {l.label}
          </button>
        ))}
      </div>
      <div className="chip-row">
        {DATA.map((d) => (
          <button key={d.id} className={`chip ${data === d.id ? 'selected' : ''}`} onClick={() => pickData(d)}>
            {d.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

// ===========================================================================
// Mod10Race — Ch10.1 (P8 result race, technical): benchmark comparison.
// ===========================================================================
const QMODE = [
  { id: 'swim', label: 'SWIM', value: 78.3, color: C.green },
  { id: 'vr7b', label: 'VideoRefer-7B', value: 71.9, color: C.blue },
  { id: 'qwen', label: 'Qwen2.5-VL', value: 71.8, color: C.blue },
  { id: 'gpt4o', label: 'GPT-4o', value: 71.3, color: C.blue },
];
const DMODE = [
  { id: 'swim', label: 'SWIM', value: 3.78, color: C.green },
  { id: 'dam8b', label: 'DAM-8B', value: 3.68, color: C.blue },
  { id: 'gpt4o', label: 'GPT-4o', value: 3.25, color: C.blue },
];

export const Mod10Race: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t0Ref = useRef<number>(0);
  const [metric, setMetric] = useState<'Q' | 'D'>('Q');
  const [run, setRun] = useState(false);
  const [fb, setFb] = useState({ text: '点击开始，让各方法的分数从基线赛跑到最终值，看 SWIM 领先。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let raf = 0;
    const render = (t: number) => {
      const prog = run ? easeOutCubic(Math.min(1, t / 1.8)) : 0;
      const set = metric === 'Q' ? QMODE : DMODE;
      const max = metric === 'Q' ? 80 : 4.0;
      clearScene(ctx, W, H);
      const isQ = metric === 'Q';
      sceneLabel(
        ctx,
        isQ ? 'VideoRefer-Bench-Q · 准确率（%）' : 'VideoRefer-Bench-D · 0–5 分',
        16, 14, C.ink, 14
      );
      const bars = set.map((m) => ({
        label: m.label,
        value: m.value * prog,
        color: m.color,
        highlight: m.id === 'swim',
      }));
      drawBars(ctx, 150, 34, 360, bars, max);
      if (run && prog >= 1) {
        sceneLabel(ctx, isQ ? 'SWIM 78.3% 领先 +6.4' : 'SWIM 3.78 领先', 150, 34 + set.length * 26 + 8, C.green, 13);
      } else {
        sceneLabel(ctx, isQ ? '分数区间 0–100%' : '分数区间 0–5', 150, 34 + set.length * 26 + 8, C.muted, 12);
      }
    };
    const tick = () => {
      if (run) render((performance.now() - t0Ref.current) / 1000);
      else render(0);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => cancelAnimationFrame(raf);
    const start = () => { raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => { stop(); disconnect(); };
  }, [run, metric]);

  const begin = () => {
    t0Ref.current = performance.now();
    setRun(true);
    setFb({ text: metric === 'Q' ? 'SWIM 平均 78.3%，超过 VideoRefer-7B 6.4 个百分点。' : 'SWIM 平均 3.78，超过最强 specialist 与最强通用模型。', cls: 'good' });
  };
  const switchMetric = (m: 'Q' | 'D') => {
    setMetric(m); setRun(false);
    setFb({ text: m === 'Q' ? 'Q 类：1,000 道多选题的准确率，越高越好。' : 'D 类：0–5 分描述评分，越高越好，二者不可直接比较。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny" onClick={begin}>{run ? '重新播放' : '开始比较'}</button>
        <button className={`chip ${metric === 'Q' ? 'selected' : ''}`} onClick={() => switchMetric('Q')}>Q 类（%）</button>
        <button className={`chip ${metric === 'D' ? 'selected' : ''}`} onClick={() => switchMetric('D')}>D 类（0–5）</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
