import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ============================================================================
// Presentation mode: hybrid linked views (left integer string + hand; right seven action bars).
// m-action-read — chapter 3 active module (P4 chips + P2 step-through).
// Learner switches the reading of the SAME integer string between 文本读法 and
// 动作读法, then steps 下一位 to raise the seven action bars one by one. Shows
// that one string is simultaneously text and action. Evidence: page 2 Fig 1
// caption; page 5–6 §3.2 (action space + `1 128 91 241 5 101 127`).
// ============================================================================

const W = 720;
const H = 300;
const C = {
  bg: '#f5f8f0', counter: '#e7e3d8', counterEdge: '#cfc8b6', envLight: '#b8c9a7',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  ink: '#21324a', muted: '#68778f', axis: '#d7deea',
};

const STR = ['1', '128', '91', '241', '5', '101', '127'];
const BIN = [1, 128, 91, 241, 5, 101, 127]; // terminate + 6 dims shown as 7 slots

type Reading = 'text' | 'action';

function label(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color = C.muted) {
  ctx.fillStyle = color;
  ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillText(text, x, y);
}

export const MActionRead: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const reading = useRef<Reading>('text');
  const cursor = useRef(0);
  const [readingUi, setReadingUi] = useState<Reading>('text');
  const [cursorUi, setCursorUi] = useState(0);
  const [fb, setFb] = useState({ text: '先把它当文字读，再切换成动作读法。', cls: '' });

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = 720;
    const h = 300;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = C.envLight;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(0, 0, w, 28);
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.counter;
    ctx.fillRect(0, 210, w, h - 210);
    ctx.strokeStyle = C.counterEdge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 210);
    ctx.lineTo(w, 210);
    ctx.stroke();

    // string as monospace digits
    ctx.font = '22px "Cascadia Code", Consolas, monospace';
    let x = 40;
    STR.forEach((s, i) => {
      const on = reading.current === 'action' && i < cursor.current;
      ctx.fillStyle = on ? C.blue : C.ink;
      ctx.fillText(s, x, 120);
      if (i === cursor.current - 1 && reading.current === 'action') {
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 4, 98, s.length * 14 + 8, 30);
      }
      x += s.length * 14 + 14;
    });
    label(ctx, 40, 150, reading.current === 'text' ? '当成文字读' : '当成动作读', reading.current === 'text' ? C.muted : C.blue);

    // hand indicator
    const hx = 46 + BIN.slice(0, cursor.current).reduce((a, s) => a + String(s).length * 14 + 14, 0);
    ctx.fillStyle = '#e8c39a';
    ctx.beginPath();
    ctx.ellipse(clamp(hx, 40, 400), 84, 12, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // action bars
    const bx = 440;
    const base = 232;
    for (let i = 0; i < 7; i++) {
      const val = BIN[i] / 255;
      const on = reading.current === 'action' && i < cursor.current;
      const bh = on ? Math.max(6, val * 150) : 6;
      const x2 = bx + i * 34;
      ctx.fillStyle = on ? (i === 0 ? C.orange : i === 6 ? C.green : C.blue) : '#c3c9d3';
      ctx.fillRect(x2, base - bh, 24, bh);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(x2, base - bh, 24, bh);
    }
    label(ctx, bx - 6, 46, '动作维度', C.muted);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    canvas.classList.add('is-ready');
    const loop = () => {
      render();
      rafRef.current = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (r: Reading) => {
    reading.current = r;
    setReadingUi(r);
    if (r === 'text') {
      cursor.current = 0;
      setCursorUi(0);
      setFb({ text: '这只是 8 个普通的字，还没有成为动作。', cls: '' });
    } else {
      setFb({ text: '按「下一位」逐位读出，看它变成动作。', cls: '' });
    }
  };
  const nextDigit = () => {
    if (reading.current !== 'action') return;
    cursor.current = Math.min(7, cursor.current + 1);
    setCursorUi(cursor.current);
    setFb(
      cursor.current >= 7
        ? { text: '8 位读齐，动作已经完整地写出来了。', cls: 'good' }
        : { text: `第 ${cursor.current} 位抬起，对应一个动作维度。`, cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-m-action-read`} ref={canvasRef} width={W} height={H} aria-label="同一串数字的两种读法" />
      <div className="chip-row">
        <button type="button" className={`chip ${readingUi === 'text' ? 'selected' : ''}`} onClick={() => choose('text')}>
          当文字读
        </button>
        <button type="button" className={`chip ${readingUi === 'action' ? 'selected' : ''}`} onClick={() => choose('action')}>
          当动作读
        </button>
      </div>
      <div className="step-ctrl">
        <button type="button" className="chip" onClick={nextDigit} disabled={readingUi !== 'action' || cursorUi >= 7}>
          {cursorUi >= 7 ? '已读齐' : '下一位'}
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default MActionRead;
