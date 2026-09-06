import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import {
  clearStudio,
  drawConsole,
  drawEngineerHand,
  drawFader,
  drawMeter,
  drawMic,
  drawPatchCable,
  drawStudioLabel,
  drawTargetBand,
} from './studio-kit';

type WidgetProps = { chapterId: string; moduleId: string };
type CapabilityScenario = 'routine' | 'tool-failure' | 'weak-recovery';
type ModelTier = 'fast' | 'balanced' | 'strong';
type Coverage = 'insufficient' | 'sufficient' | 'overprovisioned';
type CapabilityMatchState = {
  capability: number;
  scenario: CapabilityScenario;
  modelTier: ModelTier;
  demand: number;
  coverage: Coverage;
  selectedCount: 1;
};

const W = 560;
const H = 260;
const CURRENT = '#27446e';
const SUCCESS = '#228d5c';
const FAILURE = '#c43f52';
const EMPHASIS = '#d97706';
const MUTED = '#68778f';
const TRACK_X = 190;
const TRACK_Y = 178;
const TRACK_W = 200;

const demandByScenario: Record<CapabilityScenario, number> = {
  routine: 35,
  'tool-failure': 60,
  'weak-recovery': 80,
};

const scenarioLabel: Record<CapabilityScenario, string> = {
  routine: '常规',
  'tool-failure': '工具失败',
  'weak-recovery': '弱可恢复',
};

const tierLabel: Record<ModelTier, string> = {
  fast: '便宜档',
  balanced: '均衡档',
  strong: '强力档',
};

function derive(capabilityRaw: number, scenario: CapabilityScenario): CapabilityMatchState {
  const capability = Math.round(clamp(capabilityRaw, 0, 100));
  const demand = demandByScenario[scenario];
  const modelTier: ModelTier = capability <= 39 ? 'fast' : capability <= 69 ? 'balanced' : 'strong';
  const coverage: Coverage =
    capability < demand ? 'insufficient' : capability <= demand + 15 ? 'sufficient' : 'overprovisioned';
  return { capability, scenario, modelTier, demand, coverage, selectedCount: 1 };
}

function feedbackFor(state: CapabilityMatchState) {
  if (state.coverage === 'insufficient') {
    return {
      cls: 'bad',
      text: '能力低于需求：便宜调用可能换来更贵的重试与恢复。',
    };
  }
  if (state.coverage === 'overprovisioned') {
    return {
      cls: '',
      text: '能力远超需求：任务能做完，但你为当前步骤过度付费。',
    };
  }
  return {
    cls: 'good',
    text: '能力刚好覆盖风险：这是单模型路由追求的成本有效点。',
  };
}

export const Ch3CapabilityMatch: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const initial = derive(45, 'routine');
  const [state, setState] = useState<CapabilityMatchState>(initial);
  const stateRef = useRef<CapabilityMatchState>(initial);

  const publish = (next: CapabilityMatchState) => {
    stateRef.current = next;
    setState(next);
  };
  const chooseCapability = (capability: number) => publish(derive(capability, stateRef.current.scenario));
  const chooseScenario = (scenario: CapabilityScenario) => publish(derive(stateRef.current.capability, scenario));

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

    const render = (s: CapabilityMatchState) => {
      const coverageColor = s.coverage === 'insufficient' ? FAILURE : s.coverage === 'sufficient' ? SUCCESS : CURRENT;
      const capabilityValue = s.capability / 100;
      const demandValue = s.demand / 100;

      clearStudio(ctx, W, H);
      drawConsole(ctx, 22, 104, 132, 122);
      drawConsole(ctx, 176, 108, 238, 96);
      drawConsole(ctx, 438, 104, 100, 94);

      ctx.save();
      ctx.fillStyle = '#eef3fb';
      ctx.strokeStyle = CURRENT;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(22, 60, 516, 30, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = CURRENT;
      ctx.font = '600 14px "Segoe UI", sans-serif';
      ctx.fillText(`当前场景：${scenarioLabel[s.scenario]}`, 36, 80);
      ctx.restore();

      drawPatchCable(ctx, { x: 154, y: 164 }, { x: 448, y: 164 }, coverageColor);

      drawMic(ctx, 54, 132, s.modelTier === 'fast' ? EMPHASIS : CURRENT);
      drawMic(ctx, 92, 166, s.modelTier === 'balanced' ? EMPHASIS : CURRENT);
      drawMic(ctx, 54, 206, s.modelTier === 'strong' ? EMPHASIS : CURRENT);

      const demandX = TRACK_X + demandValue * TRACK_W;
      drawTargetBand(ctx, demandX - 17, 126, 34);
      ctx.save();
      ctx.strokeStyle = CURRENT;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(demandX, 120);
      ctx.lineTo(demandX, 202);
      ctx.stroke();
      ctx.fillStyle = CURRENT;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText(`需求 ${s.demand}`, Math.min(demandX + 4, 364), 132);
      ctx.restore();

      drawFader(ctx, TRACK_X, TRACK_Y, capabilityValue, EMPHASIS, TRACK_W);
      drawEngineerHand(ctx, TRACK_X + capabilityValue * TRACK_W, 158, '匹配', EMPHASIS);
      drawMeter(ctx, 510, 112, capabilityValue, coverageColor, 76);

      ctx.save();
      ctx.fillStyle = coverageColor;
      ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.fillText(tierLabel[s.modelTier], 458, 128);
      ctx.fillStyle = MUTED;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('已选一项', 458, 148);
      ctx.restore();

      drawStudioLabel(ctx, '模型能力', 176, 230, 'left');
      drawStudioLabel(ctx, s.coverage === 'insufficient' ? '不足' : s.coverage === 'sufficient' ? '刚好覆盖' : '过度配置', 538, 230, 'right');
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

  return (
    <div>
      <div className="chip-row" role="group" aria-label="能力需求场景">
        {(Object.keys(scenarioLabel) as CapabilityScenario[]).map((scenario) => (
          <button
            key={scenario}
            type="button"
            className={`chip ${state.scenario === scenario ? 'selected' : ''}`}
            aria-pressed={state.scenario === scenario}
            onClick={() => chooseScenario(scenario)}
          >
            {scenarioLabel[scenario]}
          </button>
        ))}
      </div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label={`能力匹配图：${scenarioLabel[state.scenario]}场景，能力 ${state.capability}，需求 ${state.demand}，选择${tierLabel[state.modelTier]}`}
      />
      <div className="ctrl">
        <label htmlFor={`capability-${chapterId}-${moduleId}`}>
          模型能力 <span className="val">{state.capability}</span>
        </label>
        <input
          id={`capability-${chapterId}-${moduleId}`}
          type="range"
          min={0}
          max={100}
          step={1}
          value={state.capability}
          onChange={(event) => chooseCapability(Number(event.target.value))}
          aria-describedby={`capability-note-${chapterId}-${moduleId}`}
        />
        <button className="tiny ghost" type="button" onClick={() => publish(derive(45, 'routine'))}>
          恢复初始值
        </button>
      </div>
      <p id={`capability-note-${chapterId}-${moduleId}`} className="note">
        当前需求 {state.demand}，选择{tierLabel[state.modelTier]}；0—100 是教学刻度，不是模型分数或论文阈值。
      </p>
      <div className={`feedback ${feedback.cls}`} aria-live="polite">
        {feedback.text}
      </div>
      <div className="compare-row" aria-label="论文聚合运行点参照">
        <div className="metric">
          <div className="l">DRACO · 同一 OPENSQUILLA Harness</div>
          <div className="v">52.33 / 0.3729 美元</div>
          <div>固定 Opus 4.8：52.36 / 0.6559 美元；分数越高越好，成本越低越好，路由阈值 0.95。</div>
        </div>
        <div className="metric">
          <div className="l">PinchBench · Harness 不同</div>
          <div className="v">93.14 / 0.0204 美元</div>
          <div>固定 OpenClaw Opus 4.8：93.35 / 0.2224 美元；不能把差异全部归因于路由。</div>
        </div>
      </div>
      <div className="feedback">
        判断题：单模型路由最想停在“能力刚好覆盖风险”，而不是不足或无条件选择最强档。
      </div>
    </div>
  );
};

export default Ch3CapabilityMatch;
