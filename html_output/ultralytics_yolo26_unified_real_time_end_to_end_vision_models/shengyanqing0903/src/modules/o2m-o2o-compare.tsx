import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, box, clear, dot, label, metric } from './yolo-shared';

type Mode = 'o2m' | 'o2o';
const W = 720;
const H = 380;

export const O2mO2oCompare: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>('o2m');

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    clear(ctx, W, H);
    const active = mode === 'o2m' ? 4 : 1;
    label(ctx, mode === 'o2m' ? 'One to many：多个点共同学习' : 'One to one：一个点承担主要责任', 30, 34, mode === 'o2m' ? C.red : C.green, 17, 700);
    ctx.fillStyle = '#fff';
    ctx.fillRect(28, 58, 450, 260);

    const target = { x: 220, y: 125, w: 120, h: 92 };
    box(ctx, target.x, target.y, target.w, target.h, C.green);
    ctx.fillStyle = C.light;
    ctx.beginPath();
    ctx.ellipse(280, 170, 36, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    const points = [[245, 150], [275, 150], [305, 150], [275, 185]];
    points.forEach(([x, y], index) => {
      const selected = index < active;
      dot(ctx, x, y, selected ? (mode === 'o2m' ? C.red : C.green) : C.border, selected ? 6 : 4);
      if (selected) box(ctx, target.x + (index - 1.5) * 7, target.y + (index % 2) * 4, target.w, target.h, mode === 'o2m' ? C.red : C.green);
    });

    metric(ctx, 505, 76, 185, '高置信候选', String(active), mode === 'o2m' ? C.red : C.green);
    metric(ctx, 505, 144, 185, '分类目标值', mode === 'o2m' ? '4 个 > 0' : '1 个 > 0', mode === 'o2m' ? C.red : C.green);
    metric(ctx, 505, 212, 185, 'NMS', mode === 'o2m' ? '需要' : '不需要', mode === 'o2m' ? C.red : C.green);
    label(ctx, mode === 'o2m' ? '多个正样本学习同一标注框' : '其余位置的分类目标值为 0', 44, 300, C.muted, 12, 600);
    canvas.classList.add('is-ready');
  }, [mode]);

  return (
    <div>
      <canvas ref={ref} width={W} height={H} aria-label="一对多与一对一训练分配比较" />
      <div className="ctrl">
        <span>分配模式</span>
        <button className={`chip ${mode === 'o2m' ? 'active' : ''}`} onClick={() => setMode('o2m')}>One to many（一对多）</button>
        <button className={`chip ${mode === 'o2o' ? 'active' : ''}`} onClick={() => setMode('o2o')}>One to one（一对一）</button>
      </div>
      <div className={`feedback ${mode === 'o2o' ? 'good' : 'bad'}`}>
        {mode === 'o2o'
          ? '每个标注目标只保留一个正样本，从训练阶段减少重复高置信预测。'
          : '一个标注目标对应多个正样本，推理时可能产生多个高置信候选框。'}
      </div>
    </div>
  );
};
