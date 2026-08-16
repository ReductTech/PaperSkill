import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, clearScene, drawDesk, drawJournal, drawCard, drawLabel, bar, drawFlow, startLoop } from './journalKit';

const W = 560;
const H = 260;
type Cfg = 'none' | 'full' | 'redundant' | 'condensed';
const DATA: Record<Cfg, { label: string; tokens: number; tsr: number; text: string; cls: string; title: string; sub: string; color: string }> = {
  none: { label: '无记忆', tokens: 0, tsr: 13.87, text: '没有外部流程记忆，成功率只有 13.87%。', cls: 'bad', title: '空索引', sub: '每次从零摸索', color: C.red },
  full: { label: '全文 SOP', tokens: 575, tsr: 52.44, text: '全文 SOP 有用，但 575 token 里夹着定义和套话。', cls: '', title: '完整流程文档', sub: '575 token', color: C.blue },
  redundant: { label: '冗余记忆', tokens: 288, tsr: 66.48, text: '288 token 提到 66.48%，额外背景没有继续提高成功率。', cls: '', title: '带背景规则', sub: '288 token', color: C.orange },
  condensed: { label: '浓缩记忆', tokens: 165, tsr: 66.48, text: '165 token 同样达到 66.48%：密度比体积更重要。', cls: 'good', title: '决策规则', sub: '165 token', color: C.green },
};

export const ModMemory: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ cfg: Cfg }>({ cfg: 'none' });
  const [cfg, setCfg] = useState<Cfg>('none');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startLoop(canvas, W, H, (ctx, now) => {
      const d = DATA[stateRef.current.cfg];
      clearScene(ctx, W, H);
      drawDesk(ctx, W, H);
      drawJournal(ctx, 18, 16, 200, 188, 0, 0.15);
      drawCard(ctx, 48, 70, 150, 70, d.color, d.title, d.sub);
      if (d.tokens > 0) {
        drawFlow(ctx, { x: 198, y: 105 }, { x: 248, y: 58 }, now, d.color, 2.5, 18);
      }
      drawLabel(ctx, '记忆体积（越低越省）', 240, 40, C.muted, 12);
      bar(ctx, 240, 50, 290, 16, d.tokens / 575, d.tokens > 400 ? C.red : d.tokens === 0 ? C.muted : C.blue);
      drawLabel(ctx, `${d.tokens} token`, 240, 86, C.text, 13);
      drawLabel(ctx, '成功率 TSR（越高越好）', 240, 118, C.muted, 12);
      bar(ctx, 240, 128, 290, 16, d.tsr / 100, d.tsr < 20 ? C.red : d.tsr > 60 ? C.green : C.blue);
      drawLabel(ctx, `${d.tsr}%  · SOP-Bench dangerous_goods · GPT-5.4`, 240, 168, C.muted, 11);
    });
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {(Object.keys(DATA) as Cfg[]).map((k) => (
          <button
            key={k}
            className={`chip ${cfg === k ? 'selected' : ''}`}
            onClick={() => {
              stateRef.current.cfg = k;
              setCfg(k);
            }}
          >
            {DATA[k].label}
          </button>
        ))}
      </div>
      <div className={`feedback ${DATA[cfg].cls}`}>{DATA[cfg].text}</div>
    </div>
  );
};
