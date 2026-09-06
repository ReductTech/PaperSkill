import React, { useRef, useState } from 'react';
import { C, fillBg } from './sharedDraw';
import { usePaperCanvas } from './usePaperCanvas';
import type { WidgetProps } from './registry';

const W = 520;
const H = 200;
const TASKS = ['桌面抓取', '室内导航', '轨迹预测'] as const;

export const HeroOld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [task, setTask] = useState(0);
  const [fb, setFb] = useState({ text: '点击任务标签，观察专用模型如何“各管一摊”。', cls: '' });

  usePaperCanvas(
    canvasRef,
    W,
    H,
    (ctx) => {
      fillBg(ctx, W, H);
      ctx.fillStyle = C.text;
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText(`当前指令：${TASKS[task]}`, 16, 24);
      const models = ['操纵专用', '导航专用', '轨迹专用'];
      models.forEach((m, i) => {
        const x = 16 + i * 168;
        const active = i === task;
        ctx.fillStyle = active ? C.red : '#e8ecf0';
        ctx.fillRect(x, 40, 150, 110);
        ctx.strokeStyle = active ? C.red : C.border;
        ctx.lineWidth = active ? 3 : 1;
        ctx.strokeRect(x, 40, 150, 110);
        ctx.fillStyle = active ? '#fff' : C.text;
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText(m, x + 28, 78);
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText('仅训练单一任务族', x + 18, 100);
        if (i !== task) {
          ctx.fillStyle = C.red;
          ctx.font = '12px "Segoe UI", sans-serif';
          ctx.fillText('✗ 无法执行', x + 36, 130);
        }
      });
      ctx.fillStyle = C.red;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('换任务 / 换机器人 → 必须换模型', 16, H - 12);
    },
    [task]
  );

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {TASKS.map((t, i) => (
          <button key={t} type="button" className={task === i ? 'active' : ''} onClick={() => {
            setTask(i);
            setFb({ text: `专用模型只覆盖「${TASKS[i]}」，跨任务/跨本体能力碎片化。`, cls: 'bad' });
          }}>{t}</button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default HeroOld;
