import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch8.2 — DAPO reinforcement learning details (P2 step-through, paper §5.3).
// Steps: sample & score -> dynamic filtering of zero-std groups -> clipped DAPO
// objective. Hyperparameters are the paper's reported values.
const W = 1080;
const H = 280;
const MAX_STEP = 3;
const STAGE = ['采样与打分', '动态过滤', '裁剪更新'];

// 16 responses grouped into 4 groups of 4; rewards 0..1.
const GROUPS = [
  [0.8, 0.6, 0.7, 0.5],
  [0.4, 0.4, 0.4, 0.4], // zero std -> filtered
  [0.9, 0.7, 0.8, 0.6],
  [0.3, 0.3, 0.3, 0.3], // zero std -> filtered
];

export const C8Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [fb, setFb] = useState({ text: '点击下一步，查看 DAPO 强化学习的关键步骤。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (k: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillStyle = '#21324a';

      if (k === 1) {
        // sample & score
        ctx.fillText('一个 prompt 采样 16 条回复并打分', 60, 40);
        GROUPS.forEach((g, gi) => {
          g.forEach((r, ri) => {
            const x = 80 + gi * 250 + ri * 50;
            const h = r * 120;
            ctx.fillStyle = '#27446e';
            ctx.fillRect(x, 220 - h, 32, h);
            ctx.fillStyle = '#68778f';
            ctx.font = '12px "Segoe UI", sans-serif';
            ctx.fillText(r.toFixed(1), x + 4, 214 - h);
            ctx.font = '15px "Segoe UI", sans-serif';
          });
        });
        ctx.fillStyle = '#21324a';
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText('温度 1.0 · top-p 1.0 · top-k 50 · 批大小 128 · 最长 2048 token', 60, 258);
      } else if (k === 2) {
        // dynamic filtering
        ctx.fillText('丢弃奖励标准差为 0 的组（无组内优势信号）', 60, 40);
        GROUPS.forEach((g, gi) => {
          const zero = new Set(g).size === 1;
          const baseX = 80 + gi * 250;
          ctx.globalAlpha = zero ? 0.25 : 1;
          g.forEach((r, ri) => {
            const x = baseX + ri * 50;
            const h = r * 120;
            ctx.fillStyle = '#27446e';
            ctx.fillRect(x, 220 - h, 32, h);
          });
          ctx.globalAlpha = 1;
          if (zero) {
            ctx.strokeStyle = '#c43f52';
            ctx.lineWidth = 3;
            ctx.strokeRect(baseX - 6, 92, 212, 136);
            ctx.fillStyle = '#c43f52';
            ctx.font = '14px "Segoe UI", sans-serif';
            ctx.fillText('丢弃 + 过采样补足', baseX, 84);
          }
        });
      } else if (k === 3) {
        // clipped DAPO objective + hyperparameters
        ctx.fillText('裁剪 DAPO 目标', 60, 46);
        ctx.fillStyle = '#27446e';
        ctx.fillRect(60, 70, 480, 60);
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.fillText('clip(ratio, 1−ε, 1+ε_high) · A', 90, 108);
        const rows = [
          ['下界 ε', '0.2'],
          ['上界 ε_high', '0.28'],
          ['TIS 阈值', '2.0'],
          ['TIS 下界', '0.0'],
        ];
        rows.forEach(([k1, v], i) => {
          const y = 70 + i * 40;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(620, y, 360, 34);
          ctx.strokeStyle = '#d7deea';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(620, y, 360, 34);
          ctx.fillStyle = '#21324a';
          ctx.font = '14px "Segoe UI", sans-serif';
          ctx.fillText(k1, 636, y + 22);
          ctx.fillStyle = '#228d5c';
          ctx.fillText(v, 900, y + 22);
        });
        ctx.fillStyle = '#68778f';
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText('token 级重要性采样修正（TIS）稳定训练', 60, 150);
      } else {
        ctx.fillStyle = '#b8c9a7';
        ctx.fillText('点击“下一步”：采样打分 → 动态过滤 → 裁剪更新。', 60, 140);
      }
    };
    const tick = () => {
      render(stateRef.current.step);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const go = (d: number) => {
    const s = Math.max(0, Math.min(MAX_STEP, step + d));
    stateRef.current.step = s;
    setStep(s);
    const msgs = [
      '点击下一步，查看 DAPO 强化学习的关键步骤。',
      '第 1 步：每个 prompt 采样 16 条回复，按正确性、质量、格式、推理打分。',
      '第 2 步：动态过滤——丢弃奖励标准差为 0 的组，用额外过采样补足批次。',
      '第 3 步：裁剪 DAPO 目标（ε=0.2、ε_high=0.28）+ token 级重要性采样修正（TIS=2.0）。',
    ];
    setFb({ text: msgs[s], cls: s === MAX_STEP ? 'good' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={() => go(1)} disabled={step === MAX_STEP}>
          下一步
        </button>
        <button type="button" onClick={() => go(-step)} disabled={step === 0}>
          重置
        </button>
        <span className="val">
          {step === 0 ? '未开始' : STAGE[step - 1]} · 第 {step} 步 / {MAX_STEP}
        </span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default C8Mod2;
