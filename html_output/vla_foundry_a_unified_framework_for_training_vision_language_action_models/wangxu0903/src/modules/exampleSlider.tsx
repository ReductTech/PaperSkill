import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// EXAMPLE widget — copy this file as a template for paper-specific modules.
// One slider drives a Canvas bar; feedback color follows the value (red/green per
// contract.md §5). Each widget owns its own canvas + controls + feedback.

const W = 560;
const H = 240;

export const ExampleSlider: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ value: 0.5 });
  const rafRef = useRef<number | null>(null);
  const [value, setValue] = useState(0.5);
  const [feedback, setFeedback] = useState({ text: '拖动滑块，观察数值如何改变画面。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { value: number }) => {
      ctx.clearRect(0, 0, W, H);
      const h = clamp(s.value, 0, 1) * (H - 50);
      ctx.fillStyle = s.value > 0.7 ? '#228d5c' : s.value < 0.3 ? '#c43f52' : '#27446e';
      ctx.fillRect(40, H - 24 - h, W - 80, h);
      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('value = ' + s.value.toFixed(2), 40, 30);
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    stateRef.current.value = v;
    setValue(v);
    setFeedback(
      v > 0.7
        ? { text: '数值较高，更接近目标状态。', cls: 'good' }
        : v < 0.3
        ? { text: '数值偏低，偏离了目标。', cls: 'bad' }
        : { text: '处于中间区间，继续探索。', cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          参数 <span className="val">{value.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(value * 100)} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ExampleSlider;
