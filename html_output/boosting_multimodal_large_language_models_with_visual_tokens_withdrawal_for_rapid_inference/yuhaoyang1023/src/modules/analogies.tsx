import React from 'react';
import type { WidgetProps } from './registry';
import { useStage, rr, circle, glow, txt, clamp, lerp, easeOut, easeInOut } from '../lib/stage';
import { C, rgba } from '../lib/palette';

// 类比画面（只在难点章节使用：信息迁移、位置编号、选层、边界），互不重复。都是“教学示意”：持续而轻的循环动画，画布离开视口即暂停；
// 减少动态效果时画出“关键时刻”的静态画面（finalT），内容完整可见。

type DrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void;

function AnaCanvas({ draw, label, finalT, caption }: { draw: DrawFn; label: string; finalT: number; caption: string }) {
  const s = useStage(
    {
      heightOf: (w) => clamp(w * 0.64, 190, 290),
      draw: (f) => {
        const { ctx, w, h } = f;
        ctx.clearRect(0, 0, w, h);
        draw(ctx, w, h, f.final ? finalT : f.t);
      },
      live: true,
    },
    []
  );
  return (
    <figure className="ana">
      <div className="ana-box" ref={s.wrapRef}>
        <canvas ref={s.canvasRef} role="img" aria-label={label} />
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

const loop = (t: number, period: number) => (t % period) / period;

function nightBg(ctx: CanvasRenderingContext2D, w: number, h: number, top = '#0C1640', bottom = '#060B22') {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  rr(ctx, 0, 0, w, h, 14);
  ctx.fill();
}

// ---------------------------------------------------------------- 4 泡茶
const drawTea: DrawFn = (ctx, w, h, t) => {
  nightBg(ctx, w, h, '#101A3E', '#070C24');
  const p = loop(t, 9);
  const cups = [
    { cx: w * 0.3, label: '正常茶包', tea: '#C98B3C' },
    { cx: w * 0.72, label: '味道不对的假茶包', tea: '#7C7C9A' },
  ];
  const steep = clamp(p / 0.45, 0, 1); // 浸泡
  const lift = clamp((p - 0.5) / 0.15, 0, 1); // 取出
  cups.forEach((c, i) => {
    const cw = Math.min(110, w * 0.3);
    const top = h * 0.36;
    const bottom = h * 0.86;
    // 杯子
    ctx.strokeStyle = rgba(C.ink2, 0.6);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c.cx - cw / 2, top);
    ctx.lineTo(c.cx - cw / 2 + 8, bottom);
    ctx.lineTo(c.cx + cw / 2 - 8, bottom);
    ctx.lineTo(c.cx + cw / 2, top);
    ctx.stroke();
    // 水 + 溶出的颜色
    const level = top + 14;
    ctx.fillStyle = rgba(c.tea, 0.12 + 0.6 * easeOut(steep));
    ctx.beginPath();
    ctx.moveTo(c.cx - cw / 2 + 2, level);
    ctx.lineTo(c.cx - cw / 2 + 9, bottom - 2);
    ctx.lineTo(c.cx + cw / 2 - 9, bottom - 2);
    ctx.lineTo(c.cx + cw / 2 - 2, level);
    ctx.closePath();
    ctx.fill();
    // 茶包
    const by = lerp(level + 26, top - 40, easeInOut(lift));
    ctx.strokeStyle = rgba(C.ink2, 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(c.cx, 8);
    ctx.lineTo(c.cx, by - 12);
    ctx.stroke();
    ctx.fillStyle = i === 0 ? '#E7D2A6' : '#B9B9CC';
    rr(ctx, c.cx - 12, by - 12, 24, 22, 4);
    ctx.fill();
    // 扩散的“味道”粒子（只在浸泡阶段从茶包流出）
    if (lift < 1) {
      for (let k = 0; k < 10; k++) {
        const q = (t * 0.6 + k / 10) % 1;
        const px = c.cx + Math.sin(k * 2.3 + t) * q * cw * 0.35;
        const py = by + q * (bottom - by - 10);
        ctx.fillStyle = rgba(c.tea, (1 - q) * 0.8 * (1 - lift));
        circle(ctx, px, py, 2.2);
        ctx.fill();
      }
    }
    txt(ctx, c.label, c.cx, h - 10, { size: 10, color: C.ink2, align: 'center' });
  });
  const phase = p < 0.5 ? '浸泡中：味道溶进水里' : '茶包取出：水里的味道还在';
  txt(ctx, phase, w / 2, 16, { size: 11, color: p < 0.5 ? C.ink2 : C.moon, align: 'center' });
};

// ---------------------------------------------------------------- 6 剧场座位号
const drawTheater: DrawFn = (ctx, w, h, t) => {
  nightBg(ctx, w, h, '#160F34', '#080820');
  const p = loop(t, 10);
  const mode = p < 0.5 ? 'keep' : 'rearr';
  const q = mode === 'keep' ? p / 0.5 : (p - 0.5) / 0.5;
  // 舞台
  ctx.fillStyle = rgba(C.sys, 0.2);
  rr(ctx, w * 0.2, 10, w * 0.6, 22, 6);
  ctx.fill();
  txt(ctx, mode === 'keep' ? '保留原座号（Keep）' : '重新编号（Rearrange）', w / 2, 21, { size: 11, color: C.moon, align: 'center' });
  const n = 12;
  const leave = [3, 4, 5, 6, 7, 8]; // 中间一批（“视觉”观众）
  const seatW = (w - 40) / n;
  const y = h * 0.62;
  const gone = easeOut(clamp((q - 0.15) / 0.35, 0, 1));
  let k = 0;
  for (let i = 0; i < n; i++) {
    const x = 20 + seatW * (i + 0.5);
    const isVis = leave.includes(i);
    ctx.fillStyle = rgba(C.ink3, 0.35);
    rr(ctx, x - seatW * 0.38, y + 6, seatW * 0.76, 12, 3);
    ctx.fill();
    if (isVis) {
      ctx.globalAlpha = 1 - gone;
      ctx.fillStyle = C.vis;
      circle(ctx, x, y - gone * 40, Math.min(8, seatW * 0.3));
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = C.ins;
      circle(ctx, x, y, Math.min(8, seatW * 0.3));
      ctx.fill();
    }
    let label = String(i);
    if (mode === 'rearr' && !isVis && gone > 0.6) label = String(k);
    if (!isVis) k++;
    if (!isVis || gone < 0.6)
      txt(ctx, label, x, y + 30, { size: 10, color: mode === 'rearr' && !isVis && gone > 0.6 && label !== String(i) ? C.warn : C.ink2, align: 'center' });
  }
  const msg = mode === 'keep' ? (gone > 0.6 ? '剩下的人座号不变' : '中间一批观众离场') : gone > 0.6 ? '座号整体前移：和浅层的号对不上' : '中间一批观众离场';
  txt(ctx, msg, w / 2, h - 14, { size: 10, color: C.ink2, align: 'center' });
};

// ---------------------------------------------------------------- 7 厨师试味
const drawChef: DrawFn = (ctx, w, h, t) => {
  nightBg(ctx, w, h, '#14122E', '#08091E');
  const p = loop(t, 9);
  const mins = [5, 6, 7, 8, 9, 10, 11, 12];
  const diffs = [0.9, 0.75, 0.55, 0.38, 0.2, 0.08, 0.05, 0.04];
  const eta = 0.12;
  const idx = Math.min(mins.length - 1, Math.floor(p * mins.length * 1.1));
  const stop = diffs.findIndex((d) => d < eta);
  const cur = Math.min(idx, stop);
  // 锅
  const px = w * 0.24;
  const py = h * 0.58;
  ctx.fillStyle = '#3B4466';
  rr(ctx, px - 46, py - 22, 92, 44, 10);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    const sx = px - 20 + i * 20;
    const sy = py - 30 - ((t * 20 + i * 9) % 26);
    ctx.fillStyle = rgba(C.moon, 0.25 * (1 - ((t * 20 + i * 9) % 26) / 26));
    circle(ctx, sx, sy, 4);
    ctx.fill();
  }
  glow(ctx, px, py + 34, 26, C.ins, 0.7);
  txt(ctx, `关火试：第 ${mins[cur]} 分钟`, px, h - 14, { size: 10, color: C.ink2, align: 'center' });
  // 差异条形图
  const gx = w * 0.46;
  const gw = w * 0.5;
  const gh = h * 0.6;
  const gy = h * 0.2;
  const bw = gw / mins.length;
  const etaY = gy + gh - (eta / 1) * gh;
  diffs.forEach((d, i) => {
    if (i > cur) return;
    const bh = d * gh;
    const ok = d < eta;
    ctx.fillStyle = ok ? C.ok : rgba(C.ink2, 0.6);
    rr(ctx, gx + i * bw + 3, gy + gh - bh, bw - 6, bh, 3);
    ctx.fill();
    txt(ctx, String(mins[i]), gx + i * bw + bw / 2, gy + gh + 10, { size: 9, color: C.ink3, align: 'center' });
  });
  ctx.strokeStyle = C.warn;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(gx, etaY);
  ctx.lineTo(gx + gw, etaY);
  ctx.stroke();
  ctx.setLineDash([]);
  txt(ctx, '舌头分辨力 η', gx + gw, etaY - 9, { size: 9, color: C.warn, align: 'right' });
  txt(ctx, '与标准汤的味差', gx, gy - 8, { size: 10, color: C.ink2 });
  if (cur === stop) txt(ctx, '✓ 尝不出差别，定下来', gx + stop * bw + bw / 2, gy + gh - diffs[stop] * gh - 12, { size: 10, color: C.ok, align: 'center' });
};

// ---------------------------------------------------------------- 10 考试中途收走图片
const drawExam: DrawFn = (ctx, w, h, t) => {
  nightBg(ctx, w, h, '#121838', '#080B20');
  const p = loop(t, 10);
  const taken = easeInOut(clamp((p - 0.35) / 0.12, 0, 1));
  // 试卷
  const px = 16;
  const py = 26;
  const pw = w * 0.56;
  const ph = h - 44;
  ctx.fillStyle = '#E8E6F0';
  rr(ctx, px, py, pw, ph, 8);
  ctx.fill();
  // 图片（被收走）
  const iw = pw * 0.42;
  const ih = ph * 0.42;
  const ix = px + 12 + taken * (w - px);
  ctx.fillStyle = '#2D5B7A';
  rr(ctx, ix, py + 12, iw, ih, 6);
  ctx.fill();
  ctx.fillStyle = C.vis;
  circle(ctx, ix + iw * 0.3, py + 12 + ih * 0.5, ih * 0.18);
  ctx.fill();
  ctx.fillStyle = C.ins;
  ctx.fillRect(ix + iw * 0.55, py + 12 + ih * 0.3, iw * 0.3, ih * 0.4);
  if (taken > 0.98) {
    ctx.strokeStyle = rgba('#5A5F80', 0.6);
    ctx.setLineDash([4, 3]);
    rr(ctx, px + 12, py + 12, iw, ih, 6);
    ctx.stroke();
    ctx.setLineDash([]);
    txt(ctx, '图已收走', px + 12 + iw / 2, py + 12 + ih / 2, { size: 10, color: '#5A5F80', align: 'center' });
  }
  // 题目
  const qs = [
    { s: '1. 有没有瓶子？', at: 0.2, need: false },
    { s: '2. 瓶身上写了几个字？', at: 0.55, need: true },
    { s: '3. 详细描述整张图', at: 0.8, need: true },
  ];
  qs.forEach((q, i) => {
    const y = py + ih + 30 + i * 20;
    txt(ctx, q.s, px + 12, y, { size: 10, color: '#2A3050' });
    if (p > q.at) {
      const ok = !q.need || taken < 0.5;
      txt(ctx, ok ? '✓' : '凭印象', px + pw - 12, y, { size: 10, color: ok ? '#15803D' : '#B45309', align: 'right', weight: 700 });
    }
  });
  // 时钟
  const cx = w * 0.8;
  const cy = h * 0.45;
  const r = Math.min(40, w * 0.1);
  ctx.strokeStyle = rgba(C.moon, 0.7);
  ctx.lineWidth = 2;
  circle(ctx, cx, cy, r);
  ctx.stroke();
  ctx.lineWidth = 1;
  const a = -Math.PI / 2 + p * Math.PI * 2;
  ctx.strokeStyle = C.moon;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8);
  ctx.stroke();
  const ka = -Math.PI / 2 + 0.35 * Math.PI * 2;
  ctx.fillStyle = C.vis;
  circle(ctx, cx + Math.cos(ka) * r, cy + Math.sin(ka) * r, 3.5);
  ctx.fill();
  txt(ctx, '第 K 分钟收图', cx, cy + r + 14, { size: 10, color: C.vis, align: 'center' });
};

const make = (draw: DrawFn, label: string, finalT: number, caption: string): React.FC<WidgetProps> => {
  const Comp: React.FC<WidgetProps> = () => <AnaCanvas draw={draw} label={label} finalT={finalT} caption={caption} />;
  return Comp;
};

export const AnaTea = make(drawTea, '两杯茶：茶包取出后，正常茶和怪味茶的颜色都留在水里', 6.5, '教学示意 · 茶包 = 视觉 token，水 = 文字 token');
export const AnaTheater = make(drawTheater, '中间一批观众离场；上半段剩下的人保留原座号，下半段重新编号导致号码对不上', 3.6, '教学示意 · 座号 = 位置编号');
export const AnaChef = make(drawChef, '厨师从第 5 分钟起逐分钟试味，第一个低于分辨力阈值的时刻被定为关火时间', 8.9, '教学示意 · 每一分钟 = 一个候选层 K');
export const AnaExam = make(drawExam, '考试中途图片被收走：第 1 题已答对，需要细节的第 2、3 题只能凭印象', 9.6, '教学示意 · 收图时刻 = 撤出层 K');
