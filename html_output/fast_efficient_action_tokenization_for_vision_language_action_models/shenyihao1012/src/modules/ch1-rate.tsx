import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawWaveform,
  drawLegend,
  drawSceneLabel,
  drawValueChip,
} from './packKit';
import type { WidgetProps } from './registry';

// Ch1 module: the sampling-rate test bench (E02). The target curve (a smooth
// sum-of-sines with a 4-knot spline look) never changes; drag the rate 25→800
// and the naive token tape densifies while the apprentice output degrades from
// tracking (green) to a flat "copy first action" line (red). Error badge grows
// with the rate.
const W = 1080;
const H = 280;

const TARGET: number[] = [];
for (let i = 0; i < 140; i++) {
  const a = (i / 139) * Math.PI * 2;
  TARGET.push(
    clamp(
      0.52 * Math.sin(a + 0.4) + 0.3 * Math.sin(a * 2.35 + 1.7) + 0.18 * Math.sin(a * 4.1 + 0.9),
      -0.95,
      0.95
    )
  );
}
const V0 = TARGET[0];

const smoothstep = (x: number): number => {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};

interface RateState {
  rate: number;
}

export const Ch1Rate: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<RateState>({ rate: 25 });
  const [rate, setRate] = useState(25);
  const [feedback, setFeedback] = useState({
    text: '25 t/s：逐件清单还能对付——相邻件差异大，学习信号足。',
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
    let raf = 0;

    const render = (s: RateState) => {
      const r = s.rate;
      // collapse factor: 0 below 150 t/s, 1 above 500 t/s
      const f = smoothstep((r - 150) / 350);
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      [100, 174].forEach((sy) => {
        ctx.beginPath();
        ctx.moveTo(24, sy);
        ctx.lineTo(1056, sy);
        ctx.stroke();
      });

      // top 40%: fixed target curve (black dashed) + sampled dots (orange)
      drawWaveform(ctx, 40, 16, 1000, 76, TARGET, C.text, { dashed: true });
      const n = clamp(Math.round(r / 10) + 4, 5, 84);
      ctx.fillStyle = C.orange;
      for (let k = 0; k < n; k++) {
        const idx = Math.round((k / (n - 1)) * (TARGET.length - 1));
        const px = 40 + (idx / (TARGET.length - 1)) * 1000;
        const py = 16 + 38 - TARGET[idx] * 38;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // middle 25%: naive verbatim token tape — red squares, count ∝ rate
      const cols = 100;
      const pitchX = 1000 / cols;
      const pitchY = 8;
      ctx.fillStyle = C.red;
      for (let i = 0; i < r; i++) {
        const rr = Math.floor(i / cols);
        const cc = i % cols;
        ctx.fillRect(40 + cc * pitchX, 110 + rr * pitchY, pitchX - 3.5, pitchY - 3);
      }
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(36, 106, 1008, 68);

      // bottom: apprentice output — tracks at low rate, flattens onto the
      // first action at high rate, partially drifts in between
      const mid = 4 * f * (1 - f);
      const out = TARGET.map(
        (v, i) => v * (1 - f) + V0 * f + 0.12 * Math.sin(i * 0.35 + r * 0.13) * mid
      );
      const lineColor = lerpColor(C.green, C.red, f);
      ctx.globalAlpha = 0.16;
      drawWaveform(ctx, 40, 184, 1000, 66, TARGET, C.text, { dashed: true });
      ctx.globalAlpha = 1;
      drawWaveform(ctx, 40, 184, 1000, 66, out, lineColor);
      if (f > 0.85) {
        drawSceneLabel(ctx, '照搬第一件', 880, 184 + 33 - V0 * 33 - 14, { color: C.red });
      }

      // error badge: bare number, grows with rate
      const err = Math.round(2 + 120 * Math.pow(f, 1.4));
      drawValueChip(ctx, 1010, 264, String(err), lineColor);

      drawLegend(
        ctx,
        [
          ['目标曲线', C.text],
          ['采样点', C.orange],
          ['学徒输出', f > 0.5 ? C.red : C.green],
        ],
        40,
        264
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(() => render(stateRef.current));
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(() => render(stateRef.current));
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const r = Math.round(Number(e.target.value));
    stateRef.current.rate = r;
    setRate(r);
    setFeedback(
      r < 150
        ? { text: '25 t/s：逐件清单还能对付——相邻件差异大，学习信号足。', cls: '' }
        : r <= 500
        ? { text: '200 t/s：相邻 token 高度相关，误差开始爬升。', cls: 'bad' }
        : { text: '800 t/s：模型发现照搬上一件就能低损失——彻底躺平。', cls: 'bad' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          采样率 <span className="val">{rate}</span>
        </label>
        <input type="range" min={25} max={800} step={1} value={rate} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Rate;
