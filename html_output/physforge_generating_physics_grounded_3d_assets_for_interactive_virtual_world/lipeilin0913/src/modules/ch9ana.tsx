import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad, easeOutCubic, easeOutBounce } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §9 analogy (560x140): hardware pieces ride the top rail and drop into the
// matching labeled bin — 铰链·旋转 / 滑轨·棱柱 / 转轮·continuous / 固定·fixed
// (four joint types per the paper: revolute / prismatic / continuous / fixed).
// Pieces rest inside the bins; everything fades out together at
// the wrap so the loop restarts without a pop. Nothing floats unexplained.
const W = 560;
const H = 140;
const T = 4800; // full loop (ms)

export const Ch9Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const RAIL_Y = 20; // overhead feed rail
    const BINS = [110, 225, 340, 455]; // bin centers（四类关节）
    const LABELS = ['铰链 · 旋转', '滑轨 · 棱柱', '转轮 · 连续', '固定 · fixed'];
    const BIN_W = 78;
    const BIN_TOP = 50;
    const BIN_BOT = 96;
    const REST_Y = 84; // resting spot on the bin floor

    // steel hardware piece: 0 = hinge, 1 = slide rail, 2 = wheel（连续旋转）, 3 = fixing bracket
    const drawItem = (x: number, y: number, shape: number, alpha: number) => {
      if (alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#b9c4d4';
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 1.5;
      if (shape === 0) {
        // hinge: two leaves + center pin
        ctx.fillRect(x - 14, y - 7, 12, 14);
        ctx.strokeRect(x - 14, y - 7, 12, 14);
        ctx.fillRect(x + 2, y - 7, 12, 14);
        ctx.strokeRect(x + 2, y - 7, 12, 14);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (shape === 1) {
        // slide rail: outer channel + inner runner + ball dots
        ctx.fillRect(x - 16, y - 5, 32, 10);
        ctx.strokeRect(x - 16, y - 5, 32, 10);
        ctx.fillStyle = '#e6ecf4';
        ctx.fillRect(x - 12, y - 1.5, 24, 3);
        ctx.fillStyle = '#27446e';
        for (const dx of [-8, 0, 8]) {
          ctx.beginPath();
          ctx.arc(x + dx, y, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (shape === 2) {
        // wheel: outer ring + hub + spokes —— 连续旋转关节（无角度上限）
        ctx.beginPath();
        ctx.arc(x, y, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 6.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#27446e';
        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, Math.PI * 2);
        ctx.fill();
        for (const a of [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2]) {
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(a) * 3, y + Math.sin(a) * 3);
          ctx.lineTo(x + Math.cos(a) * 10, y + Math.sin(a) * 10);
          ctx.stroke();
        }
        // 环绕小箭头：示意不限角度连续转
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(x, y, 15, -0.4, 1.5);
        ctx.stroke();
        const ha = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(ha) * 15, y + Math.sin(ha) * 15);
        ctx.lineTo(x + Math.cos(ha - 0.35) * 19, y + Math.sin(ha - 0.35) * 19);
        ctx.stroke();
      } else {
        // fixing bracket: L profile + two mounting holes
        ctx.beginPath();
        ctx.moveTo(x - 10, y + 9);
        ctx.lineTo(x - 10, y - 9);
        ctx.lineTo(x - 2, y - 9);
        ctx.lineTo(x - 2, y - 1);
        ctx.lineTo(x + 10, y - 1);
        ctx.lineTo(x + 10, y + 9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f5f8f0';
        ctx.beginPath();
        ctx.arc(x - 6, y - 5, 1.4, 0, Math.PI * 2);
        ctx.arc(x + 4, y + 4, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const render = (time: number) => {
      const t = (time / T) % 1;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, 116, W, 6);

      // feed hopper at the rail head
      ctx.fillStyle = '#b8c9a7';
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(22, 4);
      ctx.lineTo(54, 4);
      ctx.lineTo(47, RAIL_Y);
      ctx.lineTo(29, RAIL_Y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // overhead rail the pieces slide along
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(44, RAIL_Y);
      ctx.lineTo(542, RAIL_Y);
      ctx.stroke();

      // four labeled sorting bins (open-top boxes with front plaques)
      for (let i = 0; i < 4; i++) {
        const bx = BINS[i];
        ctx.fillStyle = '#e9f0e2';
        ctx.fillRect(bx - BIN_W / 2, BIN_TOP, BIN_W, BIN_BOT - BIN_TOP);
        ctx.fillStyle = '#76906a';
        ctx.fillRect(bx - BIN_W / 2, BIN_TOP, 4, BIN_BOT - BIN_TOP); // left wall
        ctx.fillRect(bx + BIN_W / 2 - 4, BIN_TOP, 4, BIN_BOT - BIN_TOP); // right wall
        ctx.fillRect(bx - BIN_W / 2, BIN_BOT - 4, BIN_W, 4); // floor
        // front plaque with the chapter's own label words
        ctx.fillStyle = '#27446e';
        ctx.fillRect(bx - BIN_W / 2, BIN_BOT + 2, BIN_W, 15);
        ctx.font = 'bold 11px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(LABELS[i], bx, BIN_BOT + 13);
        ctx.textAlign = 'left';
      }

      // end-of-cycle fade: everything in the bins fades out before restock,
      // so the loop wraps without a pop.
      const fade = t > 0.94 ? 1 - (t - 0.94) / 0.06 : 1;

      // each piece gets one quarter of the cycle: appear at hopper → slide the
      // rail → drop into its bin (bounce-settle) → rest inside the bin
      for (let i = 0; i < 4; i++) {
        const s = clamp(t * 4 - i, 0, 1);
        if (s <= 0) continue;
        const bx = BINS[i];
        if (s < 0.08) {
          drawItem(48, RAIL_Y - 8, i, easeOutCubic(s / 0.08));
        } else if (s < 0.42) {
          const u = easeInOutQuad((s - 0.08) / 0.34);
          drawItem(lerp(48, bx, u), RAIL_Y - 8, i, 1);
        } else if (s < 0.68) {
          const v = (s - 0.42) / 0.26;
          drawItem(bx, lerp(RAIL_Y - 8, REST_Y, easeOutBounce(v)), i, 1);
        } else {
          drawItem(bx, REST_Y, i, fade);
        }
      }
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

export default Ch9Ana;
