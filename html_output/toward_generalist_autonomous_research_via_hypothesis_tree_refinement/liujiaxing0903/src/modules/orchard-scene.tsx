import React, { useEffect, useRef, useState } from 'react';
import { easeInOutQuad, lerp, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;
const LOOP_MS = 4000;
const LARGE_SCENE_SCALE = 820 / W;

const C = {
  bg: '#f4f7fa',
  panel: '#ffffff',
  line: '#cbd6e1',
  grid: '#e7edf3',
  ink: '#23334b',
  muted: '#6f7f91',
  blue: '#315886',
  blueSoft: '#dce8f5',
  green: '#24845a',
  greenSoft: '#dcefe6',
  red: '#bd4053',
  redSoft: '#f5dfe3',
  orange: '#d47a16',
  orangeSoft: '#f8ead8',
  purple: '#7650a8',
  purpleSoft: '#e9e1f3',
  white: '#ffffff',
};

type Scene = {
  title: string;
  note: string;
  draw: (ctx: CanvasRenderingContext2D, time: number) => void;
};

function phase(time: number) {
  return (time % LOOP_MS) / LOOP_MS;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function stagedProgress(time: number, start = 0.06, end = 0.7) {
  return easeInOutQuad(clamp((phase(time) - start) / (end - start), 0, 1));
}

function setupSceneCanvas(canvas: HTMLCanvasElement) {
  const pixelRatio = Math.max(window.devicePixelRatio || 1, LARGE_SCENE_SCALE);
  canvas.width = Math.round(W * pixelRatio);
  canvas.height = Math.round(H * pixelRatio);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');
  ctx.scale(pixelRatio, pixelRatio);
  return ctx;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D, title: string) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = C.grid;
  for (let x = 14; x < W; x += 18) {
    for (let y = 31; y < H - 8; y += 18) {
      ctx.beginPath();
      ctx.arc(x, y, 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = C.ink;
  ctx.font = '700 10px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 15, 15);
  ctx.fillStyle = C.blue;
  roundedRect(ctx, 7, 9, 4, 12, 2);
  ctx.fill();
  ctx.textBaseline = 'alphabetic';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function finishScene(ctx: CanvasRenderingContext2D, time: number) {
  ctx.fillStyle = 'rgba(35, 51, 75, 0.10)';
  ctx.fillRect(0, H - 3, W, 3);
  ctx.fillStyle = C.blue;
  ctx.fillRect(0, H - 3, W * phase(time), 3);
  ctx.strokeStyle = 'rgba(49, 88, 134, 0.16)';
  ctx.lineWidth = 1;
  roundedRect(ctx, 0.5, 0.5, W - 1, H - 1, 7);
  ctx.stroke();
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  stroke = C.line,
  fill = C.panel,
  dashed = false
) {
  ctx.save();
  ctx.shadowColor = 'rgba(35, 51, 75, 0.10)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 2;
  roundedRect(ctx, x, y, width, height, 6);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.4;
  if (dashed) ctx.setLineDash([4, 3]);
  roundedRect(ctx, x + 0.5, y + 0.5, width - 1, height - 1, 5.5);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = C.ink,
  size = 8,
  weight = 700,
  align: CanvasTextAlign = 'center'
) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.textBaseline = 'alphabetic';
}

function drawBadge(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  text: string,
  color: string
) {
  ctx.font = '700 9px "Segoe UI", "Microsoft YaHei", sans-serif';
  const width = Math.max(46, ctx.measureText(text).width + 16);
  const x = clamp(centerX - width / 2, 7, W - width - 7);
  ctx.save();
  ctx.shadowColor = 'rgba(35, 51, 75, 0.18)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 2;
  roundedRect(ctx, x, y, width, 19, 5);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
  ctx.lineWidth = 1;
  roundedRect(ctx, x + 0.5, y + 0.5, width - 1, 18, 4.5);
  ctx.stroke();
  drawLabel(ctx, text, x + width / 2, y + 10, C.white, 9);
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color = C.blue,
  dashed = false
) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  if (dashed) ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - 6 * Math.cos(angle - 0.48), toY - 6 * Math.sin(angle - 0.48));
  ctx.lineTo(toX - 6 * Math.cos(angle + 0.48), toY - 6 * Math.sin(angle + 0.48));
  ctx.closePath();
  ctx.fill();
}

function drawCheck(ctx: CanvasRenderingContext2D, x: number, y: number, color = C.green) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(x - 5, y);
  ctx.lineTo(x - 1, y + 4);
  ctx.lineTo(x + 7, y - 5);
  ctx.stroke();
}

function drawCross(ctx: CanvasRenderingContext2D, x: number, y: number, color = C.red) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(x - 5, y - 5);
  ctx.lineTo(x + 5, y + 5);
  ctx.moveTo(x + 5, y - 5);
  ctx.lineTo(x - 5, y + 5);
  ctx.stroke();
}

function drawLock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  locked: boolean,
  color: string
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  if (locked) {
    ctx.arc(x, y - 2, 4.5, Math.PI, 0);
  } else {
    ctx.arc(x + 2, y - 2, 4.5, Math.PI * 1.05, Math.PI * 1.8);
  }
  ctx.stroke();
  roundedRect(ctx, x - 6, y - 2, 12, 10, 2.5);
  ctx.fill();
  ctx.fillStyle = C.white;
  ctx.beginPath();
  ctx.arc(x, y + 2, 1.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  stroke = C.blue,
  fill = C.panel,
  label?: string
) {
  ctx.save();
  ctx.shadowColor = 'rgba(35, 51, 75, 0.14)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1.5;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  if (label) drawLabel(ctx, label, x, y + 0.5, stroke, 7.5);
}

function drawMovingCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  color = C.blue,
  width = 38,
  height = 23
) {
  ctx.save();
  ctx.shadowColor = 'rgba(35, 51, 75, 0.20)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  roundedRect(ctx, x - width / 2, y - height / 2, width, height, 5);
  ctx.fillStyle = C.panel;
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  roundedRect(ctx, x - width / 2 + 0.5, y - height / 2 + 0.5, width - 1, height - 1, 4.5);
  ctx.stroke();
  roundedRect(ctx, x - width / 2 + 4, y - height / 2 + 4, 4, height - 8, 2);
  ctx.fillStyle = color;
  ctx.fill();
  drawLabel(ctx, label, x + 2, y + 0.5, C.ink, 7.5);
}

function pointOnPath(points: Array<[number, number]>, progress: number) {
  const segmentProgress = clamp(progress, 0, 1) * (points.length - 1);
  const index = Math.min(points.length - 2, Math.floor(segmentProgress));
  const local = segmentProgress - index;
  return {
    x: lerp(points[index][0], points[index + 1][0], local),
    y: lerp(points[index][1], points[index + 1][1], local),
  };
}

const SCENES: Scene[] = [
  {
    title: '从重复试错到持久记忆',
    note: '左侧的失败只会重启；右侧把实验结果写入可复用记忆。',
    draw: (ctx, time) => {
      const t = stagedProgress(time);
      const leftT = clamp(t / 0.78, 0, 1);
      const rightT = clamp(t / 0.82, 0, 1);

      drawPanel(ctx, 10, 30, 105, 70, C.redSoft);
      drawPanel(ctx, 129, 30, 105, 70, C.greenSoft);
      drawLabel(ctx, '无记忆', 26, 40, C.red, 8, 700, 'left');
      drawLabel(ctx, '持久记忆', 145, 40, C.green, 8, 700, 'left');

      drawMovingCard(ctx, 31, 65, '尝试', C.red, 33, 21);
      drawPanel(ctx, 80, 54, 25, 22, C.red, C.redSoft);
      drawCross(ctx, 92.5, 65, C.red);
      drawArrow(ctx, 48, 65, 75, 65, C.red, true);
      const leftX = lerp(51, 76, leftT);
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.arc(leftX, 65, 4, 0, Math.PI * 2);
      ctx.fill();
      if (t > 0.8) {
        drawLabel(ctx, '再次从零开始', 62, 88, C.red, 7.5);
        drawArrow(ctx, 91, 79, 35, 79, C.red, true);
      }

      drawMovingCard(ctx, 151, 65, '实验', C.blue, 33, 21);
      drawPanel(ctx, 194, 48, 30, 38, C.green, C.panel);
      drawLabel(ctx, '记忆', 209, 56, C.green, 7.5);
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1.5;
      [65, 72, 79].forEach((y) => {
        ctx.beginPath();
        ctx.moveTo(200, y);
        ctx.lineTo(218, y);
        ctx.stroke();
      });
      drawArrow(ctx, 169, 65, 190, 65, C.blue);
      const rightX = lerp(173, 195, rightT);
      ctx.fillStyle = rightT > 0.93 ? C.green : C.blue;
      ctx.beginPath();
      ctx.arc(rightX, 65, 4, 0, Math.PI * 2);
      ctx.fill();
      if (t > 0.82) drawCheck(ctx, 209, 91, C.green);

      drawBadge(ctx, 182, 103, t > 0.82 ? '结果被记住' : '写入长期记忆', t > 0.82 ? C.green : C.blue);
    },
  },
  {
    title: '四项契约，两种使用权限',
    note: 'M₀ 与 O 预先固定；探索只使用 Edev，Etest 到 Decide 才能开启。',
    draw: (ctx, time) => {
      const loop = phase(time);
      const switchT = easeInOutQuad(clamp((loop - 0.52) / 0.16, 0, 1));
      const decide = switchT > 0.72;
      const pulse = 0.62 + Math.sin(time / 260) * 0.22;
      const cards = [
        { symbol: 'M₀', role: '初始产物', status: '固定起点', color: C.blue, soft: C.blueSoft },
        { symbol: 'O', role: '研究目标', status: '固定方向', color: C.orange, soft: C.orangeSoft },
        {
          symbol: 'Edev',
          role: '开发评估',
          status: decide ? '探索结束' : '可反复使用',
          color: C.purple,
          soft: C.purpleSoft,
        },
        {
          symbol: 'Etest',
          role: '留出评估',
          status: decide ? '仅此时使用' : '保持封存',
          color: C.green,
          soft: C.greenSoft,
        },
      ] as const;

      roundedRect(ctx, 177, 7, 59, 16, 5);
      ctx.fillStyle = decide ? C.greenSoft : C.blueSoft;
      ctx.fill();
      drawLabel(ctx, decide ? 'DECIDE 准入' : 'EXPLORE 探索', 206.5, 15, decide ? C.green : C.blue, 6.5);

      cards.forEach((card, index) => {
        const x = 7 + index * 59;
        const active = index === (decide ? 3 : 2);
        drawPanel(ctx, x, 31, 54, 66, active ? card.color : C.line, active ? card.soft : C.panel);
        if (active) {
          ctx.save();
          ctx.globalAlpha = pulse;
          ctx.strokeStyle = card.color;
          ctx.lineWidth = 2.8;
          roundedRect(ctx, x + 1.5, 32.5, 51, 63, 5);
          ctx.stroke();
          ctx.restore();
        }
        drawLabel(ctx, card.symbol, x + 27, 44, card.color, card.symbol.length > 2 ? 8 : 9);
        drawLabel(ctx, card.role, x + 27, 60, C.ink, 6.7, 700);
        drawLabel(ctx, card.status, x + 27, 83, active ? card.color : C.muted, 6.2, 700);
        if (index === 3) drawLock(ctx, x + 43, 42, !decide, decide ? C.green : C.muted);
      });

      ctx.strokeStyle = C.line;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(118, 109);
      ctx.lineTo(220, 109);
      ctx.stroke();
      const markerX = lerp(151, 210, switchT);
      ctx.fillStyle = decide ? C.green : C.purple;
      ctx.beginPath();
      ctx.arc(markerX, 109, 5, 0, Math.PI * 2);
      ctx.fill();
      drawLabel(ctx, '探索读 Edev', 85, 109, decide ? C.muted : C.purple, 7, 700);
      drawLabel(ctx, 'Decide 读 Etest', 202, 121, decide ? C.green : C.muted, 7, 700);
    },
  },
  {
    title: '证据与产物写入假设节点',
    note: '节点把假设、洞见、元数据和产物引用绑定为可追溯记录。',
    draw: (ctx, time) => {
      const t = stagedProgress(time);
      drawPanel(ctx, 19, 30, 121, 73, t > 0.9 ? C.green : C.blue);
      drawLabel(ctx, '假设节点', 33, 41, t > 0.9 ? C.green : C.blue, 8, 700, 'left');
      const fields = [
        ['h', '假设'],
        ['ι', '证据洞见'],
        ['μ', '元数据'],
        ['↗', '产物引用'],
      ];
      fields.forEach(([symbol, label], index) => {
        const y = 54 + index * 11;
        roundedRect(ctx, 30, y - 5, 18, 9, 3);
        ctx.fillStyle = index === 1 && t > 0.86 ? C.greenSoft : C.blueSoft;
        ctx.fill();
        drawLabel(ctx, symbol, 39, y, index === 1 && t > 0.86 ? C.green : C.blue, 7);
        drawLabel(ctx, label, 55, y, C.muted, 7, 600, 'left');
        ctx.strokeStyle = C.grid;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(89, y);
        ctx.lineTo(127, y);
        ctx.stroke();
      });

      drawArrow(ctx, 207, 66, 145, 66, C.purple, true);
      const x = lerp(204, 112, t);
      const y = lerp(66, 65, t);
      drawMovingCard(ctx, x, y, '证据 + 产物', t > 0.9 ? C.green : C.purple, 59, 24);
      if (t > 0.92) drawCheck(ctx, 126, 92, C.green);
      drawBadge(ctx, 188, 102, t > 0.92 ? '节点可追溯' : '绑定到节点', t > 0.92 ? C.green : C.purple);
    },
  },
  {
    title: '证据沿树回传到根节点',
    note: '叶节点的实验结论沿祖先路径回传，更新后续搜索依据。',
    draw: (ctx, time) => {
      const t = stagedProgress(time);
      const path: Array<[number, number]> = [
        [196, 91],
        [151, 72],
        [103, 43],
      ];
      const p = pointOnPath(path, t);

      ctx.strokeStyle = C.line;
      ctx.lineWidth = 2.2;
      [
        [103, 43, 61, 72],
        [103, 43, 151, 72],
        [61, 72, 34, 94],
        [61, 72, 84, 94],
        [151, 72, 130, 95],
        [151, 72, 196, 91],
      ].forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });

      drawNode(ctx, 103, 43, 12, t > 0.9 ? C.green : C.blue, t > 0.9 ? C.greenSoft : C.panel, '根');
      drawNode(ctx, 61, 72, 9, C.blue, C.panel);
      drawNode(ctx, 151, 72, 9, t > 0.48 ? C.green : C.blue, t > 0.48 ? C.greenSoft : C.panel);
      drawNode(ctx, 34, 94, 7, C.line, C.panel);
      drawNode(ctx, 84, 94, 7, C.line, C.panel);
      drawNode(ctx, 130, 95, 7, C.line, C.panel);
      drawNode(ctx, 196, 91, 8, C.purple, C.purpleSoft);
      drawLabel(ctx, '叶', 196, 91, C.purple, 6.5);

      ctx.save();
      ctx.shadowColor = 'rgba(118, 80, 168, 0.42)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = t > 0.9 ? C.green : C.purple;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (t > 0.9) drawCheck(ctx, 103, 22, C.green);
      drawBadge(ctx, 178, 103, t > 0.9 ? '根节点已更新' : '证据向上回传', t > 0.9 ? C.green : C.purple);
    },
  },
  {
    title: '从前沿叶节点选择下一步',
    note: '协调器根据祖先与兄弟节点证据、预期效用等因素选择前沿叶节点。',
    draw: (ctx, time) => {
      const t = stagedProgress(time);
      const leaves = [
        { x: 48, score: '重复', color: C.redSoft },
        { x: 112, score: '支持', color: C.greenSoft },
        { x: 181, score: '待解', color: C.orangeSoft },
      ];
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(114, 39);
      ctx.lineTo(48, 79);
      ctx.moveTo(114, 39);
      ctx.lineTo(112, 79);
      ctx.moveTo(114, 39);
      ctx.lineTo(181, 79);
      ctx.stroke();
      drawNode(ctx, 114, 39, 10, C.blue, C.blueSoft, '根');
      leaves.forEach((leaf, index) => {
        const selected = index === 1 && t > 0.88;
        drawNode(ctx, leaf.x, 80, 12, selected ? C.green : C.blue, selected ? C.greenSoft : leaf.color);
        drawLabel(ctx, leaf.score, leaf.x, 80, selected ? C.green : C.ink, 7);
        drawLabel(ctx, `叶 ${index + 1}`, leaf.x, 99, selected ? C.green : C.muted, 6.8);
      });

      const ringX = lerp(48, 112, t);
      ctx.save();
      ctx.strokeStyle = t > 0.88 ? C.green : C.orange;
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(212, 122, 22, 0.28)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(ringX, 80, 17, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ringX + 12, 92);
      ctx.lineTo(ringX + 21, 101);
      ctx.stroke();
      ctx.restore();
      drawBadge(ctx, 186, 103, t > 0.88 ? '选中有依据的叶' : '比较前沿证据', t > 0.88 ? C.green : C.orange);
    },
  },
  {
    title: '剪除被反证的搜索分支',
    note: '反证让一条路径失去继续搜索的价值，系统将其从前沿中剪除。',
    draw: (ctx, time) => {
      const t = stagedProgress(time, 0.05, 0.62);
      const cut = t > 0.62;
      const fade = clamp((t - 0.62) / 0.38, 0, 1);
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 2.2;
      [
        [105, 39, 62, 68],
        [105, 39, 153, 68],
        [62, 68, 35, 94],
        [62, 68, 88, 94],
        [153, 68, 132, 94],
      ].forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
      ctx.save();
      ctx.globalAlpha = 1 - fade;
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2.8;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(153, 68);
      ctx.lineTo(198, 94);
      ctx.stroke();
      ctx.setLineDash([]);
      drawNode(ctx, 198, 94, 8, C.red, C.redSoft, '×');
      ctx.restore();

      drawNode(ctx, 105, 39, 10, C.blue, C.blueSoft, '根');
      drawNode(ctx, 62, 68, 8, C.blue);
      drawNode(ctx, 153, 68, 8, C.blue);
      drawNode(ctx, 35, 94, 7, C.line);
      drawNode(ctx, 88, 94, 7, C.green, C.greenSoft);
      drawNode(ctx, 132, 94, 7, C.line);

      const sx = lerp(221, 176, clamp(t / 0.62, 0, 1));
      const sy = lerp(59, 80, clamp(t / 0.62, 0, 1));
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(-0.35);
      ctx.strokeStyle = cut ? C.purple : C.blue;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(-7, 0, 5, 0, Math.PI * 2);
      ctx.arc(7, 0, 5, 0, Math.PI * 2);
      ctx.moveTo(-3, 4);
      ctx.lineTo(17, 20);
      ctx.moveTo(3, 4);
      ctx.lineTo(-17, 20);
      ctx.stroke();
      ctx.restore();
      if (cut) drawCross(ctx, 176, 81, C.purple);
      drawBadge(ctx, 181, 103, cut ? '反证分支已剪除' : '定位无效路径', cut ? C.purple : C.blue);
    },
  },
  {
    title: '六步循环保存研究状态',
    note: 'HTR 的六个动作共同形成一次可恢复、可审计的研究状态更新。',
    draw: (ctx, time) => {
      const t = stagedProgress(time, 0.04, 0.76);
      const labels = ['观', '构', '选', '派', '传', '决'];
      const xs = [25, 59, 93, 127, 161, 195];
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(xs[0], 65);
      ctx.lineTo(xs[5], 65);
      ctx.stroke();
      const completed = Math.floor(t * 5.99);
      labels.forEach((label, index) => {
        const done = index <= completed;
        drawNode(ctx, xs[index], 65, 11, done ? C.green : C.line, done ? C.greenSoft : C.panel, label);
        drawLabel(ctx, `${index + 1}`, xs[index], 88, done ? C.green : C.muted, 6.5);
      });

      const markerX = lerp(xs[0], xs[5], t);
      ctx.save();
      ctx.shadowColor = 'rgba(49, 88, 134, 0.35)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = t > 0.96 ? C.green : C.blue;
      ctx.beginPath();
      ctx.arc(markerX, 42, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      drawArrow(ctx, markerX, 48, markerX, 53, t > 0.96 ? C.green : C.blue);

      drawPanel(ctx, 208, 50, 24, 31, t > 0.96 ? C.green : C.line, t > 0.96 ? C.greenSoft : C.panel);
      ctx.strokeStyle = t > 0.96 ? C.green : C.muted;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(213, 55, 14, 13);
      ctx.fillStyle = t > 0.96 ? C.green : C.muted;
      ctx.fillRect(216, 57, 7, 4);
      ctx.strokeRect(216, 71, 8, 6);
      if (t > 0.96) drawCheck(ctx, 220, 91, C.green);
      drawBadge(ctx, 122, 101, t > 0.96 ? '研究状态已保存' : `执行第 ${completed + 1} 步`, t > 0.96 ? C.green : C.blue);
    },
  },
  {
    title: '协调器派发隔离执行任务',
    note: '协调器可派发多个节点；每个短期执行器只验证一条固定假设，并在隔离工作树中完成实验。',
    draw: (ctx, time) => {
      const t = stagedProgress(time);
      drawPanel(ctx, 12, 39, 65, 51, C.blue, C.blueSoft);
      drawLabel(ctx, '协调器', 44.5, 52, C.blue, 8);
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 1.4;
      [62, 69, 76].forEach((y, index) => {
        ctx.beginPath();
        ctx.moveTo(25, y);
        ctx.lineTo(63 - index * 4, y);
        ctx.stroke();
      });

      drawPanel(ctx, 133, 29, 99, 73, C.purple, 'rgba(255,255,255,0.72)', true);
      drawLabel(ctx, '隔离工作树', 181.5, 38, C.purple, 7.2);
      drawPanel(ctx, 150, 48, 65, 24, C.blue, C.panel);
      drawLabel(ctx, '短期执行器', 182.5, 60, C.blue, 7.5);
      drawPanel(ctx, 150, 78, 65, 16, t > 0.9 ? C.green : C.line, t > 0.9 ? C.greenSoft : C.panel);
      drawLabel(ctx, '独立文件改动', 182.5, 86, t > 0.9 ? C.green : C.muted, 6.8);

      drawArrow(ctx, 82, 65, 143, 65, C.blue, true);
      const x = lerp(93, 166, t);
      const y = lerp(65, 60, t);
      drawMovingCard(ctx, x, y, '假设 h', t > 0.9 ? C.green : C.orange, 37, 21);
      if (t > 0.9) drawCheck(ctx, 207, 86, C.green);
      drawBadge(ctx, 80, 101, t > 0.9 ? '任务隔离执行' : '单执行器接收一条假设', t > 0.9 ? C.green : C.orange);
    },
  },
  {
    title: '留出评测决定是否合并',
    note: '候选制品必须通过独立的 Etest 门并严格改善，才能替换当前最佳制品。',
    draw: (ctx, time) => {
      const t = stagedProgress(time, 0.04, 0.76);
      const gateOpen = clamp((t - 0.34) / 0.28, 0, 1);
      drawMovingCard(ctx, 31, 66, '候选 M′', C.orange, 45, 25);
      drawArrow(ctx, 57, 66, 105, 66, C.orange, true);

      drawPanel(ctx, 105, 30, 43, 72, t > 0.62 ? C.green : C.blue, C.panel);
      drawLabel(ctx, 'Etest', 126.5, 42, t > 0.62 ? C.green : C.blue, 8.5);
      ctx.strokeStyle = t > 0.62 ? C.green : C.blue;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(115, 54);
      ctx.lineTo(115 - gateOpen * 7, 80 - gateOpen * 13);
      ctx.moveTo(138, 54);
      ctx.lineTo(138 + gateOpen * 7, 80 - gateOpen * 13);
      ctx.stroke();
      drawLabel(ctx, '留出集', 126.5, 91, C.muted, 6.8);

      drawPanel(ctx, 184, 45, 45, 42, t > 0.94 ? C.green : C.line, t > 0.94 ? C.greenSoft : C.panel);
      drawLabel(ctx, 'Mbest', 206.5, 58, t > 0.94 ? C.green : C.muted, 8);
      if (t > 0.94) drawCheck(ctx, 206, 74, C.green);

      const path: Array<[number, number]> = [
        [60, 66],
        [99, 66],
        [153, 66],
        [181, 66],
      ];
      const p = pointOnPath(path, t);
      drawMovingCard(ctx, p.x, p.y, 'M′', t > 0.94 ? C.green : C.orange, 25, 20);
      drawBadge(ctx, 125, 103, t > 0.94 ? '通过门控并合并' : '等待独立评测', t > 0.94 ? C.green : C.orange);
    },
  },
  {
    title: '按协议分别核验结果',
    note: '不同任务的协议、数据划分和指标方向必须独立检查，不能混成一张榜单。',
    draw: (ctx, time) => {
      const t = stagedProgress(time, 0.04, 0.78);
      const cards = [45, 112, 179];
      const names = ['协议 A', '协议 B', '协议 C'];
      const directions = ['↑', '↓', '↑'];
      const colors = [C.blue, C.purple, C.orange];
      const checked = Math.min(3, Math.floor(t * 3.05));
      cards.forEach((x, index) => {
        const done = index < checked;
        drawPanel(ctx, x - 25, 39, 50, 55, done ? C.green : colors[index], done ? C.greenSoft : C.panel);
        drawLabel(ctx, names[index], x, 50, done ? C.green : colors[index], 7);
        drawLabel(ctx, directions[index], x, 68, done ? C.green : colors[index], 16);
        drawLabel(ctx, index === 1 ? '越低越好' : '越高越好', x, 84, done ? C.green : C.muted, 6.2);
        if (done) drawCheck(ctx, x + 17, 45, C.green);
      });

      const journey = clamp(t * 3, 0, 2.999);
      const index = Math.min(2, Math.floor(journey));
      const local = journey - index;
      const from = cards[index];
      const to = cards[Math.min(2, index + 1)];
      const x = lerp(from, to, local);
      ctx.save();
      ctx.strokeStyle = checked === 3 ? C.green : C.orange;
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(212, 122, 22, 0.28)';
      ctx.shadowBlur = 7;
      ctx.beginPath();
      ctx.arc(x, 66, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 13, 79);
      ctx.lineTo(x + 24, 91);
      ctx.stroke();
      ctx.restore();
      drawBadge(ctx, 189, 102, checked === 3 ? '三项独立核验' : `核验 ${index + 1}/3`, checked === 3 ? C.green : C.orange);
    },
  },
];

const CHAPTER_SCENE_INDEX = [0, 2, 6, 3, 7, 9] as const;

function chapterIndex(chapterId: string) {
  const parsed = Number(chapterId.replace('chap-', ''));
  if (!Number.isFinite(parsed)) return 0;
  return CHAPTER_SCENE_INDEX[clamp(parsed - 1, 0, CHAPTER_SCENE_INDEX.length - 1)] ?? 0;
}

export const OrchardScene: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const animationTimeRef = useRef(0);
  const previousFrameRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const sceneNumber = chapterIndex(chapterId);
  const scene = SCENES[sceneNumber];
  const sizeClass = [0, 1, 2, 6, 7, 8, 9].includes(sceneNumber)
    ? 'scene-size-large'
    : 'scene-size-standard';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupSceneCanvas(canvas);
    } catch {
      return;
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = (time: number) => {
      clearScene(ctx, scene.title);
      const displayTime = reduceMotion ? LOOP_MS * 0.78 : time;
      scene.draw(ctx, displayTime);
      finishScene(ctx, displayTime);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (time: number) => {
      if (previousFrameRef.current === null) previousFrameRef.current = time;
      const delta = Math.min(50, time - previousFrameRef.current);
      previousFrameRef.current = time;
      if (!pausedRef.current && !reduceMotion) animationTimeRef.current += delta;
      render(animationTimeRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      previousFrameRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);

    return () => {
      stop();
      disconnect();
    };
  }, [scene]);

  const togglePause = () => {
    const next = !paused;
    pausedRef.current = next;
    setPaused(next);
  };

  return (
    <div className={`analogy-scene-shell ${sizeClass} ${paused ? 'is-paused' : ''}`}>
      <canvas
        id={`cv-${chapterId}-${moduleId}-orchard`}
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label={`${scene.title}：${scene.note}`}
      />
      <button
        type="button"
        className="analogy-motion-toggle"
        onClick={togglePause}
        aria-pressed={paused}
        aria-label={paused ? '继续播放动画' : '暂停动画'}
        title={paused ? '继续' : '暂停'}
      >
        {paused ? '▶' : 'Ⅱ'}
      </button>
    </div>
  );
};

export default OrchardScene;
