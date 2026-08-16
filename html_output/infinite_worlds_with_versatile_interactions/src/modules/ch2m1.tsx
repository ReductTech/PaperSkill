import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, clamp } from '../lib/canvasKit';
import {
  PAL,
  clearScene,
  drawInset,
  drawLegend,
  drawNeedles,
  drawScarf,
  drawSceneLabel,
  drawYarnBall,
  rampSteps,
  setupCrispCanvas,
  useAutoplay,
} from './knitKit';
import type { WidgetProps } from './registry';

const W = 720;
const H = 320;
const MAX_A = 0.6;

interface S {
  angle: number;
  dragging: boolean;
}

export const Ch2M1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<S>({ angle: 0, dragging: false });
  const rafRef = useRef<number | null>(null);
  const [angle, setAngle] = useState(0);
  const [feedback, setFeedback] = useState({
    text: '针保持水平：视线射线朝正前方，六维坐标里方向分量 d 主导。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    let detachCrisp: () => void;
    try {
      const crisp = setupCrispCanvas(canvas, W, H);
      ctx = crisp.ctx;
      detachCrisp = crisp.detach;
    } catch {
      return;
    }

    const render = (s: S, time: number) => {
      const a = s.angle;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      clearScene(ctx, W, H);

      const end = drawScarf(ctx, 40, 172, 12, () => 34, PAL.blue, 19);

      // ghost next rows along the current needle direction
      ctx.strokeStyle = 'rgba(39,68,110,0.32)';
      ctx.lineWidth = 2.5;
      for (let k = 1; k <= 3; k++) {
        const gx = end + ca * (k * 20);
        const gy = 172 + sa * (k * 20);
        ctx.beginPath();
        ctx.moveTo(gx + sa * 34, gy - ca * 34);
        ctx.lineTo(gx - sa * 34, gy + ca * 34);
        ctx.stroke();
      }

      drawYarnBall(ctx, 48, 252, time);
      drawNeedles(ctx, end, 172, a, PAL.blue, 5);

      // viewing-ray fan from the needle tip
      const tipX = end + ca * 32;
      const tipY = 172 + sa * 32;
      ctx.strokeStyle = PAL.blue;
      ctx.lineWidth = 1.2;
      for (let k = -3; k <= 3; k++) {
        const ra = a + k * 0.1;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX + Math.cos(ra) * 84, tipY + Math.sin(ra) * 84);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Plucker six-coordinate inset (illustrative values)
      drawInset(ctx, 462, 40, 234, 240, 'Plücker 六维坐标（示意）');
      const d = [ca, sa, 0];
      const m = [0, 0, sa * 0.42];
      const names = ['d₁', 'd₂', 'd₃', 'm₁', 'm₂', 'm₃'];
      const vals = [...d, ...m];
      const changes = [true, true, false, false, false, true];
      for (let i = 0; i < 6; i++) {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const bx = 476 + col * 70;
        const by = 74 + row * 48;
        ctx.fillStyle = PAL.paper;
        ctx.strokeStyle = changes[i] ? PAL.orange : PAL.axis;
        ctx.lineWidth = changes[i] ? 1.8 : 1;
        ctx.beginPath();
        ctx.rect(bx, by, 62, 38);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = PAL.muted;
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText(names[i], bx + 6, by + 14);
        ctx.fillStyle = PAL.ink;
        ctx.font = '600 13px "Segoe UI", sans-serif';
        ctx.fillText(vals[i].toFixed(2), bx + 6, by + 31);
      }
      // AdaLN scale/shift bars
      ctx.fillStyle = PAL.muted;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('AdaLN：缩放 γ / 偏移 β', 476, 204);
      const mag = Math.abs(a) / MAX_A;
      for (let k = 0; k < 2; k++) {
        const by = 214 + k * 22;
        ctx.fillStyle = PAL.axis;
        ctx.fillRect(476, by, 200, 10);
        ctx.fillStyle = PAL.blue;
        ctx.fillRect(476, by, 200 * (0.28 + 0.62 * mag), 10);
      }
      ctx.fillStyle = PAL.muted;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('注入时不改写预训练特征', 476, 274);

      drawSceneLabel(ctx, 40, 34, `针的角度 ${(a * 57.3).toFixed(0)}°`);
      drawSceneLabel(ctx, 40, 302, '拖动画布改变针的角度');
      drawLegend(ctx, 250, 302, [{ color: PAL.blue, label: '每像素一条视线射线' }]);
    };

    const tick = (t: number) => {
      render(stateRef.current, t);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
      detachCrisp();
    };
  }, []);

  const apply = (rad: number) => {
    const a = clamp(rad, -MAX_A, MAX_A);
    stateRef.current.angle = a;
    setAngle(a);
    const deg = (a * 57.3).toFixed(0);
    setFeedback(
      Math.abs(a) < 0.05
        ? { text: '针保持水平：视线射线朝正前方，六维坐标里方向分量 d 主导。', cls: '' }
        : {
            text: `针转了 ${deg}°：下一行改朝这个方向长，六维坐标里 d 与 m 一起变——位姿是几何控制，经 AdaLN 的缩放与偏移注入，不改写预训练特征。`,
            cls: '',
          }
    );
  };

  const angleFromEvent = (clientX: number, clientY: number): number => {
    const canvas = canvasRef.current;
    if (!canvas) return stateRef.current.angle;
    const rect = canvas.getBoundingClientRect();
    const y = ((clientY - rect.top) / rect.height) * H;
    // vertical drag around the strip centre line maps to needle tilt
    return clamp((y - 172) / 110, -MAX_A, MAX_A);
  };

  // Autoplay swings the needle through the full range and back, so the reader
  // sees which of the six Plucker components move together without dragging.
  const demo = useAutoplay(
    {
      steps: [
        ...rampSteps(0, MAX_A, 7),
        ...rampSteps(MAX_A, -MAX_A, 13).slice(1),
        ...rampSteps(-MAX_A, 0, 7).slice(1),
      ],
      intervalMs: 260,
      loop: true,
    },
    (a: number) => apply(a)
  );

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    demo.stop();
    stateRef.current.dragging = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    apply(angleFromEvent(e.clientX, e.clientY));
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.dragging) return;
    apply(angleFromEvent(e.clientX, e.clientY));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    stateRef.current.dragging = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'grab', touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <div className="ctrl">
        <label>
          针的角度 <span className="val">{(angle * 57.3).toFixed(0)}°</span>
        </label>
        <input
          type="range"
          min={-34}
          max={34}
          step={1}
          value={Math.round(angle * 57.3)}
          onChange={(e) => {
            demo.stop();
            apply(Number(e.target.value) / 57.3);
          }}
        />
        <button className={demo.btnClass} onClick={demo.toggle}>
          {demo.label}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2M1;
