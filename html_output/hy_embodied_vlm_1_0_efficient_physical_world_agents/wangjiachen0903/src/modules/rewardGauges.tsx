import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

const W = 560;
const H = 286;

const TYPES = [
  { id: 'iou', name: '检测框（单框示意）', color: C.green, value: 0.72, formula: 'R = IoU(b, b*)', note1: '单目标简化示例；', note2: '多框是 Hungarian-IoU × 数量惩罚。' },
  { id: 'point', name: '点定位', color: C.orange, value: 0.62, formula: 'R = max(0, 1 − d/200)', note1: '单点距离衰减示例；', note2: '多点接触区域用 Chamfer。' },
  { id: 'traj', name: '轨迹', color: C.purple, value: 0.58, formula: 'R = max(0, 1 − 2·d_F)', note1: '长度归一化离散 Fréchet，越小越好；', note2: '转换成 0–1 奖励，3D 再加 30% 深度项。' },
  { id: 'reg', name: '连续回归', color: C.blue, value: 0.66, formula: 'R = max(0, 1 − 2|p−p*| / (|p*|+ε))', note1: '尺寸、距离等连续量；', note2: '用平滑相对误差奖励。' },
  { id: 'lcs', name: '排序', color: C.route, value: 0.80, formula: 'R = LCS(ŷ, y*) / |y*|', note1: '步骤顺序不必全对；', note2: '最长公共子序列给部分分。' },
  { id: 'judge', name: '开放回答', color: C.red, value: 0.5, formula: 'R = J(q,y,y*) ∈ {0,1}', note1: '开放式主要用裁判，解析失败也可调用；', note2: '裁判服务失败才掩码。' },
];

export const RewardGauges: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sel: 0 });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const render = (s: { sel: number }) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      label(ctx, '奖励仪表：一类输出配一把尺', W / 2, 20, 13, C.ink);
      const t = TYPES[s.sel];
      const gx = 150;
      const gy = 152;
      const gr = 82;
      // background arc
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.arc(gx, gy, gr, Math.PI, Math.PI * 2);
      ctx.stroke();
      // value arc
      ctx.strokeStyle = t.color;
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.arc(gx, gy, gr, Math.PI, Math.PI + t.value * Math.PI);
      ctx.stroke();
      // needle
      const a = Math.PI + t.value * Math.PI;
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + Math.cos(a) * (gr - 10), gy + Math.sin(a) * (gr - 10));
      ctx.stroke();
      ctx.fillStyle = C.ink;
      ctx.beginPath();
      ctx.arc(gx, gy, 6, 0, Math.PI * 2);
      ctx.fill();
      label(ctx, t.name, gx, gy + 34, 12, t.color);
      label(ctx, t.value.toFixed(2), gx, gy - 18, 14, t.color);
      // right panel formula
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(270, 50, 260, 150);
      ctx.strokeStyle = C.axis;
      ctx.strokeRect(270, 50, 260, 150);
      label(ctx, '当前奖励函数', 400, 68, 12, C.ink);
      ctx.fillStyle = C.ink;
      ctx.font = '14px "Segoe UI", "PingFang SC", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.formula, 400, 96);
      ctx.fillStyle = C.muted;
      ctx.font = '11px "Segoe UI", "PingFang SC", Arial, sans-serif';
      ctx.fillText(t.note1, 400, 132);
      ctx.fillText(t.note2, 400, 154);
      label(ctx, '规则优先 · 裁判兜底 · 仍需反投机抽检', 400, 216, 11, C.muted);
    };
    const tick = () => { render(stateRef.current); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="chip-row">
        {TYPES.map((t, i) => (
          <button key={t.id} className={i === sel ? 'chip selected' : 'chip'} onClick={() => { stateRef.current.sel = i; setSel(i); }}>{t.name}</button>
        ))}
      </div>
      <div className={`feedback ${sel === 5 ? 'bad' : 'good'}`}>
        {TYPES[sel].note1}{TYPES[sel].note2}
      </div>
    </div>
  );
};

export default RewardGauges;
