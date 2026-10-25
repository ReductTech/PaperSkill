import React from 'react';
import type { WidgetProps } from './registry';
import { C, Ctx, useStage, drawStage, glow, beam, actor, rr, label, sceneCanvas, rgba, rand, mix } from './stageKit';
import { easeInOutQuad, easeOutCubic, clamp, lerp } from '../lib/canvasKit';

// 8 个类比动画（560×140），统一的「夜间剧场」世界：
// 每个场景只有一个运动主体 + 一个动作 + 一个可见目标（最后一章为结果赛跑）。

const W = 560;
const H = 140;
const FLOOR = 118;

type Scene = (ctx: Ctx, t: number) => void;

function makeAnalogy(scene: Scene, aria: string): React.FC<WidgetProps> {
  const Comp: React.FC<WidgetProps> = () => {
    const ref = useStage(W, H, (ctx, t) => {
      drawStage(ctx, W, H, t, FLOOR / H);
      scene(ctx, t);
    });
    return <canvas ref={ref} width={W} height={H} aria-label={aria} />;
  };
  return Comp;
}

// 群演站位：两排，前排稍大
const CROWD: { x: number; y: number; s: number }[] = [];
for (let i = 0; i < 13; i++) CROWD.push({ x: 150 + i * 30 + (rand(i) - 0.5) * 6, y: FLOOR - 16, s: 7.2 });
for (let i = 0; i < 12; i++) CROWD.push({ x: 165 + i * 30 + (rand(i + 40) - 0.5) * 6, y: FLOOR, s: 8.6 });

function crowdLit(ctx: Ctx, litOf: (x: number, i: number) => number, alpha = 1) {
  CROWD.forEach((p, i) => actor(ctx, p.x, p.y, p.s, C.img, litOf(p.x, i), alpha));
}

function lead(ctx: Ctx, x: number, lit: number, a = 1) {
  actor(ctx, x, FLOOR, 11, C.sys, lit, a);
}

// ---- 1：聚光灯一个个扫过满台群演（慢）
const scene1: Scene = (ctx, t) => {
  const P = 3.6;
  const u = (t % P) / P;
  const x = lerp(130, 540, easeInOutQuad(u));
  crowdLit(ctx, (px) => clamp(1 - Math.abs(px - x) / 26, 0, 1));
  beam(ctx, 300, 8, x, FLOOR + 2, 24, '#fff1d0', 0.42);
  // 进度：已照过的人数
  const done = CROWD.filter((p) => p.x < x).length;
  label(ctx, `${done}/${CROWD.length}`, 24, 26, 15, C.emph, 'left', 800, true);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  rr(ctx, 24, 40, 80, 6, 3);
  ctx.fill();
  ctx.fillStyle = C.emph;
  rr(ctx, 24, 40, 80 * (done / CROWD.length), 6, 3);
  ctx.fill();
};

// ---- 2：聚光灯逐格扫描幕布画（行优先）
const scene2: Scene = (ctx, t) => {
  const img = sceneCanvas();
  const cols = 16;
  const rows = 5;
  const x0 = 150;
  const y0 = 14;
  const tw = 22;
  const th = 18;
  const P = 3.6;
  const u = (t % P) / P;
  const cur = Math.floor(u * cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const sx = (c / cols) * 336;
      const sy = 40 + (r / rows) * 230;
      ctx.globalAlpha = i <= cur ? 1 : 0.22;
      ctx.drawImage(img, sx, sy, 336 / cols, 230 / rows, x0 + c * (tw + 1.5), y0 + r * (th + 1.5), tw, th);
    }
  }
  ctx.globalAlpha = 1;
  const cr = Math.floor(cur / cols);
  const cc = cur % cols;
  const cx = x0 + cc * (tw + 1.5) + tw / 2;
  const cy = y0 + cr * (th + 1.5) + th / 2;
  ctx.strokeStyle = C.emph;
  ctx.lineWidth = 2;
  rr(ctx, cx - tw / 2 - 1, cy - th / 2 - 1, tw + 2, th + 2, 3);
  ctx.stroke();
  glow(ctx, cx, cy, 30, '#fff1d0', 0.55);
  label(ctx, `#${cur + 1}`, 24, 26, 15, C.emph, 'left', 800, true);
};

// ---- 3：聚光灯先游走，后停在主角身上
const scene3: Scene = (ctx, t) => {
  const P = 4.0;
  const u = (t % P) / P;
  const leadX = 108;
  const wander = 300 + Math.sin(t * 1.9) * 140 + Math.sin(t * 3.3) * 60;
  const settle = easeInOutQuad(clamp((u - 0.4) / 0.25, 0, 1));
  const x = lerp(wander, leadX, settle);
  crowdLit(ctx, (px) => clamp(1 - Math.abs(px - x) / 30, 0, 1) * (1 - settle * 0.7));
  lead(ctx, leadX, clamp(1 - Math.abs(leadX - x) / 30, 0, 1));
  beam(ctx, 280, 8, x, FLOOR + 2, 26, settle > 0.5 ? '#ffe3a3' : '#fff1d0', 0.45);
};

// ---- 4：聚光灯扫过全场后，总会回到台口的报幕人身上“歇一歇”
//      报幕人最先上台、背对舞台——被照得最多，不代表他看到了后面的演出。
const scene4: Scene = (ctx, t) => {
  const P = 3.6;
  const u = (t % P) / P;
  const leadX = 64;
  // 一个周期：从报幕人出发 → 扫向群演 → 回到报幕人并停留
  const sweep = u < 0.15 ? 0 : u < 0.55 ? easeInOutQuad((u - 0.15) / 0.4) : u < 0.75 ? 1 - easeInOutQuad((u - 0.55) / 0.2) : 0;
  const x = lerp(leadX, 470, sweep);
  crowdLit(ctx, (px) => clamp(1 - Math.abs(px - x) / 30, 0, 1));
  const onLead = clamp(1 - Math.abs(leadX - x) / 30, 0, 1);
  // 报幕人背对舞台：用一个朝左的小“视线”楔形表示他看不到身后
  lead(ctx, leadX, onLead);
  ctx.fillStyle = rgba(C.muted, 0.35);
  ctx.beginPath();
  ctx.moveTo(leadX - 6, FLOOR - 17);
  ctx.lineTo(leadX - 40, FLOOR - 30);
  ctx.lineTo(leadX - 40, FLOOR - 6);
  ctx.closePath();
  ctx.fill();
  beam(ctx, 280, 8, x, FLOOR + 2, 26, onLead > 0.5 ? '#ffe3a3' : '#fff1d0', 0.45);
  // 停留计数：灯光回到报幕人的次数（只是“被照到”，不是“知道”）
  label(ctx, `${Math.floor(t / P) + 1}×`, W - 22, 24, 15, C.sys, 'right', 800, true);
};

// 红丝绒幕布（带褶皱）
function curtain(ctx: Ctx, x0: number, x1: number, tint = '#7a1830') {
  if (x1 - x0 < 1) return;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mix(tint, '#000000', 0.25));
  g.addColorStop(1, tint);
  ctx.fillStyle = g;
  ctx.fillRect(x0, 0, x1 - x0, FLOOR + 6);
  const n = Math.max(2, Math.floor((x1 - x0) / 16));
  for (let i = 0; i < n; i++) {
    const fx = x0 + ((i + 0.5) * (x1 - x0)) / n;
    const fg = ctx.createLinearGradient(fx - 8, 0, fx + 8, 0);
    fg.addColorStop(0, 'rgba(0,0,0,0.28)');
    fg.addColorStop(0.5, 'rgba(255,180,190,0.16)');
    fg.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = fg;
    ctx.fillRect(fx - 8, 0, 16, FLOOR + 6);
  }
  ctx.fillStyle = '#d9a441';
  ctx.fillRect(x0 === 0 ? x1 - 3 : x0, 0, 3, FLOOR + 6);
}

// ---- 5：幕布拉上，挡住最暗的一半群演
const scene5: Scene = (ctx, t) => {
  const P = 3.6;
  const u = (t % P) / P;
  const close = u < 0.15 ? 0 : u < 0.55 ? easeInOutQuad((u - 0.15) / 0.4) : u < 0.85 ? 1 : 1 - easeInOutQuad((u - 0.85) / 0.15);
  // 左亮右暗：按亮度排好的群演
  crowdLit(ctx, (px) => clamp(1 - (px - 140) / 420, 0.04, 1) ** 1.4);
  const edge = lerp(W, 345, close);
  curtain(ctx, edge, W);
  glow(ctx, 230, 60, 90, '#fff1d0', 0.16 + 0.1 * close);
};

// ---- 6：灯控台电表指针回落
const scene6: Scene = (ctx, t) => {
  const P = 3.6;
  const u = (t % P) / P;
  const v = u < 0.2 ? 1 : u < 0.6 ? lerp(1, 0.55, easeInOutQuad((u - 0.2) / 0.4)) : u < 0.85 ? 0.55 : lerp(0.55, 1, easeInOutQuad((u - 0.85) / 0.15));
  const cx = 280;
  const cy = 118;
  const R = 88;
  // 表盘
  ctx.fillStyle = '#1a2640';
  ctx.beginPath();
  ctx.arc(cx, cy, R + 10, Math.PI, 0);
  ctx.fill();
  const seg = (a0: number, a1: number, col: string) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, R - 6, Math.PI + a0 * Math.PI, Math.PI + a1 * Math.PI);
    ctx.stroke();
  };
  seg(0, 0.6, rgba(C.good, 0.75));
  seg(0.6, 0.85, rgba(C.emph, 0.75));
  seg(0.85, 1, rgba(C.bad, 0.8));
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI + (i / 10) * Math.PI;
    ctx.strokeStyle = 'rgba(232,238,248,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (R - 16), cy + Math.sin(a) * (R - 16));
    ctx.lineTo(cx + Math.cos(a) * (R - 22), cy + Math.sin(a) * (R - 22));
    ctx.stroke();
  }
  const a = Math.PI + v * 0.98 * Math.PI;
  const col = v > 0.85 ? C.bad : v > 0.6 ? C.emph : C.good;
  glow(ctx, cx + Math.cos(a) * (R - 30), cy + Math.sin(a) * (R - 30), 30, col, 0.45);
  ctx.strokeStyle = '#f3f6fb';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(a) * (R - 18), cy + Math.sin(a) * (R - 18));
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.fillStyle = '#f3f6fb';
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();
  label(ctx, `${Math.round(v * 100)}%`, 470, 70, 26, col, 'center', 800, true);
};

// ---- 7：幕布错拉到主角身上，整场戏暗下去
const scene7: Scene = (ctx, t) => {
  const P = 3.6;
  const u = (t % P) / P;
  const close = u < 0.15 ? 0 : u < 0.5 ? easeInOutQuad((u - 0.15) / 0.35) : u < 0.85 ? 1 : 1 - easeInOutQuad((u - 0.85) / 0.15);
  const leadX = 108;
  crowdLit(ctx, () => 0.45 * (1 - close));
  lead(ctx, leadX, 0.9 * (1 - close));
  const edge = lerp(0, 118, close);
  curtain(ctx, 0, edge);
  if (close > 0.6) {
    ctx.fillStyle = rgba(C.bad, 0.16 * (close - 0.6) * 2.5);
    ctx.fillRect(0, 0, W, H);
    label(ctx, '✕', 470, 64, 40, rgba(C.bad, close), 'center', 800);
  }
};

// ---- 8：两束聚光灯同场赛跑到谢幕
const scene8: Scene = (ctx, t) => {
  const P = 3.6;
  const u = clamp(((t % P) / P) * 1.2, 0, 1);
  const lanes = [
    { y: 46, lat: 0.539, col: C.emph },
    { y: 98, lat: 0.341, col: C.good },
  ];
  const finish = 500;
  ctx.strokeStyle = 'rgba(232,238,248,0.35)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(finish, 18);
  ctx.lineTo(finish, FLOOR + 4);
  ctx.stroke();
  ctx.setLineDash([]);
  lanes.forEach((ln) => {
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    rr(ctx, 40, ln.y - 12, finish - 40, 24, 12);
    ctx.fill();
    const p = clamp((u * (0.341 / ln.lat)) / 0.6, 0, 1);
    const x = lerp(56, finish, easeInOutQuad(p));
    glow(ctx, x, ln.y, 34, ln.col, 0.55);
    ctx.fillStyle = ln.col;
    ctx.beginPath();
    ctx.arc(x, ln.y, 7, 0, Math.PI * 2);
    ctx.fill();
    if (p >= 1) label(ctx, ln.col === C.good ? '🏆' : '✓', finish + 26, ln.y, 18, ln.col, 'center', 700);
  });
};

// ---- 9：胶片在放映光束下连续走过（相邻画格几乎一样 = 时间冗余）
const scene9: Scene = (ctx, t) => {
  const img = sceneCanvas();
  const fw = 92;
  const gap = 12;
  const y = 30;
  const off = (t * 46) % (fw + gap);
  ctx.fillStyle = '#05080f';
  ctx.fillRect(0, y - 14, W, fw + 28);
  for (let k = -1; k < 7; k++) {
    const x = k * (fw + gap) - off + 20;
    ctx.drawImage(img, 20 + ((k + Math.floor((t * 46) / (fw + gap))) % 6) * 6, 40, 240, 240, x, y, fw, fw * 0.8);
    ctx.fillStyle = 'rgba(255,241,208,0.2)';
    for (let h = 0; h < 4; h++) {
      rr(ctx, x + 6 + h * 22, y - 10, 10, 6, 2);
      ctx.fill();
      rr(ctx, x + 6 + h * 22, y + fw * 0.8 + 4, 10, 6, 2);
      ctx.fill();
    }
  }
  // 放映光束（静态道具）
  beam(ctx, W / 2, 2, W / 2, y + fw * 0.4, 52, '#fff1d0', 0.32);
  label(ctx, `${Math.floor(t * 0.5) % 8 + 1}/8`, W - 20, H - 14, 13, C.emph, 'right', 800, true);
};

// ---- 10：谢幕——幕布从两侧合拢
const scene10: Scene = (ctx, t) => {
  const P = 4.4;
  const u = (t % P) / P;
  const close = u < 0.15 ? 0 : u < 0.5 ? easeInOutQuad((u - 0.15) / 0.35) : u < 0.86 ? 1 : 1 - easeInOutQuad((u - 0.86) / 0.14);
  crowdLit(ctx, (px) => 0.5 + 0.4 * Math.sin(px * 0.05 + t));
  lead(ctx, 108, 0.9);
  const half = (W / 2) * close;
  curtain(ctx, 0, half);
  curtain(ctx, W - half, W);
  if (close > 0.92) {
    glow(ctx, W / 2, 62, 90, C.sys, 0.35);
    label(ctx, '全剧终', W / 2, 62, 26, '#fff1d0', 'center', 800);
  }
};

export const Ana9 = makeAnalogy(scene9, '类比：胶片在放映光束下连续走过');
export const Ana10 = makeAnalogy(scene10, '类比：幕布合拢，全剧终');
export const Ana1 = makeAnalogy(scene1, '类比：聚光灯逐个照过满台群演');
export const Ana2 = makeAnalogy(scene2, '类比：聚光灯逐格扫描幕布画');
export const Ana3 = makeAnalogy(scene3, '类比：聚光灯最终停在主角身上');
export const Ana4 = makeAnalogy(scene4, '类比：灯光总回到台口的报幕人身上');
export const Ana5 = makeAnalogy(scene5, '类比：幕布挡住最暗的一半群演');
export const Ana6 = makeAnalogy(scene6, '类比：电表指针回落');
export const Ana7 = makeAnalogy(scene7, '类比：幕布错拉到主角身上');
export const Ana8 = makeAnalogy(scene8, '类比：两束聚光灯赛跑到谢幕');
