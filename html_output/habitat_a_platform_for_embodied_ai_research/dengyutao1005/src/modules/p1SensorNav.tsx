import React, { useRef, useEffect, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560, H = 300;
const CX = 200, CY = 150;

// P1 滑块：控制转向角度与前进距离，看圆柱体 agent 在俯视图中的位移；撞墙会滑移（§4 Collision dynamics）。
export const P1SensorNav: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const state = useRef({ ang: 0, fwd: 0 });
  const [ang, setAng] = useState(0);
  const [fwd, setFwd] = useState(0);
  const [hit, setHit] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { ang: number; fwd: number }) => {
      ctx.clearRect(0, 0, W, H);
      // grid
      ctx.strokeStyle = '#eef1f5';
      for (let x = 40; x < W - 40; x += 40) { ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, H - 30); ctx.stroke(); }
      for (let y = 30; y < H - 30; y += 40) { ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(W - 60, y); ctx.stroke(); }
      // obstacle wall (right side)
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(W - 60, 40, 14, H - 90);
      ctx.fillStyle = '#9aa5b1';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('墙', W - 58, 34);

      const rad = (s.ang * Math.PI) / 180;
      const dist = s.fwd * 0.9; // scale
      // check collision: target x beyond wall region
      let tx = CX + Math.cos(rad) * dist;
      let ty = CY + Math.sin(rad) * dist;
      let slid = false;
      if (tx > W - 60 - 12) { tx = W - 60 - 12; slid = true; }
      setHit(slid);

      ctx.strokeStyle = slid ? '#dc2626' : '#2563eb';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.setLineDash([]);

      // agent
      ctx.fillStyle = '#2563eb';
      ctx.beginPath(); ctx.arc(CX, CY, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1d4ed8';
      ctx.beginPath(); ctx.moveTo(CX, CY - 18); ctx.lineTo(CX + 6, CY - 10); ctx.lineTo(CX - 6, CY - 10); ctx.closePath(); ctx.fill();
      // displaced (slid) position
      ctx.fillStyle = slid ? '#dc2626' : '#16a34a';
      ctx.beginPath(); ctx.arc(tx, ty, 8, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#21324a';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText(`转向 ${Math.round(s.ang)}°  前进 ${s.fwd.toFixed(2)}m${slid ? '  → 碰撞滑移！' : ''}`, 40, H - 8);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    render(state.current);
    const tick = () => { render(state.current); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const onChange = (k: 'ang' | 'fwd', v: number) => {
    state.current[k] = v;
    if (k === 'ang') setAng(v); else setFwd(v);
  };

  return (
    <div>
      <canvas id="sensor-nav-cv" ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>转向角 <span className="val">{ang}°</span></label>
        <input type="range" min={-180} max={180} value={ang} onChange={(e) => onChange('ang', Number(e.target.value))} />
      </div>
      <div className="ctrl">
        <label>前进距离 <span className="val">{fwd.toFixed(2)}m</span></label>
        <input type="range" min={0} max={1} step={0.01} value={fwd} onChange={(e) => onChange('fwd', Number(e.target.value))} />
      </div>
      <div className={`feedback ${hit ? 'bad' : 'good'}`}>
        {hit
          ? '碰撞！move_forward(0.25m) 却只挪了部分，甚至沿墙滑开——里程计不平凡（§4）。'
          : 'agent 在连续状态空间移动，无碰撞时可精确到位移（§4）。'}
      </div>
    </div>
  );
};

export default P1SensorNav;
