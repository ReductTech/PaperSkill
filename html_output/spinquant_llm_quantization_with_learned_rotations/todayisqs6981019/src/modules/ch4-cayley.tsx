import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useCanvas } from './useCanvas';
import { C, clamp, clearScene, grid, inset, rrect, text } from './kit';

const W = 720;
const H = 260;
const CX = 232;
const CY = 128;
const R = 88;
const HIT = 16;

type Pt = { x: number; y: number };
const onCircle = (a: number): Pt => ({ x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) });

// ch4-cayley：P6 拖拽动点，松手后投影回圆（Stiefel 流形二维示意）
export const Ch4Cayley: React.FC<WidgetProps> = () => {
  const [pt, setPt] = useState<Pt>(onCircle(Math.PI / 4));
  const [phase, setPhase] = useState<'idle' | 'drag' | 'snap'>('idle');
  const anim = useRef<{ fx: number; fy: number; tx: number; ty: number; t0: number } | null>(null);

  const dx = pt.x - CX;
  const dy = pt.y - CY;
  const dist = Math.hypot(dx, dy);
  const off = Math.abs(dist - R);

  const ref = useCanvas(W, H, (ctx, t) => {
    clearScene(ctx, W, H);
    grid(ctx, 20, 16, 436, 216, 28);

    // 流形圆
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.stroke();

    // 当前绘制点（snap 动画期间插值）
    let drawPt = pt;
    const a = anim.current;
    if (a) {
      const k = clamp((performance.now() - a.t0) / 300, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      drawPt = { x: a.fx + (a.tx - a.fx) * e, y: a.fy + (a.ty - a.fy) * e };
    }

    // 投影线（拖拽偏离时）
    const ddx = drawPt.x - CX;
    const ddy = drawPt.y - CY;
    const dd = Math.hypot(ddx, ddy) || 1;
    const proj = onCircle(Math.atan2(ddy, ddx));
    if (phase === 'drag' && Math.abs(dd - R) > 2) {
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(drawPt.x, drawPt.y);
      ctx.lineTo(proj.x, proj.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.purple;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 轨迹残影
    for (let k2 = 1; k2 <= 8; k2++) {
      const ta = Math.atan2(ddy, ddx) - k2 * 0.05;
      ctx.globalAlpha = 0.25 * (1 - k2 / 8);
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(CX + dd * Math.cos(ta), CY + dd * Math.sin(ta), 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 动点：偏离越远描边越粗越红
    const heat = clamp(off / 60, 0, 1);
    ctx.fillStyle = C.orange;
    ctx.strokeStyle = heat > 0.15 ? C.red : C.green;
    ctx.lineWidth = 2 + heat * 4;
    ctx.beginPath();
    ctx.arc(drawPt.x, drawPt.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    text(ctx, '流形（示意）', CX, CY + R + 26, C.blue, 13, 'center');

    // 读数面板
    inset(ctx, 470, 20, 234, 212);
    text(ctx, 'R′ᵀR′', 486, 62, C.muted, 14);
    text(ctx, off < 1 ? '= I ✓' : `− ${(off / 400).toFixed(3)}`, 690, 62, off < 1 ? C.green : C.red, 17, 'right');
    text(ctx, '偏离', 486, 96, C.muted, 14);
    text(ctx, off.toFixed(2), 690, 96, off < 1 ? C.green : C.red, 17, 'right');
    const barW = clamp(off / 60, 0, 1) * 180;
    rrect(ctx, 492, 116, 180, 10, C.bg, C.axis, 1, 4);
    if (barW > 1) {
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.roundRect(492, 116, barW, 10, 4);
      ctx.fill();
    }
    text(ctx, '拖动点=普通 SGD', 587, 152, C.muted, 12, 'center');
    text(ctx, '松手=Cayley 投影', 587, 174, C.muted, 12, 'center');
    text(ctx, '每步更新保持正交', 587, 206, off < 1 ? C.green : C.orange, 13, 'center');
  });

  const movePt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = clamp(e.clientX - rect.left, 30, 452);
    const py = clamp(e.clientY - rect.top, 24, 232);
    setPt({ x: px, y: py });
  };

  return (
    <div>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{ cursor: phase === 'drag' ? 'grabbing' : 'grab', touchAction: 'none' }}
        tabIndex={0}
        onKeyDown={(e) => {
          const a = Math.atan2(pt.y - CY, pt.x - CX);
          if (e.key === 'ArrowLeft') setPt(onCircle(a - 0.05));
          if (e.key === 'ArrowRight') setPt(onCircle(a + 0.05));
        }}
        onPointerDown={(e) => {
          anim.current = null;
          setPhase('drag');
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
          const canvas = ref.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          const px = e.clientX - rect.left;
          const py = e.clientY - rect.top;
          if (Math.hypot(px - pt.x, py - pt.y) < HIT + 8) setPt({ x: px, y: py });
        }}
        onPointerMove={(e) => {
          if (phase === 'drag') movePt(e);
        }}
        onPointerUp={() => {
          const ndx = pt.x - CX;
          const ndy = pt.y - CY;
          const nd = Math.hypot(ndx, ndy) || 1;
          const target = onCircle(Math.atan2(ndy, ndx));
          if (Math.abs(nd - R) > 4) {
            anim.current = { fx: pt.x, fy: pt.y, tx: target.x, ty: target.y, t0: performance.now() };
            setPhase('snap');
            window.setTimeout(() => {
              setPt(target);
              anim.current = null;
              setPhase('idle');
            }, 320);
          } else {
            setPt(target);
            setPhase('idle');
          }
        }}
      />
      <div className={`feedback ${off < 1 ? 'good' : phase === 'snap' ? 'good' : phase === 'drag' ? 'bad' : 'good'}`}>
        {phase === 'drag' && off > 4
          ? `偏离 ${off.toFixed(2)}——普通 SGD 会这样滑出正交空间`
          : phase === 'snap'
          ? 'Cayley 把它拉回来：更新沿流形滚动，R′ᵀR′=I'
          : `R′ᵀR′=I ✓，偏离 ${off.toFixed(2)}——每一步都踩在流形上`}
      </div>
      <p className="sq-note">
        <b>读图方式：</b>圆 = Stiefel 流形的二维示意（真实是高维正交矩阵集合），橙点 = 当前
        R，紫线 = Cayley 投影方向。Cayley 变换定义来自论文 §3.2（Li et al., 2020）；
        「投影动量 SGD + 每 100 步 QR 重正交化」为源码核实口径，非论文原文。
      </p>
    </div>
  );
};

export default Ch4Cayley;
