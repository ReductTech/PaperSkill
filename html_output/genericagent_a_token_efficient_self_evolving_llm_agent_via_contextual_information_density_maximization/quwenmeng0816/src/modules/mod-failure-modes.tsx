import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, bar, clearScene, drawDesk, drawFlow, drawLabel, fillRR, startLoop, strokeRR } from './journalKit';

const W = 560;
const H = 300;
type Mode = 'position' | 'irrelevant' | 'effective';
const MODES: Record<Mode, { label: string; title: string; feedback: string; color: string }> = {
  position: {
    label: '位置偏差',
    title: '关键信息落在长序列中部',
    feedback: 'Lost in the Middle：同一证据位于上下文中部时，通常比位于开头或结尾更难被模型检索。',
    color: C.orange,
  },
  irrelevant: {
    label: '无关信息主动损害',
    title: '噪声与证据竞争注意力',
    feedback: '无关内容不是“放着不用”而已；它会转移有限注意力，使模型忽略决策关键证据。',
    color: C.red,
  },
  effective: {
    label: '有效窗口收缩',
    title: '可用长度远小于名义窗口',
    feedback: '标称窗口只表示可接收的最大序列；模型能够稳定利用的有效上下文通常明显更短。',
    color: C.blue,
  },
};

export const ModFailureModes: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ mode: Mode }>({ mode: 'position' });
  const [mode, setMode] = useState<Mode>('position');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startLoop(canvas, W, H, (ctx, now) => {
      const current = stateRef.current.mode;
      const d = MODES[current];
      clearScene(ctx, W, H);
      drawDesk(ctx, W, H);
      drawLabel(ctx, d.title, 28, 38, C.text, 15);

      if (current === 'position') {
        for (let i = 0; i < 13; i++) {
          const x = 28 + i * 38;
          const key = i === 6;
          fillRR(ctx, x, 82, 28, 54, 5, key ? C.orange : '#e2e8f0');
          drawLabel(ctx, key ? '证据' : `${i + 1}`, x + (key ? 3 : 8), 114, key ? '#fff' : C.muted, key ? 10 : 11);
        }
        drawFlow(ctx, { x: 270, y: 142 }, { x: 270, y: 196 }, now, C.orange, 2.8, 4);
        fillRR(ctx, 190, 196, 160, 42, 8, '#fffef8');
        strokeRR(ctx, 190, 196, 160, 42, 8, C.orange, 2);
        drawLabel(ctx, '中部证据检索变弱', 214, 222, C.orange, 12);
      } else if (current === 'irrelevant') {
        fillRR(ctx, 28, 74, 190, 126, 9, '#fffef8');
        strokeRR(ctx, 28, 74, 190, 126, 9, C.axis, 1.5);
        drawLabel(ctx, '输入上下文', 88, 98, C.text, 13);
        for (let i = 0; i < 16; i++) {
          const x = 46 + (i % 4) * 40;
          const y = 116 + Math.floor(i / 4) * 18;
          const key = i === 10;
          fillRR(ctx, x, y, 30, 10, 3, key ? C.green : C.red);
        }
        drawFlow(ctx, { x: 218, y: 138 }, { x: 304, y: 138 }, now, C.red, 3, 10);
        fillRR(ctx, 304, 92, 220, 92, 9, '#fffef8');
        strokeRR(ctx, 304, 92, 220, 92, 9, C.red, 2.5);
        drawLabel(ctx, '注意力被噪声分流', 340, 126, C.red, 14);
        drawLabel(ctx, '关键证据虽存在，决策仍可能失败', 326, 156, C.muted, 11);
      } else {
        drawLabel(ctx, '名义窗口', 28, 92, C.muted, 12);
        bar(ctx, 126, 78, 390, 22, 1, C.axis);
        drawLabel(ctx, '100%', 474, 94, C.muted, 11);
        drawLabel(ctx, '稳定可用区域', 28, 148, C.blue, 12);
        const pulse = 0.34 + 0.08 * Math.abs(Math.sin(now / 500));
        bar(ctx, 126, 134, 390, 22, pulse, C.blue);
        drawLabel(ctx, '明显更短', 276, 150, C.blue, 11);
        drawLabel(ctx, '能够放入 ≠ 能够可靠检索和推理', 164, 214, C.text, 13);
      }
    });
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {(Object.keys(MODES) as Mode[]).map((key) => (
          <button
            key={key}
            className={`chip ${mode === key ? 'selected' : ''}`}
            onClick={() => {
              stateRef.current.mode = key;
              setMode(key);
            }}
          >
            {MODES[key].label}
          </button>
        ))}
      </div>
      <div className="feedback">{MODES[mode].feedback}</div>
    </div>
  );
};
