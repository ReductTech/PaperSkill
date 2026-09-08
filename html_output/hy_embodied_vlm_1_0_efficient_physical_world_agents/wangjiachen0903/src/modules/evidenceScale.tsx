import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

const W = 560;
const H = 210;

const CLAIMS = [
  { id: 'overall', text: '38 项总平均 65.6，领先 Qwen3.6-A3B 4.4 分。', kind: '论文原话', cls: 'good', color: C.green, x: 110 },
  { id: 'eff', text: '只激活约 3B，就接近上一代 32B 激活模型水平。', kind: '论文原话', cls: 'good', color: C.green, x: 190 },
  { id: 'objectnav', text: 'ObjectNav 的差距主要来自模型语义探索与决策能力。', kind: '合理推断', cls: '', color: C.orange, x: 290 },
  { id: 'universal', text: '本文模型在所有具身任务上都优于所有模型。', kind: '需要更多证据', cls: 'bad', color: C.red, x: 410 },
];

export const EvidenceScale: React.FC<WidgetProps> = () => {
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
      label(ctx, '证据边界尺：区分原话、推断与过度泛化', W / 2, 20, 13, C.ink);
      // three zones
      ctx.fillStyle = 'rgba(34,141,92,0.10)';
      ctx.fillRect(40, 70, 170, 34);
      ctx.fillStyle = 'rgba(217,119,6,0.10)';
      ctx.fillRect(214, 70, 160, 34);
      ctx.fillStyle = 'rgba(196,63,82,0.10)';
      ctx.fillRect(378, 70, 140, 34);
      ctx.strokeStyle = C.axis;
      ctx.strokeRect(40, 70, 478, 34);
      label(ctx, '论文原话', 125, 87, 11, C.green);
      label(ctx, '合理推断', 294, 87, 11, C.orange);
      label(ctx, '需更多证据', 448, 87, 11, C.red);
      // claim markers
      CLAIMS.forEach((c, i) => {
        const selected = i === s.sel;
        ctx.fillStyle = selected ? c.color : '#ffffff';
        ctx.strokeStyle = selected ? c.color : C.axis;
        ctx.lineWidth = selected ? 4 : 2;
        ctx.beginPath();
        ctx.arc(c.x, 130, selected ? 12 : 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        label(ctx, `${i + 1}`, c.x, 130, 9, selected ? '#ffffff' : c.color);
      });
      label(ctx, '点击上方按钮查看每条结论的定位', W / 2, 162, 11, C.muted);
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
        {CLAIMS.map((c, i) => (
          <button key={c.id} className={i === sel ? 'chip selected' : 'chip'} onClick={() => { stateRef.current.sel = i; setSel(i); }}>{i + 1}</button>
        ))}
      </div>
      <div className={`feedback ${CLAIMS[sel].cls}`}>
        <b>{CLAIMS[sel].kind}：</b>{CLAIMS[sel].text}
      </div>
    </div>
  );
};

export default EvidenceScale;
