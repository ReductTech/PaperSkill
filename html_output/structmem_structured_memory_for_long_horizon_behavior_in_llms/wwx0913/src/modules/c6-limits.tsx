import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COL, clearScene, fillRound, roundRect, drawArrow, drawBars, label } from './sceneKit';
import type { WidgetProps } from './registry';

// §6 模块：边界与局限 —— 论文 Limitations 一节 + Table 1 / Table 2 的读数。
// 四个步骤、四个节点：抽取质量 → 无更新机制 → 多跳短板 → 开放域短板。

const W = 1080;
const H = 280;

const NODES = ['抽取质量', '无更新机制', '多跳短板', '开放域短板'];
const BOX_W = 148;
const BOX_H = 80;
const BOX_Y = 102;
const BOX_GAP = 18;
// 无论节点多少，四个阶段整体居中
const BOX_X0 = (W - (NODES.length * BOX_W + (NODES.length - 1) * BOX_GAP)) / 2;
const BOX_X = (i: number): number => BOX_X0 + i * (BOX_W + BOX_GAP);

interface StepDef {
  desc: string;
  feedback: string;
  cls: '' | 'good' | 'bad';
  node: number;
  tag: string;
}

const STEPS: StepDef[] = [
  {
    desc: '局限一：双视角抽取的质量高度依赖提示词。',
    feedback: '抽取质量高度依赖指令提示；提示设计不佳，关系信息就会被不完整或不准确地捕捉。也就是说，这个方法的上限由提示词决定。',
    cls: 'bad',
    node: 0,
    tag: '依赖提示词',
  },
  {
    desc: '局限二：目前缺少显式的冲突消解与记忆更新机制。',
    feedback: '该框架主要解决记忆的扩张与合成，目前不具备冲突消解和记忆更新的显式机制。',
    cls: 'bad',
    node: 1,
    tag: '无更新机制',
  },
  {
    desc: '边界一：多跳问答并非它的最优项。',
    feedback: '论文 Table 1 的读数：本文多跳 68.77，低于 Zep 的 74.11 与 Memobase 的 70.92。它在多跳上是相对扁平记忆有提升（66.31 → 68.77），但不是 Table 1 的 Multi 列最强。',
    cls: 'bad',
    node: 2,
    tag: '多跳 68.77',
  },
  {
    desc: '边界二：开放域问答也不是它的最优项。',
    feedback: '论文 Table 1：本文开放域 46.88，明显低于 Zep 的 66.04；而且在 Table 2 的消融里，开放域从扁平记忆到本文始终是 46.88——Table 2 的 Open 列没有提升。',
    cls: 'bad',
    node: 3,
    tag: '开放域 46.88',
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

export const C6Limits: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

      // 节点 1：提示词卡片（质量取决于它）
      fillRound(ctx, BOX_X(0) + 22, BOX_Y + 16, 104, 48, 6, COL.white);
      ctx.strokeStyle = COL.red;
      ctx.lineWidth = 2;
      roundRect(ctx, BOX_X(0) + 22, BOX_Y + 16, 104, 48, 6);
      ctx.stroke();
      for (let k = 0; k < 4; k += 1) {
        ctx.fillStyle = COL.axis;
        ctx.fillRect(BOX_X(0) + 34, BOX_Y + 26 + k * 10, 80 - (k % 2) * 20, 4);
      }

      // 节点 2：两条记录之间一条被划掉的更新箭头
      fillRound(ctx, BOX_X(1) + 18, BOX_Y + 18, 46, 22, 5, COL.white);
      ctx.strokeStyle = COL.axis;
      ctx.lineWidth = 2;
      roundRect(ctx, BOX_X(1) + 18, BOX_Y + 18, 46, 22, 5);
      ctx.stroke();
      fillRound(ctx, BOX_X(1) + 84, BOX_Y + 44, 46, 22, 5, COL.white);
      roundRect(ctx, BOX_X(1) + 84, BOX_Y + 44, 46, 22, 5);
      ctx.stroke();
      drawArrow(ctx, BOX_X(1) + 66, BOX_Y + 29, BOX_X(1) + 82, BOX_Y + 55, COL.axis, 6);
      ctx.strokeStyle = COL.red;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(BOX_X(1) + 62, BOX_Y + 50);
      ctx.lineTo(BOX_X(1) + 88, BOX_Y + 32);
      ctx.stroke();

      // 节点 3：多跳两根柱（本文 vs Zep）
      drawBars(
        ctx,
        [
          { v: 68.77, c: COL.red },
          { v: 74.11, c: COL.green },
        ],
        BOX_X(2) + 30,
        BOX_Y + 18,
        88,
        44,
        100
      );

      // 节点 4：开放域两根柱（本文 vs Zep）
      drawBars(
        ctx,
        [
          { v: 46.88, c: COL.red },
          { v: 66.04, c: COL.green },
        ],
        BOX_X(3) + 30,
        BOX_Y + 18,
        88,
        44,
        100
      );

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

export default C6Limits;
