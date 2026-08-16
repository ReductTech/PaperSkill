import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 920;
const H = 470;
const C = {
  blue: '#27446e', green: '#228d5c', orange: '#d97706', purple: '#7c3aed',
  ink: '#21324a', muted: '#68778f', line: '#d7deea', field: '#f5f8f0', paper: '#ffffff',
};

type View = 'training' | 'inference';
type Objective = 'CA' | 'DM';
type TrainingStage = 0 | 1 | 2;
type Point = { x: number; y: number };

const stageCopy = [
  { short: '高噪声', expert: '空间布局教师', sigma: '噪声较高' },
  { short: '中间状态', expert: '数字艺术／语义教师', sigma: '结构逐渐显现' },
  { short: '低噪声', expert: '文字／高频细节教师', sigma: '噪声较低' },
] as const;

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius = 12) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, fill = '#ffffff') {
  ctx.save();
  roundedRect(ctx, x, y, width, height, 14);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function arrow(ctx: CanvasRenderingContext2D, from: Point, to: Point, color: string, width = 2, alpha = 1, dashed = false) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dashed ? [7, 6] : []);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - 9 * Math.cos(angle - Math.PI / 6), to.y - 9 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(to.x - 9 * Math.cos(angle + Math.PI / 6), to.y - 9 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function dot(ctx: CanvasRenderingContext2D, point: Point, radius: number, fill: string, stroke = C.paper, lineWidth = 2) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  color = C.ink,
  font = '12px "Segoe UI", sans-serif',
  align: CanvasTextAlign = 'left',
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = align;
  ctx.fillText(value, x, y);
  ctx.restore();
}

function project3d(x: number, y: number, z: number): Point {
  return { x: 86 + x * 470 + z * 82, y: 356 - y * 142 - z * 104 };
}

function trajectoryPoint(t: number): Point {
  return project3d(0.08 + 0.85 * t, 0.18 + 0.68 * t + Math.sin(t * Math.PI) * 0.13, 0.92 - 0.82 * t);
}

function bezierPoint(t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point {
  const u = 1 - t;
  return {
    x: u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x,
    y: u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y,
  };
}

function drawPerspectiveGrid(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.strokeStyle = '#e7ebf2';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i += 1) {
    const a = project3d(i / 5, 0, 0);
    const b = project3d(i / 5, 1, 0);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  for (let i = 0; i <= 4; i += 1) {
    const a = project3d(0, i / 4, 0);
    const b = project3d(1, i / 4, 0);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  arrow(ctx, project3d(0, 0, 0), project3d(1.04, 0, 0), C.muted, 1.2, 0.65);
  arrow(ctx, project3d(0, 0, 0), project3d(0, 1.08, 0), C.muted, 1.2, 0.65);
  arrow(ctx, project3d(0, 0, 0), project3d(0, 0, 1.08), C.muted, 1.2, 0.65);
  text(ctx, '去噪进程', 565, 370, C.muted, '11px "Segoe UI", sans-serif', 'right');
  text(ctx, '语义／细节', 62, 197, C.muted, '11px "Segoe UI", sans-serif');
  text(ctx, '噪声尺度 σ', 151, 236, C.muted, '11px "Segoe UI", sans-serif');
  ctx.restore();
}

function objectiveProgress(now: number, period: number) {
  return 0.5 - 0.5 * Math.cos((now % period) / period * Math.PI * 2);
}

function drawCaObjective(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, now: number) {
  panel(ctx, x, y, width, height, '#ffffff');
  text(ctx, 'CA · 让学生轨迹贴近教师引导路径', x + 12, y + 22, C.purple, '700 11px "Segoe UI", sans-serif');

  const left = x + 18;
  const right = x + width - 16;
  const top = y + 46;
  const bottom = y + height - 31;
  ctx.save();
  ctx.strokeStyle = '#e7ebf2';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(left, bottom); ctx.lineTo(right, bottom); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, bottom); ctx.stroke();
  ctx.restore();

  const teacherY = (t: number) => top + 45 - Math.sin(t * Math.PI) * 21 + t * 18;
  const beforeY = (t: number) => teacherY(t) + 47 - t * 15 + Math.sin(t * Math.PI * 2) * 7;
  const progress = objectiveProgress(now, 2600);
  const studentY = (t: number) => beforeY(t) + (teacherY(t) - beforeY(t)) * (0.15 + progress * 0.75);

  ctx.save();
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 36; i += 1) {
    const t = i / 36;
    const px = left + t * (right - left);
    const py = teacherY(t);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  ctx.strokeStyle = '#c43f52';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  for (let i = 0; i <= 36; i += 1) {
    const t = i / 36;
    const px = left + t * (right - left);
    const py = beforeY(t);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 36; i += 1) {
    const t = i / 36;
    const px = left + t * (right - left);
    const py = studentY(t);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();

  const sampleT = 0.68;
  const sampleX = left + sampleT * (right - left);
  const currentY = studentY(sampleT);
  const targetY = teacherY(sampleT);
  arrow(ctx, { x: sampleX, y: currentY - 3 }, { x: sampleX, y: targetY + 3 }, C.purple, 2.5, 0.85);
  dot(ctx, { x: sampleX, y: currentY }, 5, C.orange);
  dot(ctx, { x: sampleX, y: targetY }, 5, C.blue);

  text(ctx, '教师引导轨迹', left + 3, top + 2, C.blue, '700 9px "Segoe UI", sans-serif');
  text(ctx, '更新前', left + 3, bottom - 4, '#c43f52', '9px "Segoe UI", sans-serif');
  text(ctx, '学生轨迹', right - 3, studentY(1) + 14, C.orange, '700 9px "Segoe UI", sans-serif', 'right');
  text(ctx, 'CA 修正向量', sampleX - 6, (currentY + targetY) / 2, C.purple, '700 9px "Segoe UI", sans-serif', 'right');
  text(ctx, progress > 0.72 ? '轨迹偏差正在缩小' : '比较同一噪声状态下的轨迹偏差', x + width / 2, y + height - 10, C.muted, '9px "Segoe UI", sans-serif', 'center');
}

function drawDistribution(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
  alpha: number,
  seed: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, -0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = Math.min(1, alpha + 0.35);
  ctx.stroke();
  for (let index = 0; index < 14; index += 1) {
    const angle = index * 2.19 + seed;
    const radius = 0.18 + ((index * 37) % 71) / 100;
    const px = cx + Math.cos(angle) * rx * radius;
    const py = cy + Math.sin(angle) * ry * radius;
    ctx.beginPath(); ctx.arc(px, py, 1.8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawDmObjective(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, now: number) {
  panel(ctx, x, y, width, height, '#ffffff');
  text(ctx, 'DM · 让生成分布靠近真实数据分布', x + 12, y + 22, C.green, '700 11px "Segoe UI", sans-serif');
  const progress = objectiveProgress(now, 2800);
  const real = { x: x + width - 65, y: y + 86 };
  const start = { x: x + 62, y: y + height - 65 };
  const student = {
    x: start.x + (real.x - start.x) * (0.12 + progress * 0.76),
    y: start.y + (real.y - start.y) * (0.12 + progress * 0.76),
  };

  ctx.save();
  ctx.strokeStyle = '#e7ebf2';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + 18, y + height - 28); ctx.lineTo(x + width - 16, y + height - 28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 18, y + 39); ctx.lineTo(x + 18, y + height - 28); ctx.stroke();
  ctx.restore();

  drawDistribution(ctx, start.x, start.y, 43, 25, '#c43f52', 0.07, 0.3);
  ctx.save();
  ctx.strokeStyle = '#c43f52';
  ctx.globalAlpha = 0.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath(); ctx.ellipse(start.x, start.y, 43, 25, -0.18, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  drawDistribution(ctx, real.x, real.y, 46, 29, C.green, 0.12, 1.1);
  drawDistribution(ctx, student.x, student.y, 42, 24, C.blue, 0.12, 2.2);
  arrow(ctx, { x: start.x + 20, y: start.y - 14 }, { x: real.x - 25, y: real.y + 14 }, C.orange, 2, 0.55, true);

  text(ctx, '真实数据分布', real.x, y + 47, C.green, '700 9px "Segoe UI", sans-serif', 'center');
  text(ctx, '更新前', start.x, start.y + 38, '#c43f52', '9px "Segoe UI", sans-serif', 'center');
  text(ctx, '学生生成分布', student.x, student.y - 34, C.blue, '700 9px "Segoe UI", sans-serif', 'center');
  text(ctx, progress > 0.72 ? '两处分布的差异正在缩小' : 'DM 梯度推动整处分布移动', x + width / 2, y + height - 10, C.muted, '9px "Segoe UI", sans-serif', 'center');
}

function drawTraining(ctx: CanvasRenderingContext2D, stage: TrainingStage, objective: Objective, now: number) {
  panel(ctx, 18, 18, 610, 434, '#fbfcfe');
  panel(ctx, 644, 18, 258, 434, objective === 'CA' ? '#f8f7ff' : '#f6fbf7');
  text(ctx, '训练阶段 · MT-DMD', 38, 49, C.blue, '700 17px "Segoe UI", sans-serif');
  text(ctx, '教师把监督写入学生参数', 38, 70, C.muted, '12px "Segoe UI", sans-serif');
  drawPerspectiveGrid(ctx);

  const stages = [0.08, 0.5, 0.92];
  ctx.save();
  ctx.strokeStyle = '#b7c2d4';
  ctx.lineWidth = 3;
  ctx.setLineDash([7, 7]);
  ctx.beginPath();
  for (let i = 0; i <= 50; i += 1) {
    const p = trajectoryPoint(i / 50);
    if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.restore();

  const teacherPositions: Point[] = [{ x: 116, y: 102 }, { x: 328, y: 82 }, { x: 518, y: 124 }];
  const teacherNames = ['空间布局', '数字艺术／语义', '文字／高频细节'];
  const teacherColors = [C.blue, C.purple, C.green];
  teacherPositions.forEach((position, index) => {
    const active = index === stage;
    ctx.save();
    roundedRect(ctx, position.x - 67, position.y - 24, 134, 48, 10);
    ctx.fillStyle = active ? '#ffffff' : '#f5f7fa';
    ctx.fill();
    ctx.strokeStyle = active ? teacherColors[index] : C.line;
    ctx.lineWidth = active ? 2.5 : 1;
    ctx.stroke();
    text(ctx, teacherNames[index], position.x, position.y + 4, active ? teacherColors[index] : C.muted, `${active ? '700' : '500'} 11px "Segoe UI", sans-serif`, 'center');
    ctx.restore();
  });

  stages.forEach((t, index) => {
    const p = trajectoryPoint(t);
    const active = index === stage;
    dot(ctx, p, active ? 9 : 5, active ? C.orange : '#b7c2d4');
    if (active) {
      const pulse = (Math.sin(now / 380) + 1) / 2;
      ctx.save();
      ctx.strokeStyle = C.orange;
      ctx.globalAlpha = 0.45 * (1 - pulse);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, 12 + pulse * 15, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
  });

  const current = trajectoryPoint(stages[stage]);
  const activeTeacher = teacherPositions[stage];
  const pulse = (Math.sin(now / 460) + 1) / 2;
  arrow(ctx, { x: activeTeacher.x, y: activeTeacher.y + 27 }, { x: current.x, y: current.y - 12 }, teacherColors[stage], 2.5, 0.58 + pulse * 0.35);
  text(ctx, '动态路由 Wₖ', current.x + 14, current.y - 16, C.orange, '700 11px "Segoe UI", sans-serif');

  const student = { x: 472, y: 390 };
  panel(ctx, student.x - 73, student.y - 25, 146, 50, '#ffffff');
  text(ctx, 'Turbo 学生', student.x, student.y - 2, C.green, '700 13px "Segoe UI", sans-serif', 'center');
  text(ctx, '更新参数', student.x, student.y + 15, C.muted, '10px "Segoe UI", sans-serif', 'center');
  arrow(ctx, { x: current.x + 8, y: current.y + 10 }, { x: student.x - 50, y: student.y - 27 }, objective === 'CA' ? C.purple : C.green, 2.5);

  const copy = stageCopy[stage];
  text(ctx, '当前训练状态', 666, 50, C.muted, '700 11px "Segoe UI", sans-serif');
  text(ctx, copy.short, 666, 79, C.orange, '800 22px "Segoe UI", sans-serif');
  text(ctx, copy.sigma, 666, 101, C.muted, '12px "Segoe UI", sans-serif');
  text(ctx, '主要教师专长', 666, 140, C.muted, '700 11px "Segoe UI", sans-serif');
  text(ctx, copy.expert, 666, 166, teacherColors[stage], '700 15px "Segoe UI", sans-serif');
  const actionLines = stage === 1 ? ['同时校正整体风格', '与语义结构'] : stage === 2 ? ['补足拼写、材质、光照', '与局部细节'] : ['先建立主体位置、数量', '与宏观构图'];
  actionLines.forEach((line, index) => text(ctx, line, 666, 193 + index * 19, C.ink, '12px "Segoe UI", sans-serif'));

  text(ctx, `当前优化目标 O = ${objective}`, 666, 247, objective === 'CA' ? C.purple : C.green, '800 14px "Segoe UI", sans-serif');
  if (objective === 'CA') drawCaObjective(ctx, 662, 259, 222, 171, now);
  else drawDmObjective(ctx, 662, 259, 222, 171, now);
}

function drawInferencePoster(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
  ctx.save();
  roundedRect(ctx, x, y, 178, 116, 10);
  ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.strokeStyle = progress >= 1 ? C.green : C.line;
  ctx.lineWidth = progress >= 1 ? 2.5 : 1; ctx.stroke();
  ctx.globalAlpha = 0.18 + progress * 0.82;
  ctx.fillStyle = C.blue; ctx.fillRect(x + 15, y + 15, 148, 17);
  ctx.fillStyle = '#d7c2f7'; ctx.fillRect(x + 15, y + 45, 78, 50);
  ctx.fillStyle = C.muted;
  ctx.fillRect(x + 105, y + 48, 55, 5);
  ctx.fillRect(x + 105, y + 64, 45, 5);
  ctx.fillRect(x + 105, y + 80, 55, 5);
  ctx.restore();
}

function drawInference(ctx: CanvasRenderingContext2D, nfe: number, now: number) {
  panel(ctx, 18, 18, 884, 434, '#fbfcfe');
  text(ctx, '推理阶段 · Turbo 学生独立运行', 38, 49, C.green, '700 17px "Segoe UI", sans-serif');
  text(ctx, 'NFE = Number of Function Evaluations，即生成网络被调用的次数', 38, 70, C.muted, '12px "Segoe UI", sans-serif');

  const p0 = { x: 74, y: 346 };
  const p1 = { x: 238, y: 88 };
  const p2 = { x: 458, y: 342 };
  const p3 = { x: 616, y: 117 };
  const q1 = { x: 266, y: 177 };
  const q2 = { x: 436, y: 231 };
  for (let i = 0; i <= 5; i += 1) {
    ctx.strokeStyle = '#edf0f5'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(54, 112 + i * 48); ctx.lineTo(640, 112 + i * 48); ctx.stroke();
  }
  for (let i = 0; i <= 6; i += 1) {
    ctx.beginPath(); ctx.moveTo(72 + i * 92, 90); ctx.lineTo(72 + i * 92, 380); ctx.stroke();
  }

  ctx.save();
  ctx.strokeStyle = '#aeb9ca'; ctx.lineWidth = 2; ctx.setLineDash([5, 6]);
  ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y); ctx.stroke();
  ctx.setLineDash([]);
  for (let i = 0; i <= 22; i += 1) dot(ctx, bezierPoint(i / 22, p0, p1, p2, p3), 2.6, '#aeb9ca', '#aeb9ca', 0);
  ctx.restore();
  text(ctx, '常规迭代路径（步数未公开）', 82, 99, C.muted, '11px "Segoe UI", sans-serif');

  ctx.save();
  ctx.strokeStyle = C.green; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.bezierCurveTo(q1.x, q1.y, q2.x, q2.y, p3.x, p3.y); ctx.stroke();
  ctx.restore();
  text(ctx, 'Turbo 学生的少步路径', 350, 372, C.green, '700 11px "Segoe UI", sans-serif');

  const completed = Math.max(0, Math.min(8, nfe));
  for (let i = 0; i <= 8; i += 1) {
    const p = bezierPoint(i / 8, p0, q1, q2, p3);
    const active = i === completed;
    const done = i <= completed;
    dot(ctx, p, active ? 9 : 6, done ? C.green : '#ffffff', done ? '#ffffff' : C.line, active ? 3 : 2);
    if (i > 0 && i < 8) text(ctx, String(i), p.x, p.y - 13, done ? C.green : C.muted, '10px "Segoe UI", sans-serif', 'center');
  }
  const current = bezierPoint(completed / 8, p0, q1, q2, p3);
  const next = bezierPoint(Math.min(1, (completed + 0.12) / 8), p0, q1, q2, p3);
  if (completed < 8) {
    const pulse = (Math.sin(now / 320) + 1) / 2;
    arrow(ctx, current, next, C.orange, 3, 0.55 + pulse * 0.4);
  }
  text(ctx, '噪声潜变量', p0.x - 10, p0.y + 27, C.muted, '11px "Segoe UI", sans-serif');
  text(ctx, '目标图像', p3.x, p3.y - 17, C.green, '700 11px "Segoe UI", sans-serif', 'center');

  panel(ctx, 661, 88, 219, 292, '#ffffff');
  text(ctx, '当前推理状态', 682, 118, C.muted, '700 11px "Segoe UI", sans-serif');
  text(ctx, `${completed} / 8 NFE`, 682, 153, completed === 8 ? C.green : C.blue, '800 25px "Segoe UI", sans-serif');
  text(ctx, completed === 0 ? '尚未调用学生模型' : completed === 8 ? '八次模型调用完成' : `完成第 ${completed} 次模型调用`, 682, 177, C.ink, '12px "Segoe UI", sans-serif');
  drawInferencePoster(ctx, 682, 197, completed / 8);
  text(ctx, '推理时加载', 682, 337, C.muted, '700 10px "Segoe UI", sans-serif');
  text(ctx, '仅 Turbo 学生', 682, 360, C.green, '700 13px "Segoe UI", sans-serif');
  text(ctx, '方向：每次调用沿学生学到的速度场前进一步', 53, 417, C.ink, '12px "Segoe UI", sans-serif');
  text(ctx, '开销：论文明确报告 Turbo 为 8 NFE；未报告教师的固定 NFE 或墙钟时间', 53, 439, C.muted, '11px "Segoe UI", sans-serif');
}

export const Ch7TurboWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<View>('training');
  const [stage, setStage] = useState<TrainingStage>(0);
  const [objective, setObjective] = useState<Objective>('CA');
  const [nfe, setNfe] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    let frameId = 0;
    let visible = false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw = (now = 0) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.field; ctx.fillRect(0, 0, W, H);
      if (view === 'training') drawTraining(ctx, stage, objective, now); else drawInference(ctx, nfe, now);
      canvas.classList.add('is-ready');
      if (visible && !reducedMotion) frameId = window.requestAnimationFrame(draw);
    };
    const start = () => { visible = true; window.cancelAnimationFrame(frameId); draw(performance.now()); };
    const stop = () => { visible = false; window.cancelAnimationFrame(frameId); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [view, stage, objective, nfe]);

  useEffect(() => {
    if (!isPlaying || view !== 'inference') return;
    if (nfe >= 8) { setIsPlaying(false); return; }
    const timer = window.setTimeout(() => setNfe((value) => Math.min(8, value + 1)), 560);
    return () => window.clearTimeout(timer);
  }, [isPlaying, nfe, view]);

  const selectView = (next: View) => { setIsPlaying(false); setView(next); };
  const playInference = () => {
    setView('inference');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setNfe(8); setIsPlaying(false); return; }
    setNfe(0); setIsPlaying(true);
  };

  const feedback = view === 'training'
    ? objective === 'CA'
      ? `${stageCopy[stage].short}阶段，CA 比较学生轨迹与${stageCopy[stage].expert}给出的引导轨迹；右图紫色修正向量把学生在同一噪声状态下的预测拉回教师路径。`
      : `${stageCopy[stage].short}阶段，DM 比较学生生成分布与真实数据分布；右图蓝色分布沿橙色方向移动，使整体分布差异逐渐缩小。`
    : nfe === 0
      ? '点击“播放 8 NFE”，观察 Turbo 学生从噪声潜变量出发，独立完成八次模型函数求值。'
      : nfe === 8
        ? '推理完成：八次调用全部由 Turbo 学生执行，教师模型与 MT-DMD 路由没有进入推理链路。'
        : `第 ${nfe} 次模型函数求值完成：学生沿学到的速度场向目标图像前进，还剩 ${8 - nfe} 次调用。`;

  return (
    <div className="turbo-widget">
      <div className="turbo-why" aria-label="蒸馏动机">
        <div><span>原始过程</span><strong>反复调用生成网络</strong><small>逐步把噪声还原为图像</small></div>
        <b aria-hidden="true">→</b>
        <div className="risk"><span>压缩难点</span><strong>少步训练可能能力漂移</strong><small>尤其使用数据子集时</small></div>
        <b aria-hidden="true">→</b>
        <div className="method"><span>论文方案</span><strong>MT-DMD 多教师蒸馏</strong><small>学生推理仅需 8 NFE</small></div>
      </div>

      <div className="turbo-view-tabs" role="tablist" aria-label="选择蒸馏阶段">
        <button className={view === 'training' ? 'active' : ''} role="tab" aria-selected={view === 'training'} onClick={() => selectView('training')}>① 训练：教师如何教</button>
        <button className={view === 'inference' ? 'active' : ''} role="tab" aria-selected={view === 'inference'} onClick={() => selectView('inference')}>② 推理：学生如何跑</button>
      </div>

      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label={view === 'training' ? `MT-DMD 训练轨迹：${stageCopy[stage].short}，优化目标 ${objective}` : `Turbo 独立推理轨迹，已完成 ${nfe} 次，共 8 NFE`}
      />

      {view === 'training' ? (
        <div className="turbo-controls training-controls">
          <div className="turbo-control-group">
            <span>沿训练轨迹查看教师交接</span>
            <div className="chip-row" role="radiogroup" aria-label="训练噪声阶段">
              {stageCopy.map((item, index) => (
                <button key={item.short} className={`chip ${stage === index ? 'selected' : ''}`} role="radio" aria-checked={stage === index} onClick={() => setStage(index as TrainingStage)}>{index + 1}. {item.short}</button>
              ))}
            </div>
          </div>
          <div className="turbo-control-group">
            <span>切换同一状态下的优化目标</span>
            <div className="chip-row" role="radiogroup" aria-label="蒸馏优化目标">
              <button className={`chip ${objective === 'CA' ? 'selected' : ''}`} role="radio" aria-checked={objective === 'CA'} onClick={() => setObjective('CA')}>CA · 轨迹对齐</button>
              <button className={`chip ${objective === 'DM' ? 'selected' : ''}`} role="radio" aria-checked={objective === 'DM'} onClick={() => setObjective('DM')}>DM · 分布匹配</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="turbo-controls inference-controls">
          <button className="tiny" disabled={isPlaying} onClick={playInference}>{isPlaying ? '推理播放中…' : nfe === 8 ? '重新播放 8 NFE' : '播放 8 NFE'}</button>
          <button className="tiny ghost" disabled={isPlaying || nfe === 0} onClick={() => setNfe((value) => Math.max(0, value - 1))}>上一步</button>
          <span className="step-label">学生模型调用 <b>{nfe}</b> / 8</span>
          <button className="tiny ghost" disabled={isPlaying || nfe === 8} onClick={() => setNfe((value) => Math.min(8, value + 1))}>下一步</button>
        </div>
      )}

      <div className={`turbo-feedback ${view === 'inference' && nfe === 8 ? 'complete' : ''}`} aria-live="polite">{feedback}</div>
      <div className="turbo-terms">
        <div><strong>CA</strong><span>Classifier-Free Guidance Augmentation：让学生轨迹对齐教师的引导路径。</span></div>
        <div><strong>DM</strong><span>Distribution Matching：让学生生成分布接近真实数据分布。</span></div>
        <div><strong>NFE</strong><span>Number of Function Evaluations：一次 NFE 就是调用一次生成网络并计算速度场。</span></div>
      </div>
    </div>
  );
};

export default Ch7TurboWidget;
