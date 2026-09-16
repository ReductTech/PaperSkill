import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §4 Module 4.2 (P1 slider, technical): change the motion limit, watch the door swing amplitude.
const W = 1080;
const H = 280;

export const Ch4Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ limitDeg: 90 });
  const rafRef = useRef<number | null>(null);
  // displayed limit angle (radians) eases toward the slider value so the
  // door's swing envelope never jumps when the slider moves
  const dispRef = useRef({ rad: (90 * Math.PI) / 180, lastT: -1 });
  const [limitDeg, setLimitDeg] = useState(90);
  const [feedback, setFeedback] = useState({ text: '上限 90°：开合顺畅且安全。', cls: 'good' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (time: number) => {
      const s = stateRef.current;
      const d = dispRef.current;
      // time-based exponential damping, stable at any refresh rate
      const dt = d.lastT < 0 ? 0 : clamp((time - d.lastT) / 1000, 0, 0.05);
      d.lastT = time;
      const target = (s.limitDeg * Math.PI) / 180;
      d.rad += (target - d.rad) * (1 - Math.exp(-dt * 7));
      if (Math.abs(target - d.rad) < 0.0005) d.rad = target;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, 248, W, 6);
      // cabinet body (side cross-section): box to the RIGHT of the hinge;
      // the door covers the front face when closed and swings OUTWARD
      // (up-left), so it can never clip into the cabinet
      const hx = 480;
      const hy = 70;
      const doorLen = 150;
      ctx.fillStyle = '#92400e';
      ctx.fillRect(hx, hy, 300, doorLen);
      ctx.fillStyle = '#a0522d';
      ctx.fillRect(hx + 12, hy + 12, 276, doorLen - 24);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText('柜体', hx + 140, hy + 82);
      // door swings between 0 and the (smoothed) limit; sine drive gives
      // zero velocity at both ends — no lurching reversal
      const phase = (Math.sin(time / 700) * 0.5 + 0.5) * d.rad;
      // limit scale arc (orange): traces the door TIP's allowed envelope,
      // from closed (straight down) to the current limit, on the outside
      ctx.strokeStyle = '#f07e47';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(hx, hy, doorLen, Math.PI / 2, Math.PI / 2 + d.rad);
      ctx.stroke();
      // door (blue): rotates around the hinge; angle 0 = closed (down,
      // covering the front face), opens outward to the left
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(Math.PI / 2 + phase);
      ctx.fillStyle = '#27446e';
      ctx.fillRect(0, -8, doorLen, 16);
      ctx.beginPath();
      ctx.arc(doorLen - 18, 0, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#f5f8f0';
      ctx.fill();
      ctx.restore();
      // hinge dot on top of everything
      ctx.fillStyle = '#f07e47';
      ctx.beginPath();
      ctx.arc(hx, hy, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#68778f';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('铰链', hx - 44, hy - 14);
      // readout
      ctx.fillStyle = '#21324a';
      ctx.font = '22px "Segoe UI", sans-serif';
      ctx.fillText(`${s.limitDeg.toFixed(0)}°`, 860, 140);
      ctx.fillStyle = '#68778f';
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText('L = (0°, 上限)', 840, 170);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (time: number) => {
      render(time);
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value), 0, 120);
    stateRef.current.limitDeg = v;
    setLimitDeg(v);
    if (v < 30) setFeedback({ text: '范围太小，抽屉拉不开、柜门形同虚设。', cls: 'bad' });
    else if (v <= 100) setFeedback({ text: '范围合理：开合充分且不与柜体碰撞。', cls: 'good' });
    else setFeedback({ text: '范围过大可能碰撞——论文用真实关节数据集的范围来训练。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          运动范围上限 <span className="val">{limitDeg.toFixed(0)}°</span>
        </label>
        <input type="range" min={0} max={120} value={limitDeg} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Mod2;
