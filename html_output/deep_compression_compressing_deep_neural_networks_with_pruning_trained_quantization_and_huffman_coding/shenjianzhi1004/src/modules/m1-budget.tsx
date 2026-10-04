import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import {
  clearScene,
  drawCard,
  drawAlbumFrame,
  drawPhotoTile,
  drawBar,
  drawSceneLabel,
  drawLegend,
  DC,
  useDcCanvas,
} from './dc-kit';

const W = 1080;
const H = 280;

export const M1Budget: React.FC<WidgetProps> = () => {
  const [budget, setBudget] = useState(240);

  const ref = useDcCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    // left: life view — storage card + album spilling
    drawCard(ctx, 40, 70, 130, 150, Math.min(1, 240 / budget));
    drawSceneLabel(ctx, 40, 60, '存储卡', DC.ink, 13);
    drawAlbumFrame(ctx, 210, 50, 270, 170, 240 / budget > 1);
    const n = Math.max(1, Math.min(12, Math.ceil(budget / 50)));
    for (let i = 0; i < n; i++) {
      drawPhotoTile(ctx, 222 + (i % 4) * 64, 62 + Math.floor(i / 4) * 54, 54, 46, {});
    }
    if (240 / budget > 1) {
      for (let k = 0; k < 2; k++) drawPhotoTile(ctx, 486, 80 + k * 60, 44, 44, { blur: true });
    }
    // right: technical bars
    const x0 = 600;
    const x1 = 1040;
    const scale = (v: number) => x0 + (v / 600) * (x1 - x0);
    const bx = scale(budget);
    ctx.strokeStyle = DC.orange;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(bx, 40);
    ctx.lineTo(bx, 238);
    ctx.stroke();
    drawBar(ctx, x0, 66, x1 - x0, 20, 240 / 600, budget >= 240 ? DC.green : DC.red);
    drawBar(ctx, x0, 116, x1 - x0, 20, 552 / 600, budget >= 552 ? DC.green : DC.red);
    const sx = scale(12);
    ctx.strokeStyle = DC.green;
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, 40);
    ctx.lineTo(sx, 238);
    ctx.stroke();
    ctx.setLineDash([]);
    drawLegend(ctx, x0, 262, [
      { label: '预算', color: DC.orange },
      { label: '模型', color: DC.blue },
      { label: 'SRAM', color: DC.green },
    ]);
  }, W, H);

  const cls = budget < 240 ? 'bad' : 'good';
  const text =
    budget <= 12
      ? `预算 ${budget}MB：压到十几 MB（论文做到 6.9MB / 11.3MB）就能放进片上 SRAM，省掉 640pJ 的 DRAM 访问。`
      : budget < 240
      ? `预算 ${budget}MB 装不下 AlexNet（240MB），相册溢出。`
      : budget < 552
      ? `AlexNet 能放下，VGG-16 还溢出 ${552 - budget}MB。`
      : `两款都能放下，但仍远高于片上 SRAM。`;

  return (
    <div>
      <canvas id="cv-m1-budget" ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          存储预算 <span className="val">{budget} MB</span>
        </label>
        <input
          type="range"
          min={1}
          max={600}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
        />
      </div>
      <div className={`feedback ${budget > 12 && cls === 'bad' ? 'bad' : budget <= 12 ? 'good' : ''}`}>{text}</div>
    </div>
  );
};

export default M1Budget;
