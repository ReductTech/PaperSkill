import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import {
  clearStudio,
  drawConsole,
  drawEngineerHand,
  drawMeter,
  drawPatchCable,
  drawStudioLabel,
} from './studio-kit';

type WidgetProps = { chapterId: string; moduleId: string };
type FieldId = 'observation' | 'actions' | 'artifact' | 'toolHistory' | 'recovery' | 'verification';
type Scenario = 'routine' | 'tool-failure' | 'context-pressure';
type HarnessStateWidget = {
  activeField: FieldId;
  scenario: Scenario;
  includedFields: FieldId[];
};

const W = 560;
const H = 260;
const CURRENT = '#27446e';
const SUCCESS = '#228d5c';
const FAILURE = '#c43f52';
const EMPHASIS = '#d97706';
const AUXILIARY = '#7c3aed';
const MUTED = '#68778f';
const BORDER = '#d7deea';

const fields: Array<{ id: FieldId; label: string; x: number; y: number }> = [
  { id: 'observation', label: '观察与上下文', x: 34, y: 116 },
  { id: 'actions', label: '可用动作', x: 146, y: 116 },
  { id: 'artifact', label: '工件状态', x: 258, y: 116 },
  { id: 'toolHistory', label: '工具历史', x: 34, y: 174 },
  { id: 'recovery', label: '恢复状态', x: 146, y: 174 },
  { id: 'verification', label: '验证信号', x: 258, y: 174 },
];

const scenarioLabels: Record<Scenario, string> = {
  routine: '常规',
  'tool-failure': '工具失败',
  'context-pressure': '上下文压力',
};

const details: Record<Scenario, Record<FieldId, string>> = {
  routine: {
    observation: '当前小节明确，上下文压力较低',
    actions: '可以继续录制或执行下一步',
    artifact: '工件处于可继续编辑状态',
    toolHistory: '最近一次工具调用正常',
    recovery: '当前步骤容易恢复',
    verification: '监听尚未报告异常',
  },
  'tool-failure': {
    observation: '原始任务未变，控制循环已中断',
    actions: '需要重试工具或改用备用动作',
    artifact: '工件停在工具失败前的状态',
    toolHistory: '最近一次工具调用失败',
    recovery: '需要修复后继续',
    verification: '验证已报告工具错误',
  },
  'context-pressure': {
    observation: '原始与压缩上下文并存',
    actions: '可以压缩、检索或继续执行',
    artifact: '保留证据可能不完整',
    toolHistory: '工具可用，但调用历史较长',
    recovery: '重建上下文的代价可能更高',
    verification: '需要检查保留内容',
  },
};

const initialState: HarnessStateWidget = {
  activeField: 'observation',
  scenario: 'routine',
  includedFields: ['observation'],
};

function wrapTextByWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const character of Array.from(text)) {
    const candidate = current + character;
    if (current && ctx.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function feedbackFor(state: HarnessStateWidget) {
  if (state.includedFields.length === 0) {
    return {
      cls: 'bad',
      text: '遗漏这个字段会低估当前步骤的风险，路由决策退化为静态问题分类。',
    };
  }
  if (state.includedFields.length === fields.length) {
    return {
      cls: 'good',
      text: '完整状态把“用户问了什么”升级为“执行现在发生了什么”。',
    };
  }
  return {
    cls: '',
    text: '你看到了一个局部信号；路由需求仍由多个 Harness 字段共同决定。',
  };
}

export const Ch2HarnessState: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [state, setState] = useState<HarnessStateWidget>(initialState);
  const stateRef = useRef<HarnessStateWidget>(initialState);

  const publish = (next: HarnessStateWidget) => {
    stateRef.current = next;
    setState(next);
  };

  const toggleField = (field: FieldId) => {
    const current = stateRef.current;
    const isIncluded = current.includedFields.includes(field);
    const includedFields = isIncluded
      ? current.includedFields.filter((item) => item !== field)
      : fields.map((item) => item.id).filter((item) => item === field || current.includedFields.includes(item));
    publish({ ...current, activeField: field, includedFields });
  };

  const chooseScenario = (scenario: Scenario) => publish({ ...stateRef.current, scenario });

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

    const render = (s: HarnessStateWidget) => {
      clearStudio(ctx, W, H);
      drawConsole(ctx, 20, 102, 360, 132);
      drawConsole(ctx, 398, 102, 142, 132);

      ctx.save();
      ctx.fillStyle = '#eef3fb';
      ctx.strokeStyle = CURRENT;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(20, 58, 520, 32, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = CURRENT;
      ctx.font = '600 14px "Segoe UI", sans-serif';
      ctx.fillText(`当前场景：${scenarioLabels[s.scenario]}`, 34, 79);
      ctx.restore();

      fields.forEach((field) => {
        if (s.includedFields.includes(field.id)) {
          drawPatchCable(
            ctx,
            { x: field.x + 92, y: field.y + 22 },
            { x: 404, y: 216 },
            field.id === 'verification' || field.id === 'toolHistory' ? AUXILIARY : CURRENT
          );
        }
      });

      fields.forEach((field) => {
        const included = s.includedFields.includes(field.id);
        const active = s.activeField === field.id;
        ctx.save();
        ctx.fillStyle = included ? '#eef3fb' : '#ffffff';
        ctx.strokeStyle = active ? EMPHASIS : included ? CURRENT : BORDER;
        ctx.lineWidth = active ? 4 : 2;
        ctx.beginPath();
        ctx.roundRect(field.x, field.y, 100, 44, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = included ? CURRENT : MUTED;
        ctx.font = '600 12px "Segoe UI", sans-serif';
        ctx.fillText(field.label, field.x + 10, field.y + 18);
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText(included ? '已纳入 ✓' : '未纳入 ○', field.x + 10, field.y + 35);
        ctx.restore();
      });

      const active = fields.find((field) => field.id === s.activeField) ?? fields[0];
      drawEngineerHand(ctx, active.x + 48, active.y - 8, '选择', EMPHASIS);
      drawMeter(ctx, 502, 180, s.includedFields.length / fields.length, s.includedFields.length === fields.length ? SUCCESS : s.includedFields.length === 0 ? FAILURE : CURRENT, 40);

      ctx.save();
      ctx.fillStyle = CURRENT;
      ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.fillText(active.label, 410, 128);
      ctx.fillStyle = MUTED;
      ctx.font = '12px "Segoe UI", sans-serif';
      const detail = details[s.scenario][active.id];
      const detailLines = wrapTextByWidth(ctx, detail, 118);
      detailLines.slice(0, 2).forEach((line, index) => ctx.fillText(line, 410, 154 + index * 19));
      ctx.restore();

      drawStudioLabel(ctx, '执行状态 hₜ', 22, 246, 'left');
      drawStudioLabel(ctx, `${s.includedFields.length}/6 已纳入`, 538, 246, 'right');
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

  const onCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (W / rect.width);
    const y = (event.clientY - rect.top) * (H / rect.height);
    const hit = fields.find((field) => x >= field.x && x <= field.x + 100 && y >= field.y && y <= field.y + 44);
    if (hit) toggleField(hit.id);
  };

  const onFieldKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const columns = 3;
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % fields.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + fields.length) % fields.length;
    else if (event.key === 'ArrowDown') next = (index + columns) % fields.length;
    else if (event.key === 'ArrowUp') next = (index - columns + fields.length) % fields.length;
    else return;
    event.preventDefault();
    document.getElementById(`field-${chapterId}-${moduleId}-${fields[next].id}`)?.focus();
  };

  const feedback = feedbackFor(state);
  const activeLabel = fields.find((field) => field.id === state.activeField)?.label ?? '观察与上下文';

  return (
    <div>
      <div className="chip-row" role="group" aria-label="执行场景">
        {(Object.keys(scenarioLabels) as Scenario[]).map((scenario) => (
          <button
            key={scenario}
            type="button"
            className={`chip ${state.scenario === scenario ? 'selected' : ''}`}
            aria-pressed={state.scenario === scenario}
            onClick={() => chooseScenario(scenario)}
          >
            {scenarioLabels[scenario]}
          </button>
        ))}
      </div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onCanvasClick}
        aria-label={`执行状态检查器，当前场景${scenarioLabels[state.scenario]}，已纳入 ${state.includedFields.length} 个字段`}
      />
      <div className="chip-row" role="group" aria-label="执行状态字段">
        {fields.map((field, index) => {
          const included = state.includedFields.includes(field.id);
          return (
            <button
              id={`field-${chapterId}-${moduleId}-${field.id}`}
              key={field.id}
              type="button"
              className={`chip ${state.activeField === field.id ? 'selected' : ''}`}
              aria-pressed={included}
              onClick={() => toggleField(field.id)}
              onKeyDown={(event) => onFieldKeyDown(event, index)}
            >
              {field.label} · {included ? '已纳入' : '未纳入'}
            </button>
          );
        })}
      </div>
      <div className="step-ctrl">
        <button
          type="button"
          className="tiny ghost"
          onClick={() => publish({ ...stateRef.current, includedFields: fields.map((field) => field.id) })}
        >
          全部纳入
        </button>
        <button
          type="button"
          className="tiny ghost"
          onClick={() => publish({ ...stateRef.current, includedFields: [] })}
        >
          清空选择
        </button>
      </div>
      <div className="feedback" aria-live="polite">
        当前字段：{activeLabel}。{details[state.scenario][state.activeField]}
      </div>
      <div className={`feedback ${feedback.cls}`} aria-live="polite">
        {feedback.text}
      </div>
      <div className="feedback">
        判断题：工具失败后，下一步应联合原始任务 q 与当前状态 hₜ，而不是只使用原始任务。
      </div>
    </div>
  );
};

export default Ch2HarnessState;
