import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

const W = 560;
const H = 280;
const TOKENS = [
  { id: 'vision', name: '视觉 token（示意）', y: 70, color: C.blue, experts: [1, 4] },
  { id: 'text', name: '文本 token（示意）', y: 140, color: C.orange, experts: [2, 6] },
  { id: 'act', name: '生成 token（示意）', y: 210, color: C.purple, experts: [0, 5] },
];
const EXPERT_X = 420;
const EXPERT_GAP = 14;
const EXPERT_W = 9;

export const MoeFibers: React.FC<WidgetProps> = () => {
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
      label(ctx, 'Hy3-A3B 稀疏路由（概念示意）', W / 2, 20, 13, C.ink);
      // router
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(200, 140, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 3;
      ctx.stroke();
      label(ctx, '路由器（每层）', 200, 140, 11, C.orange);
      // token nodes
      TOKENS.forEach((tk, i) => {
        const selected = i === s.sel;
        ctx.fillStyle = selected ? tk.color : '#ffffff';
        ctx.strokeStyle = selected ? tk.color : C.axis;
        ctx.lineWidth = selected ? 4 : 2;
        ctx.beginPath();
        ctx.arc(48, tk.y, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = selected ? '#ffffff' : C.ink;
        label(ctx, tk.name, 100, tk.y, 10, selected ? tk.color : C.muted);
      });
      // fibers from selected token to router then experts
      const selected = TOKENS[s.sel];
      ctx.strokeStyle = selected.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(64, selected.y);
      ctx.quadraticCurveTo(128, selected.y, 200, 140);
      ctx.stroke();
      // all expert bars
      for (let i = 0; i < 8; i += 1) {
        const x = EXPERT_X + i * EXPERT_GAP;
        const active = selected.experts.includes(i);
        const pulse = active ? 0.8 + 0.2 * Math.sin(t * 4 + i) : 1;
        ctx.fillStyle = active ? selected.color : C.axis;
        ctx.globalAlpha = active ? pulse : 0.5;
        ctx.beginPath();
        ctx.roundRect(x, 74, EXPERT_W, 132, 4);
        ctx.fill();
        ctx.globalAlpha = 1;
        if (active) {
          ctx.strokeStyle = selected.color;
          ctx.lineWidth = 2;
          ctx.strokeRect(x, 74, EXPERT_W, 132);
          // fiber from router to active expert
          ctx.strokeStyle = selected.color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(224, 140);
          ctx.quadraticCurveTo(320, 140, x + EXPERT_W / 2, 140);
          ctx.stroke();
        }
        label(ctx, `E${i + 1}`, x + EXPERT_W / 2, 220, 8, active ? selected.color : C.muted);
      }
      label(ctx, `当前 token → E${selected.experts[0] + 1} + E${selected.experts[1] + 1}（示意编号）`, W / 2, H - 22, 11, selected.color);
      label(ctx, '约 3B 参数参与计算 / 约 30B 总参数', W / 2, 42, 11, C.muted);
    };
    const tick = (now: number) => { render(stateRef.current, now / 1000); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const choose = (i: number) => { stateRef.current.sel = i; setSel(i); };
  const hit = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    TOKENS.forEach((tk, i) => {
      if (Math.hypot(x - 48, y - tk.y) < 26) choose(i);
    });
  };

  const s = TOKENS[sel];
  return (
    <div>
      <canvas ref={ref} width={W} height={H} style={{ cursor: 'pointer' }} onPointerDown={hit} />
      <div className="chip-row">
        {TOKENS.map((tk, i) => (
          <button key={tk.id} className={i === sel ? 'chip selected' : 'chip'} onClick={() => choose(i)}>{tk.name}</button>
        ))}
      </div>
      <div className="feedback good">
        本图仅为 Top-k 稀疏路由概念示意：论文未披露专家总数、每 token 激活专家数、专家编号或模态分工。{s.name} 经过少量专家支路；语言主干总参数约 30B，每个 token 约 3B 参数参与计算，但实际 FLOPs、显存与延迟还取决于序列长度、视觉 token 数和部署实现。实际 MoE 通常在多个层分别路由，这里只抽象展示其中一层。
      </div>
    </div>
  );
};

export default MoeFibers;
