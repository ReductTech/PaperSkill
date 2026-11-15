import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { SC, clearStudio, label, arrowLine, barH, toLocal, print, mix } from './studio-kit';
import type { WidgetProps } from './registry';

// Module 4.1 Gradient steering dial. Drag the blue arrow (direction of g_t);
// the right side decomposes Delta L_v under demo assumptions ||g||=1, H_v=I, eta=0.1.
const W = 1080;
const H = 280;
const CX = 240;
const CY = 150;
const R = 90;
const ETA = 0.1;

export const M41Dial: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thetaRef = useRef((135 * Math.PI) / 180);
  const [thetaDeg, setThetaDeg] = useState(135);
  const draggingRef = useRef(false);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    canvas.classList.add('is-ready');
    const theta = thetaRef.current;
    const cosT = Math.cos(theta);
    const first = -ETA * cosT; // -eta<g_t,g_v> with unit gradients
    const second = (ETA * ETA) / 2; // demo: lambda_max = 1
    const delta = first + second;
    clearStudio(ctx, W, H, 0.95);
    // parameter ring
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.strokeStyle = SC.handle;
    ctx.lineWidth = 3;
    ctx.stroke();
    // angle arc from 0 to theta
    ctx.beginPath();
    ctx.arc(CX, CY, R - 14, 0, -theta, true);
    ctx.strokeStyle = cosT < 0 ? SC.red : SC.green;
    ctx.lineWidth = 2;
    ctx.stroke();
    // fixed g_v (green), draggable g_t (blue)
    arrowLine(ctx, CX, CY, CX + Math.cos(0) * (R + 20), CY + Math.sin(0) * (R + 20), SC.green, 3);
    arrowLine(ctx, CX, CY, CX + Math.cos(theta) * (R + 20), CY + Math.sin(theta) * (R + 20), SC.blue, 3);
    // angle degree readout near the blue arrow
    label(ctx, `${Math.round(((theta * 180) / Math.PI + 360) % 360)}°`, CX + Math.cos(theta) * (R + 34), CY + Math.sin(theta) * (R + 34), SC.blue, 12, 'center');
    // center needle deflects with delta sign
    const conflict = cosT < 0;
    ctx.strokeStyle = conflict ? SC.red : SC.green;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(CX + (conflict ? 14 : -14) * Math.min(1, Math.abs(first) / 0.1), CY - 26);
    ctx.stroke();
    // 后果可见：参数拧向答题越多，挂在环旁的出图样片偏色越重（呼应 §1 的照片墙）
    const shiftP = Math.min(1, Math.max(0, first) / 0.1);
    print(ctx, 408, 96, 112, 86, SC.green, shiftP * 0.85);
    label(ctx, '出图样片', 464, 198, SC.muted, 11, 'center');
    // right: decomposition bars (max reference 0.1)
    const bx = 620;
    label(ctx, '一阶', bx, 74, SC.muted, 12);
    barH(ctx, bx + 40, 60, 300, Math.min(1, Math.abs(first) / 0.1), 22, first > 0 ? SC.red : SC.green);
    label(ctx, first.toFixed(3), bx + 348, 77, first > 0 ? SC.red : SC.green, 13);
    label(ctx, '二阶', bx, 126, SC.muted, 12);
    barH(ctx, bx + 40, 112, 300, Math.min(1, second / 0.1), 22, SC.orange);
    label(ctx, second.toFixed(3), bx + 348, 129, SC.orange, 13);
    label(ctx, `ΔL_v = ${delta.toFixed(3)}`, bx + 40, 190, delta > 0 ? SC.red : SC.green, 15);
    // 90-degree notch marker on the ring
    ctx.strokeStyle = SC.muted;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CX + Math.cos(Math.PI / 2) * (R - 8), CY + Math.sin(Math.PI / 2) * (R - 8));
    ctx.lineTo(CX + Math.cos(Math.PI / 2) * (R + 8), CY + Math.sin(Math.PI / 2) * (R + 8));
    ctx.stroke();
  };

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thetaDeg]);

  const setTheta = (rad: number) => {
    thetaRef.current = rad;
    setThetaDeg(Math.round(((rad * 180) / Math.PI + 360) % 360));
  };

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (e.type === 'pointerdown') draggingRef.current = true;
    if (!draggingRef.current) return;
    const { x, y } = toLocal(canvas, e.clientX, e.clientY);
    const dx = x - CX;
    const dy = y - CY;
    if (Math.sqrt(dx * dx + dy * dy) < 20) return;
    const rad = Math.atan2(dy, dx);
    setTheta(rad);
  };

  const stop = () => {
    draggingRef.current = false;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (e.key === 'ArrowLeft') setTheta(thetaRef.current - (5 * Math.PI) / 180);
    if (e.key === 'ArrowRight') setTheta(thetaRef.current + (5 * Math.PI) / 180);
  };

  const cosT = Math.cos((thetaDeg * Math.PI) / 180);
  const first = -ETA * cosT;
  const second = (ETA * ETA) / 2;
  // 定义1: 内积<0 即冲突；演示设定下二阶项 +0.005 使 ΔL_v>0 的真实分界是 cos<0.05（≈87.1°）
  const conflict = cosT < 0;
  const netBad = first + second > 0;
  const fb = conflict
    ? { text: `夹角 ${thetaDeg}°，内积为负：这一步答题更新把视觉损失抬高约 ${(first + second).toFixed(3)}——模态间遗忘发生。`, cls: 'bad' }
    : netBad
    ? { text: `夹角 ${thetaDeg}°：一阶项 ${first.toFixed(3)} 仍在帮出图，但二阶项 +${second.toFixed(3)} 已把 ΔL_v 顶成正——接近垂直不是安全区，归零要靠解耦。`, cls: '' }
    : { text: `夹角 ${thetaDeg}°，方向一致：一阶项 ${first.toFixed(3)} 顺带降低视觉损失——但这是运气，不是保证。`, cls: 'good' };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        style={{ maxWidth: '100%', cursor: 'grab', touchAction: 'none' }}
        onPointerDown={onPointer}
        onPointerMove={onPointer}
        onPointerUp={stop}
        onPointerLeave={stop}
        onKeyDown={onKeyDown}
      />
      <div className="ctrl">
        <label>
          夹角 <span className="val">{thetaDeg}°</span>
        </label>
        <label>
          内积 cos <span className="val">{cosT.toFixed(3)}</span>
        </label>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default M41Dial;
