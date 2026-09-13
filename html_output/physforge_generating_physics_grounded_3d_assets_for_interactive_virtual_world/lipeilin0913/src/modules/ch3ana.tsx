import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, dist, easeInOutQuad, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §3 analogy (560x140): 先画图纸，再动锯子。左侧一张图纸：铅笔点沿柜子线稿
// （柜体轮廓 / 柜门 / 抽屉）逐段描画，随后尺寸标注线出现；中间箭头脉冲（照图施工）；
// 右侧对应的实木色柜子从左到右擦除式成形。循环无瞬移，无悬浮色块。
const W = 560;
const H = 140;
const T = 3600; // full loop (ms)

type Seg = { x1: number; y1: number; x2: number; y2: number; len: number; ink: boolean };

export const Ch3Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    // blueprint line-art: cabinet outline, door, drawer — traced progressively
    const traceRects = [
      [66, 36, 120, 64], // 柜体外轮廓
      [74, 44, 104, 32], // 柜门
      [74, 82, 104, 12], // 抽屉
    ];
    // continuous path: inked segments + dry hops, so the pencil never teleports
    const segs: Seg[] = [];
    traceRects.forEach((r, ri) => {
      const [x, y, w, h] = r;
      const corners = [
        [x + w, y],
        [x + w, y + h],
        [x, y + h],
        [x, y],
      ];
      let px = x;
      let py = y;
      for (const [tx, ty] of corners) {
        segs.push({ x1: px, y1: py, x2: tx, y2: ty, len: dist(px, py, tx, ty), ink: true });
        px = tx;
        py = ty;
      }
      if (ri < traceRects.length - 1) {
        const nx = traceRects[ri + 1][0];
        const ny = traceRects[ri + 1][1];
        segs.push({ x1: px, y1: py, x2: nx, y2: ny, len: dist(px, py, nx, ny), ink: false });
      }
    });
    // final dry hop to the drawer handle, then ink it
    segs.push({ x1: 74, y1: 82, x2: 118, y2: 88, len: dist(74, 82, 118, 88), ink: false });
    segs.push({ x1: 118, y1: 88, x2: 134, y2: 88, len: 16, ink: true });
    const total = segs.reduce((a, s) => a + s.len, 0);

    const render = (time: number) => {
      const t = (time / T) % 1;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, 116, W, 6);

      // phase timing: trace 0–0.5 → arrow boost 0.5–0.65 → cabinet wipes in 0.55–0.8
      // → hold → fade 0.88–0.98 (wrap is invisible)
      const drawT = easeInOutQuad(clamp(t / 0.5, 0, 1));
      const fade = 1 - clamp((t - 0.88) / 0.1, 0, 1);

      // ---- left: blueprint sheet ----
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      ctx.fillRect(36, 16, 180, 100);
      ctx.strokeRect(36, 16, 180, 100);

      // progressive line-art trace
      let budget = drawT * total;
      let tipX = traceRects[0][0];
      let tipY = traceRects[0][1];
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 1.8;
      ctx.globalAlpha = fade;
      for (const s of segs) {
        const d = Math.min(Math.max(budget, 0), s.len);
        if (d > 0) {
          const k = d / s.len;
          const ex = lerp(s.x1, s.x2, k);
          const ey = lerp(s.y1, s.y2, k);
          if (s.ink) {
            ctx.beginPath();
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(ex, ey);
            ctx.stroke();
          }
          tipX = ex;
          tipY = ey;
        }
        budget -= s.len;
        if (budget < 0) break;
      }
      // knob dot appears once the door outline is mostly done
      if (drawT > 0.55) {
        ctx.beginPath();
        ctx.arc(166, 60, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#27446e';
        ctx.fill();
      }
      // dimension lines fade in after the trace completes
      const dimA = clamp((t - 0.5) / 0.1, 0, 1) * fade;
      if (dimA > 0.01) {
        ctx.globalAlpha = dimA;
        ctx.strokeStyle = '#68778f';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(66, 28);
        ctx.lineTo(186, 28); // horizontal width dimension
        ctx.moveTo(66, 24);
        ctx.lineTo(66, 32);
        ctx.moveTo(186, 24);
        ctx.lineTo(186, 32);
        ctx.moveTo(58, 36);
        ctx.lineTo(58, 100); // vertical height dimension
        ctx.moveTo(54, 36);
        ctx.lineTo(62, 36);
        ctx.moveTo(54, 100);
        ctx.lineTo(62, 100);
        ctx.stroke();
        ctx.fillStyle = '#68778f';
        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.fillText('120', 118, 26);
      }
      ctx.globalAlpha = 1;

      // pencil tip rides the trace, fades out once drawing is done
      const tipA = clamp(t / 0.04, 0, 1) * (1 - clamp((t - 0.5) / 0.06, 0, 1));
      if (tipA > 0.01) {
        ctx.fillStyle = `rgba(240,126,71,${tipA})`;
        ctx.beginPath();
        ctx.arc(tipX, tipY, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(33,50,74,${tipA})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX + 9, tipY - 9);
        ctx.stroke();
      }
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('物理蓝图（图纸）', 78, 130);

      // ---- middle: pulsing arrow, boosted while the cabinet forms ----
      const boost = clamp((t - 0.5) / 0.08, 0, 1) * (1 - clamp((t - 0.72) / 0.08, 0, 1));
      const pulse = 0.5 + 0.5 * Math.sin(time / 240);
      const ax = 246;
      const ay = 66;
      const tipX2 = ax + 44 + 5 * pulse + 4 * boost;
      ctx.strokeStyle = `rgba(34,141,92,${0.5 + 0.5 * pulse})`;
      ctx.fillStyle = `rgba(34,141,92,${0.5 + 0.5 * pulse})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(tipX2 - 12, ay);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tipX2 - 12, ay - 8);
      ctx.lineTo(tipX2, ay);
      ctx.lineTo(tipX2 - 12, ay + 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#228d5c';
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.fillText('照图施工', 252, 98);

      // ---- right: real wooden cabinet, wiped in left→right (照图施工的结果) ----
      const wipe = easeOutCubic(clamp((t - 0.55) / 0.25, 0, 1));
      if (wipe > 0.001) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(360, 20, 132 * wipe, 96);
        ctx.clip();
        ctx.globalAlpha = fade;
        ctx.fillStyle = '#92400e'; // 柜体
        ctx.fillRect(366, 36, 120, 64);
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.fillRect(366, 36, 120, 7);
        ctx.fillStyle = '#a0522d'; // 柜门
        ctx.fillRect(374, 44, 104, 32);
        ctx.fillStyle = '#7a3509'; // 抽屉
        ctx.fillRect(374, 82, 104, 12);
        ctx.fillStyle = '#d7deea'; // 把手
        ctx.beginPath();
        ctx.arc(466, 60, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(418, 86, 16, 4);
        ctx.strokeStyle = '#5c2d0c';
        ctx.lineWidth = 2;
        ctx.strokeRect(366, 36, 120, 64);
        ctx.globalAlpha = 1;
        ctx.restore();
      }
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('实物柜', 408, 130);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (time: number) => {
      render(time);
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

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ch3Ana;
