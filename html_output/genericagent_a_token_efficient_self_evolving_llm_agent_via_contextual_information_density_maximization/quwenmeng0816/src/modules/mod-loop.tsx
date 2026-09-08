import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, clearScene, drawDesk, drawJournal, drawPen, drawStamp, drawLabel, drawInkPath, checkPts, startLoop } from './journalKit';

const W = 560;
const H = 260;
const STEPS = ['组装任务与相关记忆', '模型生成回复或 tool_use', '调度器执行原子工具', '结构化结果写回状态', '把验证轨迹压进长期记忆'];
const FB = [
  '从当前任务和索引层拼出执行上下文，而不是重抄整本历史。',
  '模型只看见这一步的高密度上下文，输出文本或结构化调用。',
  '九个原子工具之一被执行，结果以结构化信号返回。',
  '环境反馈更新系统状态，供下一步决策使用。',
  '经验进入记忆，而不是把整段对话永远留在窗口里。',
];

export const ModLoop: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const [step, setStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startLoop(canvas, W, H, (ctx, now) => {
      const s = stateRef.current.step;
      const pulse = 0.55 + 0.45 * Math.abs(Math.sin(now / 420));
      clearScene(ctx, W, H);
      drawDesk(ctx, W, H);
      drawJournal(ctx, 18, 16, 220, 188, 0, 0);
      drawInkPath(
        ctx,
        [
          { x: 48, y: 40 },
          { x: 48, y: 40 + s * 28 },
        ],
        1,
        C.green,
        2.8
      );
      STEPS.forEach((name, i) => {
        const y = 40 + i * 28;
        ctx.strokeStyle = i < s ? C.green : i === s ? C.blue : C.axis;
        ctx.lineWidth = i === s ? 3 : 2;
        ctx.beginPath();
        ctx.arc(48, y, 9, 0, Math.PI * 2);
        ctx.stroke();
        if (i < s) drawInkPath(ctx, checkPts(48, y), 1, C.green, 2.4);
        else if (i === s) drawInkPath(ctx, checkPts(48, y), pulse, C.blue, 2.4);
        ctx.fillStyle = i === s ? C.blue : i < s ? C.green : C.muted;
        ctx.font = '13px "PingFang SC", sans-serif';
        ctx.fillText(`${i + 1}. ${name}`, 66, y + 4);
      });
      drawPen(ctx, 200, 40 + s * 28, -0.5, C.blue);
      drawStamp(ctx, 480, 70, s === 4);
      drawLabel(ctx, `当前步骤 ${s + 1}`, 360, 48, C.text, 14);
      drawLabel(ctx, s === 4 ? '验证轨迹可以进入巩固阶段' : '一次只保留当前步骤所需状态', 330, 74, C.muted, 12);
    });
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" onClick={() => { const v = Math.max(0, stateRef.current.step - 1); stateRef.current.step = v; setStep(v); }}>上一步</button>
        <button className="chip" disabled={step >= STEPS.length - 1} onClick={() => { const v = Math.min(STEPS.length - 1, stateRef.current.step + 1); stateRef.current.step = v; setStep(v); }}>下一步</button>
        <button className="chip" onClick={() => { stateRef.current.step = 0; setStep(0); }}>重置</button>
        <span className="val">{step + 1} / {STEPS.length}</span>
      </div>
      <div className={`feedback ${step === 4 ? 'good' : ''}`}>{FB[step]}</div>
    </div>
  );
};
