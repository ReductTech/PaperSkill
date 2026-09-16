import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const CX0 = 110;
const CX1 = 800;
const CY0 = 44;
const CY1 = 228;
const X0 = 15.11;
const X1 = 18.86;
const XMIN = 15.0;
const XMAX = 19.75;
const TEACHER_SCORES = ['0.572', '0.596', '0.608'];
const TEACHER_X = [X1 + 0.22, X1 + 0.44, X1 + 0.66];
const JITTER = [0.05, -0.04, 0.06, -0.06, 0.03, -0.02, 0.05, -0.05, 0.02];

type LawKey = 'enc' | 'data' | 'proj';

interface LawDef {
  chip: string;
  axis: string;
  color: string;
  exp: number;
  ci: [number, number];
  intercept: number;
  yMin: number;
  yMax: number;
  band: number;
  fb: string;
}

const LAWS: Record<LawKey, LawDef> = {
  enc: {
    chip: '编码器 N*',
    axis: '编码器',
    color: '#228d5c',
    exp: 0.36,
    ci: [0.31, 0.39],
    intercept: 0.86,
    yMin: 6.1,
    yMax: 8.0,
    band: 0.09,
    fb: '编码器指数 0.36（95% CI [0.31, 0.39]）——预算增长时，编码器应同步变大。',
  },
  data: {
    chip: '数据 D*',
    axis: '数据',
    color: '#228d5c',
    exp: 0.63,
    ci: [0.61, 0.69],
    intercept: -1.8,
    yMin: 7.0,
    yMax: 10.65,
    band: 0.13,
    fb: '数据指数 0.63——预算翻倍约需 1.55 倍数据、1.28 倍编码器，分配明显偏向数据。',
  },
  proj: {
    chip: '投影器 N*proj',
    axis: '投影器',
    color: '#27446e',
    exp: 0.011,
    ci: [-0.02, 0.04],
    intercept: 8.05,
    yMin: 7.85,
    yMax: 8.35,
    band: 0.05,
    fb: '投影器指数 0.011，区间 [−0.02, +0.04] 跨零：投影器容量不是缩放轴。',
  },
};

const FB_EXTRAP =
  '未参与拟合的 0.5/1/2 B 教师得分 0.572/0.596/0.608，全部落在预测曲线上——法则是外推的，不只是描述的。';

const BUCKET_X: number[] = [];
for (let i = 0; i < 9; i++) BUCKET_X.push(X0 + ((X1 - X0) * i) / 8);

function fmtSigned(v: number): string {
  return v < 0 ? `−${Math.abs(v).toFixed(2)}` : v.toFixed(2);
}

function expText(law: LawDef): string {
  return `${law.exp} [${fmtSigned(law.ci[0])}, ${fmtSigned(law.ci[1])}]`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, H - 24, W, 24);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H - 24);
  ctx.lineTo(W, H - 24);
  ctx.stroke();
}

function drawSky(ctx: CanvasRenderingContext2D) {
  const stars: Array<[number, number]> = [
    [30, 20],
    [220, 14],
    [420, 24],
    [560, 12],
    [660, 28],
    [740, 14],
    [1040, 40],
  ];
  ctx.fillStyle = 'rgba(104, 119, 143, 0.5)';
  for (const [x, y] of stars) {
    ctx.beginPath();
    ctx.arc(x, y, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlate(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
}

function drawTeacherStar(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = '#f07e47';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 11, y);
  ctx.lineTo(x + 11, y);
  ctx.moveTo(x, y - 11);
  ctx.lineTo(x, y + 11);
  ctx.moveTo(x - 6, y - 6);
  ctx.lineTo(x + 6, y + 6);
  ctx.moveTo(x - 6, y + 6);
  ctx.lineTo(x + 6, y - 6);
  ctx.stroke();
  ctx.fillStyle = '#f07e47';
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.font = '18px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
}

interface LegendItem {
  color: string;
  label: string;
}

function drawLegend(ctx: CanvasRenderingContext2D, items: LegendItem[], x: number, y: number) {
  ctx.font = '18px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  let cx = x;
  for (const item of items) {
    ctx.fillStyle = item.color;
    ctx.fillRect(cx, y - 11, 14, 11);
    ctx.fillStyle = '#21324a';
    ctx.fillText(item.label, cx + 20, y);
    cx += 20 + ctx.measureText(item.label).width + 18;
  }
}

interface WidgetState {
  law: LawKey;
  extrapolate: boolean;
}

export const Ch4Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<WidgetState>({ law: 'enc', extrapolate: false });
  const [law, setLaw] = useState<LawKey>('enc');
  const [extrapolate, setExtrapolate] = useState(false);
  const [feedback, setFeedback] = useState({ text: LAWS.enc.fb, cls: 'good' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    const render = () => {
      const s = stateRef.current;
      const def = LAWS[s.law];
      clearScene(ctx);
      drawSky(ctx);

      const xPix = (v: number) => map(v, XMIN, XMAX, CX0, CX1);
      const yPix = (v: number) => map(v, def.yMin, def.yMax, CY1, CY0);
      const fit = (x: number) => def.intercept + def.exp * x;

      ctx.save();
      ctx.beginPath();
      ctx.rect(CX0, CY0, CX1 - CX0, CY1 - CY0);
      ctx.clip();

      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(CX0, CY1);
      ctx.lineTo(CX1, CY1);
      ctx.moveTo(CX0, CY1);
      ctx.lineTo(CX0, CY0);
      ctx.stroke();

      ctx.globalAlpha = 0.15;
      ctx.fillStyle = def.color;
      ctx.beginPath();
      for (let i = 0; i < 9; i++) {
        const px = xPix(BUCKET_X[i]);
        const py = yPix(fit(BUCKET_X[i]) + def.band);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      for (let i = 8; i >= 0; i--) {
        ctx.lineTo(xPix(BUCKET_X[i]), yPix(fit(BUCKET_X[i]) - def.band));
      }
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;

      if (s.extrapolate && s.law === 'enc') {
        ctx.setLineDash([8, 8]);
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = def.color;
        ctx.beginPath();
        ctx.moveTo(xPix(X1), yPix(fit(X1) + def.band));
        ctx.lineTo(xPix(TEACHER_X[2]), yPix(fit(TEACHER_X[2]) + def.band));
        ctx.lineTo(xPix(TEACHER_X[2]), yPix(fit(TEACHER_X[2]) - def.band));
        ctx.lineTo(xPix(X1), yPix(fit(X1) - def.band));
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = def.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(xPix(X1), yPix(fit(X1)));
        ctx.lineTo(xPix(TEACHER_X[2]), yPix(fit(TEACHER_X[2])));
        ctx.stroke();
        ctx.setLineDash([]);
        for (let i = 0; i < 3; i++) {
          const tx = xPix(TEACHER_X[i]);
          const ty = yPix(fit(TEACHER_X[i]));
          drawTeacherStar(ctx, tx, ty);
          drawSceneLabel(ctx, TEACHER_SCORES[i], tx - 24, ty - 18, '#21324a');
        }
      }

      ctx.strokeStyle = def.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(xPix(X0), yPix(fit(X0)));
      ctx.lineTo(xPix(X1), yPix(fit(X1)));
      ctx.stroke();

      for (let i = 0; i < 9; i++) {
        const px = xPix(BUCKET_X[i]);
        const py = yPix(fit(BUCKET_X[i]) + JITTER[i]);
        ctx.fillStyle = '#68778f';
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      drawLegend(
        ctx,
        s.extrapolate
          ? [
              { color: def.color, label: '拟合' },
              { color: '#68778f', label: '桶顶点' },
              { color: '#f07e47', label: '教师' },
            ]
          : [
              { color: def.color, label: '拟合' },
              { color: '#68778f', label: '桶顶点' },
              { color: def.color, label: '95% CI' },
            ],
        130,
        66
      );

      drawSceneLabel(ctx, def.axis, 32, 64, '#21324a');
      drawSceneLabel(ctx, '算力 C', 700, 252, '#21324a');

      drawPlate(ctx, 830, 230, 236, 46);
      ctx.fillStyle = def.color;
      ctx.font = '22px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(expText(def), 848, 262);
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pickLaw = (key: LawKey) => {
    const s = stateRef.current;
    s.law = key;
    if (key !== 'enc') s.extrapolate = false;
    setLaw(key);
    setExtrapolate(key === 'enc' ? s.extrapolate : false);
    setFeedback({ text: LAWS[key].fb, cls: key === 'proj' ? '' : 'good' });
  };

  const toggleExtrapolate = () => {
    const s = stateRef.current;
    const next = !s.extrapolate;
    s.extrapolate = next;
    if (next && s.law !== 'enc') {
      s.law = 'enc';
      setLaw('enc');
    }
    setExtrapolate(next);
    setFeedback(
      next
        ? { text: FB_EXTRAP, cls: 'good' }
        : { text: LAWS[s.law].fb, cls: s.law === 'proj' ? '' : 'good' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          <button className={`chip ${law === 'enc' ? 'selected' : ''}`} onClick={() => pickLaw('enc')}>
            编码器 N*
          </button>
          <button
            className={`chip ${law === 'data' ? 'selected' : ''}`}
            onClick={() => pickLaw('data')}
          >
            数据 D*
          </button>
          <button
            className={`chip ${law === 'proj' ? 'selected' : ''}`}
            onClick={() => pickLaw('proj')}
          >
            投影器 N*<sub>proj</sub>
          </button>
          <button
            className={`chip ${extrapolate ? 'selected' : ''}`}
            onClick={toggleExtrapolate}
          >
            外推验证
          </button>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Mod2;
