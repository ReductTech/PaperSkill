import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Chap7Mod1 — Full training pipeline 6 steps vs late-alignment 3 steps (P2).
// Two rows; per-step click through.

const W = 560;
const H = 260;

const BABEL_STEPS = [
  { title: '① 准备多模态指令数据', desc: 'Million-AID + SARLang + MMRS-1M + VHM + ...' },
  { title: '② CSIA 预训练', desc: 'L_align 训练约 14k 步' },
  { title: '③ LVSA 退火 (τ=6k)', desc: '中间层 {3, 9, 18, 24} 平滑并入' },
  { title: '④ 加载对齐编码器', desc: '把权重载入检测器主干' },
  { title: '⑤ 简单联合微调', desc: 'Loss_total = Σ_n Loss_n' },
  { title: '⑥ 评估 H-mAP', desc: '53.02（SOTA, Table 2）' },
];

const LATE_STEPS = [
  { title: '① 加载通用编码器', desc: '用 CLIP / MAE / DINOv2 等权重' },
  { title: '② 微调时同时优化对齐+检测', desc: '同一阶段的联合损失' },
  { title: '③ 不稳定', desc: 'AMP 下 4 种基线 NaN，曲线震荡' },
];

export const Chap7Mod1: React.FC<WidgetProps> = () => {
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

      // row labels
      ctx.fillStyle = '#228d5c';
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('BabelRS', 20, 50);
      ctx.fillStyle = '#c43f52';
      ctx.fillText('晚期对齐', 20, 200);

      // row 1: 6 steps
      const w1 = (W - 50) / 6;
      for (let i = 0; i < 6; i++) {
        const cx = 40 + i * w1 + w1 / 2;
        const cy = 50;
        const done = i < s.step;
        const active = i === s.step;
        ctx.fillStyle = done ? '#228d5c' : active ? '#228d5c' : '#fff';
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = done || active ? '#fff' : '#228d5c';
        ctx.font = 'bold 10px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), cx, cy);
        if (i < 5) {
          ctx.strokeStyle = i < s.step ? '#228d5c' : '#d7deea';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(cx + 12, cy);
          ctx.lineTo(cx + w1 - 12, cy);
          ctx.stroke();
        }
        ctx.fillStyle = '#21324a';
        ctx.font = '9px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(BABEL_STEPS[i].title, cx, 78);
      }

      // row 2: 3 steps
      const w2 = (W - 50) / 3;
      for (let i = 0; i < 3; i++) {
        const cx = 40 + i * w2 + w2 / 2;
        const cy = 200;
        const active = i === Math.min(s.step, 2);
        const danger = active && i === 1;
        ctx.fillStyle = danger ? '#c43f52' : active ? '#c43f52' : '#fff';
        ctx.strokeStyle = '#c43f52';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), cx, cy);
        if (i < 2) {
          ctx.strokeStyle = '#d7deea';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(cx + 12, cy);
          ctx.lineTo(cx + w2 - 12, cy);
          ctx.stroke();
        }
        ctx.fillStyle = '#21324a';
        ctx.font = '9px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(LATE_STEPS[i].title, cx, 228);
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };

    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(render); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const go = (delta: number) => {
    const n = Math.max(0, Math.min(5, step + delta));
    stateRef.current.step = n;
    stateRef.current.anim = 0;
    setStep(n);
  };

  const curBabel = BABEL_STEPS[step];
  const curLate = LATE_STEPS[Math.min(step, 2)];

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => go(-1)} disabled={step === 0}>← 上一步</button>
        <span className="step-label">Step <b>{step + 1}</b> / 6</span>
        <button className="tiny" onClick={() => go(1)} disabled={step === 5}>下一步 →</button>
      </div>
      <div className="three-col-demo">
        <div className="three-col-panel clean">
          <div className="three-col-label" style={{ color: '#228d5c' }}>BabelRS · {curBabel.title}</div>
          <div style={{ color: '#21324a', fontSize: 13, textAlign: 'center' }}>{curBabel.desc}</div>
        </div>
        <div className="three-col-panel noisy">
          <div className="three-col-label" style={{ color: '#c43f52' }}>晚期对齐 · {curLate.title}</div>
          <div style={{ color: '#21324a', fontSize: 13, textAlign: 'center' }}>{curLate.desc}</div>
        </div>
        <div className="three-col-panel recover">
          <div className="three-col-label" style={{ color: '#27446e' }}>关键差异</div>
          <div style={{ color: '#21324a', fontSize: 13, textAlign: 'center' }}>
            BabelRS 把对齐<b>提前</b>到独立预训练；晚期对齐在微调阶段同时做两件事。
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chap7Mod1;
