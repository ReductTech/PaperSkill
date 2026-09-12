import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// P5 clickable hotspots — choose one of two environments (Liar's Bar vs Cleanup).
const W = 1080;
const H = 280;
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const FELT = '#b8c9a7';
const FELT_DARK = '#76906a';
const TEXT = '#21324a';
const MUTED = '#68778f';

type Env = 'none' | 'liars' | 'cleanup';

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const EnvPick: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ env: Env }>({ env: 'none' });
  const [feedback, setFeedback] = useState({ text: '点击一张牌查看环境。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { env: Env }) => {
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

      const draw = (cx: number, face: 'liars' | 'cleanup', sel: boolean) => {
        const w = 130;
        const h = 110;
        const x = cx - w / 2;
        const y = H * 0.18;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = sel ? BLUE : FELT_DARK;
        ctx.lineWidth = sel ? 5 : 2;
        rr(ctx, x, y, w, h, 8);
        ctx.fill();
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillStyle = TEXT;
        ctx.font = '20px "Segoe UI", sans-serif';
        ctx.fillText(face === 'liars' ? '🂠 欺骗牌局' : '🪙 共享底池', cx, y + 42);
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillStyle = MUTED;
        ctx.fillText(face === 'liars' ? 'Liar’s Bar' : 'Cleanup', cx, y + 66);
        ctx.textAlign = 'left';
      };

      draw(W * 0.3, 'liars', s.env === 'liars');
      draw(W * 0.7, 'cleanup', s.env === 'cleanup');
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
    const env: Env = x < W / 2 ? 'liars' : 'cleanup';
    stateRef.current.env = env;
    setFeedback(
      env === 'liars'
        ? { text: '欺骗牌局：隐瞒与揭穿，检验信息不对称（不完全信息、验证不对称）。', cls: '' }
        : { text: '共享底池：公共维护与私利获取（混合动机、公地管理）。', cls: 'good' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} onClick={onClick} style={{ cursor: 'pointer' }} />
      <div className="legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: '#27446e' }} />蓝色描边＝当前查看的环境</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#b8c9a7' }} />点击左侧「欺骗牌局」或右侧「共享底池」切换</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default EnvPick;
