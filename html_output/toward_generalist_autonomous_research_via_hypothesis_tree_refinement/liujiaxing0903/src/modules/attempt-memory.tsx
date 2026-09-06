import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 860;
const H = 380;
const MAX_ROUNDS = 4;

const C = {
  bg: '#f4f7fa',
  panel: '#ffffff',
  line: '#cbd6e1',
  ink: '#23334b',
  muted: '#6f7f91',
  blue: '#315886',
  blueSoft: '#dce8f5',
  green: '#228d5c',
  greenSoft: '#dcefe6',
  red: '#c43f52',
  redSoft: '#f5dfe3',
  orange: '#d97706',
  orangeSoft: '#f8ead8',
};

type MemoryMode = 'ephemeral' | 'persistent';

const ATTEMPTS = [
  {
    id: 'h1',
    hypothesis: '延长单次执行',
    result: '仍重复相同路线',
    evidence: '排除：仅延长执行',
  },
  {
    id: 'h2',
    hypothesis: '只保存最终分数',
    result: '缺少失败原因',
    evidence: '需要：保留过程证据',
  },
  {
    id: 'h3',
    hypothesis: '保存假设与失败摘要',
    result: '证据开始可回用',
    evidence: '约束：避开 h1、h2',
  },
  {
    id: 'h4',
    hypothesis: '探索未验证方向',
    result: '研究前沿向前推进',
    evidence: '前沿：转向新候选',
  },
] as const;

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill = C.panel,
  stroke = C.line,
  dashed = false
) {
  ctx.save();
  ctx.shadowColor = 'rgba(35, 51, 75, 0.08)';
  ctx.shadowBlur = 7;
  ctx.shadowOffsetY = 2;
  roundedRect(ctx, x, y, width, height, 8);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.4;
  if (dashed) ctx.setLineDash([6, 5]);
  roundedRect(ctx, x + 0.5, y + 0.5, width - 1, height - 1, 7.5);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawText(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  color = C.ink,
  size = 13,
  weight = 600,
  align: CanvasTextAlign = 'left'
) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
  ctx.textBaseline = 'alphabetic';
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color = C.blue
) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - 7 * Math.cos(angle - 0.48), toY - 7 * Math.sin(angle - 0.48));
  ctx.lineTo(toX - 7 * Math.cos(angle + 0.48), toY - 7 * Math.sin(angle + 0.48));
  ctx.closePath();
  ctx.fill();
}

function drawBadge(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  width: number,
  fill: string,
  color: string
) {
  roundedRect(ctx, x, y, width, 25, 6);
  ctx.fillStyle = fill;
  ctx.fill();
  drawText(ctx, value, x + width / 2, y + 13, color, 11, 750, 'center');
}

export const AttemptMemory: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<MemoryMode>('ephemeral');
  const [round, setRound] = useState(0);

  const persistent = mode === 'persistent';
  const nextAttemptIndex = persistent ? Math.min(round, MAX_ROUNDS - 1) : 0;
  const nextAttempt = ATTEMPTS[nextAttemptIndex];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    drawText(ctx, '同一个研究目标，连续执行多轮', 24, 26, C.ink, 16, 750);
    drawBadge(
      ctx,
      persistent ? '持久研究状态' : '临时对话状态',
      persistent ? 710 : 724,
      14,
      persistent ? 126 : 112,
      persistent ? C.greenSoft : C.redSoft,
      persistent ? C.green : C.red
    );

    drawPanel(ctx, 24, 50, 550, 306);
    drawPanel(ctx, 592, 50, 244, 306);
    drawText(ctx, '每轮选择与验证', 44, 75, C.ink, 14, 750);
    drawText(ctx, '研究状态', 612, 75, C.ink, 14, 750);

    for (let index = 0; index < MAX_ROUNDS; index += 1) {
      const x = 43 + index * 128;
      const isComplete = index < round;
      const isNext = index === nextAttemptIndex && round < MAX_ROUNDS;
      const attempt = persistent ? ATTEMPTS[index] : ATTEMPTS[0];
      const stroke = isComplete ? (persistent ? C.blue : C.red) : isNext ? C.orange : C.line;
      const fill = isComplete
        ? persistent
          ? '#f7faff'
          : C.redSoft
        : isNext
          ? C.orangeSoft
          : '#f8fafc';

      drawPanel(ctx, x, 94, 116, 132, fill, stroke, !isComplete && !isNext);
      drawBadge(
        ctx,
        `第 ${index + 1} 轮`,
        x + 10,
        104,
        64,
        isComplete ? stroke : '#e8edf3',
        isComplete ? '#ffffff' : C.muted
      );
      drawText(ctx, attempt.id, x + 94, 116, stroke, 13, 800, 'center');
      drawText(ctx, attempt.hypothesis, x + 58, 153, C.ink, 12, 700, 'center');

      if (isComplete) {
        drawText(ctx, attempt.result, x + 58, 181, C.red, 11, 750, 'center');
        drawText(
          ctx,
          persistent ? '证据已记录' : '未形成结构化约束',
          x + 58,
          207,
          persistent ? C.green : C.red,
          11,
          750,
          'center'
        );
      } else {
        drawText(ctx, isNext ? '下一轮候选' : '等待执行', x + 58, 192, isNext ? C.orange : C.muted, 11, 700, 'center');
      }

      if (index < MAX_ROUNDS - 1) {
        drawArrow(ctx, x + 118, 160, x + 126, 160, isComplete && persistent ? C.blue : C.line);
      }
    }

    drawPanel(ctx, 43, 244, 512, 88, persistent ? '#f3faf6' : '#fff7f8', persistent ? C.green : C.red);
    drawText(ctx, '下一轮决策', 61, 267, persistent ? C.green : C.red, 12, 800);
    drawText(
      ctx,
      round === MAX_ROUNDS
        ? persistent
          ? '证据已把搜索推向新的研究前沿'
          : '轮数增加了，但系统仍没有可操作的结构化历史'
        : persistent && round > 0
          ? `根据已记录证据，转向 ${nextAttempt.id}：${nextAttempt.hypothesis}`
          : `仍选择 ${nextAttempt.id}：${nextAttempt.hypothesis}`,
      61,
      295,
      C.ink,
      13,
      700
    );
    drawText(
      ctx,
      persistent
        ? '失败不是终点，而是下一次选择的约束。'
        : '失败停留在临时轨迹中，经过长时运行或上下文压缩后难以可靠复用。',
      61,
      317,
      C.muted,
      11.5,
      600
    );

    if (!persistent || round === 0) {
      drawPanel(ctx, 612, 94, 204, 122, persistent ? '#f8fafc' : '#fff7f8', persistent ? C.line : C.red, true);
      drawText(ctx, persistent ? '尚无研究记录' : '没有结构化研究记录', 714, 130, persistent ? C.muted : C.red, 13, 750, 'center');
      drawText(ctx, persistent ? '执行后写入假设与证据' : '失败停留在临时轨迹', 714, 160, C.muted, 12, 600, 'center');
      drawText(ctx, persistent ? '下一轮将读取这些约束' : '下一轮可能再次选择 h1', 714, 184, C.muted, 12, 600, 'center');
    } else {
      const visibleRows = Math.min(round, MAX_ROUNDS);
      for (let index = 0; index < visibleRows; index += 1) {
        const attempt = ATTEMPTS[index];
        const y = 96 + index * 42;
        roundedRect(ctx, 612, y, 204, 34, 6);
        ctx.fillStyle = index === visibleRows - 1 ? C.greenSoft : '#f3f6f9';
        ctx.fill();
        drawText(ctx, attempt.id, 624, y + 17, index === visibleRows - 1 ? C.green : C.blue, 11, 800);
        drawText(ctx, attempt.evidence, 650, y + 17, C.ink, 11.5, 650);
      }
    }

    drawPanel(ctx, 612, 280, 204, 52, persistent ? C.greenSoft : C.redSoft, persistent ? C.green : C.red);
    drawText(ctx, '下一轮', 626, 299, persistent ? C.green : C.red, 11, 800);
    drawText(
      ctx,
      round === MAX_ROUNDS ? '形成可继续探索的状态' : `${nextAttempt.id} · ${nextAttempt.hypothesis}`,
      626,
      318,
      C.ink,
      11.5,
      700
    );

    canvas.classList.add('is-ready');
  }, [mode, nextAttempt, nextAttemptIndex, persistent, round]);

  const changeMode = (nextMode: MemoryMode) => {
    setMode(nextMode);
    setRound(0);
  };

  const feedback =
    round === 0
      ? '选择一种记忆方式，然后执行第一轮，观察失败是否真的改变下一次选择。'
      : !persistent
        ? `第 ${round} 轮结束：失败没有形成结构化约束；在这个教学对照中，下一轮仍会选择 h1。`
        : round < MAX_ROUNDS
          ? `第 ${round} 轮证据已写入研究状态；下一轮转向 ${nextAttempt.id}，不再重复已经排除的路线。`
          : '四轮结束：历史假设、失败原因和方向约束共同形成了可继续操作的研究状态。';

  return (
    <div data-widget={`${chapterId}-${moduleId}`}>
      <div className="attempt-canvas-scroll">
        <canvas
          id={`cv-${chapterId}-${moduleId}`}
          className="attempt-memory-canvas"
          ref={canvasRef}
          width={W}
          height={H}
          role="img"
          aria-label={`${persistent ? '持久研究状态' : '临时对话状态'}模式，已执行 ${round} 轮；下一轮选择 ${nextAttempt.id} ${nextAttempt.hypothesis}`}
          style={{ width: '100%', height: 'auto', maxWidth: W }}
        />
      </div>
      <div className="ctrl attempt-memory-controls">
        <div className="attempt-mode-switch" role="group" aria-label="选择研究记忆方式">
          <button
            type="button"
            aria-pressed={mode === 'ephemeral'}
            onClick={() => changeMode('ephemeral')}
          >
            临时对话状态
          </button>
          <button
            type="button"
            aria-pressed={mode === 'persistent'}
            onClick={() => changeMode('persistent')}
          >
            持久研究状态
          </button>
        </div>
        <div className="attempt-step-actions">
          <button
            type="button"
            className="attempt-primary"
            onClick={() => setRound((current) => Math.min(MAX_ROUNDS, current + 1))}
            disabled={round >= MAX_ROUNDS}
          >
            {round >= MAX_ROUNDS ? '演示完成' : '执行下一轮'}
          </button>
          <button
            type="button"
            className="attempt-reset"
            onClick={() => setRound(0)}
            disabled={round === 0}
            aria-label="重置演示"
            title="重置演示"
          >
            ↻
          </button>
        </div>
      </div>
      <div className={`feedback ${round > 0 ? (persistent ? 'good' : 'bad') : ''}`} role="status" aria-live="polite">
        {feedback}
      </div>
      <p className="attempt-memory-note">
        这是论文机制的对照性教学回放，不表示所有单轨智能体都会彻底遗忘；重点是失败证据能否进入可检索、可审计的持久研究状态，不对应论文实验指标。
      </p>
    </div>
  );
};

export default AttemptMemory;
