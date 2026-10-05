import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 比喻动画（§4）：同一个刀口，落在两种图上结果完全不同。
// 左：整图直接调细 → 一刀刀切下去，切出满地碎片（论文：>10 万个孤点）。
// 右：先分大区、再在大区内部切格位 → 切出来的是一格格整齐的议程。
// 全程只有一把刀在动：先扫左板，再移到右板。
const W = 1080;
const H = 280;
const C = {
  bg: '#f5f8f0', floor: '#b8c9a7', blue: '#27446e', purple: '#7c3aed',
  red: '#c43f52', border: '#d7deea', text: '#21324a', muted: '#68778f',
};

const LP = { x: 48, y: 46, w: 440, h: 158 };
const RP = { x: 592, y: 46, w: 440, h: 158 };
const LCUT = 7; // 左板的竖向切口数
const HCUT = 3; // 左板的横向切口数
const RC = 3; // 右板大区列数
const RR = 2; // 右板大区行数
const RIN = 4; // 每个大区内部的格位线数

const seeded = (i: number) => {
  const v = Math.sin(i * 91.7) * 43758.5453;
  return v - Math.floor(v);
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function chip(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, color: string) {
  ctx.font = '700 14px "Segoe UI", "Microsoft YaHei", sans-serif';
  const w = ctx.measureText(label).width + 20;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  roundRect(ctx, x, y, w, 28, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 10, y + 19);
  return w;
}

export const Ana7: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const cycle = 6.4;

    const render = (now: number) => {
      const p = ((now - t0) / 1000 % cycle) / cycle;
      // 刀的行程：左板 0–0.44，跨间隙 0.44–0.54，右板 0.54–1.0
      let bx: number;
      if (p < 0.44) bx = LP.x + (p / 0.44) * (LP.w - 4);
      else if (p < 0.54) bx = LP.x + LP.w + ((p - 0.44) / 0.1) * (RP.x - LP.x - LP.w);
      else bx = RP.x + clamp((p - 0.54) / 0.46, 0, 1) * (RP.w - 4);

      const lCut = clamp((bx - LP.x) / (LP.w / LCUT), 0, LCUT);
      const rCut = clamp((bx - RP.x) / (RP.w / RC), 0, RC);

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.floor;
      ctx.fillRect(0, H - 6, W, 6);

      ctx.textAlign = 'left';
      ctx.font = '600 13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = C.red;
      ctx.fillText('全局调细', LP.x, 34);
      ctx.fillStyle = C.purple;
      ctx.fillText('分层细分', RP.x, 34);

      // ---- 左板：整图直接调细 ----
      ctx.fillStyle = 'rgba(196,63,82,0.06)';
      roundRect(ctx, LP.x, LP.y, LP.w, LP.h, 6);
      ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.4;
      roundRect(ctx, LP.x, LP.y, LP.w, LP.h, 6);
      ctx.stroke();

      ctx.strokeStyle = C.red;
      ctx.lineWidth = 1.3;
      const cuts = Math.floor(lCut);
      for (let n = 1; n <= cuts; n++) {
        const x = LP.x + (LP.w / LCUT) * n;
        ctx.beginPath();
        ctx.moveTo(x, LP.y + 2);
        ctx.lineTo(x, LP.y + LP.h - 2);
        ctx.stroke();
      }
      for (let n = 1; n <= HCUT; n++) {
        const y = LP.y + (LP.h / (HCUT + 1)) * n;
        ctx.beginPath();
        ctx.moveTo(LP.x + 2, y);
        ctx.lineTo(LP.x + Math.max(0, bx - LP.x), y);
        ctx.stroke();
      }
      // 切过之后被扯开的碎片
      const frac = lCut - cuts;
      ctx.fillStyle = C.red;
      for (let n = 0; n < cuts * (HCUT + 1); n++) {
        const col = n % LCUT;
        const row = Math.floor(n / LCUT);
        if (col >= cuts) continue;
        const sx = LP.x + (LP.w / LCUT) * col + 6 + seeded(n) * 4 * lCut;
        const sy = LP.y + (LP.h / (HCUT + 1)) * row + 8 + seeded(n + 40) * 4 * lCut;
        ctx.fillRect(sx, sy, 7, 7);
      }
      if (frac > 0) {
        ctx.fillStyle = C.red;
        ctx.fillRect(LP.x + (LP.w / LCUT) * cuts + 4, LP.y + 20, 7, 7);
      }

      // ---- 右板：先大区，再大区内部切格位 ----
      const gw = (RP.w - (RC + 1) * 8) / RC;
      const gh = (RP.h - (RR + 1) * 8) / RR;
      for (let r = 0; r < RR; r++) {
        for (let c = 0; c < RC; c++) {
          const x = RP.x + 8 + c * (gw + 8);
          const y = RP.y + 8 + r * (gh + 8);
          ctx.fillStyle = 'rgba(39,68,110,0.06)';
          roundRect(ctx, x, y, gw, gh, 5);
          ctx.fill();
          ctx.strokeStyle = C.blue;
          ctx.lineWidth = 1.6;
          roundRect(ctx, x, y, gw, gh, 5);
          ctx.stroke();

          // 大区内部的格位线：只在刀口扫过的范围内生长
          const gate = clamp((bx - x) / (gw * 0.75), 0, 1);
          if (gate > 0) {
            ctx.strokeStyle = C.purple;
            ctx.lineWidth = 1.2;
            ctx.setLineDash([4, 3]);
            for (let n = 1; n <= RIN; n++) {
              const lx = x + (gw / (RIN + 1)) * n;
              ctx.beginPath();
              ctx.moveTo(lx, y + 6);
              ctx.lineTo(lx, y + 6 + (gh - 12) * gate);
              ctx.stroke();
            }
            ctx.setLineDash([]);
          }
        }
      }

      // ---- 唯一运动主体：刀 ----
      const onRight = bx > RP.x - 2;
      ctx.strokeStyle = onRight ? C.purple : C.red;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(bx, 40);
      ctx.lineTo(bx, H - 24);
      ctx.stroke();

      // ---- 读数 ----
      let cx2 = LP.x;
      cx2 += chip(ctx, cx2, 216, '>10万 孤点', C.red) + 10;
      if (rCut >= RC) {
        chip(ctx, cx2, 216, '328,738 格位', C.purple);
      }
      chip(ctx, RP.x, 216, '1,896 个大区被二次切开', C.blue);

      // 图例（2 项）
      ctx.font = '12px "Segoe UI", "Microsoft YaHei", sans-serif';
      let lx = LP.x;
      for (const it of [
        { color: C.blue, dash: false, label: '大区' },
        { color: C.purple, dash: true, label: '格位' },
      ]) {
        ctx.strokeStyle = it.color;
        ctx.lineWidth = 1.8;
        if (it.dash) ctx.setLineDash([4, 3]);
        ctx.strokeRect(lx, 258, 12, 12);
        ctx.setLineDash([]);
        ctx.fillStyle = C.muted;
        ctx.fillText(it.label, lx + 17, 268);
        lx += 17 + ctx.measureText(it.label).width + 20;
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(performance.now());
      raf = requestAnimationFrame(tick);
    };
    tick();
    const disconnect = observeCanvas(
      canvas,
      () => {
        if (!raf) raf = requestAnimationFrame(tick);
      },
      () => {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      }
    );
    return () => {
      if (raf) cancelAnimationFrame(raf);
      disconnect();
    };
  }, []);

  return (
    <canvas
      id={`cv-${chapterId}-${moduleId}`}
      ref={ref}
      width={W}
      height={H}
      role="img"
      aria-label="同一把刀：直接对整图调细只会切出满地碎片，先分大区再在大区内部切格位才能得到整齐的议程"
    />
  );
};

export default Ana7;
