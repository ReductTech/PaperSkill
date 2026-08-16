import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, drawSceneLabel, startObservedLoop } from './stage-analogy';

const GRID_COLS = 6;
const GRID_ROWS = 8;
const PX_CELL = { row: 4, col: 1 };

type Point3 = { x: number; y: number; z: number };

function clearTokenGridStage(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#f7f8f5';
  ctx.fillRect(0, 0, w, h);
}

function card(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, active = false) {
  ctx.fillStyle = active ? 'rgba(240,138,36,.065)' : C.white;
  ctx.strokeStyle = active ? C.orange : C.line;
  ctx.lineWidth = active ? 2.4 : 1.4;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 11); ctx.fill(); ctx.stroke();
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function actionProgress(angle: number) {
  return Math.max(0, Math.min(1, (angle - 15) / 45));
}

function projectedCell(angle: number) {
  return { row: Math.round(2 + actionProgress(angle) * 4), col: 1 };
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  active: { row: number; col: number },
  label: string,
  transparent = false,
) {
  const cellW = w / GRID_COLS;
  const cellH = h / GRID_ROWS;
  if (!transparent) {
    ctx.fillStyle = '#f6f7f8';
    ctx.fillRect(x, y, w, h);
  }
  ctx.fillStyle = 'rgba(217,119,6,.22)';
  ctx.fillRect(x + active.col * cellW, y + active.row * cellH, cellW, cellH);
  ctx.strokeStyle = C.orange; ctx.lineWidth = 2.5;
  ctx.strokeRect(x + active.col * cellW + 1, y + active.row * cellH + 1, cellW - 2, cellH - 2);
  ctx.strokeStyle = transparent ? 'rgba(255,255,255,.62)' : 'rgba(39,68,110,.24)';
  ctx.lineWidth = 1;
  for (let col = 0; col <= GRID_COLS; col += 1) {
    ctx.beginPath(); ctx.moveTo(x + col * cellW, y); ctx.lineTo(x + col * cellW, y + h); ctx.stroke();
  }
  for (let row = 0; row <= GRID_ROWS; row += 1) {
    ctx.beginPath(); ctx.moveTo(x, y + row * cellH); ctx.lineTo(x + w, y + row * cellH); ctx.stroke();
  }
  ctx.fillStyle = C.orange;
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + (active.col + .5) * cellW, y + (active.row + .5) * cellH + 5);
  return {
    x: x + (active.col + .5) * cellW,
    y: y + (active.row + .5) * cellH,
  };
}

function drawReferencePanel(ctx: CanvasRenderingContext2D, image: HTMLImageElement | null) {
  ctx.fillStyle = '#f3f4f5'; ctx.strokeStyle = C.line; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(30, 59, 214, 76, 7); ctx.fill(); ctx.stroke();
  drawSceneLabel(ctx, '背景：目标视频 Latent x', 137, 78, C.ink, 'center');
  drawSceneLabel(ctx, '待去噪画布 · 原位置 Pₓ 保持不变', 137, 125, C.ink, 'center');
  const gridX = 43; const gridY = 88; const cellW = 31; const cellH = 25;
  ctx.strokeStyle = 'rgba(25,31,38,.27)'; ctx.lineWidth = 1;
  for (let col = 0; col <= 6; col += 1) {
    ctx.beginPath(); ctx.moveTo(gridX + col * cellW, gridY); ctx.lineTo(gridX + col * cellW, gridY + cellH); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(gridX, gridY); ctx.lineTo(gridX + 6 * cellW, gridY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(gridX, gridY + cellH); ctx.lineTo(gridX + 6 * cellW, gridY + cellH); ctx.stroke();
  ctx.fillStyle = 'rgba(39,68,110,.18)';
  ctx.fillRect(gridX + PX_CELL.col * cellW, gridY, cellW, cellH);

  const viewport = { x: 38, y: 148, w: 198, h: 306 };
  ctx.save(); ctx.beginPath(); ctx.roundRect(viewport.x, viewport.y, viewport.w, viewport.h, 8); ctx.clip();
  ctx.fillStyle = '#eeece8'; ctx.fillRect(viewport.x, viewport.y, viewport.w, viewport.h);
  if (image?.complete && image.naturalWidth > 0) {
    const frameWidth = image.naturalWidth / 5;
    const sourceY = 25;
    const sourceH = Math.min(760, image.naturalHeight - sourceY);
    const targetW = frameWidth / sourceH * viewport.h;
    const targetX = viewport.x + viewport.w - targetW;
    ctx.drawImage(image, 0, sourceY, frameWidth, sourceH, targetX, viewport.y, targetW, viewport.h);
  } else {
    drawSceneLabel(ctx, '正在载入参考视频帧…', 137, 300, C.ink, 'center');
  }
  ctx.restore();
  ctx.strokeStyle = C.line; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.roundRect(viewport.x, viewport.y, viewport.w, viewport.h, 8); ctx.stroke();
  drawSceneLabel(ctx, '参考帧 sᵢ / 已提取内容Token yᵢ', 137, 474, C.ink, 'center');
  drawSceneLabel(ctx, '固定视角 0° · 固定饮用动作', 137, 491, C.ink, 'center');
}

function drawCameraView(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  angle: number,
) {
  const viewport = { x: 318, y: 60, w: 216, h: 414 };
  let projectedPoint: { x: number; y: number } | null = null;
  ctx.save();
  ctx.beginPath(); ctx.roundRect(viewport.x, viewport.y, viewport.w, viewport.h, 8); ctx.clip();
  ctx.fillStyle = '#eeece8'; ctx.fillRect(viewport.x, viewport.y, viewport.w, viewport.h);
  if (image?.complete && image.naturalWidth > 0) {
    const frameWidth = image.naturalWidth / 5;
    const sourceY = 25;
    const sourceH = Math.min(760, image.naturalHeight - sourceY);
    const targetH = viewport.h;
    const targetW = frameWidth / sourceH * targetH;
    const targetX = viewport.x + viewport.w - targetW;
    const position = angle / 15;
    const lower = Math.min(4, Math.floor(position));
    const upper = Math.min(4, Math.ceil(position));
    const mix = position - lower;
    ctx.globalAlpha = upper === lower ? 1 : 1 - mix;
    ctx.drawImage(image, lower * frameWidth, sourceY, frameWidth, sourceH, targetX, viewport.y, targetW, targetH);
    if (upper !== lower) {
      ctx.globalAlpha = mix;
      ctx.drawImage(image, upper * frameWidth, sourceY, frameWidth, sourceH, targetX, viewport.y, targetW, targetH);
    }
    ctx.globalAlpha = 1;
    projectedPoint = drawGrid(ctx, targetX, viewport.y, targetW, targetH, projectedCell(angle), 'Pᵧ', true);
  } else {
    drawSceneLabel(ctx, '正在载入摄像机视角…', 426, 265, C.ink, 'center');
  }
  ctx.restore();
  ctx.strokeStyle = C.line; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.roundRect(viewport.x, viewport.y, viewport.w, viewport.h, 8); ctx.stroke();
  return projectedPoint;
}

function projectIso(point: Point3) {
  const scale = 62;
  return {
    x: 762 + (point.x - point.z) * scale,
    y: 422 + (point.x + point.z) * scale * .27 - point.y * scale,
  };
}

function line3(ctx: CanvasRenderingContext2D, a: Point3, b: Point3) {
  const p1 = projectIso(a);
  const p2 = projectIso(b);
  ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
}

function drawGlobal3D(ctx: CanvasRenderingContext2D, angle: number) {
  const progress = actionProgress(angle);
  const can: Point3 = { x: -.48, y: lerp(1.52, .72, progress), z: .08 };
  const initialOrbit = -118 * Math.PI / 180;
  const orbit = initialOrbit + angle * Math.PI / 180;
  const originalCamera: Point3 = { x: Math.cos(initialOrbit) * 1.85, y: 1.48, z: Math.sin(initialOrbit) * 1.85 };
  const camera: Point3 = { x: Math.cos(orbit) * 1.85, y: 1.48, z: Math.sin(orbit) * 1.85 };
  const originalCameraGround: Point3 = { x: Math.cos(initialOrbit) * 1.85, y: 0, z: Math.sin(initialOrbit) * 1.85 };

  ctx.save();
  ctx.beginPath(); ctx.roundRect(502, 60, 492, 414, 8); ctx.clip();
  ctx.fillStyle = '#f4f5f2'; ctx.fillRect(502, 60, 492, 414);
  drawSceneLabel(ctx, '世界坐标下的相机、人物与可乐', 748, 84, C.ink, 'center');
  ctx.strokeStyle = 'rgba(90,103,116,.24)'; ctx.lineWidth = 1;
  for (let index = -3; index <= 3; index += 1) {
    line3(ctx, { x: index * .65, y: 0, z: -2 }, { x: index * .65, y: 0, z: 2 });
    line3(ctx, { x: -2, y: 0, z: index * .65 }, { x: 2, y: 0, z: index * .65 });
  }

  ctx.strokeStyle = 'rgba(25,31,38,.35)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
  ctx.beginPath();
  for (let step = 0; step <= 48; step += 1) {
    const rad = step / 48 * Math.PI * 2;
    const point = projectIso({ x: Math.cos(rad) * 1.85, y: 0, z: Math.sin(rad) * 1.85 });
    if (step === 0) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y);
  }
  ctx.stroke(); ctx.setLineDash([]);

  const base = projectIso({ x: 0, y: 0, z: 0 });
  const originalCamera2d = projectIso(originalCamera);
  const camera2d = projectIso(camera);
  const cameraGround: Point3 = { x: camera.x, y: 0, z: camera.z };
  const cameraGround2d = projectIso(cameraGround);
  const originalGround2d = projectIso(originalCameraGround);
  const shoulder = projectIso({ x: 0, y: 1.38, z: 0 });
  const can2d = projectIso(can);

  const originalScreenAngle = Math.atan2(originalGround2d.y - base.y, originalGround2d.x - base.x);
  const currentScreenAngle = Math.atan2(cameraGround2d.y - base.y, cameraGround2d.x - base.x);
  let screenDelta = currentScreenAngle - originalScreenAngle;
  while (screenDelta > Math.PI) screenDelta -= Math.PI * 2;
  while (screenDelta < -Math.PI) screenDelta += Math.PI * 2;
  ctx.fillStyle = 'rgba(217,119,6,.16)'; ctx.strokeStyle = C.orange; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(base.x, base.y);
  ctx.arc(base.x, base.y, 46, originalScreenAngle, originalScreenAngle + screenDelta, screenDelta < 0);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(25,31,38,.58)'; ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.lineTo(originalGround2d.x, originalGround2d.y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = '#191f26'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.lineTo(cameraGround2d.x, cameraGround2d.y); ctx.stroke();
  const midSectorAngle = originalScreenAngle + screenDelta / 2;
  drawSceneLabel(ctx, `θₜ=${Math.round(angle)}°`, base.x + Math.cos(midSectorAngle) * 63 + 24, base.y + Math.sin(midSectorAngle) * 63 - 18, C.orange, 'center');

  ctx.strokeStyle = 'rgba(25,31,38,.68)'; ctx.lineWidth = 1.7; ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(originalCamera2d.x, originalCamera2d.y); ctx.lineTo(originalGround2d.x, originalGround2d.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(camera2d.x, camera2d.y); ctx.lineTo(cameraGround2d.x, cameraGround2d.y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#191f26';
  ctx.beginPath(); ctx.arc(cameraGround2d.x, cameraGround2d.y, 5, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = C.orange; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(camera2d.x, camera2d.y); ctx.lineTo(can2d.x, can2d.y); ctx.stroke();
  const depthMidX = (camera2d.x + can2d.x) / 2;
  const depthMidY = (camera2d.y + can2d.y) / 2;
  ctx.fillStyle = 'rgba(240,138,36,.12)';
  ctx.beginPath(); ctx.roundRect(depthMidX - 17, depthMidY - 13, 34, 23, 5); ctx.fill();
  ctx.strokeStyle = C.orange; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.roundRect(depthMidX - 17, depthMidY - 13, 34, 23, 5); ctx.stroke();
  drawSceneLabel(ctx, 'Dₜ', depthMidX, depthMidY + 4, C.orange, 'center');
  ctx.strokeStyle = 'rgba(25,31,38,.38)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(camera2d.x, camera2d.y); ctx.lineTo(shoulder.x, shoulder.y); ctx.stroke();

  const hip = projectIso({ x: 0, y: .72, z: 0 });
  const neck = projectIso({ x: 0, y: 1.52, z: 0 });
  const head = projectIso({ x: 0, y: 1.78, z: 0 });
  ctx.strokeStyle = '#213a5d'; ctx.lineWidth = 11; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(hip.x, hip.y); ctx.lineTo(neck.x, neck.y); ctx.stroke();
  ctx.lineWidth = 6;
  line3(ctx, { x: 0, y: .72, z: 0 }, { x: -.22, y: 0, z: -.04 });
  line3(ctx, { x: 0, y: .72, z: 0 }, { x: .22, y: 0, z: .04 });
  line3(ctx, { x: 0, y: 1.35, z: 0 }, can);
  line3(ctx, { x: 0, y: 1.35, z: 0 }, { x: .48, y: .82, z: 0 });
  ctx.fillStyle = '#d4a17e'; ctx.strokeStyle = '#8f694f'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(head.x, head.y, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#b52f2f'; ctx.strokeStyle = '#7b2020'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.roundRect(can2d.x - 7, can2d.y - 12, 14, 24, 4); ctx.fill(); ctx.stroke();

  const target2d = projectIso({ x: 0, y: 1.1, z: 0 });
  ctx.save();
  ctx.fillStyle = '#f4f5f2'; ctx.strokeStyle = '#7a8792'; ctx.lineWidth = 1.7; ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.roundRect(originalCamera2d.x - 11, originalCamera2d.y - 8, 22, 16, 3); ctx.fill(); ctx.stroke();
  const originalDirectionX = target2d.x - originalCamera2d.x;
  const originalDirectionY = target2d.y - originalCamera2d.y;
  const originalLength = Math.hypot(originalDirectionX, originalDirectionY) || 1;
  ctx.beginPath();
  ctx.moveTo(originalCamera2d.x, originalCamera2d.y);
  ctx.lineTo(originalCamera2d.x + originalDirectionX / originalLength * 22 - originalDirectionY / originalLength * 7, originalCamera2d.y + originalDirectionY / originalLength * 22 + originalDirectionX / originalLength * 7);
  ctx.lineTo(originalCamera2d.x + originalDirectionX / originalLength * 22 + originalDirectionY / originalLength * 7, originalCamera2d.y + originalDirectionY / originalLength * 22 - originalDirectionX / originalLength * 7);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  drawSceneLabel(ctx, '相机原始位置', originalCamera2d.x - 17, originalCamera2d.y - 23, '#68737d', 'right');

  ctx.fillStyle = C.blue; ctx.strokeStyle = '#193457'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(camera2d.x - 11, camera2d.y - 8, 22, 16, 3); ctx.fill(); ctx.stroke();
  const directionX = target2d.x - camera2d.x;
  const directionY = target2d.y - camera2d.y;
  const length = Math.hypot(directionX, directionY) || 1;
  ctx.fillStyle = '#193457';
  ctx.beginPath();
  ctx.moveTo(camera2d.x, camera2d.y);
  ctx.lineTo(camera2d.x + directionX / length * 22 - directionY / length * 7, camera2d.y + directionY / length * 22 + directionX / length * 7);
  ctx.lineTo(camera2d.x + directionX / length * 22 + directionY / length * 7, camera2d.y + directionY / length * 22 - directionX / length * 7);
  ctx.closePath(); ctx.fill();
  const cameraLabelX = camera2d.x > 850 ? camera2d.x - 17 : camera2d.x + 17;
  const cameraLabelAlign = camera2d.x > 850 ? 'right' : 'left';
  drawSceneLabel(ctx, '内参 Kₜ', cameraLabelX, camera2d.y - 18, C.orange, cameraLabelAlign);
  drawSceneLabel(ctx, '姿态 Tₜ', cameraLabelX, camera2d.y + 2, C.orange, cameraLabelAlign);
  ctx.restore();
  ctx.strokeStyle = C.line; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.roundRect(502, 60, 492, 414, 8); ctx.stroke();
  drawSceneLabel(ctx, 'Dₜ：相机到可乐的深度；Kₜ / Tₜ：当前相机内参与姿态', 748, 491, C.orange, 'center');
  return camera2d;
}

function drawDifferenceArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.strokeStyle = C.orange;
  ctx.fillStyle = C.orange;
  ctx.lineWidth = 2.4;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 9 * Math.cos(angle - .48), y2 - 9 * Math.sin(angle - .48));
  ctx.lineTo(x2 - 9 * Math.cos(angle + .48), y2 - 9 * Math.sin(angle + .48));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawDifferenceKVBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  dashed = false,
) {
  ctx.fillStyle = '#eef0f1';
  ctx.strokeStyle = '#aeb6bd';
  ctx.lineWidth = 1.3;
  if (dashed) ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.roundRect(x, y, 55, 42, 7);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  drawSceneLabel(ctx, label, x + 27.5, y + 27, '#68737d', 'center');
}

function drawDifferenceOne(ctx: CanvasRenderingContext2D) {
  clearTokenGridStage(ctx, 1000, 650);

  card(ctx, 18, 50, 300, 400, true);
  drawSceneLabel(ctx, '用户输入的参考Latent Y', 168, 75, C.ink, 'center');
  const gridX = 58;
  const gridY = 96;
  const cell = 44;
  const latentCols = 5;
  const latentRows = 6;
  for (let row = 0; row < latentRows; row += 1) {
    for (let col = 0; col < latentCols; col += 1) {
      const shade = 241 - ((row * 13 + col * 17) % 38);
      ctx.fillStyle = `rgb(${shade},${shade + 1},${Math.min(248, shade + 4)})`;
      ctx.strokeStyle = '#b5bdc5';
      ctx.lineWidth = 1;
      ctx.fillRect(gridX + col * cell, gridY + row * cell, cell, cell);
      ctx.strokeRect(gridX + col * cell, gridY + row * cell, cell, cell);
    }
  }
  drawSceneLabel(ctx, '参考Latent特征 Y', 168, 402, C.ink, 'center');

  drawSceneLabel(ctx, 'KV空间', 38, 493, C.ink);

  ctx.fillStyle = '#f2f5f7';
  ctx.strokeStyle = '#b5bdc5';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.roundRect(38, 505, 454, 112, 8);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  drawSceneLabel(ctx, '初始化Latent X的KV', 52, 526, '#68737d');
  drawDifferenceKVBlock(ctx, 55, 543, 'Kₓ₁', true);
  drawDifferenceKVBlock(ctx, 113, 543, 'Vₓ₁', true);
  drawSceneLabel(ctx, '···', 190, 570, '#9aa2a9', 'center');
  drawDifferenceKVBlock(ctx, 211, 543, 'Kₓᵢ', true);
  drawDifferenceKVBlock(ctx, 269, 543, 'Vₓᵢ', true);
  drawSceneLabel(ctx, '···', 346, 570, '#9aa2a9', 'center');
  drawDifferenceKVBlock(ctx, 367, 543, 'Kₓₙ', true);
  drawDifferenceKVBlock(ctx, 425, 543, 'Vₓₙ', true);

  ctx.fillStyle = 'rgba(240,138,36,.045)';
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(508, 505, 454, 112, 8);
  ctx.fill();
  ctx.stroke();
  drawSceneLabel(ctx, '逐帧参考KV：N个重叠层', 522, 526, C.orange);

  const stackLabels = ['KV₁', 'KV₂', 'KV₃', 'KV⋯', 'KVₙ'];
  stackLabels.forEach((label, index) => {
    const x = 548 + index * 38;
    const y = 538 + index * 4;
    ctx.fillStyle = index === stackLabels.length - 1 ? '#fff7ed' : '#f3f4f4';
    ctx.strokeStyle = index === stackLabels.length - 1 ? C.orange : '#aeb6bd';
    ctx.lineWidth = index === stackLabels.length - 1 ? 2 : 1.3;
    ctx.beginPath();
    ctx.roundRect(x, y, 190, 54, 8);
    ctx.fill();
    ctx.stroke();
    drawSceneLabel(ctx, label, x + 14, y + 22, index === stackLabels.length - 1 ? C.orange : '#68737d');
    if (index === stackLabels.length - 1) {
      drawSceneLabel(ctx, 'Kᵧₙ   Vᵧₙ', x + 105, y + 36, C.orange, 'center');
    }
  });

  drawDifferenceArrow(ctx, gridX + cell * latentCols, gridY + cell * latentRows - 8, 735, 502);
}

export const TokenGrid: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const differenceOneRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const angleRef = useRef(0);
  const [angle, setAngle] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [activeDifference, setActiveDifference] = useState<1 | 2>(1);

  const chooseAngle = (next: number) => {
    angleRef.current = next;
    setAngle(next);
  };

  useEffect(() => {
    const sprite = new Image();
    sprite.src = './images/person-drinking-cola-turntable-v3.png';
    sprite.onload = () => { imageRef.current = sprite; };
    return () => { sprite.onload = null; imageRef.current = null; };
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (angleRef.current >= 60) chooseAngle(0);
    const timer = window.setInterval(() => {
      const next = Math.min(60, angleRef.current + 1);
      chooseAngle(next);
      if (next >= 60) setPlaying(false);
    }, 70);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    const canvas = differenceOneRef.current;
    if (!canvas) return;
    return startObservedLoop(canvas, 1000, 650, ctx => drawDifferenceOne(ctx));
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return startObservedLoop(canvas, 960, 560, ctx => {
      const currentAngle = angleRef.current;
      clearTokenGridStage(ctx, 960, 560);

      ctx.save();
      ctx.translate(-416, 0);
      card(ctx, 494, 42, 508, 465);
      drawSceneLabel(ctx, '第三人称全局 3D', 752, 27, C.ink, 'center');
      const cameraPoint = drawGlobal3D(ctx, currentAngle);
      ctx.restore();

      ctx.save();
      ctx.translate(330, 0);
      card(ctx, 272, 42, 274, 465);
      drawSceneLabel(ctx, '目标摄像机取景', 409, 27, C.ink, 'center');
      const projectedPoint = drawCameraView(ctx, imageRef.current, currentAngle);
      ctx.restore();
      if (projectedPoint) {
        const cameraX = cameraPoint.x - 416;
        const cameraY = cameraPoint.y;
        const projectedX = projectedPoint.x + 330;
        const projectedY = projectedPoint.y;
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(cameraX, cameraY);
        ctx.lineTo(projectedX, projectedY);
        ctx.stroke();
        const labelX = (cameraX + projectedX) / 2;
        const labelY = (cameraY + projectedY) / 2;
        ctx.fillStyle = '#f7f8f5';
        ctx.beginPath();
        ctx.roundRect(labelX - 30, labelY - 15, 60, 24, 6);
        ctx.fill();
        drawSceneLabel(ctx, '反投影', labelX, labelY + 2, C.orange, 'center');
      }
      ctx.fillStyle = 'rgba(25,31,38,.06)'; ctx.beginPath(); ctx.roundRect(96, 516, 768, 29, 7); ctx.fill();
      drawSceneLabel(ctx, '反投影：使用当前t状态的各个参数计算投影位置', 480, 536, C.orange, 'center');
    });
  }, []);

  return (
    <div className="token-grid-monochrome">
      <div className="pe4d-difference-header">
        <div className="pe4d-difference-tabs" role="tablist" aria-label="PE-Field 4D迁移区别">
          <button
            type="button"
            role="tab"
            aria-selected={activeDifference === 1}
            aria-controls="pe4d-difference-panel-1"
            className={`pe4d-difference-tab ${activeDifference === 1 ? 'selected' : ''}`}
            onClick={() => { setPlaying(false); setActiveDifference(1); }}
          >
            区别1
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeDifference === 2}
            aria-controls="pe4d-difference-panel-2"
            className={`pe4d-difference-tab ${activeDifference === 2 ? 'selected' : ''}`}
            onClick={() => setActiveDifference(2)}
          >
            区别2
          </button>
        </div>
        <div className="pe4d-difference-tab-copy">
          {activeDifference === 1
            ? '视频每帧对应一个参考KV，生成每帧画面使用对应的KV。'
            : '反投影时采用用户提供的摄像头轨迹计算。'}
        </div>
      </div>

      <div id="pe4d-difference-panel-1" role="tabpanel" hidden={activeDifference !== 1} className="pe4d-difference-panel">
        <div className="method-canvas-scroll">
          <canvas ref={differenceOneRef} width={1000} height={650} aria-label="与3.1步骤2.2对齐的参考Latent Y，以及逐帧对应的参考KV" />
        </div>
        <div className="canvas-pan-hint">← 左右滑动画布，查看逐帧参考KV的构建方式 →</div>
      </div>

      <div id="pe4d-difference-panel-2" role="tabpanel" hidden={activeDifference !== 2} className="pe4d-difference-panel">
        <div className="method-canvas-scroll">
          <canvas ref={ref} width={960} height={560} aria-label="目标摄像机投影位置Py与第三人称三维场景的联动演示" />
        </div>
        <div className="canvas-pan-hint">← 左右滑动画布，查看Pᵧ与全局3D几何关系 →</div>
        <div className="ctrl">
          <label htmlFor="cola-view-angle">目标摄像机 θ</label>
          <input id="cola-view-angle" type="range" min="0" max="60" step="1" value={angle} onInput={event => { setPlaying(false); chooseAngle(Number(event.currentTarget.value)); }} />
          <span className="val">{angle}°</span>
          <button type="button" className={`chip ${playing ? 'selected' : ''}`} onClick={() => setPlaying(value => !value)}>{playing ? '暂停旋转' : '▶ 自动旋转'}</button>
        </div>
        <div className="feedback">
          初始Dₜ、Kₜ、Tₜ等由ViPE提供，目标位置Kₜ、Tₜ由用户输入提供
        </div>
      </div>
    </div>
  );
};

export default TokenGrid;
