import React, { useState } from 'react';
import { PaperCanvas, PaperWidgetProps, PALETTE, clearDesk, drawGuideLine, drawSceneLabel, drawTargetMark, Feedback, roundedRect } from './cascade-vs-unified';

type ScenarioId = 'text' | 'formula' | 'table';

const scenarios: Record<ScenarioId, { label: string; tokens: string[]; target: string; mismatch: number; tendency: string }> = {
  text: {
    label: '普通文本',
    tokens: ['模型', '会', '忠实', '识别', '页面', '中的', '语意', '结构', '并', '输出', '完整', '结果', '。', '继续', '生成', '结束'],
    target: '语义',
    mismatch: 6,
    tendency: 'Table 5：vLLM 文本页加速 1.81×，三类中相对最低',
  },
  formula: {
    label: '公式',
    tokens: ['\\begin', '{aligned}', 'x', '&=', 'a', '+', 'b', '\\\\', 'y', '&=', 'c', '+', 'd', '\\end', '{aligned}', '。'],
    target: '\\frac',
    mismatch: 8,
    tendency: 'Table 5：vLLM 公式页加速 2.06×',
  },
  table: {
    label: 'HTML 表格',
    tokens: ['<table>', '<tr>', '<td>', '销售额', '</td>', '<td>', '128', '</td>', '</tr>', '<tr>', '<td>', '利润', '</td>', '<td>', '36', '</td>'],
    target: '</table>',
    mismatch: 9,
    tendency: 'Table 5：vLLM 表格页加速 2.39×，有效接受长度 10.45',
  },
};

export const DflashStepper: React.FC<PaperWidgetProps> = ({ chapterId, moduleId }) => {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('table');
  const [choice, setChoice] = useState<number | null>(null);
  const scenario = scenarios[scenarioId];
  const correct = choice === scenario.mismatch;

  const chooseScenario = (id: ScenarioId) => {
    setScenarioId(id);
    setChoice(null);
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    clearDesk(ctx, 560, 330);
    drawSceneLabel(ctx, '你是目标模型：候选从哪里开始分歧？', 280, 24, PALETTE.ink, 'center');
    drawSceneLabel(ctx, 'DFlash 一次并行提出 B=16 的候选块', 280, 47, PALETTE.muted, 'center');

    scenario.tokens.forEach((token, index) => {
      const x = 20 + (index % 8) * 67;
      const y = 68 + Math.floor(index / 8) * 64;
      const revealed = choice !== null;
      const accepted = revealed && index < scenario.mismatch;
      const mismatch = revealed && index === scenario.mismatch;
      const selectedWrong = revealed && index === choice && !correct;
      const tone = accepted ? PALETTE.green : mismatch ? PALETTE.red : selectedWrong ? PALETTE.orange : PALETTE.blue;
      roundedRect(ctx, x, y, 56, 44, 7);
      ctx.fillStyle = accepted ? '#e3f4ea' : mismatch ? '#fde8ec' : selectedWrong ? '#fff0d7' : '#edf1f6'; ctx.fill();
      ctx.strokeStyle = tone; ctx.lineWidth = mismatch || selectedWrong ? 3 : 2; ctx.stroke();
      ctx.save(); ctx.font = '600 10px "Cascadia Code", monospace'; ctx.fillStyle = tone; ctx.textAlign = 'center';
      ctx.fillText(token.length > 9 ? `${token.slice(0, 8)}…` : token, x + 28, y + 26); ctx.restore();
      drawSceneLabel(ctx, `${index + 1}`, x + 28, y + 58, PALETTE.muted, 'center');
    });

    const acceptedLength = choice === null ? 0 : scenario.mismatch;
    drawGuideLine(ctx, 42, 220, 518, 220, PALETTE.axis, 5);
    const markerX = 42 + 476 * acceptedLength / 16;
    if (choice !== null) {
      drawGuideLine(ctx, 42, 220, markerX, 220, PALETTE.green, 6);
      drawTargetMark(ctx, markerX, 220, PALETTE.green);
    }
    drawSceneLabel(ctx, `连续接受长度：${acceptedLength} / 16`, 280, 251, choice === null ? PALETTE.blue : PALETTE.green, 'center');
    drawSceneLabel(ctx, choice === null ? '先点击下方某个 token，指出你认为的首个分歧' : `目标 token 应为“${scenario.target}”；随后从分歧处继续`, 280, 279, choice === null ? PALETTE.blue : PALETTE.ink, 'center');
    drawSceneLabel(ctx, scenario.tendency, 280, 311, PALETTE.orange, 'center');
  };

  const feedback = choice === null
    ? '草稿可以一次提出整个块，但必须由目标模型找出首个分歧；请点击一个候选 token。'
    : correct
      ? `正确：前 ${scenario.mismatch} 个候选构成最长有效前缀；第 ${scenario.mismatch + 1} 个 token 分歧，不能再继续接受。`
      : choice < scenario.mismatch
        ? `你停得太早了：第 ${choice + 1} 个候选仍与目标一致，会白白放弃可接受前缀。`
        : `不能跳过更早的分歧：第 ${scenario.mismatch + 1} 个候选已经与目标不同，后面的 token 即使碰巧相同也不能越过它。`;
  return <div className="paper-widget dflash-widget">
    <PaperCanvas height={330} draw={draw} ariaLabel={`${chapterId}-${moduleId} DFlash 最长有效前缀判断`} />
    <div className="ctrl" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {(Object.keys(scenarios) as ScenarioId[]).map((id) => <button key={id} className={scenarioId === id ? 'active' : ''} onClick={() => chooseScenario(id)}>{scenarios[id].label}</button>)}
      <button onClick={() => setChoice(null)}>重置判断</button>
    </div>
    <div className="ctrl" aria-label="选择第一个分歧 token" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {scenario.tokens.map((token, index) => <button key={`${scenarioId}-${index}`} className={choice === index ? 'active' : ''} onClick={() => setChoice(index)} title={`第 ${index + 1} 个候选：${token}`}>{index + 1}</button>)}
    </div>
    <Feedback tone={choice === null ? 'blue' : correct ? 'green' : 'red'}>{feedback} 本交互的候选序列是教学示意，论文正式结果见 Table 2、4、5。</Feedback>
  </div>;
};

export default DflashStepper;
