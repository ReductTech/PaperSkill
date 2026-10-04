import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 300;

export const ModDensity: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ w: 0.2, dragging: false });
  const raf = useRef<number | null>(null);
  const [w, setW] = useState(0.2);
  const [fb, setFb] = useState({ text: '拖动滑块调节卷积核宽度：窄核看得清纹理，宽核只看见平滑轮廓。', cls: '' });

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
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // input fine structure (left)
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(80, 40, 300, 200);
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 80; x <= 380; x += 3) {
        const y = 140 + Math.sin(x * 0.12) * 30 + Math.sin(x * 0.04) * 14;
        if (x === 80) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = '#27446e';
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('原始信号', 230, 30);

      // output smoothed (right)
      ctx.fillStyle = '#e6ede2';
      ctx.fillRect(700, 40, 300, 200);
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = 80; x <= 380; x += 3) {
        let sum = 0;
        for (let k = -4; k <= 4; k += 1) {
          const xx = clamp(x + k, 80, 380);
          sum += 140 + Math.sin(xx * 0.12) * 30 + Math.sin(xx * 0.04) * 14;
        }
        const y = sum / 9;
        const sx = 700 + (x - 80);
        if (x === 80) ctx.moveTo(sx, y);
        else ctx.lineTo(sx, y);
      }
      ctx.stroke();
      ctx.fillStyle = '#27446e';
      ctx.fillText('平滑后信号', 850, 30);

      // kernel width indicator
      const kw = 30 + s.w * 130;
      ctx.fillStyle = '#f07e47';
      ctx.fillRect(540 - kw / 2, H - 50, kw, 10);
      ctx.fillStyle = '#21324a';
      ctx.textAlign = 'center';
      ctx.fillText('核宽', 540, H - 58);
    };

    const tick = () => {
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value) / 100, 0, 1);
    stateRef.current.w = v;
    setW(v);
    if (v < 0.25) setFb({ text: '窄核：保留高频纹理，重建更锐利，但码率也更高。', cls: 'good' });
    else if (v > 0.75) setFb({ text: '宽核：只留下平滑轮廓，码率很低，但纹理细节丢失。', cls: '' });
    else setFb({ text: '中等核宽：纹理与码率之间的折中。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          卷积核宽度 <span className="val">{w.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(w * 100)} onChange={onChange} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default ModDensity;
