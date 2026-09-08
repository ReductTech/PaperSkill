import React, { useEffect, useRef } from 'react';
import { easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  LSM_COLORS as C,
  clearScene,
  drawBuilding,
  drawCamera3D,
  drawCuboid,
  drawFloorGrid,
  drawOrbitPath,
  drawPoint3D,
  label,
  line3D,
  project3D,
  type View3D,
} from './lsm-3d-kit';

const titles = ['绕行重访', '表面携带 Token ', '沿射线落点', '最近表面胜出', '不断更新缓存', '跨块持续建图', '两阶段校准', '侧分支注入', '过滤动态物体', '缓存效率对比'];

export const LsmPhotoAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chapter = Math.max(1, Math.min(10, Number(chapterId.replace(/\D/g, '')) || 1));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = 244;
    const height = 150;
    const ctx = setupCanvas(canvas, width, height);
    const view: View3D = { ox: 126, oy: 116, scale: 1.1, yaw: -0.72, pitch: -0.5, focal: 520 };
    let raf = 0;
    let started = performance.now();

    const draw = () => {
      const raw = ((performance.now() - started) % 3600) / 3600;
      const t = easeInOutQuad(raw < 0.5 ? raw * 2 : (1 - raw) * 2);
      clearScene(ctx, width, height);
      drawFloorGrid(ctx, view, 50, 16);
      label(ctx, titles[chapter - 1], 10, 19, C.ink, true, 12);
      drawBuilding(ctx, view, { x: 8, y: 0, z: 3 }, chapter === 9 ? C.blue : C.green, 0.95);

      const angle = -2.45 + t * 3.8;
      const camera = { x: Math.cos(angle) * 47, y: 9, z: Math.sin(angle) * 39 };
      if (chapter <= 6) {
        drawOrbitPath(ctx, view, 47, 39, chapter === 1 ? C.orange : C.green, -2.45, angle, 2.2, chapter === 1 ? [5, 4] : []);
      }

      if (chapter === 1) {
        drawBuilding(ctx, view, { x: 5 * t, y: 0, z: -4 * t }, C.red, 0.45 + 0.35 * t);
      } else if (chapter === 2) {
        [-12, 0, 12].forEach((x, i) => drawPoint3D(ctx, { x: x + 8, y: 10 + i * 7, z: 20 }, view, i === 1 ? C.purple : C.green, 3, true));
      } else if (chapter === 3) {
        const world = { x: 8, y: 18, z: 20 };
        line3D(ctx, camera, world, view, C.orange, 2.2);
        drawPoint3D(ctx, world, view, C.green, 4, true);
      } else if (chapter === 4) {
        const near = { x: 7, y: 14, z: 27 };
        const far = { x: 7, y: 14, z: 5 };
        line3D(ctx, camera, far, view, C.blueSoft, 1.5);
        drawPoint3D(ctx, far, view, C.red, 3);
        drawPoint3D(ctx, near, view, C.green, 4, true);
      } else if (chapter === 5 || chapter === 6) {
        const count = chapter === 5 ? Math.round(2 + t * 7) : Math.round(4 + t * 9);
        for (let i = 0; i < count; i++) {
          const a = i * 1.57;
          drawPoint3D(ctx, { x: 8 + Math.cos(a) * 22, y: 7 + (i % 3) * 9, z: 3 + Math.sin(a) * 18 }, view, i < 5 ? C.green : C.blue, 2.4);
        }
      } else if (chapter === 7) {
        drawCuboid(ctx, { x: -27, y: 8, z: -12 }, { x: 15, y: 16, z: 15 }, view, { front: C.blue, side: '#3d5f91', top: C.blueSoft });
        drawCuboid(ctx, { x: 27, y: 8, z: 12 }, { x: 15, y: 16, z: 15 }, view, { front: C.purple, side: '#6530bf', top: '#b9a0ed' });
        line3D(ctx, { x: -20, y: 10, z: -8 }, { x: 21, y: 10, z: 8 }, view, C.orange, 3);
      } else if (chapter === 8) {
        drawCuboid(ctx, { x: -17, y: 14, z: 25 }, { x: 12, y: 28, z: 8 }, view, { front: C.purple, side: '#6030b0', top: '#c6b2ef' });
        line3D(ctx, { x: -12, y: 15, z: 21 }, { x: 4, y: 18, z: 15 }, view, C.purple, 3);
      } else if (chapter === 9) {
        const personX = -22 + t * 44;
        drawPoint3D(ctx, { x: personX, y: 15, z: 23 }, view, C.red, 5, true);
        const p = project3D({ x: personX, y: 5, z: 23 }, view);
        label(ctx, '不写入 M', p.x - 24, p.y + 16, C.red, true, 10);
      } else {
        const p = project3D({ x: -34, y: 31, z: -23 }, view);
        ctx.fillStyle = C.red;
        ctx.fillRect(p.x, p.y, 20 + t * 22, 6);
        ctx.fillStyle = C.green;
        ctx.fillRect(p.x, p.y - 12, 20 + t * 62, 6);
        label(ctx, 'RGB', p.x - 29, p.y + 6, C.red, true, 9);
        label(ctx, 'latent', p.x - 34, p.y - 7, C.green, true, 9);
      }

      if (![7, 8, 9, 10].includes(chapter)) drawCamera3D(ctx, camera, { x: 8, y: 16, z: 3 }, view, chapter === 1 ? C.orange : C.blue, chapter !== 5);
      canvas.classList.add('is-ready');
      raf = requestAnimationFrame(draw);
    };
    const stop = () => cancelAnimationFrame(raf);
    const disconnect = observeCanvas(canvas, () => {
      started = performance.now();
      raf = requestAnimationFrame(draw);
    }, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [chapter]);

  return <canvas ref={canvasRef} width={244} height={150} aria-label={`第 ${chapter} 章三维类比动画`} />;
};
