import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

const W = 800;
const H = 280;

const RULES = [
  { name: '参数可比', color: C.blue, short: '只和相近激活参数模型排名', detail: 'Qwen3.6-A3B、Embodied-R1.5 8B 属于同一档；Cosmos3-Nano 的 VLM 组件也是 8B。A30B 只作参考，不参与第一/第二统计。' },
  { name: '统一重评', color: C.orange, short: '所有基线由作者独立重评', detail: 'Qwen、Embodied-R1.5、Cosmos 都在同一评测管线上跑，因此分数可能不同于它们原论文。' },
  { name: '推理模式', color: C.purple, short: 'thinking / non-thinking 分别记录', detail: 'Embodied-R1.5 只有 Instruct；Cosmos3-Nano 开 thinking 会明显变差，所以报告 non-thinking；其余用 thinking。' },
  { name: '指标方向', color: C.green, short: '所有分数统一为越高越好', detail: '每个 benchmark 按官方协议评测，并把指标统一换算成百分比形式。' },
  { name: '参考项', color: C.red, short: 'A30B 仅参考不参与排名', detail: '论文刻意把上一代大模型排除在排名外，避免“大模型当然更强”干扰对效率的结论。' },
];

export const ProtocolBoard: React.FC<WidgetProps> = () => {
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
      label(ctx, '成绩单检查清单：五条协议都满足，结论才成立', W / 2, 20, 13, C.ink);
      // clipboard
      ctx.fillStyle = '#fff8ee';
      ctx.fillRect(80, 48, 640, 190);
      ctx.strokeStyle = C.route;
      ctx.lineWidth = 4;
      ctx.strokeRect(80, 48, 640, 190);
      ctx.fillStyle = C.route;
      ctx.fillRect(320, 32, 160, 24);
      // rows
      RULES.forEach((r, i) => {
        const y = 70 + i * 32;
        const selected = i === s.sel;
        ctx.fillStyle = selected ? 'rgba(39,68,110,0.08)' : 'transparent';
        ctx.fillRect(96, y - 10, 608, 27);
        ctx.fillStyle = selected ? r.color : C.muted;
        ctx.beginPath();
        ctx.arc(122, y, 9, 0, Math.PI * 2);
        ctx.fill();
        label(ctx, '✓', 122, y, 10, '#ffffff');
        ctx.fillStyle = selected ? C.ink : C.muted;
        ctx.font = '13px "Segoe UI", "PingFang SC", Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(r.short, 148, y);
      });
      label(ctx, '点击清单项查看为什么', W / 2, 258, 11, C.muted);
    };
    const tick = () => { render(stateRef.current); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const hit = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    RULES.forEach((_, i) => {
      const ry = 70 + i * 32;
      if (x > 90 && x < 710 && y > ry - 12 && y < ry + 16) { stateRef.current.sel = i; setSel(i); }
    });
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} style={{ cursor: 'pointer' }} onPointerDown={hit} />
      <div className="chip-row">
        {RULES.map((r, i) => (
          <button key={r.name} className={i === sel ? 'chip selected' : 'chip'} onClick={() => { stateRef.current.sel = i; setSel(i); }}>{r.name}</button>
        ))}
      </div>
      <div className={`feedback ${sel === 4 ? 'bad' : 'good'}`}>
        <b>{RULES[sel].name}：</b>{RULES[sel].detail}
      </div>
    </div>
  );
};

export default ProtocolBoard;
