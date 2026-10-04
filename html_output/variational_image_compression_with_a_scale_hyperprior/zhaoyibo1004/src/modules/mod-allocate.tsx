import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 300;

export const ModAllocate: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ x: 540, dragging: false });
  const raf = useRef<number | null>(null);
  const [fb, setFb] = useState({ text: '拖动橙色笔沿着地形移动，观察每处的陡度 σ 决定该给多少比特。', cls: '' });

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(c, W, H);
    } catch {
      return;
    }
    const ground = (x: number) => 150 + Math.sin(x * 0.006) * 44 + Math.sin(x * 0.02) * 12;
    const slope = (x: number) => Math.abs(Math.cos(x * 0.006) * 0.04 + Math.cos(x * 0.02) * 0.012);

    const render = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // terrain silhouette
      ctx.fillStyle = '#b8c9a7';
      ctx.beginPath();
      ctx.moveTo(60, H);
      ctx.lineTo(60, ground(60));
      for (let x = 60; x <= W - 60; x += 6) ctx.lineTo(x, ground(x));
      ctx.lineTo(W - 60, H);
      ctx.closePath();
      ctx.fill();

      // ink allocation profile (accumulated along path so far) — density tracks slope
      const px = clamp(s.x, 60, W - 60);
      for (let x = 60; x <= px; x += 10) {
        const dens = slope(x) * 26;
        ctx.fillStyle = '#27446e';
        ctx.beginPath();
        ctx.arc(x, ground(x) - 22 - dens, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // sigma bar under marker
      const sig = slope(px) * 240;
      ctx.fillStyle = '#f07e47';
      ctx.fillRect(px - 6, H - 30 - sig, 12, sig);

      // marker pen
      ctx.save();
      ctx.translate(px, ground(px));
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-12, -3, 20, 6);
      ctx.fillStyle = '#f07e47';
      ctx.beginPath();
      ctx.moveTo(8, -3);
      ctx.lineTo(8, 3);
      ctx.lineTo(15, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
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

  const toX = (clientX: number) => {
    const c = ref.current;
    if (!c) return 540;
    const rect = c.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * W;
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    stateRef.current.dragging = true;
    stateRef.current.x = clamp(toX(e.clientX), 60, W - 60);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.dragging) return;
    stateRef.current.x = clamp(toX(e.clientX), 60, W - 60);
    const steep = Math.abs(Math.cos(stateRef.current.x * 0.006));
    if (steep > 0.7) setFb({ text: '此处地形很陡（σ 大）：应多分配比特，把细节保住。', cls: 'good' });
    else setFb({ text: '此处地形平缓（σ 小）：少分配比特即可，别浪费。', cls: '' });
  };
  const onUp = () => {
    stateRef.current.dragging = false;
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        style={{ cursor: stateRef.current.dragging ? 'grabbing' : 'grab' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      />
      <div className="step-desc">拖动笔沿地形移动：陡处 σ 大、多给比特；平处 σ 小、少给比特。</div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default ModAllocate;
