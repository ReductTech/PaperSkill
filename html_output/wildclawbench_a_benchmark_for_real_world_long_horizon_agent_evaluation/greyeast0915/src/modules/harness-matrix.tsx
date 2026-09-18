import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeOutCubic, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 330;
const DURATION = 700;

type ModelName = 'GPT-5.4' | 'GLM-5' | 'MiMo-V2-Pro' | 'MiniMax-M2.7';

interface HarnessState {
  model: ModelName;
}

const HARNESSES = ['OpenClaw', 'Claude Code', 'Codex', 'Hermes'] as const;

const SCORES: Record<ModelName, readonly [number, number, number, number]> = {
  'GPT-5.4': [50.3, 48.4, 56.8, 50.7],
  'GLM-5': [42.6, 31.0, 38.9, 46.4],
  'MiMo-V2-Pro': [40.2, 29.9, 35.3, 48.1],
  'MiniMax-M2.7': [33.8, 32.0, 35.8, 37.1],
};

const MODELS = Object.keys(SCORES) as ModelName[];

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

function drawMatrix(ctx: CanvasRenderingContext2D, state: HarnessState, rawProgress: number) {
  const progress = easeOutCubic(clamp(rawProgress, 0, 1));
  const values = SCORES[state.model];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const spread = max - min;
  const barX = 245;
  const barMaxW = 650;
  const scaleMax = 60;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#e3eadc';
  ctx.beginPath();
  ctx.moveTo(205, 28);
  ctx.lineTo(950, 28);
  ctx.lineTo(920, 260);
  ctx.lineTo(220, 260);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#21324a';
  ctx.font = '700 18px "Segoe UI", sans-serif';
  ctx.fillText(`${state.model} · 执行框架成绩（百分制）`, 28, 31);
  ctx.fillStyle = '#68778f';
  ctx.font = '13px "Segoe UI", sans-serif';
  ctx.fillText('同一模型，四条原生执行链', 820, 31);

  values.forEach((value, index) => {
    const y = 65 + index * 51;
    const width = (value / scaleMax) * barMaxW * progress;
    const color = value === max ? '#228d5c' : value === min ? '#c43f52' : '#27446e';

    ctx.fillStyle = '#21324a';
    ctx.font = '600 15px "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(HARNESSES[index], 215, y + 18);
    ctx.textAlign = 'left';

    roundedRect(ctx, barX, y, barMaxW, 27, 13);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#b8c9a7';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (width > 0) {
      roundedRect(ctx, barX, y, Math.max(2, width), 27, 13);
      ctx.fillStyle = color;
      ctx.fill();
    }

    ctx.fillStyle = color;
    ctx.font = '700 15px "Segoe UI", sans-serif';
    ctx.fillText((value * progress).toFixed(1), Math.min(barX + width + 12, 955), y + 19);
  });

  const minX = barX + (min / scaleMax) * barMaxW * progress;
  const maxX = barX + (max / scaleMax) * barMaxW * progress;
  const bracketY = 285;
  ctx.strokeStyle = '#f07e47';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(minX, bracketY - 8);
  ctx.lineTo(minX, bracketY);
  ctx.lineTo(maxX, bracketY);
  ctx.lineTo(maxX, bracketY - 8);
  ctx.stroke();

  const pillW = 196;
  const pillX = clamp((minX + maxX) / 2 - pillW / 2, 245, 840);
  roundedRect(ctx, pillX, 294, pillW, 25, 12);
  ctx.fillStyle = '#fff3eb';
  ctx.fill();
  ctx.strokeStyle = '#f07e47';
  ctx.stroke();
  ctx.fillStyle = '#92400e';
  ctx.font = '700 13px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`最高 − 最低 = ${(spread * progress).toFixed(1)}`, pillX + pillW / 2, 311);
  ctx.textAlign = 'left';
}

function feedbackFor(model: ModelName) {
  const values = SCORES[model];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (model === 'MiMo-V2-Pro') {
    return '29.9→48.1，相差 18.2：执行框架不是中性外壳。';
  }
  return `${model}：${min.toFixed(1)}→${max.toFixed(1)}，最高与最低相差 ${(max - min).toFixed(1)}。`;
}

export const HarnessMatrix: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const stateRef = useRef<HarnessState>({ model: 'GPT-5.4' });
  const [state, setState] = useState<HarnessState>(stateRef.current);
  const progressRef = useRef(1);
  const startTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const visibleRef = useRef(false);

  const animate = (time: number) => {
    rafRef.current = null;
    if (!visibleRef.current) return;
    progressRef.current = clamp((time - startTimeRef.current) / DURATION, 0, 1);
    if (contextRef.current) drawMatrix(contextRef.current, stateRef.current, progressRef.current);
    if (progressRef.current < 1) rafRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      contextRef.current = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    drawMatrix(contextRef.current, stateRef.current, progressRef.current);
    canvas.classList.add('is-ready');
    const disconnect = observeCanvas(
      canvas,
      () => {
        visibleRef.current = true;
        if (progressRef.current < 1) {
          startTimeRef.current = performance.now() - progressRef.current * DURATION;
          if (rafRef.current === null) rafRef.current = requestAnimationFrame(animate);
        } else if (contextRef.current) {
          drawMatrix(contextRef.current, stateRef.current, 1);
        }
      },
      () => {
        visibleRef.current = false;
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    );
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      disconnect();
    };
  }, []);

  const selectModel = (model: ModelName) => {
    const next: HarnessState = { model };
    stateRef.current = next;
    setState(next);
    progressRef.current = 0;
    startTimeRef.current = performance.now();
    if (contextRef.current) drawMatrix(contextRef.current, next, 0);
    if (visibleRef.current && rafRef.current === null) rafRef.current = requestAnimationFrame(animate);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl" role="group" aria-label="选择模型查看执行框架差异">
        {MODELS.map((model) => (
          <button
            className={`chip ${state.model === model ? 'selected' : ''}`}
            type="button"
            aria-pressed={state.model === model}
            key={model}
            onClick={() => selectModel(model)}
          >
            {model}
          </button>
        ))}
      </div>
      <div className="feedback" aria-live="polite">{feedbackFor(state.model)}</div>
    </div>
  );
};

export default HarnessMatrix;
