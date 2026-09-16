import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch1.2 — the temporal difficulty (P1 slider, hybrid).
// Fixed absolute time axis (0..60s). The true event time grows with the chosen
// audio length; without explicit time cues the inferred time lags by a drift that
// grows with length (paper §1, §2.4). Both markers move, so the slider clearly
// changes the scene.
const W = 1080;
const H = 280;
const AXIS_MAX = 60;

export const C1Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ len: 10 });
  const rafRef = useRef<number | null>(null);
  const [len, setLen] = useState(10);
  const [fb, setFb] = useState({ text: '拖动音频长度，观察事件时间推断的误差如何变化。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const x0 = 70;
    const x1 = W - 70;
    const sx = (sec: number) => x0 + (sec / AXIS_MAX) * (x1 - x0);

    const render = (L: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // axis (fixed 0..60s)
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, 160);
      ctx.lineTo(x1, 160);
      ctx.stroke();
      ctx.fillStyle = '#68778f';
      ctx.font = '13px "Segoe UI", sans-serif';
      for (let s = 0; s <= AXIS_MAX; s += 10) {
        ctx.beginPath();
        ctx.moveTo(sx(s), 155);
        ctx.lineTo(sx(s), 165);
        ctx.stroke();
        ctx.fillText(s + 's', sx(s) - 10, 185);
      }
      // audio extent (up to L)
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(x0, 148, sx(L) - x0, 12);

      const tTrue = 0.8 * L;
      const drift = (L / AXIS_MAX) * 6;
      const tHat = tTrue - drift;

      // error span
      ctx.strokeStyle = '#f07e47';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx(tHat), 110);
      ctx.lineTo(sx(tTrue), 110);
      ctx.stroke();

      // inferred (red) and true (green) markers
      ctx.fillStyle = '#c43f52';
      ctx.fillRect(sx(tHat) - 3, 90, 6, 80);
      ctx.fillStyle = '#228d5c';
      ctx.fillRect(sx(tTrue) - 3, 90, 6, 80);

      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillStyle = '#c43f52';
      ctx.fillText('推断', sx(tHat) - 14, 82);
      ctx.fillStyle = '#228d5c';
      ctx.fillText('真值', sx(tTrue) - 14, 82);

      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('时间推断误差 ' + drift.toFixed(1) + 's', 70, 45);
    };

    const tick = () => {
      render(stateRef.current.len);
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
    stateRef.current.len = v;
    setLen(v);
    const drift = (v / AXIS_MAX) * 6;
    setFb(
      drift < 1
        ? { text: '短音频里靠相对位置还能大致推断时间。', cls: 'good' }
        : drift <= 3
        ? { text: '音频变长，时间推断开始偏移。', cls: '' }
        : { text: '长音频中仅靠相对位置推断时间已明显不可靠。', cls: 'bad' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          音频长度 <span className="val">{len}s</span>
        </label>
        <input type="range" min={5} max={60} value={len} onChange={onChange} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default C1Mod2;
