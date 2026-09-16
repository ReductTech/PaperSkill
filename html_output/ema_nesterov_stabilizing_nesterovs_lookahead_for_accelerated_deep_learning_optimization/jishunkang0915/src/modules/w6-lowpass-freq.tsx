import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawLabel } from './river-kit';

// §6 Module 6.1: frequency sweep — |H(e^{i*omega})| of the EMA transfer function
// H(z) = (1-gamma)/(1-gamma*z^-1) (paper Section 3.1), with a linked wave band.

const W = 1080;
const H = 280;
const G6 = [0.9, 0.99, 0.995, 0.999];

function magH(omega: number, gamma: number): number {
  const re = 1 - gamma * Math.cos(omega);
  const im = gamma * Math.sin(omega);
  return (1 - gamma) / Math.sqrt(re * re + im * im);
}

export const W6LowpassFreq: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [omega, setOmega] = useState(Math.PI / 2);
  const [gi, setGi] = useState(1);
  const [fb, setFb] = useState({ text: `ω=1.57：高频浪花，衰减到 ${magH(Math.PI / 2, 0.99).toFixed(2)}。`, cls: '' });

  useEffect(() => {
    render(omega, gi);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [omega, gi]);

  const render = (om: number, gIdx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const gamma = G6[gIdx];
    clearScene(ctx, W, H);
    // top: |H| curve over [0, pi]
    const lx = 70;
    const ly = 36;
    const lw = W - 140;
    const lh = 130;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(lx, ly, lw, lh);
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(lx, ly, lw, lh);
    // axis ticks 0 and pi
    ctx.fillStyle = C.muted;
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText('0', lx - 4, ly + lh + 18);
    ctx.fillText('π', lx + lw - 4, ly + lh + 18);
    ctx.fillText('|H(e^{iω})|', lx + 6, ly + 18);
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const w = (i / 200) * Math.PI;
      const m = magH(w, gamma);
      const x = lx + (i / 200) * lw;
      const y = ly + lh - Math.min(1, m) * (lh - 12) - 6;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // marker
    const mx = lx + (om / Math.PI) * lw;
    const mv = magH(om, gamma);
    const my = ly + lh - Math.min(1, mv) * (lh - 12) - 6;
    ctx.fillStyle = C.orange;
    ctx.beginPath();
    ctx.arc(mx, my, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(mx, ly + lh);
    ctx.stroke();
    drawLabel(ctx, mv.toFixed(2), mx + 10, my - 8, C.text, 15);
    // bottom: linked wave band — dense high-freq vs smooth low-freq
    const by = ly + lh + 30;
    ctx.fillStyle = C.waterLight;
    ctx.fillRect(lx, by, lw, H - by - 16);
    ctx.strokeStyle = C.text;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i <= lw; i += 2) {
      const w = (i / lw) * Math.PI;
      const attenuation = magH(w, gamma);
      const y =
        by + (H - by - 16) / 2 + Math.sin((i / lw) * Math.PI * (2 + (om / Math.PI) * 26)) * 16 * Math.min(1, attenuation * 2.2);
      if (i === 0) ctx.moveTo(lx + i, y);
      else ctx.lineTo(lx + i, y);
    }
    ctx.stroke();
  };

  const upd = (om: number, gIdx: number) => {
    const m = magH(om, G6[gIdx]);
    setFb(
      om < Math.PI / 4
        ? { text: `ω=${om.toFixed(2)}：趋势成分，几乎不衰减（|H|=${m.toFixed(2)}）。`, cls: 'good' }
        : { text: `ω=${om.toFixed(2)}：高频浪花，衰减到 ${m.toFixed(2)}。`, cls: '' }
    );
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />
      <div className="ctrl">
        <label>
          频率 ω <span className="val">{omega.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={314}
          value={Math.round(omega * 100)}
          onChange={(e) => {
            const v = clamp(Number(e.target.value) / 100, 0, Math.PI);
            setOmega(v);
            upd(v, gi);
          }}
        />
        {G6.map((g, i) => (
          <button key={g} className={i === gi ? 'chip active' : 'chip'} onClick={() => { setGi(i); upd(omega, i); }}>
            γ={g}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default W6LowpassFreq;
