import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Chap6Mod1 — Fine-tune step-through (P2). Four numbered steps.

const W = 560;
const H = 240;

const STEPS: Array<{ title: string; desc: string; loss: number; color: string; feedback: string; cls: string }> = [
  { title: '① 加载对齐好的编码器', desc: '把 CSIA+LVSA 预训练后的 E_M 权重加载到检测器。', loss: 1.0, color: '#27446e', feedback: '准备阶段：把预训练好的视觉编码器 <b>E_M</b> 加载到检测器主干。', cls: '' },
  { title: '② 初始化模态检测头', desc: '为 RGB / SAR / IR 各初始化一个检测头，共享主干。', loss: 0.95, color: '#27446e', feedback: '准备阶段：每个模态对应一个独立检测头，<b>共享主干</b>。', cls: '' },
  { title: '③ 联合训练', desc: 'Loss_total = Σ_n Loss_n——没有任何对齐损失。', loss: 0.55, color: '#228d5c', feedback: '<b>联合训练</b> 稳定收敛：Loss_total = Σ_n Loss_n，无对齐项。', cls: 'good' },
  { title: '④ 评估 H-mAP', desc: '在 SOI-Det 上评估 H-mAP 53.02（SOTA）。', loss: 0.45, color: '#d97706', feedback: '评估结果：H-mAP = 53.02，达到 SOTA（论文 Table 2）。', cls: 'good' },
];

export const Chap6Mod1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0, anim: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      const s = stateRef.current;
      s.anim = Math.min(1, s.anim + 0.05);
      const a = easeOutCubic(s.anim);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const stepW = (W - 60) / 4;
      const stepY = 80;
      for (let i = 0; i < 4; i++) {
        const cx = 30 + i * stepW + stepW / 2;
        const done = i < s.step;
        const active = i === s.step;
        ctx.fillStyle = done ? '#228d5c' : active ? STEPS[i].color : '#fff';
        ctx.strokeStyle = STEPS[i].color;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(cx, stepY, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = done || active ? '#fff' : STEPS[i].color;
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), cx, stepY);

        if (i < 3) {
          ctx.strokeStyle = i < s.step ? '#228d5c' : '#d7deea';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx + 16, stepY);
          ctx.lineTo(cx + stepW - 16, stepY);
          ctx.stroke();
        }

        ctx.fillStyle = '#21324a';
        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(STEPS[i].title, cx, 110);
      }

      // loss curve
      const ox = 30, oy = 160, w = W - 60, h = 50;
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ox, oy); ctx.lineTo(ox, oy + h); ctx.lineTo(ox + w, oy + h);
      ctx.stroke();
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= s.step; i++) {
        const t = i / 3;
        const v = STEPS[i].loss;
        const px = ox + t * w;
        const py = oy + h - v * h * a;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      if (s.step >= 0) {
        const t = s.step / 3;
        const v = STEPS[s.step].loss;
        const px = ox + t * w;
        const py = oy + h - v * h * a;
        ctx.fillStyle = STEPS[s.step].color;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#68778f';
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('loss', ox - 4, oy + 8);
      ctx.textAlign = 'left';
      ctx.fillText('step →', ox + w - 36, oy + h - 4);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };

    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(render); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const go = (delta: number) => {
    const n = Math.max(0, Math.min(3, step + delta));
    stateRef.current.step = n;
    stateRef.current.anim = 0;
    setStep(n);
  };

  const cur = STEPS[step];

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => go(-1)} disabled={step === 0}>← 上一步</button>
        <span className="step-label">Step <b>{step + 1}</b> / 4</span>
        <button className="tiny" onClick={() => go(1)} disabled={step === 3}>下一步 →</button>
      </div>
      <div className={`feedback ${cur.cls}`} dangerouslySetInnerHTML={{ __html: cur.feedback }} />
    </div>
  );
};

export default Chap6Mod1;
