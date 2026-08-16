import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, drawSceneBg, drawWindow, drawDot, label, drawCaption } from './vlm3Draw';
import type { WidgetProps } from './registry';

const W = 560;
const H = 260;

const img = { x: 40, y: 28, w: 280, h: 160 };

/** 示意：近大远小地面，竖直位置 → 米制距离 */
function depthAt(x: number, y: number): number {
  const v = clamp((y - img.y) / img.h, 0.02, 0.98);
  // 越靠画面上方越远；略加横向偏移使拖动更有反馈
  const u = (x - img.x) / img.w - 0.5;
  const d = 1.2 / Math.max(v, 0.08) + Math.abs(u) * 0.8;
  return clamp(d, 1.5, 28);
}

function toCoords(x: number, y: number) {
  const c = clamp(Math.floor(((x - img.x) / img.w) * 2000), 0, 1999);
  const r = clamp(Math.floor(((y - img.y) / img.h) * 2000), 0, 1999);
  return { c, r };
}

/** 6.1：拖动查询点，文本坐标 + 米制深度同步变化 */
export const Ch6Depth: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ x: 180, y: 120 });
  const rafRef = useRef<number | null>(null);
  const drag = useRef(false);
  const [coords, setCoords] = useState({ c: 1000, r: 1000 });
  const [depth, setDepth] = useState(4.6);
  const [feedback, setFeedback] = useState({
    text: '拖动橙点：文本坐标与到相机距离同步更新。',
    cls: 'good',
  });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = () => {
      const { x, y } = stateRef.current;
      const { c, r } = toCoords(x, y);
      const d = depthAt(x, y);
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      drawWindow(ctx, img.x, img.y, img.w, img.h, C.blue);
      // 简易地平线
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(img.x + 8, img.y + img.h * 0.35);
      ctx.lineTo(img.x + img.w - 8, img.y + img.h * 0.35);
      ctx.stroke();

      // 相机示意（窗顶中点）
      const camX = img.x + img.w / 2;
      const camY = img.y + 10;
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.moveTo(camX, camY);
      ctx.lineTo(camX - 8, camY + 12);
      ctx.lineTo(camX + 8, camY + 12);
      ctx.closePath();
      ctx.fill();

      // 射线
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(camX, camY + 6);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.setLineDash([]);

      drawDot(ctx, x, y, 7, C.orange);

      // 右侧输出卡
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.fillRect(350, 40, 180, 130);
      ctx.strokeRect(350, 40, 180, 130);
      label(ctx, '提示 → 文本输出', 365, 68, C.blue, 13);
      label(ctx, 'pixel [' + c + ', ' + r + ']', 365, 100, C.text, 13);
      label(ctx, 'depth ≈ ' + d.toFixed(1) + ' m', 365, 132, C.green, 16);

      drawCaption(ctx, W, H, '拖动查询点 · 文本坐标 [' + c + ', ' + r + '] · 距离 ' + d.toFixed(1) + ' m', C.blue, 12);
    };
    const tick = () => { render(); canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const d = observeCanvas(canvas, start, stop);
    return () => { stop(); d(); };
  }, []);

  const toLocal = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    return {
      x: clamp(x, img.x + 4, img.x + img.w - 4),
      y: clamp(y, img.y + 4, img.y + img.h - 4),
    };
  };

  const update = (x: number, y: number) => {
    stateRef.current = { x, y };
    const { c, r } = toCoords(x, y);
    const d = depthAt(x, y);
    setCoords({ c, r });
    setDepth(d);
    setFeedback({
      text: '查询点 [' + c + ', ' + r + '] → 到相机约 ' + d.toFixed(1) + ' m（示意）。',
      cls: 'good',
    });
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ touchAction: 'none', cursor: 'crosshair' }}
        onPointerDown={(e) => {
          drag.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          const p = toLocal(e);
          update(p.x, p.y);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const p = toLocal(e);
          update(p.x, p.y);
        }}
        onPointerUp={() => { drag.current = false; }}
      />
      <div className="ctrl">
        <label>
          文本坐标 <span className="val">[{coords.c}, {coords.r}]</span>
          {' · '}
          距离 <span className="val">{depth.toFixed(1)} m</span>
        </label>
      </div>
      <div className={`feedback ${feedback.cls}`} style={{ fontStyle: 'normal' }}>{feedback.text}</div>
    </div>
  );
};

export default Ch6Depth;
