import React, { useState } from 'react';
import { PaperCanvas, PaperWidgetProps, PALETTE, clearDesk, drawGuideLine, drawSceneLabel, drawTargetMark, drawWrappedLabel, Feedback, roundedRect } from './cascade-vs-unified';

type RewardId = 'edit' | 'table' | 'scrm' | 'judge' | 'gate';
type SampleId = 'text' | 'table' | 'chart' | 'vqa' | 'translation' | 'repeat';

const rewards: Record<RewardId, { label: string; sees: string; color: string }> = {
  edit: { label: '正文编辑距离', sees: '字符插入、删除与替换', color: PALETTE.blue },
  table: { label: '表格内容 + 结构', sees: '去样式内容与 1D-probe 结构', color: PALETTE.green },
  scrm: { label: '图表 SCRM', sees: '行列顺序无关的图表语义匹配', color: PALETTE.purple },
  judge: { label: '参考一致性 Judge', sees: '语义一致；翻译可用 0–5 软分', color: PALETTE.orange },
  gate: { label: '退化门禁', sees: '过长或尾部重复直接置零', color: PALETTE.red },
};

const samples: Record<SampleId, { label: string; output: string; answer: RewardId; why: string }> = {
  text: { label: '普通正文', output: '公司本季度营收增长 12%。', answer: 'edit', why: '普通转写需要逐字符检查事实差异。' },
  table: { label: 'HTML 表格', output: '<td rowspan="2">合计</td>', answer: 'table', why: '只比较字符会忽略行列与合并单元格结构。' },
  chart: { label: '图表数据', output: '类别A=10，类别B=20（行列可转置）', answer: 'scrm', why: '图表语义可能在行列置换后仍等价。' },
  vqa: { label: '视觉问答', output: '“最高的是德国” 对比 “德国比例最高”', answer: 'judge', why: '语义相同不应因措辞不同被编辑距离惩罚。' },
  translation: { label: '图片翻译', output: '需要同时判断准确、流畅、文化与术语', answer: 'judge', why: '论文让 Judge 给 0–5 分后再归一化。' },
  repeat: { label: '尾部重复', output: '</td></tr> 连续重复至少 8 次', answer: 'gate', why: '退化输出先被门禁置零，不再浪费后续评分计算。' },
};

export const RewardRouter: React.FC<PaperWidgetProps> = ({ chapterId, moduleId }) => {
  const [sampleId, setSampleId] = useState<SampleId>('table');
  const [choice, setChoice] = useState<RewardId | null>(null);
  const sample = samples[sampleId];
  const reward = choice ? rewards[choice] : null;
  const correct = choice === sample.answer;
  const chooseSample = (id: SampleId) => { setSampleId(id); setChoice(null); };

  const draw = (ctx: CanvasRenderingContext2D) => {
    clearDesk(ctx, 560, 346);
    drawSceneLabel(ctx, '同一个编辑距离，为什么判断不了所有 OCR 输出？', 280, 24, PALETTE.ink, 'center');
    roundedRect(ctx, 30, 52, 220, 122, 11); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = PALETTE.purple; ctx.lineWidth = 3; ctx.stroke();
    drawSceneLabel(ctx, sample.label, 140, 82, PALETTE.purple, 'center');
    drawWrappedLabel(ctx, sample.output, 140, 112, 184, PALETTE.ink, 'center', 18);
    drawSceneLabel(ctx, '模型 rollout', 140, 153, PALETTE.muted, 'center');

    const tone = choice === null ? PALETTE.axis : correct ? PALETTE.green : PALETTE.red;
    drawGuideLine(ctx, 258, 113, 310, 113, tone, 5); if (choice !== null) drawTargetMark(ctx, 312, 113, tone);
    roundedRect(ctx, 328, 52, 202, 122, 11); ctx.fillStyle = choice === null ? '#fff' : correct ? '#e3f4ea' : '#fde8ec'; ctx.fill(); ctx.strokeStyle = tone; ctx.lineWidth = 3; ctx.stroke();
    drawSceneLabel(ctx, reward?.label ?? '请选择评分方法', 429, 83, choice === null ? PALETTE.muted : tone, 'center');
    drawWrappedLabel(ctx, reward?.sees ?? '不同尺能看见的信息不同', 429, 112, 170, PALETTE.ink, 'center', 18);
    drawSceneLabel(ctx, choice === null ? '尚未路由' : correct ? '匹配该输出语义' : '会丢失关键事实', 429, 153, tone, 'center');

    roundedRect(ctx, 46, 212, 468, 74, 10); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = choice === null ? PALETTE.axis : tone; ctx.lineWidth = 2; ctx.stroke();
    drawWrappedLabel(ctx, choice === null ? '先选择一把校对尺' : sample.why, 280, 235, 428, choice === null ? PALETTE.muted : PALETTE.ink, 'center', 18);
    drawSceneLabel(ctx, correct ? '正确路由后，奖励才与任务真正关心的事实一致' : choice === null ? '正文 · 表格 · 图表 · QA/翻译 · 退化' : '换一把能看见结构或语义的尺', 280, 270, correct ? PALETTE.green : PALETTE.muted, 'center');
    drawSceneLabel(ctx, 'Figure 4 · §5.3.2–§5.3.4', 280, 322, PALETTE.muted, 'center');
  };

  const feedback = choice === null
    ? '先选输出，再为它选择评分方法。错误路由会即时说明被忽略的结构或语义。'
    : correct
      ? `选择正确：${sample.why}`
      : `“${rewards[choice].label}”不适合这个输出。${sample.why}`;

  return <div>
    <PaperCanvas height={346} draw={draw} ariaLabel={`${chapterId}-${moduleId} 任务化奖励选择`} />
    <div className="ctrl" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{(Object.keys(samples) as SampleId[]).map((id) => <button key={id} className={sampleId === id ? 'active' : ''} onClick={() => chooseSample(id)}>{samples[id].label}</button>)}</div>
    <div className="ctrl" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{(Object.keys(rewards) as RewardId[]).map((id) => <button key={id} className={choice === id ? 'active' : ''} onClick={() => setChoice(id)}>{rewards[id].label}</button>)}</div>
    <Feedback tone={choice === null ? 'blue' : correct ? 'green' : 'red'}>{feedback}</Feedback>
  </div>;
};

export default RewardRouter;
