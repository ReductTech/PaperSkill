import React, { useEffect, useMemo, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 240;
const MINI_W = 244;
const MINI_H = 130;
const C = {
  background: '#f5f8f0',
  surface: '#ffffff',
  terrain: '#b8c9a7',
  contour: '#76906a',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
};

type Verdict = 'supported' | 'overreach';
type ClaimId = 'pretraining' | 'interface' | 'overreach';

interface ClaimRecord {
  id: ClaimId;
  shortLabel: string;
  statement: string;
  expected: Verdict;
  protocol: string;
  evidence: string;
  boundary: string;
}

const CLAIMS: ClaimRecord[] = [
  {
    id: 'pretraining',
    shortLabel: '预训练表征',
    statement: '轻量对齐、多任务零样本结果与生成能力保留，共同支持“生成预训练已经形成可迁移视觉表征”的解释。',
    expected: 'supported',
    protocol: '能力归因链，而非单一分数',
    evidence: '极低比例视觉任务数据；不混入评测基准训练集；2D/3D 多任务零样本结果；生成能力近似持平。',
    boundary: '这是对 Nano Banana Pro / Vision Banana 的实验证据，不是对所有生成器的普遍定理。',
  },
  {
    id: 'interface',
    shortLabel: 'RGB 统一接口',
    statement: '在论文评测的任务范围内，RGB 生成可以作为连接分割、深度与表面法线的统一输出接口。',
    expected: 'supported',
    protocol: '统一生成格式，不统一任务语义',
    evidence: '所有任务共享 Vision Banana 权重和 RGB 输出；语义最近色、实例聚类、深度双射与法线通道分别完成解码。',
    boundary: '统一的是生成模型和 RGB 答题纸；任务提示、外部解码器与评测指标仍然不同。',
  },
  {
    id: 'overreach',
    shortLabel: '适用范围',
    statement: '所有图像生成器都天然精通所有视觉任务，指令微调不会学习任何新能力。',
    expected: 'overreach',
    protocol: 'Nano Banana Pro / Vision Banana 的经验结论',
    evidence: '论文只研究一个基础模型、有限的 2D/3D 单目任务，并经过有监督的轻量指令微调。',
    boundary: '证据不能推广成所有生成器的普遍定理，也不能证明微调贡献严格为零。',
  },
];

function isCompact(moduleId: string) {
  return !/^\d+(\.\d+)?$/.test(moduleId);
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 9,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function label(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  color = C.text,
  size = 11,
  align: CanvasTextAlign = 'left',
  weight = 'normal',
) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(value, x, y);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const chars = [...value];
  const lines: string[] = [];
  let current = '';
  chars.forEach((char) => {
    const candidate = current + char;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = char;
    } else {
      current = candidate;
    }
  });
  if (current) lines.push(current);
  lines.slice(0, maxLines).forEach((line, index) => {
    const clipped = index === maxLines - 1 && lines.length > maxLines ? `${line.slice(0, -1)}…` : line;
    ctx.fillText(clipped, x, y + index * lineHeight);
  });
}

function stamp(ctx: CanvasRenderingContext2D, verdict: Verdict, correct: boolean) {
  const color = verdict === 'supported' ? C.green : C.red;
  const title = verdict === 'supported' ? '证据支持' : '结论越界';
  ctx.save();
  ctx.translate(423, 106);
  ctx.rotate(-0.1);
  ctx.globalAlpha = correct ? 0.95 : 0.5;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 4;
  roundedRect(ctx, -69, -29, 138, 58, 8);
  ctx.stroke();
  label(ctx, title, 0, 7, color, 22, 'center', 'bold');
  ctx.restore();
}

function drawMain(
  ctx: CanvasRenderingContext2D,
  claim: ClaimRecord,
  verdict: Verdict | null,
  completed: number,
) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.background;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.surface;
  ctx.strokeStyle = C.terrain;
  ctx.lineWidth = 2;
  roundedRect(ctx, 14, 18, 532, 204, 12);
  ctx.fill();
  ctx.stroke();

  label(ctx, '结论原文', 32, 45, C.blue, 11, 'left', 'bold');
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = C.border;
  roundedRect(ctx, 28, 56, 306, 102, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.text;
  ctx.font = '13px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  wrapText(ctx, claim.statement, 44, 82, 274, 23, 4);

  label(ctx, '协议标签', 44, 184, C.orange, 10, 'left', 'bold');
  ctx.fillStyle = '#fff7ed';
  ctx.strokeStyle = C.orange;
  roundedRect(ctx, 103, 169, 225, 26, 13);
  ctx.fill();
  ctx.stroke();
  label(ctx, claim.protocol.length > 20 ? `${claim.protocol.slice(0, 20)}…` : claim.protocol, 216, 186, C.text, 9, 'center');

  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = C.border;
  roundedRect(ctx, 350, 56, 178, 102, 8);
  ctx.fill();
  ctx.stroke();
  if (verdict) {
    stamp(ctx, verdict, verdict === claim.expected);
  } else {
    label(ctx, '尚未盖章', 439, 111, C.muted, 14, 'center', 'bold');
  }
  const correct = verdict !== null && verdict === claim.expected;
  label(ctx, correct ? '判断与证据一致' : verdict ? '判断与证据冲突' : '先检查协议与边界', 439, 183, correct ? C.green : verdict ? C.red : C.blue, 11, 'center', 'bold');
  label(ctx, `已判断 ${completed}/${CLAIMS.length}`, 439, 204, C.muted, 10, 'center');
}

function drawMini(ctx: CanvasRenderingContext2D, now: number, reducedMotion: boolean) {
  const phase = reducedMotion ? 1 : (now % 3200) / 3200;
  ctx.clearRect(0, 0, MINI_W, MINI_H);
  ctx.fillStyle = C.background;
  ctx.fillRect(0, 0, MINI_W, MINI_H);
  ctx.fillStyle = C.surface;
  ctx.strokeStyle = C.terrain;
  ctx.lineWidth = 2;
  roundedRect(ctx, 18, 14, 208, 102, 8);
  ctx.fill();
  ctx.stroke();
  label(ctx, '实验记录', 36, 35, C.blue, 10, 'left', 'bold');
  [0, 1, 2].forEach((index) => {
    ctx.strokeStyle = index === 1 ? C.orange : C.border;
    ctx.lineWidth = index === 1 ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(38, 52 + index * 18);
    ctx.lineTo(128, 52 + index * 18);
    ctx.stroke();
  });
  const down = Math.min(1, phase / 0.55);
  const y = 25 + down * 48;
  ctx.save();
  ctx.translate(176, y);
  ctx.rotate(-0.08);
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 3;
  roundedRect(ctx, -31, -15, 62, 30, 5);
  ctx.stroke();
  label(ctx, '支持', 0, 5, C.green, 13, 'center', 'bold');
  ctx.restore();
  if (phase > 0.62 || reducedMotion) {
    label(ctx, '带边界的结论', 122, 105, C.green, 10, 'center', 'bold');
  }
}

export const ClaimStamp: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const compact = isCompact(moduleId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedId, setSelectedId] = useState<ClaimId>('pretraining');
  const [answers, setAnswers] = useState<Record<ClaimId, Verdict | null>>({
    pretraining: null,
    interface: null,
    overreach: null,
  });
  const claim = useMemo(() => CLAIMS.find((item) => item.id === selectedId) ?? CLAIMS[0], [selectedId]);
  const verdict = answers[selectedId];
  const completed = Object.values(answers).filter(Boolean).length;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, compact ? MINI_W : W, compact ? MINI_H : H);
    } catch {
      return;
    }
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let animationFrame: number | null = null;
    const draw = (now = 0) => {
      if (compact) drawMini(ctx, now, reducedMotion);
      else drawMain(ctx, claim, verdict, completed);
      canvas.classList.add('is-ready');
      if (compact && !reducedMotion) animationFrame = requestAnimationFrame(draw);
    };
    const start = () => {
      if (animationFrame === null) animationFrame = requestAnimationFrame(draw);
    };
    const stop = () => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      animationFrame = null;
    };
    if (!compact) draw();
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [claim, compact, completed, verdict]);

  if (compact) {
    return (
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={MINI_W}
        height={MINI_H}
        aria-label="评审员核对实验记录后，为带边界的结论盖章"
      />
    );
  }

  const correct = verdict !== null && verdict === claim.expected;
  const feedback = verdict === null
    ? `当前证据边界：${claim.boundary}`
    : correct
      ? verdict === 'supported'
        ? `判断正确：这句话被证据支持。${claim.boundary}`
        : `判断正确：这句话越过了证据边界。${claim.boundary}`
      : `这枚章与证据不一致。${claim.evidence}`;

  return (
    <div>
      <div className="paper-contribution-grid" aria-label="论文三项核心贡献">
        <div><span>贡献 1</span><strong>生成预训练形成通用视觉表征</strong></div>
        <div><span>贡献 2</span><strong>RGB 生成统一多种任务输出</strong></div>
        <div><span>贡献 3</span><strong>一个模型覆盖 2D、3D 与生成</strong></div>
      </div>
      <div className="paper-choice-group" role="tablist" aria-label="选择待判断的论文结论">
        {CLAIMS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selectedId === item.id}
            onClick={() => setSelectedId(item.id)}
          >
            {item.shortLabel}
          </button>
        ))}
      </div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label={`${claim.shortLabel}：${claim.statement}`}
        style={{ width: '100%', maxWidth: W, height: 'auto' }}
      />
      <div className="paper-choice-group paper-verdict-group" role="group" aria-label="为当前结论盖章">
        <button
          type="button"
          className="paper-support-button"
          aria-pressed={verdict === 'supported'}
          onClick={() => setAnswers((current) => ({ ...current, [selectedId]: 'supported' }))}
        >
          盖“证据支持”章
        </button>
        <button
          type="button"
          className="paper-overreach-button"
          aria-pressed={verdict === 'overreach'}
          onClick={() => setAnswers((current) => ({ ...current, [selectedId]: 'overreach' }))}
        >
          盖“结论越界”章
        </button>
      </div>
      <div className={`feedback ${verdict === null ? '' : correct ? 'good' : 'bad'}`} role="status" aria-live="polite">{feedback}</div>
      <dl className="paper-fact-grid">
        <dt>对应证据</dt><dd>{claim.evidence}</dd>
        <dt>结论边界</dt><dd>{claim.boundary}</dd>
        <dt>完成进度</dt><dd>{completed}/{CLAIMS.length} 项已经判断</dd>
      </dl>
      {completed === CLAIMS.length && Object.entries(answers).every(([id, answer]) => CLAIMS.find((item) => item.id === id)?.expected === answer) && (
        <div className="feedback good">全部结论均已和对应证据、协议与限制对齐。</div>
      )}
      <details className="paper-technical-details">
        <summary>核心结论的适用边界</summary>
        <div className="paper-technical-details-body">
          <ul>
            <li>结论首先适用于 Nano Banana Pro / Vision Banana 和论文评测的单目 2D、3D 任务，不是所有图像生成器的普遍定理。</li>
            <li>RGB 是统一输出接口，不是万能解码器；语义最近色、实例聚类、深度双射和法线通道各有独立规则。</li>
            <li>SA-Co/Gold 依赖 Gemini 做负查询过滤，ReasonSeg 依赖 Gemini 改写查询，组合结果不能全部归因于 Vision Banana 单体。</li>
            <li>论文没有证明指令微调完全不学习新能力，只提供“主要释放已有表征”的实验支持。</li>
            <li>当前方法仍有较高推理成本，并未覆盖多视图、视频以及更多结构化视觉任务。</li>
          </ul>
        </div>
      </details>
    </div>
  );
};

export default ClaimStamp;
