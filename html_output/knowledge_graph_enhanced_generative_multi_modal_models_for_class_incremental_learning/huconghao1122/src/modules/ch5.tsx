import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawVase, drawLabel, withAlpha, drawTag, type Ctx } from './scene';

const W = 1080;
const H = 280;

const CLUES = ['是瓷器', '有釉', '白底', '窑口 景德镇', '底款 六年', '缠枝纹'];
const GENERIC = ['是瓷器', '有釉', '白底'];

export const Ch5Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const pickedRef = useRef<string[]>([]);
  pickedRef.current = picked;

  const [feedback, setFeedback] = useState({ text: '新证物至少要挂三条专属线索。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: Ctx;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = () => {
      const p = pickedRef.current;
      clearScene(ctx, W, H);
      drawVase(ctx, 168, 150, 2.3, C.envLight);
      drawLabel(ctx, 96, 254, '新证物', C.muted, 12);

      for (let i = 0; i < 3; i++) {
        const cx = 132 + i * 76;
        const on = i < p.length;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, 132, 9, 0, Math.PI * 2);
        ctx.fillStyle = on ? C.green : withAlpha(C.border, 0.7);
        ctx.fill();
        ctx.strokeStyle = on ? withAlpha(C.green, 0.8) : C.border;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();
      }

      // overlap with old books
      const genericCount = p.filter((x) => GENERIC.indexOf(x) >= 0).length;
      const r = 26 + genericCount * 42;
      ctx.save();
      ctx.beginPath();
      ctx.arc(700, 132, r, 0, Math.PI * 2);
      ctx.strokeStyle = genericCount > 0 ? C.red : withAlpha(C.green, 0.9);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(700, 132, 30, 0, Math.PI * 2);
      ctx.strokeStyle = withAlpha(C.envDark, 0.6);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
      drawLabel(ctx, 700, 132, `${genericCount}`, genericCount > 0 ? C.red : C.green, 15, 'center');
      drawLabel(ctx, 700, 214, '和旧藏重叠', C.muted, 12, 'center');

      const specific = p.length - genericCount;
      for (let i = 0; i < 3; i++) {
        const on = i < p.length;
        const gen = on && GENERIC.indexOf(p[i]) >= 0;
        drawTag(ctx, 420 + i * 190, 48, 170, 30, on ? p[i] : '—', gen ? C.red : on ? C.green : C.border);
      }
      drawLabel(ctx, 420, 100, `专属 ${specific} / 3`, specific === 3 ? C.green : C.ink, 12);
    };

    let raf = 0;
    const tick = () => {
      render();
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

  const toggle = (c: string) => {
    setPicked((prev) => {
      let next: string[];
      let fb = { text: '', cls: '' };
      if (prev.indexOf(c) >= 0) {
        next = prev.filter((x) => x !== c);
        fb =
          next.length === 0
            ? { text: '新证物至少要挂三条专属线索。', cls: '' }
            : { text: `已选 ${next.length} 条，还差 ${3 - next.length} 条。`, cls: '' };
      } else if (prev.length >= 3) {
        return prev;
      } else {
        next = prev.concat(c);
        const gen = next.filter((x) => GENERIC.indexOf(x) >= 0);
        if (gen.length > 0) {
          fb = { text: `“${gen[0]}”旧藏也占了，挂上去等于没挂。`, cls: 'bad' };
        } else if (next.length === 3) {
          fb = { text: '三条都只属于它，旧藏一条也没占。', cls: 'good' };
        } else {
          fb = { text: `已选 ${next.length} 条，还差 ${3 - next.length} 条。`, cls: '' };
        }
      }
      setFeedback(fb);
      return next;
    });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {CLUES.map((c) => {
          const on = picked.indexOf(c) >= 0;
          const full = picked.length >= 3 && !on;
          return (
            <button
              key={c}
              className={`chip${on ? ' selected' : ''}`}
              aria-pressed={on}
              disabled={full}
              onClick={() => toggle(c)}
            >
              {c}
            </button>
          );
        })}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch5Mod1;
