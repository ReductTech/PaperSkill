import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  PALETTE,
  drawScene,
  drawInkPath,
  drawGhostPath,
  drawLegend,
  drawSceneLabel,
} from './theme-kit';
import type { WidgetProps } from './registry';

// 模块 7.1 想象数据占比滑杆（P1 滑杆）：上区空中轨迹数量 ∝ r（淡蓝虚线）
// + 一条实纸墨迹（深蓝）；下区成功率曲线 succ(r)=0.30+0.58·r·e^(−((r−0.62)/0.42)²)
// （示意），橙色标记沿曲线移动；左下三枚想象转移徽标 ô / r̂ / d̂。

const W = 720;
const H = 320;

const AIR_X0 = 130;
const AIR_X1 = 640;
const AIR_Y = 84;
const REAL_Y = 132;

const PLOT = { x0: 116, x1: 640, y0: 176, y1: 278 };
const SUCC_MIN = 0.2;
const SUCC_MAX = 1.0;

function succ(r: number): number {
  return 0.3 + 0.58 * r * Math.exp(-Math.pow((r - 0.62) / 0.42, 2));
}

function airStroke(y: number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  const n = 36;
  for (let i = 0; i <= n; i++) {
    const rel = i / n;
    pts.push({
      x: AIR_X0 + rel * (AIR_X1 - AIR_X0),
      y: y + Math.sin(rel * Math.PI * 2) * 6,
    });
  }
  return pts;
}

export const M71ImaginedRatio: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ r: 0.3 });
  const rafRef = useRef<number | null>(null);
  const [r, setR] = useState(0.3);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const curvePts: { x: number; y: number }[] = [];
    for (let i = 0; i <= 60; i++) {
      const rv = i / 60;
      curvePts.push({
        x: PLOT.x0 + rv * (PLOT.x1 - PLOT.x0),
        y: PLOT.y1 - ((succ(rv) - SUCC_MIN) / (SUCC_MAX - SUCC_MIN)) * (PLOT.y1 - PLOT.y0),
      });
    }

    const render = () => {
      const s = stateRef.current;
      const rv = s.r;
      const count = Math.round(2 + 10 * rv);

      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 10 });
      drawLegend(ctx, 28, 30, [
        { color: PALETTE.blue, text: '想象' },
        { color: '#2f3e2e', text: '真实' },
        { color: PALETTE.orange, text: '成功率' },
      ]);

      // 上区：空中轨迹数量 ∝ r
      drawSceneLabel(ctx, 112, 60, `空中轨迹 ×${count}`, { size: 12, align: 'right' });
      const span = Math.min(46, count * 4);
      for (let i = 0; i < count; i++) {
        const off = count === 1 ? 0 : (i / (count - 1) - 0.5) * span;
        drawGhostPath(ctx, airStroke(AIR_Y + off), {
          color: PALETTE.blue,
          width: 1.8,
          alpha: 0.34,
          dash: [5, 4],
        });
      }
      // 一条实纸墨迹
      drawSceneLabel(ctx, 112, REAL_Y + 8, '实纸墨迹', { size: 12, align: 'right', color: '#2f3e2e' });
      drawInkPath(ctx, airStroke(REAL_Y), { color: '#2f3e2e', width: 4 });

      // 下区：成功率曲线
      drawSceneLabel(ctx, PLOT.x0 - 8, PLOT.y0 - 10, '成功率↑', { size: 12, align: 'right' });
      ctx.save();
      ctx.strokeStyle = PALETTE.muted;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(PLOT.x0, PLOT.y1 + 0.5);
      ctx.lineTo(PLOT.x1, PLOT.y1 + 0.5);
      ctx.stroke();
      ctx.restore();
      // 曲线
      ctx.save();
      ctx.strokeStyle = PALETTE.muted;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(curvePts[0].x, curvePts[0].y);
      for (const p of curvePts) ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.restore();
      // r 轴刻度
      for (const rv2 of [0, 0.5, 1]) {
        const x = PLOT.x0 + rv2 * (PLOT.x1 - PLOT.x0);
        drawSceneLabel(ctx, x, PLOT.y1 + 14, `r=${rv2}`, { size: 11, align: 'center' });
      }
      // 当前点：橙标 + 竖虚线 + 数值
      const cx = PLOT.x0 + rv * (PLOT.x1 - PLOT.x0);
      const cy = PLOT.y1 - ((succ(rv) - SUCC_MIN) / (SUCC_MAX - SUCC_MIN)) * (PLOT.y1 - PLOT.y0);
      ctx.save();
      ctx.strokeStyle = PALETTE.orange;
      ctx.globalAlpha = 0.5;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, PLOT.y1);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = PALETTE.orange;
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      drawSceneLabel(ctx, cx, cy - 16, succ(rv).toFixed(2), {
        size: 12,
        align: 'center',
        color: PALETTE.orange,
      });

      // 左下：想象转移三徽标
      const badges = ['ô', 'r̂', 'd̂'];
      const bx = 58;
      for (let i = 0; i < 3; i++) {
        const by = 210 + i * 28;
        ctx.save();
        ctx.strokeStyle = PALETTE.purple;
        ctx.fillStyle = 'rgba(124, 58, 237, 0.08)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(bx, by, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = PALETTE.purple;
        ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badges[i], bx, by + 0.5);
        ctx.restore();
      }
      drawSceneLabel(ctx, bx, 262, '想象转移', { size: 11, align: 'center', color: PALETTE.purple });

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    stateRef.current.r = v;
    setR(v);
  };

  const fb =
    r < 0.25
      ? { text: '几乎全用真纸：安全，但样本少、进步慢，还费纸。', cls: '' }
      : r <= 0.75
      ? { text: '适量想象放大：便宜样本换来真进步。', cls: 'good' }
      : { text: '过度依赖想象：世界模型自己的偏差被练进了策略。', cls: 'bad' };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          想象占比 r <span className="val">{r.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(r * 100)}
          onChange={onChange}
          aria-label="想象数据占比"
        />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default M71ImaginedRatio;
