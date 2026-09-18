import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch2.2 — 12.5 Hz frame sequence + sliding-window attention (P6 drag).
// The encoder attends to at most 100 frames (8 s) at a time; the window slides,
// so cost scales linearly with length (paper §2.2). Drag the window along the
// frame sequence to see which frames are attended.
const W = 1080;
const H = 280;
const DUR = 24; // seconds shown (longer than the window, to show locality)
const WIN = 8; // window length in seconds (= 100 frames at 12.5 Hz)

const wave = (sec: number) => Math.sin(sec * 6) * Math.sin(sec * 1.7);

export const C2Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ start: 0 });
  const rafRef = useRef<number | null>(null);
  const [start, setStart] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const x0 = 40;
    const x1 = W - 40;
    const xOf = (sec: number) => x0 + (sec / DUR) * (x1 - x0);

    const render = (winStart: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // continuous waveform (top)
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let x = x0; x <= x1; x += 2) {
        const sec = ((x - x0) / (x1 - x0)) * DUR;
        ctx.lineTo(x, 80 + 26 * wave(sec));
      }
      ctx.stroke();

      // 12.5 Hz frame sequence (bottom) with sliding window
      const winEnd = winStart + WIN;
      const baseY = 230;
      const nFrames = Math.floor(DUR * 12.5);
      for (let i = 0; i <= nFrames; i++) {
        const sec = i / 12.5;
        const x = xOf(sec);
        const inWin = sec >= winStart && sec <= winEnd;
        const amp = wave(sec);
        ctx.strokeStyle = inWin ? '#27446e' : '#b8c9a7';
        ctx.lineWidth = inWin ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x, baseY - amp * 36);
        ctx.stroke();
      }
      // window band
      ctx.fillStyle = 'rgba(240,126,71,0.12)';
      ctx.fillRect(xOf(winStart), 120, xOf(winEnd) - xOf(winStart), baseY - 120);
      ctx.strokeStyle = '#f07e47';
      ctx.lineWidth = 2;
      ctx.strokeRect(xOf(winStart), 120, xOf(winEnd) - xOf(winStart), baseY - 120);

      ctx.fillStyle = '#21324a';
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText('连续波形', x0, 34);
      ctx.fillText('滑窗 100 帧 = 8 秒', x0, baseY + 26);
      ctx.fillText('窗口 ' + winStart.toFixed(0) + '–' + winEnd.toFixed(0) + 's', x1 - 160, 34);
    };

    const tick = () => {
      render(stateRef.current.start);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const startFn = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, startFn, stop);

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * W;
      const sec = ((x - x0) / (x1 - x0)) * DUR;
      const s = clamp(sec - WIN / 2, 0, DUR - WIN);
      stateRef.current.start = s;
      setStart(s);
    };
    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      onPointer(e);
    };
    const onMove = (e: PointerEvent) => {
      if (e.buttons > 0) onPointer(e);
    };
    canvas.style.cursor = 'grab';
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    return () => {
      stop();
      disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
    };
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    let s = start;
    if (e.key === 'ArrowRight') s = clamp(s + 1, 0, DUR - WIN);
    else if (e.key === 'ArrowLeft') s = clamp(s - 1, 0, DUR - WIN);
    else return;
    stateRef.current.start = s;
    setStart(s);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        onKeyDown={onKey}
      />
      <div className="ctrl">
        <label>
          窗口起点 <span className="val">{start.toFixed(0)}s</span>
        </label>
      </div>
      <div className="feedback">注意力只覆盖窗口内的 100 帧（8 秒）；窗口滑动，计算量随音频长度线性增长。</div>
    </div>
  );
};

export default C2Mod2;
