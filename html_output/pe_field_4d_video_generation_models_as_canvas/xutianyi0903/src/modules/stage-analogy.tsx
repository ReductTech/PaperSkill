import React, { useEffect, useRef } from 'react';
import { clamp, easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

export const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', rig: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea', white: '#ffffff',
};

export function clearStage(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(184,201,167,.28)';
  ctx.fillRect(0, h * .67, w, h * .33);
  ctx.strokeStyle = C.light;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, h * .67); ctx.lineTo(w, h * .67); ctx.stroke();
}

export function drawCamera(ctx: CanvasRenderingContext2D, x: number, y: number, color = C.blue, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = C.white; ctx.strokeStyle = color; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.roundRect(-19, -12, 34, 24, 5); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(15, -7); ctx.lineTo(27, -11); ctx.lineTo(27, 11); ctx.lineTo(15, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(-9, 0, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawActor(ctx: CanvasRenderingContext2D, x: number, y: number, color = C.green, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, -15, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 12); ctx.moveTo(0, -2); ctx.lineTo(-10, 6); ctx.moveTo(0, -2); ctx.lineTo(10, 5); ctx.moveTo(0, 12); ctx.lineTo(-8, 25); ctx.moveTo(0, 12); ctx.lineTo(8, 25); ctx.stroke();
  ctx.restore();
}

export function drawTapeMark(ctx: CanvasRenderingContext2D, x: number, y: number, color = C.orange, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = color; ctx.lineWidth = 4 * scale;
  ctx.beginPath(); ctx.moveTo(-8 * scale, -5 * scale); ctx.lineTo(8 * scale, 5 * scale); ctx.moveTo(8 * scale, -5 * scale); ctx.lineTo(-8 * scale, 5 * scale); ctx.stroke(); ctx.restore();
}

export function drawViewfinder(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color = C.blue) {
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
  ctx.globalAlpha = .35; ctx.lineWidth = 1; ctx.beginPath();
  ctx.moveTo(x + w / 3, y); ctx.lineTo(x + w / 3, y + h); ctx.moveTo(x + 2 * w / 3, y); ctx.lineTo(x + 2 * w / 3, y + h);
  ctx.moveTo(x, y + h / 3); ctx.lineTo(x + w, y + h / 3); ctx.moveTo(x, y + 2 * h / 3); ctx.lineTo(x + w, y + 2 * h / 3); ctx.stroke(); ctx.globalAlpha = 1;
}

export function drawFocusRing(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color = C.orange) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 18, -.8, 4.9); ctx.stroke();
  ctx.rotate(angle); ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(23, 0); ctx.stroke(); ctx.restore();
}

export function drawClapboard(ctx: CanvasRenderingContext2D, x: number, y: number, open: number, color = C.blue) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = C.white; ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.fillRect(-20, -6, 40, 30); ctx.strokeRect(-20, -6, 40, 30);
  ctx.save(); ctx.translate(-20, -7); ctx.rotate(-open * .45); ctx.fillStyle = color; ctx.fillRect(0, -7, 42, 8); ctx.restore();
  ctx.fillStyle = color; ctx.font = '700 11px system-ui'; ctx.fillText('TAKE', -14, 11); ctx.restore();
}

export function drawSceneLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.ink, align: CanvasTextAlign = 'left') {
  ctx.fillStyle = color; ctx.font = '700 12px system-ui'; ctx.textAlign = align; ctx.fillText(text, x, y); ctx.textAlign = 'left';
}

export function drawLegend(ctx: CanvasRenderingContext2D, items: Array<[string, string]>, x: number, y: number) {
  items.forEach(([label, color], i) => { ctx.fillStyle = color; ctx.fillRect(x, y + i * 18 - 8, 10, 4); drawSceneLabel(ctx, label, x + 16, y + i * 18, C.muted); });
}

export function startObservedLoop(canvas: HTMLCanvasElement, w: number, h: number, draw: (ctx: CanvasRenderingContext2D, time: number) => void) {
  const ctx = setupCanvas(canvas, w, h);
  let raf: number | null = null;
  const tick = (time: number) => { draw(ctx, time); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); raf = requestAnimationFrame(tick); };
  const start = () => { if (raf === null) raf = requestAnimationFrame(tick); };
  const stop = () => { if (raf !== null) cancelAnimationFrame(raf); raf = null; };
  const disconnect = observeCanvas(canvas, start, stop);
  return () => { stop(); disconnect(); };
}

function chapterNumber(chapterId: string) { return Number(chapterId.match(/(\d+)/)?.[1] || 1); }

export const StageAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    return startObservedLoop(canvas, 244, 130, (ctx, ms) => {
      const n = chapterNumber(chapterId); const raw = reduced ? .65 : (ms % 3000) / 3000; const p = easeInOutQuad(raw < .5 ? raw * 2 : (1 - raw) * 2);
      clearStage(ctx, 244, 130);
      if (n === 1) { const ax=42+raw*154,ay=91-raw*24;ctx.fillStyle=C.rig;ctx.beginPath();ctx.moveTo(28,98);ctx.lineTo(216,66);ctx.lineTo(216,72);ctx.lineTo(28,101);ctx.closePath();ctx.fill();drawActor(ctx,ax,ay-20+Math.sin(raw*Math.PI*12)*2,C.green,.48+raw*.5);drawSceneLabel(ctx,'远·小',29,84,C.muted);drawSceneLabel(ctx,'近·大',216,57,C.orange,'right');drawSceneLabel(ctx,`t=${(raw*6).toFixed(1)}s`,18,22,C.orange); }
      if (n === 2) { const ax=42+raw*154,ay=91-raw*24;ctx.fillStyle=C.rig;ctx.beginPath();ctx.moveTo(28,98);ctx.lineTo(216,66);ctx.lineTo(216,72);ctx.lineTo(28,101);ctx.closePath();ctx.fill();drawActor(ctx,ax,ay-20+Math.sin(raw*Math.PI*12)*2,C.red,.48+raw*.5);drawCamera(ctx,42+p*36,113,C.blue,.62);drawSceneLabel(ctx,'远小 → 近大',224,58,C.orange,'right');drawSceneLabel(ctx,`相机变化 · t=${(raw*6).toFixed(1)}s`,18,22,C.red); }
      if (n === 3) { drawViewfinder(ctx, 112, 24, 104, 72); drawActor(ctx, 164, 64, C.green, .65); drawCamera(ctx, 30 + p * 34, 92, C.blue, .72); drawTapeMark(ctx, 164, 103); drawSceneLabel(ctx, '内容不变，只换地址', 163, 18, C.blue, 'center'); }
      if (n === 4) { drawCamera(ctx, 194, 94, C.blue, .68); drawTapeMark(ctx, 172, 94, C.orange, .8); drawActor(ctx, 54+p*108, 68, C.green, .66); ctx.strokeStyle=C.blue;ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(54,98);ctx.lineTo(172,98);ctx.stroke();ctx.setLineDash([]);drawSceneLabel(ctx,'测量 → 写地址 → 生成',122,20,C.blue,'center'); }
      if (n === 5) { ctx.fillStyle = C.white; ctx.strokeStyle = C.line; ctx.fillRect(52,20,135,82); ctx.strokeRect(52,20,135,82); drawActor(ctx, 120, 68, C.green, .58); ctx.save(); ctx.translate(65 + p * 100, 61); ctx.strokeStyle = C.orange; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0,0,17,0,Math.PI*2); ctx.stroke(); ctx.restore(); drawSceneLabel(ctx, '逐项拿掉组件', 120, 118, C.orange, 'center'); }
      if (n === 6) { ctx.strokeStyle = C.green; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(28, 98); ctx.lineTo(215,98); ctx.stroke(); drawCamera(ctx, 42 + p * 148, 88, C.green, .72); drawTapeMark(ctx, 203, 98, C.orange, 1.2); ctx.fillStyle = p > .88 ? C.green : C.line; ctx.beginPath(); ctx.arc(204, 30, 9, 0, Math.PI*2); ctx.fill(); drawSceneLabel(ctx, '最终take', 203, 19, C.green, 'center'); }
      if (n === 7) { drawClapboard(ctx, 70, 64, p, C.blue); drawActor(ctx, 168, 72, C.green, .72); drawSceneLabel(ctx, `帧 ${1 + Math.floor(clamp(p,0,.99) * 4)}`, 70, 111, C.orange, 'center'); }
      if (n === 8) { drawCamera(ctx, 48, 88, C.blue, .72); ctx.fillStyle = C.white; ctx.strokeStyle = C.blue; ctx.lineWidth = 2; ctx.fillRect(112, 25, 102, 69); ctx.strokeRect(112,25,102,69); ctx.fillStyle = C.green; ctx.fillRect(126, 39, 22 + p * 48, 9); ctx.fillStyle = C.purple; ctx.fillRect(126, 59, 18 + p * 34, 9); drawSceneLabel(ctx, '全局 + 几何K/V', 163, 111, C.blue, 'center');drawSceneLabel(ctx,'LoRA',207,22,C.green,'right'); }
      if (n === 9) { ctx.fillStyle = C.white; ctx.strokeStyle = C.line; ctx.fillRect(52,20,135,82); ctx.strokeRect(52,20,135,82); drawActor(ctx, 120, 68, C.green, .58); ctx.save(); ctx.translate(65 + p * 100, 61); ctx.strokeStyle = C.orange; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0,0,17,0,Math.PI*2); ctx.stroke(); ctx.restore(); drawSceneLabel(ctx, '检查边界', 120, 118, C.orange, 'center'); }
      if (n === 10) { ctx.strokeStyle = C.green; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(28, 98); ctx.lineTo(215,98); ctx.stroke(); drawCamera(ctx, 42 + p * 148, 88, C.green, .72); drawTapeMark(ctx, 203, 98, C.orange, 1.2); ctx.fillStyle = p > .88 ? C.green : C.line; ctx.beginPath(); ctx.arc(204, 30, 9, 0, Math.PI*2); ctx.fill(); drawSceneLabel(ctx, '最终take', 203, 19, C.green, 'center'); }
    });
  }, [chapterId]);
  return <canvas ref={ref} width={244} height={130} aria-label={`第${chapterNumber(chapterId)}章舞台拍摄类比动画`} />;
};

export default StageAnalogy;
