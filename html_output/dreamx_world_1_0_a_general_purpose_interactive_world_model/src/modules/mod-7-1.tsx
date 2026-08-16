import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import * as K from './roadKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 260;

export const Mod71: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [steps, setSteps] = useState(4);
  const stepsRef = useRef(4);
  stepsRef.current = steps;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const t0 = performance.now();

    const lineX = (t: number) => 40 + t * 240;
    const lineY = (t: number) => 170 - Math.sin(t * Math.PI * 1.5) * 60;

    const frame = (now: number) => {
      const s = stepsRef.current;
      const time = (now - t0) / 1000;
      const speed = 8 / (s + 6); // fewer steps → faster
      const dev = ((51 - s) / 50) * 26; // fewer steps → larger deviation
      K.clearScene(ctx, W, H);
      // practice ground
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = K.C.axis;
      ctx.beginPath();
      ctx.roundRect(16, 16, 300, 228, 6);
      ctx.fill();
      ctx.stroke();
      ctx.save();
      ctx.beginPath();
      ctx.rect(18, 18, 296, 224);
      ctx.clip();
      ctx.strokeStyle = 'rgba(39,68,110,0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lineX(0), lineY(0));
      for (let i = 1; i <= 30; i++) ctx.lineTo(lineX(i / 30), lineY(i / 30));
      ctx.stroke();
      const tt = (time * speed) % 1;
      const wobble = Math.sin(time * 5) * dev;
      K.drawCar(ctx, lineX(tt), lineY(tt) - 2 + wobble, 0.95, dev > 18 ? K.C.bad : K.C.emph);
      K.drawLabel(ctx, `去噪步数：${s}`, 28, 40, K.C.ink, 11);
      ctx.restore();

      // right inset: trade-off bars
      const ix = 336;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = K.C.axis;
      ctx.beginPath();
      ctx.roundRect(ix, 16, 208, 228, 6);
      ctx.fill();
      ctx.stroke();
      const throughput = (51 - s) / 50;
      const quality = 0.35 + (s / 50) * 0.65;
      K.drawLabel(ctx, '吞吐（相对）', ix + 12, 44, K.C.ink, 11);
      K.drawBar(ctx, ix + 12, 54, 150, 12, throughput, K.C.guide);
      K.drawLabel(ctx, '画质 / 可控性（定性）', ix + 12, 100, K.C.ink, 11);
      K.drawBar(ctx, ix + 12, 110, 150, 12, quality, quality > 0.6 ? K.C.good : K.C.emph);
      if (s <= 8) {
        K.drawLabel(ctx, '★ 论文方案区：DMD 蒸馏', ix + 12, 156, K.C.good, 10);
        K.drawLabel(ctx, '+ 长展开训练补回质量', ix + 12, 172, K.C.good, 10);
      } else {
        K.drawLabel(ctx, '少步区才有实时价值', ix + 12, 156, K.C.muted, 10);
      }
      K.drawLabel(ctx, '曲线为机制示意（非实测）', ix + 12, 200, K.C.muted, 10);
      K.drawLabel(ctx, '方向依据论文 §3.4', ix + 12, 216, K.C.muted, 10);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const zone =
    steps <= 8
      ? { cls: 'good', text: '少步区：足够快，但直接砍步会伤画质与可控性——论文用因果强制 + DMD + 长展开训练把质量拉回来（绿）。' }
      : steps <= 30
      ? { cls: '', text: '步数增多，质量回升但吞吐下降，实时交互开始吃力（蓝）。' }
      : { cls: '', text: '接近双向教师的慢速高质量区——好，但不够快（橙）。' };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          去噪步数 <span className="val">{steps}</span>
        </label>
        <input
          type="range"
          min={1}
          max={50}
          value={steps}
          onChange={(e) => setSteps(clamp(Number(e.target.value), 1, 50))}
        />
      </div>
      <div className={`feedback ${zone.cls}`}>{zone.text}</div>
    </div>
  );
};

export default Mod71;
