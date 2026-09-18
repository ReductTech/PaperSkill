import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from '../modules/registry';

// 模块 1.1：拖动「缝过的针数」，布带上的缝线随进度偏离基准线，
// 右侧插片同步画出偏离曲线（示意），反馈文案与颜色一起切换。

const W = 1080;
const H = 280;
const BAND_TOP = 150;
const BAND_BOTTOM = 230;
const BAND_X0 = 40;
const BAND_X1 = 740;
const BASE_Y = 176;
const SEAM_X0 = 60;
const SEAM_X1 = 720;
const MAX_DRIFT = 46;
const MAX_ATE = 0.62;
const CARD_X = 780;
const CARD_Y = 44;
const CARD_W = 260;
const CARD_H = 160;
const PLOT_X0 = CARD_X + 18;
const PLOT_X1 = CARD_X + CARD_W - 18;
const PLOT_Y0 = CARD_Y + CARD_H - 20;
const PLOT_Y1 = CARD_Y + 16;

const BLUE = '#27446e';
const ORANGE = '#f07e47';
const RED = '#c43f52';

type Feedback = { text: string; cls: string };

function feedbackFor(p: number): Feedback {
  if (p < 0.3) return { text: '刚开始偏差很小，几乎看不出来。', cls: '' };
  if (p < 0.7) return { text: '偏差已经在累积，但还没有任何机制把它拉回来。', cls: '' };
  return { text: '偏差已经大到缝线明显偏离基准线，这正是长序列跟踪失败的样子。', cls: 'bad' };
}

function colorFor(p: number): string {
  if (p < 0.6) return lerpColor(BLUE, ORANGE, clamp(p / 0.6, 0, 1));
  return lerpColor(ORANGE, RED, clamp((p - 0.6) / 0.4, 0, 1));
}

function clearScene(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
    ctx.stroke();
  }
}

function drawSetting(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(BAND_X0, BAND_TOP, BAND_X1 - BAND_X0, BAND_BOTTOM - BAND_TOP);
  ctx.fillStyle = '#76906a';
  ctx.fillRect(BAND_X0, BAND_BOTTOM - 5, BAND_X1 - BAND_X0, 5);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(BAND_X0 + 0.5, BAND_TOP + 0.5, BAND_X1 - BAND_X0 - 1, BAND_BOTTOM - BAND_TOP - 1);
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  size: number,
  align: CanvasTextAlign
) {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: Array<{ color: string; label: string }>,
  x: number,
  y: number
) {
  let cx = x;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '14px "Segoe UI", sans-serif';
  for (let i = 0; i < items.length; i += 1) {
    ctx.fillStyle = items[i].color;
    ctx.beginPath();
    ctx.arc(cx + 5, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#68778f';
    ctx.fillText(items[i].label, cx + 15, y + 1);
    cx += 15 + items[i].label.length * 14 + 18;
  }
  ctx.textBaseline = 'alphabetic';
}

function drawSubject(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 2);
  ctx.quadraticCurveTo(x - 30, y + 16, x - 52, y + 8);
  ctx.stroke();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.42);
  ctx.fillStyle = '#21324a';
  ctx.fillRect(-16, -1.8, 30, 3.6);
  ctx.beginPath();
  ctx.moveTo(14, -1.8);
  ctx.lineTo(22, 0);
  ctx.lineTo(14, 1.8);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-15, 0, 2.8, 0, Math.PI * 2);
  ctx.fillStyle = '#f5f8f0';
  ctx.fill();
  ctx.strokeStyle = '#21324a';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

export const Ch1Drift: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ p: 0, disp: 0 });
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(feedbackFor(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (ts: number) => {
      const s = stateRef.current;
      s.disp += (s.p - s.disp) * 0.16;
      if (Math.abs(s.p - s.disp) < 0.0005) s.disp = s.p;
      const p = s.disp;
      const settle = clamp(1 - Math.abs(s.p - s.disp) * 6, 0, 1);
      const bob = Math.sin(ts / 550) * 2 * settle;
      const drift = Math.pow(p, 1.7) * MAX_DRIFT;
      const ate = Math.pow(p, 1.7) * MAX_ATE;
      const color = colorFor(p);
      const endX = lerp(SEAM_X0, SEAM_X1, p);
      const endY = BASE_Y + drift;

      clearScene(ctx);
      drawSetting(ctx);

      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(BAND_X0, BASE_Y);
      ctx.lineTo(BAND_X1, BASE_Y);
      ctx.stroke();
      ctx.restore();

      if (p > 0.005) {
        const n = Math.max(2, Math.round(p * 26));
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i <= n; i += 1) {
          const f = i / n;
          const x = lerp(SEAM_X0, endX, f);
          const y = BASE_Y + drift * Math.pow(f, 1.4);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        for (let i = 1; i < n; i += 1) {
          const f = i / n;
          const x = lerp(SEAM_X0, endX, f);
          const y = BASE_Y + drift * Math.pow(f, 1.4);
          ctx.beginPath();
          ctx.moveTo(x - 2, y - 5);
          ctx.lineTo(x + 2, y + 5);
          ctx.stroke();
        }
      }

      drawSubject(ctx, endX, endY + bob);

      drawText(ctx, '基准线', 640, 168, '#21324a', 16, 'left');
      drawText(ctx, '缝线', endX + 14, endY - 12, color, 16, 'left');

      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(CARD_X, CARD_Y, CARD_W, CARD_H);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(CARD_X + 1, CARD_Y + 1, CARD_W - 2, CARD_H - 2);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PLOT_X0, PLOT_Y0);
      ctx.lineTo(PLOT_X1, PLOT_Y0);
      ctx.moveTo(PLOT_X0, PLOT_Y0);
      ctx.lineTo(PLOT_X0, PLOT_Y1);
      ctx.stroke();

      if (p > 0) {
        const steps = Math.max(2, Math.round(p * 50));
        ctx.strokeStyle = RED;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let k = 0; k <= steps; k += 1) {
          const u = p * (k / steps);
          const v = Math.pow(u, 1.7) * MAX_ATE;
          const px = lerp(PLOT_X0, PLOT_X1, u);
          const py = lerp(PLOT_Y0, PLOT_Y1, v / MAX_ATE);
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.fillStyle = RED;
        ctx.beginPath();
        ctx.arc(lerp(PLOT_X0, PLOT_X1, p), lerp(PLOT_Y0, PLOT_Y1, ate / MAX_ATE), 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      drawLegend(
        ctx,
        [
          { color: '#d7deea', label: '基准线' },
          { color: color, label: '缝线' },
          { color: RED, label: '偏离' },
        ],
        770,
        250
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };

    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const p = Number(e.target.value) / 100;
    stateRef.current.p = p;
    setProgress(p);
    setFeedback(feedbackFor(p));
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', height: 'auto' }}
      />
      <div className="ctrl">
        <label>
          缝过的针数 <span className="val">{Math.round(progress * 100)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(progress * 100)} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Drift;
