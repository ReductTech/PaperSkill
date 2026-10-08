import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawSceneLabel, insetBox, bar } from './birdKit';

// m7-1 (train-steps) — 三阶段步进：每阶段练什么、冻什么，合计约 1/3 成本。

const W = 1080;
const H = 280;

const STAGES = [
  { name: '文本提示 30 轮', content: '全部参数上场', gears: 5, hours: '12–22.5h', note: '对比 YOLO-World 的 100 轮' },
  { name: '视觉提示 2 轮', content: '冻结其余，只训 SAVPE', gears: 1, hours: '约 1h', note: '追加视觉提示几乎免费' },
  { name: '无提示 1 轮', content: '只训专用嵌入 P_s', gears: 1, hours: '约 0.5h', note: '学会“把所有物体当一类”' },
];
const FEEDBACK = [
  { text: '阶段一：文本提示练 30 轮，全部参数上场。', cls: '' },
  { text: '阶段二：冻结其余，只训 SAVPE 2 轮——追加视觉提示几乎免费。', cls: '' },
  { text: '阶段三：只练一个专用嵌入 1 轮，学会“把所有物体当一类”。', cls: '' },
  { text: '合计约 1/3 成本：v8-S 12 小时 vs YOLO-World 41.7 小时（8×RTX4090）。', cls: 'good' },
];

export const M7_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 1 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(1);
  const [feedback, setFeedback] = useState(FEEDBACK[0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const gear = (x: number, y: number, r: number, color: string) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a));
        ctx.lineTo(x + (r + 5) * Math.cos(a), y + (r + 5) * Math.sin(a));
        ctx.stroke();
      }
      ctx.restore();
    };

    const render = () => {
      const s = stateRef.current;
      clearScene(ctx, W, H);

      // 左侧三格计划表
      STAGES.forEach((st, i) => {
        const x = 50 + i * 200;
        const y = 60;
        const cur = s.step === i + 1;
        const done = s.step > i + 1 || s.step === 4;
        ctx.save();
        ctx.fillStyle = cur ? '#eef4ff' : done ? '#eef8f1' : '#f3f5f9';
        ctx.strokeStyle = cur ? PALETTE.blue : done ? PALETTE.green : PALETTE.border;
        ctx.lineWidth = cur ? 3 : 1.5;
        ctx.beginPath();
        ctx.roundRect(x, y, 170, 90, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = cur ? PALETTE.blue : done ? PALETTE.green : PALETTE.muted;
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(st.name, x + 16, y + 32);
        ctx.font = '13px sans-serif';
        ctx.fillText('阶段' + '一二三'[i] + (done ? ' ✓' : ''), x + 16, y + 62);
        ctx.restore();
      });

      // 右侧 inset
      insetBox(ctx, 690, 44, 350, 200);
      if (s.step <= 3) {
        const st = STAGES[s.step - 1];
        drawSceneLabel(ctx, '当前阶段', 716, 78, PALETTE.muted);
        ctx.save();
        ctx.fillStyle = PALETTE.ink;
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(st.name, 716, 108);
        ctx.font = '14px sans-serif';
        ctx.fillText('参训参数：' + st.content, 716, 140);
        ctx.fillText('耗时：' + st.hours + '（8×RTX4090）', 716, 168);
        ctx.fillStyle = PALETTE.muted;
        ctx.font = '12px sans-serif';
        ctx.fillText(st.note, 716, 196);
        ctx.restore();
        // 齿轮象征参训参数
        for (let i = 0; i < st.gears; i++) gear(734 + i * 30, 224, 9, PALETTE.blue);
      } else {
        drawSceneLabel(ctx, '训练成本对比（v8-S）', 716, 78, PALETTE.muted);
        bar(ctx, 716, 100, 220, 20, 12 / 42, PALETTE.green, '12.0h');
        drawSceneLabel(ctx, 'YOLOE', 716, 96, PALETTE.green);
        bar(ctx, 716, 160, 220, 20, 41.7 / 42, PALETTE.red, '41.7h');
        drawSceneLabel(ctx, 'YOLO-World', 716, 156, PALETTE.red);
        drawSceneLabel(ctx, '约 1/3 成本', 716, 216, PALETTE.ink);
      }
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const go = (next: number) => {
    const v = Math.max(1, Math.min(4, next));
    stateRef.current.step = v;
    setStep(v);
    setFeedback(FEEDBACK[v - 1]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={() => go(step - 1)} disabled={step <= 1}>
          上一步
        </button>
        <button type="button" onClick={() => go(step + 1)} disabled={step >= 4}>
          下一步
        </button>
        <label>
          第 <span className="val">{step}</span> / 4 步
        </label>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M7_1;
