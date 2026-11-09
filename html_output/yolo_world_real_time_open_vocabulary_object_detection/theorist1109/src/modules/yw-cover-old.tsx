import React, { useEffect, useRef } from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import { blue, drawBloom, drawCard, drawMarket, drawPot, drawRing, drawVendor, paint, red } from './flowerKit';

export const YwCoverOld: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const { progress } = useCoverPlayback();
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    const w = Math.max(300, parent.clientWidth);
    const h = Math.max(180, Math.min(parent.clientHeight || 280, 360));
    const ctx = paint(canvas, w, h);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    drawMarket(ctx, w, h);
    drawVendor(ctx, 86, h - 128);
    const pots: Array<{ x: number; kind: 'rose' | 'fern' | 'pitcher' }> = [
      { x: w * 0.4, kind: 'rose' },
      { x: w * 0.62, kind: 'fern' },
      { x: w * 0.84, kind: 'pitcher' },
    ];
    pots.forEach((pot) => {
      drawPot(ctx, pot.x, h - 132, 0.78);
      drawBloom(ctx, pot.x, h - 176, pot.kind, 0.72, 0, 0);
    });
    drawCard(ctx, 24, 64, ['印刷卡', '玫瑰', '蕨', '向日葵'], blue);
    if (progress > 0.28) {
      drawRing(ctx, w * 0.84, h - 150, red, 0.78);
      ctx.fillStyle = red;
      ctx.font = '800 28px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('不在卡片上', w * 0.84, 86);
    }
  }, [progress]);
  return <div style={{ width: '100%', height: '100%' }}><canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} /></div>;
};
