import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, drawSceneLabel, startObservedLoop } from './stage-analogy';

type ReconstructionStep = 0 | 1 | 2 | 3;
type EncodingSubstep = 0 | 1 | 2;
type ProjectionSubstep = 0 | 1 | 2;
type AttentionSubstep = 0 | 1 | 2 | 3;
type Point3 = { x: number; y: number; z: number };
type ProjectionVariableKey =
  | 'si' | 'Dsuv' | 'Ks' | 'Tsc2w'
  | 'deltaT' | 'deltaYaw' | 'Ttarget' | 'Ts'
  | 'Xsc' | 'Ksinv' | 'ps' | 'Xw' | 'Xtc'
  | 'dtuv' | 'Py' | 'time' | 'depthOffset' | 'latentHw';

const PROJECTION_VARIABLES: Record<ProjectionVariableKey, { label: string; explanation: string }> = {
  si: { label: 'sᵢ', explanation: '第i张参考图像或视频帧；ViPE与VAE必须读取同一帧，才能让几何地址与内容Token配对。' },
  Dsuv: { label: 'Dₛ(u,v)', explanation: '源像素(u,v)的深度；计算时与Kₛ⁻¹pₛ相乘，把二维像素沿相机射线反投影为三维点。' },
  Ks: { label: 'Kₛ', explanation: '源相机内参矩阵；其逆矩阵把像素坐标还原为源相机坐标系中的视线方向。' },
  Tsc2w: { label: 'Tₛᶜ²ʷ', explanation: '源相机到世界坐标的位姿；计算时把Xₛᶜ变换为同一个世界点Xw。' },
  deltaT: { label: 'ΔTuser', explanation: '用户提供的相对相机变化；与基准相机位姿组合后得到目标相机位姿。' },
  deltaYaw: { label: 'Δyaw', explanation: '用户要求的水平旋转角；本例为+45°，用于构造ΔTuser中的旋转部分。' },
  Ttarget: { label: 'Tₜtarget,c2w', explanation: '第t帧目标相机到世界坐标的位姿；用于把世界点转换到目标相机坐标系。' },
  Ts: { label: 'Tₛ', explanation: '源相机的基准位姿；与ΔTuser组合得到目标位姿，具体左右乘顺序取决于坐标约定。' },
  Xsc: { label: 'Xₛᶜ', explanation: '源像素反投影后在源相机坐标系中的三维点；计算式为DₛKₛ⁻¹pₛ。' },
  Ksinv: { label: 'Kₛ⁻¹', explanation: '源相机内参的逆；把齐次像素pₛ转换为相机射线方向。' },
  ps: { label: 'pₛ', explanation: '源像素的齐次坐标[uₛ,vₛ,1]ᵀ；与深度和Kₛ⁻¹共同恢复Xₛᶜ。' },
  Xw: { label: 'Xw', explanation: '同一个场景点在世界坐标系中的位置；由Tₛᶜ²ʷXₛᶜ得到。' },
  Xtc: { label: 'Xₜᶜ', explanation: '同一个世界点在目标相机坐标系中的位置；由目标位姿的逆变换得到。' },
  dtuv: { label: '(dₜ,uₜ,vₜ)', explanation: '目标视角下的深度与像素位置；uₜ、vₜ由针孔投影计算，dₜ用于区分前后层。' },
  Py: { label: 'Pᵧ', explanation: '参考Token在目标视角中的RoPE地址；它用于位置匹配，不是直接渲染出的目标像素。' },
  time: { label: 't', explanation: '参考Token的时间地址；视频中还会加入分数时间以区分不同参考帧。' },
  depthOffset: { label: 'Δ(dₜ)', explanation: '由深度归一化得到的时间轴小偏移，范围为[0,0.1]，用于保留前后层次。' },
  latentHw: { label: '(h̃,w̃)', explanation: '目标像素(uₜ,vₜ)换算到VAE latent或patch网格后的行列位置。' },
};

function ProjectionSymbol({
  variable,
  instanceId,
  active,
  onToggle,
}: {
  variable: ProjectionVariableKey;
  instanceId: string;
  active: boolean;
  onToggle: (instanceId: string) => void;
}) {
  const info = PROJECTION_VARIABLES[variable];
  return (
    <button
      type="button"
      className={`projection-symbol ${active ? 'active' : ''}`}
      aria-pressed={active}
      onClick={() => onToggle(instanceId)}
    >
      {info.label}
      <span className="projection-symbol-popover" role="tooltip">
        <strong>{info.label}</strong>
        <span>{info.explanation}</span>
      </span>
    </button>
  );
}

const STEP_LABELS = [
  '1 输入参考图像/视频',
  '2 提取参考上下文Kᵧ/Vᵧ',
  '3 建模与反投影',
  '4 Attn计算过程',
];

const ENCODING_SUBSTEP_LABELS = [
  '2.1 VAE编码',
  '2.2 提取特征yᵢ',
  '2.3 得到Kᵧᵢ和Vᵧᵢ',
];

const SUBSTEP_LABELS = [
  '3.1 ViPE几何建模',
  '3.2 加入用户相机条件',
  '3.3 反投影并得到Pᵧ',
];

const ATTENTION_SUBSTEP_LABELS = [
  '4.1 得到QKV',
  '4.2 位置编码',
  '4.3 Attn计算',
  '4.4 去噪生成图像',
];

const GRID_ROWS = 6;
const GRID_COLS = 5;
const CELL_SIZE = 44;
const VIEW_WIDTH = GRID_COLS * CELL_SIZE;
const VIEW_HEIGHT = GRID_ROWS * CELL_SIZE;
const VIEW_Y = 96;
const SOURCE_X = 58;
const TARGET_X = 722;
const SELECTION_ORANGE = '#f08a24';
const TOKEN_CELL = { row: 1, col: 0 };
const TARGET_CELL = { row: 1, col: 1 };

function clearUniformStage(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#f7f8f5';
  ctx.fillRect(0, 0, w, h);
}

function fadeCanvasRegion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opacity = .48,
) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.clip();
  ctx.fillStyle = `rgba(225,228,229,${opacity})`;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, active = false) {
  ctx.fillStyle = active ? 'rgba(240,138,36,.065)' : C.white;
  ctx.strokeStyle = active ? SELECTION_ORANGE : C.line;
  ctx.lineWidth = active ? 2.4 : 1.3;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, dashed = false) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.strokeStyle = SELECTION_ORANGE;
  ctx.fillStyle = SELECTION_ORANGE;
  ctx.lineWidth = 2;
  if (dashed) ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 8 * Math.cos(angle - .48), y2 - 8 * Math.sin(angle - .48));
  ctx.lineTo(x2 - 8 * Math.cos(angle + .48), y2 - 8 * Math.sin(angle + .48));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  source?: { x: number; y: number; w: number; h: number },
) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 7);
  ctx.clip();
  ctx.fillStyle = '#eeece8';
  ctx.fillRect(x, y, w, h);
  if (image?.complete && image.naturalWidth > 0) {
    const crop = source ?? { x: 0, y: 0, w: image.naturalWidth, h: image.naturalHeight };
    const scale = Math.max(w / crop.w, h / crop.h);
    const drawW = crop.w * scale;
    const drawH = crop.h * scale;
    ctx.drawImage(image, crop.x, crop.y, crop.w, crop.h, x + (w - drawW) / 2, y + (h - drawH) / 2, drawW, drawH);
  }
  ctx.restore();
  ctx.strokeStyle = '#8d959d';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 7);
  ctx.stroke();
}

function drawLatentFeatureGrid(ctx: CanvasRenderingContext2D, x: number, y: number, highlightToken = true) {
  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let col = 0; col < GRID_COLS; col += 1) {
      const selected = highlightToken && row === TOKEN_CELL.row && col === TOKEN_CELL.col;
      const shade = 241 - ((row * 13 + col * 17) % 38);
      ctx.fillStyle = selected ? 'rgba(240,138,36,.16)' : `rgb(${shade},${shade + 1},${Math.min(248, shade + 4)})`;
      ctx.strokeStyle = selected ? SELECTION_ORANGE : '#b5bdc5';
      ctx.lineWidth = selected ? 3 : 1;
      ctx.fillRect(x + col * CELL_SIZE, y + row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      ctx.strokeRect(x + col * CELL_SIZE, y + row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }
  const cellX = x + TOKEN_CELL.col * CELL_SIZE;
  const cellY = y + TOKEN_CELL.row * CELL_SIZE;
  if (highlightToken) {
    drawSceneLabel(ctx, 'yᵢ', cellX + CELL_SIZE / 2, cellY + CELL_SIZE / 2 + 5, SELECTION_ORANGE, 'center');
  }
  return { x: cellX + CELL_SIZE / 2, y: cellY + CELL_SIZE / 2 };
}

function drawVaeMask(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, opacity: number) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 7);
  ctx.clip();
  ctx.fillStyle = `rgba(91,96,102,${opacity})`;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = `rgba(255,255,255,${Math.min(1, opacity * 1.18)})`;
  ctx.font = '800 32px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VAE', x + w / 2, y + h / 2);
  ctx.restore();
}

function drawFeatureRectangle(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, sub: string) {
  ctx.fillStyle = 'rgba(240,138,36,.10)';
  ctx.strokeStyle = SELECTION_ORANGE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, 92, 48, 7);
  ctx.fill();
  ctx.stroke();
  drawSceneLabel(ctx, label, x + 46, y + 20, SELECTION_ORANGE, 'center');
  drawSceneLabel(ctx, sub, x + 46, y + 38, '#191f26', 'center');
}

function fillNoiseField(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cellW = w / GRID_COLS;
  const cellH = h / GRID_ROWS;
  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let col = 0; col < GRID_COLS; col += 1) {
      const shade = 151 + ((row * 47 + col * 31) % 84);
      ctx.fillStyle = `rgb(${shade},${Math.max(126, shade - 8)},${Math.min(241, shade + 7)})`;
      ctx.fillRect(x + col * cellW, y + row * cellH, cellW, cellH);
    }
  }
}

function drawTargetGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  onImage = false,
  highlightToken = true,
) {
  const cellW = w / GRID_COLS;
  const cellH = h / GRID_ROWS;
  ctx.strokeStyle = onImage ? 'rgba(255,255,255,.58)' : 'rgba(25,31,38,.28)';
  ctx.lineWidth = 1;
  for (let col = 0; col <= GRID_COLS; col += 1) {
    ctx.beginPath();
    ctx.moveTo(x + col * cellW, y);
    ctx.lineTo(x + col * cellW, y + h);
    ctx.stroke();
  }
  for (let row = 0; row <= GRID_ROWS; row += 1) {
    ctx.beginPath();
    ctx.moveTo(x, y + row * cellH);
    ctx.lineTo(x + w, y + row * cellH);
    ctx.stroke();
  }
  if (!highlightToken) {
    return { x: x + w / 2, y: y + h / 2 };
  }
  const cellX = x + TARGET_CELL.col * cellW;
  const cellY = y + TARGET_CELL.row * cellH;
  ctx.fillStyle = 'rgba(240,138,36,.18)';
  ctx.fillRect(cellX, cellY, cellW, cellH);
  ctx.strokeStyle = SELECTION_ORANGE;
  ctx.lineWidth = 3;
  ctx.strokeRect(cellX + 1, cellY + 1, cellW - 2, cellH - 2);
  drawSceneLabel(ctx, label, cellX + cellW / 2, cellY + cellH / 2 + 5, SELECTION_ORANGE, 'center');
  return { x: cellX + cellW / 2, y: cellY + cellH / 2 };
}

function projectIso(point: Point3) {
  const scale = 58;
  return {
    x: 500 + (point.x - point.z) * scale,
    y: 397 + (point.x + point.z) * scale * .27 - point.y * scale,
  };
}

function line3(
  ctx: CanvasRenderingContext2D,
  a: Point3,
  b: Point3,
  color: string,
  width = 1.5,
  dashed = false,
) {
  const p1 = projectIso(a);
  const p2 = projectIso(b);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  if (dashed) ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
  ctx.restore();
}

function drawCamera3D(
  ctx: CanvasRenderingContext2D,
  camera: Point3,
  target: Point3,
  label: string,
  color: string,
  dashed = false,
) {
  const p = projectIso(camera);
  const t = projectIso(target);
  const angle = Math.atan2(t.y - p.y, t.x - p.x);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(angle);
  ctx.strokeStyle = color;
  ctx.fillStyle = dashed ? 'rgba(255,255,255,.45)' : color;
  ctx.lineWidth = 2;
  if (dashed) ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.roundRect(-13, -9, 24, 18, 4);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(11, -6);
  ctx.lineTo(25, -10);
  ctx.lineTo(25, 10);
  ctx.lineTo(11, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  const labelNearRight = p.x > 560;
  const labelX = labelNearRight ? Math.min(632, p.x + 18) : p.x;
  drawSceneLabel(ctx, label, labelX, p.y - 18, color, labelNearRight ? 'right' : 'center');
}

function drawGeometryScene(ctx: CanvasRenderingContext2D, substep: ProjectionSubstep, neutral = false) {
  const targetColor = neutral ? '#7d8993' : SELECTION_ORANGE;
  const targetFill = neutral ? 'rgba(125,137,147,.13)' : 'rgba(240,138,36,.13)';
  const originalOrbit = -125 * Math.PI / 180;
  const targetOrbit = originalOrbit + 45 * Math.PI / 180;
  const originalCamera: Point3 = { x: Math.cos(originalOrbit) * 1.75, y: 1.45, z: Math.sin(originalOrbit) * 1.75 };
  const targetCamera: Point3 = { x: Math.cos(targetOrbit) * 1.75, y: 1.45, z: Math.sin(targetOrbit) * 1.75 };
  const originalGround: Point3 = { ...originalCamera, y: 0 };
  const targetGround: Point3 = { ...targetCamera, y: 0 };
  const sceneTarget: Point3 = { x: 0, y: 1.15, z: 0 };
  const can: Point3 = { x: -.38, y: 1.48, z: .04 };

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(360, 86, 280, 348, 8);
  ctx.clip();
  ctx.fillStyle = '#f4f5f2';
  ctx.fillRect(360, 86, 280, 348);
  drawSceneLabel(ctx, '人物—可乐—相机的世界坐标模型', 500, 106, '#191f26', 'center');

  for (let index = -2; index <= 2; index += 1) {
    line3(ctx, { x: index * .65, y: 0, z: -2 }, { x: index * .65, y: 0, z: 2 }, 'rgba(90,103,116,.24)', 1);
    line3(ctx, { x: -2, y: 0, z: index * .65 }, { x: 2, y: 0, z: index * .65 }, 'rgba(90,103,116,.24)', 1);
  }

  ctx.save();
  ctx.strokeStyle = 'rgba(90,103,116,.62)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let index = 0; index <= 64; index += 1) {
    const angle = index / 64 * Math.PI * 2;
    const orbitPoint = projectIso({ x: Math.cos(angle) * 1.75, y: 0, z: Math.sin(angle) * 1.75 });
    if (index === 0) ctx.moveTo(orbitPoint.x, orbitPoint.y);
    else ctx.lineTo(orbitPoint.x, orbitPoint.y);
  }
  ctx.stroke();
  ctx.restore();

  const base = projectIso({ x: 0, y: 0, z: 0 });
  const oldGround2d = projectIso(originalGround);
  const newGround2d = projectIso(targetGround);
  line3(ctx, { x: 0, y: 0, z: 0 }, originalGround, substep >= 1 ? '#8a949e' : '#4b5865', 1.8, substep >= 1);
  if (substep >= 1) {
    line3(ctx, { x: 0, y: 0, z: 0 }, targetGround, targetColor, 2.4);
    const a0 = Math.atan2(oldGround2d.y - base.y, oldGround2d.x - base.x);
    const a1 = Math.atan2(newGround2d.y - base.y, newGround2d.x - base.x);
    ctx.fillStyle = targetFill;
    ctx.strokeStyle = targetColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(base.x, base.y);
    ctx.arc(base.x, base.y, 35, a0, a1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawSceneLabel(ctx, 'Δyaw=+45°', base.x + 4, base.y - 42, targetColor, 'center');
  }

  line3(ctx, originalCamera, originalGround, substep >= 1 ? '#8a949e' : '#4b5865', 1.5, true);
  if (substep >= 1) line3(ctx, targetCamera, targetGround, targetColor, 1.8, true);

  const hip = projectIso({ x: 0, y: .68, z: 0 });
  const neck = projectIso({ x: 0, y: 1.48, z: 0 });
  const head = projectIso({ x: 0, y: 1.73, z: 0 });
  ctx.strokeStyle = '#213a5d';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hip.x, hip.y);
  ctx.lineTo(neck.x, neck.y);
  ctx.stroke();
  line3(ctx, { x: 0, y: .68, z: 0 }, { x: -.22, y: 0, z: -.04 }, '#213a5d', 6);
  line3(ctx, { x: 0, y: .68, z: 0 }, { x: .22, y: 0, z: .04 }, '#213a5d', 6);
  line3(ctx, { x: 0, y: 1.33, z: 0 }, can, '#213a5d', 6);
  line3(ctx, { x: 0, y: 1.33, z: 0 }, { x: .44, y: .88, z: 0 }, '#213a5d', 6);
  ctx.fillStyle = '#d4a17e';
  ctx.strokeStyle = '#8f694f';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(head.x, head.y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  const can2d = projectIso(can);
  ctx.fillStyle = '#b52f2f';
  ctx.strokeStyle = '#7b2020';
  ctx.beginPath();
  ctx.roundRect(can2d.x - 7, can2d.y - 12, 14, 24, 4);
  ctx.fill();
  ctx.stroke();

  drawCamera3D(ctx, originalCamera, sceneTarget, substep >= 1 ? '原位置' : 'ViPE原相机 Tₛ', substep >= 1 ? '#8a949e' : '#4b5865', substep >= 1);
  if (substep >= 1) drawCamera3D(ctx, targetCamera, sceneTarget, '目标位置', targetColor);
  if (substep >= 2) {
    line3(ctx, can, targetCamera, targetColor, 2, true);
    drawSceneLabel(ctx, '目标相机观察射线', 541, 193, targetColor, 'center');
  }

  const axis = projectIso({ x: -1.65, y: 0, z: 1.55 });
  ctx.strokeStyle = '#7a8792';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(axis.x, axis.y);
  ctx.lineTo(axis.x + 25, axis.y + 7);
  ctx.moveTo(axis.x, axis.y);
  ctx.lineTo(axis.x, axis.y - 25);
  ctx.moveTo(axis.x, axis.y);
  ctx.lineTo(axis.x - 20, axis.y + 7);
  ctx.stroke();
  drawSceneLabel(ctx, 'X', axis.x + 29, axis.y + 10, '#191f26');
  drawSceneLabel(ctx, 'Y', axis.x, axis.y - 30, '#191f26', 'center');
  drawSceneLabel(ctx, 'Z', axis.x - 26, axis.y + 10, '#191f26');

  const stateLabel = substep === 0
    ? 'ViPE恢复源帧三维结构与原相机位置'
    : substep === 1
      ? '标出原位置与用户要求的目标位置'
      : '由源像素反投影到三维，再投向目标相机';
  drawSceneLabel(ctx, stateLabel, 500, 423, substep === 0 || neutral ? '#191f26' : SELECTION_ORANGE, 'center');
  ctx.restore();
}

function drawGeometryCollapse(ctx: CanvasRenderingContext2D, progress: number) {
  const finalHeight = 98;
  const height = 400 - (400 - finalHeight) * progress;
  const y = 50 + (400 - height) / 2;
  panel(ctx, 350, y, 300, height);

  if (progress < 1) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(350, y, 300, height, 10);
    ctx.clip();
    ctx.globalAlpha = Math.max(0, 1 - progress * 1.15);
    drawGeometryScene(ctx, 2, true);
    ctx.restore();
  }

  ctx.save();
  ctx.globalAlpha = Math.min(1, progress * 1.4);
  drawSceneLabel(ctx, '建模与反投影', 500, y + height / 2 + 5, '#191f26', 'center');
  ctx.restore();
}

function formulaCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  title: string,
  lines: string[],
  active = false,
) {
  ctx.fillStyle = active ? 'rgba(240,138,36,.10)' : '#f8f8f6';
  ctx.strokeStyle = active ? SELECTION_ORANGE : '#b8c0c8';
  ctx.lineWidth = active ? 2 : 1.2;
  ctx.beginPath();
  ctx.roundRect(x, y, 292, 98, 8);
  ctx.fill();
  ctx.stroke();
  drawSceneLabel(ctx, title, x + 14, y + 23, active ? SELECTION_ORANGE : '#191f26');
  lines.forEach((line, index) => drawSceneLabel(ctx, line, x + 14, y + 50 + index * 21, '#191f26'));
}

function drawKVBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  _kind: 'key' | 'value',
  highlighted = false,
  dashed = false,
) {
  const color = SELECTION_ORANGE;
  ctx.fillStyle = highlighted ? 'rgba(240,138,36,.18)' : '#eef0f1';
  ctx.strokeStyle = highlighted ? color : '#aeb6bd';
  ctx.lineWidth = highlighted ? 2.4 : 1.2;
  if (dashed) ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.roundRect(x, y, 50, 42, 7);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  drawSceneLabel(ctx, label, x + 25, y + 27, highlighted ? color : '#68737d', 'center');
}

function drawSpatialKVSpace(
  ctx: CanvasRenderingContext2D,
  encodingSubstep: EncodingSubstep,
  vaeProgress: number,
) {
  drawSceneLabel(ctx, 'KV空间', 38, 493, '#191f26');
  const status = encodingSubstep === 0
    ? vaeProgress >= .86 ? 'VAE编码完成，得到特征集合Y' : 'VAE正在编码输入数据'
    : encodingSubstep === 1
      ? '由Latent Y构建多组参考KV'
      : '由yᵢ得到Kᵧᵢ/Vᵧᵢ并加入模型原生KV';
  drawSceneLabel(ctx, status, 962, 493, encodingSubstep === 2 ? SELECTION_ORANGE : '#68737d', 'right');

  ctx.fillStyle = '#f2f5f7';
  ctx.strokeStyle = '#b5bdc5';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.roundRect(38, 505, 454, 112, 8);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  drawSceneLabel(ctx, '初始化Latent X的KV', 52, 526, '#4b5865');
  drawSceneLabel(ctx, 'Kₓ=WₖX，Vₓ=WᵥX', 475, 526, '#68737d', 'right');

  const nativePairs = [
    { x: 55, k: 'Kₓ₁', v: 'Vₓ₁' },
    { x: 211, k: 'Kₓᵢ', v: 'Vₓᵢ' },
    { x: 367, k: 'Kₓₙ', v: 'Vₓₙ' },
  ];
  nativePairs.forEach((pair, index) => {
    drawKVBlock(ctx, pair.x, 543, pair.k, 'key', false, true);
    drawKVBlock(ctx, pair.x + 58, 543, pair.v, 'value', false, true);
    if (index < nativePairs.length - 1) {
      drawSceneLabel(ctx, '···', pair.x + 135, 570, '#9aa2a9', 'center');
    }
  });

  const contextReady = encodingSubstep === 2;
  const contextVisible = encodingSubstep >= 1;
  ctx.fillStyle = contextReady ? 'rgba(240,138,36,.055)' : '#f7f8f6';
  ctx.strokeStyle = contextVisible ? SELECTION_ORANGE : '#b5bdc5';
  ctx.lineWidth = contextVisible ? 2 : 1.2;
  if (!contextVisible) ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.roundRect(508, 505, 454, 112, 8);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  drawSceneLabel(ctx, '参考KV空间', 522, 526, contextVisible ? SELECTION_ORANGE : '#68737d');
  if (contextVisible) {
    drawSceneLabel(ctx, contextReady ? '高亮yᵢ对应的参考KV' : 'Latent Y → 多组Kᵧ/Vᵧ', 945, 526, '#68737d', 'right');
    const contextPairs = [
      { x: 525, k: 'Kᵧ₁', v: 'Vᵧ₁' },
      { x: 675, k: 'Kᵧᵢ', v: 'Vᵧᵢ', selected: contextReady },
      { x: 825, k: 'Kᵧₙ', v: 'Vᵧₙ' },
    ];
    contextPairs.forEach((pair, index) => {
      drawKVBlock(ctx, pair.x, 543, pair.k, 'key', Boolean(pair.selected));
      drawKVBlock(ctx, pair.x + 58, 543, pair.v, 'value', Boolean(pair.selected));
      if (index < contextPairs.length - 1) {
        drawSceneLabel(ctx, '···', pair.x + 130, 570, '#9aa2a9', 'center');
      }
    });
    if (contextReady) {
      ctx.strokeStyle = SELECTION_ORANGE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(669, 537, 120, 54, 9);
      ctx.stroke();
      arrow(
        ctx,
        SOURCE_X + (TOKEN_CELL.col + 1) * CELL_SIZE,
        VIEW_Y + (TOKEN_CELL.row + .5) * CELL_SIZE,
        729,
        537,
      );
      drawSceneLabel(ctx, 'yᵢ对应的Kᵧᵢ / Vᵧᵢ', 729, 608, '#191f26', 'center');
    } else {
      arrow(ctx, SOURCE_X + VIEW_WIDTH, VIEW_Y + VIEW_HEIGHT - 8, 735, 502, true);
    }
  }
}

function drawAttentionKVPreparation(ctx: CanvasRenderingContext2D, positionEncoding = false) {
  drawSceneLabel(ctx, 'KV空间', 38, 493, '#191f26');
  drawSceneLabel(
    ctx,
    positionEncoding
      ? '模型原生Kₓ使用Pₓ，参考上下文Kᵧ使用Pᵧ'
      : 'Qₓ=WqX，Kₓ=WₖX，Vₓ=WᵥX；Kᵧ=WₖY，Vᵧ=WᵥY',
    962,
    493,
    '#68737d',
    'right',
  );

  const groups = [
    { x: 38, title: '目标Latent X的KV', formula: '模型原生KV', type: 'x' as const },
    { x: 508, title: '参考Latent Y的KV', formula: '参考上下文KV', type: 'y' as const },
  ];
  groups.forEach(group => {
    const highlightTargetLatent = !positionEncoding && group.type === 'x';
    ctx.fillStyle = highlightTargetLatent ? 'rgba(240,138,36,.055)' : '#f7f8f6';
    ctx.strokeStyle = highlightTargetLatent ? SELECTION_ORANGE : '#b5bdc5';
    ctx.lineWidth = highlightTargetLatent ? 2 : 1.2;
    ctx.beginPath();
    ctx.roundRect(group.x, 505, 454, 112, 8);
    ctx.fill();
    ctx.stroke();
    drawSceneLabel(ctx, group.title, group.x + 14, 526, highlightTargetLatent ? SELECTION_ORANGE : '#4b5865');
    drawSceneLabel(ctx, group.formula, group.x + 437, 526, '#68737d', 'right');
  });

  const nativePairs = [
    { x: 55, k: 'Kₓ₁', v: 'Vₓ₁' },
    { x: 211, k: 'Kₓᵢ', v: 'Vₓᵢ' },
    { x: 367, k: 'Kₓₙ', v: 'Vₓₙ' },
  ];
  const contextPairs = [
    { x: 525, k: 'Kᵧ₁', v: 'Vᵧ₁' },
    { x: 675, k: 'Kᵧᵢ', v: 'Vᵧᵢ' },
    { x: 825, k: 'Kᵧₙ', v: 'Vᵧₙ' },
  ];
  nativePairs.forEach((pair, index) => {
    drawKVBlock(ctx, pair.x, 543, pair.k, 'key');
    drawKVBlock(ctx, pair.x + 58, 543, pair.v, 'value');
    if (index < nativePairs.length - 1) drawSceneLabel(ctx, '···', pair.x + 135, 570, '#9aa2a9', 'center');
  });
  contextPairs.forEach((pair, index) => {
    drawKVBlock(ctx, pair.x, 543, pair.k, 'key');
    drawKVBlock(ctx, pair.x + 58, 543, pair.v, 'value');
    if (index < contextPairs.length - 1) drawSceneLabel(ctx, '···', pair.x + 130, 570, '#9aa2a9', 'center');
  });

}

function drawAttentionBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseline: number,
  height: number,
  label: string,
  highlighted = false,
) {
  ctx.fillStyle = highlighted ? 'rgba(240,138,36,.78)' : '#aab4bd';
  ctx.strokeStyle = highlighted ? SELECTION_ORANGE : '#7d8993';
  ctx.lineWidth = highlighted ? 2 : 1.2;
  ctx.beginPath();
  ctx.roundRect(x, baseline - height, 38, height, 5);
  ctx.fill();
  ctx.stroke();
  drawSceneLabel(ctx, label, x + 19, baseline + 19, highlighted ? SELECTION_ORANGE : '#68737d', 'center');
}

function drawAttentionCalculation(ctx: CanvasRenderingContext2D, denoising = false) {
  drawSceneLabel(ctx, denoising ? '4.4 Attn输出参与逐步去噪' : '4.3 Attn计算', 38, 493, '#191f26');
  drawSceneLabel(
    ctx,
    denoising ? '根据联合注意力输出逐步还原目标图像' : '柱高表示Qₓ对各Key的注意力权重',
    962,
    493,
    denoising ? SELECTION_ORANGE : '#68737d',
    'right',
  );

  drawFeatureRectangle(ctx, 46, 540, 'Qₓ', '目标查询');
  arrow(ctx, 142, 564, 174, 564);

  ctx.fillStyle = 'rgba(240,138,36,.045)';
  ctx.strokeStyle = 'rgba(240,138,36,.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(166, 505, 344, 112, 8);
  ctx.fill();
  ctx.stroke();
  drawSceneLabel(ctx, '模型原生Kₓ → 读取Vₓ', 180, 526, SELECTION_ORANGE);

  ctx.fillStyle = 'rgba(240,138,36,.045)';
  ctx.strokeStyle = 'rgba(240,138,36,.55)';
  ctx.beginPath();
  ctx.roundRect(526, 505, 436, 112, 8);
  ctx.fill();
  ctx.stroke();
  drawSceneLabel(ctx, '参考Kᵧ → 读取Vᵧ', 540, 526, SELECTION_ORANGE);

  const baseline = 590;
  drawAttentionBar(ctx, 218, baseline, 24, 'Kₓ₁');
  drawAttentionBar(ctx, 326, baseline, 34, 'Kₓᵢ');
  drawAttentionBar(ctx, 434, baseline, 27, 'Kₓₙ');
  drawSceneLabel(ctx, '···', 291, 579, '#9aa2a9', 'center');
  drawSceneLabel(ctx, '···', 399, 579, '#9aa2a9', 'center');
  drawAttentionBar(ctx, 584, baseline, 31, 'Kᵧ₁');
  drawAttentionBar(ctx, 700, baseline, 58, 'Kᵧᵢ', true);
  drawAttentionBar(ctx, 816, baseline, 38, 'Kᵧₙ');
  drawSceneLabel(ctx, '···', 661, 579, '#9aa2a9', 'center');
  drawSceneLabel(ctx, '···', 777, 579, '#9aa2a9', 'center');
}

function drawDerivation(
  ctx: CanvasRenderingContext2D,
  step: ReconstructionStep,
  encodingSubstep: EncodingSubstep,
  substep: ProjectionSubstep,
  attentionSubstep: AttentionSubstep,
  vaeProgress: number,
) {
  if (step === 0) return;
  panel(ctx, 18, 468, 964, 164, step !== 2 && !(step === 3 && attentionSubstep <= 1));
  if (step === 1) {
    drawSpatialKVSpace(ctx, encodingSubstep, vaeProgress);
    return;
  }
  if (step === 2) {
    return;
  }
  if (attentionSubstep === 0) {
    drawAttentionKVPreparation(ctx);
    return;
  }
  if (attentionSubstep === 1) {
    drawAttentionKVPreparation(ctx, true);
    return;
  }
  drawAttentionCalculation(ctx, attentionSubstep === 3);
}

export const TemporalUnmix: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const sourceRef = useRef<HTMLImageElement | null>(null);
  const targetRef = useRef<HTMLImageElement | null>(null);
  const stepRef = useRef<ReconstructionStep>(0);
  const encodingSubstepRef = useRef<EncodingSubstep>(0);
  const substepRef = useRef<ProjectionSubstep>(0);
  const attentionSubstepRef = useRef<AttentionSubstep>(0);
  const denoiseStartRef = useRef<number | null>(null);
  const vaeStartRef = useRef<number | null>(null);
  const geometryCollapseStartRef = useRef<number | null>(null);
  const [step, setStep] = useState<ReconstructionStep>(0);
  const [encodingSubstep, setEncodingSubstep] = useState<EncodingSubstep>(0);
  const [substep, setSubstep] = useState<ProjectionSubstep>(0);
  const [attentionSubstep, setAttentionSubstep] = useState<AttentionSubstep>(0);
  const [activeProjectionVariable, setActiveProjectionVariable] = useState<string | null>(null);

  const toggleProjectionVariable = (instanceId: string) => {
    setActiveProjectionVariable(current => current === instanceId ? null : instanceId);
  };

  const chooseStep = (next: ReconstructionStep) => {
    if (next === 1) {
      encodingSubstepRef.current = 0;
      setEncodingSubstep(0);
      vaeStartRef.current = performance.now();
    } else {
      vaeStartRef.current = null;
    }
    if (next === 2) {
      substepRef.current = 0;
      setSubstep(0);
      setActiveProjectionVariable(null);
    }
    if (next === 3) {
      substepRef.current = 2;
      setSubstep(2);
      attentionSubstepRef.current = 0;
      setAttentionSubstep(0);
      geometryCollapseStartRef.current = performance.now();
      denoiseStartRef.current = null;
    } else {
      geometryCollapseStartRef.current = null;
      denoiseStartRef.current = null;
    }
    stepRef.current = next;
    setStep(next);
  };

  const chooseEncodingSubstep = (next: EncodingSubstep) => {
    stepRef.current = 1;
    encodingSubstepRef.current = next;
    substepRef.current = 0;
    denoiseStartRef.current = null;
    vaeStartRef.current = next === 0 ? performance.now() : null;
    setStep(1);
    setEncodingSubstep(next);
    setSubstep(0);
  };

  const chooseSubstep = (next: ProjectionSubstep) => {
    stepRef.current = 2;
    substepRef.current = next;
    denoiseStartRef.current = null;
    vaeStartRef.current = null;
    setStep(2);
    setSubstep(next);
    setActiveProjectionVariable(null);
  };

  const chooseAttentionSubstep = (next: AttentionSubstep) => {
    stepRef.current = 3;
    substepRef.current = 2;
    attentionSubstepRef.current = next;
    vaeStartRef.current = null;
    denoiseStartRef.current = next === 3 ? performance.now() : null;
    setStep(3);
    setSubstep(2);
    setAttentionSubstep(next);
  };

  const goPrevious = () => {
    if (step === 1 && encodingSubstep > 0) {
      chooseEncodingSubstep((encodingSubstep - 1) as EncodingSubstep);
      return;
    }
    if (step === 2 && substep > 0) {
      chooseSubstep((substep - 1) as ProjectionSubstep);
      return;
    }
    if (step === 2) {
      chooseEncodingSubstep(2);
      return;
    }
    if (step === 3 && attentionSubstep > 0) {
      chooseAttentionSubstep((attentionSubstep - 1) as AttentionSubstep);
      return;
    }
    if (step === 3) {
      chooseSubstep(2);
      return;
    }
    chooseStep(Math.max(0, step - 1) as ReconstructionStep);
  };

  const goNext = () => {
    if (step === 1 && encodingSubstep < 2) {
      chooseEncodingSubstep((encodingSubstep + 1) as EncodingSubstep);
      return;
    }
    if (step === 2 && substep < 2) {
      chooseSubstep((substep + 1) as ProjectionSubstep);
      return;
    }
    if (step === 3 && attentionSubstep < 3) {
      chooseAttentionSubstep((attentionSubstep + 1) as AttentionSubstep);
      return;
    }
    chooseStep(Math.min(3, step + 1) as ReconstructionStep);
  };

  useEffect(() => {
    const source = new Image();
    const target = new Image();
    source.src = './images/person-drinking-cola-turntable-v3.png';
    target.src = './images/person-drinking-cola-target-view-45.png';
    source.onload = () => { sourceRef.current = source; };
    target.onload = () => { targetRef.current = target; };
    return () => {
      source.onload = null;
      target.onload = null;
      sourceRef.current = null;
      targetRef.current = null;
    };
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    return startObservedLoop(canvas, 1000, 650, (ctx, ms) => {
      const current = stepRef.current;
      const currentEncodingSubstep = encodingSubstepRef.current;
      const currentSubstep = substepRef.current;
      const currentAttentionSubstep = attentionSubstepRef.current;
      const started = denoiseStartRef.current;
      const vaeStarted = vaeStartRef.current;
      const geometryCollapseStarted = geometryCollapseStartRef.current;
      const denoiseProgress = current === 3 && currentAttentionSubstep === 3
        ? reducedMotion
          ? 1
          : Math.max(0, Math.min(1, (ms - (started ?? ms)) / 1800))
        : 0;
      const vaeProgress = current === 1 && currentEncodingSubstep === 0
        ? reducedMotion
          ? 1
          : Math.max(0, Math.min(1, (ms - (vaeStarted ?? ms)) / 1500))
        : current > 1 || (current === 1 && currentEncodingSubstep > 0) ? 1 : 0;
      const geometryCollapseProgress = current === 3
        ? reducedMotion
          ? 1
          : Math.max(0, Math.min(1, (ms - (geometryCollapseStarted ?? ms)) / 1000))
        : 0;
      clearUniformStage(ctx, 1000, 650);
      panel(ctx, 18, 50, 300, 400, current <= 1);
      drawSceneLabel(
        ctx,
        current === 0
          ? '输入参考图像/视频 s₁'
          : current >= 1
            ? '用户输入的参考Latent Y'
            : '用户输入的参考Latent Y',
        168,
        75,
        '#191f26',
        'center',
      );
      const sourceImage = sourceRef.current;
      const sourceW = sourceImage?.naturalWidth ? sourceImage.naturalWidth / 5 : 356;
      const sourceH = sourceImage?.naturalHeight ? Math.min(760, sourceImage.naturalHeight - 25) : 760;
      const sourceToken = { x: SOURCE_X + (TOKEN_CELL.col + .5) * CELL_SIZE, y: VIEW_Y + (TOKEN_CELL.row + .5) * CELL_SIZE };
      if (current === 0 || (current === 1 && vaeProgress < .58)) {
        drawImageCover(ctx, sourceImage, SOURCE_X, VIEW_Y, VIEW_WIDTH, VIEW_HEIGHT, { x: 0, y: 25, w: sourceW, h: sourceH });
      } else {
        const highlightYi = current === 2
          || (current === 1 && currentEncodingSubstep === 2)
          || (current === 3 && (currentAttentionSubstep === 1 || currentAttentionSubstep === 2));
        drawLatentFeatureGrid(ctx, SOURCE_X, VIEW_Y, highlightYi);
      }
      if (current === 1 && currentEncodingSubstep === 0) {
        const maskOpacity = vaeProgress < .22
          ? vaeProgress / .22 * .92
          : vaeProgress < .58
            ? .92
            : vaeProgress < .86
              ? (1 - (vaeProgress - .58) / .28) * .92
              : 0;
        drawVaeMask(ctx, SOURCE_X, VIEW_Y, VIEW_WIDTH, VIEW_HEIGHT, maskOpacity);
      }
      if (current >= 2 && !(current === 3 && currentAttentionSubstep === 0)) {
        drawSceneLabel(
          ctx,
          '参考Latent特征 yᵢ',
          168,
          402,
          '#191f26',
          'center',
        );
      }

      if (current >= 2) {
        if (current === 2) {
          arrow(ctx, sourceToken.x + 24, sourceToken.y, 350, 180, true);
          panel(ctx, 350, 50, 300, 400, true);
          drawSceneLabel(ctx, '建模与反投影', 500, 75, '#191f26', 'center');
          drawGeometryScene(ctx, currentSubstep);
        } else {
          drawGeometryCollapse(ctx, geometryCollapseProgress);
        }
      }

      const showTargetLatent = current >= 2;
      if (showTargetLatent) {
        panel(ctx, 682, 50, 300, 400, current === 3);
        drawSceneLabel(ctx, '目标图像的Latent X', 832, 75, '#191f26', 'center');
        if (current === 2 && currentSubstep === 2) {
          fillNoiseField(ctx, TARGET_X, VIEW_Y, VIEW_WIDTH, VIEW_HEIGHT);
          const target = drawTargetGrid(ctx, TARGET_X, VIEW_Y, VIEW_WIDTH, VIEW_HEIGHT, 'Pᵧ');
          arrow(ctx, 638, 214, target.x - 26, target.y, true);
        } else if (current === 3) {
          fillNoiseField(ctx, TARGET_X, VIEW_Y, VIEW_WIDTH, VIEW_HEIGHT);
          if (currentAttentionSubstep === 3 && denoiseProgress > 0) {
            ctx.save();
            ctx.globalAlpha = denoiseProgress;
            drawImageCover(ctx, targetRef.current, TARGET_X, VIEW_Y, VIEW_WIDTH, VIEW_HEIGHT);
            ctx.restore();
          }
          const highlightQx = currentAttentionSubstep === 1 || currentAttentionSubstep === 2;
          drawTargetGrid(
            ctx,
            TARGET_X,
            VIEW_Y,
            VIEW_WIDTH,
            VIEW_HEIGHT,
            highlightQx ? 'Qₓ' : '',
            currentAttentionSubstep === 3 && denoiseProgress > .42,
            highlightQx,
          );
          const attentionCaption = currentAttentionSubstep === 0
            ? '由目标Latent X得到Qₓ、Kₓ、Vₓ'
            : currentAttentionSubstep === 1
              ? 'RoPE（Kₓ，Pₓ），RoPE（Kᵧ，Pᵧ）'
              : currentAttentionSubstep === 2
                ? 'Attn（Qx, Kx;Ky, Vx;Vy）'
                : '从噪声状态逐渐生成干净图像';
          drawSceneLabel(
            ctx,
            attentionCaption,
            832,
            406,
            currentAttentionSubstep === 1 || currentAttentionSubstep === 2 ? SELECTION_ORANGE : '#191f26',
            'center',
          );
        } else {
          fillNoiseField(ctx, TARGET_X, VIEW_Y, VIEW_WIDTH, VIEW_HEIGHT);
          drawTargetGrid(ctx, TARGET_X, VIEW_Y, VIEW_WIDTH, VIEW_HEIGHT, '', false, false);
        }
      }

      drawDerivation(ctx, current, currentEncodingSubstep, currentSubstep, currentAttentionSubstep, vaeProgress);
      if (current === 2) {
        fadeCanvasRegion(ctx, 18, 50, 300, 400, .46);
        if (currentSubstep < 2) fadeCanvasRegion(ctx, 682, 50, 300, 400, .5);
      }
      if (current === 3) {
        if (currentAttentionSubstep === 3) fadeCanvasRegion(ctx, 18, 50, 300, 400, .5);
      }
    });
  }, []);

  const feedback = step === 1
    ? [
        '2.1：输入数据经过VAE编码后，得到不含可见图像的Latent特征网格。',
        '2.2：由左侧Latent Y构建参考KV空间，箭头指向右侧虚线框中的多组Kᵧ/Vᵧ。',
        '2.3：举例说明：提取的yᵢ通过模型权重计算后，得到对应的参考上下文Kᵧᵢ和Vᵧᵢ。',
      ][encodingSubstep]
    : step === 2
    ? [
        'ViPE从同一参考帧估计Dₛ(u,v)、Kₛ与Tₛ，在中间恢复人物、可乐和原相机的三维关系。',
        '加入用户给出的Δyaw=+45°，中间三维图同时标出相机原位置与计算得到的目标位置。',
        '源像素利用深度反投影到三维，经世界坐标和目标相机坐标变换后再投影，得到(dₜ,uₜ,vₜ)与Pᵧ；右侧此时出现对应目标方格，但画面仍处于噪声状态。',
      ][substep]
    : step === 3
      ? [
          '4.1：由目标Latent X得到Qₓ、Kₓ、Vₓ，并与参考Latent Y得到的Kᵧ、Vᵧ共同组成KV空间；底部仅高亮目标Latent X的KV区域。',
          '4.2：底部保留相同KV空间结构并取消橙色高亮；右侧目标Latent X下方注明模型原生Kₓ使用Pₓ、参考上下文Kᵧ使用Pᵧ进行RoPE位置编码。',
          '4.3：Qₓ同时检索Kₓ与Kᵧ。柱高表示注意力权重，其中Kᵧᵢ更高，表示位置对齐后Qₓ更容易与对应参考Key建立联系。',
          '4.4：联合注意力输出参与后续Diffusion计算，右侧目标Latent X由噪声逐步还原为干净图像。',
        ][attentionSubstep]
      : '1.用户输入需要处理的参考图像/视频。';

  return (
    <div className="view-reconstruction">
      <div className="method-canvas-scroll">
        <div className="reconstruction-canvas-shell">
          <canvas ref={ref} width={1000} height={650} aria-label="从参考输入、VAE编码、提取特征yi、得到参考上下文Ky和Vy、ViPE三维建模、反投影位置Py到去噪生成的分步交互" />
          {step === 2 ? (
            <div className="projection-formula-overlay" aria-label="可点击变量的三维投影推导公式">
              <div className={`projection-formula-card ${substep === 0 ? 'active' : ''}`}>
                <strong>ViPE几何建模</strong>
                <div className="projection-equation">
                  ViPE(<ProjectionSymbol variable="si" instanceId="vipe-si" active={activeProjectionVariable === 'vipe-si'} onToggle={toggleProjectionVariable} />) →{' '}
                  <ProjectionSymbol variable="Dsuv" instanceId="vipe-depth" active={activeProjectionVariable === 'vipe-depth'} onToggle={toggleProjectionVariable} />，{' '}
                  <ProjectionSymbol variable="Ks" instanceId="vipe-intrinsics" active={activeProjectionVariable === 'vipe-intrinsics'} onToggle={toggleProjectionVariable} />，{' '}
                  <ProjectionSymbol variable="Tsc2w" instanceId="vipe-pose" active={activeProjectionVariable === 'vipe-pose'} onToggle={toggleProjectionVariable} />
                </div>
                <span>恢复源帧结构与原相机</span>
              </div>
              <div className={`projection-formula-card ${substep === 1 ? 'active' : ''}`}>
                <strong>加入用户相机条件</strong>
                <div className="projection-equation">
                  <ProjectionSymbol variable="deltaT" instanceId="camera-delta-first" active={activeProjectionVariable === 'camera-delta-first'} onToggle={toggleProjectionVariable} />：{' '}
                  <ProjectionSymbol variable="deltaYaw" instanceId="camera-yaw" active={activeProjectionVariable === 'camera-yaw'} onToggle={toggleProjectionVariable} />=+45°
                </div>
                <div className="projection-equation">
                  <ProjectionSymbol variable="Ttarget" instanceId="camera-target-pose" active={activeProjectionVariable === 'camera-target-pose'} onToggle={toggleProjectionVariable} /> = Compose(
                  <ProjectionSymbol variable="Ts" instanceId="camera-source-pose" active={activeProjectionVariable === 'camera-source-pose'} onToggle={toggleProjectionVariable} />，{' '}
                  <ProjectionSymbol variable="deltaT" instanceId="camera-delta-compose" active={activeProjectionVariable === 'camera-delta-compose'} onToggle={toggleProjectionVariable} />)
                </div>
              </div>
              <div className={`projection-formula-card ${substep === 2 ? 'active' : ''}`}>
                <strong>反投影与目标投影</strong>
                <div className="projection-equation compact">
                  <ProjectionSymbol variable="Xsc" instanceId="projection-source-point" active={activeProjectionVariable === 'projection-source-point'} onToggle={toggleProjectionVariable} />=
                  <ProjectionSymbol variable="Dsuv" instanceId="projection-depth" active={activeProjectionVariable === 'projection-depth'} onToggle={toggleProjectionVariable} />
                  <ProjectionSymbol variable="Ksinv" instanceId="projection-inverse-intrinsics" active={activeProjectionVariable === 'projection-inverse-intrinsics'} onToggle={toggleProjectionVariable} />
                  <ProjectionSymbol variable="ps" instanceId="projection-source-pixel" active={activeProjectionVariable === 'projection-source-pixel'} onToggle={toggleProjectionVariable} /> →{' '}
                  <ProjectionSymbol variable="Xw" instanceId="projection-world-point" active={activeProjectionVariable === 'projection-world-point'} onToggle={toggleProjectionVariable} /> →{' '}
                  <ProjectionSymbol variable="Xtc" instanceId="projection-target-point" active={activeProjectionVariable === 'projection-target-point'} onToggle={toggleProjectionVariable} />
                </div>
                <div className="projection-equation compact">
                  <ProjectionSymbol variable="dtuv" instanceId="projection-target-pixel" active={activeProjectionVariable === 'projection-target-pixel'} onToggle={toggleProjectionVariable} /> →{' '}
                  <ProjectionSymbol variable="Py" instanceId="projection-py" active={activeProjectionVariable === 'projection-py'} onToggle={toggleProjectionVariable} />=(
                  <ProjectionSymbol variable="time" instanceId="projection-time" active={activeProjectionVariable === 'projection-time'} onToggle={toggleProjectionVariable} />+
                  <ProjectionSymbol variable="depthOffset" instanceId="projection-depth-offset" active={activeProjectionVariable === 'projection-depth-offset'} onToggle={toggleProjectionVariable} />，{' '}
                  <ProjectionSymbol variable="latentHw" instanceId="projection-latent-grid" active={activeProjectionVariable === 'projection-latent-grid'} onToggle={toggleProjectionVariable} />)
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="canvas-pan-hint">← 左右滑动画布，查看Latent、三维几何、投影位置与去噪结果 →</div>
      <div className="ctrl reconstruction-step-controls">
        {STEP_LABELS.map((label, index) => (
          <button type="button" key={label} className={`chip ${step === index ? 'selected' : ''}`} onClick={() => chooseStep(index as ReconstructionStep)}>{label}</button>
        ))}
        <button type="button" onClick={goPrevious} disabled={step === 0}>← {(step === 1 && encodingSubstep > 0) || (step === 2 && substep > 0) || (step === 3 && attentionSubstep > 0) ? '上一小步' : '上一步'}</button>
        <button type="button" onClick={goNext} disabled={step === 3 && attentionSubstep === 3}>{(step === 1 && encodingSubstep < 2) || (step === 2 && substep < 2) || (step === 3 && attentionSubstep < 3) ? '下一小步' : '下一步'} →</button>
      </div>
      {step === 1 ? (
        <div className="ctrl projection-substep-controls" aria-label="参考上下文提取过程">
          {ENCODING_SUBSTEP_LABELS.map((label, index) => (
            <button type="button" key={label} className={`chip ${encodingSubstep === index ? 'selected' : ''}`} onClick={() => chooseEncodingSubstep(index as EncodingSubstep)}>{label}</button>
          ))}
        </div>
      ) : null}
      {step === 2 ? (
        <div className="ctrl projection-substep-controls" aria-label="三维投影过程">
          {SUBSTEP_LABELS.map((label, index) => (
            <button type="button" key={label} className={`chip ${substep === index ? 'selected' : ''}`} onClick={() => chooseSubstep(index as ProjectionSubstep)}>{label}</button>
          ))}
        </div>
      ) : null}
      {step === 3 ? (
        <div className="ctrl projection-substep-controls" aria-label="Attn计算过程">
          {ATTENTION_SUBSTEP_LABELS.map((label, index) => (
            <button type="button" key={label} className={`chip ${attentionSubstep === index ? 'selected' : ''}`} onClick={() => chooseAttentionSubstep(index as AttentionSubstep)}>{label}</button>
          ))}
        </div>
      ) : null}
      <div className="feedback good">{feedback}</div>
    </div>
  );
};

export default TemporalUnmix;
