import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const INK = '#21324a';
const MUTED = '#68778f';
const BORDER = '#d7deea';
const FOG = '#c4d2b6';
const OUTDOOR = '#6fa96b';
const RED = '#c43f52';
const GREEN = '#228d5c';
const BLUE = '#27446e';

type Rect = { x: number; y: number; w: number; h: number };

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#dfe6d5';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, h - 22);
  ctx.lineTo(w, h - 22);
  ctx.stroke();
}

function drawWindow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): Rect {
  ctx.fillStyle = '#92400e';
  roundRectPath(ctx, x, y, w, h, 14);
  ctx.fill();
  const gx = x + 12;
  const gy = y + 12;
  const gw = w - 24;
  const gh = h - 24;
  ctx.fillStyle = '#eaf1fb';
  roundRectPath(ctx, gx, gy, gw, gh, 8);
  ctx.fill();
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 2;
  roundRectPath(ctx, gx, gy, gw, gh, 8);
  ctx.stroke();
  return { x: gx, y: gy, w: gw, h: gh };
}

function drawOutside(ctx: CanvasRenderingContext2D, pane: Rect, clarity: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(pane.x, pane.y, pane.w, pane.h);
  ctx.clip();
  ctx.globalAlpha = clamp(clarity, 0, 1);
  ctx.fillStyle = '#dcebfc';
  ctx.fillRect(pane.x, pane.y, pane.w, pane.h);
  ctx.fillStyle = '#f07e47';
  ctx.beginPath();
  ctx.arc(pane.x + pane.w * 0.78, pane.y + pane.h * 0.3, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = OUTDOOR;
  ctx.beginPath();
  ctx.moveTo(pane.x, pane.y + pane.h);
  ctx.quadraticCurveTo(
    pane.x + pane.w * 0.3,
    pane.y + pane.h * 0.42,
    pane.x + pane.w * 0.56,
    pane.y + pane.h
  );
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(pane.x + pane.w * 0.42, pane.y + pane.h);
  ctx.quadraticCurveTo(
    pane.x + pane.w * 0.72,
    pane.y + pane.h * 0.4,
    pane.x + pane.w,
    pane.y + pane.h
  );
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#76906a';
  ctx.fillRect(pane.x + pane.w * 0.6, pane.y + pane.h * 0.6, 7, 34);
  ctx.beginPath();
  ctx.arc(pane.x + pane.w * 0.6 + 3, pane.y + pane.h * 0.58, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFog(ctx: CanvasRenderingContext2D, pane: Rect, density: number, seed: number): void {
  const d = clamp(density, 0, 1);
  if (d <= 0.001) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(pane.x, pane.y, pane.w, pane.h);
  ctx.clip();
  ctx.fillStyle = FOG;
  ctx.globalAlpha = lerp(0, 0.82, d);
  ctx.fillRect(pane.x, pane.y, pane.w, pane.h);
  let s = seed;
  const rand = (): number => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  ctx.globalAlpha = clamp(d * 0.5, 0, 0.7);
  const patches = Math.round(d * 14);
  for (let i = 0; i < patches; i++) {
    const cx = pane.x + rand() * pane.w;
    const cy = pane.y + rand() * pane.h;
    const r = 22 + rand() * 58;
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grd.addColorStop(0, 'rgba(196,210,182,0.95)');
    grd.addColorStop(1, 'rgba(196,210,182,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCloth(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  ctx.fillStyle = '#b98a5a';
  ctx.fillRect(x - 4, y - r - 16, 8, 16);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(33,50,74,0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawSceneLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  ctx.fillStyle = INK;
  ctx.font = '700 18px "Segoe UI","PingFang SC",sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { label: string; color: string }[],
  x: number,
  y: number
): void {
  ctx.font = '700 15px "Segoe UI","PingFang SC",sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let cx = x;
  for (const it of items) {
    ctx.fillStyle = it.color;
    ctx.beginPath();
    ctx.arc(cx, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = MUTED;
    ctx.fillText(it.label, cx + 12, y);
    cx += 12 + ctx.measureText(it.label).width + 24;
  }
}

function drawValuePanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fog: number
): void {
  const clarity = 1 - clamp(fog, 0, 1);
  const tone = fog > 0.7 ? RED : fog >= 0.35 ? BLUE : GREEN;
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  roundRectPath(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1.5;
  roundRectPath(ctx, x, y, w, h, 12);
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = MUTED;
  ctx.font = '700 16px "Segoe UI","PingFang SC",sans-serif';
  ctx.fillText('可见度', x + 20, y + 34);
  ctx.fillStyle = INK;
  ctx.font = '700 42px "Segoe UI","PingFang SC",sans-serif';
  ctx.fillText(Math.round(clarity * 100) + '%', x + 20, y + 82);
  const trackW = w - 40;
  ctx.fillStyle = '#e6ecf3';
  roundRectPath(ctx, x + 20, y + 98, trackW, 12, 6);
  ctx.fill();
  ctx.fillStyle = tone;
  roundRectPath(ctx, x + 20, y + 98, map(clarity, 0, 1, 8, trackW), 12, 6);
  ctx.fill();
  ctx.fillStyle = MUTED;
  ctx.font = '700 15px "Segoe UI","PingFang SC",sans-serif';
  ctx.fillText('雾气浓度 ' + Math.round(clamp(fog, 0, 1) * 100) + '%', x + 20, y + 138);
  ctx.fillText('清晰度 = 1 − 雾', x + 20, y + 160);
}

function fogFeedback(f: number): { text: string; cls: string } {
  if (f > 0.7) return { text: '能见度很低，主要结构已经无法辨认。', cls: 'bad' };
  if (f >= 0.35) return { text: '结构开始被雾气覆盖，还能看到大致轮廓。', cls: '' };
  return { text: '窗外清晰，主要结构都能分辨。', cls: 'good' };
}

export const Ch1Fog: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ fog: 0.1 });
  const rafRef = useRef<number | null>(null);
  const [fog, setFog] = useState(0.1);
  const [feedback, setFeedback] = useState(fogFeedback(0.1));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { fog: number }) => {
      clearScene(ctx, W, H);
      const pane = drawWindow(ctx, 40, 44, 700, 200);
      drawOutside(ctx, pane, 1 - clamp(s.fog, 0, 1));
      drawFog(ctx, pane, s.fog, 11);
      const tone = s.fog > 0.7 ? RED : s.fog >= 0.35 ? BLUE : GREEN;
      drawCloth(ctx, pane.x + pane.w - 42, pane.y + pane.h - 26, 26, tone);
      drawSceneLabel(ctx, '起雾的玻璃窗', 40, 30);
      drawValuePanel(ctx, 780, 58, 260, 172, s.fog);
      drawLegend(
        ctx,
        [
          { label: '雾', color: FOG },
          { label: '窗外景物', color: OUTDOOR },
        ],
        780,
        258
      );
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    stateRef.current.fog = v;
    setFog(v);
    setFeedback(fogFeedback(v));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          雾气浓度 <span className="val">{Math.round(fog * 100)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(fog * 100)}
          onChange={onChange}
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Fog;
