import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useCanvas } from './useCanvas';
import { C, SPIKES, clamp, clearScene, frame, grid, hist, inset, rrect, text } from './kit';

const W = 720;
const H = 260;
const CX = 232;
const CY = 128;
const R = 86;

const kurtosisAt = (deg: number) => 3 + 13 * Math.exp(-(((deg - 45) / 30) ** 2));

// ch2-rotate：P6 拖拽旋转框架，直方图重投影，输出差恒 0
export const Ch2Rotate: React.FC<WidgetProps> = () => {
  const [theta, setTheta] = useState(20);
  const dragging = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const deg = theta;
  const rad = (deg * Math.PI) / 180;
  const k = kurtosisAt(deg);

  const ref = useCanvas(W, H, (ctx) => {
    clearScene(ctx, W, H);
    grid(ctx, 20, 16, 436, 216, 28);

    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(rad);
    hist(ctx, SPIKES, -130, -62, 260, 78, C.blue, (i) =>
      i < 3 || i >= SPIKES.length - 3 ? C.red : null
    );
    ctx.restore();
    frame(ctx, CX, CY, R, rad, C.blue);
    text(ctx, `θ=${Math.round(deg)}°`, CX, CY + R + 24, C.blue, 14, 'center');

    // 读数面板
    inset(ctx, 470, 20, 234, 212);
    text(ctx, 'Y = XW = (XR)(RᵀW)', 587, 48, C.ink, 14, 'center');
    text(ctx, '输出差', 486, 84, C.muted, 13);
    text(ctx, '0.000', 690, 84, C.green, 18, 'right');
    text(ctx, 'kurtosis', 486, 118, C.muted, 13);
    text(ctx, k.toFixed(1), 690, 118, k < 5 ? C.green : C.ink, 18, 'right');
    text(ctx, '目标 ≈ 3（接近正态）', 587, 148, C.muted, 12, 'center');
    // mini kurtosis 条
    const kw = clamp((k - 3) / 15, 0, 1) * 180;
    rrect(ctx, 492, 166, 180, 10, C.bg, C.axis, 1, 4);
    ctx.fillStyle = k < 5 ? C.green : C.orange;
    ctx.beginPath();
    ctx.roundRect(492, 166, Math.max(3, 180 - kw), 10, 4);
    ctx.fill();
    text(ctx, '拖拽画布旋转 · ←→ 微调', 587, 208, C.muted, 11, 'center');
  });

  const angleFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current || ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    let a = (Math.atan2(py - CY, px - CX) * 180) / Math.PI;
    if (a < 0) a += 360;
    setTheta(clamp(a, 0, 90));
  };

  return (
    <div>
      <canvas
        ref={(node) => {
          ref.current = node;
          canvasRef.current = node;
        }}
        width={W}
        height={H}
        style={{ cursor: dragging.current ? 'grabbing' : 'grab', touchAction: 'none' }}
        tabIndex={0}
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
          angleFromEvent(e);
        }}
        onPointerMove={(e) => {
          if (dragging.current) angleFromEvent(e);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setTheta((v) => clamp(v - 2, 0, 90));
          if (e.key === 'ArrowRight') setTheta((v) => clamp(v + 2, 0, 90));
        }}
      />
      <div className={`feedback ${theta > 60 ? '' : 'good'}`}>
        {theta > 60
          ? `θ=${Math.round(theta)}°，输出差 0.000，kurtosis=${k.toFixed(1)}——尖峰已转到坐标轴附近`
          : `θ=${Math.round(theta)}°，输出差 0.000，kurtosis=${k.toFixed(1)}——随便转，全精度输出一个数都不变`}
      </div>
      <p className="sq-note">
        <b>读图方式：</b>直方图随框架一起旋转（分布形状在变），但 X·W 与 (X·R)(Rᵀ·W)
        数值恒等，所以「输出差」永远是 0。kurtosis 越接近 3 越好量化；
        R₁/R₁ᵀ 成对出现为论文 §3.1 结论，配图来自论文 Figure 5。
      </p>
    </div>
  );
};

export default Ch2Rotate;
