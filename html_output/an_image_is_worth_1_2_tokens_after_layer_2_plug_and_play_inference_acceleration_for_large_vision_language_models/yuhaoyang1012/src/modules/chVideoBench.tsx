import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  C, useStage, drawStage, glow, rr, label, rgba, approach, sceneCanvas, syntheticAttention, rankOrder, rand,
  flopsReduction, MODEL_7B, layerFlops,
} from './stageKit';
import { BENCH_GROUPS } from './paperData';
import { clamp, easeOutCubic } from '../lib/canvasKit';
import { ChipGroup, Num, CanvasPan } from './ui';

// ============================================================================
//  模块 8.1（P1 滑块）：视频帧数 -> 图像 token 总数、FastV 保留量、理论 FLOPs
//  每帧 256 个 token = Video-LLaVA 8 帧共 2048 个（论文 §5.3）÷ 8。
// ============================================================================
const W1 = 1080;
const H1 = 330;
const PER_FRAME = 256;
const G = 16;

// 用 24×24 的合成注意力下采样到 16×16，再给每帧加一点扰动，得到每帧的保留集合
const base = syntheticAttention();
const frameKeep: Set<number>[] = [];
for (let f = 0; f < 8; f++) {
  const sc: number[] = [];
  for (let r = 0; r < G; r++) {
    for (let c = 0; c < G; c++) {
      const rr0 = Math.floor((r / G) * 24);
      const cc0 = Math.min(23, Math.floor((c / G) * 24 + f * 0.6));
      sc.push(base[rr0 * 24 + cc0] * (0.85 + 0.3 * rand(f * 999 + r * G + c)));
    }
  }
  frameKeep.push(new Set(rankOrder(sc).slice(0, PER_FRAME / 2)));
}

export const VideoFrames: React.FC<WidgetProps> = () => {
  const [frames, setFrames] = useState(8);
  const st = useRef({ frames: 8, shown: 8, prune: 0 });
  st.current.frames = frames;

  const canvasRef = useStage(W1, H1, (ctx, t, dt) => {
    const s = st.current;
    s.shown = approach(s.shown, s.frames, dt, 7);
    // 剪枝动画：周期性地“先满载、再剪掉一半”
    const cyc = (t % 4.2) / 4.2;
    s.prune = cyc < 0.25 ? 0 : cyc < 0.45 ? easeOutCubic((cyc - 0.25) / 0.2) : cyc < 0.92 ? 1 : 1 - (cyc - 0.92) / 0.08;
    drawStage(ctx, W1, H1, t, 0.99);
    const img = sceneCanvas();

    // 胶片带
    const fx0 = 40;
    const fy = 46;
    const fw = 112;
    const gap = 10;
    ctx.fillStyle = '#05080f';
    rr(ctx, fx0 - 14, fy - 26, 8 * (fw + gap) + 18, fw + 52, 10);
    ctx.fill();
    for (let k = 0; k < 8 * 2; k++) {
      // 齿孔
      const hx = fx0 - 4 + k * ((8 * (fw + gap)) / 16);
      ctx.fillStyle = 'rgba(255,241,208,0.18)';
      rr(ctx, hx, fy - 18, 12, 8, 2);
      ctx.fill();
      rr(ctx, hx, fy + fw + 10, 12, 8, 2);
      ctx.fill();
    }
    for (let f = 0; f < 8; f++) {
      const x = fx0 + f * (fw + gap);
      const on = clamp(s.shown - f, 0, 1);
      if (on <= 0.01) {
        ctx.strokeStyle = 'rgba(150,175,220,0.15)';
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(x, fy, fw, fw);
        ctx.setLineDash([]);
        continue;
      }
      ctx.globalAlpha = on;
      const cell = fw / G;
      const keep = frameKeep[f];
      for (let i = 0; i < G * G; i++) {
        const r = (i / G) | 0;
        const c = i % G;
        const kept = keep.has(i);
        const a = kept ? 1 : 1 - 0.85 * s.prune;
        ctx.globalAlpha = on * a;
        const sx = Math.min(335 - 21, (c / G) * 300 + f * 5);
        ctx.drawImage(img, sx, (r / G) * 336, 21, 21, x + c * cell, fy + r * cell, cell - 0.6, cell - 0.6);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = rgba(C.img, 0.5 * on);
      ctx.strokeRect(x - 0.5, fy - 0.5, fw + 1, fw + 1);
    }
    // 底部：token 条（完整 vs FastV 第 2 层后）
    const total = s.shown * PER_FRAME;
    const bx = 40;
    const bw = 700;
    const maxT = 8 * PER_FRAME;
    const by1 = 232;
    const by2 = 276;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    rr(ctx, bx, by1, bw, 18, 9);
    ctx.fill();
    rr(ctx, bx, by2, bw, 18, 9);
    ctx.fill();
    const g1 = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    g1.addColorStop(0, rgba(C.img, 0.6));
    g1.addColorStop(1, C.img);
    ctx.fillStyle = g1;
    rr(ctx, bx, by1, Math.max(18, (total / maxT) * bw), 18, 9);
    ctx.fill();
    const g2 = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    g2.addColorStop(0, rgba(C.good, 0.6));
    g2.addColorStop(1, C.good);
    ctx.fillStyle = g2;
    rr(ctx, bx, by2, Math.max(18, (total / 2 / maxT) * bw), 18, 9);
    ctx.fill();
    glow(ctx, bx + (total / 2 / maxT) * bw, by2 + 9, 24, C.good, 0.6);
    label(ctx, `${Math.round(total)}`, bx + bw + 16, by1 + 9, 16, C.img, 'left', 800, true);
    label(ctx, `${Math.round(total / 2)}`, bx + bw + 16, by2 + 9, 16, C.good, 'left', 800, true);

    // 右侧：理论 FLOPs 削减圆环（7B 公式，n = 帧数 × 256）
    const n = Math.max(1, Math.round(s.shown)) * PER_FRAME;
    const red = flopsReduction(2, 0.5, MODEL_7B, n);
    const cx = 960;
    const cy = 250;
    const R = 46;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.save();
    ctx.strokeStyle = C.good;
    ctx.shadowColor = C.good;
    ctx.shadowBlur = 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + red * Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    label(ctx, `${(red * 100).toFixed(1)}%`, cx, cy, 17, C.text, 'center', 800, true);
  });

  const n = frames * PER_FRAME;
  const red = flopsReduction(2, 0.5, MODEL_7B, n);
  const attnShare = (2 * n * n * MODEL_7B.d) / layerFlops(n, MODEL_7B.d, MODEL_7B.m);
  const fb =
    frames === 8
      ? {
          text: '8 帧就是 Video-LLaVA 的设置：2048 个图像 token。Table 6 中 FastV（K=2、R=50%，理论 FLOPs 52.3%）的三项平均准确率为 0.49（完整 0.48）。这是每个数据集前 1000 条、GPT 评测、单次运行的结果，小幅上升不等于提升了能力；论文的解释是视频帧之间冗余更多。',
          cls: 'good',
        }
      : frames <= 2
      ? { text: `${frames} 帧只有 ${n} 个图像 token，与单张图相近；帧数越多，序列越长，注意力里的平方项占比越大。`, cls: '' }
      : { text: `${frames} 帧共 ${n} 个图像 token；FastV 在第 2 层后只保留 ${n / 2} 个。帧越多，注意力平方项在单层计算中的占比越高（当前约 ${Math.round(attnShare * 100)}%）。`, cls: '' };

  return (
    <div>
      <CanvasPan><canvas ref={canvasRef} width={W1} height={H1} aria-label="视频帧数与图像 token 数" /></CanvasPan>
      <div className="ctrl">
        <label>
          视频帧数 <span className="val">{frames} 帧</span>
        </label>
        <input
          type="range"
          min={1}
          max={8}
          step={1}
          value={frames}
          onChange={(e) => setFrames(Number(e.target.value))}
          onKeyDown={(e) => e.stopPropagation()}
          aria-label="视频帧数"
        />
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">图像 token 总数</div>
          <div className="v">
            <Num value={n} />
          </div>
        </div>
        <div className="metric">
          <div className="l">第 2 层后保留（R=50%）</div>
          <div className="v">
            <Num value={n / 2} />
          </div>
        </div>
        <div className="metric">
          <div className="l">理论 FLOPs 降幅（7B 教学口径，只计视觉）</div>
          <div className="v">
            <Num value={red * 100} format={(v) => `${v.toFixed(1)}%`} />
          </div>
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

// ============================================================================
//  模块 8.2（P4 切换）：更多模型与基准的分组柱状图（数值来自论文各表）
// ============================================================================
const W2 = 1080;
const H2 = 340;
const fmtVal = (v: number) => String(Number(v.toFixed(v < 1 ? 3 : 2)));

export const BenchExplorer: React.FC<WidgetProps> = () => {
  const [gid, setGid] = useState('video');
  const st = useRef({ gid: 'video', last: '', t0: 0, hover: -1 });
  st.current.gid = gid;

  const canvasRef = useStage(W2, H2, (ctx, t) => {
    const s = st.current;
    if (s.last !== s.gid) {
      s.last = s.gid;
      s.t0 = t;
    }
    const g = BENCH_GROUPS.find((x) => x.id === s.gid) || BENCH_GROUPS[0];
    drawStage(ctx, W2, H2, t, 0.99);
    const x0 = 60;
    const x1 = 1040;
    const y1 = 270;
    const top = 50;
    const nc = g.cats.length;
    const ns = g.series.length;
    const slot = (x1 - x0) / nc;
    const bw = Math.min(30, (slot * 0.72) / ns);
    // 每个类别按完整模型归一化：柱高 = 值 / 完整值（不同量纲可放在一起比较）
    for (let c = 0; c < nc; c++) {
      const baseV = g.series[0].vals[c];
      const cx = x0 + slot * (c + 0.5);
      const grow = easeOutCubic(clamp((t - s.t0 - c * 0.05) / 0.9, 0, 1));
      if (s.hover === c) {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        rr(ctx, cx - slot / 2 + 4, top - 30, slot - 8, y1 - top + 50, 10);
        ctx.fill();
      }
      for (let k = 0; k < ns; k++) {
        const v = g.series[k].vals[c];
        const ratio = v / baseV;
        const h = (y1 - top) * clamp(ratio / 1.25, 0, 1) * grow;
        const bx = cx - (ns * bw) / 2 + k * bw;
        const col = k === 0 ? C.muted : ratio >= 0.995 ? C.good : ratio >= 0.97 ? C.emph : C.bad;
        const gg = ctx.createLinearGradient(0, y1 - h, 0, y1);
        gg.addColorStop(0, col);
        gg.addColorStop(1, rgba(col, 0.25));
        ctx.fillStyle = gg;
        rr(ctx, bx + 1, y1 - h, bw - 2, h, 4);
        ctx.fill();
        if (k > 0 && grow > 0.95 && ratio > 1.001) glow(ctx, bx + bw / 2, y1 - h, 14, C.good, 0.6);
        if (grow > 0.9 && (s.hover === c || nc <= 5)) {
          label(ctx, fmtVal(v), bx + bw / 2, y1 - h - 10, 11, C.text, 'center', 700, true);
        }
      }
      label(ctx, g.cats[c], cx, y1 + 18, nc > 8 ? 11 : 13, s.hover === c ? C.text : C.muted, 'center', 700);
    }
    // 完整模型水平参考线（= 1.0）
    const refY = y1 - (y1 - top) * (1 / 1.25);
    ctx.strokeStyle = 'rgba(232,238,248,0.35)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x0, refY);
    ctx.lineTo(x1, refY);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  const g = BENCH_GROUPS.find((x) => x.id === gid) || BENCH_GROUPS[0];
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W2;
    const slot = (1040 - 60) / g.cats.length;
    const c = Math.floor((x - 60) / slot);
    st.current.hover = c >= 0 && c < g.cats.length ? c : -1;
  };
  const better = g.series.slice(1).some((se) => se.vals.some((v, i) => v > g.series[0].vals[i]));
  return (
    <div>
      <ChipGroup label="基准分组" value={gid} onChange={setGid} options={BENCH_GROUPS.map((x) => ({ key: x.id, label: x.name }))} />
      <div className="chip-row legend-row">
        {g.series.map((se, k) => (
          <span key={se.name} className="legend-item">
            <i style={{ background: k === 0 ? 'var(--ui-text-light)' : 'linear-gradient(135deg, var(--green), var(--orange))' }} />
            {se.name}
          </span>
        ))}
        <span className="legend-item legend-note">绿 = 不低于完整模型 · 橙 = 略低 · 红 = 明显下降</span>
      </div>
      <CanvasPan><canvas
        ref={canvasRef}
        width={W2}
        height={H2}
        aria-label="更多模型与基准的结果对比"
        onPointerMove={onMove}
        onPointerLeave={() => (st.current.hover = -1)}
      /></CanvasPan>
      <div className="step-desc">
        <b>{g.model}</b>　·　柱高按“完整模型 = 1”归一化，虚线为完整模型水平；把鼠标移到某一列可查看全部数值。
      </div>
      <div className={`feedback ${g.id === 'blip' ? '' : better ? 'good' : ''}`}>{g.note}</div>
    </div>
  );
};
