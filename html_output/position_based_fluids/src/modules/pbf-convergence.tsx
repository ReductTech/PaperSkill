import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

const C = {
  bg: '#f4f9ff',
  water: '#35c6f4',
  waterDeep: '#0754a6',
  guide: '#0b4f9f',
  good: '#228d5c',
  bad: '#c43f52',
  user: '#d97706',
  aux: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
};

function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 2
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 7 * Math.cos(angle - Math.PI / 6), y2 - 7 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 7 * Math.cos(angle + Math.PI / 6), y2 - 7 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

export const PbfConvergence: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [iterations, setIterations] = useState(1);
  const schematicError = Math.round(100 * Math.pow(0.72, iterations));
  const reach = Math.min(5, Math.max(1, Math.ceil(iterations / 2)));

  const feedback = useMemo(() => {
    if (iterations <= 3) {
      return '修正正在局部传播；Jacobi 每轮只使用上一轮的邻域信息。';
    }
    if (iterations <= 7) {
      return '重复修正继续减小示意密度偏差，但这里的曲线不是论文测量值。';
    }
    return '更多轮次让此示意更贴近目标，同时增加求解工作；不存在适用于所有场景的固定轮数。';
  }, [iterations]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const ctx = setupCanvas(canvas, 560, 240);
      ctx.clearRect(0, 0, 560, 240);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, 560, 240);

      ctx.strokeStyle = C.line;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(24, 198);
      ctx.lineTo(386, 198);
      ctx.stroke();
      const pool = ctx.createLinearGradient(0, 182, 0, 216);
      pool.addColorStop(0, 'rgba(191,238,255,0.72)');
      pool.addColorStop(1, 'rgba(7,84,166,0.88)');
      ctx.fillStyle = pool;
      ctx.beginPath();
      ctx.ellipse(205, 198, 150, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.setLineDash([7, 6]);
      ctx.strokeStyle = C.guide;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(62, 111);
      ctx.bezierCurveTo(130, 91, 278, 91, 350, 111);
      ctx.stroke();
      ctx.restore();

      const offsets = [24, 20, 15, 10, 5, 0, 5, 10, 15, 20, 24];
      const points = offsets.map((offset, i) => {
        const distance = Math.abs(i - 5);
        const localPasses = Math.max(0, iterations - distance * 1.15);
        const y = 111 - offset * Math.pow(0.72, localPasses);
        return { x: 70 + i * 28, y, active: distance <= reach };
      });

      ctx.strokeStyle = '#b7c2d1';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < points.length - 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
        ctx.stroke();
      }

      ctx.strokeStyle = C.waterDeep;
      ctx.lineWidth = 4;
      ctx.beginPath();
      points.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();

      points.forEach((point, i) => {
        const targetY = 111 - offsets[i];
        if (Math.abs(point.y - targetY) > 2) {
          ctx.strokeStyle = C.bad;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(point.x, point.y - 2);
          ctx.lineTo(point.x, targetY + 2);
          ctx.stroke();
        }
        if (point.active) {
          ctx.strokeStyle = C.aux;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
          ctx.stroke();
        }
        const droplet = ctx.createRadialGradient(point.x - 2, point.y - 2, 1, point.x, point.y, 6);
        droplet.addColorStop(0, '#ffffff');
        droplet.addColorStop(0.3, '#bfeeff');
        droplet.addColorStop(1, C.waterDeep);
        ctx.fillStyle = droplet;
        ctx.strokeStyle = C.waterDeep;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      const frontX = 210 + reach * 28;
      arrow(ctx, frontX - 24, 58, frontX, 58, C.aux, 3);
      ctx.fillStyle = C.aux;
      ctx.font = '13px Segoe UI';
      ctx.fillText('局部传播前沿', 250, 45);

      ctx.strokeStyle = C.line;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(402, 18);
      ctx.lineTo(402, 220);
      ctx.stroke();

      ctx.fillStyle = C.text;
      ctx.font = '700 14px Segoe UI';
      ctx.fillText(`第 ${iterations} 轮`, 426, 46);
      ctx.fillStyle = C.muted;
      ctx.font = '13px Segoe UI';
      ctx.fillText('归一化示意偏差', 426, 75);
      ctx.fillStyle = '#e5eaf1';
      ctx.fillRect(426, 88, 104, 18);
      ctx.fillStyle = schematicError > 35 ? C.bad : C.good;
      ctx.fillRect(426, 88, Math.max(5, schematicError * 1.04), 18);
      ctx.fillStyle = C.text;
      ctx.font = '700 15px Segoe UI';
      ctx.fillText(`${schematicError}%`, 426, 130);
      ctx.fillStyle = C.muted;
      ctx.font = '12px Segoe UI';
      ctx.fillText('教学值，非论文测量', 426, 151);

      const ringColor = iterations >= 8 ? C.good : C.guide;
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(478, 190, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (iterations / 10));
      ctx.stroke();
      ctx.fillStyle = ringColor;
      ctx.font = '700 12px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText('轮次', 478, 194);
      ctx.textAlign = 'start';
      canvas.classList.add('is-ready');
    };

    const disconnect = observeCanvas(canvas, draw, () => {});
    return disconnect;
  }, [iterations, reach, schematicError]);

  const setSafeIterations = (value: number) => setIterations(Math.min(10, Math.max(1, value)));

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={560}
        height={240}
        role="img"
        aria-label={`Jacobi 第 ${iterations} 轮，局部传播前沿覆盖约 ${reach} 层邻域，归一化示意偏差 ${schematicError}%，不是论文测量值。`}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      <div className="ctrl">
        <button
          type="button"
          className="tiny ghost"
          onClick={() => setSafeIterations(iterations - 1)}
          disabled={iterations === 1}
          aria-label="减少一轮迭代"
        >
          −1
        </button>
        <label htmlFor="pbf-convergence-iterations">迭代轮数</label>
        <input
          id="pbf-convergence-iterations"
          type="range"
          min={1}
          max={10}
          step={1}
          value={iterations}
          aria-valuetext={`当前第 ${iterations} 轮，共 10 轮`}
          onChange={(event) => setSafeIterations(Number(event.currentTarget.value))}
        />
        <span className="val">{iterations} / 10</span>
        <button
          type="button"
          className="tiny"
          onClick={() => setSafeIterations(iterations + 1)}
          disabled={iterations === 10}
          aria-label="增加一轮迭代"
        >
          +1
        </button>
      </div>
      <div className="metrics" aria-label="当前迭代教学读数">
        <div className="metric"><div className="l">当前轮次</div><div className="v">{iterations}</div></div>
        <div className="metric"><div className="l">传播层数（示意）</div><div className="v">{reach}</div></div>
        <div className="metric"><div className="l">归一化偏差（示意）</div><div className="v">{schematicError}%</div></div>
      </div>
      <div className={`feedback ${iterations >= 8 ? 'good' : ''}`} aria-live="polite">
        {feedback}
      </div>
      <p className="step-desc">界面轮数与偏差只用于理解重复投影，不是通用收敛阈值或论文实测曲线。</p>
    </div>
  );
};
