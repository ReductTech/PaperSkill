import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRoad, drawCar, drawFlag, drawLabel, drawLegend } from './roadKit';

const W = 1080, H = 280;
export const Ch1Mismatch: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ stress: 0.35, repaired: false });
  const [stress, setStress] = useState(0.35);
  const [repaired, setRepaired] = useState(false);
  const [fb, setFb] = useState({ text: '先加大“微调强度”，体会 token 级抖动如何偏离路段目标。', cls: '' });
  const rafRef = useRef<number | null>(null);

  const syncFb = (s: number, r: boolean) => {
    if (r) setFb({ text: '切换到整段导航后，车沿路段前进，决策粒度与交互步对齐。', cls: 'good' });
    else if (s > 0.65) setFb({ text: '微调过密：局部 token 优化剧烈，整段决策仍对不齐。', cls: 'bad' });
    else if (s < 0.25) setFb({ text: '微调偏弱，尚未暴露粒度错配。', cls: '' });
    else setFb({ text: '抖动已出现：优化单元是 token，真正生效的是完整转向。', cls: '' });
  };

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let t0 = performance.now();
    const render = (now: number) => {
      const { stress: st, repaired: rp } = stateRef.current;
      const u = ((now - t0) % 2800) / 2800;
      clearScene(ctx, W, H);
      drawRoad(ctx, 180, W);
      drawFlag(ctx, W - 70, 160);
      // technical inset: token ticks vs step bars
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1;
      ctx.fillRect(40, 30, 420, 100);
      ctx.strokeRect(40, 30, 420, 100);
      drawLabel(ctx, rp ? '步边界' : 'token 轴', 52, 52, C.muted);
      if (rp) {
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = C.green;
          ctx.fillRect(60 + i * 95, 70, 70, 36);
        }
      } else {
        for (let i = 0; i < 18; i++) {
          const h = 10 + Math.abs(Math.sin(u * 8 + i)) * (20 + st * 40);
          ctx.fillStyle = C.red;
          ctx.fillRect(55 + i * 22, 120 - h, 12, h);
        }
      }
      const baseX = 80 + u * 780;
      const jitter = rp ? 0 : Math.sin(u * Math.PI * (6 + st * 20)) * (8 + st * 28);
      drawCar(ctx, baseX, 172 + jitter, rp ? C.green : C.red);
      drawLegend(ctx, [
        { color: C.red, label: 'token 抖动' },
        { color: C.green, label: '步对齐' },
        { color: C.blue, label: '路段' },
      ], 520, 50);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = (n: number) => { render(n); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>微调强度 <span className="val">{stress.toFixed(2)}</span></label>
        <input type="range" min={0} max={100} value={Math.round(stress * 100)}
          onChange={(e) => {
            const v = Number(e.target.value) / 100;
            stateRef.current.stress = v; setStress(v); syncFb(v, repaired);
          }} />
        <button type="button" className={repaired ? 'chip on' : 'chip'} onClick={() => {
          const r = !repaired; stateRef.current.repaired = r; setRepaired(r); syncFb(stress, r);
        }}>{repaired ? '已用步对齐' : '启用步对齐'}</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Ch1Mismatch;
