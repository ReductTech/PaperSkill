import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { useCanvas } from './useCanvas';
import { C, clearScene, grid, text, clamp } from './kit';

const W = 680;
const H = 300;
const CX = W / 2;
const AXIS_Y = 218;
const PXU = 24; // 像素 / 单位值

// 固定正常值簇（确定性排布，便于前后对比）
const NORMALS = [
  -2.2, -1.9, -1.7, -1.4, -1.2, -1.0, -0.9, -0.7, -0.55, -0.4, -0.3, -0.2, -0.12,
  0.1, 0.2, 0.32, 0.45, 0.6, 0.75, 0.95, 1.15, 1.35, 1.6, 1.9, 2.3,
  -1.05, 0.08, 0.5, -0.65, 1.7, -1.55, 0.85,
];
const NORMALS_MAX = 2.4;

const vx = (v: number) => CX + v * PXU;

export const Ch1Bench: React.FC<WidgetProps> = () => {
  const [m, setM] = useState(0.5); // 离群值强度 0..1
  const [svdq, setSvdq] = useState(false);

  const outlier = 4 + m * 8; // 4..12
  const sPlain = outlier / 7; // 无保护：max|Z| = 离群值
  const sSvd = NORMALS_MAX / 7; // SVDQuant：主张量只剩正常值
  const s = svdq ? sSvd : sPlain;

  const qOf = (v: number) => clamp(Math.round(v / s), -7, 7) * s;
  const errs = NORMALS.map((v) => Math.abs(v - qOf(v)));
  const maxErr = Math.max(...errs);
  const distinct = new Set(NORMALS.map((v) => Math.round(v / s))).size;
  const pctS = (x: number) => `${clamp((x / 1.8) * 100, 4, 100)}%`;

  const ref = useCanvas(W, H, (ctx) => {
    clearScene(ctx, W, H);
    grid(ctx, 10, 14, W - 20, H - 28, 28);

    // 桶边界（虚线）与被占用的桶（浅色底）
    for (let k = -8; k < 8; k++) {
      const bx = vx((k + 0.5) * s);
      if (bx < 20 || bx > W - 20) continue;
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(bx, AXIS_Y - 54);
      ctx.lineTo(bx, AXIS_Y + 8);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    const occupied = new Set(
      (svdq ? NORMALS : [...NORMALS, outlier]).map((v) => Math.round(v / s))
    );
    occupied.forEach((k) => {
      const lo = vx((k - 0.5) * s);
      const hi = vx((k + 0.5) * s);
      ctx.fillStyle = 'rgba(34,141,92,0.10)';
      ctx.fillRect(lo, AXIS_Y - 54, hi - lo, 54);
    });

    // 主轴 + 可表示层级刻度
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, AXIS_Y);
    ctx.lineTo(W - 24, AXIS_Y);
    ctx.stroke();
    for (let k = -7; k <= 7; k++) {
      const lx = vx(k * s);
      if (lx < 20 || lx > W - 20) continue;
      ctx.strokeStyle = k === 0 ? C.ink : C.muted;
      ctx.lineWidth = k === 0 ? 2 : 1.5;
      ctx.beginPath();
      ctx.moveTo(lx, AXIS_Y - 5);
      ctx.lineTo(lx, AXIS_Y + 5);
      ctx.stroke();
    }
    text(ctx, '0', vx(0), AXIS_Y + 18, C.muted, 12, 'center');
    text(ctx, `+7s`, vx(7 * s), AXIS_Y + 18, C.muted, 12, 'center');
    text(ctx, `-7s`, vx(-7 * s), AXIS_Y + 18, C.muted, 12, 'center');

    // 正常值点 + 贴桶误差（横向红色线段 = 舍入距离）
    NORMALS.forEach((v, i) => {
      const q = qOf(v);
      const yDot = AXIS_Y - 22 - (i % 4) * 12;
      ctx.strokeStyle = 'rgba(33,50,74,0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(vx(v), yDot + 5);
      ctx.lineTo(vx(v), AXIS_Y - 10);
      ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.arc(vx(v), yDot, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(vx(v), AXIS_Y - 10);
      ctx.lineTo(vx(q), AXIS_Y - 10);
      ctx.stroke();
      ctx.fillStyle = C.red;
      ctx.fillRect(vx(q) - 1.5, AXIS_Y - 13, 3, 6);
    });

    // 离群值去向
    if (svdq) {
      rrectBox(ctx, 36, 26, 236, 52, 'rgba(124,58,237,0.08)', C.purple);
      text(ctx, `低秩分支（16-bit）`, 48, 44, C.purple, 14);
      text(ctx, `离群值 ${outlier.toFixed(1)} 被精确保留，不进入 4-bit 网格`, 48, 64, C.ink, 12);
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(272, 52);
      ctx.lineTo(vx(0) - 30, AXIS_Y - 70);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      const ox = vx(outlier);
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.arc(ox, AXIS_Y - 30, 10, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, `离群值 ${outlier.toFixed(1)}`, ox, AXIS_Y - 52, C.red, 14, 'center');
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(ox, AXIS_Y - 20);
      ctx.lineTo(ox, AXIS_Y - 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    text(
      ctx,
      `s = max|Z| / 7 = ${s.toFixed(3)}`,
      W - 36,
      40,
      svdq ? C.green : C.red,
      16,
      'right'
    );
    text(ctx, svdq ? 'SVDQuant 吸收后' : '无保护 4-bit', W - 36, 62, C.muted, 12, 'right');
  });

  const fb = svdq
    ? {
        t: `低秩分支以 16-bit 拎走离群值：步长从 ${sPlain.toFixed(3)} 收窄到 ${s.toFixed(3)}（×${(sPlain / sSvd).toFixed(1)}），正常值恢复 ${distinct}/16 层，最大误差降到 ±${maxErr.toFixed(2)}。`,
        c: 'good',
      }
    : m > 0.66
    ? {
        t: `离群值 ${outlier.toFixed(1)} 把步长拉到 ${s.toFixed(3)}——正常值挤进 ${distinct}/16 个桶，±${maxErr.toFixed(2)} 的误差在图像上就是细节糊掉。`,
        c: 'bad',
      }
    : m > 0.33
    ? {
        t: `步长开始被离群值主导：可分辨层级只剩 ${distinct}/16。离群值越大，正常值能用的层级越少。`,
        c: '',
      }
    : {
        t: `离群值还弱，${distinct}/16 个桶基本够用——但真实激活里的离群值比这大得多，见下一章的通道分布。`,
        c: 'good',
      };

  return (
    <div>
      <div className="svq-lab">
        <canvas ref={ref} width={W} height={H} />
        <div className="svq-side">
          <h6>实时读数</h6>
          <div className="svq-readout">
            <span>步长 s = max|Z|/7</span>
            <b className={svdq ? 'good' : 'bad'}>{s.toFixed(3)}</b>
          </div>
          <div className="svq-readout">
            <span>正常值可分辨层级</span>
            <b className={distinct <= 6 ? 'bad' : distinct >= 12 ? 'good' : ''}>
              {distinct} / 16 桶
            </b>
          </div>
          <div className="svq-readout">
            <span>最大量化误差</span>
            <b className={svdq ? 'good' : 'bad'}>±{maxErr.toFixed(3)}</b>
          </div>
          <div className="svq-readout">
            <span>离群值去向</span>
            <b className={svdq ? 'purple' : 'bad'}>{svdq ? '低秩分支 · 16-bit' : '主张量'}</b>
          </div>
          <h6>步长对比（越短越精细）</h6>
          <div className="svq-meter-row">
            <span>无保护</span>
            <div className="svq-meter">
              <i style={{ width: pctS(sPlain), background: C.red }} />
            </div>
            <b>{sPlain.toFixed(2)}</b>
          </div>
          <div className="svq-meter-row">
            <span>SVDQuant</span>
            <div className="svq-meter">
              <i style={{ width: pctS(sSvd), background: C.green }} />
            </div>
            <b>{sSvd.toFixed(2)}</b>
          </div>
        </div>
      </div>
      <div className="ctrl">
        <label>
          离群值大小 <span className="val">{outlier.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(m * 100)}
          onChange={(e) => setM(Number(e.target.value) / 100)}
        />
      </div>
      <div className="chip-row">
        <button className={`chip ${!svdq ? 'selected' : ''}`} onClick={() => setSvdq(false)}>
          无保护 4-bit
        </button>
        <button className={`chip ${svdq ? 'selected' : ''}`} onClick={() => setSvdq(true)}>
          SVDQuant 吸收
        </button>
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
      <p className="concept-note">
        <b>读图方式：</b>绿点 = 正常值真实位置，红色横线 = 被舍入到最近桶的「贴桶距离」。
        对称 INT4 的步长由最大绝对值决定，所以一个离群值就决定整张量化表的粗细。图中数值为示意数据，
        步长机制与「离群值集中在少数通道」为论文结论。
      </p>
    </div>
  );
};

// 带填充的说明框
function rrectBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  stroke: string
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export default Ch1Bench;
