import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const COLORS = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', support: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47', purple: '#7c3aed',
  ink: '#21324a', muted: '#68778f', axis: '#d7deea',
};

const labels: Record<string, string> = {
  shadow: '阴影', temperature: '色温', contrast: '对比度',
  semantic: '只遵从', photo: '加光度', full: '完整三层',
  exposure: '曝光', saturation: '饱和度',
  sft: 'SFT', noPhoto: 'RL 无 rphoto', fullRl: 'RL 完整',
  psnr: 'PSNR ↑', lpips: 'LPIPS ↓', fid: 'FID ↓', dino: 'DINO ↑',
  x: '输入 X', critic: 'Image Critic', hc: 'Hc', artist: 'Photographic Artist', xe: '输出 Xe',
};

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);
}
function drawDarkroomDesk(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = COLORS.light;
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
  ctx.fillStyle = COLORS.support;
  ctx.fillRect(0, h * 0.72, w, 4);
}
function drawHeroDesk(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = COLORS.light;
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
  ctx.fillStyle = COLORS.support;
  ctx.fillRect(0, h * 0.72, w, 4);
}
function drawPhotoSheet(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, light: number, accent = COLORS.blue) {
  const grey = Math.round(clamp(120 + light * 110, 35, 230));
  ctx.fillStyle = `rgb(${grey}, ${grey}, ${Math.max(40, grey - 8)})`;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = light < 0.35 ? COLORS.red : light > 0.72 ? COLORS.green : COLORS.blue;
  ctx.beginPath(); ctx.arc(x + w * 0.34, y + h * 0.43, Math.min(w, h) * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = light < 0.35 ? '#4b3b44' : '#edf2e5';
  ctx.beginPath(); ctx.moveTo(x + w * 0.1, y + h * 0.84); ctx.lineTo(x + w * 0.48, y + h * 0.53); ctx.lineTo(x + w * 0.9, y + h * 0.84); ctx.closePath(); ctx.fill();
}

function drawCoverPhoto(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, light: number, accent: string) {
  ctx.save();
  ctx.fillStyle = '#fff'; ctx.fillRect(x - 5, y - 5, w + 10, h + 10);
  ctx.strokeStyle = accent; ctx.lineWidth = 2.5; ctx.strokeRect(x - 5, y - 5, w + 10, h + 10);
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const sky = ctx.createLinearGradient(x, y, x, y + h);
  const glow = Math.round(44 + light * 155);
  sky.addColorStop(0, `rgb(${Math.min(255, glow + 38)}, ${Math.min(255, glow + 60)}, ${Math.min(255, glow + 72)})`);
  sky.addColorStop(.58, `rgb(${Math.min(255, glow + 18)}, ${Math.min(255, glow + 38)}, ${Math.min(255, glow + 45)})`);
  sky.addColorStop(.59, `rgb(${Math.min(255, glow - 7)}, ${Math.min(255, glow + 21)}, ${Math.min(255, glow + 21)})`);
  sky.addColorStop(1, `rgb(${Math.max(18, glow - 45)}, ${Math.max(28, glow - 20)}, ${Math.max(28, glow - 20)})`);
  ctx.fillStyle = sky; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = light < .45 ? '#e7bd63' : '#ffe39a';
  ctx.beginPath(); ctx.arc(x + w * .28, y + h * .28, Math.min(w, h) * .1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = light < .45 ? 'rgba(34, 49, 68, .88)' : 'rgba(54, 101, 96, .9)';
  ctx.beginPath(); ctx.moveTo(x - w * .05, y + h * .84); ctx.lineTo(x + w * .45, y + h * .47); ctx.lineTo(x + w * .72, y + h * .76); ctx.lineTo(x + w * 1.05, y + h * .38); ctx.lineTo(x + w * 1.05, y + h); ctx.lineTo(x - w * .05, y + h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = light < .45 ? 'rgba(23, 35, 51, .86)' : 'rgba(34, 81, 78, .9)';
  ctx.beginPath(); ctx.moveTo(x - w * .05, y + h); ctx.lineTo(x + w * .22, y + h * .67); ctx.lineTo(x + w * .5, y + h); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawHeroPrompt(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, alpha: number) {
  rounded(ctx, x, y, w, h, `rgba(255, 246, 247, ${.82 + alpha * .18})`, COLORS.red, 7);
  ctx.fillStyle = COLORS.red;
  for (let i = 0; i < 3; i++) ctx.fillRect(x + w * (.18 + i * .18), y + h * .43, w * .09, 3);
  ctx.fillRect(x + w * (.76 + alpha * .08), y + h * .3, 2, h * .42);
}

function drawHeroScan(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + r * .72, y + r * .72); ctx.lineTo(x + r * 1.35, y + r * 1.35); ctx.stroke();
}

function drawHeroOld(ctx: CanvasRenderingContext2D, w: number, h: number, pulse: number) {
  drawCoverPhoto(ctx, w * .31, h * .14, w * .4, h * .55, .22, COLORS.red);
  drawHeroPrompt(ctx, w * .13, h * .08, w * .22, h * .2, pulse);
  ctx.strokeStyle = COLORS.red; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
  ctx.beginPath(); ctx.moveTo(w * .34, h * .27); ctx.lineTo(w * .42, h * .34); ctx.stroke(); ctx.setLineDash([]);
}

function drawHeroNew(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  const cycle = (time % 5000) / 5000;
  const scanProgress = cycle < .58 ? cycle / .58 : 1;
  const light = .28 + Math.max(0, (cycle - .48) / .52) * .5;
  drawCoverPhoto(ctx, w * .31, h * .14, w * .4, h * .55, light, COLORS.green);
  if (cycle < .68) {
    const scanX = w * (.39 + scanProgress * .24);
    const scanY = h * (.33 + Math.sin(scanProgress * Math.PI) * .12);
    drawHeroScan(ctx, scanX, scanY, 17);
    rounded(ctx, w * .08, h * .07, w * .25, h * .17, '#f3faf6', COLORS.green, 7);
    ctx.fillStyle = COLORS.green; ctx.beginPath(); ctx.arc(w * .125, h * .155, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(w * .16, h * .12, w * .12, 3); ctx.fillRect(w * .16, h * .18, w * .08, 3);
    ctx.strokeStyle = COLORS.green; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(w * .33, h * .22); ctx.lineTo(w * .42, h * .31); ctx.stroke(); ctx.setLineDash([]);
  } else {
    rounded(ctx, w * .1, h * .07, w * .22, h * .17, '#f3faf6', COLORS.green, 7);
    ctx.strokeStyle = COLORS.green; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w * .135, h * .155); ctx.lineTo(w * .155, h * .18); ctx.lineTo(w * .19, h * .125); ctx.stroke();
    ctx.fillStyle = COLORS.green; ctx.fillRect(w * .215, h * .12, w * .07, 3); ctx.fillRect(w * .215, h * .18, w * .05, 3);
    ctx.strokeStyle = COLORS.green; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(w * .32, h * .15); ctx.lineTo(w * .4, h * .28); ctx.stroke();
  }
}

function drawProblemPhoto(ctx: CanvasRenderingContext2D, w: number, h: number, pulse: number) {
  const x = w * .12, y = h * .12, pw = w * .43, ph = h * .66;
  drawCoverPhoto(ctx, x, y, pw, ph, .28, COLORS.blue);
  ctx.fillStyle = 'rgba(25, 39, 57, .16)'; ctx.fillRect(x, y, pw, ph);
  ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x + pw * .7, y + ph * .69, 13 + pulse * 4, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + pw * .7, y + ph * .69); ctx.lineTo(w * .67, h * .28); ctx.stroke();
  rounded(ctx, w * .67, h * .16, w * .2, h * .17, '#eef3fb', COLORS.blue, 7);
  ctx.fillStyle = COLORS.blue; ctx.fillRect(w * .71, h * .22, w * .11, 4); ctx.fillRect(w * .71, h * .29, w * .07, 4);
  ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x + pw * .2, y + ph * .78); ctx.lineTo(w * .67, h * .59); ctx.stroke();
  rounded(ctx, w * .67, h * .51, w * .2, h * .17, '#fffaf4', COLORS.orange, 7);
  ctx.fillStyle = COLORS.orange; ctx.fillRect(w * .71, h * .57, w * .11, 4); ctx.fillRect(w * .71, h * .64, w * .07, 4);
}
function drawAxes(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.strokeStyle = COLORS.axis; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.stroke();
}
function bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, value: number, color: string) {
  ctx.fillStyle = COLORS.axis; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color; ctx.fillRect(x, y, w * clamp(value, 0, 1), h);
}
function chapNumber(chapterId: string) { return Number(chapterId.replace('chap-', '')) || 1; }

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, size = 18, color = COLORS.ink, align: CanvasTextAlign = 'left') {
  ctx.fillStyle = color; ctx.font = `${size}px ui-sans-serif, system-ui, sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(value, x, y);
}
function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, stroke = COLORS.axis, r = 12) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke();
}
function drawDial(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, value: number, color: string, caption: string) {
  ctx.strokeStyle = COLORS.axis; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(cx, cy, radius, Math.PI * .75, Math.PI * 2.25); ctx.stroke();
  ctx.strokeStyle = color; ctx.beginPath(); ctx.arc(cx, cy, radius, Math.PI * .75, Math.PI * (.75 + 1.5 * clamp(value, 0, 1))); ctx.stroke();
  text(ctx, caption, cx, cy + 5, 16, COLORS.ink, 'center');
}

function drawAnalogyScene(ctx: CanvasRenderingContext2D, w: number, h: number, chapter: number, pulse: number, time = 0) {
  const y = h * .2;
  if (chapter === 1) {
    drawPhotoSheet(ctx, w * .42, y, w * .24, h * .52, .22 + pulse * .12, COLORS.red);
    ctx.fillStyle = COLORS.orange; ctx.fillRect(w * .25, y + h * .06, w * .04, h * .38);
    text(ctx, '问题未说清', w * .5, h * .84, 15, COLORS.red, 'center');
  } else if (chapter === 2) {
    const px = w * .16, py = h * .25, pw = w * .3, ph = h * .43;
    drawCoverPhoto(ctx, px, py, pw, ph, .32, COLORS.blue);
    ctx.fillStyle = 'rgba(255, 235, 166, .3)';
    ctx.beginPath(); ctx.moveTo(w * .48, h * .07); ctx.lineTo(px + pw * .35, py); ctx.lineTo(px + pw * .82, py); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe39a'; ctx.beginPath(); ctx.arc(w * .48, h * .07, 7, 0, Math.PI * 2); ctx.fill();
    const r = 15 + pulse * 5; ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px + pw * .68, py + ph * .68, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px + pw * .68 + r * .7, py + ph * .68 + r * .7); ctx.lineTo(px + pw * .68 + r * 1.25, py + ph * .68 + r * 1.25); ctx.stroke();
    rounded(ctx, w * .6, h * .24, w * .2, h * .16, '#eef3fb', COLORS.blue, 7);
    ctx.fillStyle = COLORS.blue; ctx.fillRect(w * .635, h * .29, w * .12, 3); ctx.fillRect(w * .635, h * .35, w * .075, 3);
    ctx.strokeStyle = COLORS.green; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w * .54, h * .51); ctx.lineTo(w * .6, h * .51); ctx.stroke();
    ctx.fillStyle = COLORS.green; ctx.beginPath(); ctx.moveTo(w * .6, h * .51); ctx.lineTo(w * .58, h * .48); ctx.lineTo(w * .58, h * .54); ctx.closePath(); ctx.fill();
    text(ctx, '先诊断，再编辑', w * .5, h * .84, 15, COLORS.blue, 'center');
  } else if (chapter === 3) {
    const px = w * .24, py = y, pw = w * .38, ph = h * .5;
    drawCoverPhoto(ctx, px, py, pw, ph, .46, COLORS.blue);
    ctx.fillStyle = 'rgba(24, 39, 59, .12)'; ctx.fillRect(px, py, pw, ph);
    const targets = [[.25, .72], [.49, .24], [.73, .61]];
    const labels = ['暗部细节', '色彩偏差', '对比不足'];
    const index = Math.min(2, Math.floor((time % 3600) / 1200));
    targets.forEach(([tx, ty], i) => {
      const active = i === index;
      ctx.save(); ctx.globalAlpha = active ? .9 : .28; ctx.strokeStyle = active ? COLORS.orange : COLORS.blue; ctx.lineWidth = active ? 3 : 1.5;
      ctx.beginPath(); ctx.arc(px + pw * tx, py + ph * ty, active ? 13 + pulse * 3 : 7, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    });
    const [tx, ty] = targets[index]; const r = 15 + pulse * 4;
    ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px + pw * tx, py + ph * ty, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px + pw * tx + r * .68, py + ph * ty + r * .68); ctx.lineTo(px + pw * tx + r * 1.18, py + ph * ty + r * 1.18); ctx.stroke();
    rounded(ctx, w * .68, h * .31, w * .16, h * .17, '#fff8f3', COLORS.orange, 7);
    text(ctx, 'Critic 扫描中', w * .76, h * .385, 10, COLORS.orange, 'center');
    text(ctx, labels[index], w * .5, h * .84, 15, COLORS.orange, 'center');
  } else if (chapter === 4) {
    const py = y, pw = w * .27, ph = h * .5;
    drawCoverPhoto(ctx, w * .13, py, pw, ph, .28, COLORS.blue);
    ctx.fillStyle = 'rgba(23, 35, 51, .2)'; ctx.fillRect(w * .13, py, pw, ph);
    const phase = (time % 3200) / 3200;
    const enhance = Math.min(1, phase / .72);
    rounded(ctx, w * .43, h * .31, w * .14, h * .17, '#eef3fb', COLORS.blue, 7);
    text(ctx, '诊断 Hc', w * .5, h * .38, 11, COLORS.blue, 'center');
    text(ctx, '提亮 · 自然', w * .5, h * .445, 8, COLORS.muted, 'center');
    ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w * .40, h * .405); ctx.lineTo(w * .43, h * .405); ctx.stroke();
    ctx.strokeStyle = COLORS.green; ctx.beginPath(); ctx.moveTo(w * .57, h * .405); ctx.lineTo(w * .60, h * .405); ctx.stroke();
    drawCoverPhoto(ctx, w * .60, py, pw, ph, .35 + enhance * .35, COLORS.green);
    ctx.save(); ctx.globalAlpha = .23 * enhance; ctx.fillStyle = '#f6e7a3'; ctx.fillRect(w * .60, py, pw, ph * .45); ctx.restore();
    text(ctx, enhance < .9 ? 'Artist 正在按诊断增强…' : '自然增强完成', w * .5, h * .84, 15, COLORS.green, 'center');
  } else if (chapter === 5) {
    const boxY = h * .34, boxW = w * .19, boxH = h * .24;
    const steps = [{ x: w * .13, label: 'I  基础', color: COLORS.blue, fill: '#eef3fb' }, { x: w * .405, label: 'II  对齐', color: COLORS.purple, fill: '#f4f1fc' }, { x: w * .68, label: 'III  协同', color: COLORS.green, fill: '#f3faf6' }];
    const stage = Math.min(2, Math.floor((time % 3600) / 1200));
    steps.forEach((step, index) => { ctx.save(); ctx.globalAlpha = index <= stage ? 1 : .26; const lift = index === stage ? pulse * 3 : 0; rounded(ctx, step.x, boxY - lift, boxW, boxH, step.fill, step.color, 7); text(ctx, step.label, step.x + boxW / 2, boxY + boxH / 2 - lift, 14, step.color, 'center'); ctx.restore(); });
    [w * .345, w * .62].forEach((x, index) => { ctx.save(); ctx.globalAlpha = index < stage ? 1 : .25; ctx.strokeStyle = index < stage ? COLORS.green : COLORS.muted; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, boxY + boxH / 2); ctx.lineTo(x + w * .045, boxY + boxH / 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + w * .045, boxY + boxH / 2); ctx.lineTo(x + w * .032, boxY + boxH / 2 - 5); ctx.moveTo(x + w * .045, boxY + boxH / 2); ctx.lineTo(x + w * .032, boxY + boxH / 2 + 5); ctx.stroke(); ctx.restore(); });
    text(ctx, ['各练基本功', '读懂诊断信号', '共同闭环优化'][stage], w * .5, h * .84, 15, stage === 2 ? COLORS.green : stage === 1 ? COLORS.purple : COLORS.blue, 'center');
  } else if (chapter === 6) {
    ctx.fillStyle = '#fbfcfa'; ctx.fillRect(0, 0, w, h);
    const left = w * .2, middle = w * .5, right = w * .8, axisY = h * .58, trackX = w * .12, trackW = w * .76;
    rounded(ctx, w * .055, h * .1, w * .89, h * .8, '#ffffff', '#e1e8e4', 10);
    text(ctx, '只靠模仿（SFT）会有偏差：可能改得不够，也可能修过头', w * .5, h * .24, 11, COLORS.muted, 'center');
    rounded(ctx, trackX, axisY - 7, trackW, 14, '#eef2f5', '#d9e2e9', 7);
    ctx.fillStyle = '#dff1e6'; ctx.fillRect(middle - w * .095, axisY - 6, w * .19, 12);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; [middle - w * .095, middle + w * .095].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, axisY - 7); ctx.lineTo(x, axisY + 7); ctx.stroke(); });
    [[left, COLORS.blue], [right, COLORS.red]].forEach(([x, color]) => { ctx.fillStyle = color as string; ctx.beginPath(); ctx.arc(x as number, axisY, 8, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(middle, axisY, 15 + pulse, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = COLORS.green; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = COLORS.green; ctx.beginPath(); ctx.arc(middle, axisY, 6, 0, Math.PI * 2); ctx.fill();
    text(ctx, '原图', left, axisY - 19, 12, COLORS.blue, 'center');
    text(ctx, '目标：刚好', middle, axisY - 21, 13, COLORS.green, 'center');
    text(ctx, '过度修图', right, axisY - 19, 12, COLORS.red, 'center');
    text(ctx, '改得不够', left, axisY + 25, 11, COLORS.muted, 'center');
    text(ctx, '可量化标准', middle, axisY + 25, 11, COLORS.green, 'center');
    text(ctx, '失去真实感', right, axisY + 25, 11, COLORS.muted, 'center');
  } else if (chapter === 7) {
    ctx.fillStyle = '#fbfcfa'; ctx.fillRect(0, 0, w, h);
    rounded(ctx, w * .035, h * .06, w * .93, h * .88, '#ffffff', '#e1e8e4', 10);
    const photoY = h * .18, photoW = w * .18, photoH = h * .36;
    const criticX = w * .31, artistX = w * .53, cardW = w * .16, cardH = h * .20;
    const arrow = (x1: number, y1: number, x2: number, y2: number, color: string, width = 2, dashed = false) => {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dashed ? [5, 4] : []);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      const angle = Math.atan2(y2 - y1, x2 - x1); const head = 6 + width;
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - head * Math.cos(angle - .48), y2 - head * Math.sin(angle - .48)); ctx.moveTo(x2, y2); ctx.lineTo(x2 - head * Math.cos(angle + .48), y2 - head * Math.sin(angle + .48)); ctx.stroke(); ctx.restore();
    };
    const curveArrow = (x1: number, y1: number, cx: number, cy: number, x2: number, y2: number, color: string, width = 2, dashed = false) => {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dashed ? [5, 4] : []);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, cy, x2, y2); ctx.stroke();
      const angle = Math.atan2(y2 - cy, x2 - cx); const head = 6 + width;
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - head * Math.cos(angle - .48), y2 - head * Math.sin(angle - .48)); ctx.moveTo(x2, y2); ctx.lineTo(x2 - head * Math.cos(angle + .48), y2 - head * Math.sin(angle + .48)); ctx.stroke(); ctx.restore();
    };
    drawCoverPhoto(ctx, w * .07, photoY, photoW, photoH, .33, COLORS.blue);
    drawCoverPhoto(ctx, w * .75, photoY, photoW, photoH, .68, COLORS.green);
    rounded(ctx, criticX, h * .29, cardW, cardH, '#eef3fb', COLORS.blue, 10);
    text(ctx, 'Critic', criticX + cardW / 2, h * .405, 16, COLORS.blue, 'center');
    rounded(ctx, artistX, h * .29, cardW, cardH, '#f3faf6', COLORS.green, 10);
    text(ctx, 'Artist', artistX + cardW / 2, h * .405, 16, COLORS.green, 'center');
    arrow(w * .25, h * .39, criticX, h * .39, COLORS.blue, 2.5);
    arrow(criticX + cardW, h * .39, artistX, h * .39, COLORS.blue, 2.5);
    arrow(artistX + cardW, h * .39, w * .75, h * .39, COLORS.green, 2.5);
    text(ctx, '原图 X', w * .16, photoY - 17, 12, COLORS.blue, 'center'); text(ctx, '增强图 Xe', w * .84, photoY - 17, 12, COLORS.green, 'center');
    rounded(ctx, w * .76, h * .64, w * .16, h * .12, '#fff9f5', COLORS.orange, 8);
    text(ctx, '① 评分', w * .84, h * .688, 12, COLORS.orange, 'center');
    text(ctx, '看 Xe 的结果', w * .84, h * .735, 9, COLORS.muted, 'center');
    rounded(ctx, w * .29, h * .78, w * .42, h * .16, '#fff9f5', COLORS.orange, 10);
    ctx.fillStyle = '#fff0e8'; ctx.beginPath(); ctx.roundRect(w * .30, h * .795, w * .40, h * .055, 5); ctx.fill();
    text(ctx, '② 奖励反馈', w * .5, h * .837, 13, COLORS.orange, 'center');
    ctx.strokeStyle = '#f2c8b5'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(w * .5, h * .865); ctx.lineTo(w * .5, h * .915); ctx.stroke();
    text(ctx, 'Artist · rPA', w * .40, h * .915, 10, COLORS.green, 'center'); text(ctx, 'Critic · 三类奖励', w * .60, h * .915, 10, COLORS.blue, 'center');
    ctx.save(); ctx.globalAlpha = .45 + (1 - pulse) * .5;
    arrow(w * .84, h * .56, w * .84, h * .64, COLORS.orange, 2.1, true);
    curveArrow(w * .76, h * .70, w * .74, h * .78, w * .71, h * .83, COLORS.orange, 2.2, true);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = .45 + pulse * .55;
    curveArrow(w * .42, h * .78, w * .39, h * .61, criticX + cardW * .5, h * .49, COLORS.blue, 2.8);
    curveArrow(w * .58, h * .78, w * .62, h * .61, artistX + cardW * .5, h * .49, COLORS.green, 2.8);
    ctx.restore();
  } else if (chapter === 8) {
    ctx.fillStyle = '#fbfcfa'; ctx.fillRect(0, 0, w, h);
    rounded(ctx, w * .05, h * .10, w * .90, h * .80, '#ffffff', '#e1e8e4', 10);
    const photoY = h * .26, photoW = w * .23, photoH = h * .46;
    drawCoverPhoto(ctx, w * .10, photoY, photoW, photoH, .36, COLORS.blue);
    drawCoverPhoto(ctx, w * .67, photoY, photoW, photoH, .68, COLORS.green);
    text(ctx, '待比较的方法', w * .215, h * .19, 11, COLORS.blue, 'center');
    text(ctx, 'SmartPhotoCrafter', w * .785, h * .19, 11, COLORS.green, 'center');
    rounded(ctx, w * .405, h * .31, w * .19, h * .27, '#f8fafc', COLORS.axis, 7);
    text(ctx, '同一任务', w * .5, h * .38, 11, COLORS.ink, 'center');
    text(ctx, '同一协议', w * .5, h * .46, 11, COLORS.ink, 'center');
    text(ctx, '指标方向一致', w * .5, h * .54, 9, COLORS.muted, 'center');
    text(ctx, '→', w * .367, h * .52, 18, COLORS.blue, 'center');
    text(ctx, '→', w * .633, h * .52, 18, COLORS.green, 'center');
    text(ctx, '在同一把尺下看证据', w * .5, h * .82, 13, COLORS.green, 'center');
  } else if (chapter === 9) {
    ctx.fillStyle = '#fbfcfa'; ctx.fillRect(0, 0, w, h);
    rounded(ctx, w * .045, h * .10, w * .91, h * .80, '#ffffff', '#e1e8e4', 10);
    const photoY = h * .28, photoW = w * .17, photoH = h * .40;
    drawCoverPhoto(ctx, w * .07, photoY, photoW, photoH, .33, COLORS.blue);
    drawCoverPhoto(ctx, w * .76, photoY, photoW, photoH, .68, COLORS.green);
    rounded(ctx, w * .31, h * .31, w * .16, h * .22, '#eef3fb', COLORS.blue, 7);
    rounded(ctx, w * .53, h * .31, w * .16, h * .22, '#f3faf6', COLORS.green, 7);
    text(ctx, 'Critic', w * .39, h * .44, 13, COLORS.blue, 'center');
    text(ctx, 'Artist', w * .61, h * .44, 13, COLORS.green, 'center');
    text(ctx, '“差点意思”', w * .155, h * .20, 11, COLORS.blue, 'center');
    text(ctx, '“修得好”', w * .845, h * .20, 11, COLORS.green, 'center');
    text(ctx, '→', w * .275, h * .47, 17, COLORS.blue, 'center');
    text(ctx, '→', w * .50, h * .47, 17, COLORS.blue, 'center');
    text(ctx, '→', w * .725, h * .47, 17, COLORS.green, 'center');
    text(ctx, '先判断，再编辑', w * .5, h * .80, 14, COLORS.green, 'center');
  } else {
    drawPhotoSheet(ctx, w * .14, y, w * .24, h * .5, .43, COLORS.blue); drawPhotoSheet(ctx, w * .62, y, w * .24, h * .5, .68, COLORS.green);
    ctx.strokeStyle = COLORS.green; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(w * .43, h * .45); ctx.lineTo(w * .57, h * .45); ctx.stroke();
    text(ctx, '从原片到成片', w * .5, h * .84, 15, COLORS.green, 'center');
  }
}

export const SmartPhotoLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [range, setRange] = useState(moduleId === '1.1' ? -1 : 50);
  const [option, setOption] = useState('shadow');
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [metric, setMetric] = useState('lpips');
  const small = moduleId === 'ana' || chapterId === 'hero';
  const w = chapterId === 'hero' ? 440 : small ? 560 : 1080;
  const h = chapterId === 'hero' ? 260 : small ? (chapterId === 'chap-7' ? 235 : chapterId === 'chap-9' ? 165 : 140) : 280;
  const key = chapterId === 'hero' ? moduleId : moduleId;
  const chapter = chapNumber(chapterId);

  useEffect(() => {
    setRange(moduleId === '1.1' ? -1 : 50); setOption('shadow'); setStep(0); setRunning(false); setMetric('lpips');
  }, [moduleId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, w, h); } catch { return; }
    let frame: number | null = null;
    const paint = (time: number) => {
      clearScene(ctx, w, h);
      if (chapterId === 'hero') drawHeroDesk(ctx, w, h);
      else drawDarkroomDesk(ctx, w, h);
      const pulse = (Math.sin(time / 750) + 1) / 2;
      if (chapterId === 'hero') {
        if (key === 'old') drawHeroOld(ctx, w, h, pulse);
        else drawHeroNew(ctx, w, h, time);
      } else if (moduleId === 'ana') {
        if (chapter === 1) drawProblemPhoto(ctx, w, h, pulse);
        else drawAnalogyScene(ctx, w, h, chapter, pulse, time);
      } else {
        drawModule(ctx, w, h, moduleId, range, option, step, running, metric);
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = (time: number) => { paint(time); frame = requestAnimationFrame(tick); };
    if (small) {
      const start = () => { if (!frame) frame = requestAnimationFrame(tick); };
      const stop = () => { if (frame) cancelAnimationFrame(frame); frame = null; };
      const disconnect = observeCanvas(canvas, start, stop);
      return () => { stop(); disconnect(); };
    }
    paint(0);
    return () => { if (frame) cancelAnimationFrame(frame); };
  }, [chapterId, h, key, metric, moduleId, option, range, running, small, step, w]);

  if (small) return <div className={chapterId === 'chap-1' && moduleId === 'ana' ? 'photo-problem-visual' : undefined}><canvas ref={canvasRef} width={w} height={h} aria-label="暗房照片纸示意动画" />{chapterId === 'chap-1' && moduleId === 'ana' ? <div className="photo-problem-legend"><span>暗部细节不清…</span><span>整体对比不足…</span></div> : null}</div>;

  const feedback = getFeedback(moduleId, range, option, step, running, metric);
  const controls = getControls(moduleId, range, option, step, running, metric, setRange, setOption, setStep, setRunning, setMetric);
  return <div>
    <canvas ref={canvasRef} width={w} height={h} aria-label="可交互的论文机制示意图" />
    <div className="smart-lab-controls">{controls}</div>
    <div className={`feedback ${feedback.cls}`} aria-live="polite">{feedback.text}</div>
    <div className="smart-lab-evidence">{feedback.evidence}</div>
  </div>;
};

function drawModule(ctx: CanvasRenderingContext2D, w: number, h: number, id: string, range: number, option: string, step: number, running: boolean, metric: string) {
  const px = w * .12, py = h * .18, pw = w * .28, ph = h * .46;
  if (id === '1.1') {
    const light = (range + 2) / 4;
    drawPhotoSheet(ctx, px, py, pw, ph, light, light < .3 ? COLORS.red : light > .45 ? COLORS.green : COLORS.blue);
    drawAxes(ctx, w * .54, h * .22, w * .32, h * .42);
    ctx.strokeStyle = light < .3 ? COLORS.red : COLORS.green; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(w * .56, h * .58); ctx.quadraticCurveTo(w * .69, h * .28, w * .84, h * .31 + (1 - light) * 45); ctx.stroke();
    return;
  }
  if (id === '2.1') {
    drawPhotoSheet(ctx, px, py, pw, ph, .55, COLORS.blue);
    const idx = ['shadow', 'temperature', 'contrast'].indexOf(option);
    ctx.fillStyle = [COLORS.blue, COLORS.orange, COLORS.purple][idx];
    ctx.fillRect(px + pw * (.16 + idx * .22), py + ph * .25, pw * .16, ph * .38);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = i === idx ? COLORS.blue : COLORS.axis; ctx.fillRect(w * .56, h * (.22 + i * .16), w * .25, h * .08); }
    return;
  }
  if (id === '3.1') {
    const p = running ? 1 : .2;
    drawPhotoSheet(ctx, w * .12, py, w * .25, ph, .26 + p * .27, COLORS.red);
    drawPhotoSheet(ctx, w * .58, py, w * .25, ph, .3 + p * .45, COLORS.green);
    ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(w * .47, h * .34); ctx.lineTo(w * .55, h * .34); ctx.stroke();
    return;
  }
  if (id === '4.1') {
    drawPhotoSheet(ctx, px, py, pw, ph, option === 'full' ? .68 : .44, option === 'full' ? COLORS.green : COLORS.blue);
    const count = option === 'semantic' ? 1 : option === 'photo' ? 2 : 3;
    for (let i = 0; i < 3; i++) bar(ctx, w * .56, h * (.23 + i * .14), w * .25, h * .07, i < count ? .82 : .16, i === 0 ? COLORS.blue : i === 1 ? COLORS.orange : COLORS.green);
    return;
  }
  if (id === '4.2') {
    const useful = 1 - Math.abs(range - 50) / 50;
    drawPhotoSheet(ctx, px, py, pw, ph, .2 + useful * .58, useful > .65 ? COLORS.green : COLORS.red);
    for (let i = 0; i < 3; i++) bar(ctx, w * .56, h * (.23 + i * .14), w * .25, h * .07, useful * (1 - i * .08), [COLORS.blue, COLORS.orange, COLORS.green][i]);
    return;
  }
  if (id === '5.1') {
    const idx = ['exposure', 'contrast', 'saturation', 'temperature'].indexOf(option);
    drawAxes(ctx, w * .15, h * .2, w * .65, h * .48);
    const x = w * (.29 + idx * .12); const y = h * (.57 - idx * .055);
    [COLORS.red, COLORS.orange, COLORS.green].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + i * 82, y - i * 28, 12, 0, Math.PI * 2); ctx.fill(); });
    return;
  }
  if (id === '6.1') {
    const titles = ['SFT', 'Reasoning-conditioned', 'GRPO + DiffusionNFT'];
    for (let i = 0; i < 3; i++) {
      const active = i <= step; const x = w * (.08 + i * .31);
      rounded(ctx, x, h * .22, w * .25, h * .48, active ? '#e8f3ec' : '#f2f4f7', active ? COLORS.blue : COLORS.axis);
      ctx.fillStyle = active ? (i === 2 ? COLORS.green : COLORS.blue) : COLORS.axis; ctx.beginPath(); ctx.arc(x + w * .125, h * .38, 25, 0, Math.PI * 2); ctx.fill();
      text(ctx, String(i + 1), x + w * .125, h * .38, 18, '#fff', 'center'); text(ctx, titles[i], x + w * .125, h * .58, 15, active ? COLORS.ink : COLORS.muted, 'center');
    }
    return;
  }
  if (id === '7.1') {
    const base = step === 0 ? .45 : step === 1 ? .58 : .8;
    drawDial(ctx, w * .26, h * .48, 58, .48, COLORS.blue, 'S(X)');
    drawDial(ctx, w * .73, h * .48, 58, base, step === 2 ? COLORS.green : COLORS.orange, 'S(Xe)');
    ctx.strokeStyle = step === 2 ? COLORS.green : COLORS.axis; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(w * .39, h * .48); ctx.lineTo(w * .61, h * .48); ctx.stroke();
    text(ctx, step === 2 ? '排序奖励：Xe > X' : '逐步回传分数', w * .5, h * .82, 18, step === 2 ? COLORS.green : COLORS.muted, 'center');
    return;
  }
  if (id === '8.1') {
    const nodes = ['x', 'critic', 'hc', 'artist', 'xe'];
    const active = nodes.indexOf(option);
    for (let i = 0; i < nodes.length; i++) { const x = w * (.12 + i * .19); ctx.fillStyle = i === active ? (nodes[i] === 'artist' ? COLORS.green : COLORS.blue) : COLORS.light; ctx.fillRect(x, h * .37, 95, 64); if (i < nodes.length - 1) { ctx.strokeStyle = i === active || i + 1 === active ? COLORS.blue : COLORS.axis; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 95, h * .49); ctx.lineTo(x + 112, h * .49); ctx.stroke(); } }
    return;
  }
  if (id === '9.1') {
    const data: Record<string, number[]> = { sft: [.68, .56, .31, .97, .95], noPhoto: [.69, .58, .39, .97, .94], fullRl: [.70, .57, .28, .98, .96] };
    const names = ['MUSIQ', 'NIMA', 'FID', 'DINO', 'CLIP'];
    data[option].forEach((v, i) => { const yy = h * (.17 + i * .105); text(ctx, names[i], w * .09, yy + 8, 14, COLORS.muted); bar(ctx, w * .22, yy, w * .52, h * .06, v, option === 'fullRl' ? COLORS.green : option === 'noPhoto' ? COLORS.red : COLORS.blue); text(ctx, v.toFixed(2), w * .78, yy + 8, 14, COLORS.ink); });
    return;
  }
  if (id === '10.1') {
    const values: Record<string, number[]> = { psnr: [21.05, 17.05, 15.93], lpips: [.09, .21, .20], fid: [22.93, 38.91, 46.70], dino: [.97, .94, .96] };
    const v = values[metric]; const low = metric === 'lpips' || metric === 'fid'; const max = Math.max(...v), min = Math.min(...v);
    const names = ['SmartPhotoCrafter', 'Step1X-Edit', 'FLUX2.Dev'];
    v.forEach((value, i) => { const normalized = low ? (max - value) / (max - min || 1) : (value - min) / (max - min || 1); const yy = h * (.19 + i * .16); text(ctx, names[i], w * .08, yy + 10, 14, i === 0 ? COLORS.green : COLORS.muted); bar(ctx, w * .31, yy, w * .45, h * .08, running ? .35 + normalized * .6 : 0, i === 0 ? COLORS.green : COLORS.blue); text(ctx, running ? String(value) : '—', w * .8, yy + 10, 15, COLORS.ink); });
    text(ctx, running ? `${labels[metric]}：${low ? '低' : '高'}更好` : '点击“开始比较”显示真实表格数值', w * .5, h * .86, 16, running ? COLORS.green : COLORS.muted, 'center');
  }
}

function getFeedback(id: string, range: number, option: string, step: number, running: boolean, metric: string) {
  if (id === '1.1') return range <= -2 ? { cls: 'bad', text: '欠曝加重，盲目处理会丢失暗部细节。', evidence: '依据：论文摘要与引言将“识别缺陷”置于自动增强的第一步。' } : range >= 0 ? { cls: 'good', text: '诊断目标是恢复可读细节，不是任意提亮。', evidence: '教学示意：亮度数值不是论文实测。' } : { cls: '', text: '当前画面偏暗：需要先定位问题。', evidence: '依据：论文摘要（自动发现质量缺陷）。' };
  if (id === '2.1') return { cls: option === 'temperature' ? 'good' : '', text: `当前检查：${labels[option]}。Critic 需给出推理、编辑建议和评分。`, evidence: '依据：论文 §3.1，fc(X) 输出 R、E、S。' };
  if (id === '3.1') return { cls: running ? 'good' : '', text: running ? '右侧以 Hc 条件化 Artist：保留的是推理表征，而不仅是一句短提示。' : '两侧从同一输入出发；按下按钮开始同步对照。', evidence: '依据：论文 Eq.1 与 §3.2.2；图形为机制示意。' };
  if (id === '4.1') return { cls: option === 'full' ? 'good' : option === 'semantic' ? 'bad' : '', text: option === 'full' ? '完整奖励同时要求做对、做得合适、且保留内容结构。' : option === 'photo' ? '光度项约束曝光、对比度、饱和度、色温等属性。' : '只有方向正确，幅度仍可能过头。', evidence: '依据：论文 Eq.7、§3.4。' };
  if (id === '4.2') return Math.abs(range - 50) < 23 ? { cls: 'good', text: '在建议方向内，属性接近参考且结构稳定。', evidence: '教学区间示意；论文并未报告该控件阈值。' } : { cls: 'bad', text: range < 50 ? '方向虽对但改动不足。' : '过度调整会让感知一致性受损。', evidence: '依据：论文强调光度与 LPIPS 一致性共同约束。' };
  if (id === '5.1') return { cls: 'good', text: `正在单独检查${labels[option]}：光度奖励关心是否向参考方向靠近。`, evidence: '依据：论文 Eq.10–12；展示的是相对属性距离。' };
  if (id === '6.1') { const copy = ['分别 SFT Critic 与 Artist，建立理解和编辑基本功。', '仅适配 Artist，让它学习使用 Hc 进行编辑。', 'GRPO 优化推理、DiffusionNFT 优化生成，并在同一训练循环联合更新。']; return { cls: step === 2 ? 'good' : '', text: copy[step], evidence: '依据：论文 §3.2 与 §4.2。' }; }
  if (id === '7.1') { const copy = ['先得到对输入图像的质量判断。', '再把 Artist 生成的结果回送给 Critic。', '若编辑有效，排序奖励鼓励 S(Xe) 高于 S(X)。']; return { cls: step === 2 ? 'good' : '', text: copy[step], evidence: '依据：论文 Eq.14。' }; }
  if (id === '8.1') return { cls: option === 'artist' || option === 'xe' ? 'good' : option === 'hc' ? '' : '', text: option === 'critic' ? 'Critic 诊断并产生 R、E、S，提供 Hc。' : option === 'hc' ? 'Hc 是拼接的末层隐表示，不是额外图像。' : option === 'artist' ? 'Artist 以 X 和 Hc 为条件生成 Xe。' : option === 'x' ? 'X 同时供 Critic 理解与 Artist 保留内容结构。' : 'Xe 是增强输出，目标是影调改善而不改写场景。', evidence: '依据：论文 §3.1、Eq.1。' };
  if (id === '9.1') return { cls: option === 'fullRl' ? 'good' : option === 'noPhoto' ? 'bad' : '', text: option === 'fullRl' ? '完整奖励将 FID 降到 27.96，并提高 NIMA、DINO、CLIP。' : option === 'noPhoto' ? '仅加 RL 时，MUSIQ 变好但 FID 从30.61变为38.51，出现分布漂移。' : 'SFT 是该消融表的基线。', evidence: '依据：论文 Table 4；FID 越低越好。' };
  const direction = metric === 'lpips' || metric === 'fid' ? '越低越好' : '越高越好'; return { cls: running ? 'good' : '', text: running ? `已按 ${labels[metric]}（${direction}）显示 Table 2 的同协议对比。` : '先选择同一指标，再开始；不要跨指标直接比条形长度。', evidence: '依据：论文 Table 2，随机组合复原与修图指令协议。' };
}

function chip(label: string, active: boolean, onClick: () => void) { return <button key={label} type="button" aria-pressed={active} onClick={onClick}>{label}</button>; }
function getControls(id: string, range: number, option: string, step: number, running: boolean, metric: string, setRange: (n: number) => void, setOption: (v: string) => void, setStep: (n: number) => void, setRunning: (v: boolean) => void, setMetric: (v: string) => void) {
  if (id === '1.1') return <><label>曝光偏差 <span className="smart-lab-value">{range}</span></label><input className="smart-lab-range" type="range" min={-2} max={2} step={1} value={range} onInput={e => setRange(Number((e.target as HTMLInputElement).value))} onChange={e => setRange(Number(e.target.value))} /></>;
  if (id === '2.1') return <>{['shadow', 'temperature', 'contrast'].map(v => chip(labels[v], option === v, () => setOption(v)))}</>;
  if (id === '3.1') return <><button type="button" onClick={() => setRunning(!running)}>{running ? '重置对照' : '开始对照'}</button></>;
  if (id === '4.1') return <>{['semantic', 'photo', 'full'].map(v => chip(labels[v], option === v, () => setOption(v)))}</>;
  if (id === '4.2') return <><label>调整幅度 <span className="smart-lab-value">{range}</span></label><input className="smart-lab-range" type="range" min={0} max={100} value={range} onInput={e => setRange(Number((e.target as HTMLInputElement).value))} onChange={e => setRange(Number(e.target.value))} /></>;
  if (id === '5.1') return <>{['exposure', 'contrast', 'saturation', 'temperature'].map(v => chip(labels[v], option === v, () => setOption(v)))}</>;
  if (id === '6.1' || id === '7.1') return <><button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>上一步</button><span className="smart-lab-value">步骤 {step + 1}/3</span><button type="button" onClick={() => setStep(Math.min(2, step + 1))} disabled={step === 2}>下一步</button><button type="button" onClick={() => setStep(0)}>重置</button></>;
  if (id === '8.1') return <>{['x', 'critic', 'hc', 'artist', 'xe'].map(v => chip(labels[v], option === v, () => setOption(v)))}</>;
  if (id === '9.1') return <>{['sft', 'noPhoto', 'fullRl'].map(v => chip(labels[v], option === v, () => setOption(v)))}</>;
  return <>{['psnr', 'lpips', 'fid', 'dino'].map(v => chip(labels[v], metric === v, () => { setMetric(v); setRunning(false); }))}<button type="button" onClick={() => setRunning(true)}>开始比较</button></>;
}
