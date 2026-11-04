import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

type Props = { chapterId: string; moduleId: string };
type G = CanvasRenderingContext2D;
const W = 560, H = 140;
const P = {
  desk: '#f5f8f0', deskShade: '#e8eee4', paper: '#fffdfa', paperEdge: '#d7deea',
  ink: '#21324a', quiet: '#91a18d', blue: '#27446e', blueLight: '#dce8f3',
  green: '#228d5c', greenLight: '#e3f1e6', red: '#c43f52', redLight: '#fae4e7',
  orange: '#f07e47', orangeLight: '#ffeddc', brown: '#92400e', wood: '#e8bd8b',
};

const ease = (v: number) => { const x = Math.max(0, Math.min(1, v)); return x * x * (3 - 2 * x); };
function motion(seconds: number) {
  const p = (seconds % 4.8) / 4.8;
  if (p < 0.13) return 0;
  if (p < 0.46) return ease((p - 0.13) / 0.33);
  if (p < 0.72) return 1;
  return 1 - ease((p - 0.72) / 0.28);
}
function rr(g: G, x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string, lw = 1) {
  g.beginPath(); g.roundRect(x, y, w, h, r); g.fillStyle = fill; g.fill();
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}
function ln(g: G, x1: number, y1: number, x2: number, y2: number, color: string, width = 2) {
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokeStyle = color;
  g.lineWidth = width; g.lineCap = 'round'; g.stroke();
}
function circle(g: G, x: number, y: number, r: number, fill: string, stroke?: string, lw = 1) {
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = fill; g.fill();
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}
function desk(g: G) {
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#f8faf4'); grad.addColorStop(1, P.desk);
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  for (const [x, y, len] of [[38, 19, 104], [426, 22, 90], [24, 123, 158], [402, 125, 128]]) {
    ln(g, x, y, x + len, y, 'rgba(118,144,106,.13)', 1);
  }
  g.fillStyle = 'rgba(48,74,48,.07)'; g.beginPath(); g.ellipse(282, 126, 188, 7, 0, 0, Math.PI * 2); g.fill();
}
function sheet(g: G, x: number, y: number, w: number, h: number, spiral = false) {
  g.save(); g.shadowColor = 'rgba(33,50,74,.17)'; g.shadowBlur = 12; g.shadowOffsetY = 5;
  rr(g, x, y, w, h, 6, P.paper, P.paperEdge, 1.1); g.restore();
  // A folded corner, faint rule and perforation make the sheet legible without visual noise.
  g.beginPath(); g.moveTo(x + w - 18, y + 1); g.lineTo(x + w - 1, y + 18); g.lineTo(x + w - 18, y + 18);
  g.closePath(); g.fillStyle = '#eef2ed'; g.fill();
  ln(g, x + 17, y + 24, x + w - 27, y + 24, '#e5e9e4', 1);
  if (spiral) for (let j = 0; j < 5; j++) {
    circle(g, x + 10, y + 37 + j * 14, 3.1, '#eef2ed', '#9cab9b', 1);
  }
}
function ink(g: G, x: number, y: number, w: number, rows: number, c = '#bcc9c0') {
  for (let i = 0; i < rows; i++) ln(g, x, y + i * 14, x + w - (i % 3) * 14, y + i * 14, c, 2.2);
}
function photo(g: G, x: number, y: number, w: number, h: number) {
  rr(g, x, y, w, h, 4, '#dfece8', '#b7cdc3', 1);
  circle(g, x + w * .27, y + h * .3, 7, '#f8c77f');
  g.beginPath(); g.moveTo(x + 5, y + h - 6); g.lineTo(x + w * .42, y + h * .48);
  g.lineTo(x + w * .72, y + h - 8); g.lineTo(x + w - 5, y + h * .38);
  g.lineTo(x + w - 5, y + h - 5); g.closePath(); g.fillStyle = '#85ac9e'; g.fill();
  ln(g, x + 5, y + h - 6, x + w * .42, y + h * .48, P.blue, 1.7);
}
function magnifier(g: G, x: number, y: number, tilt = 0) {
  g.save(); g.translate(x, y); g.rotate(tilt);
  g.shadowColor = 'rgba(39,68,110,.18)'; g.shadowBlur = 8; g.shadowOffsetY = 3;
  circle(g, 0, 0, 18, 'rgba(223,242,246,.66)', P.blue, 4); g.shadowColor = 'transparent'; g.shadowBlur = 0;
  g.beginPath(); g.arc(-4, -5, 9, Math.PI * 1.06, Math.PI * 1.48); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2.2; g.stroke();
  ln(g, 13, 13, 31, 31, P.brown, 7); circle(g, 31, 31, 3.7, P.brown); g.restore();
}
function pencil(g: G, x: number, y: number, angle: number) {
  g.save(); g.translate(x, y); g.rotate(angle);
  g.shadowColor = 'rgba(48,45,36,.18)'; g.shadowBlur = 5; g.shadowOffsetY = 3;
  rr(g, 0, -5, 76, 10, 3, '#e8ac67', P.brown, 1);
  rr(g, 65, -5, 11, 10, 2, '#d2d9e6', '#8d9bb1', 1);
  g.beginPath(); g.moveTo(0, -5); g.lineTo(-12, 0); g.lineTo(0, 5); g.closePath(); g.fillStyle = '#e6c9a3'; g.fill();
  g.beginPath(); g.moveTo(-12, 0); g.lineTo(-7, -2); g.lineTo(-7, 2); g.closePath(); g.fillStyle = P.ink; g.fill();
  g.restore();
}
function ribbon(g: G, x: number, y: number, color: string) {
  g.save(); g.shadowColor = 'rgba(39,68,110,.18)'; g.shadowBlur = 5; g.shadowOffsetY = 3;
  g.beginPath(); g.moveTo(x, y); g.lineTo(x + 25, y); g.lineTo(x + 25, y + 64);
  g.lineTo(x + 12.5, y + 55); g.lineTo(x, y + 64); g.closePath(); g.fillStyle = color; g.fill(); g.restore();
  ln(g, x + 5, y + 9, x + 19, y + 9, 'rgba(255,255,255,.55)', 1.3);
}
function rule(g: G, x: number, y: number) {
  g.save(); g.translate(x, y); g.rotate(-.018);
  g.shadowColor = 'rgba(79,50,17,.13)'; g.shadowBlur = 5; g.shadowOffsetY = 3;
  rr(g, 0, 0, 177, 20, 3, 'rgba(232,189,139,.83)', P.brown, 1); g.restore();
  for (let i = 0; i < 14; i++) ln(g, x + 9 + i * 12, y + 2, x + 9 + i * 12, y + (i % 5 === 0 ? 10 : 6), P.brown, .8);
}
function answerMark(g: G, x: number, y: number, alpha = 1) {
  g.save(); g.globalAlpha = alpha; circle(g, x, y, 17, 'rgba(34,141,92,.08)', P.green, 2);
  ln(g, x - 8, y, x - 1, y + 7, P.green, 3); ln(g, x - 1, y + 7, x + 10, y - 8, P.green, 3); g.restore();
}
function scene(g: G, n: number, q: number, side: string) {
  desk(g);
  if (n === 0) {
    sheet(g, 144, 17, 282, 109); photo(g, 171, 51, 83, 57); ink(g, 274, 57, 111, 3);
    if (side === 'old') { magnifier(g, 89 + q * 28, 70); circle(g, 374, 92, 11, P.redLight, P.red, 2); }
    else { rr(g, 443, 39 - q * 7, 57, 54, 6, P.greenLight, P.green, 1.5); answerMark(g, 471, 66 - q * 7); }
    return;
  }
  if (n === 1) {
    // The question card is the sole moving subject; image, text and number cues travel with it.
    g.save(); g.translate(-48 + 48 * q, 0); sheet(g, 166, 17, 258, 108);
    photo(g, 185, 49, 94, 60); ink(g, 299, 52, 101, 3);
    rr(g, 311, 100, 25, 13, 3, P.orangeLight, '#e6ae79');
    rr(g, 343, 100, 25, 13, 3, P.blueLight, '#afc5d9'); g.restore();
  } else if (n === 2) {
    sheet(g, 154, 16, 282, 109, true); ink(g, 189, 48, 205, 4);
    g.save(); g.translate(70 + 184 * q, 21 + 40 * q); g.rotate(-.1 * (1 - q));
    g.shadowColor = 'rgba(103,70,23,.19)'; g.shadowBlur = 9; g.shadowOffsetY = 4;
    rr(g, 0, 0, 93, 49, 4, '#fff1c9', '#d5b56d', 1.2);
    g.shadowColor = 'transparent'; g.shadowBlur = 0;
    ln(g, 15, 21, 65, 21, P.blue, 2.5);
    ln(g, 15, 33, 51, 33, '#9eafaa', 2);
    g.restore();
  } else if (n === 3) {
    sheet(g, 155, 15, 281, 111); for (let i = 0; i < 3; i++) {
      circle(g, 190, 51 + i * 26, 7, '#f4f6f1', i === 1 ? P.orange : '#b8c9a7', 1.5);
      ln(g, 211, 51 + i * 26, 378 - i * 17, 51 + i * 26, '#b6c6c1', 2.4);
    }
    const arcEnd = -.75 + Math.PI * 1.7 * q;
    g.beginPath(); g.arc(190, 77, 13, -.75, arcEnd);
    g.strokeStyle = P.orange; g.lineWidth = 2.4; g.stroke();
    const pencilAngle = -.35 + .18 * q;
    pencil(g, 190 + 13 * Math.cos(arcEnd) + 12 * Math.cos(pencilAngle),
      77 + 13 * Math.sin(arcEnd) + 12 * Math.sin(pencilAngle), pencilAngle);
  } else if (n === 4) {
    sheet(g, 159, 12, 275, 115, true); for (let i = 0; i < 4; i++) {
      circle(g, 205, 42 + i * 23, 4, i <= q * 3 ? P.blue : '#cad6d0');
      ln(g, 220, 42 + i * 23, 374 - (i % 2) * 23, 42 + i * 23, i <= q * 3 ? P.blueLight : '#d7dfd9', 3);
    }
    // The bookmark remains entirely inside the sheet at both endpoints.
    ribbon(g, 387, 17 + q * 42, P.blue);
  } else if (n === 5) {
    sheet(g, 151, 16, 284, 109); photo(g, 170, 50, 106, 60);
    rr(g, 291, 48, 123, 60, 3, '#f3f4ec'); ink(g, 302, 61, 96, 3, '#879a91');
    // A small enlarged glyph appears only inside the moving optical glass.
    const mx = 201 + 131 * q, my = 69;
    g.save(); g.beginPath(); g.arc(mx, my, 16, 0, Math.PI * 2); g.clip();
    if (q > .5) { ln(g, mx - 8, my - 3, mx + 8, my - 3, P.ink, 3); ln(g, mx - 6, my + 6, mx + 10, my + 6, P.ink, 2); }
    g.restore(); magnifier(g, mx, my, -.08 + .08 * q);
  } else if (n === 6) {
    sheet(g, 151, 17, 284, 108); ink(g, 173, 48, 235, 4);
    g.save(); g.translate(287, 70); const face = Math.cos(q * Math.PI); g.scale(Math.max(.08, Math.abs(face)), 1);
    g.shadowColor = 'rgba(39,68,110,.17)'; g.shadowBlur = 8; g.shadowOffsetY = 4;
    rr(g, -65, -31, 130, 62, 5, face >= 0 ? '#e8f1fb' : P.orangeLight, face >= 0 ? P.blue : P.orange, 1.4);
    const col = face >= 0 ? P.blue : P.orange;
    ln(g, -41, -13, 37, -13, col, 2.8); ln(g, -41, 1, 21, 1, col, 2.3);
    circle(g, 48, 12, 5, col); g.restore();
  } else if (n === 7) {
    sheet(g, 155, 16, 282, 110); for (let i = 0; i <= 4; i++) ln(g, 179, 45 + i * 17, 410, 45 + i * 17, '#cfdad5', 1);
    for (let i = 0; i <= 4; i++) ln(g, 179 + i * 58, 45, 179 + i * 58, 113, '#cfdad5', 1);
    rr(g, 237, 62, 115, 17, 2, 'rgba(240,126,71,.15)');
    rule(g, 191, 87 - q * 25);
  } else if (n === 8) {
    sheet(g, 157, 17, 279, 108); rr(g, 180, 53, 62, 56, 5, '#e4f0e8', '#b2cbbd');
    rr(g, 255, 53, 62, 56, 5, '#e9eef5', '#bac9da');
    g.save(); g.translate(331, 53 - q * 20); g.shadowColor = 'rgba(107,76,27,.2)'; g.shadowBlur = 9; g.shadowOffsetY = 5;
    rr(g, 0, 0, 62, 56, 5, P.orangeLight, P.orange, 1.4); g.restore();
    circle(g, 211, 79, 11, '#a5cdb6');
    ln(g, 275, 78, 297, 78, '#a4bad1', 3);
    circle(g, 362, 76 - q * 20, 12, '#f4bc8d', P.orange, 1.4);
  } else if (n === 9) {
    sheet(g, 154, 16, 284, 109); ink(g, 179, 49, 226, 4);
    const x = 196 + q * 145;
    ln(g, x + 24, 77, 374, 77, P.red, 3);
    g.save(); g.translate(x, 65); g.rotate(-.07); g.shadowColor = 'rgba(80,43,54,.16)'; g.shadowBlur = 6; g.shadowOffsetY = 4;
    rr(g, 0, 0, 55, 25, 5, '#edabb4', '#b4576a', 1); rr(g, 0, 19, 55, 6, 2, '#f5d6d1'); g.restore();
  } else if (n === 10) {
    sheet(g, 157, 16, 282, 109); ink(g, 184, 51, 125, 3);
    rr(g, 322, 55, 75, 48, 5, '#f0f5ed', '#c9dacd');
    const contact = q > .81 ? ease((q - .81) / .19) : 0;
    answerMark(g, 359, 79, contact);
    const sy = 9 + q * 48;
    g.save(); g.shadowColor = 'rgba(70,42,22,.19)'; g.shadowBlur = 8; g.shadowOffsetY = 4;
    rr(g, 337, sy, 44, 29, 5, P.brown, '#6d3010', 1.4); rr(g, 344, sy + 23, 30, 9, 2, '#dc9c69', '#9a582e'); g.restore();
    ln(g, 348, sy + 7, 370, sy + 7, 'rgba(255,255,255,.28)', 1.5);
  }
}

export const AnalogyScene: React.FC<Props> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const g = setupCanvas(canvas, W, H);
    canvas.style.width = '100%'; canvas.style.height = 'auto';
    const n = chapterId === 'hero' ? 0 : Number(chapterId.slice(5)) || 1;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, active = false, elapsed = reduced ? 2.4 : 0, previous = 0;
    const frame = (now: number) => {
      if (!active) return;
      if (previous) elapsed += Math.min((now - previous) / 1000, .05);
      previous = now;
      g.clearRect(0, 0, W, H);
      // On narrow screens the 4:1 canvas would make the main object too small.
      const scale = canvas.getBoundingClientRect().width < 400 ? 1.22 : 1;
      g.save(); g.translate(W / 2, H / 2); g.scale(scale, scale); g.translate(-W / 2, -H / 2);
      scene(g, n, reduced ? 1 : motion(elapsed), moduleId);
      g.restore();
      canvas.classList.add('is-ready');
      if (!reduced) raf = requestAnimationFrame(frame);
    };
    const stopObserving = observeCanvas(canvas,
      () => { if (!active) { active = true; previous = 0; raf = requestAnimationFrame(frame); } },
      () => { active = false; cancelAnimationFrame(raf); });
    return () => { active = false; cancelAnimationFrame(raf); stopObserving(); };
  }, [chapterId, moduleId]);
  return <canvas ref={ref} width={W} height={H} role="img" aria-label={chapterId === 'hero' ? '传统方法与工具规划对比动画' : `第${chapterId.slice(5)}章独立动作动画`} />;
};
