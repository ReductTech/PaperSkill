import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { K, drawPhotoCard, drawLabel, roundRect } from './ana-scene';

const W = 560, H = 280;
type Mode = 0 | 1 | 2 | 3; // none | per-frame | joint | learned

const MODES = ['不润色', '逐帧独立去噪', '轨迹联合去噪', '学习去噪器 g_φ'];

const FEEDBACK: { text: string; cls: string }[] = [
  { text: '生成的轨迹天然带有前向过程的残噪（x_t 里始终混着 t·ε 那一份）——离成品还差一步。', cls: '' },
  { text: '逐帧独立去噪：各帧各管各的，忽略了帧与帧之间的相关性，修正不彻底。', cls: '' },
  { text: '轨迹联合去噪：协方差 S 把所有时间步耦合起来一起纠错——一处的误差带动全轨迹修正（命题 3）。代价：要对整个模型反传，慢。', cls: 'good' },
  { text: '学习去噪器：把整套联合润色蒸馏成一次前向——0.20 → 1.88 img/s（约 9 倍提速），LPIPS 仅 0.121（微调场景，Table 2）。', cls: 'good' },
];

// residual noise per frame after each treatment (schematic)
const NOISE: Record<Mode, number[]> = {
  0: [0.5, 0.48, 0.52, 0.5],
  1: [0.3, 0.34, 0.28, 0.32],
  2: [0.06, 0.06, 0.06, 0.06],
  3: [0.07, 0.07, 0.07, 0.07],
};

export const M9Denoise: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ mode: Mode; t0: number }>({ mode: 0, t0: 0 });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>(0);
  const [feedback, setFeedback] = useState(FEEDBACK[0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    stateRef.current.t0 = performance.now() / 1000;

    const render = () => {
      const s = stateRef.current;
      const anim = clamp((performance.now() / 1000 - s.t0) / 0.9, 0, 1);
      ctx.fillStyle = K.bg;
      ctx.fillRect(0, 0, W, H);
      drawLabel(ctx, `收尾方式：${MODES[s.mode]}`, 40, 26, K.text, 13);

      // trajectory frames
      const xs = [48, 172, 296, 420];
      const fw = 92, fh = 74, fy = 66;
      // covariance links for the joint modes
      if ((s.mode === 2 || s.mode === 3) && anim > 0.1) {
        ctx.strokeStyle = `rgba(39,68,110,${(0.55 * Math.min(1, anim * 2)).toFixed(3)})`;
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(xs[i] + fw - 6, fy + 8);
          ctx.quadraticCurveTo((xs[i] + xs[i + 1] + fw) / 2, fy - 26, xs[i + 1] + 6, fy + 8);
          ctx.stroke();
        }
        drawLabel(ctx, '协方差 S 连接所有帧', 216, 34, K.blue, 11);
      }
      xs.forEach((x, i) => {
        const base = NOISE[0][i];
        const target = NOISE[s.mode][i];
        const n = base + (target - base) * anim;
        drawPhotoCard(ctx, x, fy, fw, fh, n, 107 + i);
        drawLabel(ctx, `t=${[0.75, 0.51, 0.26, 0.02][i]}`, x + fw / 2, fy + fh + 14, K.muted, 10, 'center');
      });

      // speed / quality panel
      const py = 190;
      roundRect(ctx, 48, py, 464, 66, 5);
      ctx.fillStyle = K.card;
      ctx.fill();
      ctx.strokeStyle = K.border;
      ctx.stroke();
      drawLabel(ctx, '吞吐（img/s，越高越好）', 62, py + 18, K.muted, 11);
      const speeds: Record<Mode, number> = { 0: 0, 1: 0.2, 2: 0.2, 3: 1.88 };
      const sp = speeds[s.mode];
      ctx.fillStyle = s.mode === 3 ? K.green : K.blue;
      roundRect(ctx, 62, py + 26, Math.max(3, (sp / 2) * 260 * anim), 12, 3);
      ctx.fill();
      drawLabel(ctx, s.mode === 0 ? '—（没做去噪）' : `${sp.toFixed(2)} img/s`, 330, py + 33,
        s.mode === 3 ? K.green : K.muted, 11);
      drawLabel(
        ctx,
        s.mode === 3 ? '与联合去噪的差异：LPIPS 0.121（越低越相似）' :
        s.mode === 2 ? '需要对全模型反传，慢但效果是基准' : '',
        62, py + 54, K.muted, 11
      );
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
    stateRef.current.t0 = performance.now() / 1000;
    setMode(m);
    setFeedback(FEEDBACK[m]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {MODES.map((name, i) => (
          <button key={name} className={`chip ${mode === i ? 'selected' : ''}`} onClick={() => pick(i as Mode)}>
            {name}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
