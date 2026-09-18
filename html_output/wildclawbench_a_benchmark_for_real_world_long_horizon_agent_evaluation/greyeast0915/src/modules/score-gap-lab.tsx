import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 300;
const AXIS_LEFT = 112;
const AXIS_RIGHT = 968;

type ScoreModel = {
  a: number;
  b: number;
};

type Marker = keyof ScoreModel;

const COLORS = {
  bg: '#f5f8f0',
  rock: '#e3eadc',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  blue: '#27446e',
  purple: '#7c3aed',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
};

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawMarker(
  ctx: CanvasRenderingContext2D,
  score: number,
  y: number,
  label: string,
  color: string
) {
  const x = AXIS_LEFT + score * (AXIS_RIGHT - AXIS_LEFT);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, 92);
  ctx.lineTo(x, y - 16);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 14px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y);

  ctx.fillStyle = COLORS.text;
  ctx.font = '700 18px "Segoe UI", sans-serif';
  ctx.textAlign = x > W - 145 ? 'right' : 'left';
  ctx.fillText(score.toFixed(2), x > W - 145 ? x - 20 : x + 20, y);
}

function drawScene(ctx: CanvasRenderingContext2D, model: ScoreModel) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = COLORS.rock;
  ctx.beginPath();
  ctx.moveTo(0, 250);
  ctx.bezierCurveTo(170, 218, 278, 271, 438, 238);
  ctx.bezierCurveTo(610, 203, 740, 260, 1080, 220);
  ctx.lineTo(1080, 300);
  ctx.lineTo(0, 300);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = COLORS.text;
  ctx.font = '700 21px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('试跑归一化得分', AXIS_LEFT, 35);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '15px "Segoe UI", sans-serif';
  ctx.fillText('拖动 A / B 标记，或使用下方滑块', AXIS_LEFT + 194, 35);

  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(AXIS_LEFT, 82);
  ctx.lineTo(AXIS_RIGHT, 82);
  ctx.stroke();

  for (let tick = 0; tick <= 10; tick += 1) {
    const x = AXIS_LEFT + (tick / 10) * (AXIS_RIGHT - AXIS_LEFT);
    ctx.strokeStyle = tick % 2 === 0 ? COLORS.muted : COLORS.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 75);
    ctx.lineTo(x, 91);
    ctx.stroke();
    if (tick % 2 === 0) {
      ctx.fillStyle = COLORS.muted;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText((tick / 10).toFixed(1), x, 67);
    }
  }

  drawMarker(ctx, model.a, 133, 'A', COLORS.blue);
  drawMarker(ctx, model.b, 178, 'B', COLORS.purple);

  const xa = AXIS_LEFT + model.a * (AXIS_RIGHT - AXIS_LEFT);
  const xb = AXIS_LEFT + model.b * (AXIS_RIGHT - AXIS_LEFT);
  const left = Math.min(xa, xb);
  const right = Math.max(xa, xb);
  const gap = Math.abs(model.a - model.b);
  const passed = gap >= 0.2 - Number.EPSILON;
  const verdictColor = passed ? COLORS.green : COLORS.red;

  ctx.strokeStyle = COLORS.orange;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, 210);
  ctx.lineTo(left, 226);
  ctx.lineTo(right, 226);
  ctx.lineTo(right, 210);
  ctx.stroke();
  ctx.fillStyle = COLORS.orange;
  ctx.font = '700 19px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Δ = |A − B| = ' + gap.toFixed(2), (left + right) / 2, 252);

  roundedRect(ctx, 780, 246, 188, 38, 19);
  ctx.fillStyle = verdictColor;
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 15px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(passed ? '进入专家复核' : '区分度筛选不通过', 874, 265);
}

export const ScoreGapLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [model, setModel] = useState<ScoreModel>({ a: 0.55, b: 0.6 });
  const modelRef = useRef(model);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef<Marker | null>(null);

  useEffect(() => {
    modelRef.current = model;
  }, [model]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const tick = () => {
      drawScene(ctx, modelRef.current);
      canvas.classList.add('is-ready');
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

  const scoreAt = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    const logicalX = (clientX - rect.left) * (W / rect.width);
    return clamp((logicalX - AXIS_LEFT) / (AXIS_RIGHT - AXIS_LEFT), 0, 1);
  };

  const moveMarker = (marker: Marker, score: number) => {
    const next = Math.round(clamp(score, 0, 1) * 100) / 100;
    setModel((current) => ({ ...current, [marker]: next }));
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const score = scoreAt(event.clientX);
    const marker: Marker =
      Math.abs(score - model.a) <= Math.abs(score - model.b) ? 'a' : 'b';
    dragRef.current = marker;
    event.currentTarget.setPointerCapture(event.pointerId);
    moveMarker(marker, score);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current) moveMarker(dragRef.current, scoreAt(event.clientX));
  };

  const stopDrag = (event: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const gap = Math.abs(model.a - model.b);
  const passed = gap >= 0.2 - Number.EPSILON;

  return (
    <div>
      <canvas
        id={'cv-' + chapterId + '-' + moduleId}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label="两名试跑模型的分数轴与绝对分差"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
      />
      <div className="ctrl">
        <label>
          模型 A <span className="val">{model.a.toFixed(2)}</span>
          <input
            aria-label="模型 A 得分"
            type="range"
            min={0}
            max={100}
            value={Math.round(model.a * 100)}
            onChange={(event) => moveMarker('a', Number(event.target.value) / 100)}
          />
        </label>
        <label>
          模型 B <span className="val">{model.b.toFixed(2)}</span>
          <input
            aria-label="模型 B 得分"
            type="range"
            min={0}
            max={100}
            value={Math.round(model.b * 100)}
            onChange={(event) => moveMarker('b', Number(event.target.value) / 100)}
          />
        </label>
        <button className="tiny ghost" type="button" onClick={() => setModel({ a: 0.55, b: 0.6 })}>
          重置 0.55 / 0.60
        </button>
        <button className="tiny" type="button" onClick={() => setModel({ a: 0.3, b: 0.7 })}>
          预设 0.30 / 0.70
        </button>
      </div>
      <div className={'feedback ' + (passed ? 'good' : 'bad')}>
        {passed
          ? 'Δ ≥ 0.2：进入专家复核，而不是自动收录。'
          : 'Δ < 0.2：区分度筛选不通过。'}
      </div>
    </div>
  );
};

export default ScoreGapLab;
