import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawShelf, drawFolder, drawBar, drawSceneLabel, drawLegend, KV, useKvCanvas } from './kv-kit';

const W = 1080;
const H = 280;
const CTX = [1, 2, 4, 8, 16, 32, 64, 128];
const ROOM = 40;

export const M1Budget: React.FC<WidgetProps> = () => {
  const [idx, setIdx] = useState(3);
  const ctxK = CTX[idx];
  const kv16 = ctxK * 0.5;
  const kv2 = kv16 / 8;
  const total2 = kv2 + 14;

  const ref = useKvCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    drawShelf(ctx, 50, 60, 330, 150, 3);
    const filled = Math.min(1, (kv2 + 14) / ROOM);
    const n = Math.round(filled * 12);
    for (let i = 0; i < n; i++) {
      drawFolder(ctx, 64 + (i % 6) * 50, 68 + Math.floor(i / 6) * 48, 40, 34, {
        tone: kv16 + 14 > ROOM && i > 7 ? 'hot' : 'normal',
      });
    }
    drawSceneLabel(ctx, 50, 50, `档案室 ${ROOM}GB`, KV.ink, 13);
    const x0 = 520;
    const x1 = 1040;
    const sx = (v: number) => x0 + (v / 80) * (x1 - x0);
    ctx.strokeStyle = KV.orange;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(sx(ROOM), 50);
    ctx.lineTo(sx(ROOM), 210);
    ctx.stroke();
    drawBar(ctx, x0, 80, sx(80) - x0, 20, (kv16 + 14) / 80, kv16 + 14 > ROOM ? KV.red : KV.blue);
    drawBar(ctx, x0, 130, sx(80) - x0, 20, total2 / 80, total2 > ROOM ? KV.red : KV.green);
    drawSceneLabel(ctx, x0, 70, `FP16+权重 ${(kv16 + 14).toFixed(0)}GB`, KV.ink, 12);
    drawSceneLabel(ctx, x0, 120, `2bit+权重 ${total2.toFixed(1)}GB`, KV.ink, 12);
    drawLegend(ctx, x0, 235, [
      { label: 'FP16', color: KV.red },
      { label: '2bit', color: KV.green },
      { label: '容量', color: KV.orange },
    ]);
  }, W, H);

  const over = kv16 + 14 > ROOM;
  const text = over
    ? `上下文 ${ctxK}K：FP16 需要约 ${(kv16 + 14).toFixed(0)}GB，超过 ${ROOM}GB；2bit 只要 ${total2.toFixed(1)}GB。`
    : `上下文 ${ctxK}K：FP16 约 ${(kv16 + 14).toFixed(0)}GB，2bit 约 ${total2.toFixed(1)}GB，都放得下。`;

  return (
    <div>
      <canvas id="cv-m1-budget" ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          上下文长度 <span className="val">{ctxK}K</span>
        </label>
        <input type="range" min={0} max={CTX.length - 1} value={idx} onChange={(e) => setIdx(Number(e.target.value))} />
      </div>
      <div className={`feedback ${over ? 'bad' : 'good'}`}>{text}</div>
    </div>
  );
};

export default M1Budget;
