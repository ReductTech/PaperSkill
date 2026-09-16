import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawCanoe, drawLabel } from './river-kit';

// §9 Module 9.1: drag T_w / T_r handles on the training timeline; the linked
// loss curve shows faster mid-training (lookahead) and a late-stage spike when
// T_r is too late (paper Section 3.3 + Figure 8; NanoGPT used 1800/5600 of 6200).

const W = 1080;
const H = 280;
const TOTAL = 6200;

export const W9BetaSchedule: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ tw: 0.29, tr: 0.9, drag: null as 'tw' | 'tr' | null });
  const [fb, setFb] = useState({ text: '拖动手柄排一张调度表（论文 NanoGPT：T_w=1800、T_r=5600，共 6200）。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const toIntrinsic = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return clamp(((e.clientX - rect.left) / rect.width) * W, 0, W);
    };
    const pxOf = (v: number) => 60 + v * (W - 120);

    const loss = (t: number) => {
      // illustrative training curve: faster drop during lookahead, spike if tr too late
      const { tw, tr } = stateRef.current;
      let l = 5.6 - 2.0 * t;
      if (t > tw && t < tr) l -= 0.35 * Math.sin(((t - tw) / Math.max(0.01, tr - tw)) * Math.PI);
      if (tr > 0.88 && t > 0.9) l += 0.55 * ((t - 0.9) / 0.1);
      if (tw < 0.12 && t < 0.12) l += 0.3 * Math.abs(Math.sin(t * 60)) * (1 - t / 0.12);
      return l;
    };

    const render = () => {
      const { tw, tr, drag } = stateRef.current;
      clearScene(ctx, W, H);
      // timeline band
      const ty = 44;
      ctx.fillStyle = C.blue;
      ctx.globalAlpha = 0.35;
      ctx.fillRect(60, ty, pxOf(tw) - 60, 26);
      ctx.globalAlpha = 1;
      ctx.fillStyle = C.green;
      ctx.fillRect(pxOf(tw), ty, pxOf(tr) - pxOf(tw), 26);
      ctx.fillStyle = '#c9d3cf';
      ctx.fillRect(pxOf(tr), ty, W - 120 - (pxOf(tr) - 60), 26);
      ctx.strokeStyle = C.border;
      ctx.strokeRect(60, ty, W - 120, 26);
      drawLabel(ctx, `预热 β=0（0→${Math.round(tw * TOTAL)}）`, 70, ty + 17, C.text, 12);
      drawLabel(ctx, `前瞻期（→${Math.round(tr * TOTAL)}）`, pxOf(tw) + 12, ty + 17, '#ffffff', 12);
      drawLabel(ctx, `提前休息 β=0`, pxOf(tr) + 10, ty + 17, C.text, 12);
      // canoe riding the timeline
      drawCanoe(ctx, 60 + 0.55 * (W - 120), ty + 62, 0, C.blue, 0.6);
      // loss curve
      const ly0 = 130;
      const lh = H - 160;
      ctx.strokeStyle = C.border;
      ctx.strokeRect(60, ly0, W - 120, lh);
      // loss values range ~ [2.6, 5.6]
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 300; i++) {
        const t = i / 300;
        const X = 60 + t * (W - 120);
        const Y = ly0 + ((loss(t) - 2.4) / 3.6) * lh;
        if (i === 0) ctx.moveTo(X, Y);
        else ctx.lineTo(X, Y);
      }
      ctx.stroke();
      // handles
      for (const [key, v] of [['tw', tw], ['tr', tr]] as const) {
        const X = pxOf(v);
        ctx.fillStyle = drag === key ? C.red : C.orange;
        ctx.fillRect(X - 5, ty - 8, 10, 42);
        ctx.fillStyle = C.text;
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText(key === 'tw' ? 'T_w' : 'T_r', X - 10, ty - 14);
      }
      const endLoss = loss(1);
      drawLabel(ctx, `末端损失 ${endLoss.toFixed(2)}`, W - 230, H - 12, tr > 0.88 ? C.red : C.text, 15);
    };

    render();
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');

    const onDown = (e: PointerEvent) => {
      const x = toIntrinsic(e);
      const { tw, tr } = stateRef.current;
      const dTw = Math.abs(x - pxOf(tw));
      const dTr = Math.abs(x - pxOf(tr));
      if (dTr < 20 && dTr <= dTw) stateRef.current.drag = 'tr';
      else if (dTw < 20) stateRef.current.drag = 'tw';
      if (stateRef.current.drag) canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      const d = stateRef.current.drag;
      if (!d) return;
      const x = toIntrinsic(e);
      let v = clamp((x - 60) / (W - 120), 0, 1);
      const s = stateRef.current;
      if (d === 'tw') {
        s.tw = Math.min(v, s.tr - 0.02);
      } else {
        s.tr = Math.max(v, s.tw + 0.02);
      }
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      const { tw, tr } = s;
      if (tr > 0.88)
        setFb({ text: 'T_r 太晚：衰减期前瞻方向无法适应陡峭极小值，末端损失回升（图8）。', cls: 'bad' });
      else if (tw < 0.12)
        setFb({ text: '预热不足：训练早期方向还不稳。', cls: '' });
      else
        setFb({
          text: `T_w=${Math.round(tw * TOTAL)}、T_r=${Math.round(tr * TOTAL)}：前瞻期覆盖中段，末端提前休息。`,
          cls: 'good',
        });
    };
    const onUp = () => {
      stateRef.current.drag = null;
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
  }, []);

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%', touchAction: 'none' }} />
      <div className="ctrl">
        <label>
          T_w <span className="val">{Math.round(stateRef.current.tw * TOTAL)}</span>
        </label>
        <label>
          T_r <span className="val">{Math.round(stateRef.current.tr * TOTAL)}</span>
        </label>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default W9BetaSchedule;
