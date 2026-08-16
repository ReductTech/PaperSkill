import { clamp01, easeInOutCubic, lerp, phaseProgress } from '../animation/easing';
import type { TimelinePhase } from '../animation/types';

export type ArchitecturePhase =
  | 'ingestion'
  | 'takeover'
  | 'retrieval'
  | 'context'
  | 'agent-loop'
  | 'state'
  | 'response';

export type TenantCard = 'finance' | 'legal';
export type AuthorizationState = 'idle' | 'checking' | 'permit' | 'deny';

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

export interface ArchitectureScene {
  progress: number;
  phase: ArchitecturePhase;
  detail: string;
  boundaryVisible: true;
  ingestion: {
    financeDocument: Point;
    legalDocument: Point;
    tagProgress: number;
    corpusProgress: number;
  };
  query: {
    visible: boolean;
    legitimate: Point;
    bypassVisible: boolean;
    bypass: Point;
    bypassBlocked: boolean;
  };
  retrieval: {
    resourceAuthorization: AuthorizationState;
    financeChunk: Point;
    legalChunk: Point;
    legalDenied: boolean;
  };
  context: {
    envelope: Point;
    fillProgress: number;
    cardIds: TenantCard[];
    inferenceReady: boolean;
  };
  tool: {
    callVisible: boolean;
    call: Point;
    authorization: AuthorizationState;
    active: boolean;
    result: Point;
  };
  state: {
    financeWrite: Point;
    financeStored: boolean;
    legalUntouched: true;
  };
  response: {
    visible: boolean;
    token: Point;
    returned: boolean;
  };
  motionPoints: Point[];
}

export const ARCHITECTURE_PHASES: TimelinePhase[] = [
  { id: 'ingestion', label: '策略感知摄取', start: 0, end: 0.15 },
  { id: 'takeover', label: '服务端接管', start: 0.15, end: 0.27 },
  { id: 'retrieval', label: '两级检索门控', start: 0.27, end: 0.45 },
  { id: 'context', label: '授权上下文', start: 0.45, end: 0.58 },
  { id: 'agent-loop', label: '推理与工具', start: 0.58, end: 0.75 },
  { id: 'state', label: '租户状态', start: 0.75, end: 0.88 },
  { id: 'response', label: '响应返回', start: 0.88, end: 1 },
];

export const ARCHITECTURE_GEOMETRY = {
  boundary: { x: 64, y: 28, width: 488, height: 356 },
  clientPort: { x: 52, y: 320 },
  clientResponsePort: { x: 52, y: 348 },
  bypassOrigin: { x: 52, y: 292 },
  bypassStop: { x: 64, y: 278 },
  ingestionNode: { x: 128, y: 38, width: 72, height: 30 },
  financeDocumentOrigin: { x: 94, y: 78 },
  legalDocumentOrigin: { x: 94, y: 102 },
  financeCorpusSlot: { x: 263, y: 58 },
  legalCorpusSlot: { x: 263, y: 88 },
  inputSafetyExit: { x: 162, y: 320 },
  resourceFinanceSlot: { x: 178, y: 144 },
  resourceLegalSlot: { x: 178, y: 166 },
  chunkFinanceSlot: { x: 264, y: 144 },
  chunkLegalSlot: { x: 264, y: 166 },
  contextFinanceSlot: { x: 350, y: 144 },
  legalDenySlot: { x: 304, y: 204 },
  contextPacketOrigin: { x: 442, y: 152 },
  modelInput: { x: 462, y: 152 },
  modelToolPort: { x: 500, y: 184 },
  toolAuthorizationPort: { x: 332, y: 244 },
  toolPort: { x: 464, y: 244 },
  stateWriteOrigin: { x: 500, y: 278 },
  financeStateSlot: { x: 512, y: 314 },
  legalStateSlot: { x: 381, y: 314 },
  modelResponsePort: { x: 538, y: 152 },
  responseCorridor: { x: 544, y: 360 },
  outputSafetyRightPort: { x: 310, y: 360 },
  outputSafetyLeftPort: { x: 210, y: 360 },
  responseBoundaryPort: { x: 64, y: 360 },
} as const;

export const ARCHITECTURE_NODE_RECTS: Record<string, Rect> = {
  ingestion: ARCHITECTURE_GEOMETRY.ingestionNode,
  taggedCorpus: { x: 218, y: 36, width: 90, height: 74 },
  inputSafety: { x: 82, y: 298, width: 80, height: 40 },
  resourceGate: { x: 178, y: 120, width: 72, height: 64 },
  chunkGate: { x: 264, y: 120, width: 72, height: 64 },
  contextEnvelope: { x: 350, y: 112, width: 84, height: 82 },
  sharedInference: { x: 462, y: 120, width: 76, height: 64 },
  denyTray: { x: 272, y: 192, width: 64, height: 24 },
  toolAuthorization: { x: 332, y: 220, width: 104, height: 56 },
  tool: { x: 464, y: 220, width: 72, height: 56 },
  outputSafety: { x: 210, y: 344, width: 100, height: 32 },
  tenantState: { x: 332, y: 284, width: 204, height: 54 },
};

const phaseDetails: Record<ArchitecturePhase, string> = {
  ingestion: '离线摄取为 Finance 与 Legal 文档写入不可变 tenant owner；此时还没有查询。',
  takeover: 'Finance 查询进入服务端控制路径；客户端直连推理的旁路在信任边界终止。',
  retrieval: '资源级 ABAC 在搜索前授权，chunk 级过滤再把 Legal 结果送入拒绝区。',
  context: '只有 Finance chunk 被装入授权上下文，并送往共享推理端点。',
  'agent-loop': '模型产生 tool_call；服务端传播终端用户与租户权限，授权后工具才执行。',
  state: '工具结果回到控制循环并只写入 Finance 状态；Legal 状态保持隔离。',
  response: '最终响应经过输出控制后离开服务端边界，返回 Finance 客户端。',
};

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

function eased(progress: number, start: number, end: number): number {
  return easeInOutCubic(phaseProgress(progress, start, end));
}

function phaseAt(progress: number): ArchitecturePhase {
  if (progress < 0.15) return 'ingestion';
  if (progress < 0.27) return 'takeover';
  if (progress < 0.45) return 'retrieval';
  if (progress < 0.58) return 'context';
  if (progress < 0.75) return 'agent-loop';
  if (progress < 0.88) return 'state';
  return 'response';
}

function stagedLine(
  progress: number,
  firstStart: number,
  firstEnd: number,
  first: Point,
  middle: Point,
  secondEnd: number,
  last: Point,
): Point {
  if (progress < firstStart) return { ...first };
  if (progress < firstEnd) return linePoint(first, middle, eased(progress, firstStart, firstEnd));
  return linePoint(middle, last, eased(progress, firstEnd, secondEnd));
}

function deriveDocuments(progress: number) {
  const geometry = ARCHITECTURE_GEOMETRY;
  const financeDocument = quadraticPoint(
    geometry.financeDocumentOrigin,
    { x: 164, y: 78 },
    geometry.financeCorpusSlot,
    eased(progress, 0.05, 0.15),
  );
  const legalDocument = quadraticPoint(
    geometry.legalDocumentOrigin,
    { x: 164, y: 106 },
    geometry.legalCorpusSlot,
    eased(progress, 0.05, 0.15),
  );
  return { financeDocument, legalDocument };
}

function deriveQuery(progress: number) {
  const geometry = ARCHITECTURE_GEOMETRY;
  const legitimate = stagedLine(
    progress,
    0.15,
    0.21,
    geometry.clientPort,
    geometry.inputSafetyExit,
    0.27,
    geometry.resourceFinanceSlot,
  );
  const bypass = linePoint(
    geometry.bypassOrigin,
    geometry.bypassStop,
    eased(progress, 0.15, 0.24),
  );
  return { legitimate, bypass };
}

function deriveRetrieval(progress: number) {
  const geometry = ARCHITECTURE_GEOMETRY;
  const financeChunk = progress < 0.33
    ? linePoint(geometry.financeCorpusSlot, geometry.resourceFinanceSlot, eased(progress, 0.27, 0.33))
    : progress < 0.38
      ? linePoint(geometry.resourceFinanceSlot, geometry.chunkFinanceSlot, eased(progress, 0.33, 0.38))
      : linePoint(geometry.chunkFinanceSlot, geometry.contextFinanceSlot, eased(progress, 0.38, 0.45));
  const legalChunk = progress < 0.33
    ? linePoint(geometry.legalCorpusSlot, geometry.resourceLegalSlot, eased(progress, 0.27, 0.33))
    : progress < 0.38
      ? linePoint(geometry.resourceLegalSlot, geometry.chunkLegalSlot, eased(progress, 0.33, 0.38))
      : quadraticPoint(
        geometry.chunkLegalSlot,
        { x: 288, y: 204 },
        geometry.legalDenySlot,
        eased(progress, 0.38, 0.45),
      );
  return { financeChunk, legalChunk };
}

function deriveTool(progress: number) {
  const geometry = ARCHITECTURE_GEOMETRY;
  const call = progress < 0.65
    ? quadraticPoint(
      geometry.modelToolPort,
      { x: 430, y: 218 },
      geometry.toolAuthorizationPort,
      eased(progress, 0.58, 0.65),
    )
    : linePoint(
      geometry.toolAuthorizationPort,
      geometry.toolPort,
      eased(progress, 0.67, 0.7),
    );
  const result = quadraticPoint(
      geometry.toolPort,
      { x: 540, y: 214 },
    geometry.modelToolPort,
    eased(progress, 0.7, 0.75),
  );
  const authorization: AuthorizationState = progress < 0.6
    ? 'idle'
    : progress < 0.66
      ? 'checking'
      : 'permit';
  return { call, result, authorization };
}

function deriveResponse(progress: number): Point {
  const geometry = ARCHITECTURE_GEOMETRY;
  if (progress < 0.91) return linePoint(
    geometry.modelResponsePort,
    geometry.responseCorridor,
    eased(progress, 0.88, 0.91),
  );
  if (progress < 0.94) return linePoint(
    geometry.responseCorridor,
    geometry.outputSafetyRightPort,
    eased(progress, 0.91, 0.94),
  );
  if (progress < 0.96) return linePoint(
    geometry.outputSafetyRightPort,
    geometry.outputSafetyLeftPort,
    eased(progress, 0.94, 0.96),
  );
  if (progress < 0.99) return linePoint(
    geometry.outputSafetyLeftPort,
    geometry.responseBoundaryPort,
    eased(progress, 0.96, 0.99),
  );
  return linePoint(
    geometry.responseBoundaryPort,
    geometry.clientResponsePort,
    eased(progress, 0.99, 1),
  );
}

export function deriveArchitectureScene(progress: number): ArchitectureScene {
  const p = clamp01(progress);
  const phase = phaseAt(p);
  const documents = deriveDocuments(p);
  const query = deriveQuery(p);
  const retrieval = deriveRetrieval(p);
  const contextPacket = linePoint(
    ARCHITECTURE_GEOMETRY.contextPacketOrigin,
    ARCHITECTURE_GEOMETRY.modelInput,
    eased(p, 0.5, 0.58),
  );
  const tool = deriveTool(p);
  const financeWrite = quadraticPoint(
    ARCHITECTURE_GEOMETRY.stateWriteOrigin,
    { x: 520, y: 292 },
    ARCHITECTURE_GEOMETRY.financeStateSlot,
    eased(p, 0.75, 0.86),
  );
  const responseToken = deriveResponse(p);
  const contextReady = p >= 0.45;

  return {
    progress: p,
    phase,
    detail: phaseDetails[phase],
    boundaryVisible: true,
    ingestion: {
      ...documents,
      tagProgress: eased(p, 0, 0.07),
      corpusProgress: eased(p, 0.05, 0.15),
    },
    query: {
      visible: p >= 0.15,
      legitimate: query.legitimate,
      bypassVisible: p >= 0.15 && p <= 0.27,
      bypass: query.bypass,
      bypassBlocked: p >= 0.24,
    },
    retrieval: {
      resourceAuthorization: p < 0.27 ? 'idle' : p < 0.32 ? 'checking' : 'permit',
      financeChunk: retrieval.financeChunk,
      legalChunk: retrieval.legalChunk,
      legalDenied: p >= 0.45,
    },
    context: {
      envelope: contextPacket,
      fillProgress: eased(p, 0.45, 0.52),
      cardIds: contextReady ? ['finance'] : [],
      inferenceReady: p >= 0.58,
    },
    tool: {
      callVisible: p >= 0.58,
      call: tool.call,
      authorization: tool.authorization,
      active: p >= 0.69 && tool.authorization === 'permit',
      result: tool.result,
    },
    state: {
      financeWrite,
      financeStored: p >= 0.86,
      legalUntouched: true,
    },
    response: {
      visible: p >= 0.88,
      token: responseToken,
      returned: p >= 1,
    },
    motionPoints: [
      documents.financeDocument,
      documents.legalDocument,
      query.legitimate,
      query.bypass,
      retrieval.financeChunk,
      retrieval.legalChunk,
      contextPacket,
      tool.call,
      tool.result,
      financeWrite,
      responseToken,
    ],
  };
}
