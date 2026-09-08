import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, bar, clearScene, drawDesk, drawLabel, fillRR, startLoop, strokeRR } from './journalKit';

const W = 560;
const H = 285;
const DIMENSIONS = [
  { id: 'task', label: '任务完成与成本', evidence: 'Lifelong：GA 100% / 241k；Claude Code 75% / 814k', value: 1, color: C.blue },
  { id: 'tool', label: '工具效率', evidence: '长程五任务：GA 100% / 188,829 token / 12.8 次工具调用', value: 0.8, color: C.green },
  { id: 'memory', label: '记忆有效性', evidence: '20 技能后 Full prompt：GA 2,298；其他系统 22,821–43,321', value: 0.72, color: C.purple },
  { id: 'evolve', label: '自我演化', evidence: '九轮轨迹：222,203 → 23,010 token，下降 89.6%', value: 0.896, color: C.orange },
  { id: 'web', label: '网页浏览', evidence: 'BrowseComp-ZH：0.60 / 0.47M；OpenClaw 0.20 / 1.31M', value: 0.6, color: C.red },
] as const;
type Dimension = (typeof DIMENSIONS)[number]['id'];

export const ModEvalMap: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ id: Dimension }>({ id: 'task' });
  const [id, setId] = useState<Dimension>('task');
  const current = DIMENSIONS.find((item) => item.id === id)!;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startLoop(canvas, W, H, (ctx) => {
      const selected = DIMENSIONS.find((item) => item.id === stateRef.current.id)!;
      clearScene(ctx, W, H);
      drawDesk(ctx, W, H);
      DIMENSIONS.forEach((item, i) => {
        const y = 30 + i * 40;
        const on = item.id === selected.id;
        fillRR(ctx, 24, y, 154, 30, 7, on ? item.color : '#fffef8');
        strokeRR(ctx, 24, y, 154, 30, 7, on ? C.orange : C.axis, on ? 3 : 1.5);
        drawLabel(ctx, item.label, 38, y + 20, on ? '#fff' : C.text, 12);
      });
      drawLabel(ctx, '论文证据摘要', 214, 48, C.text, 15);
      const words = selected.evidence.split('；');
      words.forEach((line, i) => drawLabel(ctx, line, 214, 84 + i * 24, selected.color, 13));
      drawLabel(ctx, '归一化视觉提示（不可跨协议直接比较）', 214, 148, C.muted, 11);
      bar(ctx, 214, 164, 308, 20, selected.value, selected.color);
      drawLabel(ctx, '每一项都必须连同模型、任务集、样本数和指标方向一起解释。', 214, 214, C.muted, 11);
    });
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {DIMENSIONS.map((item) => (
          <button
            key={item.id}
            className={`chip ${id === item.id ? 'selected' : ''}`}
            onClick={() => {
              stateRef.current.id = item.id;
              setId(item.id);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="feedback">{current.evidence}</div>
    </div>
  );
};
