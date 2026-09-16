import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch8.2 — DeepStack ablation (P4 mode chips + bar comparison).
const W = 1080;
const H = 280;

const LABELS = ['语音纯', '音乐纯', '纯音', '环境', '整体'];
const BASE = [0.4861, 0.4705, 0.4015, 0.1586, 0.4823];
const STACK = [0.4791, 0.4927, 0.4255, 0.1594, 0.4831];

export const C4Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ stack: false });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<'base' | 'stack'>('base');
  const [fb, setFb] = useState({ text: '切换模式，比较 MECAT-Caption 上各场景的 DATE 分数（越高越好）。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (stack: boolean) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      const vals = stack ? STACK : BASE;
      const bw = 120;
      vals.forEach((v, i) => {
        const x = 90 + i * 180;
        const h = v * 380;
        ctx.fillStyle = i === 4 ? '#228d5c' : '#27446e';
        ctx.fillRect(x, 240 - h, bw, h);
        ctx.fillStyle = '#21324a';
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText(LABELS[i], x + 20, 262);
        ctx.fillText(v.toFixed(4), x + 18, 240 - h - 8);
      });
    };
    const tick = () => {
      render(stateRef.current.stack);
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

  const pick = (m: 'base' | 'stack') => {
    stateRef.current.stack = m === 'stack';
    setMode(m);
    setFb(
      m === 'base'
        ? { text: '仅末层：非语音场景偏低。', cls: 'bad' }
        : { text: 'DeepStack：非语音提升，语音略降，整体更高。', cls: 'good' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className={mode === 'base' ? 'chip active' : 'chip'} onClick={() => pick('base')}>
          仅末层
        </button>
        <button type="button" className={mode === 'stack' ? 'chip active' : 'chip'} onClick={() => pick('stack')}>
          DeepStack
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default C4Mod2;
