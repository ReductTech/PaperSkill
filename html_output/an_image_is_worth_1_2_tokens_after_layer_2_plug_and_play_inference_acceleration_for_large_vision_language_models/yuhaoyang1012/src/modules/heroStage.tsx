import React from 'react';
import type { WidgetProps } from './registry';
import { C, useStage, glow, rr, label, sceneCanvas, syntheticAttention, rankOrder, GRID, rgba, rand } from './stageKit';
import { clamp } from '../lib/canvasKit';

// Hero：镜头沿 32 层解码器向前“飞行”。每一层是一张由 576 个图像 token 组成的光点切片。
// 左「传统 LVLM」每层都满载；右「FastV」穿过第 2 层后，最不受关注的一半 token 爆散离场，
// 之后每层计算更少，镜头也飞得更快。两侧共享同一时钟；结束时显示累计 FLOPs（7B，Table 1 为 55%）。

const W = 560;
const H = 320;
const LAYERS = 32;
const K = 2;
const BASE = 0.16; // 满载一层的飞行时长（秒）
const PRUNED_COST = (0.55 * LAYERS - K) / (LAYERS - K);
const OLD_TOTAL = LAYERS * BASE;
const HOLD = 2.0;
const PERIOD = OLD_TOTAL + HOLD;
const VIEW = 6.5; // 镜头前可见的层数
const F = 0.9; // 透视焦距
const PLANE = 250; // 距离为 1 时切片的屏幕边长

const order = rankOrder(syntheticAttention());
const pruned = new Uint8Array(GRID * GRID);
order.forEach((idx, r) => (pruned[idx] = r >= (GRID * GRID) / 2 ? 1 : 0));

let colors: string[] | null = null;
function tileColors(): string[] {
  if (colors) return colors;
  const img = sceneCanvas();
  const g = img.getContext('2d');
  const out: string[] = [];
  if (g) {
    const data = g.getImageData(0, 0, 336, 336).data;
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        let R = 0;
        let G = 0;
        let B = 0;
        let n = 0;
        for (let y = r * 14; y < r * 14 + 14; y += 3) {
          for (let x = c * 14; x < c * 14 + 14; x += 3) {
            const k = (y * 336 + x) * 4;
            R += data[k];
            G += data[k + 1];
            B += data[k + 2];
            n++;
          }
        }
        // 提亮以便在暗场中发光
        out.push(`rgb(${Math.min(255, (R / n) * 1.25 + 20) | 0},${Math.min(255, (G / n) * 1.25 + 20) | 0},${Math.min(255, (B / n) * 1.3 + 30) | 0})`);
      }
    }
  }
  colors = out.length ? out : new Array(GRID * GRID).fill(C.img);
  return colors;
}

function progress(fast: boolean, time: number) {
  let t = time;
  let z = 0;
  let flops = 0;
  for (let l = 0; l < LAYERS; l++) {
    const cost = fast && l >= K ? PRUNED_COST : 1;
    const dur = BASE * cost;
    if (t >= dur) {
      t -= dur;
      z += 1;
      flops += cost;
    } else {
      z += t / dur;
      flops += cost * (t / dur);
      t = 0;
      break;
    }
  }
  return { z, flops: flops / LAYERS };
}

export const HeroStage: React.FC<WidgetProps> = ({ moduleId }) => {
  const fast = moduleId === 'new';
  const accent = fast ? C.good : C.emph;
  const ref = useStage(W, H, (ctx, t) => {
    const cols = tileColors();
    const lt = t % PERIOD;
    const { z: realZ, flops } = progress(fast, lt);
    const done = realZ >= LAYERS - 1e-6;
    const camZ = Math.min(realZ, LAYERS - 1.25); // 结束时镜头停在最后一层前
    const cx = W / 2;
    const cy = H / 2 + 6;

    // 深空背景 + 隧道中心光
    const bg = ctx.createRadialGradient(cx, cy, 10, cx, cy, W * 0.75);
    bg.addColorStop(0, '#16233f');
    bg.addColorStop(0.5, '#0b1222');
    bg.addColorStop(1, '#04070f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    glow(ctx, cx, cy, 120, fast ? '#7af0c0' : '#ffd9a0', 0.16 + 0.05 * Math.sin(t * 2));

    // 速度线（飞行感）：FastV 剪枝后更快
    const speed = fast && camZ > K ? 1.8 : 1;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 46; i++) {
      const ang = rand(i) * Math.PI * 2;
      const ph = (t * 0.55 * speed + rand(i + 7)) % 1;
      const r0 = 30 + ph * ph * 330;
      const len = 8 + ph * 46 * speed;
      ctx.strokeStyle = `rgba(200,220,255,${0.22 * ph})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0 * 0.7);
      ctx.lineTo(cx + Math.cos(ang) * (r0 + len), cy + Math.sin(ang) * (r0 + len) * 0.7);
      ctx.stroke();
    }
    ctx.restore();

    // 层切片：由远到近绘制
    const first = Math.floor(camZ) + 1;
    for (let l = Math.min(LAYERS, first + Math.ceil(VIEW)); l >= Math.max(1, first); l--) {
      const dz = l - camZ;
      if (dz <= 0.12 || dz > VIEW) continue;
      const s = F / dz;
      const size = PLANE * s;
      const fadeFar = clamp((VIEW - dz) / 2, 0, 1);
      const fadeNear = clamp((dz - 0.12) / 0.5, 0, 1);
      const a = fadeFar * fadeNear;
      if (a <= 0.01) continue;
      const x0 = cx - size / 2;
      const y0 = cy - size / 2;
      const cell = size / GRID;
      const dot = Math.max(1, cell * 0.62);
      const afterPrune = fast && l > K;
      const isGate = fast && l === K + 1;
      // 切片底板与边框
      ctx.fillStyle = `rgba(20,32,60,${0.22 * a})`;
      ctx.fillRect(x0, y0, size, size);
      ctx.strokeStyle = isGate ? rgba(C.good, 0.9 * a) : `rgba(140,170,230,${0.35 * a})`;
      ctx.lineWidth = isGate ? 2.5 : 1;
      ctx.strokeRect(x0, y0, size, size);
      if (isGate) glow(ctx, cx, y0, size * 0.5, C.good, 0.25 * a);
      // 图像 token 光点
      ctx.globalAlpha = a;
      for (let i = 0; i < GRID * GRID; i++) {
        if (afterPrune && pruned[i]) continue;
        const r = (i / GRID) | 0;
        const c = i % GRID;
        ctx.fillStyle = cols[i];
        ctx.fillRect(x0 + c * cell + (cell - dot) / 2, y0 + r * cell + (cell - dot) / 2, dot, dot);
      }
      ctx.globalAlpha = 1;
      // 系统提示（锚点）：切片上沿的一排金色光点，越深越亮
      const anchorGlow = clamp(l / 6, 0.2, 1);
      for (let k = 0; k < 12; k++) {
        const ax = x0 + (k + 0.5) * (size / 12);
        ctx.fillStyle = rgba(C.sys, a * (0.5 + 0.5 * anchorGlow));
        ctx.fillRect(ax - dot, y0 - cell * 1.8, dot * 2, dot * 1.2);
      }
      if (s > 0.6) glow(ctx, x0 + size * 0.04, y0 - cell * 1.5, size * 0.08, C.sys, 0.4 * a * anchorGlow);
    }

    // FastV：穿过第 2 层时被剪掉的 token 爆散
    if (fast) {
      const since = camZ - (K + 0.2);
      if (since > 0 && since < 3.5) {
        const k = since / 3.5;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < GRID * GRID; i += 2) {
          if (!pruned[i]) continue;
          const r = (i / GRID) | 0;
          const c = i % GRID;
          const ux = (c - 11.5) / 12;
          const uy = (r - 11.5) / 12;
          const sp = 0.6 + rand(i) * 1.4;
          const x = cx + ux * 220 * (1 + k * 2.2 * sp) + (rand(i + 3) - 0.5) * 80 * k;
          const y = cy + uy * 220 * (1 + k * 2.2 * sp) + 160 * k * k;
          ctx.fillStyle = rgba(C.bad, (1 - k) * 0.75);
          ctx.fillRect(x, y, 2.4, 2.4);
        }
        ctx.restore();
      }
    }

    // 抬头显示：层号 + 累计 FLOPs
    ctx.fillStyle = 'rgba(4,7,15,0.55)';
    rr(ctx, 14, 12, 118, 34, 9);
    ctx.fill();
    label(ctx, `L ${Math.min(LAYERS, Math.max(1, Math.ceil(realZ)))}`, 26, 29, 17, C.text, 'left', 800, true);
    label(ctx, '/ 32', 84, 30, 12, C.muted, 'left', 700, true);
    const fp = Math.round(flops * 100);
    label(ctx, `${fp}%`, W - 20, 30, 26, done ? accent : C.text, 'right', 800, true);
    label(ctx, 'FLOPs', W - 20, 52, 11, C.muted, 'right', 700);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    rr(ctx, 16, H - 18, W - 32, 5, 2.5);
    ctx.fill();
    const pg = ctx.createLinearGradient(16, 0, W - 16, 0);
    pg.addColorStop(0, rgba(accent, 0.4));
    pg.addColorStop(1, accent);
    ctx.fillStyle = pg;
    rr(ctx, 16, H - 18, Math.max(5, (W - 32) * flops), 5, 2.5);
    ctx.fill();
    if (done) glow(ctx, 16 + (W - 32) * flops, H - 16, 40, accent, 0.6 + 0.2 * Math.sin(t * 5));
  });
  return <canvas ref={ref} width={W} height={H} aria-label={fast ? 'FastV：穿过第 2 层后剪掉一半图像 token' : '传统 LVLM：每层都处理全部 576 个图像 token'} />;
};

export default HeroStage;
