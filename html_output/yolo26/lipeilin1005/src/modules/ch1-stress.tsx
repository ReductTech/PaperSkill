import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch1 Module 1.1 (P1): stress-test the old pipeline — the harder the scene,
// the steeper the slope, the heavier the load, the longer the latency bar
// and the more duplicate boxes queue at the NMS checkpoint.
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f',
};

const FB = {
  easy: { text: '路况平缓，旧车还能应付。', cls: '' },
  mid: { text: '负担明显加重：后处理排队、重复预测增多。', cls: '' },
  hard: { text: '旧管线过载——延迟飙升、重复框泛滥，必须减负。', cls: 'bad' },
};

export const Ch1Stress: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ diff: 30 });
  const [diff, setDiff] = useState(30);
  const [fb, setFb] = useState(FB.easy);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (time: number) => {
      const d = stateRef.current.diff / 100;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      // ---- left scene (0-540): loaded bike climbing a slope ----
      ctx.fillStyle = C.light; ctx.fillRect(0, 226, 540, 54);
      const slopeH = lerp(6, 66, d);
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 232); ctx.lineTo(540, 232 - slopeH); ctx.stroke();
      const t = (time / 3000) % 1;
      const px = 40 + t * 400;
      const py = 232 - (px / 540) * slopeH + Math.sin(t * Math.PI * 12) * (1 + d * 3);
      const s = 0.85;
      ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px - 18 * s, py, 14 * s, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(px + 20 * s, py, 14 * s, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px - 18 * s, py); ctx.lineTo(px - 2 * s, py - 16 * s);
      ctx.lineTo(px + 20 * s, py); ctx.lineTo(px - 18 * s, py);
      ctx.moveTo(px - 2 * s, py - 16 * s); ctx.lineTo(px + 4 * s, py - 20 * s);
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.beginPath(); ctx.arc(px + 2 * s, py - 30 * s, 6 * s, 0, Math.PI * 2); ctx.fill();
      // red pannier grows with difficulty
      const bag = lerp(10, 34, d);
      ctx.fillStyle = d > 0.7 ? C.red : '#a85448';
      ctx.fillRect(px - 34 * s - bag / 2, py - 26 * s, bag, 20 * s + bag / 2);
      // ---- right inset (560-1080): evidence bars ----
      ctx.fillStyle = '#fff';
      ctx.fillRect(560, 20, 500, 240);
      ctx.strokeStyle = '#d7deea'; ctx.lineWidth = 2;
      ctx.strokeRect(560, 20, 500, 240);
      const overload = stateRef.current.diff > 70;
      // latency bar
      const lat = lerp(0.08, 1, d);
      ctx.fillStyle = C.text; ctx.font = '14px sans-serif';
      ctx.fillText('延迟', 584, 64);
      ctx.fillStyle = '#e8edf5'; ctx.fillRect(584, 76, 400, 22);
      ctx.fillStyle = overload ? C.red : C.blue;
      ctx.fillRect(584, 76, 400 * lat, 22);
      ctx.fillStyle = C.green; ctx.fillRect(584 + 400 * 0.08 - 1, 70, 2, 34); // 2.5ms baseline tick
      // duplicate box count bar + mini boxes
      const dup = Math.round(lerp(3, 14, d));
      ctx.fillStyle = C.text; ctx.fillText('重复框', 584, 140);
      ctx.fillStyle = '#e8edf5'; ctx.fillRect(584, 152, 400, 22);
      ctx.fillStyle = overload ? C.red : C.blue;
      ctx.fillRect(584, 152, 400 * (dup / 14), 22);
      for (let i = 0; i < dup; i++) {
        ctx.strokeStyle = overload ? C.red : C.muted; ctx.lineWidth = 1.5;
        ctx.strokeRect(584 + i * 26, 196, 18, 14);
      }
      // NMS checkpoint booth
      ctx.fillStyle = overload ? C.red : C.muted;
      ctx.fillRect(996, 96, 40, 44);
      ctx.fillStyle = '#fff'; ctx.fillRect(1002, 104, 28, 16);
      ctx.fillStyle = C.text; ctx.font = '12px sans-serif';
      ctx.fillText('NMS', 1000, 92);
      ctx.fillStyle = overload ? C.red : C.muted;
      for (let i = 0; i < Math.min(dup, 5); i++) {
        ctx.beginPath(); ctx.arc(990 - i * 14, 160, 5, 0, Math.PI * 2); ctx.fill();
      }
    };

    const tick = (time: number) => {
      render(time);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value), 0, 100);
    stateRef.current.diff = v;
    setDiff(v);
    setFb(v < 40 ? FB.easy : v <= 70 ? FB.mid : FB.hard);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          场景难度 <span className="val">{diff}</span>
        </label>
        <input type="range" min={0} max={100} value={diff} onChange={onChange} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch1Stress;
