import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch1.1 — acoustic-complexity stress test (P1 slider, hybrid life + technical).
// As complexity rises: the acoustic content (left) GROWS while the info a single
// final-layer representation retains (right) SHRINKS. Both follow the same state.
const W = 1080;
const H = 280;

export const C1Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ complexity: 20 });
  const rafRef = useRef<number | null>(null);
  const [complexity, setComplexity] = useState(20);
  const [fb, setFb] = useState({ text: '拖动滑块，观察只保留末层表征时线索如何流失。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (c: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // LEFT (life): acoustic content grows with complexity (1..6 layers)
      const layers = 1 + Math.round((c / 100) * 5);
      for (let i = 0; i < layers; i++) {
        ctx.strokeStyle = i === 0 ? '#27446e' : '#7c3aed';
        ctx.globalAlpha = i === 0 ? 1 : 0.55;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 40; x < 560; x += 5) {
          const amp = 10 + i * 3;
          ctx.lineTo(x, 150 + (i - (layers - 1) / 2) * 14 * Math.sin((x / 560) * Math.PI * 5 + i * 0.7) * (amp / 20));
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#21324a';
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText('声学内容 ' + layers + ' 层', 40, 40);

      // RIGHT (technical): retained info shrinks as complexity rises
      const retained = clamp(1 - c / 100, 0, 1);
      ctx.fillStyle = '#d7deea';
      ctx.fillRect(720, 60, 60, 180);
      ctx.fillStyle = retained > 0.4 ? '#228d5c' : '#c43f52';
      ctx.fillRect(720, 240 - retained * 180, 60, retained * 180);
      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText((retained * 100).toFixed(0) + '%', 730, 50);
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText('末层保留', 700, 262);
    };
    const tick = () => {
      render(stateRef.current.complexity);
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
    const c = Number(e.target.value);
    stateRef.current.complexity = c;
    setComplexity(c);
    setFb(
      c < 35
        ? { text: '线索保留充分，基础模型暂时够用。', cls: 'good' }
        : c <= 70
        ? { text: '开始丢失部分非语音线索。', cls: '' }
        : { text: '单一末层无法承载这么多粒度，信息大量丢失。', cls: 'bad' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          声学复杂度 <span className="val">{complexity}</span>
        </label>
        <input type="range" min={0} max={100} value={complexity} onChange={onChange} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default C1Mod1;
