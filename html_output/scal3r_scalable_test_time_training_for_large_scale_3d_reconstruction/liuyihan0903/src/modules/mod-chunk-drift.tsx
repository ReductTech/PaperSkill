import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §2 模块 2.4 —— 分块带来的问题：漂移（drift）。
// 纯问题演示，不含任何解法开关：每块只在本块内估计，各自选了略不同的
// 方向/尺度，重叠帧被相邻两块放到不同位置（接缝对不上）；块数越多，
// 误差一段段累加，拼出来的轨迹相对真值越漂越远。
const W = 560;
const H = 250;
const K_MIN = 2;
const K_MAX = 6;
const PER_CHUNK_ERR = 0.16; // 每跨过一个块界，方向误差累加的弧度

interface Pt {
  x: number;
  y: number;
}
interface DriftState {
  t: number;
  k: number;
}

function drawValley(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8c9a7';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.quadraticCurveTo(w * 0.3, h * 0.7, w * 0.6, h * 0.8);
  ctx.quadraticCurveTo(w * 0.85, h * 0.86, w, h * 0.74);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

function drawPath(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  color: string,
  width: number,
  dash: number[] = []
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.setLineDash(dash);
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();
  ctx.setLineDash([]);
}

export const ModChunkDrift: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<DriftState>({ t: 0, k: 4 });
  const rafRef = useRef<number | null>(null);
  const [k, setK] = useState(4);
  const [feedback, setFeedback] = useState({
    text: '每块各画各的：重叠帧被放到不同位置，接缝对不上；块数越多，漂移越大。',
    cls: 'bad',
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

    const x0 = 40;
    const x1 = W - 40;
    const span = x1 - x0;
    const yBase = 128;
    const amp = 12;
    // 真值轨迹：一条平滑的路
    const gt = (tt: number): Pt => ({
      x: x0 + tt * span,
      y: yBase + Math.sin(tt * Math.PI * 2) * amp,
    });

    const render = (s: DriftState) => {
      const K = Math.round(s.k);
      const wobble = Math.sin(s.t * 0.05) * 0.012;
      ctx.clearRect(0, 0, W, H);
      drawValley(ctx, W, H);

      // 真值轨迹（灰色虚线 = 参照）
      const gtPts: Pt[] = [];
      const steps = 96;
      for (let i = 0; i <= steps; i++) gtPts.push(gt(i / steps));
      drawPath(ctx, gtPts, '#9aa7b8', 2, [5, 5]);

      // 估计轨迹：逐段推进，每跨一个块界方向误差累加，并在接缝处产生错位跳变
      const est: Pt[] = [];
      const boundaries: Pt[] = [];
      let p: Pt = { x: gt(0).x, y: gt(0).y };
      est.push({ ...p });
      let prevChunk = 0;
      for (let i = 1; i <= steps; i++) {
        const t0 = (i - 1) / steps;
        const t1 = i / steps;
        const chunkIdx = Math.floor(t1 * K + 1e-9);
        const ang = chunkIdx * PER_CHUNK_ERR + wobble * chunkIdx;
        const dx = gt(t1).x - gt(t0).x;
        const dy = gt(t1).y - gt(t0).y;
        // 跨块界：重叠帧被相邻块放到不同位置，产生一小段接缝错位
        if (chunkIdx !== prevChunk) {
          p.x += 4;
          p.y -= 7;
          boundaries.push({ ...p });
          prevChunk = chunkIdx;
        }
        const rx = dx * Math.cos(ang) - dy * Math.sin(ang);
        const ry = dx * Math.sin(ang) + dy * Math.cos(ang);
        p = { x: p.x + rx, y: p.y + ry };
        est.push({ ...p });
      }
      drawPath(ctx, est, '#c43f52', 3.5);

      // 接缝错位标记（红色小叉）
      boundaries.forEach((b) => {
        ctx.strokeStyle = '#c43f52';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(b.x - 5, b.y - 5);
        ctx.lineTo(b.x + 5, b.y + 5);
        ctx.moveTo(b.x + 5, b.y - 5);
        ctx.lineTo(b.x - 5, b.y + 5);
        ctx.stroke();
      });

      // 终点漂移：真值终点 → 估计终点 的偏差
      const gtEnd = gtPts[gtPts.length - 1];
      const estEnd = est[est.length - 1];
      const drift = Math.round(Math.hypot(estEnd.x - gtEnd.x, estEnd.y - gtEnd.y));
      ctx.strokeStyle = 'rgba(196,63,82,0.55)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(gtEnd.x, gtEnd.y);
      ctx.lineTo(estEnd.x, estEnd.y);
      ctx.stroke();
      ctx.setLineDash([]);
      // 真值终点（灰点）与估计终点（红点）
      ctx.fillStyle = '#9aa7b8';
      ctx.beginPath();
      ctx.arc(gtEnd.x, gtEnd.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c43f52';
      ctx.beginPath();
      ctx.arc(estEnd.x, estEnd.y, 5, 0, Math.PI * 2);
      ctx.fill();

      // 图例
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#68778f';
      ctx.fillText('灰虚线 = 真值轨迹', x0, 24);
      ctx.fillStyle = '#c43f52';
      ctx.fillText('红实线 = 分块拼出的估计（红叉=接缝错位）', x0 + 130, 24);

      // 读数
      ctx.font = '14px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#21324a';
      ctx.fillText(`块数 K = ${K}`, x0, H - 20);
      ctx.fillStyle = '#c43f52';
      ctx.fillText(`终点累计漂移 ≈ ${drift} px`, x1 - 170, H - 20);
    };

    const tick = () => {
      stateRef.current.t += 1;
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onK = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value), K_MIN, K_MAX);
    stateRef.current.k = v;
    setK(v);
    setFeedback({
      text:
        `切成 ${v} 块：每块各自估计方向与尺度，${v - 1} 处接缝都对不上，` +
        `误差一段段累加——块数越多，终点漂得越远。`,
      cls: 'bad',
    });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          块数 K <span className="val">{k}</span>
        </label>
        <input type="range" min={K_MIN} max={K_MAX} value={k} onChange={onK} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ModChunkDrift;
