import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero new-method side: 3/4-view cabinet, door swings open/closed on two visible
// green hinges (eased, with a dwell fully open), blueprint card on the right.
const W = 440;
const H = 200;

// 耄耋猫（cat4）透明帧序列：预载 public/cat4，来回播放成无缝循环
const CAT_SRCS = Array.from(
  { length: 16 },
  (_, i) => `${import.meta.env.BASE_URL}cat4/f${String(i).padStart(2, '0')}.png`
);
const catImgs: HTMLImageElement[] = CAT_SRCS.map((s) => {
  const im = new Image();
  im.src = s;
  return im;
});
const CAT_ORDER = [
  ...Array.from({ length: 16 }, (_, i) => i),
  ...Array.from({ length: 14 }, (_, i) => 14 - i),
];
// anchor = 猫右缘 ax、底边 ay（站在地面上）；返回 false 表示帧未载好
const drawCatAt = (
  ctx: CanvasRenderingContext2D,
  time: number,
  ax: number,
  ay: number,
  h: number
): boolean => {
  const im = catImgs[CAT_ORDER[Math.floor(time / 66) % CAT_ORDER.length]];
  if (!im.complete || im.naturalWidth === 0) return false;
  const w = (h * im.naturalWidth) / im.naturalHeight;
  ctx.drawImage(im, ax - w, ay - h, w, h);
  return true;
};

export const HeroNew: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const render = (time: number) => {
      const t = (time / 3600) % 1;
      // open (eased) → dwell fully open → close (eased) → dwell closed: a smooth
      // loop with zero velocity at every phase boundary, no teleport on wrap
      let open: number;
      if (t < 0.32) open = easeInOutQuad(t / 0.32);
      else if (t < 0.52) open = 1;
      else if (t < 0.84) open = 1 - easeInOutQuad((t - 0.52) / 0.32);
      else open = 0;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, 168, W, 8);
      ctx.fillStyle = '#76906a';
      ctx.fillRect(0, 176, W, 3);

      // blueprint sheet on the right (gentle bob, tiny amplitude)
      const bob = Math.sin(time / 700) * 2;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 1.5;
      ctx.fillRect(312, 40 + bob, 96, 64);
      ctx.strokeRect(312, 40 + bob, 96, 64);
      ctx.beginPath();
      ctx.moveTo(320, 52 + bob);
      ctx.lineTo(400, 52 + bob);
      ctx.moveTo(320, 64 + bob);
      ctx.lineTo(384, 64 + bob);
      ctx.moveTo(320, 76 + bob);
      ctx.lineTo(392, 76 + bob);
      ctx.stroke();
      ctx.fillStyle = '#27446e';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('物理蓝图', 332, 98 + bob);

      // cabinet, 3/4 front view: front face + top face + right side face
      const cx = 116;
      const cy = 64;
      const cw = 150;
      const ch = 104;
      const sk = 10; // oblique depth offset
      // top face (lighter) and right side face (darker) give the 3/4 read
      ctx.fillStyle = '#a0522d';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + sk, cy - sk);
      ctx.lineTo(cx + cw + sk, cy - sk);
      ctx.lineTo(cx + cw, cy);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#7a3509';
      ctx.beginPath();
      ctx.moveTo(cx + cw, cy);
      ctx.lineTo(cx + cw + sk, cy - sk);
      ctx.lineTo(cx + cw + sk, cy - sk + ch);
      ctx.lineTo(cx + cw, cy + ch);
      ctx.closePath();
      ctx.fill();
      // front face
      ctx.fillStyle = '#92400e';
      ctx.fillRect(cx, cy, cw, ch);

      // door opening: interior with a vertical depth gradient (back is darker)
      const DX = cx + 10;
      const DY = cy + 10;
      const DW = cw - 20;
      const DH = 54;
      const ig = ctx.createLinearGradient(DX, DY, DX, DY + DH);
      ig.addColorStop(0, '#3a2210');
      ig.addColorStop(1, '#5c3a1c');
      ctx.fillStyle = ig;
      ctx.fillRect(DX, DY, DW, DH);

      // door: pivots on its LEFT edge where the hinges sit; width foreshortens
      // with cos(angle) and the free edge lifts slightly (oblique depth), so the
      // swing reads as a true rotation around the hinge line — never a shear.
      const MAXD = 68;
      const rad = (open * MAXD * Math.PI) / 180;
      const wApp = Math.max(DW * Math.cos(rad), 3);
      const lift = 12 * Math.sin(rad);
      // cast shadow of the swinging door on the interior back wall
      if (open > 0.02) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(DX, DY, DW, DH);
        ctx.clip();
        ctx.fillStyle = `rgba(0,0,0,${0.3 * open})`;
        ctx.beginPath();
        ctx.moveTo(DX + 10, DY + 8);
        ctx.lineTo(DX + wApp + 10, DY - lift + 8);
        ctx.lineTo(DX + wApp + 10, DY + DH - lift + 8);
        ctx.lineTo(DX + 10, DY + DH + 8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#228d5c';
      ctx.beginPath();
      ctx.moveTo(DX, DY);
      ctx.lineTo(DX + wApp, DY - lift);
      ctx.lineTo(DX + wApp, DY + DH - lift);
      ctx.lineTo(DX, DY + DH);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // handle knob rides the door's free (right) edge
      ctx.fillStyle = '#d7deea';
      ctx.beginPath();
      ctx.arc(DX + wApp - 9, DY + DH / 2 - lift, 4, 0, Math.PI * 2);
      ctx.fill();

      // two visible hinge knuckles on the pivot edge (drawn over the door)
      ctx.fillStyle = '#228d5c';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      for (const hy of [DY + 8, DY + DH - 8]) {
        ctx.beginPath();
        ctx.arc(DX, hy, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      // faint sweep arc marking the door's opening envelope at the top hinge
      ctx.strokeStyle = 'rgba(34,141,92,0.45)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(DX, DY, 24, (-MAXD * Math.PI) / 180, 0);
      ctx.stroke();
      // hinge label in the empty space left of the cabinet
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('铰链', DX - 40, DY + DH / 2 + 4);
      // 耄耋猫站在台面上、与柜子等高（104）：门一开它就往前凑，像把门拨开
      drawCatAt(ctx, time, cx - 10 + open * 6, 168, ch);

      // drawer below the door: slides OUT toward the viewer (down-left along
      // the scene's depth axis) in sync with the same eased cycle; the pulled
      // box shows its top + right side faces, not just a flat front panel
      const dox = -open * 8;
      const doy = open * 10;
      const dfx = DX + dox;
      const dfy = DY + DH + 8 + doy;
      if (open > 0.01) {
        // dark opening left in the cabinet face
        ctx.fillStyle = '#4a2c12';
        ctx.fillRect(DX, DY + DH + 8, DW, 22);
        // top face (lighter) + right side face (darker): parallelograms
        // connecting the front panel back to the opening
        ctx.fillStyle = '#a0522d';
        ctx.beginPath();
        ctx.moveTo(dfx, dfy);
        ctx.lineTo(DX, DY + DH + 8);
        ctx.lineTo(DX + DW, DY + DH + 8);
        ctx.lineTo(dfx + DW, dfy);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#5c2d0c';
        ctx.beginPath();
        ctx.moveTo(dfx + DW, dfy);
        ctx.lineTo(DX + DW, DY + DH + 8);
        ctx.lineTo(DX + DW, DY + DH + 30);
        ctx.lineTo(dfx + DW, dfy + 22);
        ctx.closePath();
        ctx.fill();
      }
      // front panel + knob
      ctx.fillStyle = '#7a3509';
      ctx.fillRect(dfx, dfy, DW, 22);
      ctx.fillStyle = '#f07e47';
      ctx.beginPath();
      ctx.arc(dfx + DW - 14, dfy + 11, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // label
      ctx.fillStyle = '#228d5c';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('可开合 · 可仿真', cx + 22, cy - 18);
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

export default HeroNew;
