import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

const W = 560;
const H = 290;

const NODES = [
  { name: '观察', color: C.blue, detail: '读取当前 RGB（或 RGB-D）观测，并结合指令与历史。', r2r: 'R2R-CE：RGB 历史 + 语言指令；ObjectNav：RGB-D + 目标类别。' },
  { name: '记忆/推理', color: C.orange, detail: '更新历史与空间状态，判断当前在哪、离目标多远、下一步做什么。', r2r: '同一模型既预测动作块，也评估是否到达终点。' },
  { name: '动作块', color: C.purple, detail: '输出有限视界的低层动作，如前进、左转、右转或停止。', r2r: '执行后环境返回新观测，再交给同一模型继续查询。' },
  { name: '验证停止', color: C.green, detail: '只有确认进入目标区域才输出 stop，避免早停或错过终点。', r2r: '可靠的终止判断带来更高 SR 与更低 NE。' },
];

export const NavLoopmap: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sel: 0 });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const pos = [
      { x: 280, y: 70 }, { x: 452, y: 170 }, { x: 280, y: 250 }, { x: 108, y: 170 },
    ];
    const render = (s: { sel: number }, t: number) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      label(ctx, '闭环导航回路', W / 2, 20, 13, C.ink);
      // ring
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(280, 160, 108, 0, Math.PI * 2);
      ctx.stroke();
      // moving pulse
      const ang = (t * 0.7) % (Math.PI * 2);
      const px = 280 + Math.cos(ang) * 108;
      const py = 160 + Math.sin(ang) * 108;
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      // nodes
      NODES.forEach((n, i) => {
        const p = pos[i];
        const selected = i === s.sel;
        ctx.fillStyle = selected ? n.color : '#ffffff';
        ctx.strokeStyle = selected ? n.color : C.axis;
        ctx.lineWidth = selected ? 5 : 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = selected ? '#ffffff' : C.ink;
        label(ctx, n.name, p.x, p.y, 11, selected ? '#ffffff' : n.color);
      });
      // metric cards
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(36, 230, 220, 40);
      ctx.strokeStyle = C.green;
      ctx.strokeRect(36, 230, 220, 40);
      label(ctx, 'R2R-CE SR 57.9 · SPL 54.2', 146, 250, 10, C.green);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(304, 230, 220, 40);
      ctx.strokeStyle = C.orange;
      ctx.strokeRect(304, 230, 220, 40);
      label(ctx, 'ObjectNav SR 38.3 · SPL 11.2', 414, 250, 10, C.orange);
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
    const pos = [
      { x: 280, y: 70 }, { x: 452, y: 170 }, { x: 280, y: 250 }, { x: 108, y: 170 },
    ];
    pos.forEach((p, i) => {
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
      <div className="feedback good">
        <b>{NODES[sel].name}：</b>{NODES[sel].detail} {NODES[sel].r2r}
      </div>
    </div>
  );
};

export default NavLoopmap;
