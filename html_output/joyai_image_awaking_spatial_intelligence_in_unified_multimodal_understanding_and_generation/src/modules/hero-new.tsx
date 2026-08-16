import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 380;
const H = 230;
const BG = '#fffaf1';
const INK = '#222222';
const PINK = '#ff3366';
const BLUE = '#33ccff';
const YELLOW = '#ffcc00';
const PURPLE = '#9933ff';

const parts = [
  { title: 'MLLM', detail: '理解场景与指令', color: BLUE },
  { title: 'VAE', detail: '连接像素与潜空间', color: YELLOW },
  { title: 'MMDiT', detail: '执行生成与编辑', color: PINK },
];

export const HeroNew: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const selectedRef = useRef(-1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const pathFor = (index: number, dx = 0, dy = 0) => {
      const p = new Path2D();
      if (index === 0) {
        // 上层与下层共享同一条边；中央凸榫完整落入下方两块的凹口。
        p.moveTo(122 + dx, 35 + dy); p.lineTo(258 + dx, 35 + dy); p.quadraticCurveTo(272 + dx, 35 + dy, 272 + dx, 49 + dy);
        p.lineTo(272 + dx, 92 + dy); p.lineTo(210 + dx, 92 + dy); p.lineTo(210 + dx, 108 + dy);
        p.lineTo(170 + dx, 108 + dy); p.lineTo(170 + dx, 92 + dy); p.lineTo(108 + dx, 92 + dy);
        p.lineTo(108 + dx, 49 + dy); p.quadraticCurveTo(108 + dx, 35 + dy, 122 + dx, 35 + dy); p.closePath();
      } else if (index === 1) {
        p.moveTo(108 + dx, 92 + dy); p.lineTo(170 + dx, 92 + dy); p.lineTo(170 + dx, 108 + dy);
        p.lineTo(182 + dx, 108 + dy); p.lineTo(182 + dx, 126 + dy); p.lineTo(170 + dx, 126 + dy);
        p.lineTo(170 + dx, 151 + dy); p.lineTo(122 + dx, 151 + dy); p.quadraticCurveTo(108 + dx, 151 + dy, 108 + dx, 137 + dy); p.closePath();
      } else {
        p.moveTo(210 + dx, 92 + dy); p.lineTo(272 + dx, 92 + dy); p.lineTo(272 + dx, 137 + dy);
        p.quadraticCurveTo(272 + dx, 151 + dy, 258 + dx, 151 + dy); p.lineTo(170 + dx, 151 + dy);
        p.lineTo(170 + dx, 126 + dy); p.lineTo(182 + dx, 126 + dy); p.lineTo(182 + dx, 108 + dy);
        p.lineTo(210 + dx, 108 + dy); p.closePath();
      }
      return p;
    };

    const offsets = (index: number, t: number) => {
      if (selectedRef.current !== index) return { x: 0, y: 0 };
      const pulse = 2 + Math.sin(t / 260) * 1.5;
      return index === 0 ? { x: 0, y: -pulse } : index === 1 ? { x: -pulse, y: pulse } : { x: pulse, y: pulse };
    };

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);

      parts.forEach((part, index) => {
        const o = offsets(index, t); const shadow = pathFor(index, o.x + 7, o.y + 7); const path = pathFor(index, o.x, o.y);
        ctx.fillStyle = INK; ctx.fill(shadow);
        ctx.fillStyle = part.color; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.fill(path); ctx.stroke(path);
        ctx.globalAlpha = selectedRef.current < 0 || selectedRef.current === index ? 1 : .72;
        ctx.fillStyle = index === 1 ? INK : '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '900 15px "Segoe UI", sans-serif';
        const tx = index === 0 ? 190 : index === 1 ? 137 : 223;
        const ty = index === 0 ? 57 : 121;
        ctx.fillText(part.title, tx + o.x, ty + o.y);
        ctx.font = '10px "Segoe UI", sans-serif';
        if (index === 0) ctx.fillText('视觉语言中枢', tx + o.x, ty + 18 + o.y);
        else if (index === 1) ctx.fillText('桥', tx + o.x, ty + 18 + o.y);
        else ctx.fillText('16B 生成核心', tx + o.x, ty + 18 + o.y);
        ctx.globalAlpha = 1;
      });

      const active = selectedRef.current < 0
        ? { title: '统一框架', detail: '三块归位后形成一套系统', color: PURPLE }
        : parts[selectedRef.current];
      ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(74, 184, 232, 31, 15); ctx.fill(); ctx.stroke();
      ctx.fillStyle = active.color; ctx.beginPath(); ctx.arc(91, 199.5, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = INK; ctx.font = '800 12px "Segoe UI", sans-serif'; ctx.textAlign = 'left'; ctx.fillText(active.title, 104, 196);
      ctx.fillStyle = '#49434c'; ctx.font = '600 10px "Segoe UI", sans-serif'; ctx.fillText(active.detail, 104, 207);
    };

    const onClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * W / rect.width;
      const y = (event.clientY - rect.top) * H / rect.height;
      let next = -1;
      if (y < 93 && x > 98 && x < 282) next = 0;
      else if (x < 182 && y > 78 && y < 165) next = 1;
      else if (x >= 170 && y > 78 && y < 165) next = 2;
      selectedRef.current = selectedRef.current === next ? -1 : next;
    };
    canvas.addEventListener('click', onClick);

    const tick = () => { render(performance.now()); canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); canvas.removeEventListener('click', onClick); };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} style={{ cursor: 'pointer' }} aria-label="点击查看统一框架中三个相互嵌合的组件" />;
};

export default HeroNew;
