import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  LSM_COLORS as C,
  clearScene,
  drawBuilding,
  drawCamera3D,
  drawCuboid,
  drawFloorGrid,
  drawPoint3D,
  label,
  line3D,
  type View3D,
} from './lsm-3d-kit';

export const LsmC2Main: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<'rgb' | 'latent'>('rgb');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = 760;
    const height = 350;
    const ctx = setupCanvas(canvas, width, height);
    const view: View3D = { ox: 335, oy: 270, scale: 2.05, yaw: -0.74, pitch: -0.48, focal: 650 };
    clearScene(ctx, width, height);
    label(ctx, mode === 'rgb' ? 'RGB 点云：三维坐标 + [r,g,b]' : 'latent 记忆：三维坐标 + fᵢ ∈ Rᶜ', 24, 31, mode === 'rgb' ? C.red : C.green, true, 16);
    label(ctx, '同一个世界表面，改变的是每个三维点携带的载荷', 24, 54, C.muted, false, 12);
    drawFloorGrid(ctx, view, 68, 17);
    drawBuilding(ctx, view, { x: 0, y: 0, z: 5 }, mode === 'rgb' ? C.red : C.green, 0.72);

    const points = [
      { x: -17, y: 8, z: 22 }, { x: -8, y: 18, z: 22 }, { x: 2, y: 29, z: 22 },
      { x: 13, y: 12, z: 22 }, { x: 19, y: 26, z: 18 }, { x: 24, y: 18, z: 6 },
    ];
    if (mode === 'rgb') {
      const rgb = ['#d04a55', '#4b9a65', '#416fa2', '#d8a540', '#8d6fb4', '#cc6847'];
      points.forEach((point, i) => drawPoint3D(ctx, point, view, rgb[i], 4.2, false));
    } else {
      points.forEach((point, i) => {
        drawCuboid(ctx, point, { x: 4.5, y: 4.5, z: 4.5 }, view, {
          front: i % 2 ? C.purple : C.green,
          side: i % 2 ? '#6030b0' : '#177345',
          top: i % 2 ? '#c4b2eb' : C.greenSoft,
          stroke: C.white,
        });
      });
    }

    const targetCamera = { x: 63, y: 17, z: -42 };
    drawCamera3D(ctx, targetCamera, { x: 0, y: 17, z: 5 }, view, C.blue, true);
    line3D(ctx, targetCamera, points[2], view, mode === 'rgb' ? C.red : C.green, 2.5, mode === 'rgb' ? [5, 4] : []);

    ctx.fillStyle = C.white;
    ctx.strokeStyle = mode === 'rgb' ? C.red : C.green;
    ctx.lineWidth = 2.5;
    ctx.fillRect(532, 91, 201, 161);
    ctx.strokeRect(532, 91, 201, 161);
    label(ctx, '目标视角条件', 550, 118, C.ink, true, 13);
    if (mode === 'rgb') {
      ['R', 'G', 'B'].forEach((channel, i) => {
        ctx.fillStyle = [C.red, C.green, C.blue][i];
        ctx.fillRect(551 + i * 50, 140, 34, 34);
        label(ctx, channel, 563 + i * 50, 197, C.ink, true, 12);
      });
      label(ctx, 'Render → Encode', 555, 225, C.red, true, 13);
    } else {
      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = i % 3 === 0 ? C.green : i % 3 === 1 ? C.blue : C.purple;
        ctx.fillRect(551 + (i % 8) * 19, 139 + Math.floor(i / 8) * 28, 13, 13);
      }
      label(ctx, 'C = 48 · 直接投影', 555, 225, C.green, true, 13);
    }
    label(ctx, mode === 'rgb' ? 'H×W 像素网格' : 'h×w latent 网格', 532, 286, mode === 'rgb' ? C.red : C.green, true, 13);
    label(ctx, mode === 'rgb' ? '颜色载荷直观，但骨干不直接消费 RGB' : '载荷已处于视频扩散骨干的原生特征空间', 532, 310, C.muted, false, 11);
    canvas.classList.add('is-ready');
  }, [mode]);

  return (
    <div>
      <div className="chip-row">
        <button className={`chip ${mode === 'rgb' ? 'selected' : ''}`} onClick={() => setMode('rgb')}>RGB 点云</button>
        <button className={`chip ${mode === 'latent' ? 'selected' : ''}`} onClick={() => setMode('latent')}>latent 记忆</button>
      </div>
      <canvas ref={canvasRef} width={760} height={350} aria-label="RGB 点云与 latent 三维空间记忆切换" />
      <div className={`feedback ${mode === 'rgb' ? 'bad' : 'good'}`}>
        {mode === 'rgb'
          ? 'RGB 颜色便于显示，却不是扩散骨干原本消费的条件特征；每次读取目标视角还要经过渲染和编码，效率较低的同时，引入了信息损失。'
          : '每个世界点携带 C 通道的原生 latent  Token '}
      </div>
    </div>
  );
};
