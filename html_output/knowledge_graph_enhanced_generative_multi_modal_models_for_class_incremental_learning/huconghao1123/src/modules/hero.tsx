import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C,
  clearScene,
  drawBag,
  drawIndexCard,
  drawLabel,
  drawLegend,
  drawTag,
  drawVase,
  withAlpha,
  roundRect,
  type Ctx,
} from './scene';

const W = 1080;
const H = 220;

function usePanel(draw: (ctx: Ctx, t: number) => void) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: Ctx;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      draw(ctx, (now / 3200) % 1);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
}

/** Old practice: one bag, three look-alike鉴定卡, no way to tell which is the exhibit. */
const oldPanel = (ctx: Ctx, t: number) => {
  clearScene(ctx, W, H);
  drawBag(ctx, 60, 74, 92, 84, C.envLight);
  drawVase(ctx, 106, 116, 1.05, withAlpha(C.envLight, 0.9));
  const pulse = 0.03 * Math.sin(t * Math.PI * 2);
  const sims = [0.57 + pulse, 0.67 + pulse, 0.51 + pulse];
  for (let i = 0; i < 3; i++) {
    const x = 330 + i * 190;
    drawIndexCard(ctx, x, 70, 150, 96, { border: C.red, lines: 2 });
    drawLabel(ctx, x + 12, 88, '鉴定卡', C.muted, 12);
    const bw = 118 * sims[i];
    ctx.save();
    ctx.fillStyle = withAlpha(C.red, 0.18);
    roundRect(ctx, x + 16, 130, 118, 10, 5);
    ctx.fill();
    ctx.fillStyle = withAlpha(C.red, 0.85);
    roundRect(ctx, x + 16, 130, Math.max(4, bw), 10, 5);
    ctx.fill();
    ctx.restore();
  }
  drawLabel(ctx, 900, 82, '青花缠枝瓶', C.red, 18);
  drawLegend(ctx, 330, 190, [
    { text: '几乎一样', color: C.red },
    { text: '只按大类', color: C.muted },
  ]);
};

/** Paper method: three clue tags, votes on the case cards, the exhibit pinned down. */
const newPanel = (ctx: Ctx, t: number) => {
  clearScene(ctx, W, H);
  drawBag(ctx, 60, 74, 92, 84, C.envLight);
  drawVase(ctx, 106, 116, 1.05, withAlpha(C.envLight, 0.9));
  drawTag(ctx, 196, 44, 84, 24, '窑口', C.blue);
  drawTag(ctx, 196, 78, 84, 24, '底款', C.blue);
  drawTag(ctx, 196, 112, 84, 24, '尺寸', C.blue);
  const cards = [
    { x: 560, vote: 2, hit: true },
    { x: 700, vote: 1, hit: false },
    { x: 840, vote: 1, hit: false },
    { x: 980, vote: 0, hit: false },
  ];
  cards.forEach((c) => {
    drawIndexCard(ctx, c.x, 70, 100, 92, { border: c.hit ? C.green : C.border, lines: 2 });
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(c.x + 16 + i * 11, 146, 3.4, 0, Math.PI * 2);
      ctx.fillStyle = i < c.vote ? C.green : withAlpha(C.border, 0.9);
      ctx.fill();
      ctx.restore();
    }
  });
  drawLabel(ctx, 566, 40, '青花缠枝瓶', C.green, 18);
  drawLegend(ctx, 560, 196, [
    { text: '票数', color: C.green },
    { text: '三条线索', color: C.blue },
  ]);
  void t;
};

export const HeroOld: React.FC<WidgetProps> = () => {
  const ref = usePanel(oldPanel);
  return <canvas ref={ref} width={W} height={H} aria-label="旧做法：只按大类比对鉴定卡" />;
};

export const HeroNew: React.FC<WidgetProps> = () => {
  const ref = usePanel(newPanel);
  return <canvas ref={ref} width={W} height={H} aria-label="新做法：三条线索加票数锁定证物" />;
};
