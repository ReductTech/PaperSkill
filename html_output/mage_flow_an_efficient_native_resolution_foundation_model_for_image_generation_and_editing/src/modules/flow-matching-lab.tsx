import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 760;
const H = 340;
const C = {
  field: '#f5f0e8', paper: '#faf9f5', light: '#d8c9b0', dark: '#a98f6d',
  support: '#8a5a33', blue: '#cc785c', green: '#5db872', red: '#c64545',
  orange: '#e8a55a', ink: '#252523', muted: '#6c6a64', axis: '#e6dfd8',
};

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = C.blue;
  ctx.fillStyle = C.blue;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 10 * Math.cos(angle - Math.PI / 6), y2 - 10 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 10 * Math.cos(angle + Math.PI / 6), y2 - 10 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

export const FlowMatchingLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [t, setT] = useState(0.65);

  const zone = t >= 0.8 ? 'noise' : t <= 0.2 ? 'data' : 'middle';
  const feedback = zone === 'noise'
    ? '这里更接近噪声端。'
    : zone === 'data'
      ? '沿预测速度回到数据潜变量端。'
      : '模型学习沿直线路径预测速度。';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.maxWidth = `${W}px`;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.field;
    ctx.fillRect(0, 0, W, H);

    panel(ctx, 24, 32, 330, 248);
    panel(ctx, 410, 32, 326, 248);

    ctx.fillStyle = C.ink;
    ctx.font = '700 15px "Segoe UI", sans-serif';
    ctx.fillText('同一个 t：海报潜变量', 42, 58);
    ctx.fillText('整流流的线性路径', 430, 58);

    // Poster view.
    ctx.fillStyle = C.paper;
    ctx.strokeStyle = C.light;
    ctx.lineWidth = 2;
    ctx.fillRect(70, 78, 238, 166);
    ctx.strokeRect(70, 78, 238, 166);
    ctx.fillStyle = `rgba(39,68,110,${0.12 + (1 - t) * 0.34})`;
    ctx.fillRect(94, 102, 190, 34);
    ctx.fillStyle = `rgba(34,141,92,${0.16 + (1 - t) * 0.62})`;
    ctx.fillRect(94, 150, 126, 58);
    ctx.strokeStyle = `rgba(196,63,82,${0.18 + t * 0.68})`;
    ctx.lineWidth = 1.5;
    const hatchCount = Math.round(4 + t * 22);
    for (let i = 0; i < hatchCount; i += 1) {
      const x = 78 + ((i * 43) % 220);
      const y = 88 + ((i * 31) % 140);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 13, y + 8);
      ctx.stroke();
    }
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(278, 220); ctx.lineTo(298, 220);
    ctx.moveTo(288, 210); ctx.lineTo(288, 230);
    ctx.stroke();
    ctx.fillStyle = C.muted;
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('高维潜变量的二维投影', 94, 266);

    // Link mark.
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(370, 150); ctx.lineTo(394, 150);
    ctx.moveTo(386, 142); ctx.lineTo(394, 150); ctx.lineTo(386, 158);
    ctx.stroke();

    // Latent path: data on the left, noise on the right.
    const dataX = 458;
    const noiseX = 688;
    const pathY = 164;
    const pointX = lerp(dataX, noiseX, t);
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(dataX, pathY); ctx.lineTo(noiseX, pathY); ctx.stroke();
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(noiseX, pathY); ctx.lineTo(pointX, pathY); ctx.stroke();
    ctx.fillStyle = C.green;
    ctx.fillRect(dataX - 7, pathY - 7, 14, 14);
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(noiseX - 7, pathY - 7); ctx.lineTo(noiseX + 7, pathY + 7);
    ctx.moveTo(noiseX + 7, pathY - 7); ctx.lineTo(noiseX - 7, pathY + 7);
    ctx.stroke();
    ctx.fillStyle = C.orange;
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(pointX, pathY, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    const arrowStart = Math.max(pointX - 12, dataX + 30);
    arrow(ctx, arrowStart, pathY - 34, dataX + 10, pathY - 34);

    ctx.fillStyle = C.ink;
    ctx.font = '700 13px "Segoe UI", sans-serif';
    ctx.fillText('数据 z', dataX - 24, 204);
    ctx.fillText('噪声 ε', noiseX - 28, 204);
    ctx.fillStyle = C.muted;
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('t=0', dataX - 13, 222);
    ctx.fillText('t=1', noiseX - 13, 222);
    ctx.fillStyle = C.orange;
    ctx.font = '700 13px "Segoe UI", sans-serif';
    ctx.fillText(`zₜ · t=${t.toFixed(2)}`, clamp(pointX - 38, 430, 650), 138);
    ctx.fillStyle = C.blue;
    ctx.fillText('目标速度 z−ε（方向示意）', 472, 108);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.fillRect(24, 292, 712, 30);
    ctx.strokeRect(24, 292, 712, 30);
    ctx.fillStyle = C.ink;
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('固定约定：t=0 是数据端，t=1 是噪声端；采样从噪声端走向数据端。', 40, 312);
    canvas.classList.add('is-ready');
  }, [t]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') setT(0);
    else if (event.key === 'End') setT(1);
    else setT((value) => clamp(value + (event.key === 'ArrowRight' ? 0.05 : -0.05), 0, 1));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-hidden="true" />
      <div className="ctrl">
        <label htmlFor={`flow-t-${chapterId}-${moduleId}`}>
          插值时间 t <span className="val">{t.toFixed(2)}</span>
        </label>
        <input
          id={`flow-t-${chapterId}-${moduleId}`}
          type="range" min={0} max={1} step={0.01} value={t}
          onChange={(event) => setT(Number(event.target.value))}
          onKeyDown={onKeyDown}
          aria-describedby={`flow-summary-${chapterId}-${moduleId}`}
        />
      </div>
      <div id={`flow-summary-${chapterId}-${moduleId}`} className="step-desc">
        当前 zₜ=(1−{t.toFixed(2)})z+{t.toFixed(2)}ε；数据端 t=0，噪声端 t=1。
      </div>
      <div className={`feedback ${zone === 'data' ? 'good' : zone === 'noise' ? 'bad' : ''}`} aria-live="polite">
        {zone === 'data' ? '✓ ' : zone === 'noise' ? '× ' : '→ '}{feedback}
      </div>
    </div>
  );
};

export default FlowMatchingLab;
