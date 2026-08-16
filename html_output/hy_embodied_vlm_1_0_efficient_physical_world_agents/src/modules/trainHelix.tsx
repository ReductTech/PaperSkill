import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

const W = 800;
const H = 320;

const NODES = [
  { name: 'θ_pt', title: '具身预训练', color: C.blue, detail: '所有后期阶段的干净起点；RFT 会回到这里重新训练，而不是从 θ_rl 继续微调。' },
  { name: 'θ_sft', title: '中期训练 + SFT', color: C.blue, detail: '广泛能力覆盖 + 少量思维链冷启动，得到 Stage-I RL 的起点。' },
  { name: 'θ_rl', title: 'Stage-I RL', color: C.orange, detail: '激发真正推理；在后续流程中主要作为数据生成器，其参数不直接继承给 θ_cons。' },
  { name: 'D_CoT', title: '拒绝采样数据', color: C.green, detail: 'θ_rl best-of-4 生成候选，经奖励阈值、critic、一致性筛选，得到约 100 万条 long-CoT。' },
  { name: 'θ_cons', title: 'RFT 内化', color: C.green, detail: '从 θ_pt + D_CoT + 混合数据重训，把推理内化回较干净的检查点。' },
  { name: 'θ_cont', title: '连续奖励专门化', color: C.purple, detail: '从 θ_cons 并行训练；专注几何、轨迹、深度与度量精度。它不是 MoE 架构内部专家。' },
  { name: 'θ_disc', title: '离散奖励专门化', color: C.purple, detail: '从 θ_cons 并行训练；专注决策、规划、反思与导航方向。它不是 MoE 架构内部专家。' },
  { name: 'θ_final', title: '参数融合部署', color: C.green, detail: '合并 θ_cont 与 θ_disc 得到部署模型；融合系数论文未披露，效果仍需融合消融与评测确认。' },
];

const POS = [
  { x: 88, y: 238 }, { x: 224, y: 238 }, { x: 360, y: 238 }, { x: 496, y: 238 },
  { x: 496, y: 78 }, { x: 360, y: 46 }, { x: 224, y: 46 }, { x: 88, y: 142 },
];

interface Edge { a: number; b: number; kind: 'param' | 'data'; label?: string; labelPos?: { x: number; y: number } }
const EDGES: Edge[] = [
  { a: 0, b: 1, kind: 'param' },
  { a: 1, b: 2, kind: 'param' },
  { a: 2, b: 3, kind: 'data', label: '生成候选 → 筛选', labelPos: { x: 428, y: 254 } },
  { a: 0, b: 4, kind: 'data', label: '(θ_pt + D_CoT) 重训', labelPos: { x: 268, y: 170 } },
  { a: 3, b: 4, kind: 'data', label: '', labelPos: { x: 510, y: 154 } },
  { a: 4, b: 5, kind: 'param', label: '并行', labelPos: { x: 436, y: 54 } },
  { a: 4, b: 6, kind: 'param', label: '并行', labelPos: { x: 340, y: 54 } },
  { a: 5, b: 7, kind: 'param' },
  { a: 6, b: 7, kind: 'param', label: '融合', labelPos: { x: 140, y: 84 } },
];

function drawArrow(ctx: CanvasRenderingContext2D, a: {x:number;y:number}, b: {x:number;y:number}, color: string, dashed = false): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  if (dashed) ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.setLineDash([]);
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const hx = b.x - Math.cos(ang) * 22;
  const hy = b.y - Math.sin(ang) * 22;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(hx + Math.cos(ang) * 9, hy + Math.sin(ang) * 9);
  ctx.lineTo(hx + Math.cos(ang + 2.4) * 7, hy + Math.sin(ang + 2.4) * 7);
  ctx.lineTo(hx + Math.cos(ang - 2.4) * 7, hy + Math.sin(ang - 2.4) * 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export const TrainHelix: React.FC<WidgetProps> = () => {
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
      label(ctx, '多阶段训练流程：实线 = 参数继承，虚线 = 数据依赖', W / 2, 20, 13, C.ink);
      // edges
      EDGES.forEach((e) => {
        const a = POS[e.a];
        const b = POS[e.b];
        const active = e.a === s.sel || e.b === s.sel;
        const color = e.kind === 'param' ? (active ? C.orange : C.axis) : (active ? C.green : C.muted);
        drawArrow(ctx, a, b, color, e.kind === 'data');
        if (e.label && e.labelPos) label(ctx, e.label, e.labelPos.x, e.labelPos.y, 9, color);
      });
      NODES.forEach((n, i) => {
        const p = POS[i];
        const selected = i === s.sel;
        const pulse = selected ? 1 + Math.sin(t * 5) * 0.07 : 1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = selected ? n.color : '#ffffff';
        ctx.strokeStyle = selected ? n.color : C.axis;
        ctx.lineWidth = selected ? 5 : 2;
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = selected ? '#ffffff' : C.ink;
        label(ctx, n.name, 0, 0, 10, selected ? '#ffffff' : n.color);
        ctx.restore();
        label(ctx, n.title, p.x, p.y + 40, 9, selected ? n.color : C.muted);
      });
      label(ctx, 'θ_rl → θ_cons 不是参数继承，而是数据生成', W / 2, H - 14, 11, C.muted);
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
      <div className={`feedback ${sel === 7 ? 'good' : ''}`}>
        <b>{NODES[sel].title}：</b>{NODES[sel].detail}
      </div>
    </div>
  );
};

export default TrainHelix;
