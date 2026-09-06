import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearSea,
  drawBoat,
  drawCoast,
  drawHarbor,
  drawLegend,
  drawRoute,
  drawSceneLabel,
} from './sailing-kit';

const W = 560;
const H = 250;
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#d97706';
const BROWN = '#92400e';
const LINE = '#d7deea';
const TEXT = '#21324a';
const MUTED = '#68778f';

type Feedback = { text: string; cls: '' | 'good' | 'bad' };

function panel(ctx: CanvasRenderingContext2D, x: number, title: string, active: boolean) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,.82)';
  ctx.strokeStyle = active ? BLUE : LINE;
  ctx.lineWidth = active ? 2 : 1;
  ctx.beginPath();
  ctx.roundRect(x, 44, 250, 158, 10);
  ctx.fill();
  ctx.stroke();
  drawSceneLabel(ctx, title, x + 12, 66, active ? BLUE : MUTED);
  ctx.restore();
}

const toolTrace = ['Request sent', '200 OK', 'Results returned'];
const skillTrace = ['0%   Starting...', '35%  Moving', '68%  Obstacle detected', '72%  Localization uncertain', '72%  Execution paused'];
const gapKeywords = [
  { title: 'Continuous', desc: '动作持续一段时间，而不是瞬间返回。' },
  { title: 'Embodiment-dependent', desc: '执行取决于具体机器人的身体和控制器。' },
  { title: 'Uncertain', desc: '结果可能延迟、偏离甚至只完成一部分。' },
  { title: 'Safety-constrained', desc: '动作还必须满足真实世界安全约束。' },
];

function ConsoleLine({ text, tone, active }: { text: string; tone?: 'ok' | 'warn' | 'pause'; active: boolean }) {
  return (
    <div className={`eg-line ${tone ?? ''} ${active ? 'show' : ''}`}>
      <span className="eg-prompt">›</span>
      <span>{text}</span>
    </div>
  );
}

function EmbodimentGapLab() {
  const [phase, setPhase] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);

  useEffect(() => {
    if (phase < 1 || phase >= 6) return undefined;
    const id = window.setTimeout(() => setPhase((current) => Math.min(6, current + 1)), phase === 1 ? 460 : 680);
    return () => window.clearTimeout(id);
  }, [phase]);

  const runBoth = () => {
    setChoice(null);
    setPhase(1);
  };

  const toolDone = phase >= 3;
  const skillPaused = phase >= 6;
  const visibleSkillLines = Math.max(0, phase - 1);

  return (
    <div className="eg-lab">
      <div className="eg-runbar">
        <button className="chap-loader-btn eg-run" onClick={runBoth}>
          ▶ Run Both
        </button>
        <span>同样是“调用工具”，左边很快闭合，右边必须读运行时证据。</span>
      </div>

      <div className="eg-console-grid">
        <section className={`eg-console tool ${toolDone ? 'done' : ''}`}>
          <div className="eg-console-head">
            <span>Software Tool</span>
            <small>clean API</small>
          </div>
          <code className="eg-call">Search("coffee machine")</code>
          <div className="eg-trace" aria-live="polite">
            {toolTrace.map((line, index) => (
              <ConsoleLine key={line} text={line} tone={index === 1 ? 'ok' : undefined} active={phase > index} />
            ))}
          </div>
          <div className={`eg-status ok ${toolDone ? 'show' : ''}`}>✓ Completed</div>
          <pre className={`eg-json ${toolDone ? 'show' : ''}`}>{`status: success
results: 10
latency: 0.42s`}</pre>
        </section>

        <section className={`eg-console skill ${skillPaused ? 'paused' : ''}`}>
          <div className="eg-console-head">
            <span>Robot Skill</span>
            <small>physical execution</small>
          </div>
          <code className="eg-call">move_to(room="kitchen")</code>
          <div className="eg-trace" aria-live="polite">
            {skillTrace.map((line, index) => (
              <ConsoleLine
                key={line}
                text={line}
                tone={index >= 2 ? (index === 4 ? 'pause' : 'warn') : undefined}
                active={visibleSkillLines > index}
              />
            ))}
          </div>
          <div className={`eg-question ${skillPaused ? 'show' : ''}`}>
            <strong>What should the agent do now?</strong>
            <div className="eg-choice-row">
              {['Retry', 'Re-plan', 'Ask for clarification'].map((item) => (
                <button
                  key={item}
                  className={`chip ${choice === item ? 'selected' : ''}`}
                  onClick={() => setChoice(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className={`eg-keywords ${skillPaused ? 'ready' : ''}`}>
        {gapKeywords.map((item, index) => (
          <div className="eg-keyword" key={item.title} style={{ transitionDelay: `${index * 90}ms` }}>
            <strong>{item.title}</strong>
            <span>{item.desc}</span>
          </div>
        ))}
      </div>

      <div className={`eg-summary ${skillPaused ? 'show' : ''}`}>
        <p><b>Software Tool：</b>调用结果通常结构化、明确，可直接读取。</p>
        <p><b>Physical Skill：</b>执行过程持续且不确定，反馈可能延迟、不完整或只反映部分进度。</p>
        <strong>这就是 Embodiment Gap：Physical Skill 不再像 Software Tool 一样具有干净、确定、可直接读取的执行结果。</strong>
        <strong>因此，一个具身 Agent 不只要会规划，还必须会持续监控、验证，并在失败后恢复或重新规划。</strong>
      </div>
    </div>
  );
}

type Scenario = 'recoverable-drift' | 'ambiguous-goal' | 'stale-memory';
type Action = 'continue' | 'retry' | 'clarify' | 'update-memory' | 'replan';

const scenarios: Array<{ id: Scenario; label: string; evidence: [string, string, string] }> = [
  { id: 'recoverable-drift', label: '可恢复偏航', evidence: ['进度 55%', '轻微偏航', '可恢复'] },
  { id: 'ambiguous-goal', label: '目标描述含糊', evidence: ['目标引用不明', '尚未运动', '需要用户意图'] },
  { id: 'stale-memory', label: '地图位置已过期', evidence: ['观测冲突', '旧位置失效', '需要更新依据'] },
];
const actions: Array<{ id: Action; label: string }> = [
  { id: 'continue', label: '继续执行' },
  { id: 'retry', label: '重试技能' },
  { id: 'clarify', label: '请求澄清' },
  { id: 'update-memory', label: '更新记忆' },
  { id: 'replan', label: '重新规划' },
];

function responseFeedback(scenario: Scenario, action: Action | null): Feedback {
  if (!action) {
    if (scenario === 'recoverable-drift') return { cls: '', text: '先读状态：当前执行出现偏差，但后端报告仍可恢复。' };
    if (scenario === 'ambiguous-goal') return { cls: '', text: '目标引用不明确，系统现在缺少的是用户意图，而不是更多运动。' };
    return { cls: '', text: '观测与记忆中的位置冲突；旧路线的空间依据已经失效。' };
  }
  if (scenario === 'recoverable-drift') {
    return action === 'retry'
      ? { cls: 'good', text: '判断成立：偏差可恢复，先重试并继续监控，比立刻推翻整份计划更合适。' }
      : { cls: 'bad', text: '这一步没有充分利用“可恢复”证据；先重试技能，并继续观察结果是否回到目标。' };
  }
  if (scenario === 'ambiguous-goal') {
    return action === 'clarify'
      ? { cls: 'good', text: '判断成立：目标含糊时先澄清，避免把不确定指令直接变成物理动作。' }
      : { cls: 'bad', text: '目标还没说清，继续行动、重试或改地图都不能补足用户意图。' };
  }
  if (action === 'update-memory') return { cls: 'good', text: '判断成立：先把冲突观测写回记忆，后续规划才有可信的空间依据。' };
  if (action === 'replan') return { cls: '', text: '方向接近，但若不先处理过期位置，新计划仍可能沿用旧依据。' };
  return { cls: 'bad', text: '当前问题来自过期空间依据；继续或重试同一动作不会修复这份依据。' };
}

function ResponseLab({ chapterId, moduleId }: WidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scenario, setScenario] = useState<Scenario>('recoverable-drift');
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const stateRef = useRef({ scenario, selectedAction });
  stateRef.current = { scenario, selectedAction };
  const feedback = responseFeedback(scenario, selectedAction);
  const scenarioData = scenarios.find((item) => item.id === scenario) ?? scenarios[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = () => {
      const current = stateRef.current;
      const correct: Action = current.scenario === 'recoverable-drift' ? 'retry' : current.scenario === 'ambiguous-goal' ? 'clarify' : 'update-memory';
      const isCorrect = current.selectedAction === correct;
      clearSea(ctx, W, H);
      drawCoast(ctx, 366, H);
      ctx.fillStyle = 'rgba(255,255,255,.88)';
      ctx.strokeStyle = LINE;
      ctx.beginPath();
      ctx.roundRect(386, 20, 154, 142, 10);
      ctx.fill();
      ctx.stroke();
      const start = { x: 60, y: 184 };
      const stop = { x: 210, y: 124 };
      const harbor = { x: 330, y: 60 };
      drawRoute(ctx, [start, stop], BLUE, 3, false);
      drawRoute(ctx, [stop, harbor], BROWN, 2, true);
      drawHarbor(ctx, harbor.x, harbor.y, GREEN);
      drawBoat(ctx, stop.x, stop.y, BLUE, 0.9, -0.35);
      if (current.scenario === 'recoverable-drift') {
        ctx.strokeStyle = RED;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(146, 70);
        ctx.lineTo(184, 94);
        ctx.stroke();
        drawSceneLabel(ctx, '侧风偏航', 122, 62, RED);
      } else if (current.scenario === 'ambiguous-goal') {
        drawSceneLabel(ctx, '港口？', 286, 44, ORANGE);
      } else {
        ctx.strokeStyle = RED;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(264, 78, 42, 34);
        ctx.setLineDash([]);
        drawSceneLabel(ctx, '旧位置', 260, 126, RED);
      }
      if (current.selectedAction) {
        const color = isCorrect ? GREEN : current.scenario === 'stale-memory' && current.selectedAction === 'replan' ? ORANGE : RED;
        const end = isCorrect ? harbor : { x: 310, y: 170 };
        drawRoute(ctx, [stop, end], color, isCorrect ? 4 : 3, false);
        drawSceneLabel(ctx, isCorrect ? '合适下一步' : '证据未闭合', 236, 202, color);
      }
      drawSceneLabel(ctx, '运行时证据', 398, 42, TEXT);
      scenarioData.evidence.forEach((item, index) => {
        const y = 62 + index * 30;
        ctx.fillStyle = index === 2 ? '#eef5ff' : '#f7f8fa';
        ctx.strokeStyle = index === 2 ? BLUE : LINE;
        ctx.beginPath();
        ctx.roundRect(398, y, 130, 23, 6);
        ctx.fill();
        ctx.stroke();
        drawSceneLabel(ctx, item, 407, y + 16, index === 2 ? BLUE : MUTED);
      });
      drawLegend(ctx, [{ label: '当前证据', color: BLUE }, { label: '合适决定', color: GREEN }], 386, 184);
      canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, render, () => undefined);
    return disconnect;
  }, [scenario, selectedAction, scenarioData.evidence]);

  const chooseScenario = (next: Scenario) => {
    setScenario(next);
    setSelectedAction(null);
  };

  return (
    <div>
      <div className="chip-row" role="group" aria-label="运行时情境">
        {scenarios.map((item) => (
          <button
            key={item.id}
            className={`chip ${scenario === item.id ? 'selected' : ''}`}
            aria-pressed={scenario === item.id}
            onClick={() => chooseScenario(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label={`${scenarioData.label}：${scenarioData.evidence.join('，')}。${feedback.text}`}
      />
      <div className="chip-row" role="group" aria-label="选择下一步决定">
        {actions.map((item) => (
          <button
            key={item.id}
            className={`chip ${selectedAction === item.id ? 'selected' : ''}`}
            aria-pressed={selectedAction === item.id}
            onClick={() => setSelectedAction(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`} aria-live="polite">{feedback.text}</div>
    </div>
  );
}

export const Ch1ClosedLoopLab: React.FC<WidgetProps> = () => <EmbodimentGapLab />;

export default Ch1ClosedLoopLab;
