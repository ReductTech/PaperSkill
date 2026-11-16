import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clamp,
  clearScene,
  drawLabel,
  drawLegend,
  drawTick,
  useCanvas,
} from '../lib/classKit';

const W = 1080;
const H = 280;

type SizeKey = 's' | 'm' | 'l';

const ORDER: SizeKey[] = ['s', 'm', 'l'];
const MODEL: Record<SizeKey, { ap: number; fps: number; param: string }> = {
  s: { ap: 26.2, fps: 74.1, param: '13M' },
  m: { ap: 31.0, fps: 58.1, param: '29M' },
  l: { ap: 35.0, fps: 52.0, param: '48M' },
};

const X0 = 150;
const X1 = 1010;
const FPS_MAX = 80;
const AP_MAX = 40;
const FPS_Y = 66;
const FPS_H = 28;
const AP_Y = 186;

type RaceState = { size: SizeKey; raceStart: number | null };
type Fb = { text: string; cls: string };

const INITIAL: Fb = { text: '选一个型号，按下开始。', cls: '' };
const RUNNING: Fb = { text: '正在比较：2 秒后看结果。', cls: '' };

function finalFeedback(k: SizeKey): Fb {
  const m = MODEL[k];
  return {
    text: `${k.toUpperCase()} 型号：零样本 ${m.ap.toFixed(1)} AP，${m.fps.toFixed(
      1
    )} FPS（V100，无 TensorRT）。`,
    cls: 'good',
  };
}

export const Ch9Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef<RaceState>({ size: 'l', raceStart: null });
  const [size, setSize] = useState<SizeKey>('l');
  const [race, setRace] = useState(false);
  const [fb, setFb] = useState<Fb>(INITIAL);
  const [reduce] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const m = MODEL[size];

  useEffect(() => {
    if (!race) return undefined;
    const id = window.setTimeout(() => {
      setRace(false);
      setFb(finalFeedback(stateRef.current.size));
    }, 2000);
    return () => window.clearTimeout(id);
  }, [race]);

  const choose = (k: SizeKey) => {
    stateRef.current = { size: k, raceStart: null };
    setSize(k);
    setRace(false);
    setFb(INITIAL);
  };

  const start = () => {
    if (race) return;
    const k = stateRef.current.size;
    if (reduce) {
      stateRef.current = { size: k, raceStart: performance.now() - 2000 };
      setFb(finalFeedback(k));
      return;
    }
    stateRef.current = { size: k, raceStart: performance.now() };
    setRace(true);
    setFb(RUNNING);
  };

  const draw = (ctx: CanvasRenderingContext2D, time: number, st: RaceState) => {
    clearScene(ctx, W, H);
    const mm = MODEL[st.size];
    const fpsP = mm.fps / FPS_MAX;
    const apP = mm.ap / AP_MAX;
    const fullW = X1 - X0;
    const p = st.raceStart === null ? 0 : clamp((time - st.raceStart) / 2000, 0, 1);

    // Faint targets for all three sizes: the same FPS axis, and the separate AP axis.
    ORDER.forEach((k) => {
      const g = MODEL[k];
      const fx = X0 + (g.fps / FPS_MAX) * fullW;
      ctx.save();
      ctx.strokeStyle = 'rgba(159,179,168,0.30)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(fx, FPS_Y);
      ctx.lineTo(fx, FPS_Y + FPS_H);
      ctx.stroke();
      ctx.restore();
      const ax = X0 + (g.ap / AP_MAX) * fullW;
      ctx.save();
      ctx.fillStyle = 'rgba(159,179,168,0.35)';
      ctx.beginPath();
      ctx.arc(ax, AP_Y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // FPS: a bar on its own 0-80 axis.
    ctx.save();
    ctx.fillStyle = 'rgba(61,83,71,0.85)';
    ctx.fillRect(X0, FPS_Y, fullW, FPS_H);
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(X0, FPS_Y, fullW, FPS_H);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(159,179,168,0.55)';
    ctx.strokeRect(X0, FPS_Y, fullW * fpsP, FPS_H);
    ctx.restore();

    const barW = fullW * fpsP * p;
    ctx.save();
    ctx.fillStyle = COLORS.fast;
    ctx.fillRect(X0 + 1.5, FPS_Y + 1.5, Math.max(0, barW - 3), FPS_H - 3);
    if (p > 0) {
      ctx.fillStyle = COLORS.chalk;
      ctx.beginPath();
      ctx.arc(X0 + 1.5 + barW, FPS_Y + FPS_H / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    if (p >= 1) drawTick(ctx, X0 + barW + 12, FPS_Y + FPS_H / 2, { ok: true });

    // Ticks: the FPS axis runs to 80, the AP axis only to 40 — never one shared axis.
    ctx.save();
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.5;
    for (let v = 0; v <= FPS_MAX; v += 20) {
      const x = X0 + (v / FPS_MAX) * fullW;
      ctx.beginPath();
      ctx.moveTo(x, FPS_Y + FPS_H);
      ctx.lineTo(x, FPS_Y + FPS_H + 6);
      ctx.stroke();
    }
    for (let v = 0; v <= AP_MAX; v += 10) {
      const x = X0 + (v / AP_MAX) * fullW;
      ctx.beginPath();
      ctx.moveTo(x, AP_Y);
      ctx.lineTo(x, AP_Y + 6);
      ctx.stroke();
    }
    ctx.restore();

    drawLabel(ctx, '帧率', 52, FPS_Y + FPS_H / 2 + 5, { color: COLORS.chalk, size: 15 });
    drawLabel(ctx, '精度', 52, AP_Y + 5, { color: COLORS.chalk, size: 15 });
    drawLabel(ctx, String(FPS_MAX), X1, FPS_Y - 8, {
      color: COLORS.chalkDim,
      size: 12,
      align: 'right',
    });
    drawLabel(ctx, String(AP_MAX), X1, AP_Y + 20, {
      color: COLORS.chalkDim,
      size: 12,
      align: 'right',
    });

    // AP: a separate marker on its own 0-40 scale, not another bar on the FPS axis.
    // It sits at its value and does NOT race: only the FPS bar runs the 2 s race.
    const apX = X0 + fullW * apP;
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(224,165,42,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(apX, AP_Y);
    ctx.lineTo(apX, AP_Y - 22);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(apX, AP_Y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = COLORS.book;
    ctx.fillRect(-6, -6, 12, 12);
    ctx.strokeStyle = COLORS.chalk;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-6, -6, 12, 12);
    ctx.restore();

    // The FPS value fades in with the bar; the AP value is always readable on its own scale.
    if (p > 0) {
      ctx.save();
      ctx.globalAlpha = p;
      drawLabel(ctx, mm.fps.toFixed(1), X0 + fullW * fpsP - 6, FPS_Y - 8, {
        color: COLORS.chalk,
        size: 14,
        align: 'right',
        bold: true,
      });
      ctx.restore();
    }
    drawLabel(ctx, mm.ap.toFixed(1), apX, AP_Y - 16, {
      color: COLORS.chalk,
      size: 14,
      align: 'center',
      bold: true,
    });

    drawLegend(ctx, 40, 258, [
      { color: COLORS.fast, text: '帧率（条）' },
      { color: COLORS.book, text: '精度（点）' },
    ]);
  };

  const { ref } = useCanvas(draw, W, H, stateRef);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>型号</label>
        {ORDER.map((k) => (
          <button
            key={k}
            type="button"
            className={`chip${k === size ? ' selected' : ''}`}
            onClick={() => choose(k)}
            aria-pressed={k === size}
          >
            {k.toUpperCase()}
          </button>
        ))}
        <button type="button" className="tiny" onClick={start} disabled={race}>
          开始比较
        </button>
        <label>
          帧率 <span className="val">{m.fps.toFixed(1)} FPS</span>
        </label>
        <label>
          精度 <span className="val">{m.ap.toFixed(1)} AP</span>
        </label>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch9Mod1;
