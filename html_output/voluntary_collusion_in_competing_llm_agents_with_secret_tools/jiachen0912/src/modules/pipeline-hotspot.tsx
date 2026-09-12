import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// P5 hotspots — click one of five framework stages (offer -> decision -> alliance -> gameplay -> metric).
const W = 1080;
const H = 280;
const BLUE = '#27446e';
const GREEN = '#228d5c';
const ORANGE = '#f07e47';
const TEXT = '#21324a';
const MUTED = '#68778f';

const stages = [
  { key: 'offer', label: '提议', desc: '提议：向智能体呈现两件明确标注“不公平”的秘密工具。' },
  { key: 'decision', label: '决策', desc: '决策：接受/拒绝，并选定一名同伙。' },
  { key: 'alliance', label: '结盟', desc: '结盟：发出邀请，等待对方回应。' },
  { key: 'gameplay', label: '对局', desc: '对局：50/20 局观察策略变化（挑战率、清理率等）。' },
  { key: 'metric', label: '度量', desc: '度量：接受率、伙伴选择、对局行为、公平性 E。' },
];

export const PipelineHotspot: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ idx: 0 });
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState({ text: '点击一个阶段查看。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { idx: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      const n = stages.length;
      const y = H * 0.4;
      for (let i = 0; i < n; i++) {
        const x = W * 0.12 + (i * W * 0.76) / (n - 1);
        if (i < n - 1) {
          ctx.strokeStyle = '#d7deea';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x + 20, y);
          ctx.lineTo(x + W * 0.76 / (n - 1) - 20, y);
          ctx.stroke();
        }
        const sel = i === s.idx;
        ctx.fillStyle = sel ? BLUE : '#ffffff';
        ctx.strokeStyle = sel ? BLUE : '#c9d2e0';
        ctx.lineWidth = sel ? 4 : 2;
        ctx.beginPath();
        ctx.roundRect(x - 20, y - 20, 40, 40, 8);
        ctx.fill();
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillStyle = sel ? '#ffffff' : TEXT;
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText(stages[i].label, x, y - 30);
        ctx.fillStyle = TEXT;
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.fillText(String(i + 1), x, y + 6);
        ctx.textAlign = 'left';
      }
    };
    let rafId = 0;
    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafId = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };
    const start = () => {
      if (!rafId) rafId = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const i = Math.max(0, Math.min(stages.length - 1, Math.round((x - W * 0.12) / (W * 0.76 / (stages.length - 1)))));
    stateRef.current.idx = i;
    setIdx(i);
    setFeedback({ text: stages[i].desc, cls: i === stages.length - 1 ? 'good' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} onClick={onClick} style={{ cursor: 'pointer' }} />
      <div className="legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: '#27446e' }} />蓝色＝当前选中的阶段</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#d7deea' }} />点击任意节点查看该阶段测什么</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default PipelineHotspot;
