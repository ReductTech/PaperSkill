import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawBar, drawLabel, withAlpha, type Ctx } from './scene';

const W = 1080;
const H = 280;

/* ---------------- 9.1 挂几条最划算 ---------------- */

const ROWS = [
  { r: 0, acc: 81.03, gen: 6.54, mem: 0.0, text: 30, graph: 0.0 },
  { r: 2, acc: 81.92, gen: 7.42, mem: 0.05, text: 51, graph: 0.46 },
  { r: 3, acc: 84.29, gen: 9.67, mem: 0.07, text: 75, graph: 0.53 },
  { r: 4, acc: 84.31, gen: 12.63, mem: 0.08, text: 102, graph: 0.62 },
];

const FB9: Record<number, { text: string; cls: string }> = {
  0: { text: '不挂线索：81.03，最少字也最不准。', cls: 'bad' },
  2: { text: '81.92，还不够。', cls: '' },
  3: { text: '84.29，比 r=2 多 2.37 个点，查图只多 0.07 毫秒。', cls: 'good' },
  4: { text: '84.31，只多 0.02 个点，却多花 3 秒生成。', cls: 'warn' },
};

export const Ch9Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rRef = useRef(3);
  const [r, setR] = useState(3);
  rRef.current = r;
  const [feedback, setFeedback] = useState(FB9[3]);

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
      const cur = rRef.current;
      clearScene(ctx, W, H);
      const acc = ROWS.filter((x) => x.r === cur)[0].acc;
      const gen = ROWS.filter((x) => x.r === cur)[0].gen;
      const mem = ROWS.filter((x) => x.r === cur)[0].mem;

      const neutral = withAlpha(C.border, 0.55);
      const colorFor = (kind: string) =>
        cur === 3 ? C.green : kind === 'acc' && cur === 0 ? C.red : kind === 'gen' && cur === 4 ? C.orange : C.blue;

      drawLabel(ctx, 50, 84, '精度 %', C.muted, 12);
      drawBar(ctx, 180, 64, 640, 18, acc / 90, colorFor('acc'));
      drawLabel(ctx, 830, 73, acc.toFixed(2), C.ink, 13);

      drawLabel(ctx, 50, 152, '生成秒', C.muted, 12);
      drawBar(ctx, 180, 132, 640, 18, gen / 14, colorFor('gen'));
      drawLabel(ctx, 830, 141, gen.toFixed(2), C.ink, 13);

      drawLabel(ctx, 50, 220, '存储 MB', C.muted, 12);
      drawBar(ctx, 180, 200, 640, 18, mem / 0.1, colorFor('mem'));
      drawLabel(ctx, 830, 209, mem.toFixed(2), C.ink, 13);

      drawLabel(ctx, 180, 246, '横条只比较当前这一档的相对高低', neutral, 11);
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

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {ROWS.map((row) => (
          <button
            key={row.r}
            className={`chip${r === row.r ? ' selected' : ''}`}
            aria-pressed={r === row.r}
            onClick={() => {
              setR(row.r);
              setFeedback(FB9[row.r]);
            }}
          >
            r = {row.r}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

/* ---------------- 9.2 字数与时间 ---------------- */

const pts = ROWS.map((x) => ({ text: x.text, gen: x.gen, graph: x.graph }));

function interp(chars: number, key: 'gen' | 'graph'): number {
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (chars >= a.text && chars <= b.text) {
      const k = (chars - a.text) / (b.text - a.text);
      return a[key] + (b[key] - a[key]) * k;
    }
  }
  return pts[pts.length - 1][key];
}

export const Ch9Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const charsRef = useRef(75);
  const [chars, setChars] = useState(75);
  charsRef.current = chars;

  const fb = (c: number) => {
    if (c <= 34) return { text: '最短：6.54 秒，但鉴定语里线索太少。', cls: '' };
    if (c >= 95) return { text: '12.63 秒，准确率只多 0.02 个点。', cls: 'warn' };
    if (c >= 60 && c <= 90) return { text: 'r=3：平均 75 字，生成 9.67 秒，准确率 84.29。', cls: 'good' };
    return { text: '鉴定语在变长，准确率涨得慢。', cls: '' };
  };
  const [feedback, setFeedback] = useState(fb(75));

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
      const c = charsRef.current;
      const gen = interp(c, 'gen');
      const graph = interp(c, 'graph');
      clearScene(ctx, W, H);

      const x0 = 80;
      const x1 = 1000;
      const span = 102 - 30;
      const mapX = (t: number) => x0 + ((t - 30) / span) * (x1 - x0);

      ctx.save();
      ctx.strokeStyle = withAlpha(C.muted, 0.5);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, 90);
      ctx.lineTo(x1, 90);
      ctx.stroke();
      ctx.restore();

      for (const p of pts) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(mapX(p.text), 90, 6, 0, Math.PI * 2);
        ctx.fillStyle = C.card;
        ctx.fill();
        ctx.strokeStyle = p.text === 75 ? C.green : withAlpha(C.route, 0.8);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        drawLabel(ctx, mapX(p.text), 108, String(p.text), C.muted, 11, 'center');
      }

      ctx.save();
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.moveTo(mapX(c), 74);
      ctx.lineTo(mapX(c) - 6, 62);
      ctx.lineTo(mapX(c) + 6, 62);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      drawLabel(ctx, 50, 160, '生成秒', C.muted, 12);
      drawBar(ctx, 170, 142, 620, 18, gen / 14, gen > 10 ? C.orange : C.blue);
      drawLabel(ctx, 800, 151, gen.toFixed(2), C.ink, 13);

      drawLabel(ctx, 50, 214, '查图谱毫秒', C.muted, 12);
      drawBar(ctx, 170, 196, 620, 18, graph / 0.8, graph > 0.55 ? C.orange : C.green);
      drawLabel(ctx, 800, 205, graph.toFixed(2), C.ink, 13);
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

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label htmlFor={`sl-${chapterId}-${moduleId}`}>
          平均鉴定语字数 <span className="val">{chars}</span>
        </label>
        <input
          id={`sl-${chapterId}-${moduleId}`}
          type="range"
          min={30}
          max={102}
          step={1}
          value={chars}
          onInput={(e) => {
            const v = Number((e.target as HTMLInputElement).value);
            setChars(v);
            setFeedback(fb(v));
          }}
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Mod1;
