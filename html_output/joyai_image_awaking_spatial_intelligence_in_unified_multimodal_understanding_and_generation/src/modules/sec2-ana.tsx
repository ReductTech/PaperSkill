import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;
const BG = '#fffaf1';
const INK = '#222222';
const PINK = '#ff3366';
const BLUE = '#33ccff';
const YELLOW = '#ffcc00';

type Point = [number, number];
const visibleSketch: Point[] = [[63, 75], [74, 61], [86, 75], [86, 84]];
const hiddenSketch: Point[] = [[86, 84], [98, 84], [98, 98], [63, 98], [63, 75]];

export const Sec2Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const drawPartial = (points: Point[], progress: number, color: string) => {
      const scaled = Math.max(0, Math.min(1, progress)) * (points.length - 1);
      const whole = Math.floor(scaled); const frac = scaled - whole;
      ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i <= whole; i++) ctx.lineTo(points[i][0], points[i][1]);
      if (whole < points.length - 1) {
        const a = points[whole], b = points[whole + 1];
        ctx.lineTo(a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac);
      }
      ctx.stroke();
      const a = points[Math.min(whole, points.length - 2)], b = points[Math.min(whole + 1, points.length - 1)];
      return { x: a[0] + (b[0] - a[0]) * frac, y: a[1] + (b[1] - a[1]) * frac };
    };

    const drawTool = (x: number, y: number) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(-0.72);
      ctx.fillStyle = YELLOW; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(-2, -5, 35, 10, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f1c49c'; ctx.beginPath(); ctx.moveTo(-2, -5); ctx.lineTo(-12, 0); ctx.lineTo(-2, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-7, -2); ctx.lineTo(-7, 2); ctx.closePath(); ctx.fill();
      ctx.restore();
    };

    const render = (t: number) => {
      const p = (t / 4200) % 1;
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect(13, 9, 218, 104, 13); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff4c7'; ctx.fillRect(18, 14, 208, 16);
      ctx.fillStyle = INK; ctx.font = '700 10px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('同一张空间草图', 25, 25);

      // 固定参照物：桌子。铅笔只修正对象相对桌子的位置。
      ctx.fillStyle = '#e9ddff'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(105, 57, 42, 24, 5); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(111, 81); ctx.lineTo(108, 97); ctx.moveTo(141, 81); ctx.lineTo(144, 97); ctx.stroke();
      ctx.fillStyle = '#625d67'; ctx.font = '600 9px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('桌子', 126, 51);

      let tool = { x: 63, y: 75 }; let label = '视角 A：先画可见部分';
      if (p < .42) {
        tool = drawPartial(visibleSketch, p / .42, PINK);
      } else if (p < .60) {
        drawPartial(visibleSketch, 1, PINK);
        const vp = (p - .42) / .18;
        tool = { x: 86, y: 84 };
        ctx.strokeStyle = BLUE; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.arc(86, 83, 20 + vp * 6, -.7, .35); ctx.stroke(); ctx.setLineDash([]);
        label = '换到视角 B：看见遮挡后方';
      } else {
        drawPartial(visibleSketch, 1, PINK);
        tool = drawPartial(hiddenSketch, (p - .60) / .40, BLUE);
        label = '补画：把缺失关系补完整';
      }
      drawTool(tool.x, tool.y);

      ctx.fillStyle = p < .42 ? PINK : '#167da1';
      ctx.font = '800 10px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label, W / 2, 124);
    };

    const tick = () => { render(performance.now()); canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-label="铅笔先画当前视角可见部分，换视角后补上被遮挡部分" />;
};

export default Sec2Ana;
