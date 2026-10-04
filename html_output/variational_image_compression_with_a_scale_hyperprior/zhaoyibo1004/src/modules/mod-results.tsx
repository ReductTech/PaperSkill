import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 300;

const CURVES = [
  { key: 'psnr', label: 'PSNR（越大越好）', data: [29.0, 31.0, 33.0, 35.0, 37.0], others: [28.0, 29.6, 31.0, 32.0, 32.8], anchor: 37.0 },
  { key: 'msssim', label: 'MS-SSIM（越大越好）', data: [0.94, 0.958, 0.971, 0.981, 0.988], others: [0.93, 0.947, 0.958, 0.966, 0.97], anchor: 0.988 },
];

export const ModResults: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ metric: 'psnr', t: 0 });
  const raf = useRef<number | null>(null);
  const [metric, setMetric] = useState('psnr');
  const [fb, setFb] = useState({ text: '看蓝色（本文方法）与红色（传统编码）曲线：同一码率下，本文质量更高。', cls: 'good' });

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(c, W, H);
    } catch {
      return;
    }

    const render = () => {
      const s = stateRef.current;
      const curve = CURVES.find((x) => x.key === s.metric) || CURVES[0];
      const isPsnr = s.metric === 'psnr';
      const yMin = isPsnr ? 27 : 0.92;
      const yMax = isPsnr ? 38 : 0.99;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const left = 90;
      const right = W - 60;
      const top = 40;
      const bottom = H - 60;
      const px = (i: number) => left + (i / (curve.data.length - 1)) * (right - left);
      const py = (v: number) => top + (1 - (v - yMin) / (yMax - yMin)) * (bottom - top);

      // axes
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(left, bottom);
      ctx.lineTo(right, bottom);
      ctx.stroke();

      // progressive reveal: draw up to t fraction
      const steps = curve.data.length;
      const shown = Math.floor(s.t * steps);

      const drawCurve = (data: number[], color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i <= Math.min(shown, data.length - 1); i += 1) {
          if (i === 0) ctx.moveTo(px(i), py(data[i]));
          else ctx.lineTo(px(i), py(data[i]));
        }
        ctx.stroke();
      };
      drawCurve(curve.others, '#c43f52');
      drawCurve(curve.data, '#27446e');

      // markers at head
      if (shown >= steps - 1) {
        const i = steps - 1;
        ctx.fillStyle = '#c43f52';
        ctx.beginPath();
        ctx.arc(px(i), py(curve.others[i]), 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#27446e';
        ctx.beginPath();
        ctx.arc(px(i), py(curve.data[i]), 7, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#21324a';
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(curve.label, left, 30);
      ctx.fillText('码率 (bpp) →', right - 110, bottom + 18);
    };

    const tick = () => {
      const s = stateRef.current;
      if (s.t < 1) s.t = Math.min(1, s.t + 0.02);
      render();
      if (!c.classList.contains('is-ready')) c.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf.current) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
    };
    const start = () => {
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(c, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (m: string) => {
    stateRef.current.metric = m;
    stateRef.current.t = 0;
    setMetric(m);
    const curve = CURVES.find((x) => x.key === m) || CURVES[0];
    setFb({ text: `${curve.label}：蓝线始终在红线上方，说明相同码率下本文方法质量更高。`, cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="chip-row">
        {CURVES.map((curve) => (
          <button key={curve.key} className={`chip ${metric === curve.key ? 'selected' : ''}`} onClick={() => pick(curve.key)}>
            {curve.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default ModResults;
