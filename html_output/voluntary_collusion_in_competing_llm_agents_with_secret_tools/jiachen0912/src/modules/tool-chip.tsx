import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// P4 mode chips — switch between the two secret tools (channel vs hint).
const W = 1080;
const H = 280;
const BLUE = '#27446e';
const GREEN = '#228d5c';
const ORANGE = '#f07e47';
const FELT = '#b8c9a7';
const FELT_DARK = '#76906a';
const TEXT = '#21324a';
const MUTED = '#68778f';

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

type Tool = 'comm' | 'hint';

export const ToolChip: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ tool: Tool }>({ tool: 'comm' });
  const [tool, setTool] = useState<Tool>('comm');
  const [feedback, setFeedback] = useState({ text: '切换工具查看机制。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { tool: Tool }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = FELT;
      ctx.fillRect(0, H * 0.66, W, H * 0.34);
      ctx.strokeStyle = FELT_DARK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, H * 0.66);
      ctx.lineTo(W, H * 0.66);
      ctx.stroke();

      if (s.tool === 'comm') {
        // a folded note sliding under the table (blue)
        const t = (performance.now() / 1000) % 2.4;
        const x = W * 0.2 + (t / 2.4) * (W * 0.4);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = BLUE;
        ctx.lineWidth = 2;
        rr(ctx, x, H * 0.42, 40, 24, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = BLUE;
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText('密信', x + 9, H * 0.42 + 16);
        ctx.fillStyle = MUTED;
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillText('秘密通信通道：与同伙私下协调，隐藏于普通交流', W * 0.1, H * 0.86);
      } else {
        // a whispered tip card (orange)
        const t = (performance.now() / 1000) % 2.4;
        const y = H * 0.4 - Math.abs(Math.sin((t / 2.4) * Math.PI * 2)) * 14;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = ORANGE;
        ctx.lineWidth = 2;
        rr(ctx, W * 0.4, y, 50, 70, 5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = ORANGE;
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText('答案', W * 0.4 + 11, y + 38);
        ctx.fillStyle = MUTED;
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillText('秘密策略提示：独享最优策略，仍须选定同伙', W * 0.1, H * 0.86);
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

  const select = (t: Tool) => {
    stateRef.current.tool = t;
    setTool(t);
    setFeedback(
      t === 'comm'
        ? { text: '秘密通信：双方用隐蔽频道协调策略，非合谋者毫不知情。', cls: '' }
        : { text: '秘密提示：独享最优策略，但需提名并互相同意的同伙——因此属于合谋而非单纯信息不对称。', cls: 'good' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: '#27446e' }} />密信（蓝）＝秘密通信通道</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#f07e47' }} />答案（橙）＝秘密策略提示</span>
      </div>
      <div className="chip-row">
        <button className={`chip ${tool === 'comm' ? 'selected' : ''}`} onClick={() => select('comm')}>秘密通信通道</button>
        <button className={`chip ${tool === 'hint' ? 'selected' : ''}`} onClick={() => select('hint')}>秘密策略提示</button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ToolChip;
