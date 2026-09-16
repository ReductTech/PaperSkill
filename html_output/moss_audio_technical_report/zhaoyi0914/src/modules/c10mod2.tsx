import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch10.2 — whole-tutorial summary (P2 step-through).
// Walks the causal chain: problem -> architecture -> data -> training -> results.
const W = 1080;
const H = 280;
const NODES = [
  { title: '问题', desc: '统一音频理解受限于单层前端与缺失的绝对时间线索' },
  { title: '架构', desc: '专用编码器 + DeepStack 跨层注入 + 显式时间标记' },
  { title: '数据管道', desc: '事件保持切分 + 三分支标注 + Router-R1 合并' },
  { title: '训练', desc: '三目标预训练（30/40/30）+ SFT/冷启动/DAPO 后训练' },
  { title: '结果', desc: '通用理解、语音描述、ASR、时间戳 ASR 均取得强结果' },
];
const MAX_STEP = NODES.length;

export const C10Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [fb, setFb] = useState({ text: '点击下一步，回顾全篇的因果链。', cls: '' });

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
      const n = NODES.length;
      const x0 = 60;
      const w = (W - 120) / n;
      NODES.forEach((node, i) => {
        const x = x0 + i * w;
        const on = i < k;
        const active = i === k - 1;
        ctx.fillStyle = active ? '#228d5c' : on ? '#27446e' : '#d7deea';
        ctx.fillRect(x + 8, 100, w - 26, 54);
        ctx.fillStyle = on ? '#ffffff' : '#68778f';
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillText(node.title, x + 22, 133);
        if (i < n - 1) {
          ctx.strokeStyle = i < k - 1 ? '#27446e' : '#d7deea';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + w - 18, 127);
          ctx.lineTo(x + w + 6, 127);
          ctx.stroke();
        }
      });
      if (k > 0) {
        ctx.fillStyle = '#21324a';
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillText(NODES[k - 1].desc, 60, 210);
      } else {
        ctx.fillStyle = '#b8c9a7';
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillText('点击“下一步”，沿因果链回顾：问题 → 架构 → 数据 → 训练 → 结果。', 60, 200);
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
    setFb({ text: s === 0 ? '点击下一步，回顾全篇的因果链。' : NODES[s - 1].title + '：' + NODES[s - 1].desc, cls: s === MAX_STEP ? 'good' : '' });
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
        <span className="val">第 {step} 步 / {MAX_STEP}</span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default C10Mod2;
