import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

const W = 800;
const H = 280;

const ITEMS = [
  { name: '问题', color: C.red, key: '三个动作中心问题', detail: '看懂可行动状态、预测动作后果、长程任务中持续纠错。' },
  { name: '分类法', color: C.blue, key: '三层能力', detail: '状态理解 68.6 · 动作转换 64.1 · 长程自适应 57.4。' },
  { name: '数据', color: C.orange, key: '七类新增 SFT', detail: '深度推理、任务条件接地/可供性、社会交互、物体/机器人轨迹、因果推理、失败感知机器人推理、视觉-语言导航；DAgger α=0.5。' },
  { name: '架构', color: C.green, key: '每 token 约 3B 参数参与计算', detail: 'Hy-ViT2 任意宽高比输入 + 轻量连接器 + Hy3-A3B；语言主干总参数约 30B，每 token 约 3B 参数参与计算。' },
  { name: '训练', color: C.purple, key: 'RL → RFT → RL', detail: '本文 GRPO 变体：G=16、裁剪 [0.8,1.35]；θ_rl 生成数据，RFT 从 θ_pt 重训约 100 万条筛选后 long-CoT；两个专门化模型并行训练后融合。' },
  { name: '评测', color: C.blue, key: '38 基准 + 闭环', detail: '总平均 65.6；R2R-CE SR 57.9；ObjectNav SR 38.3；结论有边界。' },
];

const POS = [
  { x: 160, y: 120 }, { x: 360, y: 70 }, { x: 560, y: 70 },
  { x: 690, y: 130 }, { x: 560, y: 200 }, { x: 360, y: 200 },
];

function drawHex(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export const SummaryHive: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sel: 0 });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const render = (s: { sel: number }, t: number) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      label(ctx, '五条贡献 + 一个问题 = 一个完整答案', W / 2, 20, 13, C.ink);
      // center connecting lines
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 3;
      POS.forEach((p) => {
        ctx.beginPath();
        ctx.moveTo(W / 2, 135);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      });
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(W / 2, 135, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      label(ctx, 'Hy', W / 2, 135, 13, C.green);
      ITEMS.forEach((it, i) => {
        const p = POS[i];
        const selected = i === s.sel;
        const r = selected ? 46 : 40;
        ctx.fillStyle = selected ? it.color : '#ffffff';
        ctx.strokeStyle = selected ? it.color : C.axis;
        ctx.lineWidth = selected ? 5 : 2.5;
        drawHex(ctx, p.x, p.y, r);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = selected ? '#ffffff' : C.ink;
        label(ctx, it.name, p.x, p.y - 8, 12, selected ? '#ffffff' : it.color);
        label(ctx, it.key, p.x, p.y + 12, 10, selected ? '#ffffff' : C.muted);
        if (selected) {
          const pulse = 1 + Math.sin(t * 4) * 0.04;
          ctx.strokeStyle = it.color;
          ctx.lineWidth = 2;
          drawHex(ctx, p.x, p.y, r * pulse + 4);
          ctx.stroke();
        }
      });
    };
    const tick = (now: number) => { render(stateRef.current, now / 1000); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const hit = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    POS.forEach((p, i) => {
      if (Math.hypot(x - p.x, y - p.y) < 52) { stateRef.current.sel = i; setSel(i); }
    });
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} style={{ cursor: 'pointer' }} onPointerDown={hit} />
      <div className="chip-row">
        {ITEMS.map((it, i) => (
          <button key={it.name} className={i === sel ? 'chip selected' : 'chip'} onClick={() => { stateRef.current.sel = i; setSel(i); }}>{it.name}</button>
        ))}
      </div>
      <div className={`feedback ${sel === 5 ? 'good' : ''}`}>
        <b>{ITEMS[sel].name} · {ITEMS[sel].key}：</b>{ITEMS[sel].detail}
      </div>
    </div>
  );
};

export default SummaryHive;
