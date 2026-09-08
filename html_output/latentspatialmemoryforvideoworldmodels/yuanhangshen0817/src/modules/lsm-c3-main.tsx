import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  LSM_COLORS as C,
  clearScene,
  drawBuilding,
  drawCamera3D,
  drawFloorGrid,
  drawPoint3D,
  drawWorldAxes,
  label,
  line3D,
  poly3D,
  project3D,
  type Vec3,
  type View3D,
} from './lsm-3d-kit';

export const LsmC3Main: React.FC<WidgetProps> = () => {
  const [cell, setCell] = useState(4);
  const [depth, setDepth] = useState<'near' | 'far'>('near');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = 760;
    const height = 380;
    const ctx = setupCanvas(canvas, width, height);
    const view: View3D = { ox: 365, oy: 292, scale: 2.15, yaw: -0.57, pitch: -0.38, focal: 690 };
    const camera: Vec3 = { x: -8, y: 17, z: -62 };
    const row = Math.floor(cell / 4);
    const col = cell % 4;
    const pixel: Vec3 = { x: (col - 1.5) * 9, y: 9 + (2 - row) * 9, z: -39 };
    const targetZ = depth === 'near' ? -2 : 27;
    const lambda = (targetZ - camera.z) / (pixel.z - camera.z);
    const world: Vec3 = {
      x: camera.x + (pixel.x - camera.x) * lambda,
      y: camera.y + (pixel.y - camera.y) * lambda,
      z: targetZ,
    };

    clearScene(ctx, width, height);
    label(ctx, 'π⁻¹：像素坐标 + 深度 → 世界坐标', 24, 31, C.ink, true, 16);
    label(ctx, '格子、相机参数 决定射线方向，深度 决定沿射线走多远', 24, 54, C.muted, false, 12);
    drawFloorGrid(ctx, view, 72, 18);
    drawBuilding(ctx, view, { x: 10, y: 0, z: 23 }, C.green, 0.38);

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const x0 = (c - 2) * 9;
        const x1 = x0 + 9;
        const y0 = 8 + (2 - r) * 9;
        const y1 = y0 + 9;
        const selected = r * 4 + c === cell;
        poly3D(ctx, [
          { x: x0, y: y0, z: -39 }, { x: x1, y: y0, z: -39 },
          { x: x1, y: y1, z: -39 }, { x: x0, y: y1, z: -39 },
        ], view, selected ? `${C.orange}bb` : '#ffffffaa', selected ? C.orange : C.blueSoft, selected ? 2.5 : 1);
      }
    }

    line3D(ctx, camera, world, view, C.orange, 3);
    drawPoint3D(ctx, pixel, view, C.orange, 3.5, true);
    const projected = drawPoint3D(ctx, world, view, C.green, 6, true);
    drawCamera3D(ctx, camera, pixel, view, C.blue, false);
    drawWorldAxes(ctx, view, { x: 48, y: 1, z: -10 }, 13);
    label(ctx, depth === 'near' ? '较近表面点' : '较远表面点', projected.x + 12, projected.y - 8, C.green, true, 12);

    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1.5;
    ctx.fillRect(505, 82, 228, 158);
    ctx.strokeRect(505, 82, 228, 158);
    label(ctx, `格 (u=${col}, v=${row})`, 527, 113, C.blue, true, 13);
    label(ctx, depth === 'near' ? 'D：近深度' : 'D：远深度', 527, 143, C.orange, true, 13);
    label(ctx, `pᵤᵥ ≈ (${world.x.toFixed(1)}, ${world.y.toFixed(1)}, ${world.z.toFixed(1)})`, 527, 176, C.green, true, 12);
    label(ctx, '载荷：完整 Fᵤᵥ ∈ R⁴⁸', 527, 207, C.purple, true, 12);
    label(ctx, '负深度 / 无效深度：不进入 ', 24, 351, C.red, true, 12);
    canvas.classList.add('is-ready');
  }, [cell, depth]);

  return (
    <div>
      <div className="chip-row">
        {[0, 2, 4, 7, 9, 11].map((index) => (
          <button key={index} className={`chip ${cell === index ? 'selected' : ''}`} onClick={() => setCell(index)}>格 {index}</button>
        ))}
      </div>
      <canvas ref={canvasRef} width={760} height={380} aria-label="latent 网格反投影到三维世界坐标" />
      <div className="chip-row">
        <button className={`chip ${depth === 'near' ? 'selected' : ''}`} onClick={() => setDepth('near')}>近深度</button>
        <button className={`chip ${depth === 'far' ? 'selected' : ''}`} onClick={() => setDepth('far')}>远深度</button>
      </div>
      <div className="feedback good">橙色格控制射线方向；切换深度时，绿色世界点沿同一条射线移动。反投影后，它与完整 48 通道 latent 载荷一起写入空间缓存。</div>
    </div>
  );
};
