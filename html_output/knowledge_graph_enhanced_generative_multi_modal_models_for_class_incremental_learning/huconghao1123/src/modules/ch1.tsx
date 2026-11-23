import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C,
  clearScene,
  drawIndexCard,
  drawLabel,
  withAlpha,
  roundRect,
  type Ctx,
} from './scene';

const W = 1080;
const H = 280;

const names = ['缠枝瓶', '高仿件', '旧藏器'];

function sims(d: number): number[] {
  return [0.55 + d * 0.15, 0.66 + d * 0.05, 0.5 + d * 0.1].map((v) => clamp(v, 0, 1));
}

export const Ch1Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ detail: 0 });
  const [detail, setDetail] = useState(0);
  const [feedback, setFeedback] = useState({
    text: '先把鉴定语停在“一件瓷器”，看看会归到哪一件。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: Ctx;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { detail: number }) => {
      clearScene(ctx, W, H);
      drawIndexCard(ctx, 40, 40, 270, 150, { lines: 3 });
      drawLabel(ctx, 56, 58, '描述', C.muted, 12);

      const sv = sims(s.detail);
      const best = sv.indexOf(Math.max(...sv));
      sv.forEach((v, i) => {
        const x = 360 + i * 165;
        const hit = i === best;
        drawIndexCard(ctx, x, 44, 140, 148, {
          border: hit ? C.red : C.border,
          lines: 0,
        });
        drawLabel(ctx, x + 70, 74, names[i], C.ink, 13, 'center');
        ctx.save();
        ctx.fillStyle = withAlpha(C.border, 0.35);
        roundRect(ctx, x + 16, 158, 108, 9, 4);
        ctx.fill();
        ctx.fillStyle = hit ? C.red : withAlpha(C.blue, 0.7);
        roundRect(ctx, x + 16, 158, Math.max(3, 108 * v), 9, 4);
        ctx.fill();
        ctx.restore();
        drawLabel(ctx, x + 70, 182, v.toFixed(2), hit ? C.red : C.muted, 11, 'center');
      });

      drawIndexCard(ctx, 870, 70, 170, 96, { border: C.red, lines: 0 });
      drawLabel(ctx, 955, 104, names[best], C.red, 16, 'center');
      drawLabel(ctx, 955, 136, '归案', C.muted, 12, 'center');
    };

    let raf = 0;
    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    stateRef.current.detail = v;
    setDetail(v);
    if (v < 30) setFeedback({ text: '认错了：三张鉴定卡几乎一样高，档口只认“瓷器”。', cls: 'bad' });
    else if (v < 80) setFeedback({ text: '说法细了，这一件还是没被点到。', cls: '' });
    else setFeedback({ text: '只差 0.01——鉴定语里没有“窑口、底款”这种关系。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          鉴定语笼统度 <span className="val">{detail}</span>
        </label>
        <input type="range" min={0} max={100} step={10} value={detail} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Mod1;
