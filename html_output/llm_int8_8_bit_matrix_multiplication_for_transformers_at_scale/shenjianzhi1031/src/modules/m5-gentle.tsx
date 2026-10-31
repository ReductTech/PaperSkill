import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBasin, drawGarment, drawBar, drawSceneLabel, LI, useLiCanvas } from './li-kit';

const W = 1080;
const H = 280;

export const M5Gentle: React.FC<WidgetProps> = () => {
  const [x, setX] = useState(0.2);
  const areaRef = useRef<HTMLDivElement>(null);
  const inGentle = x > 0.5;
  const err = inGentle ? 0.01 : 0.25;

  const ref = useLiCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    drawBasin(ctx, 70, 90, 340, 130, { fill: 0.6 });
    drawBasin(ctx, 620, 100, 280, 116, { fill: 0.4, highlight: true });
    drawSceneLabel(ctx, 70, 80, '主盆（8 位）', LI.green, 13);
    drawSceneLabel(ctx, 620, 90, '轻柔盆（16 位）', LI.purple, 13);
    const gx = 130 + x * 560;
    drawGarment(ctx, gx, 120, 80, 58, { big: true });
    drawBar(ctx, 70, 236, 900, 16, err / 0.3, inGentle ? LI.green : LI.red);
    drawSceneLabel(ctx, 70, 228, `误差 ${err.toFixed(2)}`, inGentle ? LI.green : LI.red, 12);
  }, W, H);

  const setFromClientX = (clientX: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setX(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)));
  };

  const text = inGentle
    ? '16 位单独算，误差几乎消失。'
    : '8 位算这个离群维度，误差大。';

  return (
    <div>
      <div
        ref={areaRef}
        style={{ cursor: 'grab' }}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          setFromClientX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) setFromClientX(e.clientX);
        }}
      >
        <canvas id="cv-m5-gentle" ref={ref} width={W} height={H} />
      </div>
      <div className="step-ctrl">
        <button className="tiny" onClick={() => setX(inGentle ? 0.2 : 0.8)}>
          {inGentle ? '放回主盆' : '拖到轻柔盆'}
        </button>
      </div>
      <div className={`feedback ${inGentle ? 'good' : 'bad'}`}>{text}</div>
    </div>
  );
};

export default M5Gentle;
