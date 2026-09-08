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
  label,
  line3D,
  project3D,
  type Vec3,
  type View3D,
} from './lsm-3d-kit';

type Candidate = {
  id: string;
  point: Vec3;
  depth: number;
  cell?: [number, number];
  color: string;
  token: string;
  action: string;
  detail: string;
};

const CAMERA: Vec3 = { x: -50, y: 12, z: -42 };
const CAMERA_TARGET: Vec3 = { x: 0, y: 17, z: 11 };

// The camera and every p_i below are immutable world-space quantities.
// P2 and P3 lie on the same fixed camera ray, so they compete for one cell.
const CANDIDATES: Candidate[] = [
  {
    id: 'p₁', point: { x: -16, y: 23, z: 15 }, depth: 32, cell: [1, 0],
    color: C.blue, token: 'f₁', action: '写入空格 (0,1)',
    detail: '正深度且位于网格内：写入 f₁，并把该格的 mₜ 设为 1。',
  },
  {
    id: 'p₂', point: { x: -5, y: 16.5, z: 5.7 }, depth: 42, cell: [1, 2],
    color: C.red, token: 'f₂', action: '先写入格 (2,1)',
    detail: '这个格目前为空，因此先保存较远点 p₂ 的特征与深度 42。',
  },
  {
    id: 'p₃', point: { x: -19, y: 15.1, z: -9.1 }, depth: 24, cell: [1, 2],
    color: C.green, token: 'f₃', action: '24 < 42，覆盖 p₂',
    detail: 'p₂、p₃ 投到同一格；z-buffer 保留正深度更小的 p₃。',
  },
  {
    id: 'p₄', point: { x: 18, y: 25, z: 10 }, depth: 29, cell: [0, 3],
    color: C.purple, token: 'f₄', action: '写入空格 (3,0)',
    detail: '该点投影到另一个有效格，写入 f₄，并将对应 mₜ 设为 1。',
  },
  {
    id: 'p₅', point: { x: -67, y: 9, z: -58 }, depth: -11,
    color: C.orange, token: 'f₅', action: '负深度：丢弃',
    detail: 'p₅ 位于目标相机后方，深度不为正，不参与网格填充。',
  },
  {
    id: 'p₆', point: { x: 42, y: 30, z: 25 }, depth: 51,
    color: C.orange, token: 'f₆', action: '投影越界：丢弃',
    detail: 'p₆ 虽然深度为正，但投影位置超出目标 latent 网格。',
  },
];

function buildBuffer(processed: number) {
  const buffer = new Map<string, Candidate>();
  CANDIDATES.slice(0, processed).forEach((candidate) => {
    if (!candidate.cell || candidate.depth <= 0) return;
    const key = candidate.cell.join('-');
    const previous = buffer.get(key);
    if (!previous || candidate.depth < previous.depth) buffer.set(key, candidate);
  });
  return buffer;
}

export const LsmC4Main: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const current = step > 0 ? CANDIDATES[step - 1] : undefined;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = 780;
    const height = 430;
    const ctx = setupCanvas(canvas, width, height);
    const view: View3D = { ox: 270, oy: 337, scale: 2.15, yaw: -0.67, pitch: -0.43, focal: 680 };
    const buffer = buildBuffer(step);

    clearScene(ctx, width, height);
    label(ctx, '固定目标相机 Eₜ：逐点投影 pᵢ → 填格 → z-buffer', 24, 31, C.ink, true, 16);
    label(ctx, `已处理 ${step} / ${CANDIDATES.length} 个记忆点`, 24, 55, C.blue, true, 12);

    drawFloorGrid(ctx, view, 68, 17);
    drawBuilding(ctx, view, { x: 1, y: 0, z: 12 }, C.green, 0.5);
    drawCamera3D(ctx, CAMERA, CAMERA_TARGET, view, C.blue, true);
    const camera2d = project3D(CAMERA, view);
    label(ctx, '目标相机固定', camera2d.x - 42, camera2d.y + 23, C.blue, true, 11);

    CANDIDATES.forEach((candidate, index) => {
      const processed = index < step;
      const isCurrent = index === step - 1;
      const pointColor = processed ? candidate.color : C.blueSoft;
      const p = drawPoint3D(ctx, candidate.point, view, pointColor, isCurrent ? 6 : 4, isCurrent);
      label(ctx, candidate.id, p.x + 7, p.y - 6, pointColor, isCurrent, 10);
      if (isCurrent) {
        line3D(ctx, CAMERA, candidate.point, view, candidate.cell ? C.blue : C.orange, 2.2, candidate.cell ? [] : [5, 4]);
      }
    });

    label(ctx, current ? `当前：${current.id} · ${current.action}` : '点击“投影下一个 pᵢ”开始', 24, 394, current ? current.color : C.muted, true, 12);
    label(ctx, '相机与全部记忆点始终保持世界坐标不变', 24, 416, C.muted, false, 11);

    const panelX = 520;
    const panelY = 82;
    const cellW = 43;
    const cellH = 38;
    const gap = 7;
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2.5;
    ctx.fillRect(panelX, panelY, 235, 276);
    ctx.strokeRect(panelX, panelY, 235, 276);
    label(ctx, '目标 latent 网格', panelX + 18, panelY + 28, C.ink, true, 13);
    label(ctx, '固定 K, Eₜ', panelX + 143, panelY + 28, C.muted, false, 10);

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const winner = buffer.get(`${row}-${col}`);
        const x = panelX + 18 + col * (cellW + gap);
        const y = panelY + 48 + row * (cellH + gap);
        ctx.fillStyle = winner ? `${winner.color}28` : '#edf1f5';
        ctx.strokeStyle = winner ? winner.color : C.line;
        ctx.lineWidth = winner ? 2 : 1;
        ctx.fillRect(x, y, cellW, cellH);
        ctx.strokeRect(x, y, cellW, cellH);
        if (winner) {
          label(ctx, winner.token, x + 13, y + 18, winner.color, true, 11);
          label(ctx, `z=${winner.depth}`, x + 7, y + 32, C.muted, false, 8);
        }
      }
    }

    const filled = buffer.size;
    label(ctx, `mₜ：${filled} 格为 1，其余为 0`, panelX + 18, panelY + 203, filled ? C.green : C.muted, true, 11);
    label(ctx, '每格保存最近可见点的 fᵢ', panelX + 18, panelY + 227, C.ink, true, 11);
    label(ctx, '空格：ẑₜ=0，mₜ=0', panelX + 18, panelY + 248, C.muted, false, 10);
    canvas.classList.add('is-ready');
  }, [step, current]);

  const finished = step === CANDIDATES.length;
  return (
    <div>
      <canvas ref={canvasRef} width={780} height={430} aria-label="固定目标相机后逐个投影三维记忆点并填充 latent 网格" />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => setStep(0)} disabled={step === 0}>重置</button>
        <button className="tiny ghost" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}>上一个点</button>
        <button className="tiny" onClick={() => setStep((value) => Math.min(CANDIDATES.length, value + 1))} disabled={finished}>{finished ? '投影完成' : '投影下一个 pᵢ'}</button>
        <span className="step-label"><b>{step}</b> / {CANDIDATES.length}</span>
      </div>
      <div className={`feedback ${finished || (current?.cell && current.depth > 0) ? 'good' : ''}`}>
        {finished
          ? '固定视角读出完成：有效点填入 ẑₜ；同格只留下最小正深度的特征；空格保持 ẑₜ=0、mₜ=0。'
          : current
            ? `${current.id}：${current.detail}`
            : '目标相机 Eₜ 与所有世界点 pᵢ 已固定。点击按钮，按顺序观察每个点如何投影、竞争并填充目标 latent 网格。'}
      </div>
    </div>
  );
};
