import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §8 analogy (560x140): two-station workshop line matching the chapter's
// "两阶段" naming — left bench "粗坯 · VLM 规划" (jagged saw-cut blank inside a
// dashed planned outline), right bench "精雕 · 扩散实现" (finished cabinet).
// A purple KVI spark rides the green arrow from station 1 into station 2:
// on arrival it is absorbed (injected), the cabinet pulses purple and sparkles.
const W = 560;
const H = 140;
const T = 4000; // full loop (ms)

export const Ch8Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const S1X = 128; // station 1 center
    const S2X = 432; // station 2 center
    const BENCH_Y = 92; // bench top
    const FLOW_Y = 60; // spark flight line
    const X0 = 178; // spark start: station-1 bench edge
    const X1 = 394; // spark end: cabinet's left face

    const drawBench = (cx: number) => {
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(cx - 50, BENCH_Y, 100, 10);
      ctx.fillStyle = '#76906a';
      ctx.fillRect(cx - 50, BENCH_Y + 10, 100, 3);
      ctx.fillRect(cx - 40, BENCH_Y + 13, 6, 12);
      ctx.fillRect(cx + 34, BENCH_Y + 13, 6, 12);
    };

    const drawBlank = () => {
      // dashed outline = the planned shape from VLM 规划
      ctx.strokeStyle = 'rgba(39,68,110,0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(S1X - 30, 38, 60, 54);
      ctx.setLineDash([]);
      // rough jagged blank, not yet matching the plan
      ctx.fillStyle = '#a0522d';
      ctx.beginPath();
      ctx.moveTo(S1X - 28, BENCH_Y);
      ctx.lineTo(S1X - 31, 56);
      ctx.lineTo(S1X - 22, 46);
      ctx.lineTo(S1X + 18, 42);
      ctx.lineTo(S1X + 27, 52);
      ctx.lineTo(S1X + 29, BENCH_Y);
      ctx.closePath();
      ctx.fill();
      // saw scratches on the blank's face
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(S1X - 20, 62);
      ctx.lineTo(S1X - 4, 53);
      ctx.moveTo(S1X - 2, 72);
      ctx.lineTo(S1X + 16, 61);
      ctx.moveTo(S1X - 18, 80);
      ctx.lineTo(S1X + 2, 71);
      ctx.stroke();
    };

    const drawCabinet = () => {
      // finished cabinet (棕色木色)
      ctx.fillStyle = '#7a3509';
      ctx.fillRect(S2X - 30, 38, 60, 54);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(S2X - 24, 44, 48, 42);
      // double-door seam + knobs
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(S2X, 44);
      ctx.lineTo(S2X, 86);
      ctx.stroke();
      ctx.fillStyle = '#d7deea';
      ctx.beginPath();
      ctx.arc(S2X - 6, 66, 3, 0, Math.PI * 2);
      ctx.arc(S2X + 6, 66, 3, 0, Math.PI * 2);
      ctx.fill();
      // polished top highlight
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(S2X - 30, 38, 60, 4);
    };

    // spark position along the flight arc (u: 0 → 1)
    const sparkPos = (u: number) => ({
      x: lerp(X0, X1, u),
      y: FLOW_Y - Math.sin(u * Math.PI) * 10,
    });

    const drawSpark = (x: number, y: number, alpha: number) => {
      if (alpha <= 0) return;
      ctx.fillStyle = `rgba(124,58,237,${0.16 * alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(124,58,237,${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    };

    const render = (time: number) => {
      const t = (time / T) % 1;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, 116, W, 6);

      // green arrow belt between the stations (绿色 = PhysForge 的正确流向)
      ctx.strokeStyle = '#228d5c';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(196, FLOW_Y);
      ctx.lineTo(346, FLOW_Y);
      ctx.stroke();
      ctx.fillStyle = '#228d5c';
      ctx.beginPath();
      ctx.moveTo(346, FLOW_Y - 8);
      ctx.lineTo(346, FLOW_Y + 8);
      ctx.lineTo(366, FLOW_Y);
      ctx.closePath();
      ctx.fill();
      ctx.font = 'bold 11px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#7c3aed';
      ctx.fillText('KVI 注入', 281, 40);

      drawBench(S1X);
      drawBench(S2X);
      drawBlank();
      drawCabinet();

      // arrival glow: purple halo + expanding ring + green sparkles
      let g = 0;
      if (t >= 0.52 && t < 0.62) g = easeOutCubic((t - 0.52) / 0.1);
      else if (t >= 0.62 && t < 0.8) g = 1;
      else if (t >= 0.8 && t < 0.94) g = 1 - easeInOutQuad((t - 0.8) / 0.14);
      if (g > 0) {
        ctx.strokeStyle = `rgba(124,58,237,${0.55 * g})`;
        ctx.lineWidth = 5;
        ctx.strokeRect(S2X - 36, 32, 72, 66);
        // one expanding ring per arrival
        const rp = clamp((t - 0.52) / 0.3, 0, 1);
        if (rp > 0 && rp < 1) {
          ctx.strokeStyle = `rgba(124,58,237,${(1 - rp) * 0.6 * g})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(S2X, 65, lerp(8, 54, easeOutCubic(rp)), 0, Math.PI * 2);
          ctx.stroke();
        }
        // sparkle crosses twinkling around the finished cabinet
        const pts = [
          [S2X - 42, 40],
          [S2X + 40, 50],
          [S2X - 38, 86],
          [S2X + 42, 88],
        ];
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 2;
        pts.forEach(([px, py], i) => {
          const a = Math.max(0, Math.sin(time / 140 + i * 1.9)) * g;
          if (a <= 0) return;
          ctx.save();
          ctx.globalAlpha = a;
          ctx.beginPath();
          ctx.moveTo(px - 4, py);
          ctx.lineTo(px + 4, py);
          ctx.moveTo(px, py - 4);
          ctx.lineTo(px, py + 4);
          ctx.stroke();
          ctx.restore();
        });
      }

      // spark: fade in at station 1 → fly the arrow → absorbed into the cabinet
      let sa = 0;
      let sx = X0;
      let sy = FLOW_Y;
      if (t < 0.12) {
        sa = easeOutCubic(t / 0.12);
      } else if (t < 0.52) {
        const u = easeInOutQuad((t - 0.12) / 0.4);
        const p = sparkPos(u);
        sx = p.x;
        sy = p.y;
        sa = 1;
        // fading trail behind the flying spark
        const tr1 = sparkPos(Math.max(0, u - 0.07));
        const tr2 = sparkPos(Math.max(0, u - 0.14));
        drawSpark(tr1.x, tr1.y, 0.35);
        drawSpark(tr2.x, tr2.y, 0.18);
      } else if (t < 0.72) {
        sx = X1;
        sa = 1 - easeInOutQuad((t - 0.52) / 0.2);
      }
      drawSpark(sx, sy, sa);

      // station labels (naming follows the chapter text)
      ctx.font = 'bold 12px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#3c4a63';
      ctx.fillText('粗坯 · VLM 规划', S1X, 132);
      ctx.fillText('精雕 · 扩散实现', S2X, 132);
      ctx.textAlign = 'left';

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

export default Ch8Ana;
