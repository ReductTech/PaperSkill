import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, drawSceneBg, drawTracker, drawCamcorder, drawSceneLabel, drawLegend } from './dogKit';
import type { WidgetProps } from './registry';

// Module 2.1 像素 → 射线 → 3D 点 — click the left region to pick a pixel (u,v),
// drag the depth slider to slide the 3D point along its ray, and toggle the
// camera pose to see the same point addressed in camera vs world coordinates.
const W = 1080;
const H = 280;
const LEFT = 648; // left 60%: pseudo-3D pinhole side view

interface RayState {
  u: number;
  v: number;
  depth: number; // 1..10 m
  poseOn: boolean;
}

export const Ch2Pixelray: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<RayState>({ u: 540, v: 140, depth: 3.0, poseOn: false });
  const rafRef = useRef<number | null>(null);
  const [depth, setDepth] = useState(3.0);
  const [poseOn, setPoseOn] = useState(false);
  const [feedback, setFeedback] = useState({ text: '点选像素、拖动深度，看 3D 点沿射线滑动。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const cam = { x: 66, y: 150 };
    const strip = { x: 150, y: 68, w: 24, h: 164 };

    const pixelOnStrip = (s: RayState) => ({
      x: strip.x + 3 + (s.u / W) * (strip.w - 6),
      y: strip.y + (s.v / H) * strip.h,
    });

    const coords = (s: RayState) => {
      const f = 540;
      const Xc = ((s.u - 540) / f) * s.depth;
      const Yc = ((s.v - 140) / f) * s.depth;
      const Zc = s.depth;
      const a = s.poseOn ? Math.PI / 6 : 0; // fixed 30° yaw when rotated
      return {
        Xc,
        Yc,
        Zc,
        Xw: Xc * Math.cos(a) + Zc * Math.sin(a),
        Yw: Yc,
        Zw: -Xc * Math.sin(a) + Zc * Math.cos(a),
      };
    };

    const drawAxes = (cx: number, cy: number, color: string, yaw: number) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      const arrow = (dx: number, dy: number) => {
        const ang = Math.atan2(dy, dx);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + dx, cy + dy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + dx, cy + dy);
        ctx.lineTo(cx + dx - 6 * Math.cos(ang - 0.45), cy + dy - 6 * Math.sin(ang - 0.45));
        ctx.lineTo(cx + dx - 6 * Math.cos(ang + 0.45), cy + dy - 6 * Math.sin(ang + 0.45));
        ctx.closePath();
        ctx.fill();
      };
      arrow(30 * Math.cos(yaw), 30 * Math.sin(yaw)); // X
      arrow(0, -24); // Y (up)
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + 24 * Math.cos(yaw + Math.PI / 3), cy + 24 * Math.sin(yaw + Math.PI / 3));
      ctx.stroke();
      ctx.restore();
    };

    const render = (s: RayState) => {
      ctx.clearRect(0, 0, W, H);
      // ---- left 60%: pseudo-3D pinhole view ----
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, LEFT, H);
      ctx.clip();
      drawSceneBg(ctx, LEFT, H);
      // camcorder physically yaws 30° when the pose chip is on (tilt 2.6 × 0.2 rad)
      drawCamcorder(ctx, 40, 150, { scale: 0.95, tilt: s.poseOn ? 2.6 : 0 });
      if (s.poseOn) {
        // rotation arc cue around the camera
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(cam.x + 6, cam.y, 58, -0.9, -0.25);
        ctx.stroke();
        ctx.setLineDash([]);
        const aEnd = -0.25;
        ctx.fillStyle = C.orange;
        ctx.beginPath();
        ctx.moveTo(cam.x + 6 + 58 * Math.cos(aEnd), cam.y + 58 * Math.sin(aEnd));
        ctx.lineTo(cam.x + 6 + 58 * Math.cos(aEnd) + 7, cam.y + 58 * Math.sin(aEnd) - 5);
        ctx.lineTo(cam.x + 6 + 58 * Math.cos(aEnd) - 4, cam.y + 58 * Math.sin(aEnd) + 8);
        ctx.closePath();
        ctx.fill();
      }
      // image plane strip
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(strip.x, strip.y, strip.w, strip.h);
      ctx.fill();
      ctx.stroke();
      const px = pixelOnStrip(s);
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(px.x, px.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.muted;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${Math.round(s.u)},${Math.round(s.v)}`, strip.x + strip.w + 6, px.y + 4);
      // ray through the pixel
      const dx = px.x - cam.x;
      const dy = px.y - cam.y;
      const len = Math.hypot(dx, dy);
      const nd = { x: dx / len, y: dy / len };
      ctx.strokeStyle = C.support;
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.moveTo(cam.x, cam.y);
      ctx.lineTo(cam.x + nd.x * 700, cam.y + nd.y * 700);
      ctx.stroke();
      ctx.setLineDash([]);
      // 3D point slides along the ray with depth
      const dist = 90 + s.depth * 46;
      const pt = { x: cam.x + nd.x * dist, y: cam.y + nd.y * dist };
      drawTracker(ctx, pt.x, pt.y, 6);
      ctx.fillStyle = C.green;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText(`${s.depth.toFixed(1)} m`, pt.x + 10, pt.y - 8);
      drawLegend(
        ctx,
        [
          ['射线', C.support],
          ['3D 点', C.green],
        ],
        20,
        H - 14
      );
      ctx.restore();

      // divider
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(LEFT + 8, 0);
      ctx.lineTo(LEFT + 8, H);
      ctx.stroke();

      // ---- right 40%: two stacked mini-axes ----
      const k = coords(s);
      // camera frame panel — its axes yaw with the camera pose
      drawSceneLabel(ctx, '相机系', 676, 38, { color: C.blue });
      drawAxes(760, 92, C.blue, s.poseOn ? Math.PI / 6 : 0);
      drawTracker(ctx, 760 + clamp(k.Xc * 38, -120, 240), 92 - clamp(k.Yc * 38, -18, 44), 5);
      ctx.fillStyle = C.blue;
      ctx.font = '13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${k.Xc.toFixed(2)},${k.Yc.toFixed(2)},${k.Zc.toFixed(2)}`, 1056, 40);
      // world frame panel — green axes stay fixed; blue overlay = the rotated camera
      drawSceneLabel(ctx, '世界系', 676, 164, { color: C.green });
      drawAxes(760, 222, C.green, 0);
      if (s.poseOn) drawAxes(760, 222, C.blue, Math.PI / 6);
      drawTracker(ctx, 760 + clamp(k.Xw * 38, -120, 240), 222 - clamp(k.Yw * 38, -18, 44), 5);
      ctx.fillStyle = C.green;
      ctx.textAlign = 'right';
      ctx.fillText(`${k.Xw.toFixed(2)},${k.Yw.toFixed(2)},${k.Zw.toFixed(2)}`, 1056, 166);
    };

    const tick = () => {
      render(stateRef.current);
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

    // click the left region to set the pixel (bounding-rect ratio mapping)
    const onDown = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * (W / r.width);
      const y = (e.clientY - r.top) * (H / r.height);
      if (x > LEFT) return;
      const s = stateRef.current;
      s.u = clamp(Math.round(x), 20, 640);
      s.v = clamp(Math.round(y), 16, 264);
      setFeedback({ text: '射线方向已更新。', cls: '' });
    };
    canvas.addEventListener('pointerdown', onDown);
    return () => {
      stop();
      disconnect();
      canvas.removeEventListener('pointerdown', onDown);
    };
  }, []);

  const onDepth = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    stateRef.current.depth = v;
    setDepth(v);
  };

  const togglePose = () => {
    const s = stateRef.current;
    s.poseOn = !s.poseOn;
    setPoseOn(s.poseOn);
    setFeedback(
      s.poseOn
        ? {
            text:
              '相机绕竖直轴转了 30°（注意左图相机姿态与橙色弧线）：相机系读数不变，世界系地址变了——外参 R、t 负责这层换算，把每帧几何对齐到同一个世界坐标系。',
            cls: 'good',
          }
        : { text: '回到固定位姿：相机系与世界系重合，两种地址一致。', cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} style={{ touchAction: 'none' }} />
      <div className="ctrl">
        <label>
          深度 <span className="val">{depth.toFixed(1)} m</span>
        </label>
        <input type="range" min={1} max={10} step={0.1} value={depth} onChange={onDepth} />
        <button type="button" className={`chip${poseOn ? ' selected' : ''}`} onClick={togglePose}>
          相机位姿：{poseOn ? '旋转' : '固定'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Pixelray;
