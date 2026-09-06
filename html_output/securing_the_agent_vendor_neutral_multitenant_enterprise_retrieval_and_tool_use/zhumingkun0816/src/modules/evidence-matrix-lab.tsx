import { useState } from 'react';
import { clamp01, easeOutCubic, lerp } from '../animation/easing';
import { useTimeline } from '../animation/useTimeline';
import { PAPER_EVIDENCE } from './evidence/paperEvidence';
import { ChipRow, Feedback, LabCanvas, LabShell, type Tone } from './shared/LabChrome';
import { C, arrow, box, dot, label } from './shared/canvasDrawing';
import type { PaperWidgetProps } from './library-scenes';

export type EvidenceQuestion = 'security' | 'quality' | 'cost';

interface QuestionBase {
  protocol: string;
  conclusion: string;
  tone: Tone;
}

export const EVIDENCE_QUESTIONS = {
  security: {
    ctlr: PAPER_EVIDENCE.security.ctlr,
    avr: PAPER_EVIDENCE.security.avr,
    injectionLeaks: PAPER_EVIDENCE.injectionLeaks,
    protocol: '合成三租户测试床 · A/C 未门控，B/D 门控 · 注入每配置 90 个探针',
    conclusion: '安全：门控提供安全；服务端编排提供强制执行，使客户端不能跳过安全步骤。',
    tone: 'good',
  },
  quality: {
    precisionAt5: PAPER_EVIDENCE.quality.precisionAt5,
    mrr: PAPER_EVIDENCE.quality.mrr,
    postFilterRecall: PAPER_EVIDENCE.postFilter.map((point) => point.recallAt5),
    protocol: '跨租户高相似度合成嵌入 · Precision@5 / MRR · 规模 Recall 见 §3',
    conclusion: '质量：过滤跨租户噪声提高 Precision@5 和 MRR；后过滤的规模 Recall 风险见 §3。',
    tone: 'good',
  },
  cost: {
    gatedSearchOverhead: PAPER_EVIDENCE.gatedSearchOverhead,
    serverSideOrchestrationOverhead: PAPER_EVIDENCE.serverSideOrchestrationOverhead,
    qpsAt25: PAPER_EVIDENCE.qpsAt25,
    protocol: '门控搜索路径 · 非流式 Responses API 工具往返 · QPS 并发 c=25',
    conclusion: '代价：本测试床的门控搜索路径约增加 19 ms；非流式服务端编排约增加 3 s，并改变高并发吞吐。',
    tone: 'warn',
  },
} as const satisfies Record<EvidenceQuestion, QuestionBase & Record<string, unknown>>;

export interface EvidenceFrame {
  progress: number;
  animatedValues: number[];
}

function rawValues(question: EvidenceQuestion): number[] {
  if (question === 'security') {
    return [
      ...EVIDENCE_QUESTIONS.security.ctlr,
      ...EVIDENCE_QUESTIONS.security.avr,
      ...EVIDENCE_QUESTIONS.security.injectionLeaks,
    ];
  }
  if (question === 'quality') {
    return [
      ...EVIDENCE_QUESTIONS.quality.precisionAt5,
      ...EVIDENCE_QUESTIONS.quality.mrr,
      ...EVIDENCE_QUESTIONS.quality.postFilterRecall,
    ];
  }
  return [
    EVIDENCE_QUESTIONS.cost.gatedSearchOverhead.valueMs,
    EVIDENCE_QUESTIONS.cost.serverSideOrchestrationOverhead.valueSeconds,
    ...EVIDENCE_QUESTIONS.cost.qpsAt25,
  ];
}

export function deriveEvidenceFrame(question: EvidenceQuestion, progress: number): EvidenceFrame {
  const eased = easeOutCubic(clamp01(progress));
  return {
    progress: eased,
    animatedValues: rawValues(question).map((value) => value * eased),
  };
}

const configLabels = ['A 客户端未门控', 'B 客户端门控', 'C 服务端未门控', 'D 服务端门控'];

export function EvidenceMatrixLab(_props: PaperWidgetProps) {
  const timeline = useTimeline(900);
  const [question, setQuestion] = useState<EvidenceQuestion>('security');
  const [started, setStarted] = useState(false);
  const record = EVIDENCE_QUESTIONS[question];
  const frame = deriveEvidenceFrame(question, started ? timeline.progress : 0);

  const choose = (next: string) => {
    setQuestion(next as EvidenceQuestion);
    setStarted(true);
    timeline.replay();
  };
  const replay = () => {
    setStarted(true);
    timeline.replay();
  };

  return (
    <LabShell>
      <ChipRow
        labelText="用三个问题检查论文证据"
        options={[
          { value: 'security', label: '它真的安全了吗？' },
          { value: 'quality', label: '质量怎么样？' },
          { value: 'cost', label: '代价是多少？' },
        ]}
        value={question}
        onChange={choose}
      />
      <div className="lab-stat-strip">
        <span className="lab-protocol">{record.protocol}</span>
        <button type="button" className="tiny" onClick={replay}>{started ? '重新揭示' : '揭示证据'}</button>
      </div>
      <div className="evidence-matrix-canvas">
        <LabCanvas
          height={318}
          labelText={`${record.protocol}。${record.conclusion}`}
          onOutOfView={timeline.pause}
          draw={(ctx) => {
          if (question === 'security') {
            label(ctx, '安全问题：门控决定泄漏是否归零；服务端编排决定步骤能否被绕过', 280, 19, C.ink, 11);
            label(ctx, '横向：门控策略', 280, 33, C.muted, 8);
            label(ctx, '未门控', 146, 33, C.orange, 8);
            label(ctx, '门控', 413, 33, C.green, 8);
            const gateReveal = clamp01((frame.progress - 0.12) / 0.45);
            const probeReveal = clamp01((frame.progress - 0.58) / 0.32);
            const ctlrValues = EVIDENCE_QUESTIONS.security.ctlr;
            const avrValues = EVIDENCE_QUESTIONS.security.avr;
            configLabels.forEach((config, index) => {
              const column = index % 2;
              const row = Math.floor(index / 2);
              const x = 25 + column * 267;
              const y = 42 + row * 100;
              const gated = index === 1 || index === 3;
              box(ctx, x, y, 242, 82, gated ? '#eef9f3' : '#fff7ed', gated ? C.green : C.orange, 2);
              label(ctx, config, x + 121, y + 16, gated ? C.green : C.orange, 11);
              label(ctx, gateReveal > 0.02 ? `CTLR ${Math.round(ctlrValues[index] * gateReveal)}%` : 'CTLR —', x + 66, y + 45, gated ? C.green : C.red, 11);
              label(ctx, gateReveal > 0.02 ? `AVR ${Math.round(avrValues[index] * gateReveal)}%` : 'AVR —', x + 177, y + 45, gated ? C.green : C.red, 11);
              label(ctx, gated ? '门控' : '未门控', x + 121, y + 66, gated ? C.green : C.muted, 9);
            });
            if (frame.progress > 0.35) {
              arrow(ctx, 267, 83, 291, 83, C.green, 1.5);
              arrow(ctx, 267, 183, 291, 183, C.green, 1.5);
            }
            box(ctx, 25, 249, 509, 45, C.white, C.line, 1);
            label(ctx, '提示注入泄漏（每配置 90 探针）', 38, 262, C.muted, 9, 'left');
            const injection = EVIDENCE_QUESTIONS.security.injectionLeaks.map((value) => Math.round(value * probeReveal));
            label(ctx, `A ${injection[0]}/90   B ${injection[1]}/90   C ${injection[2]}/90   D ${injection[3]}/90`, 280, 281, C.ink, 11);
          } else if (question === 'quality') {
            label(ctx, '质量问题：先比较过滤前后，再保留规模边界', 280, 19, C.ink, 11);
            const metricReveal = clamp01((frame.progress - 0.08) / 0.48);
            const recallReveal = clamp01((frame.progress - 0.55) / 0.4);
            const drawMetric = (title: string, before: number, after: number, x: number) => {
              const left = x + 20;
              const right = x + 230;
              const y = 88;
              const beforeX = left + before * (right - left);
              const afterX = left + after * (right - left);
              label(ctx, title, x + 125, 49, C.blue, 12);
              ctx.strokeStyle = C.line;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(left, y);
              ctx.lineTo(right, y);
              ctx.stroke();
              label(ctx, '0', left, 107, C.muted, 8);
              label(ctx, '1.0', right, 107, C.muted, 8, 'right');
              dot(ctx, beforeX, y, 6, C.muted);
              const movingX = lerp(beforeX, afterX, metricReveal);
              if (metricReveal > 0.02) arrow(ctx, beforeX + 8, y, movingX - 8, y, C.green, 2);
              dot(ctx, movingX, y, 7, C.green);
              label(ctx, before.toFixed(3), beforeX, 70, C.muted, 10);
              label(ctx, metricReveal > 0.05 ? after.toFixed(3) : '—', movingX, 70, C.green, 10);
              label(ctx, '过滤前', beforeX, 123, C.muted, 9);
              label(ctx, '门控后', movingX, 123, C.green, 9);
            };
            drawMetric('Precision@5', EVIDENCE_QUESTIONS.quality.precisionAt5[0], EVIDENCE_QUESTIONS.quality.precisionAt5[1], 20);
            drawMetric('MRR', EVIDENCE_QUESTIONS.quality.mrr[0], EVIDENCE_QUESTIONS.quality.mrr[1], 290);
            box(ctx, 25, 151, 509, 147, '#fff8e8', C.orange, 2);
            label(ctx, '§3 后过滤 Recall@5：规模扩大后快速下降（对数规模）', 38, 168, C.orange, 9, 'left');
            const recallValues = EVIDENCE_QUESTIONS.quality.postFilterRecall;
            const recallXs = [78, 207, 336, 465];
            const recallLabels = ['100', '1K', '10K', '50K'];
            const recallY = (value: number) => 258 - ((Math.log10(value) + 3) / 3) * 55;
            ctx.strokeStyle = C.line;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(58, 258);
            ctx.lineTo(486, 258);
            ctx.stroke();
            const recallPoints = recallValues.map((value, index) => ({
              x: recallXs[index],
              y: lerp(258, recallY(value), recallReveal),
            }));
            ctx.strokeStyle = C.orange;
            ctx.lineWidth = 2;
            ctx.beginPath();
            recallPoints.forEach((point, index) => {
              if (index === 0) ctx.moveTo(point.x, point.y);
              else ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
            recallPoints.forEach((point, index) => {
              dot(ctx, point.x, point.y, 5, C.orange);
              label(ctx, recallReveal > 0.05 ? recallValues[index].toFixed(3) : '—', point.x, point.y - 13, C.orange, 8);
              label(ctx, recallLabels[index], point.x, 274, C.muted, 8);
            });
          } else {
            label(ctx, '代价问题：不同单位、不同协议，分块读取', 280, 19, C.ink, 11);
            const values = frame.animatedValues;
            const blocks = [
              { x: 20, w: 160, value: `≈${values[0].toFixed(0)} ms`, title: '门控搜索路径', note: '测试床增量' },
              { x: 200, w: 160, value: `≈${values[1].toFixed(1)} s`, title: '服务端编排', note: '非流式工具往返' },
            ];
            blocks.forEach((block, index) => {
              box(ctx, block.x, 48, block.w, 118, index === 0 ? '#eef5fb' : '#fff8e8', index === 0 ? C.blue : C.orange, 2);
              label(ctx, block.title, block.x + block.w / 2, 68, C.muted, 10);
              label(ctx, started ? block.value : '—', block.x + block.w / 2, 105, index === 0 ? C.blue : C.orange, 22);
              label(ctx, block.note, block.x + block.w / 2, 143, C.muted, 9);
            });
            box(ctx, 380, 48, 160, 118, '#f5f3ff', C.purple, 2);
            label(ctx, '吞吐（QPS）· c=25', 460, 68, C.muted, 10);
            label(ctx, started ? `A ${values[2].toFixed(1)}   B ${values[3].toFixed(1)}` : '—', 460, 99, C.purple, 13);
            label(ctx, started ? `C ${values[4].toFixed(1)}   D ${values[5].toFixed(1)}` : '—', 460, 124, C.purple, 13);
            label(ctx, '四配置独立吞吐', 460, 146, C.muted, 9);
            box(ctx, 20, 190, 520, 92, C.white, C.line, 1);
            label(ctx, '不能把 ms、s 与 QPS 放到同一个定量轴', 280, 214, C.red, 11);
            label(ctx, '≈19 ms：gated search', 103, 248, C.blue, 10);
            label(ctx, '≈3 s：non-streaming Responses API tool round-trip', 280, 248, C.orange, 9);
            label(ctx, 'QPS：c=25', 470, 248, C.purple, 10);
            label(ctx, '三组数字只在各自协议内解释', 280, 270, C.muted, 9);
          }
            if (!started) label(ctx, '选择问题或点击“揭示证据”', 280, 307, C.muted, 9);
          }}
        />
      </div>
      <Feedback tone={started ? record.tone : 'info'}>
        {started ? record.conclusion : '安全、质量与代价分别回答不同问题，不能压成一个总分。'}
      </Feedback>
    </LabShell>
  );
}
