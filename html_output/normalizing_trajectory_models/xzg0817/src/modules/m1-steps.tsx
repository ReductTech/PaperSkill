import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { K, drawPhotoCard, drawLabel } from './ana-scene';

const W = 560, H = 260;

/** Quality loss of a single-Gaussian sampler as steps shrink (schematic). */
function noiseFor(T: number): number {
  if (T >= 30) return lerp(0.1, 0.04, (T - 30) / 20);
  if (T >= 10) return lerp(0.38, 0.1, (T - 10) / 20);
  return lerp(0.78, 0.38, (T - 4) / 6);
}

export const M1Steps: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ steps: 50 });
  const rafRef = useRef<number | null>(null);
  const [steps, setSteps] = useState(50);
  const [feedback, setFeedback] = useState({
    text: '现在是 50 个小步：高斯法的舒适区。试着把它拖到 4。',
    cls: 'good',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (s: { steps: number }) => {
      ctx.fillStyle = K.bg;
      ctx.fillRect(0, 0, W, H);
      const n = noiseFor(s.steps);

      // left: restored photo at this step count
      drawPhotoCard(ctx, 36, 44, 168, 150, n, 71);
      drawLabel(ctx, `T = ${s.steps} 步的生成结果`, 42, 30, K.text, 13);
      drawLabel(ctx, n > 0.3 ? '模糊 / 平均脸' : n > 0.12 ? '细节开始丢失' : '清晰', 42, 210,
        n > 0.3 ? K.red : n > 0.12 ? K.orange : K.green, 12);

      // right: schematic quality-vs-steps curve
      const gx = 260, gy = 44, gw = 264, gh = 150;
      ctx.strokeStyle = K.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(gx, gy, gw, gh);
      // danger zone T < 10
      const dzw = ((10 - 4) / 46) * gw;
      ctx.fillStyle = 'rgba(196,63,82,0.08)';
      ctx.fillRect(gx, gy, dzw, gh);
      drawLabel(ctx, '危险区', gx + 6, gy + 12, K.red, 10);
      // curve
      ctx.strokeStyle = K.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let T = 4; T <= 50; T += 1) {
        const x = gx + ((T - 4) / 46) * gw;
        const y = gy + gh - (1 - noiseFor(T)) * gh * 0.92 - gh * 0.04;
        if (T === 4) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // current point
      const cx = gx + ((s.steps - 4) / 46) * gw;
      const cy = gy + gh - (1 - n) * gh * 0.92 - gh * 0.04;
      ctx.fillStyle = K.orange;
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      drawLabel(ctx, `T=${s.steps}`, clamp(cx - 12, gx, gx + gw - 40), cy - 14, K.orange, 11);
      // axes
      drawLabel(ctx, '步数 T →', gx + gw - 56, gy + gh + 16, K.muted, 11);
      drawLabel(ctx, '↑ 画质（越高越好）', gx, gy + gh + 16, K.muted, 11);
      drawLabel(ctx, '单高斯采样器 · 示意曲线', gx + gw - 150, gy + 12, K.muted, 10);
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    stateRef.current.steps = v;
    setSteps(v);
    setFeedback(
      v >= 30
        ? { text: '小步高斯近似成立：每步跨得小，单高斯足够精确，样本按部就班变清晰。', cls: 'good' }
        : v >= 10
        ? { text: '步子变大，高斯近似开始吃力——细节开始糊，但整体还认得出。', cls: '' }
        : { text: '每一大步的真实分布已是多峰混合，单高斯只能给出所有可能性的模糊平均。这就是少步崩塌的根源。', cls: 'bad' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          去噪步数 T <span className="val">{steps}</span>
        </label>
        <input type="range" min={4} max={50} step={1} value={steps} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
