import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawSceneLabel, drawLegend, KQ, useKqCanvas } from './kq-kit';

const W = 1080;
const H = 280;
const N = 8;
const VAL = Array.from({ length: N * N }, (_, i) => {
  const c = i % N;
  return c === 2 || c === 5 ? 0.86 + (i % 3) * 0.04 : 0.12 + ((i * 7) % 15) / 100;
});
type Axis = 'token' | 'channel';

export const M2Layout: React.FC<WidgetProps> = () => {
  const [axis, setAxis] = useState<Axis>('token');
  const [pos, setPos] = useState(0);

  const ref = useKqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const gx = 90;
    const gy = 50;
    const cell = 24;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const v = VAL[r * N + c];
        const active = axis === 'token' ? r === pos : c === pos;
        ctx.fillStyle = active ? 'rgba(47,93,138,0.22)' : v > 0.6 ? 'rgba(192,69,63,0.14)' : KQ.card;
        ctx.fillRect(gx + c * cell, gy + r * cell, cell - 2, cell - 2);
        ctx.strokeStyle = c === 2 || c === 5 ? KQ.red : KQ.border;
        ctx.lineWidth = c === 2 || c === 5 ? 1.8 : 1;
        ctx.strokeRect(gx + c * cell, gy + r * cell, cell - 2, cell - 2);
      }
    }
    drawSceneLabel(ctx, gx, gy - 12, 'K / V 矩阵（8×8 示例）', KQ.ink, 13);
    drawSceneLabel(ctx, gx + 8 * cell + 40, 90, axis === 'token' ? '高亮一整行' : '高亮一整列', KQ.blue, 13);
    drawSceneLabel(ctx, gx + 8 * cell + 40, 118, axis === 'token' ? '按件压缩' : '按类别压缩', KQ.muted, 12);
    drawLegend(ctx, gx, 260, [
      { label: '普通', color: KQ.blue },
      { label: '离群列', color: KQ.red },
    ]);
  }, W, H);

  const text = axis === 'token' ? '按 token：每件单独压缩，误差留在该件内。' : '按 channel：同类一起压缩，离群类自己一个袋。';

  return (
    <div>
      <canvas id="cv-m2-layout" ref={ref} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${axis === 'token' ? 'selected' : ''}`} onClick={() => setAxis('token')}>
          按 token
        </button>
        <button className={`chip ${axis === 'channel' ? 'selected' : ''}`} onClick={() => setAxis('channel')}>
          按 channel
        </button>
      </div>
      <div className="ctrl">
        <label>
          检查位置 <span className="val">{pos}</span>
        </label>
        <input type="range" min={0} max={N - 1} value={pos} onChange={(e) => setPos(Number(e.target.value))} />
      </div>
      <div className="feedback">{text}</div>
    </div>
  );
};

export default M2Layout;
