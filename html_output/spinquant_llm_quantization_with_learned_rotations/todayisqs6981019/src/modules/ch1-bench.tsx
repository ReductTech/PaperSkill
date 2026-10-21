import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { useCanvas } from './useCanvas';
import { C, clamp, clearScene, grid, hist, inset, text } from './kit';

const W = 720;
const H = 260;
const HX0 = 36;
const HX1 = 476;
const HY0 = 22;
const HH = 120;
const AXY = 186;
const VSPAN = 8.5;

const NORMALS = [
  -2.2, -1.9, -1.7, -1.4, -1.2, -1.0, -0.9, -0.7, -0.55, -0.4, -0.3, -0.2, -0.12,
  0.1, 0.2, 0.32, 0.45, 0.6, 0.75, 0.95, 1.15, 1.35, 1.6, 1.9, 2.3,
  -1.05, 0.08, 0.5, -0.65, 1.7, -1.55, 0.85,
];
const NORMALS_MAX = 2.4;

const vx = (v: number) => HX0 + ((v + VSPAN) / (2 * VSPAN)) * (HX1 - HX0);

// ch1-bench：P1 滑块调 outlier，直方图 + 量化刻度尺 + 读数面板联动
export const Ch1Bench: React.FC<WidgetProps> = () => {
  const [outlier, setOutlier] = useState(1.0);

  const maxAbs = Math.max(NORMALS_MAX, outlier);
  const s = maxAbs / 7;
  const qOf = (v: number) => clamp(Math.round(v / s), -7, 7) * s;
  const errs = NORMALS.map((v) => Math.abs(v - qOf(v)));
  const maxErr = Math.max(...errs);
  const levels = new Set(NORMALS.map((v) => Math.round(v / s))).size;

  const ref = useCanvas(W, H, (ctx) => {
    clearScene(ctx, W, H);
    grid(ctx, HX0 - 12, HY0 - 6, HX1 - HX0 + 24, AXY - HY0 + 14, 28);

    // 密度直方图：中心高斯 + 双端尖峰（幅度随 outlier）
    const NB = 60;
    const bins: number[] = [];
    for (let i = 0; i < NB; i++) {
      const x = -VSPAN + ((i + 0.5) / NB) * 2 * VSPAN;
      const base = Math.exp(-(x * x) / (2 * 1.8 * 1.8)) * 0.62;
      const sp = Math.exp(-((x - outlier) ** 2) / (2 * 0.3 * 0.3)) * 0.95
        + 0.7 * Math.exp(-((x + outlier * 0.55) ** 2) / (2 * 0.3 * 0.3));
      bins.push(base + sp);
    }
    const hmax = Math.max(...bins);
    hist(ctx, bins.map((b) => b / hmax), HX0, HY0, HX1 - HX0, HH, C.blue, (i) => {
      const x = -VSPAN + ((i + 0.5) / NB) * 2 * VSPAN;
      return Math.abs(x) > maxAbs + 0.01 ? C.red : null;
    });
    text(ctx, 'outlier', vx(outlier) + 10, HY0 + 12, C.red, 13);

    // 量化主轴 + 刻度（k·s）
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(HX0, AXY);
    ctx.lineTo(HX1, AXY);
    ctx.stroke();
    for (let k = -7; k <= 7; k++) {
      const lx = vx(k * s);
      if (lx < HX0 - 2 || lx > HX1 + 2) continue;
      ctx.strokeStyle = k === 0 ? C.ink : C.muted;
      ctx.lineWidth = k === 0 ? 2 : 1.2;
      ctx.beginPath();
      ctx.moveTo(lx, AXY - 6);
      ctx.lineTo(lx, AXY + 6);
      ctx.stroke();
    }
    text(ctx, '4-bit 刻度', HX1 - 4, AXY + 22, C.muted, 13, 'right');

    // 量化阶梯覆盖（灰）
    ctx.strokeStyle = 'rgba(33,50,74,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let px = HX0; px <= HX1; px += 4) {
      const xv = (px - HX0) / (HX1 - HX0) * 2 * VSPAN - VSPAN;
      const yv = HY0 + HH - (Math.exp(-(xv * xv) / (2 * 1.8 * 1.8)) * 0.62 / hmax) * HH;
      ctx.lineTo(px, clamp(yv, HY0, HY0 + HH));
    }
    ctx.stroke();

    // 正常值贴桶误差（红色小刻度）
    NORMALS.forEach((v) => {
      const e = Math.abs(v - qOf(v));
      if (e > s * 0.35) {
        const px = vx(v);
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, AXY - 8);
        ctx.lineTo(px, AXY - 2);
        ctx.stroke();
      }
    });

    // 读数面板
    inset(ctx, 492, 22, 212, 196);
    text(ctx, '实时读数', 598, 42, C.muted, 12, 'center');
    text(ctx, '步长 s', 508, 70, C.muted, 13);
    text(ctx, s.toFixed(3), 688, 70, outlier > 4 ? C.red : C.green, 16, 'right');
    text(ctx, '可分辨桶', 508, 100, C.muted, 13);
    text(ctx, `${levels} / 15`, 688, 100, levels <= 6 ? C.red : levels >= 12 ? C.green : C.ink, 16, 'right');
    text(ctx, '最大误差', 508, 130, C.muted, 13);
    text(ctx, `±${maxErr.toFixed(3)}`, 688, 130, outlier > 4 ? C.red : C.green, 16, 'right');
    text(ctx, 'outlier 幅度', 508, 160, C.muted, 13);
    text(ctx, outlier.toFixed(1), 688, 160, C.orange, 16, 'right');
    text(ctx, 'LLaMA-2 7B：37.1 / 66.9', 598, 196, C.muted, 11, 'center');
  });

  const fb =
    outlier > 4
      ? { t: `步长被拉爆！正常值只剩 ${levels} 个桶，±${maxErr.toFixed(2)} 的误差足够毁掉下游任务。`, c: 'bad' }
      : outlier > 2
      ? { t: `开始拥挤：s=${s.toFixed(3)}，可分辨桶降到 ${levels} 个——outlier 越大，正常值能用的层级越少。`, c: '' }
      : { t: `分布健康：s=${s.toFixed(3)}，最大误差 ±${maxErr.toFixed(3)}，${levels} 个桶基本够用。`, c: 'good' };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          outlier 幅度 <span className="val">{outlier.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min={0.5}
          max={8}
          step={0.1}
          value={outlier}
          onChange={(e) => setOutlier(Number(e.target.value))}
        />
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
      <p className="sq-note">
        <b>读图方式：</b>蓝柱 = 激活分布（示意），灰阶梯 = 4-bit 量化后的分布，红刻度 = 正常值
        被舍入挤进同一桶。步长机制与「outlier 拉爆刻度」为论文结论；37.1/66.9 为
        LLaMA-2 7B W4A4KV4 的 RTN 与全精度 0-shot 均值（Table 1）。
      </p>
    </div>
  );
};

export default Ch1Bench;
