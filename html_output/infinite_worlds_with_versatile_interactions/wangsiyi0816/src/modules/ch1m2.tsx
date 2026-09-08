import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, easeOutCubic, clamp } from '../lib/canvasKit';
import {
  PAL,
  clearScene,
  drawBasket,
  drawLegend,
  drawNeedles,
  drawScarf,
  drawSceneLabel,
  drawTargetWidthGuide,
  drawYarnBall,
  setupCrispCanvas,
} from './knitKit';
import type { WidgetProps } from './registry';

const W = 720;
const H = 280;
const ROWS = 28;
const MORPH_MS = 400;

interface S {
  antiDrift: boolean;
  morphStart: number;
  morphFrom: number;
}

export const Ch1M2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<S>({ antiDrift: false, morphStart: -1, morphFrom: 0 });
  const rafRef = useRef<number | null>(null);
  const [antiDrift, setAntiDrift] = useState(false);
  const [feedback, setFeedback] = useState({
    text: '关闭抗漂移训练：织到 60 分钟时边缘已经甩出导引带，后面每一行都在放大前面的错。',
    cls: 'bad',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    let detachCrisp: () => void;
    try {
      const crisp = setupCrispCanvas(canvas, W, H);
      ctx = crisp.ctx;
      detachCrisp = crisp.detach;
    } catch {
      return;
    }

    const render = (s: S, time: number) => {
      // morph between the two widthFn regimes so the "repair" is visible
      const target = s.antiDrift ? 1 : 0;
      let k = target;
      if (s.morphStart >= 0) {
        const p = clamp((time - s.morphStart) / MORPH_MS, 0, 1);
        k = s.morphFrom + (target - s.morphFrom) * easeOutCubic(p);
      }
      const col = k > 0.5 ? PAL.green : PAL.red;

      clearScene(ctx, W, H);
      drawTargetWidthGuide(ctx, 46, 640, 170, 30);
      drawBasket(ctx, 32, 170, 6);
      const end = drawScarf(
        ctx,
        52,
        170,
        ROWS,
        (i) => {
          const drifted = 26 + 34 * Math.pow(i / (ROWS - 1), 2);
          // Anti-drift is not "no error" — errors keep appearing, they just stop
          // accumulating. Each row takes a real kick toward the band edge and is
          // pulled back, so the edge visibly works against the guide instead of
          // sitting flat on the centre line.
          const kick = Math.sin(i * 1.7) * 9 + Math.sin(i * 0.61) * 5.5;
          const pullBack = Math.exp(-((i % 6) / 2.2));
          const held = 26 + kick * pullBack;
          return drifted + (held - drifted) * k;
        },
        col,
        22
      );
      drawYarnBall(ctx, 58, 230, time);
      drawNeedles(ctx, Math.min(end, 646), 170, 0.18, col, 4);

      drawSceneLabel(ctx, 52, 36, '固定 60 分钟');
      // state badge, top-right
      const badge = k > 0.5 ? '抗漂移训练：开' : '抗漂移训练：关';
      ctx.font = '600 13px "Segoe UI", sans-serif';
      const bw = ctx.measureText(badge).width + 18;
      ctx.fillStyle = PAL.paper;
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(W - bw - 18, 20, bw, 24);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.fillText(badge, W - bw - 9, 36);

      drawLegend(ctx, 52, 262, [
        { color: PAL.green, label: '留在导引带内' },
        { color: PAL.red, label: '甩出导引带' },
      ]);
    };

    const tick = (t: number) => {
      render(stateRef.current, t);
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
      detachCrisp();
    };
  }, []);

  const onToggle = () => {
    const next = !stateRef.current.antiDrift;
    const s = stateRef.current;
    s.morphFrom = s.antiDrift ? 1 : 0;
    s.antiDrift = next;
    s.morphStart = performance.now();
    setAntiDrift(next);
    setFeedback(
      next
        ? {
            text: '启用抗漂移训练：同样 60 分钟，边缘始终留在导引带内——论文用一次超过一小时的连续生成做了这项压力测试，画质没有可见衰退。',
            cls: 'good',
          }
        : {
            text: '关闭抗漂移训练：织到 60 分钟时边缘已经甩出导引带，后面每一行都在放大前面的错。',
            cls: 'bad',
          }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>固定时长：60 分钟</label>
        <button className="tiny" onClick={onToggle}>
          {antiDrift ? '关闭抗漂移训练' : '启用抗漂移训练'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1M2;
