import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  COL,
  clearScene,
  drawAxisBox,
  fillRound,
  roundRect,
  drawArrow,
  drawPhoto,
  drawStamp,
  label,
  legend,
} from './sceneKit';
import type { WidgetProps } from './registry';

// §6 模块 6.1（P2 分步走，1080×280）：双回路取用的五步推理流程。
// 上区 flowRow 是五个流程节点，下区 contextPanel 是送入作答模型的合并上下文；
// 回路①（原子条目，60）与回路②（合成记忆，5）在最后一步之前一直各走各的。

const W = 1080;
const H = 280;
const TOTAL = 5;

// 五个节点中心（间距 200，卡片宽 160，落在 flowRow 40–1040 之内）
const NODE_X = [140, 340, 540, 740, 940];
const NODE_Y = 110;

const STEP_DESC: Record<number, string> = {
  1: '第 1 步：先把缓冲里的条目拼成聚合查询并编码，这条查询决定后面取回什么。',
  2: '第 2 步：取回语义最相近的 60 条原子条目，这是回路①，负责事实细节。',
  3: '第 3 步：再取回 5 条合成记忆，这是回路②，负责跨事件关系。',
  4: '第 4 步：两路上下文合并后一起送入作答模型，原子条目与合成记忆不互相替代。',
  5: '第 5 步：给出答案——事实来自 60 条原子条目，跨事件关系来自 5 条合成记忆。',
};

const FEEDBACK: Record<number, { text: string; cls: string }> = {
  1: { text: '先把缓冲里的条目拼成聚合查询并编码，这条查询决定后面取回什么。', cls: '' },
  2: { text: '取回语义最相近的 60 条原子条目：这是回路①，负责事实细节。', cls: '' },
  3: { text: '再取回 5 条合成记忆：这是回路②，负责跨事件关系。', cls: 'good' },
  4: { text: '两路上下文合并后一起送入作答模型，原子条目与合成记忆不互相替代。', cls: 'good' },
  5: { text: '给出答案：事实来自 60 条原子条目，跨事件关系来自 5 条合成记忆。', cls: 'good' },
};

export const C6DualCircuit: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ step: number }>({ step: 1 });
  const [step, setStep] = useState<number>(1);
  const [feedback, setFeedback] = useState<{ text: string; cls: string }>(FEEDBACK[1]);

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

    const render = (s: { step: number }) => {
      clearScene(ctx, W, H, true);

      // 图例（图例可放在流程底板左上方）
      legend(
        ctx,
        [
          { c: COL.blue, t: '已完成' },
          { c: COL.ink, t: '当前' },
          { c: COL.axis, t: '未开始' },
        ],
        64,
        20
      );

      // 流程底板
      drawAxisBox(ctx, 40, 60, 1000, 100);

      // 节点之间的连线
      for (let i = 0; i < NODE_X.length - 1; i += 1) {
        const reachedNext = s.step > i + 1;
        drawArrow(
          ctx,
          NODE_X[i] + 80,
          NODE_Y,
          NODE_X[i + 1] - 80,
          NODE_Y,
          reachedNext ? COL.blue : COL.axis,
          8
        );
      }

      // 五个节点：已完成填充蓝色，当前 3 px 蓝色描边，未到达灰色描边
      NODE_X.forEach((cx, i) => {
        const idx = i + 1;
        const done = idx < s.step;
        const cur = idx === s.step;
        if (done) {
          fillRound(ctx, cx - 80, NODE_Y - 28, 160, 56, 10, COL.blue);
        } else {
          fillRound(ctx, cx - 80, NODE_Y - 28, 160, 56, 10, COL.white);
          ctx.save();
          ctx.strokeStyle = cur ? COL.blue : COL.axis;
          ctx.lineWidth = cur ? 3 : 2;
          roundRect(ctx, cx - 80, NODE_Y - 28, 160, 56, 10);
          ctx.stroke();
          ctx.restore();
        }
        label(ctx, String(idx), cx, NODE_Y + 9, done ? COL.white : cur ? COL.blue : COL.muted, 'center', 22);
      });

      // 送入作答模型的合并上下文
      drawAxisBox(ctx, 40, 180, 1000, 80);
      label(ctx, '原子条目', 60, 176, COL.muted, 'left', 14);
      label(ctx, '合成记忆', 420, 176, COL.muted, 'left', 14);

      // 回路①：原子条目卡片堆（最多 6 张，代表 60 条）
      if (s.step >= 2) {
        for (let i = 0; i < 6; i += 1) {
          drawPhoto(ctx, 60 + i * 34, 192, 52, 52, i % 2 === 0 ? -0.04 : 0.04, COL.blue);
        }
      }

      // 回路②：合成记忆单卡（代表 5 条）
      if (s.step >= 3) {
        drawPhoto(ctx, 420, 192, 56, 52, 0.05, COL.green);
      }

      // 作答框（第 4 步起两条回路各用一条连线汇入）
      fillRound(ctx, 760, 192, 220, 56, 10, COL.white);
      ctx.save();
      ctx.strokeStyle = COL.axis;
      ctx.lineWidth = 2;
      roundRect(ctx, 760, 192, 220, 56, 10);
      ctx.stroke();
      ctx.restore();
      if (s.step >= 4) {
        drawArrow(ctx, 300, 220, 754, 220, COL.blue, 9);
        drawArrow(ctx, 490, 220, 754, 220, COL.blue, 9);
      }
      // 第 5 步：答案标记
      if (s.step >= 5) {
        drawStamp(ctx, 1002, 220, 12, COL.green, true);
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(stateRef.current);
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

  const goTo = (next: number) => {
    const v = clamp(Math.round(next), 1, TOTAL);
    stateRef.current.step = v;
    setStep(v);
    setFeedback(FEEDBACK[v]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button
          className="tiny ghost"
          id="c6-prev"
          onClick={() => goTo(step - 1)}
          disabled={step <= 1}
          aria-disabled={step <= 1}
        >
          上一步
        </button>
        <button
          className="tiny"
          id="c6-next"
          onClick={() => goTo(step + 1)}
          disabled={step >= TOTAL}
          aria-disabled={step >= TOTAL}
        >
          下一步
        </button>
        <button className="tiny ghost" id="c6-reset" onClick={() => goTo(1)}>
          重置
        </button>
        <span className="step-label">
          第 {step} 步 / 共 {TOTAL} 步
        </span>
      </div>
      <div className="step-desc">{STEP_DESC[step]}</div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default C6DualCircuit;
