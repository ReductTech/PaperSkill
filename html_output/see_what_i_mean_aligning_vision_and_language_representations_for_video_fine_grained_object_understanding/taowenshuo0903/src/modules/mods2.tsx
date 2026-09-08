import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C, clearScene, drawFlower, drawFocusRing, drawHeat, drawBars, sceneLabel,
} from './kit';

const W = 560;
const H = 240;

// ===========================================================================
// Mod4Spread — Ch4.1 (P1 slider, hybrid): attention concentration vs softmax.
// ===========================================================================
export const Mod4Spread: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ s: 0.15 });
  const [val, setVal] = useState(0.15);
  const [fb, setFb] = useState({ text: '把「集中度」拉高，看 softmax 归一化的注意力曲线如何从平缓变尖锐。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let raf = 0;
    const render = () => {
      const s = stateRef.current.s;
      clearScene(ctx, W, H);
      const logits = [0.2, 0.6, 1.0, 1.6, 2.7, 1.35, 0.75, 0.35];
      const beta = 0.45 + s * 4.8;
      const exps = logits.map((v) => Math.exp(v * beta));
      const sum = exps.reduce((a, b) => a + b, 0);
      const probs = exps.map((v) => v / sum);
      const entropy = -probs.reduce((acc, v) => acc + v * Math.log(v), 0);
      const x0 = 56; const baseY = 191; const barW = 43; const gap = 15; const maxH = 125;
      sceneLabel(ctx, '视觉 token 的 softmax 概率', 16, 14, C.ink, 14);
      probs.forEach((prob, i) => {
        const x = x0 + i * (barW + gap);
        const h = prob * maxH / Math.max(...probs);
        ctx.fillStyle = i === 4 ? C.green : C.blue;
        ctx.globalAlpha = i === 4 ? 1 : 0.58;
        ctx.fillRect(x, baseY - h, barW, h);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = i === 4 ? C.green : C.border;
        ctx.strokeRect(x, 48, barW, baseY - 48);
        sceneLabel(ctx, `v${i + 1}`, x + 13, 200, i === 4 ? C.green : C.muted, 11);
        sceneLabel(ctx, `${Math.round(prob * 100)}%`, x + 8, Math.max(52, baseY - h - 18), i === 4 ? C.green : C.muted, 10);
      });
      sceneLabel(ctx, `熵 H = ${entropy.toFixed(2)}`, 430, 18, entropy < 0.8 ? C.green : C.red, 12);
    };
    const tick = () => { render(); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); raf = requestAnimationFrame(tick); };
    const stop = () => cancelAnimationFrame(raf);
    const start = () => { raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => { stop(); disconnect(); };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = Number(e.target.value) / 100;
    stateRef.current.s = s; setVal(s);
    setFb(
      s > 0.6
        ? { text: '高集中度（低温）：softmax 后概率集中在少数视觉 token，定位锐利。', cls: 'good' }
        : s > 0.25
        ? { text: '集中度上升，注意力峰开始收窄（蓝，中间态）。', cls: '' }
        : { text: '低集中度（高温）：softmax 摊平概率，注意力弥散，难以定位。', cls: 'bad' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>集中度（= 1/温度） <span className="val">{(val * 100).toFixed(0)}%</span></label>
        <input type="range" min={0} max={100} value={Math.round(val * 100)} onChange={onChange} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

// ===========================================================================
// Mod4Agg — Ch4.2 (P4 switch, technical): multi-layer aggregation strategy.
// ===========================================================================
const AGG = [
  { id: 'add', label: 'Add 加和', value: 3.57, color: C.blue, note: '加和会让多个层的峰值叠加，中等显著区域被放大。' },
  { id: 'pool', label: 'Pool 池化', value: 3.49, color: C.blue, note: '最大池化只保留最强层，丢弃稳定的多层对应。' },
  { id: 'prod', label: 'Prod 乘积', value: 3.55, color: C.blue, note: '逐元素乘积过度抑制中等显著区域。' },
  { id: 'mean', label: 'Mean 平均', value: 3.78, color: C.green, note: '简单平均保留跨层稳定对应，最稳（3.78）。' },
];

export const Mod4Agg: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sel: 'mean' });
  const [sel, setSel] = useState('mean');
  const [fb, setFb] = useState({ text: '切换不同多层聚合方式，比较 VideoRefer-D 平均分（越高越好）。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let raf = 0;
    const render = () => {
      const s = stateRef.current.sel;
      clearScene(ctx, W, H);
      sceneLabel(ctx, '多层注意力聚合 → VideoRefer-D', 16, 14, C.ink, 14);
      const bars = AGG.map((a) => ({
        label: a.label,
        value: a.value,
        color: a.id === s ? (a.id === 'mean' ? C.green : C.orange) : C.blue,
        highlight: a.id === s,
      }));
      drawBars(ctx, 150, 34, 340, bars, 4.0);
      sceneLabel(ctx, '分数区间 0–5，越高越好', 150, 148, C.muted, 12);
    };
    const tick = () => { render(); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); raf = requestAnimationFrame(tick); };
    const stop = () => cancelAnimationFrame(raf);
    const start = () => { raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => { stop(); disconnect(); };
  }, []);

  const pick = (a: typeof AGG[number]) => {
    stateRef.current.sel = a.id; setSel(a.id);
    setFb(a.id === 'mean' ? { text: `「${a.label}」最优（3.78）——平均聚合捕获跨层稳定对应。`, cls: 'good' } : { text: a.note, cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {AGG.map((a) => (
          <button key={a.id} className={`chip ${sel === a.id ? 'selected' : ''}`} onClick={() => pick(a)}>
            {a.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

// ===========================================================================
// Mod5Refer — Ch5.1 (P4 switch, life): <region> placeholder vs NL referral.
// ===========================================================================
export const Mod5Refer: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ nl: false });
  const [nl, setNl] = useState(false);
  const [fb, setFb] = useState({ text: '切换指代方式，看模型能否把对焦框锁定到「命名物体」。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let raf = 0;
    const render = () => {
      const useNL = stateRef.current.nl;
      clearScene(ctx, W, H);
      const fx = 280; const fy = 170;
      const focusY = fy - 32;
      const spread = useNL ? 12 : 104;
      drawFlower(ctx, fx, fy, 1.6, useNL ? 0.95 : 0.35);
      if (useNL) drawHeat(ctx, fx, focusY, spread, C.green, W, 178, 0, 0);
      drawFocusRing(ctx, fx, focusY, useNL ? 18 : 82, useNL ? 14 : 46, useNL ? C.green : C.red, 0.5);
      sceneLabel(ctx, useNL ? '锁定指定花朵' : '缺少语义身份', 16, 14, useNL ? C.green : C.red, 14);
      // a small "message" chip showing the input form
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.fillRect(16, 196, 528, 32);
      ctx.strokeRect(16, 196, 528, 32);
      ctx.fillStyle = C.muted;
      ctx.font = '13px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        useNL ? '请聚焦到：画面中央的盆栽花' : '请聚焦到：〈region〉中的物体',
        28, 212
      );
      ctx.textAlign = 'left';
    };
    const tick = () => { render(); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); raf = requestAnimationFrame(tick); };
    const stop = () => cancelAnimationFrame(raf);
    const start = () => { raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => { stop(); disconnect(); };
  }, []);

  const toggle = (useNL: boolean) => {
    stateRef.current.nl = useNL; setNl(useNL);
    setFb(
      useNL
        ? { text: '自然语言指代把「指什么」写进了文本，模型据此锁定物体。', cls: 'good' }
        : { text: '「<region>」不含语义身份，模型不知道到底指哪个物体。', cls: 'bad' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${!nl ? 'selected' : ''}`} onClick={() => toggle(false)}>{'<region> 占位符'}</button>
        <button className={`chip ${nl ? 'selected' : ''}`} onClick={() => toggle(true)}>自然语言指代</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
