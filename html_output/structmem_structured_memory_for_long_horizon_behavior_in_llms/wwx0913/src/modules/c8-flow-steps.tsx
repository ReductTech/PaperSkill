import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COL, clearScene, fillRound, roundRect, drawArrow, drawPhoto, drawTag, label, legend } from './sceneKit';
import type { WidgetProps } from './registry';

// §8.2 一条条目在系统中的传递（P2）：与 8.1 完全相同的六节点矩形与配色，
// 一张照片卡按步右移；六步是装配顺序，不是六次 LLM 调用（只有节点一与节点六调用模型）。

const W = 1080;
const H = 280;

const NODE_W = 148;
const NODE_H = 72;
const NODE_Y = 104;
const NODE_STEP = 168;
const TOTAL = 6;

const NODES: { name: string; level: 'event' | 'cross' }[] = [
  { name: '双视角抽取', level: 'event' },
  { name: '时间锚定', level: 'event' },
  { name: '事件缓冲', level: 'cross' },
  { name: '语义检索种子', level: 'cross' },
  { name: '事件重建', level: 'cross' },
  { name: '周期合成', level: 'cross' },
];

const STEP_DESC: string[] = [
  '一条发言先被拆成事实条目与关系条目。',
  '两条条目一起绑上这条发言的时间戳。',
  '条目按时间进入缓冲，等时间窗攒够再合并。',
  '缓冲的聚合查询取回前 15 条语义最相近的历史条目。',
  '这些种子取回同一时间戳的全部条目，拼成跨事件结构。',
  '一次批量合成写出跨事件关系假设，条目最终并回记忆。',
];

const FEEDBACK: { text: string; cls: string }[] = [
  { text: '第 1 步 双视角抽取：一条发言拆成事实条目与关系条目（Eq.1）。', cls: '' },
  { text: '第 2 步 时间锚定：两条条目一起绑上来源时间戳（Eq.2）。', cls: '' },
  { text: '第 3 步 事件缓冲：条目按时间排序等待合并，这一步不调用 LLM（Eq.3）。', cls: '' },
  { text: '第 4 步 语义检索种子：聚合查询取回前 15 条语义种子（§3.2）。', cls: '' },
  { text: '第 5 步 事件重建：种子取回同一时间戳的全部条目，组成跨事件结构（Eq.4–Eq.5）。', cls: 'good' },
  { text: '第 6 步 周期合成：一次批量合成写出跨事件关系假设，条目并回记忆（Eq.6）。', cls: 'good' },
];

function nodeX(i: number): number {
  return 40 + NODE_STEP * i;
}

export const C8FlowSteps: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ step: number }>({ step: 0 });
  const [step, setStep] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ text: string; cls: string }>(FEEDBACK[0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    const render = () => {
      const current = stateRef.current.step;
      clearScene(ctx, W, H, true);

      // 两个层级底色：与 8.1 完全相同
      ctx.save();
      ctx.globalAlpha = 0.06;
      fillRound(ctx, 32, 88, 332, 104, 10, COL.blue);
      fillRound(ctx, 368, 88, 668, 104, 10, COL.purple);
      ctx.restore();
      ctx.strokeStyle = COL.axis;
      ctx.lineWidth = 1;
      roundRect(ctx, 32, 88, 332, 104, 10);
      ctx.stroke();
      roundRect(ctx, 368, 88, 668, 104, 10);
      ctx.stroke();

      // 5 条边：已通过绿、未到达灰
      for (let i = 0; i < NODES.length - 1; i += 1) {
        const passed = i < current;
        drawArrow(ctx, nodeX(i) + NODE_W, 140, nodeX(i + 1), 140, passed ? COL.green : COL.axis, 6);
      }

      // 六个节点卡：填充色只编码层级，边框表达进度
      NODES.forEach((n: { name: string; level: 'event' | 'cross' }, i: number) => {
        const levelColor = n.level === 'event' ? COL.blue : COL.purple;
        fillRound(ctx, nodeX(i), NODE_Y, NODE_W, NODE_H, 10, levelColor);
        if (i === current) {
          ctx.strokeStyle = COL.orange;
          ctx.lineWidth = 3;
        } else if (i < current) {
          ctx.strokeStyle = COL.green;
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = levelColor;
          ctx.lineWidth = 2;
        }
        roundRect(ctx, nodeX(i), NODE_Y, NODE_W, NODE_H, 10);
        ctx.stroke();
        // 六个序号 1–6
        label(ctx, String(i + 1), nodeX(i) + NODE_W / 2, 142, COL.white, 'center', 20);
        // 只画当前步所在节点的中文名
        if (i === current) {
          label(ctx, n.name, nodeX(i) + NODE_W / 2, 166, COL.white, 'center', 16);
        }
      });

      // 已通过节点右下角的小贴纸
      for (let i = 0; i < current; i += 1) {
        drawTag(ctx, nodeX(i) + NODE_W - 28, NODE_Y + NODE_H - 22, 14, 10, COL.green, true);
      }

      // 唯一随步移动的元素：同一张照片卡
      drawPhoto(ctx, nodeX(current) + 51, 40, 46, 46, 0, COL.blue, COL.white);

      // 1 个图例（3 项）
      legend(
        ctx,
        [
          { c: COL.green, t: '已通过' },
          { c: COL.orange, t: '当前' },
          { c: COL.axis, t: '待传递' },
        ],
        48,
        200
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const go = (next: number): void => {
    stateRef.current.step = next;
    setStep(next);
    setFeedback(FEEDBACK[next]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {NODES.map((n: { name: string; level: 'event' | 'cross' }, i: number) => (
          <span key={n.name} className={`chip${i === step ? ' selected' : ''}`}>
            {n.name}
          </span>
        ))}
      </div>
      <div className="step-ctrl">
        <button type="button" className="tiny ghost" disabled={step === 0} onClick={() => go(Math.max(0, step - 1))}>
          上一步
        </button>
        <span className="step-label">
          第 {step + 1} 步 / 共 {TOTAL} 步
        </span>
        <button
          type="button"
          className="tiny"
          disabled={step === TOTAL - 1}
          onClick={() => go(Math.min(TOTAL - 1, step + 1))}
        >
          下一步
        </button>
        <button type="button" className="tiny ghost" onClick={() => go(0)}>
          重置
        </button>
      </div>
      <div className="step-desc" aria-live="polite">
        {STEP_DESC[step]}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default C8FlowSteps;
