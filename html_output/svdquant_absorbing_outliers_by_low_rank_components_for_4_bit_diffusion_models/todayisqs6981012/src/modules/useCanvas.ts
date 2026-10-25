import { useEffect, useRef } from 'react';
import { setupCanvas } from '../lib/canvasKit';

// 事件驱动的 Canvas hook：每次状态变化时重绘一次（无依赖数组）。
// 适合「滑块 / 按钮 / 步骤 / 进度」驱动的技术图形；需要连续动画的模块
// 用 setInterval 驱动 state 即可触发重绘。
export function useCanvas(W: number, H: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    draw(ctx);
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  });
  return ref;
}
