import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawSceneLabel, drawFlag } from './birdKit';

// m10-1 (result-race) — 三线竞速：精度、速度、成本（v8-S 口径，Tab 1）。

const W = 1080;
const H = 280;
const DURATION = 2.6;

const LANES = [
  { name: 'LVIS AP', yoe: 27.9, old: 24.4, fracY: 27.9 / 30, fracO: 24.4 / 30, ly: '27.9', lo: '24.4' },
  { name: 'T4 FPS', yoe: 305.8, old: 216.4, fracY: 305.8 / 330, fracO: 216.4 / 330, ly: '305.8', lo: '216.4' },
  { name: '训练小时', yoe: 12.0, old: 41.7, fracY: 1.0, fracO: 12.0 / 41.7, ly: '12.0h', lo: '41.7h' },
];

export const M10_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ start: number; doneNotified: boolean }>({ start: -1, doneNotified: false });
  const rafRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [feedback, setFeedback] = useState({
    text: '三条跑道：AP、FPS、训练时间（越短越好，按 1/小时折算）。点击开始比赛。',
    cls: '',
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

    const render = () => {
      const st = stateRef.current;
      const p = st.start < 0 ? 0 : easeOutCubic(clamp((performance.now() - st.start) / (DURATION * 1000), 0, 1));
      clearScene(ctx, W, H);

      LANES.forEach((lane, i) => {
        const y = 56 + i * 78;
        // 跑道底
        ctx.save();
        ctx.fillStyle = '#eef2f7';
        ctx.fillRect(200, y, 700, 24);
        ctx.fillRect(200, y + 32, 700, 24);
        ctx.restore();
        drawSceneLabel(ctx, lane.name, 110, y + 18, PALETTE.ink);
        // 两条进度条
        ctx.save();
        ctx.fillStyle = PALETTE.green;
        ctx.fillRect(200, y, 700 * lane.fracY * p, 24);
        ctx.fillStyle = '#7f93ad';
        ctx.fillRect(200, y + 32, 700 * lane.fracO * p, 24);
        ctx.restore();
        // 终点数值与旗
        if (p >= 1) {
          ctx.save();
          ctx.fillStyle = PALETTE.ink;
          ctx.font = '13px sans-serif';
          ctx.fillText(lane.ly, 200 + 700 * lane.fracY + 10, y + 17);
          ctx.fillText(lane.lo, 200 + 700 * lane.fracO + 10, y + 49);
          ctx.restore();
          drawFlag(ctx, 200 + 700 * lane.fracY + 4, y + 2, PALETTE.green);
        }
      });

      // 图例行
      drawSceneLabel(ctx, 'YOLOE-v8-S', 200, 262, PALETTE.green);
      drawSceneLabel(ctx, 'YOLO-Worldv2-S', 330, 262, PALETTE.muted);
    };

    const tick = () => {
      render();
      const st = stateRef.current;
      const rawP = st.start < 0 ? 0 : clamp((performance.now() - st.start) / (DURATION * 1000), 0, 1);
      if (st.start >= 0 && rawP >= 1 && !st.doneNotified) {
        st.doneNotified = true;
        setPlaying(false);
        setFeedback({
          text: '精度 +3.5 AP、速度快 1.4×、训练省约 71%——三线全胜（LVIS minival Fixed AP，T4/TensorRT）。',
          cls: 'good',
        });
      }
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

  const onPlay = () => {
    stateRef.current.start = performance.now();
    stateRef.current.doneNotified = false;
    setPlaying(true);
    setFeedback({ text: '比赛开始：三条跑道同步推进……', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={onPlay} disabled={playing}>
          {stateRef.current.start >= 0 && !playing ? '再来一次' : '开始比赛'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M10_1;
