import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { clearStudio, drawConsole, drawPatchCable, drawStudioLabel, roundedRect } from './studio-kit';

const W = 560;
const H = 260;
const CURRENT = '#27446e';
const SUCCESS = '#228d5c';
const FAILURE = '#c43f52';
const EMPHASIS = '#d97706';
const AUXILIARY = '#7c3aed';
const MUTED = '#68778f';
const BORDER = '#d7deea';

type TaskKind = 'coding' | 'tool' | 'research';
type Regime = 'cost' | 'accuracy';
type Method = 'vote' | 'verifier' | 'judge' | 'fallback';
type SignalMode = 'available' | 'missing';
type Phase = 'idle' | 'running' | 'complete';
type FeedbackTone = 'bad' | 'neutral' | 'good';

interface TaskDef {
  label: string;
  canvasLabel: string;
  signals: string;
  output: string;
  verifiedOutput: string;
}

interface MethodDef {
  label: string;
  english: string;
  symbol: string;
  color: string;
  decision: string;
  bestFor: string;
  caveat: string;
  overhead: string;
}

const TASKS: Record<TaskKind, TaskDef> = {
  coding: {
    label: 'Coding',
    canvasLabel: 'CODING',
    signals: '单测 · 静态分析 · 补丁应用',
    output: 'PATCH',
    verifiedOutput: '测试通过',
  },
  tool: {
    label: 'Tool-use',
    canvasLabel: 'TOOL',
    signals: 'Schema · 权限 · 安全约束',
    output: 'ACTION',
    verifiedOutput: '约束通过',
  },
  research: {
    label: 'Research',
    canvasLabel: 'RESEARCH',
    signals: '事实 · 引用 · 一致性 · 量表',
    output: 'REPORT',
    verifiedOutput: '量表收束',
  },
};

const REGIME_LABEL: Record<Regime, string> = {
  cost: '省成本',
  accuracy: '冲准确',
};

const SIGNAL_LABEL: Record<SignalMode, string> = {
  available: '任务信号可用',
  missing: '验证信号缺失',
};

const METHODS: Record<Method, MethodDef> = {
  vote: {
    label: '投票',
    english: 'Voting',
    symbol: '≡',
    color: EMPHASIS,
    decision: '把可直接比较的候选按一致意见收束。',
    bestFor: '结构化、可比较的答案',
    caveat: '多数候选可能共享同一个盲点。',
    overhead: '较低',
  },
  verifier: {
    label: '验证器选择',
    english: 'Verifier selection',
    symbol: '✓',
    color: SUCCESS,
    decision: '执行测试或约束，选择真正通过的候选。',
    bestFor: '代码、工具调用、结构约束',
    caveat: '验证器覆盖不到的错误仍会漏过。',
    overhead: '低—中',
  },
  judge: {
    label: '裁判 / 融合',
    english: 'Judge / fusion',
    symbol: '◇',
    color: AUXILIARY,
    decision: '按量表选择、重写或综合多个候选。',
    bestFor: '开放研究与长文本任务',
    caveat: '模型裁判不是外部真值，且会增加成本。',
    overhead: '较高',
  },
  fallback: {
    label: '回退',
    english: 'Fallback',
    symbol: '↩',
    color: CURRENT,
    decision: '首选未过约束时，切换到备用候选。',
    bestFor: '有清晰失败信号的恢复路径',
    caveat: '没有可靠触发信号时，回退也会失准。',
    overhead: '按需发生',
  },
};

const METHOD_ORDER: Method[] = ['vote', 'verifier', 'judge', 'fallback'];

function recommendedMethod(task: TaskKind, regime: Regime): Method {
  if (task === 'coding') return 'verifier';
  if (task === 'tool') return regime === 'cost' ? 'fallback' : 'verifier';
  return regime === 'cost' ? 'vote' : 'judge';
}

function proposerCount(regime: Regime): number {
  return regime === 'cost' ? 2 : 3;
}

function outputStatus(task: TaskKind, method: Method, signal: SignalMode): string {
  if (signal === 'missing') return '待复核';
  if (method === 'verifier') return TASKS[task].verifiedOutput;
  if (method === 'fallback') return '备用候选接管';
  if (method === 'vote') return '一致意见 · 需复核';
  return task === 'research' ? '量表收束' : '裁判收束';
}

function feedbackFor(
  task: TaskKind,
  regime: Regime,
  method: Method,
  signal: SignalMode
): { tone: FeedbackTone; text: string } {
  if (signal === 'missing') {
    return {
      tone: 'bad',
      text: '验证信号缺失：候选可以被投票、重写或切换，但都不能因此标成“可靠通过”。先补充测试、约束或可审计量表。',
    };
  }
  const recommended = recommendedMethod(task, regime);
  if (method === recommended) {
    if (task === 'research' && method === 'vote') {
      return {
        tone: 'neutral',
        text: '教学上的低成本路径：先用一致意见收束，再保留人工或外部事实复核；多数意见本身不是事实。',
      };
    }
    return {
      tone: 'good',
      text: `当前教学规则推荐“${METHODS[method].label}”：它优先利用 ${TASKS[task].signals}，再交付一个 ${TASKS[task].output}。`,
    };
  }
  if (method === 'judge' && regime === 'cost') {
    return {
      tone: 'neutral',
      text: '强裁判可以处理开放输出，但在省成本模式中要先证明质量增益足以覆盖额外模型调用与延迟。',
    };
  }
  return {
    tone: 'neutral',
    text: `你正在比较“${METHODS[method].label}”。它不是禁用选项，但要检查当前任务是否真的提供了它需要的判定信号。`,
  };
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  stroke: string,
  lineWidth = 2,
  radius = 8
) {
  roundedRect(ctx, x, y, w, h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function candidateMark(method: Method, index: number): string {
  if (method === 'vote') return index < 2 ? 'A' : 'B';
  if (method === 'verifier') return index === 1 ? '✓' : '×';
  if (method === 'judge') return ['◫', '◧', '◩'][index] ?? '◫';
  return index === 0 ? '×' : index === 1 ? '↩' : '·';
}

export const Ch6AggregationSteps: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastAnimatedRunRef = useRef(0);
  const [task, setTask] = useState<TaskKind>('coding');
  const [regime, setRegime] = useState<Regime>('accuracy');
  const [method, setMethod] = useState<Method>('verifier');
  const [signal, setSignal] = useState<SignalMode>('available');
  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [status, setStatus] = useState('工作台已就绪；可切换任务、目标和聚合方式。');
  const isRunning = phase === 'running';

  const changeTask = (nextTask: TaskKind) => {
    const nextMethod = recommendedMethod(nextTask, regime);
    setTask(nextTask);
    setMethod(nextMethod);
    setPhase('idle');
    setStatus(`已切换到 ${TASKS[nextTask].label}；教学推荐更新为“${METHODS[nextMethod].label}”，请运行一次。`);
  };

  const changeRegime = (nextRegime: Regime) => {
    const nextMethod = recommendedMethod(task, nextRegime);
    setRegime(nextRegime);
    setMethod(nextMethod);
    setPhase('idle');
    setStatus(`已切换到${REGIME_LABEL[nextRegime]}；候选数量与教学推荐已更新，请运行一次。`);
  };

  const changeMethod = (nextMethod: Method) => {
    setMethod(nextMethod);
    setPhase('idle');
    setStatus(`正在比较“${METHODS[nextMethod].label}”：候选标记与收束路径已改变，请运行一次。`);
  };

  const changeSignal = (nextSignal: SignalMode) => {
    setSignal(nextSignal);
    setPhase('idle');
    setStatus(
      nextSignal === 'missing'
        ? '验证信号已移除：旧结果已清除；运行后也只能标成“待复核”。'
        : `已恢复 ${TASKS[task].signals}，请运行一次。`
    );
  };

  const runOnce = () => {
    setPhase('running');
    setStatus('正在运行：proposer 独立生成候选，随后读取任务信号并收束。');
    setRunId((value) => value + 1);
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
    canvas.style.width = '560px';
    canvas.style.height = '260px';
    canvas.style.maxWidth = 'none';

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animate = runId > lastAnimatedRunRef.current && !reduced;
    if (runId > lastAnimatedRunRef.current) lastAnimatedRunRef.current = runId;
    const startedAt = performance.now();
    const methodDef = METHODS[method];
    const taskDef = TASKS[task];
    const count = proposerCount(regime);
    const completionMessage = signal === 'missing'
      ? `运行完成：${count} 条候选经“${methodDef.label}”生成一个 ${taskDef.output}，但没有可信信号，仍待复核。`
      : `运行完成：${count} 条候选经“${methodDef.label}”收束为一个 ${taskDef.output}。`;
    const visibleStatus = phase === 'idle'
      ? '待运行'
      : phase === 'running'
        ? '收束中'
        : outputStatus(task, method, signal);

    const render = (progress: number) => {
      const p = clamp(progress, 0, 1);
      const candidateProgress = clamp(p / 0.42, 0, 1);
      const decisionProgress = clamp((p - 0.34) / 0.34, 0, 1);
      const outputProgress = clamp((p - 0.66) / 0.34, 0, 1);
      const chosenColor = signal === 'missing' ? FAILURE : methodDef.color;
      const outputColor = phase === 'idle' ? MUTED : chosenColor;

      clearStudio(ctx, W, H);
      drawConsole(ctx, 8, 8, 544, 244);

      drawCard(ctx, 16, 16, 528, 34, 'rgba(39,68,110,.06)', BORDER, 1.5, 8);
      ctx.fillStyle = CURRENT;
      ctx.font = '700 14px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${taskDef.canvasLabel} · ${REGIME_LABEL[regime]}`, 28, 38);
      ctx.textAlign = 'right';
      ctx.fillStyle = signal === 'missing' ? FAILURE : SUCCESS;
      ctx.fillText(signal === 'missing' ? '信号缺失' : '信号已接入', 532, 38);

      drawCard(ctx, 16, 58, 168, 132, 'rgba(255,255,255,.82)', BORDER, 1.5, 10);
      drawCard(ctx, 196, 58, 202, 132, 'rgba(255,255,255,.82)', BORDER, 1.5, 10);
      drawCard(ctx, 410, 58, 134, 132, 'rgba(255,255,255,.82)', BORDER, 1.5, 10);
      drawStudioLabel(ctx, '① 独立候选 rₘ', 28, 74, 'left');
      drawStudioLabel(ctx, '② 信号 + 决策', 208, 74, 'left');
      drawStudioLabel(ctx, '③ 单一输出 r̂ₜ', 422, 74, 'left');

      const candidateYs = [100, 134, 168];
      ctx.globalAlpha = candidateProgress;
      candidateYs.slice(0, count).forEach((y) => {
        drawPatchCable(ctx, { x: 162, y }, { x: 191, y: 132 }, methodDef.color);
      });
      ctx.globalAlpha = decisionProgress;
      ctx.strokeStyle = chosenColor;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(191, 132);
      ctx.lineTo(405, 132);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      [191, 405].forEach((x) => {
        ctx.beginPath();
        ctx.arc(x, 132, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      ctx.globalAlpha = 1;

      candidateYs.forEach((y, index) => {
        const active = index < count;
        const localFill = clamp(candidateProgress * 1.35 - index * 0.18, 0, 1);
        const candidateColor = method === 'judge'
          ? [CURRENT, AUXILIARY, EMPHASIS][index]
          : methodDef.color;
        drawCard(ctx, 28, y - 13, 104, 27, active ? '#fffdf8' : '#f2f4f7', active ? candidateColor : BORDER, active ? 2 : 1, 6);
        ctx.fillStyle = active ? CURRENT : MUTED;
        ctx.font = '700 15px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(active ? `r${index + 1}` : '未调用', 38, y + 5);
        if (active) {
          ctx.fillStyle = candidateColor;
          ctx.textAlign = 'right';
          ctx.font = '800 17px "Segoe UI Symbol", "Segoe UI", sans-serif';
          ctx.fillText(candidateMark(method, index), 120, y + 5);
          ctx.globalAlpha = 0.15 + localFill * 0.85;
          ctx.fillRect(139, y - 4, 20, 8);
          ctx.globalAlpha = 1;
        }
      });

      const methodCards = [
        { key: 'vote' as Method, x: 208, y: 111 },
        { key: 'verifier' as Method, x: 302, y: 111 },
        { key: 'judge' as Method, x: 208, y: 153 },
        { key: 'fallback' as Method, x: 302, y: 153 },
      ];

      ctx.globalAlpha = 0.25 + decisionProgress * 0.75;
      drawCard(ctx, 208, 82, 178, 23, signal === 'missing' ? 'rgba(196,63,82,.10)' : 'rgba(34,141,92,.10)', signal === 'missing' ? FAILURE : SUCCESS, 1.5, 8);
      ctx.fillStyle = signal === 'missing' ? FAILURE : CURRENT;
      ctx.font = '600 12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(signal === 'missing' ? '没有可信结算信号' : taskDef.signals, 297, 98);
      ctx.globalAlpha = 1;

      methodCards.forEach((card) => {
        const item = METHODS[card.key];
        const selected = card.key === method;
        const labelLines = card.key === 'verifier'
          ? [`${item.symbol} 验证器`, '选择']
          : card.key === 'judge'
            ? [`${item.symbol} 裁判 /`, '融合']
            : [`${item.symbol} ${item.label}`];
        drawCard(ctx, card.x, card.y, 84, 32, selected ? `${item.color}18` : '#f6f8fc', selected ? chosenColor : BORDER, selected ? 3 : 1, 7);
        ctx.fillStyle = selected ? chosenColor : MUTED;
        ctx.font = labelLines.length > 1
          ? selected
            ? '800 11px "Segoe UI Symbol", "Segoe UI", sans-serif'
            : '600 11px "Segoe UI", sans-serif'
          : selected
            ? '800 14px "Segoe UI Symbol", "Segoe UI", sans-serif'
            : '600 13px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        labelLines.forEach((line, lineIndex) => {
          const lineY = labelLines.length > 1 ? card.y + 12 + lineIndex * 13 : card.y + 21;
          ctx.fillText(line, card.x + 42, lineY, 72);
        });
      });

      const outputY = 96 + (1 - easeInOutQuad(outputProgress)) * 12;
      ctx.globalAlpha = 0.18 + outputProgress * 0.82;
      drawCard(
        ctx,
        424,
        outputY,
        106,
        64,
        phase === 'idle' ? '#f6f8fc' : signal === 'missing' ? 'rgba(196,63,82,.08)' : `${methodDef.color}12`,
        outputColor,
        3,
        9
      );
      ctx.fillStyle = outputColor;
      ctx.font = '900 20px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(taskDef.output, 477, outputY + 27);
      ctx.font = '700 12px "Segoe UI", sans-serif';
      ctx.fillText(visibleStatus, 477, outputY + 49, 88);
      ctx.globalAlpha = 1;

      drawCard(ctx, 16, 200, 528, 44, '#f6f8fc', BORDER, 1.5, 8);
      ctx.fillStyle = CURRENT;
      ctx.font = '700 13px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`候选 ${count} 条（示意）`, 30, 227);
      ctx.fillText(`${methodDef.symbol} ${methodDef.label}`, 170, 227);
      ctx.fillStyle = FAILURE;
      ctx.fillText('候选调用 + 聚合 + 延迟共同入账', 322, 227);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    if (!animate) {
      render(1);
      if (reduced && runId > 0 && phase === 'running') {
        setPhase('complete');
        setStatus(completionMessage);
      }
      return;
    }

    const tick = (now: number) => {
      const progress = clamp((now - startedAt) / 1450, 0, 1);
      render(progress);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        setPhase('complete');
        setStatus(completionMessage);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [method, phase, regime, runId, signal, task]);

  const feedback = feedbackFor(task, regime, method, signal);
  const recommended = recommendedMethod(task, regime);
  const feedbackClass = feedback.tone === 'neutral' ? 'feedback' : `feedback ${feedback.tone}`;

  return (
    <div className="ch6-workbench">
      <div className="ch6-control-label">① 任务类型</div>
      <div className="chip-row" role="group" aria-label="任务类型">
        {(Object.keys(TASKS) as TaskKind[]).map((item) => (
          <button key={item} type="button" className={`chip ${task === item ? 'selected' : ''}`} aria-pressed={task === item} onClick={() => changeTask(item)}>
            {TASKS[item].label}
          </button>
        ))}
      </div>

      <div className="ch6-control-label">② 部署目标</div>
      <div className="chip-row" role="group" aria-label="部署目标">
        {(Object.keys(REGIME_LABEL) as Regime[]).map((item) => (
          <button key={item} type="button" className={`chip ${regime === item ? 'selected' : ''}`} aria-pressed={regime === item} onClick={() => changeRegime(item)}>
            {REGIME_LABEL[item]}
          </button>
        ))}
      </div>

      <div className="ch6-control-label">③ 聚合 / 决策方式</div>
      <div className="chip-row" role="group" aria-label="聚合与决策方式">
        {METHOD_ORDER.map((item) => (
          <button key={item} type="button" className={`chip ${method === item ? 'selected' : ''}`} aria-pressed={method === item} onClick={() => changeMethod(item)}>
            <span aria-hidden="true">{METHODS[item].symbol}</span> {METHODS[item].label}
          </button>
        ))}
      </div>

      <div className="ch6-control-label">④ 验证状态</div>
      <div className="chip-row" role="group" aria-label="验证信号状态">
        {(Object.keys(SIGNAL_LABEL) as SignalMode[]).map((item) => (
          <button key={item} type="button" className={`chip ${signal === item ? 'selected' : ''}`} aria-pressed={signal === item} onClick={() => changeSignal(item)}>
            {SIGNAL_LABEL[item]}
          </button>
        ))}
      </div>

      <div className="ch6-canvas-scroll" role="region" aria-label="两阶段聚合流程图，可横向滚动" tabIndex={0}>
        <canvas
          id={`cv-${chapterId}-${moduleId}`}
          ref={canvasRef}
          width={W}
          height={H}
          role="img"
          aria-label={`${proposerCount(regime)} 条匿名 proposer 独立生成候选，候选数量与标记仅作教学示意；读取 ${signal === 'available' ? TASKS[task].signals : '缺失的验证信号'}，通过${METHODS[method].label}收束为一个 ${TASKS[task].output}；当前阶段为${phase === 'idle' ? '待运行' : phase === 'running' ? '收束中' : outputStatus(task, method, signal)}`}
        />
      </div>

      <div className="step-ctrl">
        <button type="button" className="tiny" onClick={runOnce} disabled={isRunning}>{isRunning ? '正在运行…' : '▶ 运行一次'}</button>
        <span className="step-label">教学推荐：<b>{METHODS[recommended].label}</b></span>
      </div>

      <div className="metrics">
        <div className="metric"><div className="l">最强可用信号</div><div className="v ch6-metric-value">{signal === 'available' ? TASKS[task].signals : '无'}</div></div>
        <div className="metric"><div className="l">当前决策</div><div className="v ch6-metric-value">{METHODS[method].label}</div></div>
        <div className="metric"><div className="l">输出状态</div><div className="v ch6-metric-value">{phase === 'idle' ? '待运行' : phase === 'running' ? '收束中' : outputStatus(task, method, signal)}</div></div>
      </div>

      <div className="feedback" role="status" aria-live="polite">{status}</div>
      <div className={feedbackClass}>{feedback.text}</div>
      <div className="hotspot-info">
        <b>教学规则，不是论文消融：</b>上面的任务—策略匹配、匿名候选数量及 A/B、✓/×、回退标记都只用于理解机制，并非论文逐任务实测。论文给出 Voting、Verifier、Judge/Fusion 与 Fallback 这组策略空间，但没有报告这四种策略的逐项对照、固定阈值或每个任务实际采用的方法。
      </div>

      <h5 className="ch6-subtitle">四种收束方式，差别不在“文字长短”</h5>
      <div className="ch6-method-grid">
        {METHOD_ORDER.map((item) => {
          const data = METHODS[item];
          return (
            <button
              key={item}
              type="button"
              className={`ch6-method-card ${method === item ? 'is-active' : ''}`}
              style={{ '--method-color': data.color } as React.CSSProperties}
              aria-pressed={method === item}
              onClick={() => changeMethod(item)}
            >
              <span className="ch6-method-symbol" aria-hidden="true">{data.symbol}</span>
              <span className="ch6-method-copy"><b>{data.label}</b><small>{data.english}</small><span>{data.decision}</span></span>
            </button>
          );
        })}
      </div>

      <div className="ch6-table-scroll" role="region" aria-label="四种聚合策略比较表，可横向滚动" tabIndex={0}>
        <table className="paper">
          <caption className="ch6-table-caption">教学定性比较（非论文实测或消融）</caption>
          <thead><tr><th scope="col">方式</th><th scope="col">教学上更适合</th><th scope="col">主要风险（定性）</th><th scope="col">相对开销（定性）</th></tr></thead>
          <tbody>
            {METHOD_ORDER.map((item) => (
              <tr key={item}>
                <th scope="row">{METHODS[item].symbol} {METHODS[item].label}</th>
                <td>{METHODS[item].bestFor}</td><td>{METHODS[item].caveat}</td><td>{METHODS[item].overhead}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hotspot-info">
        <b>两阶段不是五个割裂按钮：</b>Router 联合决定 proposer 集合 <code>Pₜ</code> 与聚合策略 <code>aₜ</code>；候选独立生成后，聚合器再读取模型身份、当前 <code>hₜ</code> 与可用验证，把它们收束成一个行动。聚合可以是选择、投票、融合，也可以只是回退到备用候选。
      </div>

      <h5 className="ch6-subtitle" id={`${chapterId}-${moduleId}-evidence`}>论文配置实例：DRACO 默认 DuckDuckGo</h5>
      <div className="ch6-table-scroll" role="region" aria-labelledby={`${chapterId}-${moduleId}-evidence`} tabIndex={0}>
        <table className="paper">
          <thead><tr><th scope="col">方法</th><th scope="col">分数 ↑</th><th scope="col">美元/任务 ↓</th><th scope="col">覆盖率</th><th scope="col">协议说明</th></tr></thead>
          <tbody>
            <tr><th scope="row">所选多模型配置</th><td>60.82</td><td>0.3766</td><td>100/100</td><td>DeepSeek V4、GLM 5.2、Gemini 3 Flash、Qwen 3.7 独立提议；GLM 5.2 固定聚合，并对便宜模型额外采样</td></tr>
            <tr><th scope="row">Fable 5</th><td>59.80</td><td>1.2122</td><td>94/100</td><td>质量与成本按完成任务报告，不能把缺失 6 项补成任意结果</td></tr>
          </tbody>
        </table>
      </div>
      <div className="feedback bad">
        这是完整配置的端到端结果，不是四种聚合方式的消融。论文没有公开完整聚合 prompt、固定的“评分→摘取→重写”流程或逐任务聚合记录，也不能把结果差异因果归到某一种收束方式。
      </div>
      <div className="hotspot-info">
        <b>何时失效：</b>候选不承担不同角色、Harness 没有可信验证、聚合器只复述多数意见，或额外调用造成不可接受的货币成本与 p95 延迟时，多模型聚合不能被视为更好的前沿点。
      </div>
    </div>
  );
};

export default Ch6AggregationSteps;
