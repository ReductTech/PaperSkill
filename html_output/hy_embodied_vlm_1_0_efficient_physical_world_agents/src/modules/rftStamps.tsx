import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

const W = 800;
const H = 280;

const GATES = [
  { name: '奖励阈值', color: C.green, tag: '条件 1', detail: '最终答案达到该任务类型的可验证奖励阈值 R_τ(y,y*) ≥ η_τ。连续奖励“达到阈值”不等于绝对正确。' },
  { name: 'Critic 质量', color: C.blue, tag: '条件 2', detail: 'LLM critic 检查推理连贯、无重复、视觉依据充分。它是代理评价器，不是客观真值。' },
  { name: '候选一致性', color: C.orange, tag: '条件 3', detail: '在多次采样候选之间比较最终答案；论文未详述一致性的具体规则，连续输出不可能用字符串相等。' },
];

export const RftStamps: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sel: 0 });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const xs = [150, 400, 650];
    const render = (s: { sel: number }, t: number) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      label(ctx, 'RFT 三个互补筛选条件（不是固定顺序硬关卡）', W / 2, 20, 13, C.ink);
      // belt line
      ctx.strokeStyle = C.route;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(40, 216);
      ctx.lineTo(760, 216);
      ctx.stroke();
      // moving trajectory card to selected gate
      const target = xs[s.sel];
      const cx = 40 + ((t * 0.28) % 1) * (target - 40);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 2;
      ctx.fillRect(cx - 30, 196, 60, 40);
      ctx.strokeRect(cx - 30, 196, 60, 40);
      label(ctx, '候选轨迹', cx, 216, 10, C.purple);
      // gates
      GATES.forEach((g, i) => {
        const x = xs[i];
        const selected = i === s.sel;
        ctx.fillStyle = selected ? g.color : '#ffffff';
        ctx.strokeStyle = selected ? g.color : C.axis;
        ctx.lineWidth = selected ? 5 : 2.5;
        ctx.beginPath();
        ctx.moveTo(x - 62, 70);
        ctx.lineTo(x + 62, 70);
        ctx.lineTo(x + 62, 178);
        ctx.lineTo(x - 62, 178);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // gate posts
        ctx.strokeStyle = selected ? g.color : C.axis;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x - 40, 178);
        ctx.lineTo(x - 40, 216);
        ctx.moveTo(x + 40, 178);
        ctx.lineTo(x + 40, 216);
        ctx.stroke();
        ctx.fillStyle = selected ? '#ffffff' : g.color;
        label(ctx, g.tag, x, 96, 11, selected ? '#ffffff' : g.color);
        label(ctx, g.name, x, 124, 13, selected ? '#ffffff' : g.color);
        // stamp mark when selected
        if (selected) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, 154, 12, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x - 6, 154);
          ctx.lineTo(x - 1, 159);
          ctx.lineTo(x + 8, 148);
          ctx.stroke();
        }
      });
      label(ctx, 'best-of-4 是候选采样数 · 一致性是候选间比较 · 二者不同', W / 2, 250, 11, C.muted);
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
    const xs = [150, 400, 650];
    xs.forEach((gx, i) => {
      if (x > gx - 66 && x < gx + 66 && y > 66 && y < 220) { stateRef.current.sel = i; setSel(i); }
    });
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} style={{ cursor: 'pointer' }} onPointerDown={hit} />
      <div className="chip-row">
        {GATES.map((g, i) => (
          <button key={g.name} className={i === sel ? 'chip selected' : 'chip'} onClick={() => { stateRef.current.sel = i; setSel(i); }}>{g.name}</button>
        ))}
      </div>
      <div className="feedback good">
        <b>{GATES[sel].tag} · {GATES[sel].name}：</b>{GATES[sel].detail}
      </div>
    </div>
  );
};

export default RftStamps;
