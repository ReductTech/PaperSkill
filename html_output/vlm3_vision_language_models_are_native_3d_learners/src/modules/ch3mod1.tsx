import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, drawSceneBg, drawWindow, drawGridCard, drawDot, label, drawBar } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 560;
const H = 240;

export const Ch3Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ a: false, b: false, c: false });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState({ a: false, b: false, c: false });
  const [feedback, setFeedback] = useState({ text: '点亮三要素：统一焦距、文本像素、配比放大。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const items = [
      { k: 'a' as const, title: '焦距统一', x: 40 },
      { k: 'b' as const, title: '文本像素', x: 210 },
      { k: 'c' as const, title: '配比+规模', x: 380 },
    ];
    const render = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, W, H); drawSceneBg(ctx, W, H);
      drawWindow(ctx, 180, 20, 200, 80, C.route);
      items.forEach((it) => {
        const on = s[it.k];
        ctx.fillStyle = on ? '#e6f6ee' : '#fff';
        ctx.strokeStyle = on ? C.green : C.muted;
        ctx.lineWidth = 2;
        ctx.fillRect(it.x, 120, 140, 70);
        ctx.strokeRect(it.x, 120, 140, 70);
        label(ctx, it.title, it.x + 28, 160, on ? C.green : C.muted, 14);
      });
    };
    const tick = () => { render(); canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const d = observeCanvas(canvas, start, stop);
    return () => { stop(); d(); };
  }, []);

  const toggle = (k: 'a' | 'b' | 'c') => {
    const next = { ...stateRef.current, [k]: !stateRef.current[k] };
    stateRef.current = next; setSel({ ...next });
    const n = Number(next.a) + Number(next.b) + Number(next.c);
    setFeedback(n === 3
      ? { text: '三要素齐备（绿）：复杂结构并非必要条件。', cls: 'good' }
      : n === 0
      ? { text: '尚未选择要素（红）。', cls: 'bad' }
      : { text: '已点亮 ' + n + '/3，继续补齐（蓝）。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className={`chip ${sel.a ? 'on' : ''}`} onClick={() => toggle('a')}>① 统一</button>
        <button type="button" className={`chip ${sel.b ? 'on' : ''}`} onClick={() => toggle('b')}>② 文本像素</button>
        <button type="button" className={`chip ${sel.c ? 'on' : ''}`} onClick={() => toggle('c')}>③ 配比放大</button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch3Mod1;
