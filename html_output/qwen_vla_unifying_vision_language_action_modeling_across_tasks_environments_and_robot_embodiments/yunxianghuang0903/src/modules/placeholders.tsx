import React, { useRef, useState } from 'react';
import { C, fillBg } from './sharedDraw';
import { useResponsiveCanvas } from './usePaperCanvas';
import { PsSliderRow, PsFeedback } from '../components/ps-controls';
import { CanvasStage } from '../components/ps-controls';
import type { WidgetProps } from './registry';

export function makePlaceholderMod(title: string): React.FC<WidgetProps> {
  const Component: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [v, setV] = useState(50);

    useResponsiveCanvas(
      containerRef,
      canvasRef,
      200 / 560,
      (ctx, w, h) => {
        fillBg(ctx, w, h);
        const t = v / 100;
        const cols = 12;
        for (let i = 0; i < cols; i++) {
          const on = i / cols < t;
          ctx.fillStyle = on ? C.green : C.border;
          ctx.fillRect(24 + i * ((w - 48) / cols), h * 0.25, (w - 48) / cols - 4, h * 0.5);
        }
      },
      [v]
    );

    return (
      <div>
        <CanvasStage aspectW={560} aspectH={200}>
          <div ref={containerRef} className="canvas-stage-inner">
            <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} />
          </div>
        </CanvasStage>
        <div className="ps-controls-row">
          <PsSliderRow label="交互参数" value={v} min={0} max={100} display={`${v}%`} onChange={setV} />
        </div>
        <PsFeedback tone="neutral">{title} — 拖动滑块观察 grid 变化。</PsFeedback>
      </div>
    );
  };
  return Component;
}

export const Ch2Mod2Placeholder = makePlaceholderMod('掩码实验室');
export const Ch3Mod2Placeholder = makePlaceholderMod('本体提示构造器');
export const Ch4Mod2Placeholder = makePlaceholderMod('流匹配实验室');
export const Ch4Mod3Placeholder = makePlaceholderMod('欧拉积分步进器');
export const Ch5Mod2Placeholder = makePlaceholderMod('从一句话到一串动作');
export const Ch5Mod3Placeholder = makePlaceholderMod('预训练数据混合');
export const Ch6Mod2Placeholder = makePlaceholderMod('OOD 压力测试');
export const Ch6Mod3Placeholder = makePlaceholderMod('迁移能力卡片');
