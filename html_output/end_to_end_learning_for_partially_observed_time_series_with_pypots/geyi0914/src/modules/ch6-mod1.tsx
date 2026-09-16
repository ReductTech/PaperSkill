import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §6 Module 6.1 — 适配手术：干净输入 → 出现 NaN 被拒 → 接上嵌入与 ORT/MIT → 通过。
const W = 1080;
const H = 280;
const BG = '#f5f8f0';
const LIGHT = '#b8c9a7';
const DARK = '#76906a';
const BLUE = '#27446e';
const RED = '#c43f52';
const GREEN = '#228d5c';
const PURPLE = '#7c3aed';
const BORDER = '#d7deea';

const STEPS = [
  '一个标准序列模型的输入层：它期待一份完整的张量。',
  '输入里出现了 NaN：原模型的输入层不接受缺失值，直接报错——这就是为什么不能直接把普通模型搬过来用。',
  '加上嵌入层与两个训练目标：ORT 让模型重建它已经看得见的值，MIT 让它预测被故意挖掉的值。这两项来自 SAITS 论文（arXiv:2202.08516）。',
  '同一个模型现在可以训练与推理了。注意：这里做的是适配，不是重写——模型主体没有变。',
];

export const Ch6Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({ text: STEPS[0], cls: '' });

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(3, next));
    stateRef.current.step = clamped;
    setStep(clamped);
    setFeedback({
      text: STEPS[clamped],
      cls: clamped === 1 ? 'bad' : clamped === 3 ? 'good' : '',
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { step: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = LIGHT;
      ctx.fillRect(0, 242, W, 22);
      ctx.strokeStyle = DARK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 242);
      ctx.lineTo(W, 242);
      ctx.stroke();

      // ---- input tensor block ----
      const bx = 60;
      const by = 80;
      const cw = 34;
      const chh = 26;
      const cols = 7;
      const rows = 4;
      const nanCells: [number, number][] = [
        [1, 2],
        [2, 5],
        [3, 1],
      ];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const isNaNCell = s.step >= 1 && nanCells.some(([rr, cc]) => rr === r && cc === c);
          ctx.fillStyle = isNaNCell ? RED : 'rgba(39,68,110,0.72)';
          ctx.fillRect(bx + c * cw, by + r * chh, cw - 4, chh - 4);
        }
      }
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx - 1, by - 1, cols * cw, rows * chh);

      // ---- gate node ----
      const gateX = 420;
      const gateY = 140;
      const rejected = s.step === 1;
      const adapted = s.step >= 2;
      ctx.fillStyle = rejected ? RED : adapted ? GREEN : BLUE;
      ctx.beginPath();
      ctx.arc(gateX, gateY, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = adapted || rejected ? '#21324a' : BORDER;
      ctx.lineWidth = 2;
      ctx.stroke();

      // ---- link ----
      ctx.strokeStyle = adapted ? GREEN : rejected ? RED : BORDER;
      ctx.lineWidth = rejected ? 2 : 3;
      ctx.beginPath();
      ctx.moveTo(bx + cols * cw, gateY);
      ctx.lineTo(gateX - 26, gateY);
      ctx.stroke();
      if (rejected) {
        ctx.strokeStyle = RED;
        ctx.beginPath();
        ctx.moveTo(gateX + 20, gateY - 22);
        ctx.lineTo(gateX + 34, gateY - 8);
        ctx.moveTo(gateX + 34, gateY - 22);
        ctx.lineTo(gateX + 20, gateY - 8);
        ctx.stroke();
      }

      // ---- right path ----
      const pathX = 520;
      const nodes: { label: string; x: number }[] = adapted
        ? [
            { label: '嵌入', x: pathX },
            { label: '模型', x: pathX + 150 },
            { label: '损失', x: pathX + 300 },
          ]
        : [
            { label: '模型', x: pathX + 80 },
            { label: '损失', x: pathX + 260 },
          ];
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(490, 60, 540, 170);
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(490, 60, 540, 170);

      nodes.forEach((n, i) => {
        const active = i === nodes.length - 1 || adapted;
        ctx.fillStyle = n.label === '嵌入' ? PURPLE : BLUE;
        ctx.globalAlpha = active ? 1 : 0.4;
        ctx.fillRect(n.x, 120, 96, 46);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = active && adapted ? GREEN : BORDER;
        ctx.lineWidth = active && adapted ? 2 : 1;
        ctx.strokeRect(n.x, 120, 96, 46);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px "Segoe UI", sans-serif';
        ctx.fillText(n.label, n.x + 26, 149);
      });
      ctx.strokeStyle = adapted ? GREEN : BORDER;
      ctx.lineWidth = adapted ? 3 : 2;
      for (let i = 0; i < nodes.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(nodes[i].x + 96, 143);
        ctx.lineTo(nodes[i + 1].x, 143);
        ctx.stroke();
      }

      ctx.fillStyle = '#21324a';
      ctx.font = '14px "Segoe UI", sans-serif';
      if (adapted) ctx.fillText('ℒ = ℒ_ORT + α · ℒ_MIT', 500, 210);

      // in-canvas labels (max 2)
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText('输入张量', 60, 60);
      ctx.fillText('模型路径', 500, 46);
    };

    const tick = () => {
      render(stateRef.current);
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

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny" type="button" onClick={() => go(step - 1)} disabled={step === 0}>
          上一步
        </button>
        <span className="step-label">
          第 <b>{step + 1}</b> / 4 步
        </span>
        <button className="tiny" type="button" onClick={() => go(step + 1)} disabled={step === 3}>
          {step === 3 ? '已完成' : '下一步'}
        </button>
        <button className="tiny" type="button" onClick={() => go(0)}>
          重来
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch6Mod1;
