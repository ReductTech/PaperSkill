import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244, H = 130;
const FONT = '"Segoe UI", "PingFang SC", sans-serif';
const BG = '#f5f8f0', BLUE = '#27446e', RED = '#c43f52', ORANGE = '#d97706';
const INK = '#21324a', MUT = '#68778f', LINE = '#d7deea', DIM = '#c7cfda';

// 第 4 章：传统方法 —— 旋转后空间里挑 Key：窗口极小 → 关键 Key 被误删 → 长推理断链。
export const Ana3: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      const cycle = t % 6; // 三段各 2s
      const phase = cycle < 2 ? 0 : cycle < 4 ? 1 : 2;

      // 一排 Key：最左是关键 Key（长程依赖），落在窗外
      const keys = ['K1', 'K2', 'K3', 'K4', 'K5'];
      const kx = (i: number) => 14 + i * 46;
      keys.forEach((k, i) => {
        const x = kx(i);
        const isKey = i === 0;
        const removed = phase >= 1 && isKey;
        ctx.globalAlpha = removed ? 0.3 : 1;
        ctx.fillStyle = removed ? '#f1f3f6' : isKey ? '#fdf6ec' : '#ffffff';
        ctx.strokeStyle = isKey ? (removed ? RED : ORANGE) : LINE;
        ctx.lineWidth = isKey ? 1.5 : 1;
        ctx.beginPath();
        const cw = 38, chh = 20, cy = 96, r = 6;
        ctx.moveTo(x - cw / 2 + r, cy);
        ctx.lineTo(x + cw / 2 - r, cy);
        ctx.arcTo(x + cw / 2, cy, x + cw / 2, cy + r, r);
        ctx.lineTo(x + cw / 2, cy + chh - r);
        ctx.arcTo(x + cw / 2, cy + chh, x + cw / 2 - r, cy + chh, r);
        ctx.lineTo(x - cw / 2 + r, cy + chh);
        ctx.arcTo(x - cw / 2, cy + chh, x - cw / 2, cy + chh - r, r);
        ctx.lineTo(x - cw / 2, cy + r);
        ctx.arcTo(x - cw / 2, cy, x - cw / 2 + r, cy, r);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = removed ? '#8a93a6' : isKey ? '#7c4a03' : INK;
        ctx.font = '11px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText(k, x, cy + 14);
        if (isKey) {
          ctx.fillStyle = ORANGE;
          ctx.font = '9px ' + FONT;
          ctx.fillText('关键(长程)', x, cy - 4);
        }
        if (removed) {
          ctx.strokeStyle = RED;
          ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(x - 6, cy - 24); ctx.lineTo(x + 6, cy - 12); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x + 6, cy - 24); ctx.lineTo(x - 6, cy - 12); ctx.stroke();
        }
      });
      ctx.textAlign = 'left';

      // 上排查询箭头：左边散开（方向不对），右边最近 3 个一致并指向 Key
      const qCount = 7;
      for (let i = 0; i < qCount; i++) {
        const recent = i >= qCount - 3;
        const x = 14 + i * 31;
        const ang = recent ? 0 : (i - 2) * 0.22;
        const x2 = x + Math.sin(ang) * 20;
        const y2 = 44 + Math.cos(ang) * 12;
        ctx.strokeStyle = recent ? BLUE : DIM;
        ctx.lineWidth = recent ? 2 : 1.2;
        ctx.beginPath(); ctx.moveTo(x, 30); ctx.lineTo(x2, y2); ctx.stroke();
        if (recent) {
          ctx.fillStyle = BLUE;
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2 - 3, y2 - 6);
          ctx.lineTo(x2 + 3, y2 - 6);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.fillStyle = MUT;
      ctx.font = '10px ' + FONT;
      ctx.fillText('观察窗口（最近 3 个）', 132, 22);

      // 阶段 3：未来查询指向空位 → 断链
      if (phase === 2) {
        const x = kx(0);
        ctx.strokeStyle = ORANGE;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 2]);
        ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, 90); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = RED;
        ctx.font = 'bold 14px ' + FONT;
        ctx.fillText('✗', x + 12, 34);
      }

      // 底部说明带
      ctx.fillStyle = phase === 0 ? MUT : phase === 1 ? RED : RED;
      ctx.font = '11px ' + FONT;
      ctx.fillText(
        phase === 0 ? '旋转后只能看清最近几个查询' : phase === 1 ? '关键 Key 落在窗外，被误删' : '未来查询扑空，长推理断链',
        10, H - 8
      );
    };

    const tick = (ts: number) => {
      render(ts / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ana3;