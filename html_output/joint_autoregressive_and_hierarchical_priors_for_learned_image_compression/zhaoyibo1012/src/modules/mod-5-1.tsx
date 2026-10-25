import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const MODES: Record<string, { label: string; sideCost: number; saving: number }> = {
  gsm: { label: '只尺度 GSM', sideCost: 0.2, saving: 0.3 },
  gauss: { label: '均值+尺度 高斯', sideCost: 0.38, saving: 0.55 },
  context: { label: '加上下文', sideCost: 0.05, saving: 0.7 },
};

export const Mod51: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ mode: 'gsm' });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState('gsm');
  const [feedback, setFeedback] = useState({ text: 'GSM：只给尺度，边信息最省但熵模型弱。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = () => {
      const m = MODES[stateRef.current.mode] || MODES.gsm;
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, H - 30, W, 30);

      const tilt = (m.saving - m.sideCost) * 0.5;
      ctx.save();
      ctx.translate(300, 120);
      ctx.rotate(tilt);
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-260, 0);
      ctx.lineTo(260, 0);
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.moveTo(300, 120);
      ctx.lineTo(282, 156);
      ctx.lineTo(318, 156);
      ctx.closePath();
      ctx.fillStyle = '#92400e';
      ctx.fill();

      const lw = 30 + m.sideCost * 90;
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(40 - lw / 2, 156, lw, 46);
      const rw = 30 + m.saving * 90;
      ctx.fillStyle = '#228d5c';
      ctx.fillRect(560 - rw / 2, 156, rw, 46);

      ctx.fillStyle = '#21324a';
      ctx.font = '22px "Segoe UI", sans-serif';
      ctx.fillText('边信息代价', 40, 32);
      ctx.fillText('码率节省', 560, 32);

      const bx = 40;
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(bx, H - 44 - m.sideCost * 120, 200, m.sideCost * 120);
      ctx.fillStyle = '#228d5c';
      ctx.fillRect(560, H - 44 - m.saving * 120, 200, m.saving * 120);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, H - 164, 200, 120);
      ctx.strokeRect(560, H - 164, 200, 120);
      ctx.fillStyle = '#68778f';
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.fillText((m.sideCost * 100).toFixed(0) + '%', bx + 8, H - 48);
      ctx.fillText((m.saving * 100).toFixed(0) + '%', 568, H - 48);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
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

  const pick = (id: string) => {
    stateRef.current.mode = id;
    setMode(id);
    if (id === 'gsm') setFeedback({ text: 'GSM：只给尺度，边信息最省但熵模型弱。', cls: '' });
    else if (id === 'gauss') setFeedback({ text: '高斯(均值+尺度)：多给均值，边信息多一点、换来更准。', cls: 'good' });
    else setFeedback({ text: '加上下文：不花边信息、靠邻居补细节。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {Object.keys(MODES).map((id) => (
          <button key={id} className={`chip ${mode === id ? 'selected' : ''}`} onClick={() => pick(id)}>
            {MODES[id].label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Mod51;
