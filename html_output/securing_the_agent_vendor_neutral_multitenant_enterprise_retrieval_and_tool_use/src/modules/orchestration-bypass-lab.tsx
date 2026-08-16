import { useState } from 'react';
import { TimelineControls } from '../animation/TimelineControls';
import { clamp01, easeInOutCubic, lerp, phaseProgress } from '../animation/easing';
import type { TimelinePhase } from '../animation/types';
import { useTimeline } from '../animation/useTimeline';
import { ChipRow, Feedback, LabCanvas, LabShell } from './shared/LabChrome';
import { C, arrow, box, dot, label, roundedRect } from './shared/canvasDrawing';
import type { PaperWidgetProps } from './library-scenes';

export type AttackType = 'skipGate' | 'unauthorizedTool' | 'staleContext';
export type TenantCard = 'finance' | 'legal';

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AttackVisualSpec {
  phases: TimelinePhase[];
  ariaLabel: string;
  explanation: string;
  result: string;
  resultStart: number;
}

export const ATTACK_VISUALS: Record<AttackType, AttackVisualSpec> = {
  skipGate: {
    phases: [
      { id: 'retrieval-launch', label: '发起越权检索', start: 0, end: 0.18 },
      { id: 'retrieval-route', label: '路径分流', start: 0.18, end: 0.58 },
      { id: 'retrieval-check', label: '门控判定', start: 0.58, end: 0.8 },
      { id: 'retrieval-result', label: '结果', start: 0.8, end: 1 },
    ],
    ariaLabel: '同一越权检索：客户端直连未门控搜索，服务端强制经过 ABAC 门控并拒绝',
    explanation: '客户端可以直接调用未门控搜索；服务端接管检索后，ABAC 成为不可绕过的必经步骤。',
    result: '客户端绕开门控并取得越权文档；服务端在搜索前执行 ABAC，越权请求未进入检索。',
    resultStart: 0.8,
  },
  unauthorizedTool: {
    phases: [
      { id: 'tool-call', label: '生成 tool_call', start: 0, end: 0.2 },
      { id: 'tool-route', label: '调用路径分支', start: 0.2, end: 0.5 },
      { id: 'tool-auth', label: '执行 / 逐次授权', start: 0.5, end: 0.8 },
      { id: 'tool-result', label: '结果', start: 0.8, end: 1 },
    ],
    ariaLabel: '同一未授权工具调用：客户端直接执行工具，服务端传播用户授权并拒绝调用',
    explanation: '客户端执行器可能不传播终端用户权限；服务端会在每一次 tool_call 前重新授权。',
    result: '客户端工具以 Agent 身份执行；服务端把终端用户权限传播到工具调用，并在执行前拒绝。',
    resultStart: 0.8,
  },
  staleContext: {
    phases: [
      { id: 'state-read', label: '读取历史', start: 0, end: 0.22 },
      { id: 'context-build', label: '构造上下文', start: 0.22, end: 0.62 },
      { id: 'context-send', label: '送入推理', start: 0.62, end: 0.82 },
      { id: 'context-result', label: '结果', start: 0.82, end: 1 },
    ],
    ariaLabel: '同一 Finance 请求：客户端把 Legal 旧历史混入上下文，服务端只读取 Finance 租户状态',
    explanation: '客户端可提交自己拼接的历史；服务端从租户状态仓重建本轮上下文，不信任跨租户旧状态。',
    result: '客户端构造的 Finance 上下文被 Legal 历史污染；服务端上下文只包含 Finance 状态。',
    resultStart: 0.82,
  },
};

export const ORCHESTRATION_GEOMETRY = {
  skipGate: {
    agentCenter: { x: 46, y: 72 },
    routeStart: { x: 78, y: 116 },
    bypassControl: { x: 134, y: 320 },
    bypassEnd: { x: 188, y: 116 },
    clientGate: { x: 96, y: 80, width: 72, height: 70 },
    serverGate: { x: 96, y: 80, width: 72, height: 70 },
    serverGateCenter: { x: 104, y: 115 },
    searchCenter: { x: 219, y: 116 },
  },
  unauthorizedTool: {
    inferenceCenter: { x: 50, y: 70 },
    routeStart: { x: 82, y: 112 },
    toolCenter: { x: 181, y: 112 },
    authorizationCenter: { x: 135, y: 157 },
    serverControl: { x: 94, y: 181 },
  },
  staleContext: {
    clientLegalOrigin: { x: 58, y: 116 },
    clientFinanceOrigin: { x: 58, y: 166 },
    clientLegalTarget: { x: 185, y: 145 },
    clientFinanceTarget: { x: 185, y: 117 },
    serverLegalOrigin: { x: 58, y: 110 },
    serverFinanceOrigin: { x: 58, y: 169 },
    serverFinanceTarget: { x: 185, y: 130 },
    serverLegalPartition: { x: 20, y: 84, width: 78, height: 52 },
    contextStart: { x: 185, y: 188 },
    inferenceTarget: { x: 185, y: 202 },
  },
} as const;

interface BaseScene {
  progress: number;
  motionPoints: Point[];
}

export interface SkipGateScene extends BaseScene {
  attack: 'skipGate';
  phase: 'launch' | 'route' | 'gate-check' | 'result';
  client: {
    token: Point;
    gateVisited: false;
    searchReached: boolean;
  };
  server: {
    token: Point;
    gateState: 'idle' | 'checking' | 'denied';
    searchReached: false;
  };
}

export interface UnauthorizedToolScene extends BaseScene {
  attack: 'unauthorizedTool';
  phase: 'tool-call' | 'route' | 'authorization' | 'result';
  client: {
    toolCall: Point;
    authorizationVisited: false;
    toolExecuted: boolean;
  };
  server: {
    toolCall: Point;
    authorizationVisited: boolean;
    authorizationState: 'idle' | 'checking' | 'denied';
    toolExecuted: false;
  };
}

export interface StaleContextScene extends BaseScene {
  attack: 'staleContext';
  phase: 'read' | 'build' | 'send' | 'result';
  client: {
    legalCard: Point;
    financeCard: Point;
    contextPacket: Point;
    contextCards: TenantCard[];
    contaminated: boolean;
  };
  server: {
    legalCard: Point;
    financeCard: Point;
    contextPacket: Point;
    contextCards: TenantCard[];
    contaminated: false;
  };
}

export type OrchestrationScene = SkipGateScene | UnauthorizedToolScene | StaleContextScene;

function linePoint(from: Point, to: Point, progress: number): Point {
  return {
    x: lerp(from.x, to.x, progress),
    y: lerp(from.y, to.y, progress),
  };
}

function quadraticPoint(from: Point, control: Point, to: Point, progress: number): Point {
  const t = clamp01(progress);
  const inverse = 1 - t;
  return {
    x: inverse * inverse * from.x + 2 * inverse * t * control.x + t * t * to.x,
    y: inverse * inverse * from.y + 2 * inverse * t * control.y + t * t * to.y,
  };
}

function easedPhase(progress: number, start: number, end: number): number {
  return easeInOutCubic(phaseProgress(progress, start, end));
}

function deriveSkipGate(progress: number): SkipGateScene {
  const p = clamp01(progress);
  const geometry = ORCHESTRATION_GEOMETRY.skipGate;
  const phase = p < 0.18 ? 'launch' : p < 0.58 ? 'route' : p < 0.8 ? 'gate-check' : 'result';
  const clientToken = p < 0.18
    ? linePoint(geometry.agentCenter, geometry.routeStart, easedPhase(p, 0, 0.18))
    : quadraticPoint(
      geometry.routeStart,
      geometry.bypassControl,
      geometry.bypassEnd,
      easedPhase(p, 0.18, 0.8),
    );
  const serverToken = p < 0.18
    ? linePoint(geometry.agentCenter, geometry.routeStart, easedPhase(p, 0, 0.18))
    : linePoint(geometry.routeStart, geometry.serverGateCenter, easedPhase(p, 0.18, 0.58));
  const gateState = p < 0.58 ? 'idle' : p < 0.7 ? 'checking' : 'denied';

  return {
    attack: 'skipGate',
    phase,
    progress: p,
    motionPoints: [clientToken, serverToken],
    client: {
      token: clientToken,
      gateVisited: false,
      searchReached: p >= 0.8,
    },
    server: {
      token: serverToken,
      gateState,
      searchReached: false,
    },
  };
}

function deriveUnauthorizedTool(progress: number): UnauthorizedToolScene {
  const p = clamp01(progress);
  const geometry = ORCHESTRATION_GEOMETRY.unauthorizedTool;
  const phase = p < 0.2 ? 'tool-call' : p < 0.5 ? 'route' : p < 0.8 ? 'authorization' : 'result';
  const clientCall = p < 0.2
    ? linePoint(geometry.inferenceCenter, geometry.routeStart, easedPhase(p, 0, 0.2))
    : linePoint(geometry.routeStart, geometry.toolCenter, easedPhase(p, 0.2, 0.68));
  const serverCall = p < 0.2
    ? linePoint(geometry.inferenceCenter, geometry.routeStart, easedPhase(p, 0, 0.2))
    : quadraticPoint(
      geometry.routeStart,
      geometry.serverControl,
      geometry.authorizationCenter,
      easedPhase(p, 0.2, 0.5),
    );
  const authorizationState = p < 0.5 ? 'idle' : p < 0.68 ? 'checking' : 'denied';

  return {
    attack: 'unauthorizedTool',
    phase,
    progress: p,
    motionPoints: [clientCall, serverCall],
    client: {
      toolCall: clientCall,
      authorizationVisited: false,
      toolExecuted: p >= 0.68,
    },
    server: {
      toolCall: serverCall,
      authorizationVisited: p >= 0.5,
      authorizationState,
      toolExecuted: false,
    },
  };
}

function deriveStaleContext(progress: number): StaleContextScene {
  const p = clamp01(progress);
  const geometry = ORCHESTRATION_GEOMETRY.staleContext;
  const phase = p < 0.22 ? 'read' : p < 0.62 ? 'build' : p < 0.82 ? 'send' : 'result';
  const financeBuildProgress = easedPhase(p, 0.22, 0.42);
  const legalBuildProgress = easedPhase(p, 0.38, 0.62);
  const serverBuildProgress = easedPhase(p, 0.22, 0.62);
  const sendProgress = easedPhase(p, 0.62, 0.82);
  const clientLegal = quadraticPoint(
    geometry.clientLegalOrigin,
    { x: 130, y: 200 },
    geometry.clientLegalTarget,
    legalBuildProgress,
  );
  const clientFinance = linePoint(
    geometry.clientFinanceOrigin,
    geometry.clientFinanceTarget,
    financeBuildProgress,
  );
  const serverLegal = { ...geometry.serverLegalOrigin };
  const serverFinance = linePoint(
    geometry.serverFinanceOrigin,
    geometry.serverFinanceTarget,
    serverBuildProgress,
  );
  const clientPacket = linePoint(geometry.contextStart, geometry.inferenceTarget, sendProgress);
  const serverPacket = linePoint(geometry.contextStart, geometry.inferenceTarget, sendProgress);
  const contextBuilt = p >= 0.62;

  return {
    attack: 'staleContext',
    phase,
    progress: p,
    motionPoints: [clientLegal, clientFinance, clientPacket, serverLegal, serverFinance, serverPacket],
    client: {
      legalCard: clientLegal,
      financeCard: clientFinance,
      contextPacket: clientPacket,
      contextCards: contextBuilt ? ['finance', 'legal'] : [],
      contaminated: contextBuilt,
    },
    server: {
      legalCard: serverLegal,
      financeCard: serverFinance,
      contextPacket: serverPacket,
      contextCards: contextBuilt ? ['finance'] : [],
      contaminated: false,
    },
  };
}

export function deriveOrchestrationScene(progress: number, attack: AttackType): OrchestrationScene {
  if (attack === 'skipGate') return deriveSkipGate(progress);
  if (attack === 'unauthorizedTool') return deriveUnauthorizedTool(progress);
  return deriveStaleContext(progress);
}

function drawPanelFrame(
  ctx: CanvasRenderingContext2D,
  originX: number,
  title: string,
  serverSide: boolean,
  boundaryLabel: string,
) {
  const color = serverSide ? C.green : C.red;
  label(ctx, title, originX + 129, 18, color, 12.5);
  ctx.save();
  ctx.setLineDash([6, 5]);
  roundedRect(ctx, originX + 2, 35, 254, 225, 7);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  label(ctx, boundaryLabel, originX + 129, 50, C.muted, 9.5);
}

function drawDashedBox(
  ctx: CanvasRenderingContext2D,
  originX: number,
  rect: Rect,
  fill: string,
  stroke: string,
) {
  ctx.save();
  ctx.setLineDash([5, 4]);
  box(ctx, originX + rect.x, rect.y, rect.width, rect.height, fill, stroke, 2);
  ctx.restore();
}

function drawCross(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size = 10) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - size, y - size);
  ctx.lineTo(x + size, y + size);
  ctx.moveTo(x + size, y - size);
  ctx.lineTo(x - size, y + size);
  ctx.stroke();
}

function drawQuadraticPath(
  ctx: CanvasRenderingContext2D,
  originX: number,
  from: Point,
  control: Point,
  to: Point,
  color: string,
  width = 3,
  dashed = false,
) {
  ctx.save();
  if (dashed) ctx.setLineDash([5, 4]);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(originX + from.x, from.y);
  ctx.quadraticCurveTo(originX + control.x, control.y, originX + to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

function drawMovingToken(
  ctx: CanvasRenderingContext2D,
  originX: number,
  point: Point,
  fill: string,
  value: string,
) {
  dot(ctx, originX + point.x, point.y, 7, fill);
  label(ctx, value, originX + point.x, point.y, C.white, 7.5);
}

function drawSkipGatePanel(
  ctx: CanvasRenderingContext2D,
  scene: SkipGateScene,
  originX: number,
  serverSide: boolean,
) {
  const geometry = ORCHESTRATION_GEOMETRY.skipGate;
  const side = serverSide ? scene.server : scene.client;
  const gate = serverSide ? geometry.serverGate : geometry.clientGate;
  drawPanelFrame(
    ctx,
    originX,
    serverSide ? '服务端编排' : '客户端编排',
    serverSide,
    serverSide ? '可信服务端边界' : '客户端可控区域',
  );

  box(ctx, originX + 16, 94, 60, 44, C.white, C.blue, 2);
  label(ctx, 'Agent', originX + 46, 116, C.blue, 10);
  drawDashedBox(ctx, originX, gate, serverSide ? '#f1faf4' : '#f5f7fa', serverSide ? C.green : C.muted);
  label(ctx, 'ABAC', originX + 132, 101, serverSide ? C.green : C.muted, 10);
  label(ctx, '检索门控', originX + 132, 120, serverSide ? C.green : C.muted, 9.5);
  label(ctx, serverSide ? '强制必经' : '未经过', originX + 132, 139, serverSide ? C.green : C.red, 9.5);
  box(
    ctx,
    originX + 190,
    94,
    58,
    44,
    !serverSide && side.searchReached ? '#fff0f2' : C.white,
    !serverSide && side.searchReached ? C.red : C.line,
    2,
  );
  label(ctx, '未门控', originX + 219, 108, !serverSide && side.searchReached ? C.red : C.muted, 9);
  label(ctx, '搜索', originX + 219, 126, !serverSide && side.searchReached ? C.red : C.muted, 9);

  if (serverSide) {
    arrow(ctx, originX + 77, 116, originX + 94, 116, C.green, 3);
    ctx.save();
    ctx.setLineDash([4, 4]);
    arrow(ctx, originX + 170, 116, originX + 188, 116, C.line, 2);
    ctx.restore();
    if (scene.server.gateState === 'checking') {
      label(ctx, '核对用户 × 资源策略', originX + 132, 190, C.orange, 9.5);
    }
    if (scene.server.gateState === 'denied') {
      drawCross(ctx, originX + 132, 177, C.red, 9);
      label(ctx, 'DENY · 未执行搜索', originX + 132, 211, C.green, 10);
    }
    drawMovingToken(ctx, originX, scene.server.token, scene.server.gateState === 'denied' ? C.red : C.blue, 'Q');
  } else {
    drawQuadraticPath(
      ctx,
      originX,
      geometry.routeStart,
      geometry.bypassControl,
      geometry.bypassEnd,
      C.red,
      4,
    );
    label(
      ctx,
      scene.client.searchReached ? '越权文档返回' : '直连 ungated endpoint',
      originX + 132,
      244,
      C.red,
      scene.client.searchReached ? 10 : 9.5,
    );
    drawMovingToken(ctx, originX, scene.client.token, C.blue, 'Q');
  }
}

function drawSkipGateScene(ctx: CanvasRenderingContext2D, scene: SkipGateScene) {
  drawSkipGatePanel(ctx, scene, 12, false);
  drawSkipGatePanel(ctx, scene, 290, true);
  label(
    ctx,
    scene.phase === 'result'
      ? '客户端绕过检索门控；服务端把 ABAC 固定为搜索前置条件'
      : '同一越权检索、同一时间刻度；两侧从一开始就走不同路径',
    280,
    286,
    scene.phase === 'result' ? C.ink : C.orange,
    10.5,
  );
}

function drawToolNode(
  ctx: CanvasRenderingContext2D,
  originX: number,
  active: boolean,
  blocked: boolean,
) {
  const stroke = blocked ? C.line : active ? C.red : C.muted;
  box(ctx, originX + 188, 90, 60, 48, active ? '#fff0f2' : C.white, stroke, 2);
  label(ctx, '企业工具', originX + 218, 106, stroke, 9.5);
  label(ctx, active ? '已执行' : '未执行', originX + 218, 126, active ? C.red : C.muted, 9);
  if (active) {
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2;
    for (let index = 0; index < 3; index += 1) {
      ctx.beginPath();
      ctx.arc(originX + 218, 114, 17 + index * 5, -0.45, 0.45);
      ctx.stroke();
    }
  }
}

function drawUnauthorizedToolPanel(
  ctx: CanvasRenderingContext2D,
  scene: UnauthorizedToolScene,
  originX: number,
  serverSide: boolean,
) {
  const geometry = ORCHESTRATION_GEOMETRY.unauthorizedTool;
  drawPanelFrame(
    ctx,
    originX,
    serverSide ? '服务端编排' : '客户端编排',
    serverSide,
    serverSide ? '可信服务端边界' : '客户端可控执行器',
  );
  box(ctx, originX + 18, 90, 64, 44, C.white, C.blue, 2);
  label(ctx, '推理', originX + 50, 105, C.blue, 10);
  label(ctx, 'tool_call', originX + 50, 124, C.muted, 8.5);

  if (serverSide) {
    drawDashedBox(ctx, originX, { x: 99, y: 163, width: 72, height: 56 }, '#f1faf4', C.green);
    label(ctx, '逐次授权', originX + 135, 179, C.green, 9.5);
    label(ctx, '用户 + 租户', originX + 135, 198, C.muted, 9);
    if (scene.server.authorizationState === 'denied') {
      label(ctx, 'DENY', originX + 135, 213, C.red, 9.5);
    }
    drawQuadraticPath(
      ctx,
      originX,
      geometry.routeStart,
      geometry.serverControl,
      geometry.authorizationCenter,
      C.green,
      3,
    );
    drawQuadraticPath(
      ctx,
      originX,
      geometry.authorizationCenter,
      { x: 185, y: 180 },
      { x: 188, y: 114 },
      C.line,
      2,
      true,
    );
    drawToolNode(ctx, originX, false, true);
    drawMovingToken(ctx, originX, scene.server.toolCall, scene.server.authorizationState === 'denied' ? C.red : C.blue, 'φ');
    if (scene.server.authorizationState === 'denied') {
      label(ctx, '授权在工具执行前生效', originX + 132, 239, C.green, 9.5);
    }
  } else {
    arrow(ctx, originX + 82, 112, originX + 186, 112, C.red, 3.5);
    drawDashedBox(ctx, originX, { x: 97, y: 165, width: 76, height: 52 }, '#f7f8fa', C.muted);
    label(ctx, '终端用户授权', originX + 135, 180, C.muted, 9);
    label(ctx, '未传播', originX + 135, 201, C.red, 10);
    drawToolNode(ctx, originX, scene.client.toolExecuted, false);
    drawMovingToken(ctx, originX, scene.client.toolCall, C.blue, 'φ');
    if (scene.client.toolExecuted) label(ctx, '以 Agent 权限直接执行', originX + 132, 239, C.red, 9.5);
  }
}

function drawUnauthorizedToolScene(ctx: CanvasRenderingContext2D, scene: UnauthorizedToolScene) {
  drawUnauthorizedToolPanel(ctx, scene, 12, false);
  drawUnauthorizedToolPanel(ctx, scene, 290, true);
  label(
    ctx,
    scene.phase === 'result'
      ? '服务端传播终端用户授权：DENY 发生在工具启动之前'
      : '移动的是 tool_call：客户端直达工具，服务端先转入逐次授权',
    280,
    286,
    scene.phase === 'result' ? C.ink : C.orange,
    10.5,
  );
}

function drawStateCard(
  ctx: CanvasRenderingContext2D,
  originX: number,
  point: Point,
  tenant: TenantCard,
) {
  const color = tenant === 'legal' ? C.red : C.green;
  box(ctx, originX + point.x - 29, point.y - 11, 58, 22, C.white, color, 2);
  dot(ctx, originX + point.x - 19, point.y, 3.5, color, color, 1);
  label(ctx, tenant === 'legal' ? 'Legal 历史' : 'Finance', originX + point.x + 4, point.y, color, 8.5);
}

function drawEnvelope(
  ctx: CanvasRenderingContext2D,
  originX: number,
  stroke: string,
  contaminated: boolean,
) {
  box(ctx, originX + 129, 89, 112, 96, contaminated ? '#fff0f2' : '#f3faf6', stroke, contaminated ? 3 : 2);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(originX + 130, 96);
  ctx.lineTo(originX + 185, 130);
  ctx.lineTo(originX + 240, 96);
  ctx.stroke();
  label(ctx, 'Finance 上下文', originX + 185, 76, stroke, 9.5);
}

function drawStaleContextPanel(
  ctx: CanvasRenderingContext2D,
  scene: StaleContextScene,
  originX: number,
  serverSide: boolean,
) {
  const side = serverSide ? scene.server : scene.client;
  drawPanelFrame(
    ctx,
    originX,
    serverSide ? '服务端状态构造' : '客户端状态拼接',
    serverSide,
    serverSide ? '租户状态仓' : '客户端共享缓存',
  );

  if (serverSide) {
    drawDashedBox(ctx, originX, { x: 14, y: 68, width: 92, height: 142 }, '#f7fbf8', C.green);
    box(ctx, originX + 20, 84, 78, 52, '#fff8f8', C.red, 1.5);
    box(ctx, originX + 20, 145, 78, 52, '#f3faf6', C.green, 1.5);
    label(ctx, 'Legal 分区', originX + 59, 94, C.red, 8.5);
    label(ctx, 'Finance 分区', originX + 59, 155, C.green, 8.5);
  } else {
    drawDashedBox(ctx, originX, { x: 14, y: 68, width: 92, height: 142 }, '#fff8f8', C.red);
    label(ctx, '共享 history[]', originX + 60, 83, C.red, 8.5);
  }

  drawEnvelope(ctx, originX, side.contaminated ? C.red : C.green, side.contaminated);
  ctx.strokeStyle = serverSide ? C.green : side.contaminated ? C.red : C.muted;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(originX + 185, 187);
  ctx.lineTo(originX + 185, 209);
  ctx.stroke();
  box(
    ctx,
    originX + 151,
    210,
    68,
    32,
    C.white,
    side.contaminated ? C.red : C.green,
    2,
  );
  label(ctx, '下轮推理', originX + 185, 226, side.contaminated ? C.red : C.green, 9.5);

  drawStateCard(ctx, originX, side.legalCard, 'legal');
  drawStateCard(ctx, originX, side.financeCard, 'finance');
  if (scene.progress >= 0.62) {
    drawMovingToken(ctx, originX, side.contextPacket, side.contaminated ? C.red : C.green, 'C');
  }

  if (scene.phase === 'result') {
    label(
      ctx,
      side.contaminated ? '污染：Finance + Legal' : '隔离：仅 Finance',
      originX + 129,
      252,
      side.contaminated ? C.red : C.green,
      9.5,
    );
  }
}

function drawStaleContextScene(ctx: CanvasRenderingContext2D, scene: StaleContextScene) {
  drawStaleContextPanel(ctx, scene, 12, false);
  drawStaleContextPanel(ctx, scene, 290, true);
  label(
    ctx,
    scene.phase === 'result'
      ? '服务端从租户状态重建上下文，Legal 历史不会进入 Finance 推理'
      : '移动的是历史卡片：客户端混入 Legal，服务端只读取 Finance 分区',
    280,
    286,
    scene.phase === 'result' ? C.ink : C.orange,
    10.5,
  );
}

export function OrchestrationBypassLab(_props: PaperWidgetProps) {
  const timeline = useTimeline(5_200);
  const [attack, setAttack] = useState<AttackType>('skipGate');
  const visual = ATTACK_VISUALS[attack];
  const scene = deriveOrchestrationScene(timeline.progress, attack);
  const completed = timeline.progress >= visual.resultStart;
  const selectAttack = (next: string) => {
    setAttack(next as AttackType);
    timeline.replay();
  };

  return (
    <LabShell>
      <ChipRow
        labelText="选择攻击机制"
        options={[
          { value: 'skipGate', label: '跳过检索门控' },
          { value: 'unauthorizedTool', label: '未授权工具' },
          { value: 'staleContext', label: '混入旧上下文' },
        ]}
        value={attack}
        onChange={selectAttack}
      />
      <div className="orchestration-bypass-canvas">
        <LabCanvas
          height={304}
          labelText={visual.ariaLabel}
          onOutOfView={timeline.pause}
          draw={(ctx) => {
            if (scene.attack === 'skipGate') drawSkipGateScene(ctx, scene);
            else if (scene.attack === 'unauthorizedTool') drawUnauthorizedToolScene(ctx, scene);
            else drawStaleContextScene(ctx, scene);
          }}
        />
      </div>
      <TimelineControls timeline={timeline} phases={visual.phases} label="编排绕过对比" />
      <Feedback tone={completed ? 'good' : 'info'}>
        {completed ? visual.result : visual.explanation}
      </Feedback>
    </LabShell>
  );
}
