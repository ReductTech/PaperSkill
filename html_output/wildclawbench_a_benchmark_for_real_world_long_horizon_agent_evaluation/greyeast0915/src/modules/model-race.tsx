import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { drawHikerSprite, drawMountainSprite, onClimbSpritesReady } from './climb-sprites';

const W = 1080;
const H = 360;
const DURATION = 2200;

type Metric = 'total' | 'multimodal' | 'text';

interface RaceState {
  metric: Metric;
  progress: number;
  running: boolean;
}

interface ModelRow {
  name: string;
  total: number;
  multimodal: number;
  text: number;
  color: string;
}

const ROWS: ModelRow[] = [
  { name: 'Claude Opus 4.7', total: 62.2, multimodal: 58.5, text: 65.0, color: '#228d5c' },
  { name: 'GPT-5.5', total: 58.2, multimodal: 63.0, text: 54.5, color: '#27446e' },
  { name: 'Claude Opus 4.6', total: 51.6, multimodal: 47.7, text: 54.6, color: '#7c3aed' },
  { name: 'GPT-5.4', total: 50.3, multimodal: 40.2, text: 58.0, color: '#f07e47' },
];

const METRICS: Array<{ id: Metric; label: string }> = [
  { id: 'total', label: '总分' },
  { id: 'multimodal', label: '多模态' },
  { id: 'text', label: '文本' },
];

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

function drawRace(ctx: CanvasRenderingContext2D, state: RaceState) {
  const progress = clamp(state.progress, 0, 1);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);

  drawMountainSprite(ctx, 205, 17, 755, 192, 0.17);

  ctx.fillStyle = '#21324a';
  ctx.font = '700 17px "Segoe UI", sans-serif';
  ctx.fillText(`OpenClaw · ${METRICS.find((item) => item.id === state.metric)?.label}（百分制）`, 28, 28);
  ctx.fillStyle = '#68778f';
  ctx.font = '13px "Segoe UI", sans-serif';
  ctx.fillText('固定执行框架，仅比较论文表中成绩', 790, 28);

  const startX = 245;
  const laneWidth = 680;
  const scaleMax = 70;
  const maxValue = Math.max(...ROWS.map((row) => row[state.metric]));

  ROWS.forEach((row, index) => {
    const y = 58 + index * 45;
    const value = row[state.metric];
    const targetX = startX + (value / scaleMax) * laneWidth;
    const currentX = startX + (targetX - startX) * progress;

    ctx.fillStyle = '#21324a';
    ctx.font = '600 14px "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(row.name, 205, y + 5);
    ctx.textAlign = 'left';

    ctx.strokeStyle = '#b8c9a7';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(startX + laneWidth, y);
    ctx.stroke();

    ctx.strokeStyle = row.color;
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(currentX, y);
    ctx.stroke();
    ctx.setLineDash([]);

    drawHikerSprite(ctx, currentX, y + 18, 30, 38);

    const valueX = Math.min(currentX + 22, 985);
    ctx.fillStyle = value === maxValue ? '#228d5c' : '#21324a';
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillText((value * progress).toFixed(1), valueX, y + 5);
  });

  ctx.strokeStyle = '#228d5c';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 5]);
  const goalX = startX + laneWidth;
  ctx.beginPath();
  ctx.moveTo(goalX, 40);
  ctx.lineTo(goalX, 195);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#228d5c';
  ctx.beginPath();
  ctx.ellipse(goalX, 39, 13, 7, -0.2, 0, Math.PI * 2);
  ctx.fill();

  const tableX = 120;
  const tableY = 222;
  const tableW = 840;
  const rowH = 25;
  const columns = [tableX, tableX + 300, tableX + 470, tableX + 640, tableX + tableW];
  roundedRect(ctx, tableX, tableY, tableW, 126, 10);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#27446e';
  roundedRect(ctx, tableX, tableY, tableW, rowH, 10);
  ctx.fill();
  ctx.fillRect(tableX, tableY + 12, tableW, 13);
  const headers = ['模型', '总分', '多模态', '文本'];
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 13px "Segoe UI", sans-serif';
  headers.forEach((header, index) => ctx.fillText(header, columns[index] + 12, tableY + 17));

  ROWS.forEach((row, rowIndex) => {
    const y = tableY + rowH * (rowIndex + 1);
    if (rowIndex % 2 === 1) {
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(tableX + 1, y, tableW - 2, rowH);
    }
    ctx.strokeStyle = '#d7deea';
    ctx.beginPath();
    ctx.moveTo(tableX, y);
    ctx.lineTo(tableX + tableW, y);
    ctx.stroke();
    ctx.fillStyle = '#21324a';
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText(row.name, columns[0] + 12, y + 17);
    ctx.fillText(row.total.toFixed(1), columns[1] + 12, y + 17);
    ctx.fillText(row.multimodal.toFixed(1), columns[2] + 12, y + 17);
    ctx.fillText(row.text.toFixed(1), columns[3] + 12, y + 17);
  });
}

function feedbackFor(metric: Metric) {
  if (metric === 'total') return '最高 62.2，仍有明显提升空间。';
  if (metric === 'multimodal') return '多模态并非对每个模型都更低：GPT-5.5 在表中例外。';
  return '同一模型的模态差距可能很大。';
}

export const ModelRace: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const stateRef = useRef<RaceState>({ metric: 'total', progress: 1, running: false });
  const [state, setState] = useState<RaceState>(stateRef.current);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const visibleRef = useRef(false);

  const updateState = (next: RaceState) => {
    stateRef.current = next;
    setState(next);
    if (contextRef.current) drawRace(contextRef.current, next);
  };

  const animate = (time: number) => {
    rafRef.current = null;
    if (!visibleRef.current || !stateRef.current.running) return;
    const progress = clamp((time - startTimeRef.current) / DURATION, 0, 1);
    updateState({ ...stateRef.current, progress, running: progress < 1 });
    if (progress < 1) rafRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      contextRef.current = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    drawRace(contextRef.current, stateRef.current);
    canvas.classList.add('is-ready');
    const removeSpriteListener = onClimbSpritesReady(() => {
      if (contextRef.current) drawRace(contextRef.current, stateRef.current);
    });
    const disconnect = observeCanvas(
      canvas,
      () => {
        visibleRef.current = true;
        if (contextRef.current) drawRace(contextRef.current, stateRef.current);
        if (stateRef.current.running && rafRef.current === null) {
          startTimeRef.current = performance.now() - stateRef.current.progress * DURATION;
          rafRef.current = requestAnimationFrame(animate);
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
      removeSpriteListener();
      disconnect();
    };
  }, []);

  const restart = () => {
    startTimeRef.current = performance.now();
    updateState({ ...stateRef.current, progress: 0, running: true });
    if (visibleRef.current && rafRef.current === null) rafRef.current = requestAnimationFrame(animate);
  };

  const selectMetric = (metric: Metric) => {
    updateState({ ...stateRef.current, metric });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl" role="group" aria-label="OpenClaw 成绩比较控制">
        <button className="tiny" type="button" onClick={restart}>
          开始比较
        </button>
        {METRICS.map((item) => (
          <button
            className={`chip ${state.metric === item.id ? 'selected' : ''}`}
            type="button"
            aria-pressed={state.metric === item.id}
            key={item.id}
            onClick={() => selectMetric(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="feedback good" aria-live="polite">{feedbackFor(state.metric)}</div>
    </div>
  );
};

export default ModelRace;
