import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawBirder, drawBird, drawCard, drawBook, drawSceneLabel } from './birdKit';

// hero-new — YOLOE：三种提示亮出对应卡片，每只鸟都挂上名牌。
// 520x280 循环动画：提示图标轮换（卡片/照片/图鉴），四只鸟依次亮起名字。

const W = 520;
const H = 280;
const NAMES = ['白鹭', '翠鸟', '戴胜', '鸳鸯'];
const BODIES = [PALETTE.treeDark, PALETTE.blue, PALETTE.orange, PALETTE.purple];

export const HeroNew: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    // 轮换的提示道具：0=文本卡片 1=照片 2=图鉴
    const drawPromptIcon = (kind: number, x: number, y: number, t: number) => {
      ctx.save();
      ctx.strokeStyle = PALETTE.blue;
      ctx.lineWidth = 2;
      if (kind === 0) {
        drawCard(ctx, x, y, { lines: 3, w: 30, h: 22, glow: PALETTE.blue });
      } else if (kind === 1) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(x - 16, y - 2, 32, 24);
        ctx.strokeRect(x - 16, y - 2, 32, 24);
        drawBird(ctx, x - 2, y + 11, t, { body: PALETTE.orange });
      } else {
        drawBook(ctx, x, y + 18, t, { thick: 1.6, glow: PALETTE.green });
      }
      ctx.restore();
    };

    const render = (t: number) => {
      clearScene(ctx, W, H);

      // 观鸟者与轮换提示
      drawBirder(ctx, 70, 224);
      const kind = Math.floor(t / 1.4) % 3;
      drawPromptIcon(kind, 116, 196, t);
      drawSceneLabel(ctx, '任意类别', 92, 244, PALETTE.green);

      // 枝头四只鸟，名牌依次亮起并保持
      const cyc = (t % 5.6) / 1.4; // 0..4
      for (let i = 0; i < 4; i++) {
        const bx = 300 + i * 52;
        const by = 96 + (i % 2) * 44;
        const lit = cyc > i + 0.35;
        drawBird(ctx, bx, by, t + i, {
          state: lit ? 'named' : 'plain',
          body: BODIES[i],
          label: NAMES[i],
        });
      }
    };

    const tick = () => {
      render(performance.now() / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default HeroNew;
