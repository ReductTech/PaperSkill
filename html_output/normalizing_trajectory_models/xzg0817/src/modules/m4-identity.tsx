import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { K, drawLabel, roundRect } from './ana-scene';

const W = 560, H = 270;
type Mode = 'id' | 'flow';

/** Schematic three-term NLL. Identity: Jacobian of f_T vanishes. */
const TERMS: Record<Mode, { z: number; jp: number; jt: number; note: string; cls: string }> = {
  id: {
    z: 1.12, jp: 0.41, jt: 0,
    note: 'f_T = id ⇒ log|det J_T| = 0。剩下两项就是普通高斯扩散的 NLL——附录 A.2：NTM 在恒等搬运器下精确退化回现有高斯轨迹。',
    cls: '',
  },
  flow: {
    z: 0.48, jp: 0.22, jt: -0.91,
    note: '学到的 f_T 贡献 log|det J_T|。这一项正是“超越单高斯”的全部来源：高斯预测器没变，变的是它作用的坐标系。',
    cls: 'good',
  },
};

export const M4Identity: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ mode: Mode }>({ mode: 'id' });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>('id');
  const [feedback, setFeedback] = useState({ text: TERMS.id.note, cls: TERMS.id.cls });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      const m = stateRef.current.mode;
      const t = TERMS[m];
      const nll = t.z + t.jp + t.jt;
      ctx.fillStyle = K.bg;
      ctx.fillRect(0, 0, W, H);
      drawLabel(ctx, '一步反向的精确对数似然（换元公式，示意数值）', 28, 24, K.text, 13);

      const rows = [
        { name: '½‖z‖²  基分布', v: t.z, color: K.blue },
        { name: 'log σ_P  预测器体积', v: t.jp, color: K.muted },
        { name: '−log|det J_T|  搬运器体积', v: t.jt, color: m === 'id' ? K.red : K.green },
      ];
      const maxAbs = 1.3;
      const gx = 250, gw = 260, bh = 36;
      rows.forEach((r, i) => {
        const y = 48 + i * 52;
        drawLabel(ctx, r.name, 28, y + 18, K.text, 12);
        ctx.fillStyle = K.border;
        ctx.fillRect(gx, y + 12, gw, 12);
        const mid = gx + gw / 2;
        ctx.strokeStyle = K.muted;
        ctx.beginPath();
        ctx.moveTo(mid, y + 8);
        ctx.lineTo(mid, y + 28);
        ctx.stroke();
        const w = (Math.abs(r.v) / maxAbs) * (gw / 2);
        ctx.fillStyle = r.color;
        if (r.v >= 0) roundRect(ctx, mid, y + 12, w, 12, 2);
        else roundRect(ctx, mid - w, y + 12, w, 12, 2);
        ctx.fill();
        drawLabel(ctx, r.v.toFixed(2), gx + gw + 8, y + 18, r.color, 12);
      });

      roundRect(ctx, 28, 210, 504, 42, 5);
      ctx.fillStyle = K.card;
      ctx.fill();
      ctx.strokeStyle = K.border;
      ctx.stroke();
      drawLabel(ctx, `L_NTM（这一步）= ${nll.toFixed(2)}（越低越好）`, 44, 232,
        m === 'flow' ? K.green : K.text, 14);
      if (m === 'id') {
        drawLabel(ctx, '第三项为 0：与预训练高斯反向步相同', 280, 232, K.red, 12);
      } else {
        drawLabel(ctx, '第三项 < 0：换元把体积“算进”似然', 300, 232, K.green, 12);
      }
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const pick = (m: Mode) => {
    stateRef.current.mode = m;
    setMode(m);
    setFeedback({ text: TERMS[m].note, cls: TERMS[m].cls });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${mode === 'id' ? 'selected' : ''}`} onClick={() => pick('id')}>
          f_T = 恒等（现有高斯轨迹）
        </button>
        <button className={`chip ${mode === 'flow' ? 'selected' : ''}`} onClick={() => pick('flow')}>
          学到的 f_T（NTM 换元）
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
