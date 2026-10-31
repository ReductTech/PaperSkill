import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, drawLegend, LI, useLiCanvas } from './li-kit';

const W = 1080;
const H = 280;
type Hw = 'a100-80' | 'a100-40' | '3090-8' | '3090-4' | 'colab';
const DATA: Record<Hw, { name: string; int8: number; fp16: number; int8R: number; fp16R: number }> = {
  'a100-80': { name: '8×A100 80GB', int8: 175, fp16: 175, int8R: 1, fp16R: 1 },
  'a100-40': { name: '8×A100 40GB', int8: 175, fp16: 66, int8R: 1, fp16R: 0.38 },
  '3090-8': { name: '8×RTX 3090 24GB', int8: 175, fp16: 66, int8R: 1, fp16R: 0.38 },
  '3090-4': { name: '4×RTX 3090 24GB', int8: 66, fp16: 30, int8R: 0.38, fp16R: 0.17 },
  colab: { name: 'Colab Pro 15GB', int8: 13, fp16: 6, int8R: 0.08, fp16R: 0.04 },
};

export const M9Hardware: React.FC<WidgetProps> = () => {
  const [hw, setHw] = useState<Hw>('a100-40');
  const d = DATA[hw];

  const ref = useLiCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    drawSceneLabel(ctx, 70, 70, d.name, LI.ink, 15);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i < (hw === '3090-4' ? 4 : hw === 'colab' ? 1 : 8) ? LI.floorDark : LI.border;
      ctx.fillRect(70 + i * 40, 90, 30, 50);
    }
    drawBar(ctx, 520, 90, 480, 22, d.int8R, LI.green);
    drawBar(ctx, 520, 140, 480, 22, d.fp16R, LI.red);
    drawSceneLabel(ctx, 520, 80, `8 位：${d.int8}B`, LI.green, 13);
    drawSceneLabel(ctx, 520, 130, `16 位：${d.fp16}B`, LI.red, 13);
    drawLegend(ctx, 520, 230, [
      { label: '8 位', color: LI.green },
      { label: '16 位', color: LI.red },
    ]);
  }, W, H);

  return (
    <div>
      <canvas id="cv-m9-hardware" ref={ref} width={W} height={H} />
      <div className="chip-row">
        {(['a100-80', 'a100-40', '3090-8', '3090-4', 'colab'] as Hw[]).map((k) => (
          <button key={k} className={`chip ${hw === k ? 'selected' : ''}`} onClick={() => setHw(k)}>
            {DATA[k].name}
          </button>
        ))}
      </div>
      <div className="feedback good">8 位能跑 {d.int8}B，16 位只能到 {d.fp16}B。</div>
    </div>
  );
};

export default M9Hardware;
