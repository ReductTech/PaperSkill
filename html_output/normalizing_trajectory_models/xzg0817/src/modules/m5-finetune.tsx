import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { K, drawPhotoCard, drawLabel, roundRect, drawCheck } from './ana-scene';

const W = 560, H = 280;
type Mode = 'scratch' | 'ft-aux' | 'ft-noaux';

/** Schematic training-loss curves; u∈[0,1] is training progress. */
function loss(mode: Mode, u: number): number {
  if (mode === 'scratch') return 0.15 + 0.8 * Math.exp(-u * 3.2);          // high start, slow decay
  if (mode === 'ft-aux') return 0.18 + 0.1 * Math.exp(-u * 6) + 0.02 * Math.sin(u * 20) * Math.exp(-u * 3);
  // ft-noaux: starts fine, then diverges early (Fig 7a)
  return u < 0.25 ? 0.24 + 0.05 * Math.sin(u * 30) : 0.24 + (u - 0.25) * 2.6;
}

const INFO: Record<Mode, { text: string; cls: string; photoNoise: number; note: string }> = {
  scratch: {
    text: '从零学起：完全可行——256² 从头训练、4 步采样，GenEval 就是 0.82。代价是需要完整的训练预算。',
    cls: 'good',
    photoNoise: 0.1,
    note: '随机初始化，纯 NLL 训练',
  },
  'ft-aux': {
    text: '微调 + 均值对齐：辅助损失把预测器锚在预训练解附近，稳定收敛（论文图 7b），512² 用 FLUX.2-klein 4B 做骨干。',
    cls: 'good',
    photoNoise: 0.05,
    note: 'λ = 2.5，余弦退火',
  },
  'ft-noaux': {
    text: '微调但不加对齐损失：没有锚，NLL 单独驱动，训练早期损失就飞了（论文图 7a）——画质随之崩塌。',
    cls: 'bad',
    photoNoise: 0.85,
    note: '早期发散',
  },
};

export const M5Finetune: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ mode: Mode; t0: number }>({ mode: 'ft-aux', t0: 0 });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>('ft-aux');
  const [feedback, setFeedback] = useState({ text: INFO['ft-aux'].text, cls: INFO['ft-aux'].cls });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    stateRef.current.t0 = performance.now() / 1000;

    const render = () => {
      const s = stateRef.current;
      const prog = clamp((performance.now() / 1000 - s.t0) / 2.2, 0, 1); // curve draws in
      ctx.fillStyle = K.bg;
      ctx.fillRect(0, 0, W, H);

      // ---- loss curve plot ----
      const gx = 44, gy = 42, gw = 300, gh = 168;
      drawLabel(ctx, '训练损失（示意）', gx, 26, K.text, 13);
      ctx.strokeStyle = K.border;
      ctx.strokeRect(gx, gy, gw, gh);
      const diverged = s.mode === 'ft-noaux';
      ctx.strokeStyle = diverged ? K.red : K.green;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let clipped = false;
      for (let i = 0; i <= 100 * prog; i++) {
        const u = i / 100;
        const v = loss(s.mode, u);
        const py = gy + gh - clamp(1 - v, 0, 1) * gh * 0.9 - gh * 0.05;
        if (py < gy) { clipped = true; break; }
        if (i === 0) ctx.moveTo(gx + u * gw, py);
        else ctx.lineTo(gx + u * gw, py);
      }
      ctx.stroke();
      if (clipped && prog > 0.4) drawLabel(ctx, '发散 ↑', gx + gw * 0.5, gy + 16, K.red, 12);
      drawLabel(ctx, '训练进度 →', gx + gw - 66, gy + gh + 16, K.muted, 11);
      drawLabel(ctx, '↑ 损失（越低越好）', gx, gy + gh + 16, K.muted, 11);

      // ---- result photo ----
      const info = INFO[s.mode];
      const shownNoise = prog < 1 ? Math.min(0.5, info.photoNoise) + (1 - prog) * 0.3 : info.photoNoise;
      drawPhotoCard(ctx, 372, 42, 96, 76, shownNoise, 97);
      if (prog >= 1 && info.photoNoise < 0.2) drawCheck(ctx, 464, 50);
      drawLabel(ctx, prog >= 1 ? info.note : '训练中…', 372, 132, prog >= 1 ? (info.photoNoise < 0.2 ? K.green : K.red) : K.muted, 11);

      // ---- initialization recipe card ----
      roundRect(ctx, 364, 150, 172, 108, 5);
      ctx.fillStyle = K.card;
      ctx.fill();
      ctx.strokeStyle = K.border;
      ctx.stroke();
      drawLabel(ctx, '初始化配方（§3.3）', 376, 166, K.text, 12);
      const lines = s.mode === 'scratch'
        ? ['随机初始化', 'T ∈ {4,8,16} 随机采样', '纯精确 NLL 目标', '（不需要预训练骨干）']
        : ['f_T = id（恒等搬运器）', 'μ_P = μ_post（后验均值）', 'δ_σ = 0（零初始化）',
           s.mode === 'ft-aux' ? 'L_aux 开 · λ=2.5 退火' : 'L_aux 关 ←问题就在这'];
      lines.forEach((ln, i) => {
        const isBad = s.mode === 'ft-noaux' && i === 3;
        drawLabel(ctx, ln, 376, 186 + i * 18, isBad ? K.red : K.muted, 11);
      });
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

  const pick = (m: Mode) => {
    stateRef.current.mode = m;
    stateRef.current.t0 = performance.now() / 1000;
    setMode(m);
    setFeedback({ text: INFO[m].text, cls: INFO[m].cls });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${mode === 'scratch' ? 'selected' : ''}`} onClick={() => pick('scratch')}>
          从头训练
        </button>
        <button className={`chip ${mode === 'ft-aux' ? 'selected' : ''}`} onClick={() => pick('ft-aux')}>
          微调 · 带均值对齐
        </button>
        <button className={`chip ${mode === 'ft-noaux' ? 'selected' : ''}`} onClick={() => pick('ft-noaux')}>
          微调 · 不带对齐
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
