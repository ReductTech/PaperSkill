import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import { clearScene, drawLegend, drawSceneLabel, EMPH, INK, LINE, MUTED } from './drivingKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const VIEW_TEXT = [
  '22 种本体里，Franka 的数据占比最高；其余每一种都更少（图示为相对示意，不是精确比例）。',
  'Franka 覆盖的场景数也最多；有些本体只在少数场景中出现（图示为相对示意）。',
  '数据是不平衡的：Franka 占比最高、场景数最多，训练时模型会明显偏向数据多的本体。',
];

const SCENE_HEIGHTS = [160, 46, 38, 34, 30, 27, 25, 23, 21, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7];

export const M32: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ view: 0 });
  const [view, setView] = useState(0);
  const [feedback, setFeedback] = useState(VIEW_TEXT[0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const drawShare = () => {
      const x = 70;
      const y = 142;
      const w = 940;
      const h = 56;
      const frankaW = w * 0.56;
      ctx.fillStyle = LINE;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = EMPH;
      ctx.fillRect(x, y, frankaW, h);
      const rest = (w - frankaW) / 21;
      for (let i = 0; i < 21; i++) {
        ctx.fillStyle = i % 2 === 0 ? MUTED : '#98a7bb';
        ctx.fillRect(x + frankaW + i * rest, y, Math.max(2, rest - 2), h);
      }
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
    };

    const drawScenes = () => {
      const base = 236;
      ctx.strokeStyle = MUTED;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(56, base);
      ctx.lineTo(1020, base);
      ctx.stroke();
      for (let i = 0; i < 22; i++) {
        const h = clamp(SCENE_HEIGHTS[i], 0, 236);
        ctx.fillStyle = i === 0 ? EMPH : MUTED;
        ctx.fillRect(70 + i * 43, base - h, 26, h);
      }
    };

    const drawBalance = (now: number) => {
      const tilt = lerp(-0.17, -0.11, 0.5 + 0.5 * Math.sin(now / 700));
      ctx.save();
      ctx.translate(540, 158);
      ctx.rotate(tilt);
      ctx.fillStyle = MUTED;
      ctx.fillRect(-250, -5, 500, 10);
      ctx.fillStyle = EMPH;
      ctx.fillRect(-200, -58, 104, 53);
      ctx.fillStyle = MUTED;
      ctx.fillRect(110, -36, 58, 31);
      ctx.restore();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.moveTo(540, 166);
      ctx.lineTo(510, 242);
      ctx.lineTo(570, 242);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = LINE;
      ctx.fillRect(500, 242, 80, 5);
    };

    const render = (now: number) => {
      clearScene(ctx, W, H);
      const v = stateRef.current.view;
      if (v === 0) {
        drawShare();
      } else if (v === 1) {
        drawScenes();
      } else {
        drawBalance(now);
      }

      drawSceneLabel(ctx, '相对示意', 40, 34, MUTED);
      drawSceneLabel(ctx, '数据不平衡', 820, 34, EMPH);

      drawLegend(
        ctx,
        [
          { color: EMPH, text: 'Franka' },
          { color: MUTED, text: '其余 21 种' },
        ],
        380,
        34
      );
    };

    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const choose = (i: number) => {
    stateRef.current.view = i;
    setView(i);
    setFeedback(VIEW_TEXT[i]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {['本体占比', '场景覆盖', '是否均衡'].map((label, i) => (
          <button key={label} className={'chip' + (view === i ? ' selected' : '')} onClick={() => choose(i)}>
            {label}
          </button>
        ))}
      </div>
      <div className={'feedback ' + (view === 2 ? 'bad' : '')}>{feedback}</div>
    </div>
  );
};

export default M32;
