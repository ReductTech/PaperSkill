import React, { useEffect, useRef } from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import { drawBloom, drawBook, drawMarket, drawPot, drawRing, drawTag, drawVendor, green, paint } from './flowerKit';

export const YwCoverNew: React.FC<{ chapterId: string; moduleId: string }> = () => {
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
      drawBloom(ctx, pot.x, h - 176, pot.kind, 0.72, pot.kind === 'pitcher' ? Math.max(0, progress - 0.25) : 0, 0);
    });
    const open = progress < 0.55 ? 1 : Math.max(0, 1 - (progress - 0.55) / 0.35);
    drawBook(ctx, 110, 118, open, open > 0.4 ? '文本编码器' : '已写入');
    if (progress > 0.28) {
      drawRing(ctx, w * 0.84, h - 150, green, 0.78);
      drawTag(ctx, w * 0.84, 78, '猪笼草', green);
    }
  }, [progress]);
  return <div style={{ width: '100%', height: '100%' }}><canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} /></div>;
};
