import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// P1 sliders — three value-channel weights (w1 immediate, w2 environmental, w3 strategic).
const W = 1080;
const H = 280;
const GREEN = '#228d5c';
const BLUE = '#27446e';
const PURPLE = '#7c3aed';
const FELT = '#b8c9a7';
const TEXT = '#21324a';
const MUTED = '#68778f';

export const RewardWeight: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ w1: 1, w2: 1, w3: 1 });
  const [w1, setW1] = useState(1);
  const [w2, setW2] = useState(1);
  const [w3, setW3] = useState(1);
  const [feedback, setFeedback] = useState({ text: '拖动权重，观察三条价值通道如何构成估计价值。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { w1: number; w2: number; w3: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = FELT;
      ctx.fillRect(0, H * 0.72, W, H * 0.28);

      const items = [
        { w: s.w1, color: GREEN, label: 'φ_imm 即时', x: W * 0.16 },
        { w: s.w2, color: BLUE, label: 'φ_env 环境', x: W * 0.44 },
        { w: s.w3, color: PURPLE, label: 'φ_str 战略', x: W * 0.72 },
      ];
      const base = 1.0;
      items.forEach((it) => {
        const bh = (it.w / 2) * H * 0.5;
        ctx.fillStyle = it.color;
        ctx.fillRect(it.x, H * 0.72 - bh, 60, bh);
        ctx.fillStyle = TEXT;
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillText(it.label, it.x - 6, H * 0.78 + 16);
        ctx.fillStyle = MUTED;
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText(it.w.toFixed(1), it.x + 8, H * 0.72 - bh - 6);
      });
      const total = (s.w1 + s.w2 + s.w3) / 6;
      ctx.fillStyle = TEXT;
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('估计价值 V̂ = w₁·φ_imm + w₂·φ_env + w₃·φ_str  (总权重 ' + (s.w1 + s.w2 + s.w3).toFixed(1) + ')', W * 0.16, H * 0.12);
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

  const update = (which: 1 | 2 | 3, v: number) => {
    const s = stateRef.current;
    if (which === 1) s.w1 = v;
    else if (which === 2) s.w2 = v;
    else s.w3 = v;
    setW1(s.w1);
    setW2(s.w2);
    setW3(s.w3);
    if (s.w3 >= 1.6) setFeedback({ text: '战略权重占优：zap 收益被放大——合谋借此压制对手（紫）。', cls: 'bad' });
    else if (s.w2 >= 1.6) setFeedback({ text: '环境权重占优：清理驱动长期苹果增产（蓝）。', cls: '' });
    else setFeedback({ text: '三条通道相对均衡（绿）。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: '#228d5c' }} />φ_imm 即时（采苹果）</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#27446e' }} />φ_env 环境（清理）</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#7c3aed' }} />φ_str 战略（zap）</span>
      </div>
      <div className="ctrl">
        <label>w₁ 即时 <span className="val">{w1.toFixed(1)}</span></label>
        <input type="range" min={0} max={200} value={Math.round(w1 * 100)} onChange={(e) => update(1, Number(e.target.value) / 100)} />
      </div>
      <div className="ctrl">
        <label>w₂ 环境 <span className="val">{w2.toFixed(1)}</span></label>
        <input type="range" min={0} max={200} value={Math.round(w2 * 100)} onChange={(e) => update(2, Number(e.target.value) / 100)} />
      </div>
      <div className="ctrl">
        <label>w₃ 战略 <span className="val">{w3.toFixed(1)}</span></label>
        <input type="range" min={0} max={200} value={Math.round(w3 * 100)} onChange={(e) => update(3, Number(e.target.value) / 100)} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default RewardWeight;
