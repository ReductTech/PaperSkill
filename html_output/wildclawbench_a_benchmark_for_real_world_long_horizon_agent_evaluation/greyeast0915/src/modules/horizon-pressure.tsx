import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { drawHikerSprite, drawMountainSprite, onClimbSpritesReady } from './climb-sprites';

const W = 1080;
const H = 300;
const C = { bg: '#f5f8f0', route: '#92400e', blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47', ink: '#21324a', muted: '#68778f', line: '#d7deea' };

function bar(ctx: CanvasRenderingContext2D, label: string, x: number, y: number, value: number, color: string, valueText: string) {
  ctx.fillStyle = C.ink; ctx.font = '600 17px "Segoe UI", sans-serif'; ctx.fillText(label, x, y);
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(x, y + 12, 280, 22, 11); ctx.fill(); ctx.stroke();
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x + 2, y + 14, clamp(value, 0, 1) * 276, 18, 9); ctx.fill();
  ctx.fillStyle = C.muted; ctx.font = '14px "Segoe UI", sans-serif'; ctx.fillText(valueText, x, y + 54);
}

export const HorizonPressure: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState({ steps: 4 });
  const risk = 1 - Math.pow(0.97, model.steps);
  const feedback = model.steps <= 5
    ? { text: '短任务容易掩盖中途故障。', cls: '', color: C.blue }
    : model.steps <= 20
      ? { text: '轨迹变长，局部错误开始累积。', cls: '', color: C.orange }
      : { text: '长时程下，超时与错误链必须被直接评测。', cls: 'bad', color: C.red };

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    canvas.style.height = 'auto';
    const render = () => {
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      drawMountainSprite(ctx, 25, 28, 625, 248, 0.24);
      const points: Array<[number, number]> = [];
      for (let i = 0; i < model.steps; i += 1) {
        const p = model.steps === 1 ? 0 : i / (model.steps - 1);
        points.push([68 + p * 535, 248 - p * 186 + Math.sin(i * 1.35) * 28]);
      }
      ctx.strokeStyle = C.route; ctx.lineWidth = 3; ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
      points.forEach(([x, y], i) => { ctx.fillStyle = i === points.length - 1 ? C.green : C.route; ctx.beginPath(); ctx.ellipse(x, y, 7, 5, -.25, 0, Math.PI * 2); ctx.fill(); });
      const last = points[points.length - 1];
      drawHikerSprite(ctx, last[0] - 2, last[1] + 12, 68, 82);
      ctx.fillStyle = C.ink; ctx.font = '600 18px "Segoe UI", sans-serif'; ctx.fillText(`${model.steps} 次依赖操作`, 45, 30);

      ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(675, 20); ctx.lineTo(675, 280); ctx.stroke();
      ctx.fillStyle = C.ink; ctx.font = '700 20px "Segoe UI", sans-serif'; ctx.fillText('技术视图', 710, 38);
      const tickGap = 280 / Math.max(model.steps, 1);
      for (let i = 0; i < model.steps; i += 1) { ctx.fillStyle = i % 5 === 4 ? C.orange : C.blue; ctx.fillRect(712 + i * tickGap, 57, Math.max(2, tickGap - 2), 13); }
      ctx.fillStyle = C.muted; ctx.font = '14px "Segoe UI", sans-serif'; ctx.fillText('工具调用刻度', 710, 90);
      bar(ctx, '至少一次失误的示意风险', 710, 120, risk, feedback.color, `${(risk * 100).toFixed(1)}% · 示意，不是论文拟合值`);
      bar(ctx, '时间压力（线性示意）', 710, 206, model.steps / 30, model.steps > 20 ? C.red : C.blue, `${model.steps} × 单步时间`);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const removeSpriteListener = onClimbSpritesReady(render);
    const disconnect = observeCanvas(canvas, render, () => {}); return () => { removeSpriteListener(); disconnect(); };
  }, [model.steps, risk, feedback.color]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-label="任务长度、工具调用、示意风险与时间压力联动图" />
      <div className="ctrl">
        <label htmlFor={`steps-${chapterId}-${moduleId}`}>任务长度 <span className="val">{model.steps}</span></label>
        <input id={`steps-${chapterId}-${moduleId}`} type="range" min={1} max={30} value={model.steps} onChange={(event) => setModel({ steps: clamp(Number(event.target.value), 1, 30) })} />
      </div>
      <div className={`feedback ${feedback.cls}`} style={{ borderLeftColor: feedback.color }}>{feedback.text}</div>
    </div>
  );
};

export default HorizonPressure;
