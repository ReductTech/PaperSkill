import React, { useEffect } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

export const C = {
  bg: '#f5f8f0', desk: '#b8c9a7', deskDark: '#76906a', ink: '#21324a', muted: '#68778f',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706', purple: '#7c3aed',
  border: '#d7deea', white: '#ffffff', brown: '#92400e'
};

export function clearDesk(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#e7eee0'; ctx.fillRect(0, h - 38, w, 38);
  ctx.strokeStyle = C.desk; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, h - 38); ctx.lineTo(w, h - 38); ctx.stroke();
}

export function notebook(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, accent = C.blue, open = true) {
  ctx.fillStyle = C.white; ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = accent; ctx.fillRect(x, y, w, 12);
  if (open) { ctx.strokeStyle = C.border; ctx.beginPath(); ctx.moveTo(x + w / 2, y + 16); ctx.lineTo(x + w / 2, y + h - 8); ctx.stroke(); }
}

export function card(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, color = C.blue) {
  ctx.fillStyle = C.white; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x, y, w, h, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.ink; ctx.font = '12px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, x + w / 2, y + h / 2, w - 8);
}

export function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.ink, align: CanvasTextAlign = 'left') {
  ctx.fillStyle = color; ctx.font = '12px "Segoe UI", sans-serif'; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y);
}

export function useCanvas(ref: React.RefObject<HTMLCanvasElement>, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, deps: React.DependencyList) {
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, w, h); } catch { return; }
    const render = () => { draw(ctx); canvas.classList.add('is-ready'); };
    const disconnect = observeCanvas(canvas, render, () => undefined); render();
    return () => disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export const HandbookKit: React.FC = () => null;
export default HandbookKit;
