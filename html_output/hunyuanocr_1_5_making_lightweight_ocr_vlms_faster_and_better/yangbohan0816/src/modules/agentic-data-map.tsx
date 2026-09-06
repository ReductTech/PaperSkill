import React, { useState } from 'react';
import { PaperCanvas, PaperWidgetProps, PALETTE, clearDesk, drawGuideLine, drawSceneLabel, drawWrappedLabel, Feedback, roundedRect } from './cascade-vs-unified';

type TaskId = 'low' | 'ancient' | 'multi';

const tasks: Record<TaskId, { label: string; need: string; material: string; check: string; output: string; evidence: string }> = {
  low: {
    label: '低资源语言',
    need: '补足稀有语言与书写系统',
    material: '多语言语料 + TTF 字体',
    check: '测试字体的字符覆盖与可渲染性',
    output: '多语言合成解析数据',
    evidence: '训练数据覆盖 331 种语言；MORE 评测覆盖 149 种',
  },
  ancient: {
    label: '古文字',
    need: '补足七类历史汉字形态',
    material: '古字字体 + 无文字古籍背景',
    check: '用 OCR/VLM 过滤带干扰文字的背景',
    output: '多字体、多版式、带退化的古文字数据',
    evidence: '背景必须通过工具验证，避免把原有文字当成训练标签',
  },
  multi: {
    label: '多页问答',
    need: '构造真正依赖跨页证据的问题',
    material: '多页 PDF + 页级文本结构',
    check: '过滤单页可答、无证据或答案不一致的问题',
    output: '跨页检索、比较与证据聚合 QA',
    evidence: '保留必须组合多页证据才能回答的样本',
  },
};

const stageLabels = ['定义缺口', '寻找材料', '工具质检', '人工收口'];

export const AgenticDataMap: React.FC<PaperWidgetProps> = ({ chapterId, moduleId }) => {
  const [taskId, setTaskId] = useState<TaskId>('low');
  const [stage, setStage] = useState(0);
  const task = tasks[taskId];

  const chooseTask = (id: TaskId) => {
    setTaskId(id);
    setStage(0);
  };

  const stageData = [
    {
      kicker: '先把“数据不够”说具体',
      value: task.need,
      note: '能力缺口决定后续材料与检查标准；不是先抓一批数据再解释它有什么用。',
      tone: PALETTE.blue,
    },
    {
      kicker: '让材料真的包含目标现象',
      value: task.material,
      note: `材料必须能制造“${task.label}”所缺的视觉与文字分布。`,
      tone: PALETTE.orange,
    },
    {
      kicker: '调用任务专用工具排除伪样本',
      value: task.check,
      note: '搜索只负责找到候选；OCR、VLM、PDF 与脚本工具负责验证候选是否合格。',
      tone: PALETTE.purple,
    },
    {
      kicker: '工程师检查样例、补约束并决定是否入库',
      value: task.output,
      note: task.evidence,
      tone: PALETTE.green,
    },
  ];
  const current = stageData[stage];

  const draw = (ctx: CanvasRenderingContext2D) => {
    clearDesk(ctx, 560, 372);
    drawSceneLabel(ctx, 'Agentic Data Flow：沿着能力缺口搭建一条数据管线', 280, 25, PALETTE.ink, 'center');

    stageLabels.forEach((label, index) => {
      const x = 62 + index * 145;
      const done = index < stage;
      const active = index === stage;
      if (index < stageLabels.length - 1) {
        drawGuideLine(ctx, x + 19, 68, x + 126, 68, index < stage ? PALETTE.green : PALETTE.axis, index < stage ? 5 : 3);
      }
      ctx.beginPath();
      ctx.arc(x, 68, active ? 20 : 17, 0, Math.PI * 2);
      ctx.fillStyle = done ? PALETTE.green : active ? PALETTE.blue : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = done ? PALETTE.green : active ? PALETTE.blue : PALETTE.axis;
      ctx.lineWidth = active ? 4 : 2;
      ctx.stroke();
      drawSceneLabel(ctx, done ? '✓' : String(index + 1), x, 74, done || active ? '#ffffff' : PALETTE.muted, 'center');
      drawSceneLabel(ctx, label, x, 103, active ? PALETTE.blue : done ? PALETTE.green : PALETTE.muted, 'center');
    });

    roundedRect(ctx, 34, 124, 492, 155, 15);
    ctx.fillStyle = stage === 3 ? '#e6f4ea' : stage === 1 ? '#fff5e5' : stage === 2 ? '#f3edf9' : '#edf4fb';
    ctx.fill();
    ctx.strokeStyle = current.tone;
    ctx.lineWidth = 3;
    ctx.stroke();

    roundedRect(ctx, 54, 144, 112, 28, 14);
    ctx.fillStyle = current.tone;
    ctx.fill();
    drawSceneLabel(ctx, `${stage + 1}/4 · ${stageLabels[stage]}`, 110, 164, '#ffffff', 'center');
    drawWrappedLabel(ctx, current.kicker, 280, 194, 430, current.tone, 'center', 20);
    drawWrappedLabel(ctx, current.value, 280, 228, 428, PALETTE.ink, 'center', 21);
    drawWrappedLabel(ctx, current.note, 280, 260, 430, PALETTE.muted, 'center', 18);

    const chain = ['缺口', '材料', '验证', '可用数据'];
    chain.forEach((label, index) => {
      const x = 64 + index * 143;
      const reached = index <= stage;
      roundedRect(ctx, x - 39, 300, 78, 31, 15);
      ctx.fillStyle = reached ? (index === stage ? '#dbeafe' : '#e3f4ea') : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = reached ? (index === stage ? PALETTE.blue : PALETTE.green) : PALETTE.axis;
      ctx.lineWidth = 2;
      ctx.stroke();
      drawSceneLabel(ctx, label, x, 321, reached ? PALETTE.ink : PALETTE.muted, 'center');
      if (index < chain.length - 1) drawGuideLine(ctx, x + 42, 316, x + 99, 316, index < stage ? PALETTE.green : PALETTE.axis, 3);
    });
    drawSceneLabel(ctx, '不是五个独立 Agent，也不是无监督自动爬取 · Figure 3 · §4.1–4.2', 280, 358, PALETTE.orange, 'center');
  };

  const feedback = [
    `当前先锁定“${task.need}”。如果缺口没有定义清楚，后面的数据量再大也可能无效。`,
    `论文路线不是随机堆数据，而是定向寻找“${task.material}”。`,
    `候选材料还不能直接入库：需要“${task.check}”。`,
    `管线最终产出“${task.output}”。Agent 组织工具链，工程师仍守住高价值质量边界。`,
  ][stage];

  return <div className="paper-widget agentic-widget">
    <PaperCanvas height={372} draw={draw} ariaLabel={`${chapterId}-${moduleId} Agentic Data Flow 逐步搭建器`} />
    <div className="paper-explorer-toolbar" aria-label="选择能力缺口">
      <span className="paper-control-label">先换一种能力缺口</span>
      <div className="paper-task-tabs">
        {(Object.keys(tasks) as TaskId[]).map((id) => <button key={id} className={taskId === id ? 'active' : ''} onClick={() => chooseTask(id)}>{tasks[id].label}</button>)}
      </div>
    </div>
    <div className="paper-stepper" aria-label="搭建数据管线">
      {stageLabels.map((label, index) => <button key={label} className={`${index === stage ? 'active' : ''} ${index < stage ? 'done' : ''}`} onClick={() => setStage(index)}><span>{index < stage ? '✓' : index + 1}</span>{label}</button>)}
    </div>
    <div className="paper-nav-actions">
      <button disabled={stage === 0} onClick={() => setStage((value) => Math.max(0, value - 1))}>← 上一步</button>
      <button className="primary" disabled={stage === 3} onClick={() => setStage((value) => Math.min(3, value + 1))}>下一步 →</button>
    </div>
    <Feedback tone={stage === 3 ? 'green' : 'blue'}>{feedback}</Feedback>
  </div>;
};

export default AgenticDataMap;
