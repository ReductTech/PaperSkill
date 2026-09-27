import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#d97706';
const PURPLE = '#7c3aed';
const LINE = '#d7deea';

const LAYERS = [1, 8, 28, 32] as const;
const ROUTES: Record<number, number[]> = {
  1: [5438,1783,3880,1708, 6181,4585,4787,4876, 1239,4650,3924,7770, 2830,6652,2318,2915],
  8: [4049,4249,4247,4111, 4112,4071,3980,3928, 4133,4012,4121,4079, 4145,4158,4085,4056],
  28:[4177,4619,4361,4408, 3753,3932,3879,4149, 4233,4097,3998,4014, 3856,4032,4013,4015],
  32:[3915,3960,3828,3824, 4588,4272,3835,5028, 4572,3999,3779,3885, 3833,4211,3790,4217],
};

function bg(ctx: CanvasRenderingContext2D, h: number) { ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, W, h); ctx.fillStyle = '#edf3e8'; ctx.fillRect(0, h * 0.72, W, h * 0.28); }

const SpecializationModule: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null); const [layer, setLayer] = useState<(typeof LAYERS)[number]>(1); const [dragging, setDragging] = useState(false);
  const feedback = layer === 1 ? '论文图 8：第 1 层已有偏好，也存在较少被选中的专家；每域采样 65.5K tokens。' : layer === 8 ? '越靠后，专家选择开始更稳定。' : layer === 28 ? '深层偏好更明显，部分专家在多个域共享。' : '第 32 层的路由差异最强；论文用它分析训练域与下游任务的相似性。';
  const toLayer = (clientX: number) => { const rect = ref.current!.getBoundingClientRect(); const x = (clientX - rect.left) * (W / rect.width); const idx = clamp(Math.round((x - 72) / 312), 0, 3); const next = LAYERS[idx]; setLayer(next); };
  useEffect(() => { const canvas = ref.current; if (!canvas) return; const H = 300; const ctx = setupCanvas(canvas, W, H); const draw = () => { bg(ctx, H); ctx.strokeStyle = '#92400e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(72, 68); ctx.lineTo(1008, 68); ctx.stroke(); LAYERS.forEach((l, i) => { const x = 72 + i * 312; const active = l === layer; ctx.fillStyle = active ? ORANGE : '#dfe7ea'; ctx.beginPath(); ctx.arc(x, 68, active ? 10 : 6, 0, Math.PI * 2); ctx.fill(); }); const values = ROUTES[layer]; const min = Math.min(...values); const max = Math.max(...values); values.forEach((v, i) => { const col = i % 4; const row = Math.floor(i / 4); const x = 360 + col * 130; const y = 110 + row * 38; const a = 0.12 + 0.88 * ((v - min) / Math.max(1, max - min)); ctx.fillStyle = layer === 32 ? `rgba(124,58,237,${a})` : layer >= 28 ? `rgba(34,141,92,${a})` : `rgba(39,68,110,${a})`; ctx.fillRect(x, y, 104, 28); ctx.strokeStyle = a > 0.75 ? ORANGE : LINE; ctx.lineWidth = a > 0.75 ? 3 : 1; ctx.strokeRect(x, y, 104, 28); }); const x = 72 + LAYERS.indexOf(layer) * 312; ctx.fillStyle = 'rgba(217,119,6,0.22)'; ctx.beginPath(); ctx.arc(x, 68, 24, 0, Math.PI * 2); ctx.fill(); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); }; const disconnect = observeCanvas(canvas, draw, () => {}); draw(); return disconnect; }, [layer]);
  return <div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} onPointerDown={(e) => { setDragging(true); e.currentTarget.setPointerCapture(e.pointerId); toLayer(e.clientX); }} onPointerMove={(e) => dragging && toLayer(e.clientX)} onPointerUp={() => setDragging(false)} /><div className="step-ctrl"><button className="chip" onClick={() => setLayer(LAYERS[Math.max(0, LAYERS.indexOf(layer) - 1)])}>上一层</button><button className="chip selected">第 {layer} 层</button><button className="chip" onClick={() => setLayer(LAYERS[Math.min(3, LAYERS.indexOf(layer) + 1)])}>下一层</button><button className="chip" onClick={() => setLayer(1)}>重置</button></div><div className={`feedback ${layer >= 28 ? 'good' : ''}`}>{feedback}</div></div>;
};

const RESULTS = [
  { name: 'Sheared-LLaMA-2.7B', value: 56.4, color: '#68778f' },
  { name: 'Open-LLaMA-3B-v2', value: 55.6, color: '#68778f' },
  { name: 'LLaMA-MoE-3.0B', value: 55.5, color: GREEN },
  { name: 'LLaMA-MoE-3.5B (4/16)', value: 57.7, color: GREEN },
];

const ResultModule: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null); const [started, setStarted] = useState(false); const [t, setT] = useState(0);
  useEffect(() => { if (!started) return; const start = performance.now(); let raf = 0; const tick = (now: number) => { const p = clamp((now - start) / 1800, 0, 1); setT(easeOutCubic(p)); if (p < 1) raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf); }, [started]);
  useEffect(() => { const canvas = ref.current; if (!canvas) return; const H = 290; const ctx = setupCanvas(canvas, W, H); const draw = () => { bg(ctx, H); RESULTS.forEach((r, i) => { const y = 48 + i * 50; const p = (t * (r.value - 50)) / 8; ctx.fillStyle = '#e6ebee'; ctx.fillRect(70, y, 900, 26); ctx.fillStyle = r.color; ctx.fillRect(70, y, 900 * clamp(p, 0, 1), 26); ctx.strokeStyle = LINE; ctx.strokeRect(70, y, 900, 26); }); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); }; const disconnect = observeCanvas(canvas, draw, () => {}); draw(); return disconnect; }, [t]);
  return <div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} /><div className="chip-row"><button className="chip selected" onClick={() => { setT(0); setStarted(true); }}>开始对比</button></div><div className={`feedback ${started ? 'good' : ''}`}>{started ? 'Table 2：Sheared-LLaMA 56.4；LLaMA-MoE-3.0B 55.5；Open-LLaMA-3B-v2 55.6；LLaMA-MoE-3.5B(4/16) 57.7。后者高于本组基线；3.0B 接近 Open-LLaMA，但只激活约 3.0B 参数。' : '点击开始比较四个模型的论文平均分。'}</div></div>;
};

const InstructionTuningModule: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'dense'|'tuned'>('dense');
  const [t, setT] = useState(0);
  const data = [
    { base: 43.69, tuned: 48.29 },
    { base: 71.70, tuned: 75.10 },
    { base: 47.41, tuned: 48.95 }
  ];
  useEffect(() => {
    const start = performance.now(); let raf = 0;
    const target = mode === 'tuned' ? 1 : 0;
    const from = t;
    const tick = (now: number) => { const p = clamp((now - start) / 900, 0, 1); setT(from + (target - from) * easeOutCubic(p)); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [mode]);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return; const H = 280; const ctx = setupCanvas(canvas, W, H);
    const draw = () => {
      bg(ctx, H);
      const groups = [190, 490, 790];
      groups.forEach((x, i) => {
        const baseH = (data[i].base / 80) * 170;
        const tunedH = (data[i].tuned / 80) * 170;
        ctx.fillStyle = '#dfe7ea'; ctx.fillRect(x, 232 - baseH, 62, baseH); ctx.strokeStyle = LINE; ctx.strokeRect(x, 232 - baseH, 62, baseH);
        ctx.fillStyle = GREEN; ctx.fillRect(x + 82, 232 - tunedH * t - baseH * (1 - t), 62, baseH + (tunedH - baseH) * t); ctx.strokeStyle = GREEN; ctx.strokeRect(x + 82, 232 - tunedH * t - baseH * (1 - t), 62, baseH + (tunedH - baseH) * t);
        ctx.strokeStyle = mode === 'dense' ? ORANGE : GREEN; ctx.lineWidth = 4; ctx.strokeRect(mode === 'dense' ? x - 8 : x + 74, 48, 78, 192);
      });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, draw, () => {}); draw(); return disconnect;
  }, [mode, t]);
  return <div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} /><div className="chip-row"><button className={`chip ${mode === 'dense' ? 'selected' : ''}`} onClick={() => setMode('dense')}>密集模型</button><button className={`chip ${mode === 'tuned' ? 'selected' : ''}`} onClick={() => setMode('tuned')}>指令微调</button></div><div className={`feedback ${mode === 'tuned' ? 'good' : ''}`}>{mode === 'dense' ? '论文表 3：密集模型 ARC-c 43.69；HellaSwag 71.70；总体 47.41。' : '论文表 3 / §5.10：6k ShareGPT、2 epochs。ARC-c 48.29；HellaSwag 75.10；总体 48.95。'}</div></div>;
};

export const AnalysisLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => moduleId === '9.1' ? <SpecializationModule chapterId={chapterId} moduleId={moduleId} /> : moduleId === '10.2' ? <InstructionTuningModule chapterId={chapterId} moduleId={moduleId} /> : <ResultModule chapterId={chapterId} moduleId={moduleId} />;
export default AnalysisLab;
