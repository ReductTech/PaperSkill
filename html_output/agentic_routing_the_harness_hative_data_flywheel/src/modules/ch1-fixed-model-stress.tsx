import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import {
  clearStudio,
  drawConsole,
  drawEngineerHand,
  drawFader,
  drawMeter,
  drawScoreTrack,
  drawStudioLabel,
  drawTargetBand,
} from './studio-kit';

type WidgetProps = { chapterId: string; moduleId: string };
type DifficultyBand = 'routine' | 'strained' | 'highRisk';
type MeterState = 'safe' | 'edge' | 'clipped';
type FixedStressState = {
  difficulty: number;
  difficultyBand: DifficultyBand;
  fixedModel: 'same';
  meterState: MeterState;
};

const W = 560;
const H = 260;
const CURRENT = '#27446e';
const SUCCESS = '#228d5c';
const FAILURE = '#c43f52';
const EMPHASIS = '#d97706';
const MUTED = '#68778f';

function deriveState(raw: number): FixedStressState {
  const difficulty = Math.round(clamp(raw, 0, 100));
  const difficultyBand: DifficultyBand =
    difficulty <= 33 ? 'routine' : difficulty <= 66 ? 'strained' : 'highRisk';
  const meterState: MeterState =
    difficultyBand === 'routine' ? 'safe' : difficultyBand === 'strained' ? 'edge' : 'clipped';
  return { difficulty, difficultyBand, fixedModel: 'same', meterState };
}

function feedbackFor(state: FixedStressState) {
  if (state.difficultyBand === 'highRisk') {
    return {
      cls: 'bad',
      text: '高风险步骤仍用同一模型：这次失败会把重试与恢复成本推到后面。',
    };
  }
  if (state.difficultyBand === 'strained') {
    return {
      cls: '',
      text: '模型勉强够用，但路由器仍不知道工具失败、上下文压力或恢复状态。',
    };
  }
  return {
    cls: 'good',
    text: '常规步骤暂时能完成，但你仍在为所有步骤支付同一能力档位。',
  };
}

export const Ch1FixedModelStress: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const initial = deriveState(20);
  const [state, setState] = useState<FixedStressState>(initial);
  const stateRef = useRef<FixedStressState>(initial);

  const commitDifficulty = (value: number) => {
    const next = deriveState(value);
    stateRef.current = next;
    setState(next);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.style.width = 'min(100%, 560px)';
    canvas.style.height = 'auto';

    const render = (s: FixedStressState) => {
      const bandIndex = s.difficultyBand === 'routine' ? 0 : s.difficultyBand === 'strained' ? 1 : 2;
      const stateColor = s.meterState === 'safe' ? SUCCESS : s.meterState === 'clipped' ? FAILURE : CURRENT;
      const value = s.difficulty / 100;

      clearStudio(ctx, W, H);
      drawConsole(ctx, 18, 96, 524, 146);
      drawScoreTrack(ctx, 24, 26, 322, bandIndex, stateColor);

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = CURRENT;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(372, 18, 164, 60, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = CURRENT;
      ctx.font = '600 14px "Segoe UI", sans-serif';
      ctx.fillText('同一模型', 420, 46);
      ctx.fillStyle = MUTED;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('能力与价格档位不变', 390, 66);

      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(52, 146);
      ctx.lineTo(172, 146);
      ctx.stroke();
      ctx.restore();

      drawFader(ctx, 52, 146, value, EMPHASIS);
      drawEngineerHand(ctx, 52 + value * 120, 124, '拖动', EMPHASIS);
      drawTargetBand(ctx, 366, 144, 56);
      drawMeter(ctx, 394, 122, s.meterState === 'safe' ? 0.52 : s.meterState === 'edge' ? 0.74 : 0.96, stateColor, 88);

      ctx.save();
      ctx.fillStyle = s.difficultyBand === 'highRisk' ? FAILURE : s.difficultyBand === 'strained' ? CURRENT : SUCCESS;
      const recoveryHeight = 24 + value * 62;
      ctx.fillRect(474, 208 - recoveryHeight, 30, recoveryHeight);
      ctx.strokeStyle = '#d7deea';
      ctx.strokeRect(468, 116, 42, 94);
      ctx.restore();

      drawStudioLabel(ctx, '步骤难度', 48, 230, 'left');
      drawStudioLabel(ctx, '恢复风险', 514, 230, 'right');
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(stateRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const feedback = feedbackFor(state);
  const bandLabel =
    state.difficultyBand === 'routine' ? '常规步骤' : state.difficultyBand === 'strained' ? '能力吃力' : '高风险步骤';

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label={`固定模型压力图：步骤难度 ${state.difficulty}，当前为${bandLabel}`}
      />
      <div className="ctrl">
        <label htmlFor={`difficulty-${chapterId}-${moduleId}`}>
          步骤难度 <span className="val">{state.difficulty}</span>
        </label>
        <input
          id={`difficulty-${chapterId}-${moduleId}`}
          type="range"
          min={0}
          max={100}
          step={1}
          value={state.difficulty}
          onChange={(event) => commitDifficulty(Number(event.target.value))}
          aria-describedby={`difficulty-note-${chapterId}-${moduleId}`}
        />
        <button className="tiny ghost" type="button" onClick={() => commitDifficulty(20)}>
          恢复初始值
        </button>
      </div>
      <p id={`difficulty-note-${chapterId}-${moduleId}`} className="note">
        当前判断：{bandLabel}。0—100 是教学刻度，不代表论文阈值、模型分数或失败概率。
      </p>
      <div className={`feedback ${feedback.cls}`} aria-live="polite">
        {feedback.text}
      </div>
      <div className="feedback">
        判断题：当前步骤突然变难时，风险可能进入后续重试与恢复，而不会自动消失。
      </div>
    </div>
  );
};

export default Ch1FixedModelStress;
