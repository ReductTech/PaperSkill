import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawFlower, drawFocusRing, drawHeat, drawBars, sceneLabel } from './kit';

const W = 560;
const H = 240;

// ===========================================================================
// Mod6Infer — Ch6.1 (P2 step-through, technical): pure-text five-step pipeline.
// ===========================================================================
const STEPS = [
  { id: 0, label: '输入视频 + 文本', desc: '只有视频帧和一句自然语言问题，没有框、点或掩码。' },
  { id: 1, label: '标记物体名词', desc: '定位文本中的核心物体名词 wᵢ，作为后续监督锚点。' },
  { id: 2, label: '多层跨注意力', desc: '提取物体名词到视觉 token 的多层注意力图 A_{l,i}。' },
  { id: 3, label: '聚合与掩码对齐', desc: '平均聚合为 Āᵢ，并与真值掩码对齐（仅训练期）。' },
  { id: 4, label: '直接定位回答', desc: '推理时模型已内化对齐，纯文本即可精确指代并回答。' },
];

export const Mod6Infer: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const [step, setStep] = useState(0);
  const [fb, setFb] = useState({ text: '按「下一步」走一遍 SWIM 的纯文本定位五步。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let raf = 0;
    const render = () => {
      const s = stateRef.current.step;
      clearScene(ctx, W, H);
      sceneLabel(ctx, 'SWIM 推理五步（训练期步骤用绿色标出）', 16, 14, C.ink, 14);
      const n = STEPS.length;
      const boxW = 92; const gap = 12; const total = n * boxW + (n - 1) * gap;
      const x0 = (W - total) / 2; const y0 = 60; const boxH = 70;
      STEPS.forEach((st, i) => {
        const x = x0 + i * (boxW + gap);
        const active = i === s;
        const isTrain = i === 2 || i === 3; // cross-attention + mask alignment happen at train time
        const isLast = i === n - 1;
        ctx.fillStyle = active ? (isTrain ? C.green : C.blue) : '#eef3fb';
        ctx.fillRect(x, y0, boxW, boxH);
        ctx.strokeStyle = active ? (isTrain ? C.green : C.blue) : C.border;
        ctx.lineWidth = active ? 2.5 : 1;
        ctx.strokeRect(x, y0, boxW, boxH);
        ctx.fillStyle = active ? '#fff' : C.ink;
        ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(st.label, x + boxW / 2, y0 + boxH / 2 - 8);
        ctx.fillStyle = active ? 'rgba(255,255,255,0.85)' : C.muted;
        ctx.font = '11px "Segoe UI", "PingFang SC", sans-serif';
        ctx.fillText((i + 1) + (isLast ? ' · 推理' : isTrain ? ' · 训练' : ''), x + boxW / 2, y0 + boxH / 2 + 14);
        // arrow
        if (i < n - 1) {
          ctx.strokeStyle = C.border;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + boxW + 2, y0 + boxH / 2);
          ctx.lineTo(x + boxW + gap - 2, y0 + boxH / 2);
          ctx.stroke();
        }
      });
      // current step detail
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.fillRect(16, 168, 528, 56);
      ctx.strokeRect(16, 168, 528, 56);
      ctx.fillStyle = C.blue;
      ctx.font = '13px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('第 ' + (s + 1) + ' 步 · ' + STEPS[s].label, 28, 178);
      ctx.fillStyle = C.ink;
      ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText(STEPS[s].desc, 28, 200);
      ctx.textAlign = 'left';
    };
    const tick = () => { render(); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); raf = requestAnimationFrame(tick); };
    const stop = () => cancelAnimationFrame(raf);
    const start = () => { raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => { stop(); disconnect(); };
  }, []);

  const go = (next: number) => {
    const s = Math.max(0, Math.min(STEPS.length - 1, next));
    stateRef.current.step = s; setStep(s);
    setFb(
      s === STEPS.length - 1
        ? { text: '训练期把对齐内化进模型，推理时就只需纯文本。', cls: 'good' }
        : { text: STEPS[s].desc, cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => go(step - 1)} disabled={step === 0}>上一步</button>
        <span className="step-label"><b>{step + 1}</b> / {STEPS.length}</span>
        <button className="tiny" onClick={() => go(step + 1)} disabled={step === STEPS.length - 1}>下一步</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

// ===========================================================================
// Mod7Loss — Ch7.1 (P4 switch, hybrid): BCE alignment loss ablation.
// ===========================================================================
const LOSSES = [
  { id: 'bce', label: 'BCE', value: 3.78, prec: 0.96, color: C.green, note: '逐像素独立惩罚，适合 softmax 后的稀疏注意力，消融中最优。' },
  { id: 'dice', label: 'Dice', value: 3.74, prec: 0.90, color: C.blue, note: '区域重叠度量，对弥散图惩罚较温和。' },
  { id: 'miou', label: 'mIoU', value: 3.71, prec: 0.86, color: C.blue, note: '交并比，需要硬阈值，对小物体不友好。' },
  { id: 'focal', label: 'Focal', value: 3.69, prec: 0.82, color: C.blue, note: '聚焦难样本，但对密集注意力图过强。' },
];

export const Mod7Loss: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sel: 'bce' });
  const [sel, setSel] = useState('bce');
  const [fb, setFb] = useState({ text: '切换损失函数，比较 VideoRefer-D 分数与「对焦精度」。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let raf = 0;
    const render = () => {
      const s = stateRef.current.sel;
      const cur = LOSSES.find((l) => l.id === s) || LOSSES[0];
      clearScene(ctx, W, H);
      sceneLabel(ctx, '对齐损失 → VideoRefer-D 与对焦精度', 16, 14, C.ink, 14);
      const bars = LOSSES.map((l) => ({
        label: l.label,
        value: l.value,
        color: l.id === s ? (l.id === 'bce' ? C.green : C.orange) : C.blue,
        highlight: l.id === s,
      }));
      drawBars(ctx, 150, 34, 340, bars, 4.0);
      // focus precision meter (right side, shared scale 0..1)
      const mx = 430; const my = 34; const mw = 110; const mh = 16;
      sceneLabel(ctx, '对焦精度', mx, my - 22, C.muted, 12);
      ctx.strokeStyle = C.border; ctx.lineWidth = 1;
      ctx.strokeRect(mx, my, mw, mh);
      ctx.fillStyle = s === 'bce' ? C.green : C.blue;
      ctx.fillRect(mx, my, mw * cur.prec, mh);
      ctx.fillStyle = C.ink;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((cur.prec * 100).toFixed(0) + '%', mx + mw / 2, my + mh / 2 + 14);
      ctx.textAlign = 'left';
    };
    const tick = () => { render(); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); raf = requestAnimationFrame(tick); };
    const stop = () => cancelAnimationFrame(raf);
    const start = () => { raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => { stop(); disconnect(); };
  }, []);

  const pick = (l: typeof LOSSES[number]) => {
    stateRef.current.sel = l.id; setSel(l.id);
    setFb(l.id === 'bce' ? { text: 'BCE 在该消融中最优（3.78），逐像素独立惩罚贴合稀疏注意力。', cls: 'good' } : { text: l.note, cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {LOSSES.map((l) => (
          <button key={l.id} className={`chip ${sel === l.id ? 'selected' : ''}`} onClick={() => pick(l)}>
            {l.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

// ===========================================================================
// Mod8Arch — Ch8.1 (P5 architecture, technical): SWIM training pipeline.
// ===========================================================================
const NODES = [
  { id: 'frame', label: '视频帧', role: '视觉输入，被切分为视觉 token。', x: 24, y: 90, w: 78, h: 44 },
  { id: 'venc', label: '视觉编码器', role: 'SIGLIP 把帧编码为视觉特征。', x: 122, y: 90, w: 96, h: 44 },
  { id: 'text', label: '文本 token', role: '物体名词 wᵢ 作为 query 锚点。', x: 238, y: 26, w: 96, h: 44 },
  { id: 'attn', label: '跨注意力层', role: '计算名词到视觉 token 的注意力 A_{l,i}。', x: 238, y: 90, w: 96, h: 44 },
  { id: 'mask', label: '真值掩码', role: '训练期的二值掩码 Mᵢ，标注物体区域。', x: 354, y: 26, w: 96, h: 44 },
  { id: 'loss', label: 'BCE 损失', role: '对齐 Āᵢ 与 Mᵢ，只在训练期使用。', x: 354, y: 90, w: 96, h: 44 },
];

export const Mod8Arch: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sel: 'attn' });
  const [sel, setSel] = useState('attn');
  const [fb, setFb] = useState({ text: '点击管线中的组件，看它的作用与激活路径。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let raf = 0;
    const hit = (mx: number, my: number) => {
      for (const nd of NODES) {
        if (mx >= nd.x && mx <= nd.x + nd.w && my >= nd.y && my <= nd.y + nd.h) return nd;
      }
      return null;
    };
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (W / rect.width);
      const my = (e.clientY - rect.top) * (H / rect.height);
      const nd = hit(mx, my);
      if (nd) {
        stateRef.current.sel = nd.id; setSel(nd.id);
        setFb({ text: nd.role, cls: nd.id === 'mask' || nd.id === 'loss' ? 'good' : '' });
      }
    };
    canvas.addEventListener('click', onClick);
    const render = () => {
      const s = stateRef.current.sel;
      clearScene(ctx, W, H);
      sceneLabel(ctx, 'SWIM 训练管线（绿色分支仅在训练期启用）', 16, 14, C.ink, 14);
      // connector lines
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      const line = (a: typeof NODES[number], b: typeof NODES[number]) => {
        ctx.beginPath();
        ctx.moveTo(a.x + a.w, a.y + a.h / 2);
        ctx.lineTo(b.x, b.y + b.h / 2);
        ctx.stroke();
      };
      line(NODES[0], NODES[1]);
      line(NODES[1], NODES[3]);
      line(NODES[2], NODES[3]);
      line(NODES[3], NODES[5]);
      line(NODES[4], NODES[5]);
      NODES.forEach((nd) => {
        const isSel = nd.id === s;
        const isTrain = nd.id === 'mask' || nd.id === 'loss';
        ctx.fillStyle = isSel ? (isTrain ? C.green : C.blue) : '#eef3fb';
        ctx.fillRect(nd.x, nd.y, nd.w, nd.h);
        ctx.strokeStyle = isSel ? (isTrain ? C.green : C.blue) : C.border;
        ctx.lineWidth = isSel ? 2.5 : 1;
        ctx.strokeRect(nd.x, nd.y, nd.w, nd.h);
        ctx.fillStyle = isSel ? '#fff' : C.ink;
        ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(nd.label, nd.x + nd.w / 2, nd.y + nd.h / 2);
        ctx.textAlign = 'left';
      });
      // role panel
      const cur = NODES.find((nd) => nd.id === s) || NODES[3];
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.fillRect(16, 168, 528, 56);
      ctx.strokeRect(16, 168, 528, 56);
      ctx.fillStyle = C.blue;
      ctx.font = '13px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('组件 · ' + cur.label, 28, 178);
      ctx.fillStyle = C.ink;
      ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText(cur.role, 28, 200);
      ctx.textAlign = 'left';
    };
    const tick = () => { render(); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); raf = requestAnimationFrame(tick); };
    const stop = () => cancelAnimationFrame(raf);
    const start = () => { raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => { stop(); disconnect(); canvas.removeEventListener('click', onClick); };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="feedback good">绿色分支（真值掩码 → BCE 损失）只在训练期接入，推理时不出现。</div>
    </div>
  );
};
