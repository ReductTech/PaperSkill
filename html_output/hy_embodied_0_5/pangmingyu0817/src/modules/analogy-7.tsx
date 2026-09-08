import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;
const C = {
  bg: '#f5f8f0', wall: '#b8c9a7', wallDark: '#76906a', rope: '#92400e',
  blue: '#27446e', green: '#228d5c', orange: '#d97706', purple: '#7c3aed',
  text: '#21324a', muted: '#68778f', line: '#d7deea'
};

type Scene = 'frontier' | 'carabiner' | 'coach' | 'finish';

function wall(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.wall; ctx.fillRect(8, 8, W - 16, H - 16);
  ctx.strokeStyle = C.wallDark; ctx.lineWidth = 1;
  for (let x = 24; x < W; x += 38) { ctx.beginPath(); ctx.moveTo(x, 8); ctx.lineTo(x - 12, H - 8); ctx.stroke(); }
}

function hold(ctx: CanvasRenderingContext2D, x: number, y: number, active = false) {
  ctx.beginPath(); ctx.ellipse(x, y, 10, 6, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = active ? '#dff5e9' : C.wallDark; ctx.fill();
  ctx.strokeStyle = active ? C.green : '#5f7655'; ctx.lineWidth = active ? 4 : 2; ctx.stroke();
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.font = '700 13px system-ui, sans-serif'; ctx.fillStyle = C.text; ctx.fillText(text, x, y);
}

function climber(ctx: CanvasRenderingContext2D, reach: number, finish = false) {
  const x = 82, y = 84;
  ctx.strokeStyle = C.blue; ctx.fillStyle = '#fff'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y - 34, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y - 25); ctx.lineTo(x, y); ctx.moveTo(x, y - 17);
  ctx.lineTo(110 + 40 * reach, 45 - 17 * reach); ctx.moveTo(x, y); ctx.lineTo(66, 111);
  ctx.moveTo(x, y); ctx.lineTo(98, 109); ctx.stroke();
  if (finish) { ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(151, 27, 3.5, 0, Math.PI * 2); ctx.fill(); }
}

function carabiner(ctx: CanvasRenderingContext2D, p: number) {
  ctx.strokeStyle = C.rope; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(22, 25); ctx.bezierCurveTo(72, 68, 164, 52, 220, 106); ctx.stroke();
  ctx.strokeStyle = C.green; ctx.lineWidth = 7; ctx.beginPath();
  ctx.ellipse(122, 67, 30, 45, 0.35, 0.25, Math.PI * 1.92); ctx.stroke();
  ctx.strokeStyle = C.orange; ctx.lineWidth = 5; ctx.beginPath();
  ctx.moveTo(141, 40); ctx.lineTo(151 - 10 * p, 74 - 7 * p); ctx.stroke();
}

function coach(ctx: CanvasRenderingContext2D, p: number) {
  ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = C.purple; ctx.fillStyle = '#fff'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(48, 45, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(48, 55); ctx.lineTo(48, 92); ctx.moveTo(48, 65); ctx.lineTo(73, 73); ctx.stroke();
  ctx.fillStyle = `rgba(39,68,110,${0.12 + 0.25 * p})`; ctx.beginPath(); ctx.moveTo(72, 68); ctx.lineTo(190, 42); ctx.lineTo(190, 99); ctx.closePath(); ctx.fill();
  hold(ctx, 175, 86, true); ctx.strokeStyle = C.orange; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(167, 77); ctx.lineTo(183, 94); ctx.moveTo(183, 77); ctx.lineTo(167, 94); ctx.stroke();
}

function drawScene(ctx: CanvasRenderingContext2D, scene: Scene, p: number) {
  ctx.clearRect(0, 0, W, H);
  if (scene === 'coach') { coach(ctx, p); label(ctx, '学生落点', 132, 116); label(ctx, '就地纠错', 14, 18); return; }
  wall(ctx);
  if (scene === 'frontier') {
    hold(ctx, 59, 111); hold(ctx, 103, 84); hold(ctx, 158, 39, true); climber(ctx, p);
    label(ctx, '刚好可学', 138, 21); label(ctx, '当前边界', 12, 20);
  } else if (scene === 'carabiner') {
    carabiner(ctx, p); label(ctx, '视觉端', 12, 20); label(ctx, '语言端', 183, 119);
  } else {
    hold(ctx, 62, 111); hold(ctx, 103, 78); hold(ctx, 151, 27, true); climber(ctx, p, p > 0.86);
    label(ctx, '触顶', 164, 25); label(ctx, '仍须复核', 12, 20);
  }
}

function AnalogyCanvas({ scene, chapterId, moduleId, aria }: WidgetProps & { scene: Scene; aria: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let raf = 0; let startAt = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tick = (now: number) => {
      if (!startAt) startAt = now;
      const raw = reduced ? 1 : ((now - startAt) % 3200) / 3200;
      const p = reduced ? 1 : raw < 0.72 ? Math.min(1, raw / 0.58) : 1;
      drawScene(ctx, scene, p); canvas.classList.add('is-ready');
      if (!reduced) raf = requestAnimationFrame(tick);
    };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [scene]);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} role="img" aria-label={aria} width={W} height={H} />;
}

export const Analogy7: React.FC<WidgetProps> = (p) => <AnalogyCanvas {...p} scene="frontier" aria="一个攀岩者尝试一个刚好够得到的岩点，表示当前能力边界。" />;
export const Analogy8: React.FC<WidgetProps> = (p) => <AnalogyCanvas {...p} scene="carabiner" aria="一个登山扣闭合并锁住一根绳，表示视觉与语言之间的连接。" />;
export const Analogy9: React.FC<WidgetProps> = (p) => <AnalogyCanvas {...p} scene="coach" aria="一个教练用光束照亮学生的失误落点，表示在学生访问状态上纠错。" />;
export const Analogy10: React.FC<WidgetProps> = (p) => <AnalogyCanvas {...p} scene="finish" aria="一个攀岩者轻触终点岩点，旁注成绩仍须按协议复核。" />;
