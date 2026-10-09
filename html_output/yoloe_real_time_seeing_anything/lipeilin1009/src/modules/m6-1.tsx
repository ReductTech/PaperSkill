import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawSceneLabel, insetBox } from './birdKit';

// m6-1 (lazy-delta) — 懒检索调节台：δ 控制留下多少锚点去查词表。

const W = 1080;
const H = 280;
const STEPS = [
  { label: '1e-4', frac: 0.45, speed: '1.2×', ap: '几乎不变', tone: 'ok' },
  { label: '3e-4', frac: 0.30, speed: '1.5×', ap: '几乎不变', tone: 'ok' },
  { label: '1e-3', frac: 0.20, speed: '1.7×', ap: '几乎不变', tone: 'ok' },
  { label: '3e-3', frac: 0.10, speed: '1.8×', ap: '几乎不变', tone: 'ok' },
  { label: '1e-2', frac: 0.05, speed: '1.9×', ap: '−0.2 AP', tone: 'warn' },
];
const COLS = 60;
const ROWS = 22;

export const M6_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ idx: 2 });
  const rafRef = useRef<number | null>(null);
  const [idx, setIdx] = useState(2);
  const [feedback, setFeedback] = useState({
    text: 'δ=0.001：八成锚点被跳过，速度提升约 1.7 倍，精度几乎不动。',
    cls: 'good',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    // 稳定伪随机（同一格子在不同档位下表现一致）
    const rand = (i: number) => {
      let h = (i * 2654435761) >>> 0;
      h ^= h >> 13;
      h = (h * 2246822519) >>> 0;
      return h / 4294967296;
    };

    const render = () => {
      const s = stateRef.current;
      const step = STEPS[s.idx];
      clearScene(ctx, W, H);

      // 左：锚点网格（象征 8400 锚点）
      drawSceneLabel(ctx, '8400 个锚点', 30, 34, PALETTE.ink);
      const total = COLS * ROWS;
      for (let i = 0; i < total; i++) {
        const cx = 30 + (i % COLS) * 10;
        const cy = 48 + Math.floor(i / COLS) * 10;
        ctx.fillStyle = rand(i) < step.frac ? PALETTE.green : '#e3e8ee';
        ctx.fillRect(cx, cy, 8, 8);
      }

      // 右：inset 三项数值
      insetBox(ctx, 680, 44, 360, 196);
      drawSceneLabel(ctx, '阈值 δ = ' + step.label, 708, 80, PALETTE.ink);
      const kept = Math.round(8400 * step.frac);
      ctx.save();
      ctx.font = '15px sans-serif';
      ctx.fillStyle = PALETTE.ink;
      ctx.fillText('保留锚点约 ' + kept + ' 个', 708, 118);
      ctx.fillStyle = PALETTE.green;
      ctx.fillText('相对速度 ' + step.speed, 708, 152);
      ctx.fillStyle = step.tone === 'warn' ? PALETTE.orange : PALETTE.green;
      ctx.fillText('AP 影响：' + step.ap, 708, 186);
      ctx.restore();
    };

    const tick = () => {
      render();
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

  const onSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    stateRef.current.idx = v;
    setIdx(v);
    if (v === 0) setFeedback({ text: '阈值太松：留下来的太多，提速有限。', cls: '' });
    else if (v === 4) setFeedback({ text: '阈值太狠：提速 1.9 倍，但开始掉点（−0.2 AP）。', cls: 'bad' });
    else setFeedback({ text: 'δ=' + STEPS[v].label + '：速度与精度的甜点位附近。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          阈值 δ <span className="val">{STEPS[idx].label}</span>
        </label>
        <input type="range" min={0} max={4} step={1} value={idx} onChange={onSlider} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M6_1;
