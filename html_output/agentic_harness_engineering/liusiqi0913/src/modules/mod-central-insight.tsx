import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// mod-central-insight — 中心洞察突出句（静态）
// 论文：瓶颈在于可观测性，而非智能体能力。仅入场一次性淡入，播完即静止。

const W = 1080;
const H = 180;
const DURATION = 800;

const C = {
  bg: '#f4f6f8',
  panel: '#ffffff',
  border: '#d7deea',
  text: '#21324a',
  muted: '#68778f',
  blue: '#27446e',
};

export const ModCentralInsight: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let startTs = 0;
    let done = false;

    const render = (elapsed: number) => {
      const a = (order: number) => clamp((elapsed - order * 120) / 260, 0, 1);

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // 顶部小标签
      ctx.save();
      ctx.globalAlpha = a(0);
      ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
      const label = '中心洞察';
      const lw = ctx.measureText(label).width + 24;
      ctx.beginPath();
      ctx.roundRect((W - lw) / 2, 20, lw, 24, 12);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = C.blue;
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.textAlign = 'center';
      ctx.fillText(label, W / 2, 36);
      ctx.restore();

      // 主句：Harness 自动演化的瓶颈在于【可观测性】，而非智能体能力
      ctx.save();
      ctx.globalAlpha = a(1);
      const f1 = '22px "Segoe UI", "PingFang SC", sans-serif';
      const f2 = 'bold 26px "Segoe UI", "PingFang SC", sans-serif';
      const s1 = 'Harness 自动演化的瓶颈在于 ';
      const s2 = '可观测性';
      const s3 = '，而非智能体能力。';
      ctx.font = f1;
      const w1 = ctx.measureText(s1).width;
      const w3 = ctx.measureText(s3).width;
      ctx.font = f2;
      const w2 = ctx.measureText(s2).width;
      const sx = (W - w1 - w2 - w3) / 2;
      ctx.textAlign = 'left';
      ctx.font = f1;
      ctx.fillStyle = C.text;
      ctx.fillText(s1, sx, 96);
      ctx.font = f2;
      ctx.fillStyle = C.blue;
      ctx.fillText(s2, sx + w1, 96);
      ctx.font = f1;
      ctx.fillStyle = C.text;
      ctx.fillText(s3, sx + w1 + w2, 96);
      ctx.restore();

      // 补充句
      ctx.save();
      ctx.globalAlpha = a(2);
      ctx.fillStyle = C.muted;
      ctx.font = '14px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        '只要给演化智能体清晰动作空间上的结构化上下文，它就能可靠收敛到更好的 harness 设计。',
        W / 2,
        142
      );
      ctx.restore();
    };

    const tick = (now: number) => {
      if (!startTs) startTs = now;
      const elapsed = now - startTs;
      render(Math.min(elapsed, DURATION));
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      if (elapsed < DURATION) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        done = true;
        rafRef.current = null;
      }
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (done) {
        render(DURATION);
        return;
      }
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default ModCentralInsight;
