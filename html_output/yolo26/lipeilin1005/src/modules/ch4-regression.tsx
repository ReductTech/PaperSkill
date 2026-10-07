import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, startCanvasLoop, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch4 Module 4.1 (P1+P4): drag the ground-truth box size (or switch 640/1280)
// and watch the 16-bin DFL distribution slam into its range cap while direct
// regression keeps an exact reading. Teaching scale: bin = 4 px at 640.
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f',
};

export const Ch4Regression: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sizePx: 40, res: 640 });
  // eased display values
  const easeRef = useRef({ bins: new Array(16).fill(8) as number[], needle: 0.4, digital: 40 });
  const [sizePx, setSizePx] = useState(40);
  const [res, setRes] = useState(640);
  const [fb, setFb] = useState({ text: '16 格分布从容覆盖，DFL 工作正常。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (time: number) => {
      const s = stateRef.current;
      const e = easeRef.current;
      const scale = s.res / 640;
      const peakBin = clamp(Math.round((s.sizePx * scale) / 4), 0, 20);
      const trunc = peakBin > 15;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      // ---- left: rider + two gauges ----
      ctx.fillStyle = C.light; ctx.fillRect(0, 226, 460, 54);
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 232); ctx.lineTo(460, 232); ctx.stroke();
      const px = 120; const py = 232;
      ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px - 18, py - 14, 14, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(px + 20, py - 14, 14, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px - 18, py - 14); ctx.lineTo(px - 2, py - 30); ctx.lineTo(px + 20, py - 14); ctx.lineTo(px - 18, py - 14);
      ctx.moveTo(px - 2, py - 30); ctx.lineTo(px + 4, py - 34);
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.beginPath(); ctx.arc(px + 2, py - 44, 6, 0, Math.PI * 2); ctx.fill();
      // needle gauge (DFL) — eased needle, jitters while pegged at the cap
      const gx = 240; const gy = 200; const r = 52;
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(gx, gy, r, Math.PI, 0); ctx.stroke();
      for (let i = 0; i <= 16; i++) {
        const a = Math.PI + (i / 16) * Math.PI;
        ctx.strokeStyle = i === 16 ? C.red : C.muted; ctx.lineWidth = i % 4 === 0 ? 2.5 : 1;
        ctx.beginPath();
        ctx.moveTo(gx + Math.cos(a) * (r - 5), gy + Math.sin(a) * (r - 5));
        ctx.lineTo(gx + Math.cos(a) * r, gy + Math.sin(a) * r);
        ctx.stroke();
      }
      e.needle = lerp(e.needle, clamp(peakBin / 16, 0, 1), 0.15);
      const jit = trunc ? Math.sin(time / 40) * 0.03 : 0;
      const frac = clamp(e.needle + jit, 0, 1);
      const a = Math.PI + frac * Math.PI;
      ctx.strokeStyle = trunc ? C.red : C.blue; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(a) * (r - 12), gy + Math.sin(a) * (r - 12)); ctx.stroke();
      // digital gauge (direct regression) — eased count
      e.digital = lerp(e.digital, s.sizePx * scale, 0.2);
      ctx.fillStyle = C.green; ctx.fillRect(330, 140, 108, 42);
      ctx.fillStyle = '#fff'; ctx.font = '22px monospace';
      ctx.fillText(String(Math.round(e.digital)), 356, 168);
      ctx.fillStyle = trunc ? C.red : C.green; ctx.font = '12px sans-serif';
      ctx.fillText(trunc ? '顶到上限!' : '精确直显', 344, 206);
      // ---- right inset: 16-bin distribution (bar heights ease) ----
      ctx.fillStyle = '#fff'; ctx.fillRect(500, 20, 560, 240);
      ctx.strokeStyle = '#d7deea'; ctx.lineWidth = 2; ctx.strokeRect(500, 20, 560, 240);
      const bx0 = 540; const bw = 26; const base = 226;
      for (let i = 0; i < 16; i++) {
        const dist = Math.abs(i - Math.min(peakBin, 15));
        const target = Math.max(8, 120 * Math.exp(-dist * dist / 8));
        e.bins[i] = lerp(e.bins[i], target, 0.18);
        const h = e.bins[i];
        const clipped = trunc && i === 15;
        ctx.fillStyle = clipped ? C.red : C.blue;
        ctx.fillRect(bx0 + i * (bw + 4), base - h, bw, h);
      }
      if (trunc) {
        ctx.strokeStyle = C.red; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(bx0 + 16 * (bw + 4) - 2, 50); ctx.lineTo(bx0 + 16 * (bw + 4) - 2, base); ctx.stroke();
        ctx.fillStyle = C.red; ctx.font = '12px sans-serif';
        ctx.fillText('截断', bx0 + 16 * (bw + 4) - 14, 44);
      }
      ctx.fillStyle = C.green; ctx.fillRect(540, base + 8, clamp(e.digital / 64, 0, 1) * 440, 8);
      ctx.fillStyle = C.muted; ctx.font = '12px sans-serif';
      ctx.fillText('直接回归：' + s.sizePx * scale + ' px', 540, base + 32);
    };

    return startCanvasLoop(canvas, render);
  }, []);

  const update = (size: number, resolution: number) => {
    stateRef.current.sizePx = size;
    stateRef.current.res = resolution;
    setSizePx(size); setRes(resolution);
    const scale = resolution / 640;
    const peakBin = Math.round((size * scale) / 4);
    if (peakBin > 15) setFb({ text: '超出 (K−1)×stride：DFL 只能估读，直接回归仍精确——分辨率越高越明显（1280 时 APL 差距达 +2.2）。', cls: 'good' });
    else if (peakBin >= 12) setFb({ text: '指针逼近表盘末端，估计开始吃力。', cls: '' });
    else setFb({ text: '16 格分布从容覆盖，DFL 工作正常。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          真值框边长 <span className="val">{sizePx} px</span>
        </label>
        <input type="range" min={10} max={80} value={sizePx} onChange={(e) => update(Number(e.target.value), res)} />
        <div className="chip-row">
          <button className={`chip ${res === 640 ? 'selected' : ''}`} onClick={() => update(sizePx, 640)}>640</button>
          <button className={`chip ${res === 1280 ? 'selected' : ''}`} onClick={() => update(sizePx, 1280)}>1280</button>
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch4Regression;
