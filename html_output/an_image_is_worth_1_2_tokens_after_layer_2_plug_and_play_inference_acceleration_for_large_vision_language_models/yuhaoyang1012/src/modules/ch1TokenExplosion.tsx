import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  C, useStage, drawStage, glow, rr, label, legend, sceneCanvas, rgba, approach, layerFlops, MODEL_7B, rand,
} from './stageKit';
import { TOKEN_COUNTS } from './paperData';
import { ChipGroup, Num, CanvasPan } from './ui';

// 模块 1.1（P4 模式切换）：选择一种输入设置 -> 图像被切成多少块、序列占比、单层计算量。
// 文本部分（系统提示 35 + 指令 135 + 输出 150）按论文 Fig.3 的平均长度计。

const W = 1080;
const H = 300;

interface Preset {
  name: string;
  sub: string;
  img: number;
  grid: number; // 单帧网格边长
  frames: number;
}
const PRESETS: Preset[] = [
  { name: 'LLaVA-1.5', sub: '336×336', img: 576, grid: 24, frames: 1 },
  { name: 'Fuyu', sub: '1080×1080', img: 1296, grid: 36, frames: 1 },
  { name: 'Video-LLaVA', sub: '8 帧视频', img: 2048, grid: 16, frames: 8 },
  { name: 'LLaVA-NeXT', sub: '672×672', img: 2304, grid: 48, frames: 1 },
];
const TEXT = TOKEN_COUNTS.sys + TOKEN_COUNTS.ins + TOKEN_COUNTS.out;
const MAX_TOTAL = 2304 + TEXT;
const BASE_F = layerFlops(576 + TEXT, MODEL_7B.d, MODEL_7B.m);
const relFlops = (img: number) => layerFlops(img + TEXT, MODEL_7B.d, MODEL_7B.m) / BASE_F;

const FEED = [
  { text: '576 个图像 token 约占 Figure 3 所统计序列的 64%（分母包含生成的 150 个输出 token；只看首次输入的 746 个 token 时约为 77%）。', cls: '' },
  { text: '1080×1080 的图被 Fuyu 切成 1296 个 token：分辨率翻约 3 倍，单层计算量接近翻倍。', cls: 'bad' },
  { text: '视频把多帧都塞进序列：8 帧共 2048 个图像 token，文字（含输出 token）只占约 14%。', cls: 'bad' },
  { text: 'LLaVA-NeXT 在 672×672 配置下用 2304 个图像 token，是 576 的 4 倍；注意力矩阵面积约为原来的 8.6 倍（文字长度按 Fig. 3 平均值计）。', cls: 'bad' },
];

export const TokenExplosion: React.FC<WidgetProps> = () => {
  const [sel, setSel] = useState(0);
  const selRef = useRef(0);
  selRef.current = sel;
  const anim = useRef({ img: 576, prevSel: 0, curSel: 0, swap: 1 });

  const canvasRef = useStage(W, H, (ctx, t, dt) => {
    const a = anim.current;
    const p = PRESETS[selRef.current];
    if (a.curSel !== selRef.current) {
      a.prevSel = a.curSel;
      a.curSel = selRef.current;
      a.swap = 0;
    }
    a.swap = Math.min(1, a.swap + dt * 2.2);
    a.img = approach(a.img, p.img, dt, 5);
    drawStage(ctx, W, H, t, 0.94);

    // ---- 左：图像被切块 ----
    const ix = 34;
    const iy = 26;
    const S = 248;
    const drawPreset = (pp: Preset, alpha: number) => {
      if (alpha <= 0.01) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      const img = sceneCanvas();
      if (pp.frames === 1) {
        ctx.drawImage(img, ix, iy, S, S);
        ctx.strokeStyle = 'rgba(11,18,34,0.55)';
        ctx.lineWidth = pp.grid > 30 ? 0.6 : 1;
        ctx.beginPath();
        for (let k = 1; k < pp.grid; k++) {
          const o = (k / pp.grid) * S;
          ctx.moveTo(ix + o, iy);
          ctx.lineTo(ix + o, iy + S);
          ctx.moveTo(ix, iy + o);
          ctx.lineTo(ix + S, iy + o);
        }
        ctx.stroke();
      } else {
        const fs = (S - 3 * 6) / 4;
        for (let f = 0; f < pp.frames; f++) {
          const fx = ix + (f % 4) * (fs + 6);
          const fy = iy + 30 + Math.floor(f / 4) * (fs + 26);
          const shift = f * 12;
          ctx.drawImage(img, shift, 30, 336 - 96, 336 - 96, fx, fy, fs, fs);
          ctx.strokeStyle = 'rgba(11,18,34,0.55)';
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          for (let k = 1; k < pp.grid; k++) {
            const o = (k / pp.grid) * fs;
            ctx.moveTo(fx + o, fy);
            ctx.lineTo(fx + o, fy + fs);
            ctx.moveTo(fx, fy + o);
            ctx.lineTo(fx + fs, fy + o);
          }
          ctx.stroke();
          const pulse = 0.5 + 0.5 * Math.sin(t * 3 - f * 0.6);
          ctx.strokeStyle = rgba(C.img, 0.3 + 0.5 * pulse);
          ctx.lineWidth = 1.5;
          rr(ctx, fx - 1, fy - 1, fs + 2, fs + 2, 3);
          ctx.stroke();
        }
      }
      ctx.restore();
    };
    const k = a.swap;
    if (k < 1) drawPreset(PRESETS[a.prevSel], 1 - k);
    drawPreset(p, k);
    // 扫描高光
    const sy = iy + ((t * 90) % S);
    const sg = ctx.createLinearGradient(0, sy - 18, 0, sy + 2);
    sg.addColorStop(0, 'rgba(91,156,240,0)');
    sg.addColorStop(1, 'rgba(160,200,255,0.28)');
    ctx.fillStyle = sg;
    ctx.fillRect(ix, sy - 18, S, 20);
    ctx.strokeStyle = rgba(C.img, 0.7);
    ctx.lineWidth = 1.5;
    rr(ctx, ix - 6, iy - 6, S + 12, S + 12, 8);
    ctx.stroke();

    // ---- 中：输入序列条 ----
    const sx = 330;
    const sw = 700;
    const syy = 52;
    const total = a.img + TEXT;
    const scale = sw / MAX_TOTAL;
    const segs: [number, string][] = [
      [TOKEN_COUNTS.sys, C.sys],
      [a.img, C.img],
      [TOKEN_COUNTS.ins, C.ins],
      [TOKEN_COUNTS.out, C.out],
    ];
    let x = sx;
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    rr(ctx, sx, syy, sw, 30, 8);
    ctx.fill();
    segs.forEach(([n, col], si) => {
      const w = n * scale;
      const g = ctx.createLinearGradient(0, syy, 0, syy + 30);
      g.addColorStop(0, rgba(col, 0.95));
      g.addColorStop(1, rgba(col, 0.55));
      ctx.fillStyle = g;
      rr(ctx, x, syy, Math.max(2, w - 2), 30, 5);
      ctx.fill();
      if (si === 1) {
        // 图像段里的流动光斑
        for (let q = 0; q < 6; q++) {
          const qx = x + ((t * 120 + q * (w / 6)) % Math.max(1, w));
          glow(ctx, qx, syy + 15, 16, '#cfe3ff', 0.35);
        }
      }
      x += w;
    });
    label(ctx, `${Math.round(a.img)}`, sx + (TOKEN_COUNTS.sys + a.img / 2) * scale, syy - 14, 16, C.img, 'center', 800, true);
    label(ctx, `${Math.round((a.img / total) * 100)}%`, sx + sw, syy - 14, 16, C.text, 'right', 800, true);
    legend(ctx, [[C.sys, '系统提示'], [C.img, '图像 token'], [C.ins, '指令/输出']], sx, syy + 50);

    // ---- 右下：注意力矩阵 n×n（面积 ∝ n²）+ 单层计算量条 ----
    const mx = 330;
    const my = 128;
    const maxSide = 150;
    const side = (total / MAX_TOTAL) * maxSide;
    ctx.strokeStyle = 'rgba(150,175,220,0.25)';
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(mx, my, maxSide, maxSide);
    ctx.setLineDash([]);
    const mg = ctx.createLinearGradient(mx, my, mx + side, my + side);
    mg.addColorStop(0, rgba(C.emph, 0.75));
    mg.addColorStop(1, rgba(C.bad, 0.55));
    ctx.fillStyle = mg;
    ctx.fillRect(mx, my, side, side);
    // 因果三角（上三角为空）
    ctx.fillStyle = 'rgba(11,18,34,0.55)';
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(mx + side, my);
    ctx.lineTo(mx + side, my + side);
    ctx.closePath();
    ctx.fill();
    for (let q = 0; q < 14; q++) {
      const rx = mx + rand(q) * side;
      const ry = my + side * (0.3 + 0.7 * rand(q + 7));
      if (rx - mx < ry - my) glow(ctx, rx, ry, 8, '#ffe0c0', 0.25 + 0.2 * Math.sin(t * 2 + q));
    }
    label(ctx, 'n²', mx + side + 10, my + side - 8, 15, C.emph, 'left', 800, true);

    const fx = 540;
    const fw = 470;
    const fy = 168;
    const rel = relFlops(a.img);
    const maxRel = relFlops(2304);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    rr(ctx, fx, fy, fw, 26, 13);
    ctx.fill();
    const bw = (rel / maxRel) * fw;
    const bg = ctx.createLinearGradient(fx, 0, fx + bw, 0);
    bg.addColorStop(0, rgba(C.good, 0.8));
    bg.addColorStop(0.45, rgba(C.emph, 0.9));
    bg.addColorStop(1, rgba(C.bad, 1));
    ctx.fillStyle = bg;
    rr(ctx, fx, fy, Math.max(26, bw), 26, 13);
    ctx.fill();
    glow(ctx, fx + bw, fy + 13, 30, rel > 2 ? C.bad : C.emph, 0.5);
    // 基准刻度：LLaVA-1.5 = 1×
    const bx = fx + (1 / maxRel) * fw;
    ctx.strokeStyle = 'rgba(232,238,248,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx, fy - 8);
    ctx.lineTo(bx, fy + 34);
    ctx.stroke();
    label(ctx, `×${rel.toFixed(2)}`, fx + fw, fy + 58, 28, rel > 1.05 ? C.bad : C.good, 'right', 800, true);
    label(ctx, '单层 FLOPs', fx, fy + 58, 14, C.muted, 'left', 600);
  });

  const p = PRESETS[sel];
  const total = p.img + TEXT;
  return (
    <div>
      <ChipGroup
        label="输入设置"
        value={sel}
        onChange={setSel}
        options={PRESETS.map((pp, i) => ({ key: i, label: `${pp.name} · ${pp.sub}` }))}
      />
      <CanvasPan><canvas ref={canvasRef} width={W} height={H} aria-label="图像 token 数量与计算量对比" /></CanvasPan>
      <div className="metrics">
        <div className="metric">
          <div className="l">图像 token 数</div>
          <div className="v">
            <Num value={p.img} />
          </div>
        </div>
        <div className="metric">
          <div className="l">占 Fig. 3 所统计序列（含输出）</div>
          <div className="v">
            <Num value={(p.img / total) * 100} format={(v) => `${Math.round(v)}%`} />
          </div>
        </div>
        <div className="metric">
          <div className="l">单层 FLOPs（7B 配置，相对 LLaVA-1.5）</div>
          <div className="v">
            <Num value={relFlops(p.img)} format={(v) => `×${v.toFixed(2)}`} />
          </div>
        </div>
      </div>
      <div className={`feedback ${FEED[sel].cls}`}>{FEED[sel].text}</div>
    </div>
  );
};

export default TokenExplosion;
