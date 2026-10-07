import React, { useEffect, useRef } from 'react';
import { setupCanvas, startCanvasLoop, lerpColor, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ana 9: wrench tightens the smallest screw on the frame — it goes from loose
// (red) to tight (green) with a check mark. The tiniest part decides safety.
const W = 560;
const H = 140;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f',
};

export const Ana9: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (time: number) => {
      const t = (time / 3200) % 1;
      // tighten (0→0.5) → hold tight (0.5→0.75) → loosen again (0.75→1):
      // the loop never snaps; the demo reads as tighten-check-service-repeat.
      const tight =
        t < 0.5 ? easeInOutQuad(t / 0.5)
        : t < 0.75 ? 1
        : 1 - easeInOutQuad((t - 0.75) / 0.25);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light; ctx.fillRect(0, 112, W, 28);
      // bike frame (simplified) — wheels rest ON the ground band
      ctx.strokeStyle = C.blue; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(140, 86); ctx.lineTo(210, 44); ctx.lineTo(340, 86); ctx.lineTo(140, 86);
      ctx.moveTo(210, 44); ctx.lineTo(300, 44);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(140, 86, 26, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(340, 86, 26, 0, Math.PI * 2); ctx.stroke();
      // the tiny screw at the frame joint
      const sx = 210; const sy = 44;
      const wig = Math.sin(time / 110) * 0.22 * (1 - tight);
      const screwColor = lerpColor(C.red, C.green, tight);
      ctx.fillStyle = screwColor;
      ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
      // slot turns as the screw tightens and wiggles with the wrench
      const slotA = tight * Math.PI * 3 + wig;
      ctx.beginPath(); ctx.moveTo(sx - 4 * Math.cos(slotA), sy - 4 * Math.sin(slotA)); ctx.lineTo(sx + 4 * Math.cos(slotA), sy + 4 * Math.sin(slotA)); ctx.stroke();
      // open-end wrench gripping the screw: jaw ring wraps it, gap faces
      // outward along the handle; the whole wrench pivots with the wiggle.
      // Rests away only while fully tight.
      const reach = tight >= 1 ? 0 : 1;
      const wAng = -Math.PI / 6 + wig;
      if (reach > 0) {
        const jr = 9;
        const wx = sx + jr * Math.cos(wAng);
        const wy = sy + jr * Math.sin(wAng);
        ctx.strokeStyle = C.muted; ctx.lineCap = 'round';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(wx + 8 * Math.cos(wAng), wy + 8 * Math.sin(wAng));
        ctx.lineTo(wx + 46 * Math.cos(wAng), wy + 46 * Math.sin(wAng));
        ctx.stroke();
        ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.arc(wx, wy, jr, wAng + 0.8, wAng - 0.8 + Math.PI * 2); ctx.stroke();
        ctx.lineCap = 'butt';
      }
      // check mark pops in when tight, fades out as it loosens
      if (tight > 0.85) {
        ctx.save();
        ctx.globalAlpha = (tight - 0.85) / 0.15;
        ctx.strokeStyle = C.green; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(sx - 14, sy - 18); ctx.lineTo(sx - 8, sy - 10); ctx.lineTo(sx + 4, sy - 24); ctx.stroke();
        ctx.restore();
      } else if (tight < 0.5) {
        ctx.fillStyle = C.red; ctx.font = '11px sans-serif';
        ctx.fillText('松', sx - 26, sy + 4);
      }
    };

    return startCanvasLoop(canvas, render);
  }, []);

  return <canvas id="cv-ana-9" ref={canvasRef} width={W} height={H} />;
};

export default Ana9;
