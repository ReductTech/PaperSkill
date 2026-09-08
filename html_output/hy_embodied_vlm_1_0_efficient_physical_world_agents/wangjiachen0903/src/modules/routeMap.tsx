import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

const W = 800;
const H = 260;

const NODES = [
  { name: '问题', color: C.red, key: '三个动作中心问题', detail: '物理世界智能体必须看懂状态、预测动作后果、在长程任务中持续纠错。' },
  { name: '分类法', color: C.blue, key: '三层能力语言', detail: '动作相关状态理解、动作-转移推理、序列与自适应推理，统一数据、训练与评测。' },
  { name: '数据', color: C.orange, key: '三层数据管线', detail: '预训练打基础，SFT 新增七类能力导向数据，RL 只保留可验证任务。' },
  { name: '架构', color: C.green, key: '每 token 约 3B 参数参与计算', detail: 'Hy-ViT2 任意宽高比输入 + 轻量连接器 + Hy3-A3B：语言主干约 30B 总参数，每 token 约 3B 参数参与计算。' },
  { name: '训练', color: C.purple, key: 'RL → RFT → RL', detail: 'GRPO 激发推理；θ_rl 只生成数据，RFT 从 θ_pt 重训内化约 100 万条筛选后 long-CoT；两个专门化模型并行训练后融合。' },
  { name: '评测', color: C.blue, key: '38 基准 + 闭环', detail: '38 基准平均 65.6；R2R-CE SR 57.9；零样本 ObjectNav SR 38.3。' },
  { name: '总结', color: C.green, key: '一条完整逻辑链', detail: '五条贡献环环相扣，最终合成一个高效、可部署、边界清楚的物理世界智能体。' },
];

const POS = [
  { x: 68, y: 188 }, { x: 178, y: 116 }, { x: 288, y: 198 },
  { x: 398, y: 112 }, { x: 508, y: 188 }, { x: 620, y: 118 }, { x: 730, y: 188 },
];

export const RouteMap: React.FC<WidgetProps> = () => {
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
      label(ctx, '论文路线图：三个问题 → 五条贡献 → 一个总结', W / 2, 20, 13, C.ink);
      // route path
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 6;
      ctx.beginPath();
      POS.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else {
          const prev = POS[i - 1];
          const mx = (prev.x + p.x) / 2;
          const my = (prev.y + p.y) / 2 + (i % 2 === 0 ? 34 : -34);
          ctx.quadraticCurveTo(mx, my, p.x, p.y);
        }
      });
      ctx.stroke();
      // moving train pulse along path
      const q = (t * 0.1) % 1;
      const seg = q * (POS.length - 1);
      const i0 = Math.min(POS.length - 2, Math.floor(seg));
      const a = POS[i0];
      const b = POS[i0 + 1];
      const qq = seg - i0;
      const px = a.x + (b.x - a.x) * qq;
      const py = a.y + (b.y - a.y) * qq + Math.sin(qq * Math.PI) * (i0 % 2 === 0 ? -30 : 30);
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      // nodes
      NODES.forEach((n, i) => {
        const p = POS[i];
        const selected = i === s.sel;
        ctx.fillStyle = selected ? n.color : '#ffffff';
        ctx.strokeStyle = selected ? n.color : C.axis;
        ctx.lineWidth = selected ? 5 : 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = selected ? '#ffffff' : C.ink;
        label(ctx, n.name, p.x, p.y, 11, selected ? '#ffffff' : n.color);
        label(ctx, n.key, p.x, p.y + (p.y < 150 ? 40 : -40), 10, selected ? n.color : C.muted);
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
      if (Math.hypot(x - p.x, y - p.y) < 34) { stateRef.current.sel = i; setSel(i); }
    });
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} style={{ cursor: 'pointer' }} onPointerDown={hit} />
      <div className="chip-row">
        {NODES.map((n, i) => (
          <button key={n.name} className={i === sel ? 'chip selected' : 'chip'} onClick={() => { stateRef.current.sel = i; setSel(i); }}>{n.name}</button>
        ))}
      </div>
      <div className={`feedback ${sel === 6 ? 'good' : ''}`}>
        <b>{NODES[sel].name} · {NODES[sel].key}：</b>{NODES[sel].detail}
      </div>
    </div>
  );
};

export default RouteMap;
