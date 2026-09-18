import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COL, clearScene, fillRound, roundRect, drawArrow, label } from './sceneKit';
import type { WidgetProps } from './registry';

// §4 模块：取用阶段 —— 双回路取回与提示装配（论文 §4.1 / 附录 A.3 / Figure 13）。
// 六个步骤、六个节点：问题编码 → 条目回路 → 小结回路 → 提示装配 → 时间换算要求 → 作答。

const W = 1080;
const H = 280;

const NODES = ['问题编码', '条目回路', '小结回路', '提示装配', '提示要求', '作答'];
const BOX_W = 148;
const BOX_H = 80;
const BOX_Y = 102;
const BOX_X = (i: number): number => 51 + i * (BOX_W + 18);

interface StepDef {
  desc: string;
  feedback: string;
  cls: '' | 'good' | 'bad';
  node: number;
  tag: string;
}

const STEPS: StepDef[] = [
  {
    desc: '一个问题进来，先编码成查询向量。',
    feedback: '检索用的编码方式与写入时一致，这样问题向量和条目向量才在同一个空间里可比。',
    cls: '',
    node: 0,
    tag: '问题编码',
  },
  {
    desc: '第一回路：在原子条目里按相似度取回 60 条。',
    feedback: '论文附录 A.3 给出的推理配置就是「取 60 条条目」：这些条目保的是具体事实与关系，负责把话说准。',
    cls: '',
    node: 1,
    tag: '条目 60 条',
  },
  {
    desc: '第二回路：在合成小结里取回 5 条。',
    feedback: '同一份推理配置里还有「取 5 条合成」。小结保的是跨事件的关系，负责让多跳与时序问题有路可走。',
    cls: 'good',
    node: 2,
    tag: '小结 5 条',
  },
  {
    desc: '两条回路的内容一起拼进提示：条目按说话人分组，小结单独成段。',
    feedback: '对应论文 Figure 13 的问答模板：先给「某位说话人的记忆」，再给「会话小结」，最后才是问题——两路内容各占一个位置，互不替代。',
    cls: '',
    node: 3,
    tag: '两路装配',
  },
  {
    desc: '提示里还写明了模型该怎么使用这些记忆。',
    feedback:
      '论文 Figure 13 的问答提示共有 8 条指令；其中四条与本次演示直接相关：注意时间戳；把「去年」「两个月前」这类相对时间换算成具体年月；记忆互相矛盾时以最新的为准；答案要少于 5–6 个词。',
    cls: '',
    node: 4,
    tag: '使用指令',
  },
  {
    desc: '模型据此给出答案。',
    feedback: '到这里一条完整链路才闭合：写笔记时留下事件与关系，翻笔记时两路取回，时间线索在问答当场被换算成具体日期。',
    cls: 'good',
    node: 5,
    tag: '给出答案',
  },
];

function nodeBox(ctx: CanvasRenderingContext2D, i: number, on: boolean, active: boolean): void {
  const x = BOX_X(i);
  fillRound(ctx, x, BOX_Y, BOX_W, BOX_H, 10, on ? COL.white : 'rgba(255,255,255,0.45)');
  ctx.strokeStyle = active ? COL.blue : COL.axis;
  ctx.lineWidth = active ? 3 : 1;
  roundRect(ctx, x, BOX_Y, BOX_W, BOX_H, 10);
  ctx.stroke();
}

export const C4DualRecall: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<number>(0);
  const [step, setStep] = useState(0);

  const cur = STEPS[Math.min(step, STEPS.length - 1)];

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
      const s = STEPS[Math.min(stateRef.current, STEPS.length - 1)];
      clearScene(ctx, W, H, true);

      for (let i = 0; i < NODES.length; i += 1) {
        const active = i === s.node;
        const done = i < s.node;
        nodeBox(ctx, i, done || active, active);
        label(ctx, String(i + 1), BOX_X(i) + 20, BOX_Y - 8, active ? COL.blue : COL.muted, 'left', 17);
        if (i < NODES.length - 1) {
          drawArrow(ctx, BOX_X(i) + BOX_W, BOX_Y + BOX_H / 2, BOX_X(i + 1) - 4, BOX_Y + BOX_H / 2, done ? COL.green : COL.axis, 7);
        }
      }

      // 节点 1：一个问题卡
      fillRound(ctx, BOX_X(0) + 22, BOX_Y + 26, 104, 28, 6, COL.white);
      ctx.strokeStyle = COL.blue;
      ctx.lineWidth = 2;
      roundRect(ctx, BOX_X(0) + 22, BOX_Y + 26, 104, 28, 6);
      ctx.stroke();
      ctx.fillStyle = COL.blue;
      ctx.fillRect(BOX_X(0) + 34, BOX_Y + 36, 80, 4);
      ctx.fillStyle = COL.axis;
      ctx.fillRect(BOX_X(0) + 34, BOX_Y + 44, 56, 4);

      // 节点 2：60 条条目（用小点阵示意）
      for (let k = 0; k < 30; k += 1) {
        ctx.beginPath();
        ctx.arc(BOX_X(1) + 22 + (k % 6) * 19, BOX_Y + 18 + Math.floor(k / 6) * 12, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = COL.blue;
        ctx.fill();
      }

      // 节点 3：5 条小结
      for (let k = 0; k < 5; k += 1) {
        fillRound(ctx, BOX_X(2) + 18, BOX_Y + 16 + k * 12, 112, 7, 3, COL.green);
      }

      // 节点 4：两块拼进一个提示框
      fillRound(ctx, BOX_X(3) + 14, BOX_Y + 14, 120, 56, 6, COL.white);
      ctx.strokeStyle = COL.axis;
      ctx.lineWidth = 1;
      roundRect(ctx, BOX_X(3) + 14, BOX_Y + 14, 120, 56, 6);
      ctx.stroke();
      for (let k = 0; k < 3; k += 1) {
        ctx.fillStyle = COL.blue;
        ctx.fillRect(BOX_X(3) + 24, BOX_Y + 22 + k * 8, 100 - k * 14, 4);
      }
      ctx.strokeStyle = COL.axis;
      ctx.beginPath();
      ctx.moveTo(BOX_X(3) + 24, BOX_Y + 50);
      ctx.lineTo(BOX_X(3) + 124, BOX_Y + 50);
      ctx.stroke();
      for (let k = 0; k < 2; k += 1) {
        ctx.fillStyle = COL.green;
        ctx.fillRect(BOX_X(3) + 24, BOX_Y + 56 + k * 8, 100 - k * 24, 4);
      }

      // 节点 5：八条指令，其中四条与本次演示相关（实心）
      for (let k = 0; k < 8; k += 1) {
        const rel = k === 1 || k === 3 || k === 5 || k === 7;
        ctx.fillStyle = rel ? COL.orange : COL.axis;
        ctx.fillRect(BOX_X(4) + 18, BOX_Y + 8 + k * 7, 8, 5);
        ctx.fillStyle = COL.axis;
        ctx.fillRect(BOX_X(4) + 32, BOX_Y + 9 + k * 7, 98 - (k % 3) * 12, 3);
      }

      // 节点 6：一条答案
      fillRound(ctx, BOX_X(5) + 24, BOX_Y + 28, 100, 24, 6, COL.white);
      ctx.strokeStyle = COL.green;
      ctx.lineWidth = 2;
      roundRect(ctx, BOX_X(5) + 24, BOX_Y + 28, 100, 24, 6);
      ctx.stroke();
      ctx.fillStyle = COL.green;
      ctx.fillRect(BOX_X(5) + 38, BOX_Y + 38, 72, 5);

      label(ctx, s.tag, 540, 56, COL.blue, 'center', 20);

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

  const go = (n: number): void => {
    const c = Math.max(0, Math.min(STEPS.length - 1, n));
    stateRef.current = c;
    setStep(c);
  };

  return (
    <div>
      <div className="chip-row">
        {NODES.map((n, i) => (
          <span key={n} className={`chip${i === cur.node ? ' selected' : ''}`}>
            {n}
          </span>
        ))}
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button type="button" className="tiny ghost" disabled={step === 0} onClick={() => go(step - 1)}>
          上一步
        </button>
        <span className="step-label">
          第 {step + 1} 步 / 共 {STEPS.length} 步
        </span>
        <button
          type="button"
          className="tiny"
          disabled={step === STEPS.length - 1}
          onClick={() => go(step + 1)}
        >
          下一步
        </button>
        <button type="button" className="tiny ghost" onClick={() => go(0)}>
          重置
        </button>
      </div>
      <div className="step-desc" aria-live="polite">
        {cur.desc}
      </div>
      <div className={`feedback ${cur.cls}`}>{cur.feedback}</div>
    </div>
  );
};

export default C4DualRecall;
