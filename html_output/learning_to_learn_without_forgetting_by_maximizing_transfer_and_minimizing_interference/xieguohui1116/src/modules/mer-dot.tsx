import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';

const W = 800;
const H = 560;
const GREEN = '#228d5c';
const RED = '#c43f52';
const BLUE = '#27446e';
const ORANGE = '#f07e47';
const INK = '#21324a';
const MUTED = '#68778f';
const LINE = '#d7deea';
const BG = '#f5f8f0';

export function MerDot() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [a1, setA1] = useState(0);
  const [a2, setA2] = useState(100);
  const drag = useRef(0);

  const cx = 300, cy = 300, r = 150;

  const dot = Math.cos(((a2 - a1) * Math.PI) / 180);

  const pos = (c: HTMLCanvasElement, e: React.PointerEvent) => {
    const rect = c.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) * W) / rect.width, y: ((e.clientY - rect.top) * H) / rect.height };
  };

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = setupCanvas(c, W, H);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    const tip = (a: number) => ({ x: cx + r * Math.cos((a * Math.PI) / 180), y: cy - r * Math.sin((a * Math.PI) / 180) });

    // circle grid
    ctx.strokeStyle = '#eef2f7';
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (r / 3) * i, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = LINE;
    ctx.beginPath();
    ctx.moveTo(cx - r - 30, cy);
    ctx.lineTo(cx + r + 30, cy);
    ctx.moveTo(cx, cy - r - 30);
    ctx.lineTo(cx, cy + r + 30);
    ctx.stroke();

    // arrow i (blue) and j (orange)
    const drawArrow = (a: number, color: string, label: string) => {
      const p = tip(a);
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      // arrowhead
      const ang = (a * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 16 * Math.cos(ang - 0.4), p.y + 16 * Math.sin(ang - 0.4));
      ctx.lineTo(p.x - 16 * Math.cos(ang + 0.4), p.y + 16 * Math.sin(ang + 0.4));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      // label at tip
      ctx.fillStyle = color;
      ctx.font = 'bold 22px "Segoe UI", "PingFang SC", sans-serif';
      const lx = cx + (r + 34) * Math.cos(ang), ly = cy - (r + 34) * Math.sin(ang);
      ctx.fillText(label, lx - 16, ly + 8);
    };
    drawArrow(a1, BLUE, '∂Lᵢ');
    drawArrow(a2, ORANGE, '∂Lⱼ');

    // angle arc
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 44, (-a2 * Math.PI) / 180, (-a1 * Math.PI) / 180, a1 > a2);
    ctx.stroke();
    const aMid = ((a1 + a2) / 2 * Math.PI) / 180;
    ctx.fillStyle = INK;
    ctx.font = '20px "Segoe UI", "PingFang SC", sans-serif';
    ctx.fillText(`${Math.round(Math.abs(a1 - a2))}°`, cx + 60 * Math.cos(aMid), cy - 60 * Math.sin(aMid));
  }, [a1, a2]);

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = ref.current!;
    const p = pos(c, e);
    const tip = (a: number) => ({ x: cx + r * Math.cos((a * Math.PI) / 180), y: cy - r * Math.sin((a * Math.PI) / 180) });
    const d1 = Math.hypot(p.x - tip(a1).x, p.y - tip(a1).y);
    const d2 = Math.hypot(p.x - tip(a2).x, p.y - tip(a2).y);
    drag.current = d1 < 46 ? 1 : d2 < 46 ? 2 : 0;
    if (drag.current) c.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current) return;
    const c = ref.current!;
    const p = pos(c, e);
    const ang = Math.round((Math.atan2(cy - p.y, p.x - cx) * 180) / Math.PI);
    if (drag.current === 1) setA1(ang);
    else setA2(ang);
  };

  const verdict = dot > 0.02 ? '迁移：学 i 会帮到 j' : dot < -0.02 ? '干扰：学 i 会伤害 j' : '接近正交：几乎互不影响';

  return (
    <div style={{ display: 'flex', gap: 24, width: '100%', height: '100%', alignItems: 'center' }}>
      <canvas ref={ref} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={() => (drag.current = 0)} style={{ touchAction: 'none', cursor: 'grab' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
        <div style={{ fontSize: 34, color: INK, fontWeight: 700 }}>拖动两个箭头改变夹角</div>
        <div style={{ fontSize: 44, fontWeight: 800, color: INK, fontFamily: 'Consolas, monospace', lineHeight: 1.2 }}>
          ∂L<sub>i</sub> · ∂L<sub>j</sub> = {dot.toFixed(2)}
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, color: dot > 0 ? GREEN : dot < 0 ? RED : INK }}>{verdict}</div>
        <p style={{ fontSize: 26, color: MUTED, margin: 0, lineHeight: 1.5 }}>
          一步 SGD：θ ← θ − η·∂L<sub>i</sub> 后，样本 j 的损失近似变化 <b style={{ color: INK }}>ΔLⱼ ≈ −η (∂Lᵢ·∂Lⱼ)</b>。点积为正 → Lⱼ 下降（迁移）；为负 → Lⱼ 上升（干扰）。
        </p>
        <div style={{ fontSize: 26, color: BLUE, background: '#eef3fb', borderRadius: 12, padding: 12 }}>
          论文 Eq.1/2 正是用这个点积的符号来操作性定义迁移与干扰——这是全文最重要的出发点。
        </div>
      </div>
    </div>
  );
}
