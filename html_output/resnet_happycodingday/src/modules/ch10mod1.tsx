import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import { C, clearScene, drawSceneLabel } from './kit-p4';
import type { WidgetProps } from './registry';

// Ch10 M10.1: P8 result race — five models' top-5 error on ImageNet test set (Table 5, lower is better).
const W = 560;
const H = 240;

const MODELS = [
  { name: 'VGG (ILSVRC14)', err: 7.32 },
  { name: 'GoogLeNet', err: 6.66 },
  { name: 'PReLU-net', err: 4.94 },
  { name: 'BN-Inception', err: 4.82 },
  { name: 'ResNet (ILSVRC15)', err: 3.57, win: true },
];

const MAX_ERR = 8;

export const Ch10Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ running: false, t: 0 });
  const rafRef = useRef<number | null>(null);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { running: boolean; t: number }) => {
      clearScene(ctx, W, H);
      const t = s.t;
      drawSceneLabel(ctx, 'ImageNet 测试集 top-5 误差（越低越好）', W / 2, 16, C.muted, 'center');
      const barX = 150;
      const barW = 360;
      MODELS.forEach((m, i) => {
        const y = 46 + i * 34;
        const dist = easeOutCubic(clamp(t * (m.err === 3.57 ? 1 : 1 - (i * 0.02)), 0, 1)) * (1 - m.err / MAX_ERR);
        const len = dist * barW;
        ctx.fillStyle = m.win ? C.green : '#b8c9a7';
        ctx.fillRect(barX, y, len, 18);
        ctx.strokeStyle = m.win ? C.green : C.border;
        ctx.lineWidth = m.win ? 2 : 1;
        ctx.strokeRect(barX, y, len, 18);
        ctx.fillStyle = C.ink;
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(m.name, 10, y + 13);
        ctx.fillStyle = m.win ? C.green : C.muted;
        ctx.fillText(`${m.err}%`, barX + len + 8, y + 13);
        if (m.win && t >= 1) {
          ctx.font = '16px sans-serif';
          ctx.fillText('🏆', barX + len + 42, y + 14);
        }
      });
      drawSceneLabel(ctx, '误差越小 → 到达越远', 150, 236, C.muted);
    };
    const tick = () => {
      const s = stateRef.current;
      if (s.running) {
        s.t = clamp(s.t + 0.006, 0, 1);
        if (s.t >= 1) {
          s.running = false;
          setRunning(false);
          setFinished(true);
        }
      }
      render(s);
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

  const begin = () => {
    stateRef.current.running = true;
    stateRef.current.t = 0;
    setRunning(true);
    setFinished(false);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button onClick={begin} disabled={running}>
          {finished ? '再来一次' : '开始评比'}
        </button>
      </div>
      <div className={`feedback ${finished ? 'good' : ''}`}>
        {finished
          ? 'ResNet 以 3.57% 的 top-5 误差最先到达——ILSVRC 2015 分类冠军（测试集，越低越好）。'
          : running
          ? '同一把尺子，五个模型同台冲刺……'
          : '按「开始评比」，五个模型在同一把尺上比拼 top-5 误差（ImageNet 测试集）。'}
      </div>
    </div>
  );
};

export default Ch10Mod1;
