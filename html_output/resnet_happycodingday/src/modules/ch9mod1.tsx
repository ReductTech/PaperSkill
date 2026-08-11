import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, clearScene, drawSceneLabel } from './kit-p4';
import type { WidgetProps } from './registry';

// Ch9 M9.1: P4 chips BN on/off — training curve stable vs jittery.
const W = 560;
const H = 240;

export const Ch9Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ bnOn: true });
  const rafRef = useRef<number | null>(null);
  const [bnOn, setBnOn] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { bnOn: boolean }) => {
      clearScene(ctx, W, H);
      const ox = 110;
      const oy = 200;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + 420, oy);
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox, oy - 160);
      ctx.stroke();
      drawSceneLabel(ctx, '训练损失', ox + 8, oy - 172, C.muted);
      drawSceneLabel(ctx, '迭代', ox + 370, oy + 10, C.muted);
      const pts: [number, number][] = [];
      const N = 60;
      for (let i = 0; i <= N; i++) {
        const x = i / N;
        let y: number;
        if (s.bnOn) y = 0.95 * Math.exp(-x * 3.5) + 0.04 + 0.02 * Math.sin(x * 30);
        else y = 0.6 + 0.35 * Math.abs(Math.sin(x * 14)) + 0.05 * Math.sin(x * 47);
        pts.push([ox + x * 400, oy - y * 150]);
      }
      ctx.strokeStyle = s.bnOn ? C.green : C.red;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.stroke();
      // manuscript state
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.fillRect(40, 40, 150, 60);
      ctx.strokeRect(40, 40, 150, 60);
      for (let i = 0; i < 3; i++) {
        const wob = s.bnOn ? 0 : (i % 2) * 4 - 2;
        ctx.strokeStyle = s.bnOn ? C.ink : C.red;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(50, 58 + i * 14 + wob);
        ctx.lineTo(180, 58 + i * 14 - wob);
        ctx.stroke();
      }
      drawSceneLabel(ctx, s.bnOn ? 'BN 开：笔迹稳定' : 'BN 关：笔迹抖动', 115, 22, s.bnOn ? C.green : C.red, 'center');
    };
    const tick = () => {
      render(stateRef.current);
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

  const pick = (on: boolean) => {
    stateRef.current.bnOn = on;
    setBnOn(on);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${bnOn ? 'active' : ''}`} onClick={() => pick(true)}>
          BN 开
        </button>
        <button className={`chip ${!bnOn ? 'active' : ''}`} onClick={() => pick(false)}>
          BN 关
        </button>
      </div>
      <div className={`feedback ${bnOn ? 'good' : 'bad'}`}>
        {bnOn
          ? 'BN 让每一层输入分布稳定，曲线平滑收敛——论文用它替代 dropout。'
          : '没有 BN，深层训练抖动剧烈、难以收敛。'}
      </div>
    </div>
  );
};

export default Ch9Mod1;
