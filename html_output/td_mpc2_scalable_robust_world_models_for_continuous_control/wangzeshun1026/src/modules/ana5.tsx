import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  GUIDE,
  EMPH,
  AUX,
  INK,
  LINE,
  clearScene,
  drawTable,
  drawBall,
  drawPocket,
  drawSceneLabel,
  drawLegend,
  seeded,
} from './billiardsKit';
import type { WidgetProps } from './registry';

// 隐喻动画：上场先看一眼这是哪种球台。
// 一张球台、一块任务牌；球滚入场内，牌上的嵌入与动作维度随场景切换。
const W = 560;
const H = 140;
const SCENE_MS = 800;

interface SceneBall {
  x: number;
  y: number;
  color: string;
}

interface SceneSpec {
  balls: SceneBall[];
  dims: number;
}

const SCENES: SceneSpec[] = [
  { balls: [{ x: 210, y: 60, color: '#8c7a5f' }, { x: 245, y: 88, color: '#5f6d7c' }], dims: 6 },
  {
    balls: [
      { x: 180, y: 54, color: '#8c7a5f' },
      { x: 220, y: 88, color: '#c2a878' },
      { x: 250, y: 62, color: '#e9e2cf' },
    ],
    dims: 4,
  },
  {
    balls: [
      { x: 190, y: 72, color: '#5f6d7c' },
      { x: 230, y: 56, color: '#8c7a5f' },
      { x: 250, y: 90, color: '#c2a878' },
    ],
    dims: 8,
  },
  {
    balls: [
      { x: 170, y: 62, color: '#e9e2cf' },
      { x: 205, y: 90, color: '#5f6d7c' },
      { x: 235, y: 58, color: '#8c7a5f' },
      { x: 255, y: 82, color: '#c2a878' },
    ],
    dims: 12,
  },
];

export const Ana5: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const embeddings: number[][] = [];
    for (let s = 0; s < SCENES.length; s++) {
      const rnd = seeded(700 + s * 37);
      const raw: number[] = [];
      for (let i = 0; i < 96; i++) raw.push(rnd() * 2 - 1);
      let norm = 0;
      for (const v of raw) norm += v * v;
      norm = Math.sqrt(norm) || 1;
      embeddings.push(raw.map((v) => v / norm));
    }

    const wrnd = seeded(991);
    const weightAlpha: number[] = [];
    for (let i = 0; i < 16; i++) weightAlpha.push(0.2 + wrnd() * 0.75);

    const t0 = performance.now();

    const render = (now: number) => {
      const elapsed = now - t0;
      const sceneIndex = Math.floor(elapsed / SCENE_MS) % SCENES.length;
      const local = (elapsed % SCENE_MS) / SCENE_MS;
      const scene = SCENES[sceneIndex];

      clearScene(ctx, W, H);
      drawTable(ctx, 24, 38, 250, 72);
      drawPocket(ctx, 266, 71, 6);

      // 唯一的活动主体：母球滚入场内
      const cueX = lerp(8, 62, clamp(local / 0.38, 0, 1));
      drawBall(ctx, cueX, 71, 7, '#f3f0e4', true);
      for (const b of scene.balls) drawBall(ctx, b.x, b.y, 6, b.color, false);

      // 任务牌
      ctx.fillStyle = 'rgba(255,255,255,0.76)';
      ctx.fillRect(300, 32, 236, 78);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(300.75, 32.75, 234.5, 76.5);

      const vals = embeddings[sceneIndex];
      let maxAbs = 0.0001;
      for (const v of vals) maxAbs = Math.max(maxAbs, Math.abs(v));
      for (let i = 0; i < 96; i++) {
        const col = i % 16;
        const row = Math.floor(i / 16);
        const v = vals[i];
        ctx.globalAlpha = 0.16 + 0.84 * (Math.abs(v) / maxAbs);
        ctx.fillStyle = v >= 0 ? AUX : GUIDE;
        ctx.fillRect(310 + col * 9, 40 + row * 9, 8, 8);
      }

      // 同一套权重：图案固定不变
      for (let i = 0; i < 16; i++) {
        const col = i % 4;
        const row = Math.floor(i / 4);
        ctx.globalAlpha = weightAlpha[i];
        ctx.fillStyle = INK;
        ctx.fillRect(468 + col * 13, 42 + row * 13, 10, 10);
      }

      // 动作维度：有效维度数随任务变化
      for (let i = 0; i < 12; i++) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = i < scene.dims ? EMPH : LINE;
        ctx.fillRect(310 + i * 12, 97, 8, 7);
      }

      ctx.globalAlpha = 1;
      drawSceneLabel(ctx, '换一张球台', 24, 22, INK);
      drawSceneLabel(ctx, '先看任务牌', 300, 22, INK);
      drawLegend(
        ctx,
        [
          { color: AUX, text: '嵌入' },
          { color: INK, text: '权重' },
          { color: EMPH, text: '动作维度' },
        ],
        24,
        132
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(performance.now());
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ana5;
