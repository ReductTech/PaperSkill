import React, { useEffect, useRef } from 'react';
import { setupCanvas, startCanvasLoop, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ana 5: rider waits at a fork while two routes (direct greenway vs scenic road)
// alternate their glow; both lead to the same flag.
const W = 560;
const H = 140;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f',
};

export const Ana5: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (time: number) => {
      const t = (time / 3000) % 1;
      // continuous 0..1 blend between the two routes instead of a hard flip
      const w = (Math.sin(t * Math.PI * 2) + 1) / 2;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light; ctx.fillRect(0, 104, W, 36);
      // fork point
      const fx = 120; const fy = 104;
      // upper route: direct greenway (blue)
      ctx.strokeStyle = `rgba(39,68,110,${lerp(0.35, 1, w)})`;
      ctx.lineWidth = lerp(3, 6, w);
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo(300, 60, 500, 72); ctx.stroke();
      // lower route: scenic road (green) with a red checkpoint booth
      ctx.strokeStyle = `rgba(34,141,92,${lerp(1, 0.35, w)})`;
      ctx.lineWidth = lerp(6, 3, w);
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo(300, 140, 500, 100); ctx.stroke();
      ctx.fillStyle = C.red; ctx.fillRect(330, 96, 22, 22);
      ctx.fillStyle = '#fff'; ctx.font = '9px sans-serif'; ctx.fillText('检', 337, 111);
      // shared finish flag
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(505, 40); ctx.lineTo(505, 108); ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.beginPath(); ctx.moveTo(505, 40); ctx.lineTo(530, 48); ctx.lineTo(505, 56); ctx.fill();
      // signpost at the fork — one labeled board per route
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, 58); ctx.stroke();
      const boards: Array<[number, string, string]> = [
        [42, '直达', C.blue],
        [61, '景观', C.green],
      ];
      ctx.font = '10px sans-serif';
      for (const [by, label, color] of boards) {
        ctx.fillStyle = color;
        ctx.fillRect(fx + 2, by, 42, 15);
        ctx.fillStyle = '#fff';
        ctx.fillText(label, fx + 12, by + 11);
      }
      // waiting rider, gently bobbing; gaze follows the glowing route
      const bob = Math.sin(time / 300) * 1.5;
      const px = 70; const py = 104 + bob;
      ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px - 14, py, 11, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(px + 16, py, 11, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px - 14, py); ctx.lineTo(px - 1, py - 13); ctx.lineTo(px + 16, py); ctx.lineTo(px - 14, py);
      ctx.moveTo(px - 1, py - 13); ctx.lineTo(px + 4, py - 17);
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.beginPath(); ctx.arc(px + 2, py - 24 - w * 2, 5.5, 0, Math.PI * 2); ctx.fill();
    };

    return startCanvasLoop(canvas, render);
  }, []);

  return <canvas id="cv-ana-5" ref={canvasRef} width={W} height={H} />;
};

export default Ana5;
