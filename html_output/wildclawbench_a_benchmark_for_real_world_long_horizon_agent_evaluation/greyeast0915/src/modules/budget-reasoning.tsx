import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { drawHikerSprite, onClimbSpritesReady } from './climb-sprites';

const W = 1080;
const H = 360;

type Budget = 0.5 | 1 | 2;
type Reasoning = 'low' | 'medium' | 'high';

interface BudgetReasoningState {
  budget: Budget;
  reasoning: Reasoning;
}

const BUDGETS = [0.5, 1, 2] as const;
const REASONING = ['low', 'medium', 'high'] as const;
const REASONING_ZH: Record<Reasoning, string> = {
  low: '低档',
  medium: '中档',
  high: '高档',
};
const THINKING_RESULTS: Record<Reasoning, { score: number; timeouts: number }> = {
  low: { score: 50.4, timeouts: 4 },
  medium: { score: 52.6, timeouts: 7 },
  high: { score: 45.0, timeouts: 15 },
};

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
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawPill(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  color: string,
  background: string
) {
  roundedRect(ctx, x, y, width, 26, 13);
  ctx.fillStyle = background;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = '700 13px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + width / 2, y + 18);
  ctx.textAlign = 'left';
}

function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  value: number,
  max: number,
  color: string
) {
  roundedRect(ctx, x, y, width, 12, 6);
  ctx.fillStyle = '#e7ebf1';
  ctx.fill();
  const activeWidth = clamp((value / max) * width, 0, width);
  if (activeWidth > 0) {
    roundedRect(ctx, x, y, activeWidth, 12, 6);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function drawScene(ctx: CanvasRenderingContext2D, state: BudgetReasoningState) {
  const thinking = THINKING_RESULTS[state.reasoning];
  const combinationReported = state.budget === 1;
  const budgetPace = state.budget === 0.5 ? 0.42 : state.budget === 1 ? 0.67 : 0.84;
  const pace = clamp(budgetPace - (state.reasoning === 'high' ? 0.08 : 0), 0.2, 0.9);

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#e3eadc';
  ctx.beginPath();
  ctx.moveTo(22, 36);
  ctx.lineTo(282, 18);
  ctx.lineTo(300, 330);
  ctx.lineTo(18, 340);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#21324a';
  ctx.font = '700 17px "Segoe UI", sans-serif';
  ctx.fillText('攀爬节奏示意', 28, 28);
  ctx.fillStyle = '#68778f';
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.fillText('教学示意，不是论文拟合值', 28, 48);

  const routeStart = { x: 55, y: 292 };
  const routeEnd = { x: 248, y: 76 };
  const climberX = routeStart.x + (routeEnd.x - routeStart.x) * pace;
  const climberY = routeStart.y + (routeEnd.y - routeStart.y) * pace;
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 7]);
  ctx.beginPath();
  ctx.moveTo(routeStart.x, routeStart.y);
  ctx.lineTo(routeEnd.x, routeEnd.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = '#27446e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(68, 324);
  ctx.quadraticCurveTo(105, 260, climberX, climberY + 18);
  ctx.stroke();
  ctx.fillStyle = '#228d5c';
  ctx.beginPath();
  ctx.ellipse(routeEnd.x, routeEnd.y, 20, 11, -0.25, 0, Math.PI * 2);
  ctx.fill();
  drawHikerSprite(ctx, climberX, climberY + 30, 70, 88);
  drawPill(ctx, `${state.budget}×预算`, 40, 305, 96, '#27446e', '#edf3fb');
  drawPill(ctx, `${REASONING_ZH[state.reasoning]}思考`, 146, 305, 105, '#7c3aed', '#f3edff');

  const panelX = 326;
  const panelW = 726;
  roundedRect(ctx, panelX, 18, panelW, 172, 12);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#21324a';
  ctx.font = '700 16px "Segoe UI", sans-serif';
  ctx.fillText('当前组合是否有论文直接报告？', panelX + 18, 44);
  ctx.fillStyle = '#68778f';
  ctx.font = '13px "Segoe UI", sans-serif';
  ctx.fillText('只读数，不把两个单因素实验拼成新结果', panelX + 18, 66);

  if (combinationReported) {
    ctx.fillStyle = '#21324a';
    ctx.font = '600 14px "Segoe UI", sans-serif';
    ctx.fillText(`${REASONING_ZH[state.reasoning]}思考（1×预算）`, panelX + 18, 101);
    drawBar(ctx, panelX + 198, 89, 330, thinking.score, 60, state.reasoning === 'high' ? '#c43f52' : '#228d5c');
    ctx.fillStyle = state.reasoning === 'high' ? '#c43f52' : '#228d5c';
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillText(thinking.score.toFixed(1), panelX + 545, 103);

    ctx.fillStyle = '#21324a';
    ctx.font = '600 14px "Segoe UI", sans-serif';
    ctx.fillText('超时次数', panelX + 18, 145);
    drawBar(ctx, panelX + 198, 133, 330, thinking.timeouts, 15, thinking.timeouts === 15 ? '#c43f52' : '#f07e47');
    ctx.fillStyle = thinking.timeouts === 15 ? '#c43f52' : '#92400e';
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillText(`${thinking.timeouts} 次`, panelX + 545, 147);
  } else {
    roundedRect(ctx, panelX + 18, 84, panelW - 36, 76, 10);
    ctx.fillStyle = '#f1f3f6';
    ctx.fill();
    ctx.strokeStyle = '#aab4c3';
    ctx.setLineDash([6, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#68778f';
    ctx.font = '700 19px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('论文未报告此组合', panelX + panelW / 2, 116);
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText('组合成绩条已禁用，不插值', panelX + panelW / 2, 141);
    ctx.textAlign = 'left';
  }

  const cardY = 204;
  const cardH = 136;
  roundedRect(ctx, 326, cardY, 350, cardH, 12);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#d7deea';
  ctx.stroke();
  ctx.fillStyle = '#27446e';
  ctx.font = '700 15px "Segoe UI", sans-serif';
  ctx.fillText('时间预算实验（单因素）', 344, cardY + 25);
  ctx.fillStyle = '#21324a';
  ctx.font = '13px "Segoe UI", sans-serif';
  ctx.fillText('0.5×：显著伤害表现（此处无精确分数）', 344, cardY + 53);
  ctx.fillText('1×：默认 50.3', 344, cardY + 81);
  ctx.fillStyle = '#228d5c';
  ctx.font = '700 13px "Segoe UI", sans-serif';
  ctx.fillText('2×：56.5，收益递减', 344, cardY + 109);

  roundedRect(ctx, 692, cardY, 360, cardH, 12);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#d7deea';
  ctx.stroke();
  ctx.fillStyle = '#7c3aed';
  ctx.font = '700 15px "Segoe UI", sans-serif';
  ctx.fillText('思考档位实验（分数 / 超时）', 710, cardY + 25);
  const thinkingRows: Array<[Reasoning, string]> = [
    ['low', '低档'],
    ['medium', '中档'],
    ['high', '高档'],
  ];
  thinkingRows.forEach(([key, label], index) => {
    const result = THINKING_RESULTS[key];
    const y = cardY + 53 + index * 28;
    const active = key === state.reasoning;
    if (active) {
      roundedRect(ctx, 704, y - 17, 332, 24, 8);
      ctx.fillStyle = key === 'high' ? '#fdecef' : '#edf8f2';
      ctx.fill();
    }
    ctx.fillStyle = key === 'high' ? '#c43f52' : '#21324a';
    ctx.font = active ? '700 13px "Segoe UI", sans-serif' : '13px "Segoe UI", sans-serif';
    ctx.fillText(`${label}：${result.score.toFixed(1)} / ${result.timeouts} 次`, 714, y);
  });
}

function feedbackFor(state: BudgetReasoningState): { text: string; cls: string } {
  if (state.budget === 2) {
    return { text: '时间加倍升至 56.5，但收益并非线性。', cls: 'good' };
  }
  if (state.budget === 0.5) {
    return { text: '减半时间显著伤害表现；论文未报告当前组合的精确分数。', cls: 'bad' };
  }
  if (state.reasoning === 'high') {
    return { text: '高档思考为 45.0，且 15 次超时；更多计算不保证更高分。', cls: 'bad' };
  }
  if (state.reasoning === 'medium') {
    return { text: '中档思考为 52.6，出现 7 次超时；继续升档并不会继续提升。', cls: 'good' };
  }
  return { text: '低档思考为 50.4，出现 4 次超时；可继续切换档位比较。', cls: '' };
}

export const BudgetReasoning: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const stateRef = useRef<BudgetReasoningState>({ budget: 1, reasoning: 'low' });
  const [state, setState] = useState<BudgetReasoningState>(stateRef.current);

  const updateState = (next: BudgetReasoningState) => {
    stateRef.current = next;
    setState(next);
    if (contextRef.current) drawScene(contextRef.current, next);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      contextRef.current = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    drawScene(contextRef.current, stateRef.current);
    canvas.classList.add('is-ready');
    const removeSpriteListener = onClimbSpritesReady(() => {
      if (contextRef.current) drawScene(contextRef.current, stateRef.current);
    });
    const disconnect = observeCanvas(
      canvas,
      () => {
        if (contextRef.current) drawScene(contextRef.current, stateRef.current);
      },
      () => undefined
    );
    return () => { removeSpriteListener(); disconnect(); };
  }, []);

  const feedback = feedbackFor(state);
  const budgetIndex = BUDGETS.indexOf(state.budget);
  const reasoningIndex = REASONING.indexOf(state.reasoning);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl" aria-label="时间预算与思考档位控制">
        <label>
          时间倍率 <span className="val">{state.budget}×</span>
          <input
            aria-label="时间倍率"
            type="range"
            min={0}
            max={2}
            step={1}
            value={budgetIndex}
            onChange={(event) => {
              const index = clamp(Math.round(Number(event.target.value)), 0, 2);
              updateState({ ...stateRef.current, budget: BUDGETS[index] });
            }}
          />
        </label>
        <label>
          思考档位 <span className="val">{REASONING_ZH[state.reasoning]}</span>
          <input
            aria-label="思考档位"
            type="range"
            min={0}
            max={2}
            step={1}
            value={reasoningIndex}
            onChange={(event) => {
              const index = clamp(Math.round(Number(event.target.value)), 0, 2);
              updateState({ ...stateRef.current, reasoning: REASONING[index] });
            }}
          />
        </label>
      </div>
      <div className={`feedback ${feedback.cls}`} aria-live="polite">{feedback.text}</div>
    </div>
  );
};

export default BudgetReasoning;
