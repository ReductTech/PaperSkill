import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch7.1 — pretraining mixture (P1 slider, mathematical view).
const W = 1080;
const H = 280;

export const C7Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ asr: 30 });
  const rafRef = useRef<number | null>(null);
  const [asr, setAsr] = useState(30);
  const [fb, setFb] = useState({ text: '拖动 ASR 占比，观察三类目标的配比与能力变化。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (asr: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      const cap = (100 - asr) * 0.5714;
      const text = 100 - asr - cap;
      const barX = 80;
      const barW = 560;
      let x = barX;
      const segs = [
        { v: asr, c: '#27446e' },
        { v: cap, c: '#228d5c' },
        { v: text, c: '#f07e47' },
      ];
      segs.forEach((s) => {
        const w = (s.v / 100) * barW;
        ctx.fillStyle = s.c;
        ctx.fillRect(x, 100, w, 50);
        x += w;
      });
      ctx.fillStyle = '#21324a';
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText('ASR ' + asr.toFixed(0) + '%', barX, 90);
      ctx.fillText('描述 ' + cap.toFixed(0) + '%', barX + 200, 90);
      ctx.fillText('文本 ' + text.toFixed(0) + '%', barX + 400, 90);
      // capability bars
      ctx.fillStyle = '#d7deea';
      ctx.fillRect(720, 100, 60, 120);
      ctx.fillStyle = '#27446e';
      ctx.fillRect(720, 220 - Math.min(120, asr * 2.4), 60, Math.min(120, asr * 2.4));
      ctx.fillStyle = '#228d5c';
      ctx.fillRect(810, 220 - Math.min(120, cap * 2.4), 60, Math.min(120, cap * 2.4));
      ctx.fillStyle = '#f07e47';
      ctx.fillRect(900, 220 - Math.min(120, text * 2.4), 60, Math.min(120, text * 2.4));
      ctx.fillStyle = '#21324a';
      ctx.fillText('对齐', 720, 250);
      ctx.fillText('描述', 810, 250);
      ctx.fillText('语言', 900, 250);
    };
    const tick = () => {
      render(stateRef.current.asr);
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
    const v = Number(e.target.value);
    stateRef.current.asr = v;
    setAsr(v);
    setFb(
      v >= 25 && v <= 40
        ? { text: '接近论文默认配比，较为均衡。', cls: 'good' }
        : { text: '偏离默认配比，某项能力可能偏弱。', cls: 'bad' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          ASR 占比 <span className="val">{asr}%</span>
        </label>
        <input type="range" min={10} max={60} value={asr} onChange={onChange} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default C7Mod1;
