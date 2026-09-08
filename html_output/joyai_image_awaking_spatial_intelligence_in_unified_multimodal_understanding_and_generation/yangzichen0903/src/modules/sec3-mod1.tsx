import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 480;
const H = 260;
const BG = '#fffaf1';
const INK = '#222222';
const BLUE = '#33ccff';
const PINK = '#ff3366';
const YELLOW = '#ffcc00';
const PURPLE = '#9933ff';

interface Vec3 { x: number; y: number; z: number }

const vertices: Vec3[] = [
  { x: -1.15, y: -.72, z: -.82 }, { x: 1.15, y: -.72, z: -.82 },
  { x: 1.15, y: .72, z: -.82 }, { x: -1.15, y: .72, z: -.82 },
  { x: -1.15, y: -.72, z: .82 }, { x: 1.15, y: -.72, z: .82 },
  { x: 1.15, y: .72, z: .82 }, { x: -1.15, y: .72, z: .82 }
];

const faces = [
  { ids: [0, 1, 2, 3], color: BLUE }, { ids: [4, 5, 6, 7], color: PINK },
  { ids: [0, 4, 7, 3], color: PURPLE }, { ids: [1, 5, 6, 2], color: YELLOW },
  { ids: [3, 2, 6, 7], color: BLUE }, { ids: [0, 1, 5, 4], color: PINK }
];

export const Sec3Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ yaw: 32, pitch: -20, zoom: 1, dragging: false, x: 0, y: 0 });
  const [view, setView] = useState({ yaw: 32, pitch: -20, zoom: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const rotate = (point: Vec3) => {
      const yaw = stateRef.current.yaw * Math.PI / 180;
      const pitch = stateRef.current.pitch * Math.PI / 180;
      const x1 = point.x * Math.cos(yaw) + point.z * Math.sin(yaw);
      const z1 = -point.x * Math.sin(yaw) + point.z * Math.cos(yaw);
      return {
        x: x1,
        y: point.y * Math.cos(pitch) - z1 * Math.sin(pitch),
        z: point.y * Math.sin(pitch) + z1 * Math.cos(pitch)
      };
    };

    const render = () => {
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = INK; ctx.font = '800 14px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('拖动画布，从不同方向观察 3D oriented bounding box', W / 2, 24);

      const rotated = vertices.map(rotate);
      const scale = 67 * stateRef.current.zoom;
      const projected = rotated.map((point) => ({ x: W / 2 + point.x * scale, y: 137 - point.y * scale }));
      const sorted = faces.map((face) => ({ ...face, depth: face.ids.reduce((sum, id) => sum + rotated[id].z, 0) / 4 })).sort((a, b) => a.depth - b.depth);

      sorted.forEach((face) => {
        ctx.beginPath(); ctx.moveTo(projected[face.ids[0]].x, projected[face.ids[0]].y);
        face.ids.slice(1).forEach((id) => ctx.lineTo(projected[id].x, projected[id].y)); ctx.closePath();
        ctx.save(); ctx.globalAlpha = .24; ctx.fillStyle = face.color; ctx.fill(); ctx.restore();
        ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
      });

      // 局部朝向轴：强调 OBB 不只是中心和尺度，还编码朝向。
      const origin = rotate({ x: 0, y: 0, z: 0 });
      const forward = rotate({ x: 0, y: 0, z: 1.25 });
      const ox = W / 2 + origin.x * scale, oy = 137 - origin.y * scale;
      const fx = W / 2 + forward.x * scale, fy = 137 - forward.y * scale;
      ctx.strokeStyle = PINK; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(fx, fy); ctx.stroke();
      const angle = Math.atan2(fy - oy, fx - ox);
      ctx.fillStyle = PINK; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx - 11 * Math.cos(angle - .5), fy - 11 * Math.sin(angle - .5)); ctx.lineTo(fx - 11 * Math.cos(angle + .5), fy - 11 * Math.sin(angle + .5)); ctx.closePath(); ctx.fill();

      ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(13, 213, 139, 32, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.font = '700 11px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(`Yaw ${Math.round(stateRef.current.yaw)}°`, 25, 233);
      ctx.fillText(`Pitch ${Math.round(stateRef.current.pitch)}°`, 84, 233);
      ctx.fillStyle = '#625d67'; ctx.font = '600 10px "Segoe UI", sans-serif'; ctx.textAlign = 'right';
      ctx.fillText('横向拖动 = 旋转 · 纵向拖动 = 俯仰', W - 17, 233);
    };

    const tick = () => { render(); canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const updateView = () => setView({ yaw: stateRef.current.yaw, pitch: stateRef.current.pitch, zoom: stateRef.current.zoom });
  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    stateRef.current.dragging = true; stateRef.current.x = event.clientX; stateRef.current.y = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.dragging) return;
    const dx = event.clientX - stateRef.current.x, dy = event.clientY - stateRef.current.y;
    stateRef.current.x = event.clientX; stateRef.current.y = event.clientY;
    stateRef.current.yaw = (stateRef.current.yaw + dx * .65 + 360) % 360;
    stateRef.current.pitch = Math.max(-70, Math.min(70, stateRef.current.pitch + dy * .55));
    updateView();
  };
  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    stateRef.current.dragging = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const onZoom = (event: React.ChangeEvent<HTMLInputElement>) => {
    stateRef.current.zoom = Number(event.target.value) / 100; updateView();
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
        style={{ cursor: stateRef.current.dragging ? 'grabbing' : 'grab', touchAction: 'none' }}
      />
      <div className="ctrl">
        <label>缩放 <span className="val">{view.zoom.toFixed(2)}×</span></label>
        <input type="range" min={65} max={145} value={Math.round(view.zoom * 100)} onChange={onZoom} />
      </div>
      <div className="feedback">当前观察角：Yaw {Math.round(view.yaw)}° · Pitch {Math.round(view.pitch)}°。粉色箭头表示 OBB 的局部朝向。</div>
    </div>
  );
};

export default Sec3Mod1;
