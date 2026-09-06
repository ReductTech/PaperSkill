import React, { useEffect, useRef } from 'react';
import { easeInOutQuad, setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  PALETTE,
  clearSea,
  drawBoat,
  drawBuoy,
  drawChart,
  drawCoast,
  drawCompass,
  drawHarbor,
  drawRoute,
  drawSceneLabel,
} from './sailing-kit';

const W = 244;
const H = 130;

function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, angle = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ctx.strokeStyle = PALETTE.route; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-18, 12); ctx.lineTo(4, -6); ctx.stroke();
  ctx.fillStyle = '#f2c7a5'; ctx.beginPath(); ctx.arc(7, -9, 8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function renderScene(ctx: CanvasRenderingContext2D, chapter: number, t: number) {
  clearSea(ctx, W, H);
  const p = easeInOutQuad((t % 3200) / 3200);
  if (chapter === 1) {
    ctx.save();
    ctx.fillStyle = '#f7f8fa';
    ctx.strokeStyle = PALETTE.line;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(10, 20, 92, 58, 8);
    ctx.roundRect(142, 20, 92, 58, 8);
    ctx.fill();
    ctx.stroke();
    drawSceneLabel(ctx, 'Software Tool', 20, 38, PALETTE.blue);
    drawSceneLabel(ctx, 'Robot Skill', 154, 38, PALETTE.route);
    drawSceneLabel(ctx, 'clean output', 24, 63, PALETTE.green);
    drawSceneLabel(ctx, p > .48 ? 'partial progress' : 'running...', 154, 63, p > .48 ? PALETTE.red : PALETTE.blue);

    ctx.strokeStyle = PALETTE.blue;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(103, 49);
    ctx.lineTo(135, 49);
    ctx.stroke();
    ctx.fillStyle = PALETTE.blue;
    ctx.beginPath();
    ctx.moveTo(135, 49);
    ctx.lineTo(127, 44);
    ctx.lineTo(127, 54);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = p > .48 ? PALETTE.red : PALETTE.route;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(188, 78);
    ctx.lineTo(188 + Math.sin(p * Math.PI) * 20, 101);
    ctx.stroke();
    ctx.setLineDash([]);

    drawSceneLabel(ctx, '同样调用，反馈形态变了', 10, 116, PALETTE.text);
    ctx.restore();
    return;
  }

  if ([5, 6, 10].includes(chapter)) {
    drawCoast(ctx, W, H);
    const start = { x: 24, y: 92 };
    const end = { x: 214, y: 34 };
    const midY = chapter === 1 ? 100 : chapter === 6 ? 76 : 70;
    const route = [start, { x: 118, y: midY }, end];
    drawRoute(ctx, route, chapter === 1 && p > .48 ? PALETTE.red : PALETTE.blue, 2, p < .55);
    if (chapter === 5) drawBuoy(ctx, 116, 68);
    if (chapter === 6) {
      drawBuoy(ctx, 118, 82, PALETTE.red);
      if (p > .56) drawRoute(ctx, [{ x: 112, y: 76 }, { x: 158, y: 42 }, end], PALETTE.green, 3);
    }
    if (chapter === 1 && p > .55) drawRoute(ctx, [{ x: 116, y: 98 }, { x: 166, y: 54 }, end], PALETTE.green, 3);
    if (chapter === 10) {
      drawRoute(ctx, [{ x: 24, y: 76 }, { x: 220, y: 76 }], PALETTE.route, 2);
      drawSceneLabel(ctx, '同一航道', 12, 16, PALETTE.muted);
    }
    drawHarbor(ctx, end.x, end.y);
    const x = start.x + (end.x - start.x) * p;
    const y = start.y + (midY - start.y) * Math.min(1, p * 1.8) + (end.y - midY) * Math.max(0, (p - .55) / .45);
    drawBoat(ctx, x, y, chapter === 10 ? PALETTE.green : PALETTE.blue, .72, -.22);
    drawSceneLabel(ctx, chapter === 5 ? '候选要先验证' : chapter === 6 ? '状态改变航线' : chapter === 10 ? '抵达终点' : '偏差要被看见', 10, 116);
    return;
  }

  if (chapter === 2) {
    drawChart(ctx, 110, 16, 120, 88);
    ctx.strokeStyle = PALETTE.route; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(54, 58, 28, 0, Math.PI * 2); ctx.stroke();
    [28, 53, 78].forEach((y, i) => {
      ctx.strokeStyle = i <= Math.floor(p * 3) ? PALETTE.blue : PALETTE.line;
      ctx.strokeRect(122, y, 88, 18);
    });
    drawHand(ctx, 76 + p * 48, 90 - p * 46, -.2);
    drawSceneLabel(ctx, p > .72 ? '可监控' : '补全技能契约', 12, 116, p > .72 ? PALETTE.green : PALETTE.text);
    return;
  }

  if (chapter === 3) {
    drawChart(ctx, 8, 8, 154, 96);
    const nodes = [{ x: 28, y: 82 }, { x: 62, y: 68 }, { x: 98, y: 48 }, { x: 138, y: 30 }];
    drawRoute(ctx, nodes, PALETTE.blue, 2);
    nodes.forEach((n, i) => { ctx.fillStyle = i <= p * 4 ? PALETTE.blue : PALETTE.line; ctx.beginPath(); ctx.arc(n.x, n.y, 4, 0, Math.PI * 2); ctx.fill(); });
    drawHarbor(ctx, 138, 30);
    drawCompass(ctx, 201, 49, 24, -2.4 + p * 1.7);
    drawSceneLabel(ctx, '从粗范围到对象', 12, 116);
    return;
  }

  if (chapter === 4) {
    drawChart(ctx, 8, 12, 150, 90); drawBuoy(ctx, 84, 58);
    const size = 60 - Math.sin(p * Math.PI) * 34;
    ctx.strokeStyle = PALETTE.blue; ctx.lineWidth = 2; ctx.strokeRect(84 - size / 2, 58 - size / 2, size, size);
    ['全帧', '掩码', '外接框'].forEach((s, i) => drawSceneLabel(ctx, s, 170, 30 + i * 24, i <= p * 3 ? PALETTE.blue : PALETTE.muted));
    drawSceneLabel(ctx, '三种视野合成描述', 12, 116);
    return;
  }

  if (chapter === 7 || chapter === 8) {
    ctx.strokeStyle = PALETTE.route; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(60, 67, 30, 0, Math.PI * 2); ctx.stroke();
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      ctx.beginPath(); ctx.moveTo(60, 67); ctx.lineTo(60 + Math.cos(a) * 30, 67 + Math.sin(a) * 30); ctx.stroke();
    }
    ctx.fillStyle = '#fff'; ctx.strokeStyle = PALETTE.line; ctx.lineWidth = 2; ctx.fillRect(158, 38, 62, 62); ctx.strokeRect(158, 38, 62, 62);
    drawCompass(ctx, 189, 69, 22, -.8 + p * .7, p > .55 ? PALETTE.green : PALETTE.blue);
    drawRoute(ctx, [{ x: 88, y: 55 }, { x: 158, y: 55 }], PALETTE.blue, 2);
    if (chapter === 8) drawRoute(ctx, [{ x: 158, y: 84 }, { x: 88, y: 84 }], PALETTE.green, 2, true);
    drawHand(ctx, 84 + p * 72, 101 - p * 43, -.25);
    drawSceneLabel(ctx, chapter === 7 ? '同一舵令，不同后端' : '命令出去，状态回来', 10, 116);
    return;
  }

  drawChart(ctx, 10, 24, 156, 90);
  const oldX = 58, newX = 122;
  ctx.fillStyle = PALETTE.red; ctx.beginPath(); ctx.arc(oldX, 76, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PALETTE.green; ctx.beginPath(); ctx.arc(newX, 62, 8, 0, Math.PI * 2); ctx.fill();
  drawRoute(ctx, [{ x: oldX - 9, y: 68 }, { x: oldX + 9, y: 84 }], PALETTE.red, 2);
  drawHand(ctx, 48 + p * 92, 95 - p * 38, -.55);
  ctx.fillStyle = PALETTE.blue; ctx.fillRect(176, 42, 52, 7); ctx.fillRect(176, 61, 44, 7); ctx.fillRect(176, 80, 36, 7);
  drawSceneLabel(ctx, '只更新受影响部分', 10, 116);
}

export const SailingAnalogy: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const chapter = Number((chapterId.match(/\d+/) || [moduleId.match(/\d+/)?.[0] || '1'])[0]);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const render = (time: number) => { renderScene(ctx, chapter, reduced ? 2650 : time); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); };
    const tick = (time: number) => { render(time); rafRef.current = requestAnimationFrame(tick); };
    const start = () => { if (reduced) render(2650); else if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [chapterId, moduleId]);
  return <canvas ref={canvasRef} width={W} height={H} aria-label={`第${chapterId.replace(/\D/g, '') || '1'}章近岸航行类比动画`} />;
};

export default SailingAnalogy;
