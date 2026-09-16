import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRiver, drawCanoe, drawLookaheadArrow, drawTarget, drawLabel, drawLegend } from './river-kit';

// §1 Module 1.1: stress the standard lookahead with a beta slider.
// The extrapolated-point loss rises with beta (paper Fig 2, solid red).

const W = 1080;
const H = 280;

// Simulated loss at the lookahead position: monotone rising, anchored to Fig 2's shape.
function lossAtLookahead(beta: number): number {
  return 4.78 + 0.9 * beta * beta + 0.55 * beta * beta * beta * beta;
}

export const W1LookaheadStress: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ beta: 0.1, time: 0 });
  const [beta, setBeta] = useState(0.1);
  const [fb, setFb] = useState({ text: 'β=0.10：船头尚在河道内。', cls: '' });

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
      const { beta: b, time } = stateRef.current;
      clearScene(ctx, W, H);
      const bend = 0.4;
      drawRiver(ctx, W, H, 0.4, bend);
      const px = 260;
      const py = 118 + 12 * Math.sin(time * 4);
      const len = 40 + b * 300;
      const tipX = px + len;
      const tipY = py - 0.45 * len;
      // bank flash when the tip lands on it
      const onBank = tipY < H * 0.4;
      if (onBank) {
        ctx.fillStyle = 'rgba(196,63,82,0.16)';
        ctx.fillRect(0, 0, W, H * 0.4);
      }
      drawLookaheadArrow(ctx, px, py, len, tipY - py, b > 0.6 ? C.red : b > 0.25 ? C.orange : C.blue, 4);
      drawCanoe(ctx, px, py, -0.08, C.blue);
      drawTarget(ctx, W - 80, H * 0.55);
      drawLabel(ctx, `前瞻位置损失 ${lossAtLookahead(b).toFixed(2)}`, W - 300, 34, C.text);
      drawLegend(ctx, [[C.blue, '可靠'], [C.orange, '追浪'], [C.red, '上岸']], 24, 34);
    };
    const tick = () => {
      stateRef.current.time += 1 / 60;
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stopRaf = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    }, stopRaf);
    return () => {
      stopRaf();
      disconnect();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value) / 100, 0, 1);
    stateRef.current.beta = v;
    setBeta(v);
    const l = lossAtLookahead(v).toFixed(2);
    setFb(
      v > 0.6
        ? { text: `β=${v.toFixed(2)}：前瞻位置已经探上高岸（图2 实线：损失随 β 急剧上升），当前 ${l}。`, cls: 'bad' }
        : v > 0.25
        ? { text: `β=${v.toFixed(2)}：船头开始追浪，位置损失上升至 ${l}。`, cls: '' }
        : { text: `β=${v.toFixed(2)}：短视信号还算可靠，损失 ${l}。`, cls: 'good' }
    );
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />
      <div className="ctrl">
        <label>
          前瞻步长 β <span className="val">{beta.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(beta * 100)} onChange={onChange} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default W1LookaheadStress;
