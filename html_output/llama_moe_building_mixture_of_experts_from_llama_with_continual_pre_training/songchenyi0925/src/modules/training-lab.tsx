import React, { useEffect, useMemo, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#d97706';
const PURPLE = '#7c3aed';
const LINE = '#d7deea';

function bg(ctx: CanvasRenderingContext2D, h: number) { ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, W, h); ctx.fillStyle = '#edf3e8'; ctx.fillRect(0, h * 0.72, W, h * 0.28); }
function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, active = false, color = BLUE) { ctx.fillStyle = active ? color : '#fff'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = active ? color : LINE; ctx.lineWidth = active ? 4 : 1; ctx.strokeRect(x, y, w, h); ctx.fillStyle = active ? '#fff' : '#68778f'; }
function line(ctx: CanvasRenderingContext2D, pts: number[][], color: string, width = 3) { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); }

const SamplingModule: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null); const [strategy, setStrategy] = useState<'StaticLLaMA'|'StaticSheared'|'DynamicLLaMA'|'DynamicUniform'>('StaticSheared');
  const copy: Record<string, [string,string]> = { StaticLLaMA:['','静态权重，但沿用 LLaMA-1 的比例。'], StaticSheared:['good','论文 30B-token 分析中，StaticSheared 的下游平均表现最好；最终模型采用 IndependentRandom + StaticSheared + fluency filtering。'], DynamicLLaMA:['','动态调整每 2.5B tokens 一次的权重。'], DynamicUniform:['bad','动态且均匀，论文观察到更多波动，表现也低于静态方案。'] };
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return; const H = 270; const ctx = setupCanvas(canvas, W, H);
    const draw = () => {
      bg(ctx, H); line(ctx, [[66,218],[1014,218]], '#21324a', 2); line(ctx, [[66,218],[66,42]], '#21324a', 2);
      const dynamic = strategy.startsWith('Dynamic');
      const pts: number[][] = []; for (let i = 0; i <= 30; i++) { const base = strategy === 'StaticSheared' ? 0.74 : strategy === 'StaticLLaMA' ? 0.60 : 0.54; const jitter = dynamic ? Math.sin(i * 1.1) * 0.08 : 0; pts.push([66 + i * 31.6, 190 - (base + jitter) * 145]); }
      line(ctx, pts, strategy === 'StaticSheared' ? GREEN : strategy === 'DynamicUniform' ? RED : BLUE, 4);
      if (strategy === 'StaticSheared') { ctx.fillStyle = GREEN; ctx.beginPath(); ctx.arc(1014, 190 - 0.74 * 145, 6, 0, Math.PI * 2); ctx.fill(); }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, draw, () => {}); draw(); return disconnect;
  }, [strategy]);
  return <div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} /><div className="chip-row">{(['StaticLLaMA','StaticSheared','DynamicLLaMA','DynamicUniform'] as const).map((s) => <button key={s} className={`chip ${strategy === s ? 'selected' : ''}`} onClick={() => setStrategy(s)}>{s}</button>)}</div><div className={`feedback ${copy[strategy][0]}`}>{copy[strategy][1]}</div></div>;
};

const ProgressModule: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null); const [tokens, setTokens] = useState(0);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return; const H = 280; const ctx = setupCanvas(canvas, W, H);
    const draw = () => { bg(ctx, H); line(ctx, [[72,222],[1008,222]], '#21324a', 2); line(ctx, [[72,222],[72,42]], '#21324a', 2); const pts: number[][] = []; const loss: number[][] = []; for (let i = 0; i <= 60; i++) { const x = 72 + i * 15.6; const t = i / 60; pts.push([x, 194 - (0.25 + 0.48 * (1 - Math.exp(-2.8 * t))) * 146]); loss.push([x, 194 - (0.28 + 0.48 * (1 - Math.exp(-3.4 * t))) * 146]); } line(ctx, pts, BLUE); line(ctx, loss, RED); const x = 72 + (tokens / 30) * 936; ctx.strokeStyle = ORANGE; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 44); ctx.lineTo(x, 222); ctx.stroke(); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); };
    const disconnect = observeCanvas(canvas, draw, () => {}); draw(); return disconnect;
  }, [tokens]);
  const text = tokens < 10 ? '采样分析仍在恢复语言能力。' : tokens < 25 ? '下游分数逐渐提升，但 loss 与下游排序不能互相替代。' : '30B 分析预算结束；StaticSheared 在论文平均分数中最好。最终模型另用 200B tokens 训练。';
  return <div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} /><div className="ctrl"><label>训练进度 <span className="val">{tokens.toFixed(1)}B</span></label><input type="range" min={0} max={30} step={0.5} value={tokens} onChange={(e) => setTokens(Number(e.target.value))} /></div><div className={`feedback ${tokens >= 25 ? 'good' : ''}`}>{text}</div></div>;
};

const ArchitectureModule: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [component, setComponent] = useState<'Token'|'Gate'|'Experts'|'Re-scale'|'Output'>('Gate');
  const copy: Record<string, string> = {
    Token: 'token 的隐藏状态先经过注意力层，再进入当前 FFN 的 MoE 替换块。',
    Gate: '门控网络为每个 token 选择 top-k 专家；论文采用 token-level noisy top-k gating，并加入负载均衡。',
    Experts: '4/16 配置只组合 4 个专家，每个专家约占原 FFN 中间神经元的 1/16。',
    'Re-scale': '被选中专家的输出乘以 N/k；本配置中 N=16、k=4，因此缩放因子是 4。',
    Output: '加权后的专家输出回到模型维度，再继续进入下一层。'
  };
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return; const H = 300; const ctx = setupCanvas(canvas, W, H);
    const arrow = (x1: number, y1: number, x2: number, y2: number, color: string, active: boolean, curve = 0) => {
      ctx.strokeStyle = active ? color : LINE; ctx.lineWidth = active ? 5 : 2; ctx.beginPath(); ctx.moveTo(x1, y1);
      if (curve) ctx.quadraticCurveTo((x1 + x2) / 2, curve, x2, y2); else ctx.lineTo(x2, y2); ctx.stroke();
      ctx.fillStyle = active ? color : LINE; ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 8, y2 - 4); ctx.lineTo(x2 - 8, y2 + 4); ctx.closePath(); ctx.fill();
    };
    const block = (x: number, y: number, w: number, h: number, active: boolean, color: string) => {
      ctx.fillStyle = active ? color : '#ffffff'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = active ? color : LINE; ctx.lineWidth = active ? 4 : 1; ctx.strokeRect(x, y, w, h);
    };
    const expertPositions = Array.from({ length: 16 }, (_, i) => ({ x: 416 + (i % 4) * 38, y: 76 + Math.floor(i / 4) * 38, selected: [2,5,9,14].includes(i) }));
    const draw = () => {
      bg(ctx, H);
      const tokenActive = component === 'Token' || component === 'Gate' || component === 'Experts' || component === 'Re-scale' || component === 'Output';
      block(54, 116, 76, 54, tokenActive, BLUE);
      ctx.fillStyle = tokenActive ? BLUE : '#dfe7ea'; ctx.beginPath(); ctx.arc(92, 143, 12, 0, Math.PI * 2); ctx.fill();
      block(156, 110, 100, 66, component === 'Token', BLUE);
      arrow(130, 143, 156, 143, BLUE, tokenActive);
      ctx.save(); ctx.translate(302, 143); ctx.rotate(Math.PI / 4); block(-34, -34, 68, 68, component === 'Gate' || component === 'Experts', ORANGE); ctx.restore();
      arrow(256, 143, 268, 143, BLUE, tokenActive);
      expertPositions.forEach((e) => {
        const active = e.selected && (component === 'Gate' || component === 'Experts');
        ctx.fillStyle = active ? GREEN : '#e6ebee'; ctx.fillRect(e.x, e.y, 30, 30);
        ctx.strokeStyle = active ? GREEN : LINE; ctx.lineWidth = active ? 3 : 1; ctx.strokeRect(e.x, e.y, 30, 30);
        if (e.selected) arrow(336, 143, e.x, e.y + 15, component === 'Gate' || component === 'Experts' ? GREEN : LINE, component === 'Gate' || component === 'Experts', 70);
      });
      arrow(630, 143, 700, 143, GREEN, component === 'Experts' || component === 'Re-scale', 105);
      ctx.strokeStyle = component === 'Experts' || component === 'Re-scale' ? GREEN : LINE; ctx.lineWidth = component === 'Experts' || component === 'Re-scale' ? 4 : 2; ctx.beginPath(); ctx.arc(720, 143, 24, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(706, 129); ctx.lineTo(734, 157); ctx.moveTo(734, 129); ctx.lineTo(706, 157); ctx.stroke();
      arrow(744, 143, 810, 143, ORANGE, component === 'Re-scale' || component === 'Output');
      block(824, 114, 90, 58, component === 'Re-scale' || component === 'Output', ORANGE);
      arrow(914, 143, 968, 143, GREEN, component === 'Output');
      block(968, 116, 68, 54, component === 'Output', GREEN);
      ctx.fillStyle = '#68778f'; ctx.font = '16px "Segoe UI", sans-serif'; ctx.fillText('4/16', 505, 54); ctx.fillText('N/k', 856, 102);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, draw, () => {}); draw(); return disconnect;
  }, [component]);
  return <div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} /><div className="chip-row">{(['Token','Gate','Experts','Re-scale','Output'] as const).map((x) => <button key={x} className={`chip ${component === x ? 'selected' : ''}`} onClick={() => setComponent(x)}>{x}</button>)}</div><div className="feedback">{copy[component]}</div></div>;
};

const FilterModule: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null); const [mode, setMode] = useState<'baseline'|'fluency'|'ads'>('baseline');
  const copy = { baseline:['','未过滤时作为比较基线。'], fluency:['good','论文在 CommonCrawl 与 C4 约过滤 15% 低流畅文本，训练损失下降且平均分数提升。'], ads:['bad','论文约过滤 50% 广告；训练损失更低，但下游表现反而受损，说明过滤阈值仍需改进。'] } as const;
  useEffect(() => { const canvas = ref.current; if (!canvas) return; const H = 270; const ctx = setupCanvas(canvas, W, H); const draw = () => { bg(ctx, H); ctx.fillStyle = '#21324a'; ctx.font = '18px "Segoe UI", sans-serif'; ctx.fillText('训练损失', 72, 52); ctx.fillText('下游平均分', 72, 152); const loss = mode === 'ads' ? 0.35 : mode === 'fluency' ? 0.55 : 0.7; const score = mode === 'ads' ? 0.42 : mode === 'fluency' ? 0.8 : 0.65; ctx.fillStyle = '#e6ebee'; ctx.fillRect(190, 34, 760, 24); ctx.fillRect(190, 134, 760, 24); ctx.fillStyle = mode === 'ads' ? ORANGE : GREEN; ctx.fillRect(190, 34, 760 * loss, 24); ctx.fillStyle = mode === 'ads' ? RED : GREEN; ctx.fillRect(190, 134, 760 * score, 24); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); }; const disconnect = observeCanvas(canvas, draw, () => {}); draw(); return disconnect; }, [mode]); return <div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} /><div className="chip-row"><button className={`chip ${mode === 'baseline' ? 'selected' : ''}`} onClick={() => setMode('baseline')}>原始</button><button className={`chip ${mode === 'fluency' ? 'selected' : ''}`} onClick={() => setMode('fluency')}>去低流畅</button><button className={`chip ${mode === 'ads' ? 'selected' : ''}`} onClick={() => setMode('ads')}>去广告</button></div><div className={`feedback ${copy[mode][0]}`}>{copy[mode][1]}</div></div>; };

export const TrainingLab: React.FC<WidgetProps> = (props) => { const m = props.moduleId; return useMemo(() => m === '7.1' ? <SamplingModule {...props} /> : m === '7.2' ? <ProgressModule {...props} /> : m === '8.1' ? <ArchitectureModule {...props} /> : <FilterModule {...props} />, [m]); };
export default TrainingLab;
