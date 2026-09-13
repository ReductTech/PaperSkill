import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, lerpColor, easeOutCubic, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §8 Module 8.2 (P2 step-through, technical): dataflow along the pipeline.
// Each "下一步" not only highlights the stage — the lower panel plays a
// dedicated looping mini-animation of that stage's product:
//   0 输入编码:  照片扫描线 + 体素块 → 512 维嵌入频谱
//   1 蓝图生成:  6 token 逐字打出 → 层级零件树展开
//   2 KVI 注入:  紫色运动体素块在下采样点"插队"入列 + E_type 盖章
//   3 联合去噪:  噪声聚成柜子 → 开门 → 参数芯片 + 猫验收员
const W = 1080;
const H = 280;

const NODE_X = [40, 240, 440, 660, 860];
const NW = 170;
const NH = 64;
const NY = 20;

// product stage panel
const PX = 40;
const PY = 96;
const PW = 990;
const PH = 176;

const STEPS = [
  { hi: [0, 1], product: '产物：2D 特征 + 512 维体素嵌入', fb: '输入编码：照片、可选掩码与 TRELLIS 体素各就各位。', cls: '' },
  { hi: [2], product: '产物：层级物理蓝图（6 token/盒）', fb: '蓝图生成：VLM 自回归输出零件结构、物理属性与关节类型。', cls: '' },
  { hi: [3], product: '产物：z_k 拼入几何序列 + E_type', fb: 'KVI 注入：运动体素在下采样之后插队，类型嵌入一并加上。', cls: '' },
  { hi: [4], product: '产物：几何 + 纹理 + 8 维关节参数', fb: '联合去噪输出：一次得到可用的物理资产。', cls: 'good' },
];

const LABELS = ['图像/掩码编码', '体素编码', 'VLM 规划器', 'KVI 注入点', 'Flow Transformer'];

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
// anchor = 猫右缘 ax、底边 ay；返回 false 表示帧未载好
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

const easeOutBack = (t: number) => {
  const c = 1.70158;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
};
// 确定性伪随机（按索引稳定，不随帧闪变）
const rnd = (i: number, salt = 0) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// ── 步骤 0：输入编码 ─────────────────────────────────────────────
const vizEncode = (ctx: CanvasRenderingContext2D, time: number) => {
  // 照片框 + 柜子小像 + 掩码虚框 + 扫描线
  const phx = 95, phy = 140, phw = 150, phh = 108;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#27446e';
  ctx.lineWidth = 2;
  ctx.fillRect(phx, phy, phw, phh);
  ctx.strokeRect(phx, phy, phw, phh);
  ctx.fillStyle = '#92400e';
  ctx.fillRect(phx + 38, phy + 20, 76, 70);
  ctx.fillStyle = '#a0522d';
  ctx.fillRect(phx + 45, phy + 27, 62, 28);
  ctx.fillStyle = '#7a3509';
  ctx.fillRect(phx + 45, phy + 59, 62, 24);
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(phx + 99, phy + 41, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c43f52';
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(phx + 43, phy + 25, 66, 32);
  ctx.setLineDash([]);
  const scanY = phy - 6 + ((time % 1500) / 1500) * (phh + 12);
  ctx.fillStyle = 'rgba(34,141,92,0.28)';
  ctx.fillRect(phx, scanY, phw, 7);
  ctx.fillStyle = '#27446e';
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.fillText('照片 + 掩码', phx + 38, phy + phh + 16);

  // 体素块：4x4 正面 + 顶/侧斜面，循环高亮
  const vx = 330, vy = 152, cell = 15;
  const hot = Math.floor(time / 220) % 16;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const idx = r * 4 + c;
      ctx.fillStyle = idx === hot ? '#228d5c' : '#b9cbe0';
      ctx.fillRect(vx + c * cell, vy + r * cell, cell - 1.5, cell - 1.5);
    }
  }
  ctx.fillStyle = '#8fa9c9';
  ctx.beginPath();
  ctx.moveTo(vx, vy);
  ctx.lineTo(vx + 10, vy - 10);
  ctx.lineTo(vx + 4 * cell + 10, vy - 10);
  ctx.lineTo(vx + 4 * cell, vy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7c96b8';
  ctx.beginPath();
  ctx.moveTo(vx + 4 * cell, vy);
  ctx.lineTo(vx + 4 * cell + 10, vy - 10);
  ctx.lineTo(vx + 4 * cell + 10, vy + 4 * cell - 10);
  ctx.lineTo(vx + 4 * cell, vy + 4 * cell);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#27446e';
  ctx.fillText('TRELLIS 体素', vx - 6, vy + 4 * cell + 16);

  // 两条汇聚箭头（流动虚线）
  ctx.strokeStyle = '#228d5c';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([7, 6]);
  ctx.lineDashOffset = -(time / 28) % 13;
  ctx.beginPath();
  ctx.moveTo(phx + phw + 8, phy + phh / 2);
  ctx.lineTo(620, 196);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(vx + 4 * cell + 16, vy + 28);
  ctx.lineTo(620, 196);
  ctx.stroke();
  ctx.setLineDash([]);

  // 512 维嵌入频谱
  const bx = 650, base = 250, bw = 4.6, gap = 2.1;
  ctx.fillStyle = '#27446e';
  ctx.font = '13px "Segoe UI", sans-serif';
  ctx.fillText('512 维体素嵌入', bx, 138);
  for (let i = 0; i < 48; i++) {
    const h = (10 + 52 * rnd(i)) * (0.72 + 0.28 * Math.sin(time / 260 + i * 0.9));
    ctx.fillStyle = `rgba(34,141,92,${0.45 + 0.45 * rnd(i, 3)})`;
    ctx.fillRect(bx + i * (bw + gap), base - h, bw, h);
  }
  ctx.fillStyle = '#d7deea';
  ctx.fillRect(bx - 4, base, 48 * (bw + gap) + 4, 2);
};

// ── 步骤 1：蓝图生成（token 打字机 + 零件树）─────────────────────
const TOKENS = ['⟨boxes⟩', 'q11', 'q23', 'q40', 'q51', 'q07', 'q33', '⟨boxe⟩'];
const vizBlueprint = (ctx: CanvasRenderingContext2D, time: number) => {
  const lt = ((time / 1000) % 3.6 + 3.6) % 3.6;
  const fade = lt > 3.2 ? 1 - (lt - 3.2) / 0.4 : 1;
  // token 逐个打出
  const n = Math.min(TOKENS.length, Math.floor(lt / 0.18));
  ctx.font = '13px "Consolas", monospace';
  let tx = 80, ty = 158;
  for (let i = 0; i < n; i++) {
    const label = TOKENS[i];
    const cw = 18 + label.length * 8.5;
    if (tx + cw > 560) {
      tx = 80;
      ty += 36;
    }
    const pop = easeOutBack(clamp((lt - i * 0.18) / 0.22, 0, 1));
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(tx + cw / 2, ty + 14);
    ctx.scale(pop, pop);
    ctx.translate(-(tx + cw / 2), -(ty + 14));
    ctx.fillStyle = i === 0 || i === TOKENS.length - 1 ? '#21324a' : '#27446e';
    ctx.fillRect(tx, ty, cw, 28);
    ctx.fillStyle = i === 0 || i === TOKENS.length - 1 ? '#ffd166' : '#9fe8c5';
    ctx.fillText(label, tx + 9, ty + 19);
    ctx.restore();
    tx += cw + 8;
  }
  // 打字光标
  if (n < TOKENS.length && Math.floor(time / 400) % 2 === 0) {
    ctx.fillStyle = '#228d5c';
    ctx.fillRect(Math.min(tx + 4, 552), ty + 2, 3, 24);
  }
  ctx.fillStyle = '#27446e';
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.globalAlpha = fade;
  ctx.fillText('自回归 token 流（每盒 6 个）', 80, 252);
  ctx.globalAlpha = 1;

  // 层级零件树：随 token 完成而展开
  const treeA = clamp((lt - 1.5) / 0.5, 0, 1) * fade;
  if (treeA > 0.01) {
    const pop = easeOutBack(treeA);
    ctx.save();
    ctx.globalAlpha = treeA;
    ctx.translate(810, 200);
    ctx.scale(pop, pop);
    ctx.translate(-810, -200);
    ctx.strokeStyle = '#228d5c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(810, 172);
    ctx.lineTo(700, 218);
    ctx.moveTo(810, 172);
    ctx.lineTo(920, 218);
    ctx.stroke();
    const box = (x: number, y: number, w: number, label: string, fg: string, bg: string) => {
      ctx.fillStyle = bg;
      ctx.strokeStyle = fg;
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, w, 30);
      ctx.strokeRect(x, y, w, 30);
      ctx.fillStyle = fg;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText(label, x + 10, y + 20);
    };
    box(745, 142, 130, '柜体', '#ffffff', '#92400e');
    box(620, 218, 160, '柜门 · revolute', '#27446e', '#dff3ea');
    box(840, 218, 170, '抽屉 · prismatic', '#27446e', '#dff3ea');
    ctx.restore();
  }
};

// ── 步骤 2：KVI 注入（插队入列 + 盖章）──────────────────────────
const vizKVI = (ctx: CanvasRenderingContext2D, time: number) => {
  const lt = ((time / 1000) % 3.2 + 3.2) % 3.2;
  const fade = lt > 2.8 ? 1 - (lt - 2.8) / 0.4 : 1;
  const by = 196, bs = 36, gap = 12, x0 = 300, slot = 4;
  const bx = (i: number) => x0 + i * (bs + gap) + (i >= slot ? bs + 18 : 0);
  const slotX = x0 + slot * (bs + gap);

  ctx.save();
  ctx.globalAlpha = fade;
  // 几何序列（留出插槽）
  ctx.fillStyle = '#27446e';
  ctx.font = '13px "Segoe UI", sans-serif';
  ctx.fillText('几何序列', x0, by - 34);
  for (let i = 0; i < 8; i++) {
    if (i === slot) continue;
    ctx.fillStyle = '#3f6ea5';
    ctx.fillRect(bx(i), by, bs, bs);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(bx(i) + 5, by + 5, bs - 10, 4);
  }
  // 插槽虚框 + 下采样点标记
  ctx.strokeStyle = '#7c3aed';
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 2;
  ctx.strokeRect(slotX, by, bs, bs);
  ctx.beginPath();
  ctx.moveTo(slotX + bs / 2, by - 46);
  ctx.lineTo(slotX + bs / 2, by - 4);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#7c3aed';
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.fillText('下采样点', slotX - 22, by - 52);

  // z_k 紫色块从上方落槽（回弹）
  const dropP = easeOutBack(clamp((lt - 0.3) / 0.55, 0, 1));
  const zy = lerp(120, by, dropP);
  ctx.fillStyle = '#7c3aed';
  ctx.fillRect(slotX, zy, bs, bs);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px "Consolas", monospace';
  ctx.fillText('z_k', slotX + 7, zy + 22);
  // 落槽后冲击环 + E_type 盖章
  const land = clamp((lt - 0.95) / 0.5, 0, 1);
  if (land > 0) {
    ctx.strokeStyle = `rgba(124,58,237,${0.6 * (1 - land)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(slotX + bs / 2, by + bs / 2, bs / 2 + 22 * land, 0, Math.PI * 2);
    ctx.stroke();
    const stamp = easeOutBack(clamp((lt - 1.35) / 0.4, 0, 1));
    if (stamp > 0) {
      ctx.save();
      ctx.translate(slotX + bs + 30, by + 4);
      ctx.scale(stamp, stamp);
      ctx.rotate(-0.12);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-6, -14, 62, 24);
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText('E_type', 2, 3);
      ctx.restore();
    }
  }
  ctx.fillStyle = '#27446e';
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.fillText('运动体素在下采样之后拼入序列，类型嵌入一并相加', x0, by + bs + 24);
  ctx.restore();
};

// ── 步骤 3：联合去噪输出（噪声成柜 → 开门 → 验收）───────────────
const vizDenoise = (ctx: CanvasRenderingContext2D, time: number) => {
  const lt = ((time / 1000) % 4.4 + 4.4) % 4.4;
  const fade = lt > 4.0 ? 1 - (lt - 4.0) / 0.4 : 1;
  const cx = 130, cy = 148, cw = 150, chh = 102, groundY = 258;
  ctx.save();
  ctx.globalAlpha = fade;

  // 地面
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(70, groundY, 560, 5);

  // p1：噪声点向柜体轮廓汇聚
  const p1 = easeOutCubic(clamp(lt / 1.2, 0, 1));
  for (let i = 0; i < 64; i++) {
    const sx = 80 + rnd(i, 1) * 320;
    const sy = 120 + rnd(i, 2) * 130;
    const txp = cx + rnd(i, 3) * cw;
    const typ = cy + rnd(i, 4) * chh;
    ctx.fillStyle = `rgba(39,68,110,${0.55 * (1 - p1 * 0.7)})`;
    ctx.fillRect(lerp(sx, txp, p1), lerp(sy, typ, p1), 3, 3);
  }
  // p2：柜体 + 木纹浮现
  const p2 = clamp((lt - 1.2) / 0.4, 0, 1);
  if (p2 > 0) {
    ctx.globalAlpha = fade * (0.35 + 0.65 * p2);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(cx, cy, cw, chh);
    ctx.fillStyle = 'rgba(122,53,9,0.8)';
    ctx.fillRect(cx + 10, cy + 76, 130, 20); // 抽屉
    ctx.strokeStyle = `rgba(122,53,9,${0.5 * p2})`;
    ctx.lineWidth = 1.5;
    for (let g = 0; g < 3; g++) {
      ctx.beginPath();
      ctx.moveTo(cx + 8, cy + 16 + g * 18);
      ctx.lineTo(cx + cw - 8, cy + 14 + g * 18);
      ctx.stroke();
    }
    // p3：开门（门缝深色内壁 + 溢出阴影，与全站一致）
    const open = easeInOutQuad(clamp((lt - 1.8) / 1.0, 0, 1));
    const hx = cx + 10, hy = cy + 8, dw = 130, dh = 62;
    if (open > 0.005) {
      const ex = hx + dw * (1 - open);
      ctx.fillStyle = `rgba(58,34,16,${open})`;
      ctx.fillRect(ex, hy, dw * open, dh);
      const sg = ctx.createLinearGradient(ex, 0, ex + 30, 0);
      sg.addColorStop(0, `rgba(0,0,0,${0.35 * open})`);
      sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(ex, hy, Math.min(30, dw * open), dh);
    }
    ctx.save();
    ctx.translate(hx, hy);
    ctx.transform(1 - 0.82 * open, 0, 0, 1, 0, 0);
    ctx.fillStyle = lerpColor('#a0522d', '#228d5c', open);
    ctx.fillRect(0, 0, dw, dh);
    ctx.restore();
    if (open > 0.02) {
      ctx.fillStyle = '#228d5c';
      ctx.beginPath();
      ctx.arc(hx, hy + 8, 3.5, 0, Math.PI * 2);
      ctx.arc(hx, hy + dh - 8, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = fade;
  }

  // 参数芯片列：O / A / L 依次弹出
  const chipLabels = ['O · 原点', 'A · 轴向', 'L · 范围'];
  ctx.font = '13px "Segoe UI", sans-serif';
  for (let i = 0; i < 3; i++) {
    const a = clamp((lt - 2.0 - i * 0.18) / 0.3, 0, 1);
    if (a <= 0) continue;
    const pop = easeOutBack(a);
    const chx = 480, chy = 150 + i * 34;
    ctx.save();
    ctx.globalAlpha = fade * a;
    ctx.translate(chx + 45, chy + 13);
    ctx.scale(pop, pop);
    ctx.translate(-(chx + 45), -(chy + 13));
    ctx.fillStyle = '#27446e';
    ctx.fillRect(chx, chy, 90, 26);
    ctx.fillStyle = '#9fe8c5';
    ctx.fillText(chipLabels[i], chx + 10, chy + 18);
    ctx.restore();
  }
  const t8 = clamp((lt - 2.6) / 0.4, 0, 1);
  if (t8 > 0) {
    ctx.globalAlpha = fade * t8;
    ctx.fillStyle = '#228d5c';
    ctx.font = 'bold 13px "Segoe UI", sans-serif';
    ctx.fillText('→ 8 维关节参数一次到位', 470, 262);
    ctx.globalAlpha = fade;
  }

  // 输出资产卡
  const card = clamp((lt - 3.0) / 0.4, 0, 1);
  if (card > 0) {
    ctx.save();
    ctx.globalAlpha = fade * card;
    const kx = 700, ky = 158, kw = 260, kh = 80;
    ctx.fillStyle = '#eaf7f0';
    ctx.strokeStyle = '#228d5c';
    ctx.lineWidth = 2.5;
    ctx.fillRect(kx, ky, kw, kh);
    ctx.strokeRect(kx, ky, kw, kh);
    ctx.fillStyle = '#228d5c';
    ctx.beginPath();
    ctx.arc(kx + 30, ky + kh / 2, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(kx + 23, ky + kh / 2);
    ctx.lineTo(kx + 28, ky + kh / 2 + 6);
    ctx.lineTo(kx + 38, ky + kh / 2 - 7);
    ctx.stroke();
    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.fillText('可动物理资产', kx + 56, ky + 34);
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#4a5b74';
    ctx.fillText('几何 + 纹理 + 关节参数', kx + 56, ky + 56);
    ctx.restore();
  }

  // 猫验收员：柜体成型后站进来
  const catA = clamp((lt - 2.2) / 0.4, 0, 1);
  if (catA > 0) {
    ctx.globalAlpha = fade * catA;
    drawCatAt(ctx, time, 420, groundY + 2, 96);
    ctx.globalAlpha = fade;
  }
  ctx.restore();
};

const VIZ = [vizEncode, vizBlueprint, vizKVI, vizDenoise];

export const Ch8Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0, changedAt: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({ text: STEPS[0].fb, cls: STEPS[0].cls });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    // activation levels + a data packet that glides to the active stage, so
    // stepping never jumps — every highlight/position interpolates.
    const act = NODE_X.map(() => 0);
    const linkAct = [0, 0, 0, 0];
    let packetX = NODE_X[1] + NW / 2;
    let lastT: number | null = null;

    const render = (time: number) => {
      const dt = lastT === null ? 0 : Math.min((time - lastT) / 1000, 0.1);
      lastT = time;
      const k = 1 - Math.exp(-dt / 0.14);
      const kp = 1 - Math.exp(-dt / 0.22);
      const st = STEPS[stateRef.current.step];
      for (let i = 0; i < NODE_X.length; i++) {
        const tgt = st.hi.includes(i) ? 1 : 0;
        act[i] += (tgt - act[i]) * k;
        if (Math.abs(act[i] - tgt) < 0.01) act[i] = tgt;
      }
      for (let i = 0; i < linkAct.length; i++) {
        const tgt = st.hi.includes(i) && st.hi.includes(i + 1) ? 1 : 0;
        linkAct[i] += (tgt - linkAct[i]) * k;
        if (Math.abs(linkAct[i] - tgt) < 0.01) linkAct[i] = tgt;
      }
      packetX += (NODE_X[st.hi[st.hi.length - 1]] + NW / 2 - packetX) * kp;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      // links
      for (let i = 0; i < NODE_X.length - 1; i++) {
        const a = linkAct[i];
        ctx.strokeStyle = lerpColor('#d7deea', '#228d5c', a);
        ctx.lineWidth = lerp(2, 5, a);
        ctx.beginPath();
        ctx.moveTo(NODE_X[i] + NW, NY + NH / 2);
        ctx.lineTo(NODE_X[i + 1], NY + NH / 2);
        ctx.stroke();
      }
      // nodes
      NODE_X.forEach((x, i) => {
        const a = act[i];
        const base = i === 3 ? '#7c3aed' : i === 4 ? '#228d5c' : '#27446e';
        const ny = NY - 3 * a;
        ctx.fillStyle = lerpColor('#ffffff', base, a);
        ctx.strokeStyle = base;
        ctx.lineWidth = lerp(2, 4, a);
        if (a > 0.02) {
          ctx.shadowColor = base;
          ctx.shadowBlur = 12 * a;
        }
        ctx.fillRect(x, ny, NW, NH);
        ctx.shadowBlur = 0;
        ctx.strokeRect(x, ny, NW, NH);
        ctx.fillStyle = lerpColor(base, '#ffffff', a);
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.fillText(LABELS[i], x + 12, ny + 40);
      });
      // data packet rides the pipeline to the current stage
      const pr = 5 + Math.sin(time / 300) * 0.8;
      ctx.fillStyle = '#228d5c';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(packetX, NY + NH / 2, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // ── 产物面板：每步一个循环小动画 ──
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.fillRect(PX, PY, PW, PH);
      ctx.strokeRect(PX, PY, PW, PH);
      // 步骤切换时的入场（淡入 + 微上浮）
      const ep = easeOutCubic(clamp((time - stateRef.current.changedAt) / 350, 0, 1));
      ctx.save();
      ctx.beginPath();
      ctx.rect(PX + 2, PY + 30, PW - 4, PH - 32);
      ctx.clip();
      ctx.globalAlpha = ep;
      ctx.translate(0, 7 * (1 - ep));
      VIZ[stateRef.current.step](ctx, time);
      ctx.restore();
      ctx.globalAlpha = 1;
      // 产物标题条（盖在动画层之上，保持可读）
      const textA = easeOutCubic(clamp((time - stateRef.current.changedAt) / 250, 0, 1));
      ctx.globalAlpha = textA;
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText(st.product, 60, PY + 22);
      ctx.globalAlpha = 1;
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

  const go = (d: number) => {
    const ns = Math.min(Math.max(stateRef.current.step + d, 0), 3);
    stateRef.current.step = ns;
    stateRef.current.changedAt = performance.now();
    setStep(ns);
    setFeedback({ text: STEPS[ns].fb, cls: STEPS[ns].cls });
  };
  const reset = () => {
    stateRef.current.step = 0;
    stateRef.current.changedAt = performance.now();
    setStep(0);
    setFeedback({ text: STEPS[0].fb, cls: STEPS[0].cls });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl chip-row">
        <button className="chip" onClick={() => go(-1)} disabled={step === 0}>
          上一步
        </button>
        <span className="chip">第 {step + 1}/4 步</span>
        <button className="chip" onClick={() => go(1)} disabled={step === 3}>
          下一步
        </button>
        <button className="chip" onClick={reset}>
          重置
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch8Mod2;
