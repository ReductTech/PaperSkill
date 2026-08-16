import React, { useState } from 'react';
import {
  Feedback,
  PALETTE,
  PaperCanvas,
  type PaperWidgetProps,
  clearDesk,
  drawGuideLine,
  drawSceneLabel,
  drawWrappedLabel,
  drawTargetMark,
  roundedRect,
} from './cascade-vs-unified';

type WallId = 'speed' | 'boundary' | 'faithfulness';
type Route = 'naive' | 'paper';

const walls: Record<WallId, {
  label: string;
  symptom: string;
  evidence: string;
  naive: string;
  broken: string;
  answer: string;
  result: string;
}> = {
  speed: {
    label: '长输出慢',
    symptom: '表格、公式、Markdown 要生成大量 token',
    evidence: 'vLLM AR：3.032 s/页（Table 2）',
    naive: '截短输出或让小模型直接作答',
    broken: '破坏完整输出或目标模型裁决',
    answer: 'DFlash：并行草拟，目标批量校验',
    result: '同协议延迟 3.032 → 1.408 s（2.14×）',
  },
  boundary: {
    label: '长尾能力窄',
    symptom: '低资源语言、古文字、多页问答数据稀缺',
    evidence: '弱点不是“通用数据总量不够”',
    naive: '直接换成更大的通用模型',
    broken: '放弃约 1B 轻量部署目标',
    answer: 'Agentic Data Flow + Stage3/SFT/RL',
    result: '把具体弱点转成材料、质检和训练任务',
  },
  faithfulness: {
    label: '所见不忠实',
    symptom: '语言模型会把图中无意义错词改正确',
    evidence: '例如 dacument 被改回 document',
    naive: '相信语言常识自动纠错',
    broken: '覆盖视觉证据，形成 OCR 幻觉',
    answer: '任务化奖励 + CHAOS-Bench',
    result: '14.15 相对领先，但绝对召回仍低',
  },
};

const constraints = ['约 1B', '端到端', '完整输出', '目标裁决'];

export const MotivationLab: React.FC<PaperWidgetProps> = ({ chapterId, moduleId }) => {
  const [wall, setWall] = useState<WallId>('speed');
  const [route, setRoute] = useState<Route>('naive');
  const item = walls[wall];
  const isPaper = route === 'paper';
  const tone = isPaper ? PALETTE.green : PALETTE.red;

  const chooseWall = (value: WallId) => {
    setWall(value);
    setRoute('naive');
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    clearDesk(ctx, 560, 336);
    drawSceneLabel(ctx, '研究问题：在固定部署约束下，怎样跨过三堵墙？', 280, 24, PALETTE.ink, 'center');

    roundedRect(ctx, 24, 48, 190, 112, 12);
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = PALETTE.red; ctx.lineWidth = 3; ctx.stroke();
    drawSceneLabel(ctx, item.label, 119, 76, PALETTE.red, 'center');
    drawWrappedLabel(ctx, item.symptom, 119, 103, 158, PALETTE.ink, 'center', 17);
    drawWrappedLabel(ctx, item.evidence, 119, 140, 158, PALETTE.muted, 'center', 17);

    drawGuideLine(ctx, 222, 104, 276, 104, tone, 5);
    drawTargetMark(ctx, 278, 104, tone);

    roundedRect(ctx, 292, 48, 244, 112, 12);
    ctx.fillStyle = isPaper ? '#e3f4ea' : '#fde8ec'; ctx.fill(); ctx.strokeStyle = tone; ctx.lineWidth = 3; ctx.stroke();
    drawSceneLabel(ctx, isPaper ? '论文路线' : '最直觉的办法', 414, 76, tone, 'center');
    drawWrappedLabel(ctx, isPaper ? item.answer : item.naive, 414, 103, 208, PALETTE.ink, 'center', 17);
    drawWrappedLabel(ctx, isPaper ? item.result : item.broken, 414, 140, 208, tone, 'center', 17);

    drawSceneLabel(ctx, '必须同时守住的约束', 280, 195, PALETTE.ink, 'center');
    constraints.forEach((label, index) => {
      const x = 42 + index * 130;
      roundedRect(ctx, x, 214, 112, 44, 9);
      ctx.fillStyle = isPaper ? '#e3f4ea' : index === (wall === 'speed' ? 2 : wall === 'boundary' ? 0 : 3) ? '#fde8ec' : '#fff';
      ctx.fill();
      ctx.strokeStyle = isPaper ? PALETTE.green : index === (wall === 'speed' ? 2 : wall === 'boundary' ? 0 : 3) ? PALETTE.red : PALETTE.axis;
      ctx.lineWidth = 2; ctx.stroke();
      drawSceneLabel(ctx, `${isPaper ? '✓' : index === (wall === 'speed' ? 2 : wall === 'boundary' ? 0 : 3) ? '×' : '○'} ${label}`, x + 56, 241, isPaper ? PALETTE.green : PALETTE.ink, 'center');
    });

    roundedRect(ctx, 42, 278, 476, 34, 8);
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = tone; ctx.lineWidth = 2; ctx.stroke();
    drawSceneLabel(ctx, isPaper ? '问题、方法与约束一一对应' : '这个办法看似直接，却破坏了论文要保留的条件', 280, 301, tone, 'center');
  };

  const feedback = isPaper
    ? `${item.answer} 对应“${item.label}”，同时保留约 1B、端到端、完整输出和目标模型裁决。`
    : `${item.naive} 看似省事，但会${item.broken}；这正是论文不能只用直觉方案的原因。`;

  return <div className="paper-widget motivation-widget">
    <PaperCanvas height={336} draw={draw} ariaLabel={`${chapterId}-${moduleId} 三堵墙与研究约束`} />
    <div className="ctrl" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {(Object.keys(walls) as WallId[]).map((id) => <button key={id} className={wall === id ? 'active' : ''} onClick={() => chooseWall(id)}>{walls[id].label}</button>)}
      <button className={!isPaper ? 'active' : ''} onClick={() => setRoute('naive')}>试最直觉办法</button>
      <button className={isPaper ? 'active' : ''} onClick={() => setRoute('paper')}>采用论文路线</button>
    </div>
    <Feedback tone={isPaper ? 'green' : 'red'}>{feedback}</Feedback>
  </div>;
};

export default MotivationLab;
