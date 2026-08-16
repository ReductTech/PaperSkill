import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

export const C = {
  bg: '#f5f8f0', env: '#b8c9a7', envDark: '#76906a', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea', white: '#ffffff',
};

export function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 10, fill = C.white, stroke = C.line) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = stroke; ctx.stroke();
}

export function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.ink, size = 13, align: CanvasTextAlign = 'center', weight = 700) {
  ctx.fillStyle = color;
  ctx.font = String(weight) + ' ' + String(size) + 'px "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y);
}

export function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = C.blue, width = 3) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 9 * Math.cos(a - Math.PI / 6), y2 - 9 * Math.sin(a - Math.PI / 6));
  ctx.lineTo(x2 - 9 * Math.cos(a + Math.PI / 6), y2 - 9 * Math.sin(a + Math.PI / 6));
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}

export function token(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, text: string, kind: 'clean' | 'noisy' | 'ar' | 'action' | 'audio' = 'clean') {
  const stroke = kind === 'noisy' ? C.red : kind === 'action' ? C.orange : kind === 'audio' ? C.purple : C.blue;
  const fill = kind === 'ar' ? '#e8eef8' : kind === 'action' ? '#fff4e5' : kind === 'audio' ? '#f5f0ff' : '#f3f7fc';
  rounded(ctx, x, y, w, 42, 8, fill, stroke);
  if (kind === 'noisy') {
    ctx.save(); ctx.beginPath(); ctx.rect(x + 2, y + 2, w - 4, 38); ctx.clip();
    ctx.strokeStyle = 'rgba(196,63,82,.28)'; ctx.lineWidth = 2;
    for (let d = -30; d < w + 50; d += 12) {
      ctx.beginPath(); ctx.moveTo(x + d, y + 40); ctx.lineTo(x + d + 40, y); ctx.stroke();
    }
    ctx.restore();
  }
  label(ctx, text, x + w / 2, y + 21, C.ink, 12);
}

export function useCanvas(draw: (ctx: CanvasRenderingContext2D, time: number) => void, width: number, height: number, deps: React.DependencyList, animate = false) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, width, height); } catch { return; }
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let raf: number | null = null;
    let active = false;
    const render = (t: number) => {
      draw(ctx, reduced ? 1000 : t);
      canvas.classList.add('is-ready');
      if (active && animate && !reduced) raf = requestAnimationFrame(render);
    };
    const start = () => { if (!active) { active = true; raf = requestAnimationFrame(render); } };
    const stop = () => { active = false; if (raf !== null) cancelAnimationFrame(raf); raf = null; };
    if (!animate || reduced) { render(1000); return () => stop(); }
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, deps);
  return canvasRef;
}

// A deliberately slow phase with long holds at both endpoints. Important states
// remain readable instead of passing through the canvas in a continuous loop.
export function pacedPhase(time: number, duration = 18000) {
  const t = ((time % duration) + duration) % duration / duration;
  if (t < .2) return 0;
  if (t < .45) {
    const u = (t - .2) / .25;
    return u * u * (3 - 2 * u);
  }
  if (t < .8) return 1;
  const u = (t - .8) / .2;
  const smooth = u * u * (3 - 2 * u);
  return 1 - smooth;
}

function camera(ctx: CanvasRenderingContext2D, x: number, y: number, angle = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  rounded(ctx, -24, -14, 44, 28, 7, C.blue, C.blue);
  ctx.beginPath(); ctx.moveTo(20, -9); ctx.lineTo(34, -16); ctx.lineTo(34, 16); ctx.lineTo(20, 9); ctx.closePath();
  ctx.fillStyle = C.blue; ctx.fill(); ctx.restore();
}

export const AnalogyScene: React.FC<{ kind: number; labelText: string }> = ({ kind, labelText }) => {
  const ref = useCanvas((ctx, time) => {
    const p = pacedPhase(time);
    ctx.clearRect(0, 0, 244, 130); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, 244, 130);
    ctx.fillStyle = '#e6efdc'; ctx.fillRect(0, 82, 244, 48);
    ctx.strokeStyle = C.envDark; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 82); ctx.lineTo(244, 82); ctx.stroke();
    if (kind === 1) {
      rounded(ctx, 172, 35, 45, 39, 5, '#eef9f2', C.green); label(ctx, '目标', 194, 55, C.green, 11);
      rounded(ctx, 105, 18, 46, 24, 5, '#fff7e8', C.orange); label(ctx, '提示', 128, 30, C.orange, 10);
      camera(ctx, 46, 61, -0.16 + p * 0.25);
    } else if (kind === 2) {
      rounded(ctx, 65, 35, 114, 61, 8, '#fffaf0', C.orange);
      ['#27446e','#228d5c','#7c3aed','#d97706','#92400e'].forEach((c,i) => { ctx.fillStyle = c; ctx.fillRect(76 + i * 18, 61, 12, 23); });
      ctx.save(); ctx.translate(65, 35); ctx.rotate(-0.35 + p * 0.35); rounded(ctx, 0, -8, 114, 15, 4, C.orange, C.orange); ctx.restore();
      label(ctx, 'MULTIMODAL', 122, 49, C.ink, 10);
    } else if (kind === 3) {
      rounded(ctx, 28, 43, 70, 40, 6, '#eef4fb', C.blue); rounded(ctx, 146, 43, 70, 40, 6, '#fff2f3', C.red);
      label(ctx, '条件槽', 63, 63, C.blue, 11); label(ctx, '目标槽', 181, 63, C.red, 11);
      const x = 82 + 80 * p; rounded(ctx, x, 20, 40, 27, 5, '#fff8e7', C.orange); label(ctx, '序列', x + 20, 34, C.orange, 10);
    } else if (kind === 4) {
      rounded(ctx, 24, 25, 55, 35, 6, '#eef4fb', C.blue); label(ctx, 'AR 前缀', 51, 43, C.blue, 10);
      ctx.globalAlpha = .32 + .38 * p; ctx.beginPath(); ctx.moveTo(76, 48); ctx.lineTo(205, 28); ctx.lineTo(205, 83); ctx.closePath();
      ctx.fillStyle = '#f6d56f'; ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(202, 85, 7, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 5) {
      ctx.strokeStyle = C.blue; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(122, 62, 31, -.7 + p * .8, 4.8 + p * .8); ctx.stroke();
      rounded(ctx, 26, 37, 55, 42, 5, '#eef4fb', C.blue); label(ctx, '文字', 53, 58, C.blue, 11);
      rounded(ctx, 164, 37, 55, 42, 5, '#eef9f2', C.green); label(ctx, '参考帧', 191, 58, C.green, 11); label(ctx, '融合', 122, 62, C.orange, 11);
    } else if (kind === 6) {
      ctx.fillStyle = C.route; ctx.beginPath(); ctx.arc(42, 63, 20, 0, Math.PI * 2); ctx.fill();
      rounded(ctx, 84, 28, 105, 70, 6, '#e9f6ed', p > .6 ? C.green : C.red);
      ctx.save(); ctx.globalAlpha = 1 - p; ctx.strokeStyle = C.red;
      for (let i=-15;i<120;i+=12){ctx.beginPath();ctx.moveTo(84+i,98);ctx.lineTo(84+i+70,28);ctx.stroke();}
      ctx.restore(); label(ctx, p > .6 ? '恢复 latent' : '加噪 latent', 136, 63, p > .6 ? C.green : C.red, 11);
    } else if (kind === 7) {
      rounded(ctx, 24, 35, 55, 52, 5, '#fff1f2', C.red); label(ctx, '噪声', 51, 61, C.red, 11);
      rounded(ctx, 168, 35, 55, 52, 5, '#eef9f2', C.green); label(ctx, '数据', 195, 61, C.green, 11);
      ctx.strokeStyle = C.route; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(76,61);ctx.lineTo(169,61);ctx.stroke();
      const x=76+93*p; ctx.save(); ctx.translate(x,55); ctx.rotate(-.35); ctx.fillStyle=C.orange;ctx.fillRect(-18,-4,36,8);ctx.restore();
    } else if (kind === 8) {
      ['画面','声音','动作'].forEach((s,i)=>{const y=35+i*25;ctx.strokeStyle=i===1?C.purple:i===2?C.orange:C.blue;ctx.beginPath();ctx.moveTo(35,y);ctx.lineTo(214,y);ctx.stroke();label(ctx,s,9,y,C.muted,9,'left');});
      const x=45+155*p; ctx.strokeStyle=C.green;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,21);ctx.lineTo(x,91);ctx.stroke();
      rounded(ctx,x-18,7,36,20,4,'#fff7e8',C.orange);label(ctx,'t',x,17,C.orange,10);
    } else if (kind === 9) {
      ctx.fillStyle=C.orange;ctx.beginPath();ctx.arc(194,70,13,0,Math.PI*2);ctx.fill();label(ctx,'杯',194,70,C.white,9);
      ctx.fillStyle=C.envDark;ctx.fillRect(28,49,26,14);
      const x=52+120*p;ctx.strokeStyle=C.route;ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(48,56);ctx.lineTo(x,67);ctx.stroke();ctx.lineCap='butt';
      ctx.fillStyle=C.green;ctx.beginPath();ctx.arc(176,70,5,0,Math.PI*2);ctx.fill();
    } else {
      ctx.strokeStyle=C.green;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(176,24);ctx.lineTo(176,104);ctx.stroke();
      const x=30+120*p;rounded(ctx,x,38,74,45,5,'#fffaf0',C.route);
      for(let i=0;i<4;i++){ctx.fillStyle=C.route;ctx.fillRect(x+8+i*17,43,9,7);ctx.fillRect(x+8+i*17,71,9,7);}
      rounded(ctx,188,23,37,28,5,'#fff7e8',C.orange);label(ctx,'评测',206,37,C.orange,9);
    }
    label(ctx, labelText, 122, 116, C.muted, 10);
  }, 244, 130, [kind, labelText], true);
  return <canvas ref={ref} width={244} height={130} aria-label={labelText} />;
};

export const StudioKitWidget: React.FC<WidgetProps> = () => <div className="feedback">共享绘图组件已加载。</div>;
export { clamp };
