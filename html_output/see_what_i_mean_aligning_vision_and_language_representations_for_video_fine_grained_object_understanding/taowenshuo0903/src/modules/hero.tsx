import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawFlower, drawFocusRing, drawHeat, sceneLabel } from './kit';

// HeroFocus — the old-vs-new contrast shown in the Hero. `moduleId` is 'old' or 'new'.
// old: no alignment supervision, attention stays diffuse (red loose ring).
// new: SWIM aligns object nouns to their mask, attention lands sharp (green tight ring).

const W = 280;
const H = 150;

export const HeroFocus: React.FC<WidgetProps> = ({ moduleId }) => {
  const isNew = moduleId === 'new';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playingRef = useRef(false);
  const timeRef = useRef(0);
  const lastRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;
    const render = (t: number) => {
      clearScene(ctx, W, H);
      const fy = 96;
      const pulse = (t % 3) / 3;
      if (isNew) {
        // Same moving target and distractor as the classical side. The distinction is
        // the inference input: natural-language reference, no point/box/mask prompt.
        const cycle = (t % 4) / 4;
        const move = Math.min(1, cycle * 1.65);
        const targetX = 86 + move * 112;
        drawFlower(ctx, 224, 103, 0.72, 0.24);
        drawFlower(ctx, targetX, fy, 1.05, 0.98);
        drawHeat(ctx, targetX, fy - 20, 15 + Math.sin(pulse * Math.PI * 2) * 2, C.green, 0, 0, W, H);
        drawFocusRing(ctx, targetX, fy - 20, 22, 17, C.green, pulse);

        // A green trail shows that alignment is maintained throughout the motion.
        ctx.save();
        ctx.strokeStyle = 'rgba(47, 126, 88, .35)';
        ctx.setLineDash([3, 5]);
        ctx.beginPath(); ctx.moveTo(86, 76); ctx.lineTo(targetX - 12, 76); ctx.stroke();
        ctx.restore();
        sceneLabel(ctx, move < 0.12 ? '输入：纯自然语言指代' : '文本指代 → 对齐指定物体', 14, 14, C.green, 13);
        ctx.fillStyle = C.green;
        ctx.fillRect(195, 14, 71, 24);
        sceneLabel(ctx, '稳定锁定', 205, 18, '#fff', 12);
        sceneLabel(ctx, '推理时无需 point / box / mask', 14, 128, C.green, 12);
      } else {
        // Classical fine-grained methods can identify the target, but rely on explicit
        // point/box/mask prompts at inference (paper Fig. 1 and Sec. 1–2.2).
        const cycle = (t % 4) / 4;
        const move = Math.min(1, cycle * 1.65);
        const targetX = 86 + move * 112;
        drawFlower(ctx, 224, 103, 0.72, 0.28);
        drawFlower(ctx, targetX, fy, 1.05, 0.82);
        drawHeat(ctx, targetX, fy - 20, 23, C.orange, 0, 0, W, H);
        drawFocusRing(ctx, targetX, fy - 20, 25, 19, C.orange, pulse);

        // Explicit visual prompt travels with the selected region as an extra input.
        ctx.save();
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 2;
        ctx.strokeRect(targetX - 30, 48, 60, 72);
        ctx.setLineDash([]);
        ctx.fillStyle = C.orange;
        ctx.beginPath(); ctx.arc(targetX, 64, 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        sceneLabel(ctx, '输入：视频 + 额外视觉提示', 14, 14, C.orange, 13);
        ctx.fillStyle = C.orange;
        ctx.fillRect(183, 14, 83, 24);
        sceneLabel(ctx, '依赖额外输入', 192, 18, '#fff', 12);
        sceneLabel(ctx, '推理时需 point / box / mask', 14, 128, C.orange, 12);
      }
    };
    const tick = () => {
      const now = performance.now();
      if (!lastRef.current) lastRef.current = now;
      if (playingRef.current) timeRef.current += (now - lastRef.current) / 1000;
      lastRef.current = now;
      render(timeRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => cancelAnimationFrame(raf);
    const start = () => { raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => { stop(); disconnect(); };
  }, [isNew]);

  const toggle = () => {
    const next = !playingRef.current;
    // Every play starts from frame zero; pause simply freezes the current frame.
    if (next) timeRef.current = 0;
    playingRef.current = next;
    lastRef.current = performance.now();
    setPlaying(next);
  };

  return (
    <div className="hero-focus-demo">
      <canvas ref={canvasRef} width={W} height={H} aria-label={isNew ? 'SWIM 纯文本指代移动物体演示' : '传统方法依赖额外视觉提示演示'} />
      <button type="button" className="hero-animation-toggle" onClick={toggle} aria-pressed={!playing}>
        {playing ? '暂停动画' : '播放动画'}
      </button>
    </div>
  );
};

export default HeroFocus;
