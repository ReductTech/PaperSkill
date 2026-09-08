import React, { useState } from 'react';
import { PaperCanvas, PaperWidgetProps, PALETTE, clearDesk, drawGuideLine, drawSceneLabel, drawWrappedLabel, Feedback, roundedRect } from './cascade-vs-unified';

type StageId = 'stage3' | 'sft' | 'rl';
type ViewId = 'goal' | 'data' | 'boundary';

const stageOrder: StageId[] = ['stage3', 'sft', 'rl'];
const stages: Record<StageId, {
  label: string;
  shortRole: string;
  goal: string;
  data: string;
  action: string;
  output: string;
  boundary: string;
  color: string;
}> = {
  stage3: {
    label: 'Stage3',
    shortRole: '扩能力边界',
    goal: '注入新能力，同时回放旧数据防遗忘',
    data: '331 语言合成解析、古文字与多页等新数据 + HunyuanOCR-1.0 历史 OCR 数据',
    action: '新旧数据混合继续预训练',
    output: '扩大覆盖范围，同时保住已有 OCR 与文档解析能力',
    boundary: '4K 图像上限与 128K 上下文属于 Stage3 设置',
    color: PALETTE.blue,
  },
  sft: {
    label: 'SFT',
    shortRole: '统一任务接口',
    goal: '先建立干净、格式一致的基础策略',
    data: '清除图文不匹配、标注错误、格式冲突和低质量重复后的统一提示样本',
    action: '用高质量监督答案对齐任务与输出格式',
    output: '模型先学会稳定理解提示，并按统一接口完成任务',
    boundary: '坏样本在这一阶段之前清除；SFT 不是奖励筛选阶段',
    color: PALETTE.orange,
  },
  rl: {
    label: 'RL',
    shortRole: '精修高难样本',
    goal: '把训练算力留给当前策略仍会摇摆的 query',
    data: '每个 query 进行 16 次 rollout，保留奖励呈非平凡方差的高难样本',
    action: '按任务专用奖励继续优化',
    output: '集中提升仍有学习信号的难例，而非重复训练稳定样本',
    boundary: '附录中的 RL 训练序列长度是 16,384，不要与 Stage3 的 128K 混为同一设置',
    color: PALETTE.green,
  },
};

const views: Record<ViewId, { label: string; question: string }> = {
  goal: { label: '看目标', question: '这一阶段为什么存在？' },
  data: { label: '看数据', question: '什么数据进入，发生什么处理？' },
  boundary: { label: '看边界', question: '最容易混淆的设置是什么？' },
};

export const TrainingStageStepper: React.FC<PaperWidgetProps> = ({ chapterId, moduleId }) => {
  const [stageIndex, setStageIndex] = useState(0);
  const [view, setView] = useState<ViewId>('goal');
  const stageId = stageOrder[stageIndex];
  const stage = stages[stageId];

  const draw = (ctx: CanvasRenderingContext2D) => {
    clearDesk(ctx, 560, 380);
    drawSceneLabel(ctx, '同一模型，三次不同目的的训练推进', 280, 25, PALETTE.ink, 'center');
    drawSceneLabel(ctx, '前两段预训练直接复用；论文从 Stage3 开始重规划', 280, 49, PALETTE.blue, 'center');

    stageOrder.forEach((id, index) => {
      const item = stages[id];
      const x = 97 + index * 183;
      const current = index === stageIndex;
      const passed = index < stageIndex;
      if (index < stageOrder.length - 1) {
        drawGuideLine(ctx, x + 50, 88, x + 133, 88, passed ? PALETTE.green : PALETTE.axis, passed ? 5 : 3);
      }
      roundedRect(ctx, x - 56, 65, 112, 55, 12);
      ctx.fillStyle = current ? (id === 'rl' ? '#e3f4ea' : id === 'sft' ? '#fff2dd' : '#e8f1fb') : passed ? '#eef6ec' : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = current ? item.color : passed ? PALETTE.green : PALETTE.axis;
      ctx.lineWidth = current ? 4 : 2;
      ctx.stroke();
      drawSceneLabel(ctx, item.label, x, 88, current ? item.color : PALETTE.muted, 'center');
      drawSceneLabel(ctx, item.shortRole, x, 109, current ? PALETTE.ink : PALETTE.muted, 'center');
    });

    roundedRect(ctx, 35, 143, 490, 171, 16);
    ctx.fillStyle = '#fffdf8';
    ctx.fill();
    ctx.strokeStyle = stage.color;
    ctx.lineWidth = 3;
    ctx.stroke();

    roundedRect(ctx, 55, 161, 102, 29, 14);
    ctx.fillStyle = stage.color;
    ctx.fill();
    drawSceneLabel(ctx, `${stage.label} · ${views[view].label}`, 106, 181, '#ffffff', 'center');
    drawWrappedLabel(ctx, views[view].question, 280, 211, 430, stage.color, 'center', 20);

    if (view === 'goal') {
      drawWrappedLabel(ctx, stage.goal, 280, 248, 430, PALETTE.ink, 'center', 21);
      drawGuideLine(ctx, 193, 277, 367, 277, stage.color, 4);
      drawWrappedLabel(ctx, stage.output, 280, 303, 430, PALETTE.muted, 'center', 18);
    } else if (view === 'data') {
      drawWrappedLabel(ctx, stage.data, 280, 244, 430, PALETTE.ink, 'center', 19);
      drawGuideLine(ctx, 193, 274, 367, 274, stage.color, 4);
      drawWrappedLabel(ctx, stage.action, 280, 303, 430, stage.color, 'center', 19);
    } else {
      drawWrappedLabel(ctx, stage.boundary, 280, 254, 430, PALETTE.ink, 'center', 20);
      drawSceneLabel(ctx, '把设置放回所属阶段，避免跨阶段拼接结论', 280, 298, PALETTE.orange, 'center');
    }

    drawSceneLabel(ctx, 'Stage3 扩边界 → SFT 打地基 → RL 练难题', 280, 344, PALETTE.green, 'center');
    drawSceneLabel(ctx, '§5.1–5.3 · Appendix D', 280, 369, PALETTE.muted, 'center');
  };

  const feedback = view === 'goal'
    ? `${stage.label} 的核心职责是“${stage.shortRole}”：${stage.goal}。`
    : view === 'data'
      ? `${stage.label} 不是重复使用同一批数据：${stage.data}。`
      : `边界提醒：${stage.boundary}。`;

  return <div className="paper-widget training-widget">
    <PaperCanvas height={380} draw={draw} ariaLabel={`${chapterId}-${moduleId} Stage3 SFT RL 阶段探索器`} />
    <div className="paper-scrubber">
      <div className="paper-scrubber-head"><span>拖动训练进程</span><strong>{stage.label} · {stage.shortRole}</strong></div>
      <input aria-label="训练阶段" type="range" min="0" max="2" step="1" value={stageIndex} onChange={(event) => setStageIndex(Number(event.target.value))} onKeyDown={(event) => event.stopPropagation()} />
      <div className="paper-scrubber-labels">
        {stageOrder.map((id, index) => <button key={id} className={stageIndex === index ? 'active' : ''} onClick={() => setStageIndex(index)}>{stages[id].label}</button>)}
      </div>
    </div>
    <div className="paper-view-tabs" aria-label="切换观察视角">
      {(Object.keys(views) as ViewId[]).map((id) => <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}><span>{id === 'goal' ? '◎' : id === 'data' ? '▦' : '◇'}</span>{views[id].label}</button>)}
    </div>
    <Feedback tone={stageId === 'rl' ? 'green' : 'blue'}>{feedback}</Feedback>
  </div>;
};

export default TrainingStageStepper;
