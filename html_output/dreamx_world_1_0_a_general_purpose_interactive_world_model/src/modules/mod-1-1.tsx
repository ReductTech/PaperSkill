import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import * as K from './roadKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 260;

export const Mod11: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [flagX, setFlagX] = useState(0.5);
  const [touched, setTouched] = useState(false);
  const stateRef = useRef({ flagX: 0.5, dragging: false });
  stateRef.current.flagX = flagX;

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

    const town = (ox: number, oy: number, shift: number, border: string, title: string) => {
      K.drawPanel(ctx, ox, oy, 260, 150, border);
      ctx.save();
      ctx.beginPath();
      ctx.rect(ox + 2, oy + 2, 256, 146);
      ctx.clip();
      K.drawHouse(ctx, ox + 70 + shift, oy + 108, 1.1, K.C.depth);
      K.drawHouse(ctx, ox + 160 + shift * 0.6, oy + 118, 0.85, K.C.ground);
      K.drawTree(ctx, ox + 220 + shift * 1.3, oy + 118, 1);
      K.drawLabel(ctx, title, ox + 10, oy + 20, K.C.ink, 12);
      ctx.restore();
    };

    const frame = () => {
      const fx = stateRef.current.flagX;
      K.clearScene(ctx, W, H);
      const shift = (fx - 0.5) * 70;
      town(16, 12, 0, K.C.emph, '普通视频');
      town(292, 12, shift, K.C.guide, '世界模型');
      // drag route strip
      K.drawRoad(ctx, 40, 205, 480, 16);
      K.drawLabel(ctx, '拖动目的地旗', 40, 196, K.C.muted, 10);
      const fxpx = 40 + fx * 480;
      K.drawFlag(ctx, fxpx, 205, K.C.emph);
      ctx.fillStyle = K.C.ink;
      ctx.beginPath();
      ctx.arc(fxpx, 213, 7, 0, Math.PI * 2);
      ctx.fill();
      K.drawLabel(
        ctx,
        `视角偏移 ${Math.round(shift)} px`,
        292,
        182,
        shift === 0 ? K.C.muted : K.C.guide,
        11
      );
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

    const toFlag = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * W;
      return clamp((x - 40) / 480, 0, 1);
    };
    const onDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const y = ((e.clientY - rect.top) / rect.height) * H;
      if (y > 185) {
        stateRef.current.dragging = true;
        setFlagX(toFlag(e.clientX));
        setTouched(true);
      }
    };
    const onMove = (e: PointerEvent) => {
      if (stateRef.current.dragging) {
        setFlagX(toFlag(e.clientX));
        setTouched(true);
      }
    };
    const onUp = () => {
      stateRef.current.dragging = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const d = e.key === 'ArrowRight' ? 0.05 : -0.05;
        setFlagX((v) => clamp(v + d, 0, 1));
        setTouched(true);
        e.preventDefault();
      }
    };
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    canvas.addEventListener('keydown', onKey);
    return () => {
      stop();
      disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('keydown', onKey);
    };
  }, []);

  const shift = Math.round((flagX - 0.5) * 70);
  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        style={{ cursor: 'grab', touchAction: 'none' }}
      />
      <div className={`feedback ${touched ? 'good' : ''}`}>
        {touched
          ? `左栏怎么拖都不变——视频只能重播固定画面；右栏视角跟着你的路线移动了 ${Math.abs(
              shift
            )} px——这就是可交互（绿）。`
          : '试着左右拖动下方路线上的目的地旗（或用 ←/→ 键），观察两栏的差别。'}
      </div>
    </div>
  );
};

export default Mod11;
