import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, clearScene, drawDesk, drawJournal, drawStamp, drawLabel, bar, startLoop } from './journalKit';

const W = 560;
const H = 260;

export const ModStuffing: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ clutter: 0.2 });
  const [clutter, setClutter] = useState(0.2);
  const fb =
    clutter < 0.35
      ? { text: '当前目标、约束和下一步仍清晰可见。', cls: 'good' }
      : clutter > 0.7
        ? { text: '活动任务状态被历史盖住——这就是上下文爆炸。', cls: 'bad' }
        : { text: '原始工具日志开始竞争位置，关键状态逐渐变淡。', cls: '' };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startLoop(canvas, W, H, (ctx) => {
      const c = stateRef.current.clutter;
      clearScene(ctx, W, H);
      drawDesk(ctx, W, H);
      drawJournal(ctx, 24, 20, 340, 188, c, 1 - c * 0.95);
      drawStamp(ctx, 320, 170, c < 0.4);
      drawLabel(ctx, '上下文占用', 390, 46, C.muted, 12);
      bar(ctx, 390, 56, 22, 150, c, c > 0.7 ? C.red : c < 0.35 ? C.green : C.blue);
      drawLabel(ctx, `${Math.round(c * 100)}%`, 418, 130, C.text, 13);
      drawLabel(ctx, '越满，决策状态越难检索', 390, 228, C.muted, 11);
    });
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          继续注入原始日志 <span className="val">{Math.round(clutter * 100)}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(clutter * 100)}
          onChange={(e) => {
            const v = Number(e.target.value) / 100;
            stateRef.current.clutter = v;
            setClutter(v);
          }}
        />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
