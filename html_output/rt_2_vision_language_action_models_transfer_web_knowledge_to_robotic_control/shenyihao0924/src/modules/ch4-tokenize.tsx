import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor } from '../lib/canvasKit';
import { C, drawSceneBg, drawTokenString, drawSceneLabel } from './chefKit';
import type { WidgetProps } from './registry';

// Module 4.1 「离散化器」 — P1 slider. Pick an action dimension, drag its
// continuous value, and watch which of the 256 bins it lands in: compressed
// bin band + cursor + a zoom window on the local bins (top 55%), and the live
// 8-dim action string with the current dimension highlighted (bottom 45%).
const W = 1080;
const H = 280;

type DimKey = 'posx' | 'posz' | 'roty' | 'grip';

interface DimDef {
  label: string;
  min: number;
  max: number;
  step: number;
  tokenIndex: number;
  fmt: (v: number) => string;
}

const DIMS: Record<DimKey, DimDef> = {
  posx: {
    label: 'Δposₓ',
    min: -0.1,
    max: 0.1,
    step: 0.001,
    tokenIndex: 1,
    fmt: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(3)} m`,
  },
  posz: {
    label: 'Δpos_z',
    min: -0.1,
    max: 0.1,
    step: 0.001,
    tokenIndex: 3,
    fmt: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(3)} m`,
  },
  roty: {
    label: 'Δrot_y',
    min: -30,
    max: 30,
    step: 0.5,
    tokenIndex: 5,
    fmt: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}°`,
  },
  grip: {
    label: '夹爪',
    min: 0,
    max: 1,
    step: 0.01,
    tokenIndex: 7,
    fmt: (v) => v.toFixed(2),
  },
};

const DIM_KEYS: DimKey[] = ['posx', 'posz', 'roty', 'grip'];
const MID = 128;
const BAND_X = 60;
const BAND_W = 960;
const BAND_Y = 84;
const BAND_H = 24;

const binOf = (v: number, d: DimDef) =>
  clamp(Math.floor(((v - d.min) / (d.max - d.min)) * 256), 0, 255);

const feedbackFor = (key: DimKey, v: number): { text: string; cls: string } => {
  const d = DIMS[key];
  const bin = binOf(v, d);
  return { text: `${d.label} = ${d.fmt(v)} → 第 ${bin} 档${bin === MID ? '（中点）' : ''}`, cls: '' };
};

export const Ch4Tokenize: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({
    dim: 'posx' as DimKey,
    values: { posx: 0, posz: 0, roty: 0, grip: 0.5 } as Record<DimKey, number>,
    terminate: 1 as 0 | 1,
  });
  const [dim, setDim] = useState<DimKey>('posx');
  const [values, setValues] = useState<Record<DimKey, number>>({
    posx: 0,
    posz: 0,
    roty: 0,
    grip: 0.5,
  });
  const [terminate, setTerminate] = useState<0 | 1>(1);
  const [feedback, setFeedback] = useState(feedbackFor('posx', 0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (
      s: {
        dim: DimKey;
        values: Record<DimKey, number>;
        terminate: 0 | 1;
      },
      ms: number
    ) => {
      const d = DIMS[s.dim];
      const v = s.values[s.dim];
      const bin = binOf(v, d);
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });
      // top 55% — the 256-bin ruler
      drawSceneLabel(ctx, '256 档位尺', 36, 20);
      const slice = BAND_W / 256;
      for (let i = 0; i < 256; i++) {
        ctx.fillStyle = lerpColor(C.border, C.purple, i / 255);
        ctx.fillRect(BAND_X + i * slice, BAND_Y, slice + 0.8, BAND_H);
      }
      const cursorX = BAND_X + ((bin + 0.5) / 256) * BAND_W;
      ctx.fillStyle = C.orange;
      ctx.fillRect(BAND_X + bin * slice, BAND_Y, slice + 0.8, BAND_H);
      ctx.save();
      ctx.globalAlpha = 0.7 + 0.3 * Math.sin(ms / 300);
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cursorX, BAND_Y - 10);
      ctx.lineTo(cursorX, BAND_Y + BAND_H + 10);
      ctx.stroke();
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.moveTo(cursorX, BAND_Y - 2);
      ctx.lineTo(cursorX - 6, BAND_Y - 11);
      ctx.lineTo(cursorX + 6, BAND_Y - 11);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // zoom window: the 8 bins around the cursor
      const zx = clamp(cursorX - 4 * 32, 200, 816);
      for (let j = 0; j < 8; j++) {
        const b = bin - 4 + j;
        const x = zx + j * 32;
        const cur = b === bin;
        if (b < 0 || b > 255) {
          ctx.save();
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = C.border;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(x, 36, 30, 30, 4);
          ctx.stroke();
          ctx.restore();
          continue;
        }
        ctx.fillStyle = cur ? C.orange : C.white;
        ctx.strokeStyle = cur ? C.orange : C.border;
        ctx.lineWidth = cur ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.roundRect(x, 36, 30, 30, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = cur ? C.white : C.muted;
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(b), x + 15, 52);
      }
      // bare tick numbers under the band
      ctx.fillStyle = C.muted;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText('0', BAND_X, BAND_Y + BAND_H + 14);
      ctx.textAlign = 'center';
      ctx.fillText('128', BAND_X + BAND_W / 2, BAND_Y + BAND_H + 14);
      ctx.textAlign = 'right';
      ctx.fillText('255', BAND_X + BAND_W, BAND_Y + BAND_H + 14);
      // bottom 45% — the live 8-dim action string
      drawSceneLabel(ctx, '8 维动作串', 36, 172);
      const tokens = [
        s.terminate,
        MID,
        MID,
        MID,
        MID,
        MID,
        MID,
        MID,
      ];
      tokens[d.tokenIndex] = bin;
      drawTokenString(ctx, 225, 226, tokens, 90, d.tokenIndex);
    };

    const tick = () => {
      render(stateRef.current, performance.now());
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

  const selectDim = (key: DimKey) => {
    stateRef.current.dim = key;
    setDim(key);
    setFeedback(feedbackFor(key, stateRef.current.values[key]));
  };

  const onSlide = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    stateRef.current.values[dim] = v;
    const next: Record<DimKey, number> = { ...values };
    next[dim] = v;
    setValues(next);
    setFeedback(feedbackFor(dim, v));
  };

  const selectTerm = (t: 0 | 1) => {
    stateRef.current.terminate = t;
    setTerminate(t);
    setFeedback({ text: `终止位 = ${t}（唯一离散维，不进 256 档）`, cls: '' });
  };

  const cur = DIMS[dim];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {DIM_KEYS.map((key) => (
          <button
            key={key}
            className={`chip ${dim === key ? 'selected' : ''}`}
            onClick={() => selectDim(key)}
          >
            {DIMS[key].label}
          </button>
        ))}
        <label>
          {cur.label}
          <input
            type="range"
            min={cur.min}
            max={cur.max}
            step={cur.step}
            value={values[dim]}
            onChange={onSlide}
          />
          <span className="val">{cur.fmt(values[dim])}</span>
        </label>
        <span>终止位</span>
        {[0, 1].map((t) => (
          <button
            key={t}
            className={`chip ${terminate === t ? 'selected' : ''}`}
            onClick={() => selectTerm(t as 0 | 1)}
          >
            {String(t)}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Tokenize;
