import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

export const colors = { bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', support: '#92400e', blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47', purple: '#7c3aed', text: '#21324a', muted: '#68778f', border: '#d7deea' };

export function drawFrame(context: CanvasRenderingContext2D, width: number, height: number) {
  context.clearRect(0, 0, width, height);
  context.fillStyle = colors.bg;
  context.fillRect(0, 0, width, height);
}

export function drawPhoto(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, detail = 1) {
  context.save();
  context.translate(x, y);
  context.scale(width / 400, height / 240);
  context.beginPath(); context.rect(0, 0, 400, 240); context.clip();
  context.fillStyle = '#e4eadf'; context.fillRect(0, 0, 400, 240);
  context.fillStyle = '#d4dcca'; context.beginPath(); context.arc(308, 53, 20, 0, Math.PI * 2); context.fill();
  context.fillStyle = colors.light;
  context.beginPath(); context.moveTo(0, 150); context.lineTo(90, 42); context.lineTo(164, 129); context.lineTo(245, 68); context.lineTo(400, 157); context.lineTo(400, 240); context.lineTo(0, 240); context.closePath(); context.fill();
  context.fillStyle = colors.dark;
  context.beginPath(); context.moveTo(0, 185); context.quadraticCurveTo(118, 140, 220, 176); context.quadraticCurveTo(328, 209, 400, 157); context.lineTo(400, 240); context.lineTo(0, 240); context.fill();
  context.fillStyle = '#f5f1e8'; context.fillRect(160, 126, 96, 68);
  context.fillStyle = colors.blue;
  context.beginPath(); context.moveTo(146, 129); context.lineTo(207, 82); context.lineTo(268, 129); context.closePath(); context.fill();
  context.fillStyle = colors.support; context.fillRect(199, 151, 20, 43);
  context.fillStyle = colors.dark; context.fillRect(174, 145, 14, 16); context.fillRect(233, 145, 12, 16);
  context.strokeStyle = '#e3e8d7'; context.lineWidth = 3;
  context.beginPath(); context.moveTo(209, 194); context.bezierCurveTo(186, 212, 224, 226, 202, 240); context.stroke();
  context.globalAlpha = Math.max(0, Math.min(1, detail));
  context.lineWidth = 1.2;
  context.strokeStyle = '#a6ba98';
  for (let index = 0; index < 70; index++) {
    const horizontal = (index * 67 + 19) % 400;
    const vertical = 199 + (index * 13) % 39;
    context.beginPath(); context.moveTo(horizontal, vertical); context.lineTo(horizontal + 4, vertical - 7); context.stroke();
  }
  context.strokeStyle = '#c6b8a3'; context.lineWidth = 1;
  for (let row = 0; row < 6; row++) {
    const vertical = 133 + row * 10;
    context.beginPath(); context.moveTo(161, vertical); context.lineTo(255, vertical); context.stroke();
    for (let column = 0; column < 6; column++) {
      const horizontal = 164 + column * 17 + row % 2 * 8;
      if (horizontal < 255) { context.beginPath(); context.moveTo(horizontal, vertical); context.lineTo(horizontal, vertical + 9); context.stroke(); }
    }
  }
  context.strokeStyle = '#9bafb4';
  for (let index = 0; index < 8; index++) {
    const offset = index * 7;
    context.beginPath(); context.moveTo(163 + offset, 121); context.lineTo(207, 90 + offset * .45); context.lineTo(254 - offset, 121); context.stroke();
  }
  context.restore();
  context.strokeStyle = colors.border; context.lineWidth = 2; context.strokeRect(x, y, width, height);
}

export function drawBrush(context: CanvasRenderingContext2D, x: number, y: number, angle = 0) {
  context.save(); context.translate(x, y); context.rotate(angle);
  context.fillStyle = colors.support; context.beginPath(); context.roundRect(-5, -59, 10, 48, 4); context.fill();
  context.fillStyle = colors.orange; context.fillRect(-7, -14, 14, 10);
  context.fillStyle = colors.blue; context.beginPath(); context.moveTo(-7, -4); context.quadraticCurveTo(-12, 11, 0, 19); context.quadraticCurveTo(11, 8, 7, -4); context.closePath(); context.fill();
  context.restore();
}

interface StageProps {
  draw: (context: CanvasRenderingContext2D, width: number, height: number, timeMs: number) => void;
  height?: number;
  animate?: boolean;
  label?: string;
  onPointerDown?: React.PointerEventHandler<HTMLCanvasElement>;
  onPointerMove?: React.PointerEventHandler<HTMLCanvasElement>;
  onPointerUp?: React.PointerEventHandler<HTMLCanvasElement>;
  onPointerCancel?: React.PointerEventHandler<HTMLCanvasElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLCanvasElement>;
  tabIndex?: number;
  style?: React.CSSProperties;
}

export const Stage: React.FC<StageProps> = ({ draw, height = 280, animate = false, label = '交互教学示意图', style, ...events }) => {
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(draw);
  const repaint = useRef<() => void>(() => {});
  drawing.current = draw;

  useLayoutEffect(() => {
    const element = canvas.current;
    const container = holder.current;
    if (!element || !container) return;
    let context: CanvasRenderingContext2D | null = null;
    let cssWidth = 1;
    let frame = 0;
    let visible = true;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const render = () => {
      if (!context) return;
      context.save(); context.scale(cssWidth / 720, cssWidth / 720);
      drawing.current(context, 720, height, motion.matches ? 1600 : performance.now());
      context.restore(); element.classList.add('is-ready');
    };
    const tick = () => {
      frame = 0;
      render();
      if (visible && animate && !motion.matches) frame = requestAnimationFrame(tick);
    };
    const stop = () => { if (frame) cancelAnimationFrame(frame); frame = 0; };
    const start = () => { visible = true; if (!frame && animate && !motion.matches) frame = requestAnimationFrame(tick); else render(); };
    const resize = () => {
      cssWidth = Math.max(1, container.getBoundingClientRect().width);
      context = setupCanvas(element, cssWidth, cssWidth * height / 720);
      render();
    };
    repaint.current = render;
    resize();
    const observer = new ResizeObserver(resize); observer.observe(container);
    const disconnect = observeCanvas(element, start, () => { visible = false; stop(); });
    const motionChange = () => { stop(); if (visible) start(); };
    motion.addEventListener('change', motionChange);
    return () => { stop(); observer.disconnect(); disconnect(); motion.removeEventListener('change', motionChange); repaint.current = () => {}; };
  }, [height, animate]);

  useEffect(() => { repaint.current(); }, [draw]);

  return <div ref={holder} style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
    <canvas ref={canvas} aria-label={label} role="img" {...events} style={{ display: 'block', maxWidth: '100%', margin: 0, ...style }} />
  </div>;
};
