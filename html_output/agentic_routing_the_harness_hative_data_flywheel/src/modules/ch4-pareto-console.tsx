import React, { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearStudio,
  drawConsole,
  drawEngineerHand,
  drawFader,
  drawLegend,
  drawMeter,
  drawPatchCable,
  drawScoreTrack,
  drawStudioLabel,
  drawTargetBand,
} from './studio-kit';

const W = 560;
const H = 260;
const CURRENT = '#27446e';
const SUCCESS = '#228d5c';
const FAILURE = '#c43f52';
const EMPHASIS = '#d97706';
const MUTED = '#68778f';
const BORDER = '#d7deea';

type Risk = 'recoverable' | 'irreversible';
type RouteBand = 'light' | 'balanced' | 'strong';
type FeedbackTone = 'bad' | 'neutral' | 'good';

interface Candidate {
  id: RouteBand;
  label: string;
  loss: number;
  call: number;
  recovery: number;
  total: number;
}

interface Ch4State {
  lambda: number;
  risk: Risk;
  selected: RouteBand;
  normalizedLoss: number;
  normalizedCallCost: number;
  normalizedRecoveryCost: number;
  normalizedTotalCost: number;
  feedbackTone: FeedbackTone;
}

const TEACHING_TABLE: Record<Risk, readonly Candidate[]> = {
  recoverable: [
    { id: 'strong', label: '强力轨', loss: 0.08, call: 0.78, recovery: 0.12, total: 0.9 },
    { id: 'balanced', label: '均衡轨', loss: 0.22, call: 0.36, recovery: 0.26, total: 0.62 },
    { id: 'light', label: '轻量轨', loss: 0.52, call: 0.06, recovery: 0.12, total: 0.18 },
  ],
  irreversible: [
    { id: 'strong', label: '强力轨', loss: 0.1, call: 0.78, recovery: 0.14, total: 0.92 },
    { id: 'balanced', label: '均衡轨', loss: 0.32, call: 0.36, recovery: 0.36, total: 0.72 },
    { id: 'light', label: '轻量轨', loss: 0.8, call: 0.06, recovery: 0.82, total: 0.88 },
  ],
};

const routeIndex = (route: RouteBand) => ({ strong: 0, balanced: 1, light: 2 }[route]);

function derive(lambda: number, risk: Risk): Ch4State {
  const rounded = Math.round(clamp(lambda, 0, 1) * 20) / 20;
  const ranked = [...TEACHING_TABLE[risk]].sort((a, b) => {
    const objectiveGap = a.loss + rounded * a.total - (b.loss + rounded * b.total);
    if (Math.abs(objectiveGap) > 1e-9) return objectiveGap;
    if (a.total !== b.total) return a.total - b.total;
    return a.loss - b.loss;
  });
  const selected = ranked[0];
  const feedbackTone: FeedbackTone =
    risk === 'recoverable' && selected.id === 'light'
      ? 'bad'
      : rounded >= 0.25 && rounded < 0.7
        ? 'neutral'
        : 'good';
  return {
    lambda: rounded,
    risk,
    selected: selected.id,
    normalizedLoss: selected.loss,
    normalizedCallCost: selected.call,
    normalizedRecoveryCost: selected.recovery,
    normalizedTotalCost: selected.total,
    feedbackTone,
  };
}

const INITIAL_STATE = derive(0.45, 'recoverable');

function feedbackFor(state: Ch4State): string {
  if (state.feedbackTone === 'bad') {
    return 'λ 过高：眼前最便宜，却把失败后的恢复留给整条轨迹买单。';
  }
  if (state.feedbackTone === 'neutral') {
    return '你正在质量与实际总成本之间移动操作点。';
  }
  return '合适的 λ 选择的是前沿上的部署点，不是抽象意义上的唯一最佳模型。';
}

export const Ch4ParetoConsole: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [state, setState] = useState<Ch4State>(INITIAL_STATE);
  const stateRef = useRef<Ch4State>(INITIAL_STATE);
  const handMotionRef = useRef({ from: 0, to: 0, startedAt: 0 });

  const commit = (next: Ch4State) => {
    handMotionRef.current = {
      from: routeIndex(stateRef.current.selected),
      to: routeIndex(next.selected),
      startedAt: performance.now(),
    };
    stateRef.current = next;
    setState(next);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
      canvas.style.width = 'min(100%, 560px)';
      canvas.style.height = 'auto';
    } catch {
      return;
    }

    const render = (now: number) => {
      const s = stateRef.current;
      const candidates = TEACHING_TABLE[s.risk];
      clearStudio(ctx, W, H);
      drawConsole(ctx, 8, 8, 544, 244);

      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 2;
      ctx.strokeRect(16, 16, 300, 190);
      ctx.strokeRect(330, 16, 214, 78);
      ctx.strokeRect(330, 106, 214, 78);
      ctx.strokeRect(330, 196, 214, 48);

      drawTargetBand(ctx, 28, 168, 94);
      drawScoreTrack(ctx, 32, 48, 258, routeIndex(s.selected), CURRENT);
      ctx.strokeStyle = CURRENT;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(38, 178);
      ctx.lineTo(294, 178);
      ctx.moveTo(38, 178);
      ctx.lineTo(38, 42);
      ctx.stroke();
      ctx.fillStyle = MUTED;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('C(τ) ↓', 244, 198);
      ctx.save();
      ctx.translate(24, 110);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('ℓ(τ) ↓', 0, 0);
      ctx.restore();

      candidates.forEach((candidate, index) => {
        const x = 42 + candidate.total * 244;
        const y = 178 - candidate.loss * 136;
        const active = candidate.id === s.selected;
        ctx.beginPath();
        ctx.arc(x, y, active ? 8 : 5, 0, Math.PI * 2);
        ctx.fillStyle = active ? EMPHASIS : CURRENT;
        ctx.fill();
        if (active) {
          ctx.strokeStyle = SUCCESS;
          ctx.lineWidth = 3;
          ctx.stroke();
          drawPatchCable(ctx, { x, y }, { x: 330, y: 34 + index * 20 }, CURRENT);
        }
      });

      candidates.forEach((candidate, index) => {
        const y = 30 + index * 20;
        ctx.fillStyle = candidate.id === s.selected ? '#fff7ed' : '#f6f8fc';
        ctx.fillRect(340, y - 11, 194, 17);
        ctx.strokeStyle = candidate.id === s.selected ? EMPHASIS : BORDER;
        ctx.strokeRect(340, y - 11, 194, 17);
        ctx.fillStyle = CURRENT;
        ctx.font = '600 12px "Segoe UI", sans-serif';
        ctx.fillText(candidate.label, 352, y + 2);
        ctx.textAlign = 'right';
        ctx.fillText(`J ${(candidate.loss + s.lambda * candidate.total).toFixed(3)}`, 526, y + 2);
        ctx.textAlign = 'left';
      });

      const motion = handMotionRef.current;
      const motionT = clamp((now - motion.startedAt) / 220, 0, 1);
      const handIndex = motion.from + (motion.to - motion.from) * motionT;
      drawEngineerHand(ctx, 316, 30 + handIndex * 20, 'point', EMPHASIS);

      const callWidth = 184 * s.normalizedCallCost;
      const recoveryWidth = 184 * s.normalizedRecoveryCost;
      ctx.fillStyle = EMPHASIS;
      ctx.fillRect(344, 132, callWidth, 18);
      ctx.fillStyle = FAILURE;
      ctx.fillRect(344 + callWidth, 132, recoveryWidth, 18);
      ctx.strokeStyle = CURRENT;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(344, 132, Math.min(184, callWidth + recoveryWidth), 18);
      drawFader(ctx, 350, 171, s.lambda, EMPHASIS);
      drawMeter(ctx, 482, 116, 1 - s.normalizedLoss, s.normalizedRecoveryCost > s.normalizedCallCost ? FAILURE : SUCCESS, 64);
      drawStudioLabel(ctx, '调用 + 恢复', 342, 121, 'left');
      drawStudioLabel(ctx, '延迟是独立第三轴', 437, 216, 'center');
      ctx.fillStyle = MUTED;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('本教学面板不填虚构秒数', 348, 235);
      drawLegend(
        ctx,
        [
          { label: '当前点', color: EMPHASIS },
          { label: '可用方向', color: SUCCESS },
        ],
        178,
        34
      );
      ctx.fillStyle = CURRENT;
      ctx.font = '600 12px "Segoe UI", sans-serif';
      ctx.fillText('教学归一化 · 非论文基准', 34, 24);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (now: number) => {
      render(now);
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const candidates = useMemo(() => TEACHING_TABLE[state.risk], [state.risk]);
  const selectedLabel = candidates.find((candidate) => candidate.id === state.selected)?.label ?? '';
  const feedbackClass = state.feedbackTone === 'neutral' ? 'feedback' : `feedback ${state.feedbackTone}`;

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label={`质量成本教学前沿，当前选择${selectedLabel}，轨迹损失${state.normalizedLoss.toFixed(2)}，总成本${state.normalizedTotalCost.toFixed(2)}`}
      />

      <div className="ctrl">
        <label htmlFor={`${chapterId}-${moduleId}-lambda`}>
          成本权重 λ
          <span className="val">{state.lambda.toFixed(2)}</span>
        </label>
        <input
          id={`${chapterId}-${moduleId}-lambda`}
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(state.lambda * 100)}
          onChange={(event) => commit(derive(Number(event.target.value) / 100, stateRef.current.risk))}
          aria-describedby={`${chapterId}-${moduleId}-scale-note`}
        />
        <span id={`${chapterId}-${moduleId}-scale-note`}>教学窗口 0—1，不是论文上界</span>
      </div>

      <div className="chip-row" role="group" aria-label="动作恢复性">
        <button
          type="button"
          className={`chip ${state.risk === 'recoverable' ? 'selected' : ''}`}
          aria-pressed={state.risk === 'recoverable'}
          onClick={() => commit(derive(stateRef.current.lambda, 'recoverable'))}
        >
          可恢复
        </button>
        <button
          type="button"
          className={`chip ${state.risk === 'irreversible' ? 'selected' : ''}`}
          aria-pressed={state.risk === 'irreversible'}
          onClick={() => commit(derive(stateRef.current.lambda, 'irreversible'))}
        >
          弱可恢复或不可逆
        </button>
      </div>

      <div className="metrics" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))' }}>
        <div className="metric"><div className="l">已选路线</div><div className="v" style={{ fontSize: 20 }}>{selectedLabel}</div></div>
        <div className="metric"><div className="l">归一化轨迹损失</div><div className="v">{state.normalizedLoss.toFixed(2)}</div></div>
        <div className="metric"><div className="l">归一化调用成本</div><div className="v">{state.normalizedCallCost.toFixed(2)}</div></div>
        <div className="metric"><div className="l">归一化恢复成本</div><div className="v">{state.normalizedRecoveryCost.toFixed(2)}</div></div>
        <div className="metric"><div className="l">归一化总成本 C</div><div className="v">{state.normalizedTotalCost.toFixed(2)}</div></div>
      </div>

      <div className={feedbackClass} aria-live="polite">{feedbackFor(state)}</div>
      {state.risk === 'irreversible' && state.selected === 'strong' ? (
        <div className="hotspot-info">
          不可逆状态抬高了低能力选择的轨迹损失与恢复代价；当前教学表因此保留强力轨。这只是教学表的派生结果，不是论文测量值。
        </div>
      ) : null}

      <div className="hotspot-info">
        <b>有效与禁用：</b>42 个 λ×风险状态都可操作；三张路线由 argmin 自动派生，不能手动覆盖。“弱可恢复或不可逆 + 轻量轨”在当前教学表中不会被强制选中，不能把这一界面约束说成论文对真实模型的禁令。
      </div>

      <h5 style={{ marginTop: 18 }}>论文实测参照：协议必须分开</h5>
      <table className="paper">
        <thead>
          <tr><th>协议</th><th>方法</th><th>分数 ↑</th><th>美元/任务 ↓</th><th>边界</th></tr>
        </thead>
        <tbody>
          <tr><td>PinchBench v1.2.1</td><td>路由 OPENSQUILLA</td><td>93.14</td><td>0.0204</td><td rowSpan={2}>OpenClaw 与 OPENSQUILLA 的 Harness/agent 不同，差额不能纯归因于路由。</td></tr>
          <tr><td>PinchBench v1.2.1</td><td>固定 OpenClaw Opus 4.8</td><td>93.35</td><td>0.2224</td></tr>
          <tr><td>DRACO，同一 OPENSQUILLA Harness</td><td>路由，阈值 0.95</td><td>52.33</td><td>0.3729</td><td rowSpan={2}>路由输入 token 略多；节省部分来自更便宜的调用组合。</td></tr>
          <tr><td>DRACO，同一 OPENSQUILLA Harness</td><td>固定 Opus 4.8</td><td>52.36</td><td>0.6559</td></tr>
        </tbody>
      </table>
      <div className="feedback bad">
        延迟不能消失：PinchBench 多模型点为 0.9431、$0.1349、272.4K token、p50 96.0 秒；Opus 4.8 为 0.9433、$0.1649、97.7K token、p50 23.1 秒。论文正文称质量差 0.0003，表格四舍五入值相差 0.0002；并行、提前停止和更严预算只是提出的缓解方向，不是已验证修复。
      </div>

      <div className="hotspot-info">
        <b>你的判断：</b>如果一次调用只花 0.06，但恢复再花 0.82，你会把它称为最低成本路线吗？只有把调用与恢复都纳入 C(τ)，再同时检查 ℓ(τ)，才是在判断轨迹级前沿。
      </div>
      <div className="hotspot-info">
        <b>何时失效：</b>跨 Harness、跨提供商或不同分数尺度直接连线，或遗漏恢复成本、失败后果与墙钟延迟时，“最低成本”只是残缺估计；论文当前报告聚合端到端操作点，不提供本滑杆每一格的路线级因果分解。
      </div>
    </div>
  );
};

export default Ch4ParetoConsole;
