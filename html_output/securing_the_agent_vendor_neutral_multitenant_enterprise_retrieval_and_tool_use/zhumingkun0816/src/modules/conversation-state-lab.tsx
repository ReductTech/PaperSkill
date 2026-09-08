import { useState, type CSSProperties } from 'react';
import { clamp01, easeInOutCubic, lerp } from '../animation/easing';
import { useTimeline } from '../animation/useTimeline';
import { ChipRow, Feedback, LabCanvas, LabShell, type Tone } from './shared/LabChrome';
import { C, arrow, box, label } from './shared/canvasDrawing';
import type { PaperWidgetProps } from './library-scenes';

export type StateMode = 'shared' | 'tenant';
export type AgentPathStage = 'request' | 'context' | 'inference' | 'authorize' | 'tool-result' | 'next-turn';
export type AgentPacketPhase = 'route' | 'write' | 'read';

const stages = [
  { key: 'request', label: 'Finance 请求', packet: 'Finance Q' },
  { key: 'context', label: '授权上下文', packet: '授权 ctx' },
  { key: 'inference', label: '首次推理', packet: 'Finance ctx' },
  { key: 'authorize', label: '工具前校验', packet: 'tool call' },
  { key: 'tool-result', label: '工具结果', packet: 'tool result' },
  { key: 'next-turn', label: '下一轮推理', packet: 'history' },
] as const satisfies readonly { key: AgentPathStage; label: string; packet: string }[];

export const CONVERSATION_STATE_LAYOUT = {
  width: 560,
  height: 292,
  stagePoints: [
    { x: 55, y: 64 },
    { x: 155, y: 64 },
    { x: 255, y: 64 },
    { x: 355, y: 64 },
    { x: 455, y: 64 },
    { x: 128, y: 221 },
  ],
  storageEntry: { x: 501, y: 228 },
  writeControl: { x: 536, y: 128 },
  readControl: { x: 304, y: 270 },
} as const;

const CONVERSATION_STATE_DISPLAY = {
  logicalWidth: 560,
  maxDisplayWidth: 820,
  minimumLogicalFontPx: 7.5,
} as const;

export function deriveConversationStateDisplayMetrics() {
  const scale = CONVERSATION_STATE_DISPLAY.maxDisplayWidth / CONVERSATION_STATE_DISPLAY.logicalWidth;
  return {
    ...CONVERSATION_STATE_DISPLAY,
    scale,
    minimumDisplayedFontPx: CONVERSATION_STATE_DISPLAY.minimumLogicalFontPx * scale,
  };
}

export interface AgentPacketMotion {
  x: number;
  y: number;
  phase: AgentPacketPhase;
  label: string;
}

export interface AgentPathScene {
  step: number;
  stage: AgentPathStage;
  activeStage: string;
  phaseTitle: string;
  packetLabel: string;
  toolAuthorizationRequired: boolean;
  historyLeak: boolean;
  historyText: string;
  stateVault: StateMode;
  stateCompartmentCount: 1 | 2;
  stateItems: string[];
  nextTurnItems: string[];
  tone: Tone;
  feedback: string;
}

function quadraticPoint(
  start: { x: number; y: number },
  control: { x: number; y: number },
  end: { x: number; y: number },
  progress: number,
) {
  const t = clamp01(progress);
  const inverse = 1 - t;
  return {
    x: inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * end.x,
    y: inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * end.y,
  };
}

function deriveFinalRoute(progress: number): AgentPacketMotion {
  const t = clamp01(progress);
  const toolResult = CONVERSATION_STATE_LAYOUT.stagePoints[4];
  const nextTurn = CONVERSATION_STATE_LAYOUT.stagePoints[5];
  if (t < 0.5) {
    const point = quadraticPoint(
      toolResult,
      CONVERSATION_STATE_LAYOUT.writeControl,
      CONVERSATION_STATE_LAYOUT.storageEntry,
      t / 0.5,
    );
    return { ...point, phase: 'write', label: 'tool result' };
  }
  const point = quadraticPoint(
    CONVERSATION_STATE_LAYOUT.storageEntry,
    CONVERSATION_STATE_LAYOUT.readControl,
    nextTurn,
    (t - 0.5) / 0.5,
  );
  return { ...point, phase: 'read', label: 'history' };
}

export function deriveAgentPacketMotion(
  fromStep: number,
  toStep: number,
  progress: number,
): AgentPacketMotion {
  const from = Math.max(0, Math.min(stages.length - 1, Math.round(fromStep)));
  const to = Math.max(0, Math.min(stages.length - 1, Math.round(toStep)));
  const t = clamp01(progress);
  if (from === 4 && to === 5) return deriveFinalRoute(t);
  if (from === 5 && to === 4) return deriveFinalRoute(1 - t);

  const start = CONVERSATION_STATE_LAYOUT.stagePoints[from];
  const end = CONVERSATION_STATE_LAYOUT.stagePoints[to];
  return {
    x: lerp(start.x, end.x, t),
    y: lerp(start.y, end.y, t),
    phase: 'route',
    label: stages[to].packet,
  };
}

export function deriveAgentPathScene(step: number, mode: StateMode): AgentPathScene {
  const boundedStep = Math.max(0, Math.min(stages.length - 1, Math.round(step)));
  const toolAuthorizationRequired = boundedStep === 3;
  const historyLeak = mode === 'shared' && boundedStep >= 5;
  const stateItems = ['Finance 历史', 'Legal 旧工具结果'];
  const nextTurnItems = boundedStep < 5
    ? []
    : mode === 'shared'
      ? ['Finance 历史', 'Legal 旧工具结果']
      : ['Finance 历史', 'Finance 工具结果'];
  const historyText = boundedStep < 5
    ? '状态库等待本轮工具结果；下一轮上下文尚未构造。'
    : historyLeak
      ? '下一轮上下文：Finance 历史 + Legal 工具结果（旧状态）'
      : '下一轮上下文：Finance 历史 + Finance 工具结果';
  const phaseTitle = [
    '① Finance 请求进入服务端执行边界',
    '② 检索只组成授权的 Finance 上下文',
    '③ 首次推理决定是否调用工具',
    '④ 每次工具执行前重新检查权限',
    '⑤ 工具结果按租户归属写入状态',
    mode === 'shared' ? '⑥ 共享历史污染 Finance 下一轮' : '⑥ 下一轮只读取 Finance 状态',
  ][boundedStep];
  const feedbackByStep = [
    'Finance 请求进入服务端控制的本轮执行路径。',
    '检索结果先经过授权，只把 Finance 可见内容组成上下文。',
    '模型基于授权上下文产生下一步动作，而不是直接获得任意工具数据。',
    '工具调用必须携带当前身份再次授权，不能沿用早先的检索许可。',
    '工具结果仍有租户归属，必须写入正确的状态分区。',
  ];
  return {
    step: boundedStep,
    stage: stages[boundedStep].key,
    activeStage: stages[boundedStep].label,
    phaseTitle,
    packetLabel: stages[boundedStep].packet,
    toolAuthorizationRequired,
    historyLeak,
    historyText,
    stateVault: mode,
    stateCompartmentCount: mode === 'shared' ? 1 : 2,
    stateItems,
    nextTurnItems,
    tone: historyLeak ? 'bad' : toolAuthorizationRequired ? 'info' : 'good',
    feedback: historyLeak
      ? '共享历史槽混入 Legal 工具结果：单次检索安全仍不能阻止后续轮次被旧状态污染。'
      : boundedStep === 5
        ? 'Finance 下一轮只读取 Finance 历史与工具结果；Legal 旧结果仍留在自己的隔离分区。'
        : feedbackByStep[boundedStep],
  };
}

function drawQuadraticArrow(
  ctx: CanvasRenderingContext2D,
  start: { x: number; y: number },
  control: { x: number; y: number },
  end: { x: number; y: number },
  color: string,
  width = 2,
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.quadraticCurveTo(control.x, control.y, end.x, end.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  const angle = Math.atan2(end.y - control.y, end.x - control.x);
  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(end.x - 8 * Math.cos(angle - Math.PI / 6), end.y - 8 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(end.x - 8 * Math.cos(angle + Math.PI / 6), end.y - 8 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawPacket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  value: string,
  color: string,
) {
  const width = Math.max(56, Math.min(84, value.length * 6 + 18));
  box(ctx, x - width / 2, y - 10, width, 20, C.white, color, 2);
  label(ctx, value, x, y, color, value.length > 10 ? 7 : 8);
}

function drawStateItem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  value: string,
  color: string,
  fill: string = C.white,
) {
  box(ctx, x, y, width, 18, fill, color, 1.5);
  label(ctx, value, x + width / 2, y + 9, color, 7.5);
}

function drawStateBoundary(
  ctx: CanvasRenderingContext2D,
  stateScene: AgentPathScene,
  alpha: number,
) {
  const finalStep = stateScene.step >= 5;
  const danger = stateScene.historyLeak;
  ctx.save();
  ctx.globalAlpha = alpha;

  const contextStroke = danger ? C.red : finalStep ? C.green : C.line;
  const contextFill = danger ? '#fff1f3' : finalStep ? '#eef9f3' : C.white;
  label(ctx, '下一轮 Finance 上下文', 128, 176, danger ? C.red : finalStep ? C.green : C.muted, 9);
  box(ctx, 20, 188, 216, 64, contextFill, contextStroke, finalStep ? 3 : 1.5);
  if (stateScene.nextTurnItems.length === 0) {
    label(ctx, '等待历史回流', 128, 221, C.muted, 9);
  } else {
    stateScene.nextTurnItems.forEach((item, index) => {
      const legal = item.startsWith('Legal');
      drawStateItem(
        ctx,
        30 + index * 99,
        211,
        88,
        item.replace('工具结果', '结果'),
        legal ? C.red : C.green,
        legal ? '#fff7f8' : C.white,
      );
    });
  }

  const vaultStroke = stateScene.stateVault === 'shared' ? danger ? C.red : C.purple : C.green;
  const vaultFill = danger ? '#fff7f8' : C.white;
  label(
    ctx,
    stateScene.stateVault === 'shared' ? '共享历史槽' : '租户分区状态',
    438,
    176,
    vaultStroke,
    9,
  );
  box(ctx, 338, 188, 200, 70, vaultFill, vaultStroke, danger || stateScene.stateVault === 'tenant' ? 2.5 : 1.5);
  drawStateItem(ctx, 348, 198, 116, 'Finance 历史', C.green, '#f7fcf9');
  drawStateItem(ctx, 348, 229, 116, 'Legal 旧结果', stateScene.stateVault === 'shared' && finalStep ? C.red : C.purple, '#fff8fb');
  box(
    ctx,
    475,
    198,
    52,
    50,
    stateScene.stateVault === 'tenant' ? '#eef9f3' : '#f6f2ff',
    stateScene.stateVault === 'tenant' ? C.green : C.purple,
    2,
  );
  label(ctx, stateScene.stateVault === 'tenant' ? 'Finance' : '共享', 501, 218, stateScene.stateVault === 'tenant' ? C.green : C.purple, 7.5);
  label(ctx, '读写口', 501, 234, C.muted, 7);
  if (stateScene.stateVault === 'tenant') {
    label(ctx, 'Legal 留在隔离分区', 406, 252, C.purple, 7);
  }
  ctx.restore();
}

export function ConversationStateLab(_props: PaperWidgetProps) {
  const timeline = useTimeline(850);
  const [mode, setMode] = useState<StateMode>('tenant');
  const [previousMode, setPreviousMode] = useState<StateMode>('tenant');
  const [step, setStep] = useState(0);
  const [fromStep, setFromStep] = useState(0);
  const progress = timeline.status === 'idle' ? 1 : easeInOutCubic(timeline.progress);
  const packet = deriveAgentPacketMotion(fromStep, step, progress);
  const scene = deriveAgentPathScene(step, mode);
  const previousScene = deriveAgentPathScene(step, previousMode);
  const changingMode = previousMode !== mode && timeline.status !== 'complete';
  const displayMetrics = deriveConversationStateDisplayMetrics();
  const displayStyle = {
    '--conversation-state-canvas-width': `${displayMetrics.maxDisplayWidth}px`,
  } as CSSProperties;

  const move = (direction: number) => {
    const next = Math.max(0, Math.min(stages.length - 1, step + direction));
    setFromStep(step);
    setStep(next);
    setPreviousMode(mode);
    timeline.replay();
  };
  const chooseMode = (next: string) => {
    setPreviousMode(mode);
    setMode(next as StateMode);
    setFromStep(step);
    timeline.replay();
  };

  return (
    <LabShell>
      <ChipRow
        labelText="对话状态边界"
        options={[{ value: 'shared', label: '共享状态' }, { value: 'tenant', label: '租户状态' }]}
        value={mode}
        onChange={chooseMode}
      />
      <div className="step-ctrl">
        <button type="button" className="timeline-icon-button" aria-label="上一步" title="上一步" onClick={() => move(-1)} disabled={step === 0}>←</button>
        <span className="step-label">{step + 1} / {stages.length} · <b>{scene.activeStage}</b></span>
        <button type="button" className="timeline-icon-button" aria-label="下一步" title="下一步" onClick={() => move(1)} disabled={step === stages.length - 1}>→</button>
      </div>
      <div className="conversation-state-canvas" style={displayStyle}>
        <LabCanvas
          width={displayMetrics.logicalWidth}
          height={CONVERSATION_STATE_LAYOUT.height}
          labelText={`${scene.phaseTitle}；${scene.historyText}`}
          onOutOfView={timeline.pause}
          draw={(ctx) => {
          const titleColor = scene.historyLeak ? C.red : scene.toolAuthorizationRequired ? C.purple : C.blue;
          label(ctx, scene.phaseTitle, 280, 17, titleColor, 11);

          box(ctx, 10, 34, 540, 104, '#f8fbff', C.line, 1.5);
          label(ctx, '本轮 Finance · 服务端执行边界', 24, 46, C.muted, 8.5, 'left');
          const topStageCount = 5;
          for (let index = 0; index < topStageCount; index += 1) {
            const point = CONVERSATION_STATE_LAYOUT.stagePoints[index];
            const reached = index <= Math.min(step, topStageCount - 1);
            const active = step < 5 && index === step;
            const stageColor = index === 3 && active ? C.purple : active ? C.blue : reached ? C.green : C.line;
            const fill = active ? '#eef3fb' : reached ? '#f7fcf9' : C.white;
            box(ctx, point.x - 40, 72, 80, 46, fill, stageColor, active ? 3 : 1.5);
            label(
              ctx,
              stages[index].label,
              point.x,
              index === 3 && reached ? 86 : 95,
              stageColor === C.line ? C.muted : stageColor,
              index === 3 ? 7.5 : 8.5,
            );
            if (index === 3 && reached) label(ctx, 'PERMIT', point.x, 104, C.green, 7);
            if (index < topStageCount - 1) {
              const next = CONVERSATION_STATE_LAYOUT.stagePoints[index + 1];
              arrow(ctx, point.x + 42, 95, next.x - 43, 95, index < step ? C.green : C.line, 1.8);
            }
          }

          box(ctx, 10, 148, 540, 132, C.white, C.line, 1.5);
          label(ctx, '状态写入后，会在下一轮重新成为模型上下文', 280, 160, C.muted, 8.5);
          const finalRouteActive = step >= 5 || fromStep >= 5;
          drawQuadraticArrow(
            ctx,
            CONVERSATION_STATE_LAYOUT.stagePoints[4],
            CONVERSATION_STATE_LAYOUT.writeControl,
            CONVERSATION_STATE_LAYOUT.storageEntry,
            finalRouteActive ? C.orange : C.line,
            finalRouteActive ? 2.5 : 1.5,
          );
          drawQuadraticArrow(
            ctx,
            CONVERSATION_STATE_LAYOUT.storageEntry,
            CONVERSATION_STATE_LAYOUT.readControl,
            CONVERSATION_STATE_LAYOUT.stagePoints[5],
            finalRouteActive ? mode === 'shared' ? C.red : C.green : C.line,
            finalRouteActive ? 3 : 1.5,
          );

          const previousAlpha = changingMode
            ? 1 - easeInOutCubic(clamp01(progress * 2))
            : 0;
          const currentAlpha = changingMode
            ? easeInOutCubic(clamp01((progress - 0.5) * 2))
            : 1;
          if (previousAlpha > 0.01) drawStateBoundary(ctx, previousScene, previousAlpha);
          if (currentAlpha > 0.01) drawStateBoundary(ctx, scene, currentAlpha);

          const stableFinal = step === 5 && timeline.status === 'complete';
          if (!changingMode && !stableFinal) {
            const packetColor = packet.phase === 'read'
              ? mode === 'shared' ? C.red : C.green
              : packet.phase === 'write' || step === 4
                ? C.orange
                : step === 3
                  ? C.purple
                  : C.blue;
            drawPacket(ctx, packet.x, packet.y, packet.label, packetColor);
          }
          }}
        />
      </div>
      <Feedback tone={scene.tone}>{scene.feedback}</Feedback>
    </LabShell>
  );
}
