import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawLighthouse, sceneLabel, inset } from './scene-kit';

const W = 560;
const H = 280;

const PAD = { x: 20, y: 40, w: 150, h: 200 };

// §5 M5.1 — P6 drag: 2D pose knob (yaw / forward). The reference view is
// warped to the new viewpoint; a hatched wedge marks invisible regions (m=0).
// Coverage bar is schematic; mechanism follows Eq.(3).
export const M5Steer: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ yaw: 0, fwd: 10, dragging: false });
  const rafRef = useRef<number | null>(null);
  const [yaw, setYaw] = useState(0);
  const [fwd, setFwd] = useState(10);
  const [feedback, setFeedback] = useState({
    text: '小幅移动：参考几乎能覆盖整个新视角。',
    cls: 'good',
  });

  const coverage = (y: number, f: number) => 1 - 0.6 * (Math.abs(y) / 45) - 0.3 * (f / 60);

  const applyFeedback = (y: number, f: number) => {
    const c = coverage(y, f);
    if (c >= 0.7) {
      setFeedback({ text: '几何约束覆盖充分：重投影给出确定结构，模型只需补细节。', cls: 'good' });
    } else if (c >= 0.4) {
      setFeedback({ text: '中等视角变化：掩码标出的不可见区域交给生成器补全。', cls: '' });
    } else {
      setFeedback({
        text: '大幅转向：大片区域参考看不到（m=0），此时更依赖生成——掩码让模型明确知道哪里该「画新的」。',
        cls: '',
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { yaw: number; fwd: number }) => {
      clearScene(ctx, W, H);
      // --- pose pad ---
      inset(ctx, PAD.x, PAD.y, PAD.w, PAD.h);
      sceneLabel(ctx, '位姿手柄', PAD.x + 4, PAD.y - 8, true, 11);
      sceneLabel(ctx, '← 转向 →', PAD.x + 42, PAD.y + PAD.h + 16, true, 10);
      ctx.save();
      ctx.translate(0, 0);
      ctx.strokeStyle = C.border;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(PAD.x + PAD.w / 2, PAD.y + 6);
      ctx.lineTo(PAD.x + PAD.w / 2, PAD.y + PAD.h - 6);
      ctx.moveTo(PAD.x + 6, PAD.y + PAD.h - 34);
      ctx.lineTo(PAD.x + PAD.w - 6, PAD.y + PAD.h - 34);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      const kx = PAD.x + PAD.w / 2 + (s.yaw / 45) * (PAD.w / 2 - 14);
      const ky = PAD.y + PAD.h - 34 - (s.fwd / 60) * (PAD.h - 48);
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(kx, ky, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      // --- windshield view ---
      inset(ctx, 190, 20, 354, 220);
      ctx.save();
      ctx.beginPath();
      ctx.rect(190, 20, 354, 220);
      ctx.clip();
      const cx = 367;
      const bend = (s.yaw / 45) * 150;
      const scale = 1 + (s.fwd / 60) * 0.7;
      // hills
      ctx.fillStyle = C.hill;
      ctx.beginPath();
      ctx.moveTo(190, 120 - 10 * scale);
      ctx.quadraticCurveTo(cx - bend * 0.3, 74 - 12 * scale, 544, 122 - 8 * scale);
      ctx.lineTo(544, 240);
      ctx.lineTo(190, 240);
      ctx.closePath();
      ctx.fill();
      // road wedge bending with yaw
      ctx.fillStyle = C.road;
      ctx.beginPath();
      ctx.moveTo(cx - 90 * scale, 240);
      ctx.lineTo(cx + 90 * scale, 240);
      ctx.quadraticCurveTo(cx + 40 + bend * 0.5, 150, cx + 16 + bend, 96);
      ctx.lineTo(cx - 16 + bend, 96);
      ctx.quadraticCurveTo(cx - 40 + bend * 0.5, 150, cx - 90 * scale, 240);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = C.roadEdge;
      ctx.lineWidth = 2;
      ctx.stroke();
      drawLighthouse(ctx, cx + bend * 0.8, 96, 0.9 * scale);
      // warped-reference outline (blue ghost copies, offset against the move)
      ctx.strokeStyle = 'rgba(39,68,110,0.55)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(cx - 90 * scale - bend * 0.4, 240);
      ctx.quadraticCurveTo(cx - 40 - bend * 0.1, 150, cx - 16, 96);
      ctx.moveTo(cx + 90 * scale - bend * 0.4, 240);
      ctx.quadraticCurveTo(cx + 40 - bend * 0.1, 150, cx + 16, 96);
      ctx.stroke();
      ctx.setLineDash([]);
      // invisible-region wedge (mask m = 0): hatched, grows with |yaw| and fwd
      const invW = (Math.abs(s.yaw) / 45) * 130 + (s.fwd / 60) * 40;
      if (invW > 8) {
        const side = s.yaw >= 0 ? 1 : -1;
        const xEdge = side > 0 ? 544 : 190;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(xEdge, 20);
        ctx.lineTo(xEdge - side * invW, 20);
        ctx.lineTo(xEdge - side * invW * 0.55, 240);
        ctx.lineTo(xEdge, 240);
        ctx.closePath();
        ctx.clip();
        ctx.fillStyle = 'rgba(104,119,143,0.15)';
        ctx.fillRect(190, 20, 354, 220);
        ctx.strokeStyle = 'rgba(104,119,143,0.5)';
        ctx.lineWidth = 1;
        for (let i = -240; i < 360; i += 9) {
          ctx.beginPath();
          ctx.moveTo(190 + i, 240);
          ctx.lineTo(190 + i + 90, 20);
          ctx.stroke();
        }
        ctx.restore();
        sceneLabel(ctx, '掩码 m=0', side > 0 ? 470 : 200, 40, false, 11);
      }
      ctx.restore();
      // coverage bar
      const c = clamp(coverage(s.yaw, s.fwd), 0, 1);
      ctx.strokeStyle = C.border;
      ctx.strokeRect(190, 6, 354, 8);
      ctx.fillStyle = c >= 0.7 ? C.green : c >= 0.4 ? C.blue : C.orange;
      ctx.fillRect(190, 6, 354 * c, 8);
      sceneLabel(ctx, `参考覆盖率（示意）`, 190, 262, true, 10);
      sceneLabel(
        ctx,
        `Tᵢ：转向 ${s.yaw.toFixed(0)}° · 前进 ${s.fwd.toFixed(0)} m（累计位姿示意）`,
        330,
        262,
        false,
        11
      );
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(stateRef.current);
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

    // pointer drag on the pad
    const toIntrinsic = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    };
    const applyPos = (px: number, py: number) => {
      const y = clamp(((px - (PAD.x + PAD.w / 2)) / (PAD.w / 2 - 14)) * 45, -45, 45);
      const f = clamp(((PAD.y + PAD.h - 34 - py) / (PAD.h - 48)) * 60, 0, 60);
      stateRef.current.yaw = y;
      stateRef.current.fwd = f;
      setYaw(Math.round(y));
      setFwd(Math.round(f));
      applyFeedback(y, f);
    };
    const onDown = (e: PointerEvent) => {
      const p = toIntrinsic(e);
      if (p.x >= PAD.x && p.x <= PAD.x + PAD.w && p.y >= PAD.y && p.y <= PAD.y + PAD.h) {
        stateRef.current.dragging = true;
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = 'grabbing';
        applyPos(p.x, p.y);
      }
    };
    const onMove = (e: PointerEvent) => {
      const p = toIntrinsic(e);
      if (stateRef.current.dragging) {
        applyPos(p.x, p.y);
      } else {
        const over = p.x >= PAD.x && p.x <= PAD.x + PAD.w && p.y >= PAD.y && p.y <= PAD.y + PAD.h;
        canvas.style.cursor = over ? 'grab' : 'default';
      }
    };
    const onUp = () => {
      stateRef.current.dragging = false;
      canvas.style.cursor = 'grab';
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    return () => {
      stop();
      disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onYaw = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    stateRef.current.yaw = v;
    setYaw(v);
    applyFeedback(v, stateRef.current.fwd);
  };
  const onFwd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    stateRef.current.fwd = v;
    setFwd(v);
    applyFeedback(stateRef.current.yaw, v);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          转向 <span className="val">{yaw}°</span>
        </label>
        <input type="range" min={-45} max={45} step={1} value={yaw} onChange={onYaw} />
        <label>
          前进 <span className="val">{fwd} m</span>
        </label>
        <input type="range" min={0} max={60} step={1} value={fwd} onChange={onFwd} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M5Steer;
