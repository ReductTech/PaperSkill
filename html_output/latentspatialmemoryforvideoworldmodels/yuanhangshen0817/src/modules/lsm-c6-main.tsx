import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  LSM_COLORS as C,
  clearScene,
  drawBuilding,
  drawCamera3D,
  drawFloorGrid,
  drawOrbitPath,
  drawPoint3D,
  label,
  type View3D,
} from './lsm-3d-kit';

const phases = [
  { name: '按目标位姿读出', detail: '每个目标帧从同一个持久缓存投影得到 ẑₜ 与 mₜ。' },
  { name: '扩散骨干去噪', detail: '前一 chunk 的去噪 latent 仍作为短期前序帧。' },
  { name: '解码输出帧', detail: '9 个 latent 帧解码为 33 个 704×1280 RGB 帧。' },
  { name: '更新长期缓存', detail: '估深、分割、重编码并反投影，只把 Λₜ 内的静态单元并入 M。' },
];

export const LsmC6Main: React.FC<WidgetProps> = () => {
  const [phase, setPhase] = useState(0);
  const [chunk, setChunk] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = 780;
    const height = 380;
    const ctx = setupCanvas(canvas, width, height);
    const view: View3D = { ox: 385, oy: 289, scale: 2.15, yaw: -0.7, pitch: -0.47, focal: 680 };
    clearScene(ctx, width, height);
    label(ctx, `Chunk ${chunk} · ${phases[phase].name}`, 24, 31, C.ink, true, 16);
    label(ctx, '相机分块前进，绿色三维锚点留在同一个世界坐标缓存 M 中', 24, 55, C.muted, false, 12);
    drawFloorGrid(ctx, view, 74, 18);
    drawBuilding(ctx, view, { x: 0, y: 0, z: 4 }, C.green, 0.72);
    drawOrbitPath(ctx, view, 65, 51, '#d8e2ee', -2.65, 0.95, 6);

    const chunkAngles = [-2.35, -1.15, 0.35];
    for (let c = 1; c <= 3; c++) {
      const angle = chunkAngles[c - 1];
      const camera = { x: Math.cos(angle) * 65, y: 11, z: Math.sin(angle) * 51 };
      if (c <= chunk) {
        drawCamera3D(ctx, camera, { x: 0, y: 17, z: 4 }, view, c === chunk ? C.blue : C.blueSoft, c === chunk);
      }
      const pointCount = c < chunk ? 7 : c === chunk ? Math.min(7, 2 + phase * 2) : 0;
      for (let i = 0; i < pointCount; i++) {
        const a = c * 1.4 + i * 0.72;
        drawPoint3D(ctx, { x: Math.cos(a) * (18 + (i % 2) * 8), y: 7 + (i % 4) * 8, z: 4 + Math.sin(a) * 18 }, view, c === chunk ? C.green : C.blueSoft, 3, c === chunk && i === pointCount - 1);
      }
    }

    for (let c = 1; c <= 3; c++) {
      const active = c === chunk;
      ctx.fillStyle = active ? C.green : c < chunk ? C.blueSoft : '#edf1f5';
      ctx.fillRect(520 + (c - 1) * 72, 91, 55, 24);
      label(ctx, `块 ${c}`, 532 + (c - 1) * 72, 108, C.white, true, 11);
    }
    label(ctx, '持久缓存 M', 563, 140, C.green, true, 13);
    label(ctx, phase === 3 ? '本块静态点已并入' : '本块仍在生成 / 读出', 535, 163, phase === 3 ? C.green : C.orange, true, 11);
    label(ctx, phases[phase].detail, 24, 350, phase === 3 ? C.green : C.blue, true, 12);
    canvas.classList.add('is-ready');
  }, [phase, chunk]);

  const next = () => {
    if (phase < 3) setPhase(phase + 1);
    else if (chunk < 3) { setChunk(chunk + 1); setPhase(0); }
  };
  const done = phase === 3 && chunk === 3;

  return (
    <div>
      <canvas ref={canvasRef} width={780} height={380} aria-label="跨 chunk 累积三维 latent 空间记忆" />
      <div className="step-ctrl">
        <button className="tiny" onClick={() => { setChunk(1); setPhase(0); }}>重置</button>
        <span className="step-label">Chunk <b>{chunk}</b> · {phases[phase].name}</span>
        <button className="tiny" disabled={done} onClick={next}>推进</button>
      </div>
      <div className={`feedback ${done ? 'good' : ''}`}>
        {phases[phase].detail}{done ? ' 三段相机轨迹已经共享同一张三维记忆；短期帧重叠与长期空间缓存的分工清晰可见。' : ''}
      </div>
    </div>
  );
};
