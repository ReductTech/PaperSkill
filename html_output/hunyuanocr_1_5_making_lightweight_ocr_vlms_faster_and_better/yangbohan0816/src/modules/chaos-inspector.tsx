import React, { useState } from 'react';
import { PaperCanvas, PaperWidgetProps, PALETTE, clearDesk, drawGuideLine, drawSceneLabel, drawTargetMark, Feedback, roundedRect } from './cascade-vs-unified';

const samples = [
  { source: 'evaluete', corrected: 'evaluate', changed: 'e → a', note: '论文 Fig. C.1：常见单词被改成无意义拼写' },
  { source: 'limitetions', corrected: 'limitations', changed: 'e → a', note: '语言先验很容易把眼前字符“修正”回常见词' },
  { source: 'taxt', corrected: 'text', changed: 'a → e', note: 'CHAOS 检查的是所见文字忠实性，不是拼写能力' }
];

export const ChaosInspector: React.FC<PaperWidgetProps> = ({ chapterId, moduleId }) => {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<'faithful'|'corrected'|null>>([null, null, null]);
  const item = samples[index]; const choice = answers[index];
  const answered = answers.filter((answer) => answer !== null).length;
  const hits = answers.filter((answer) => answer === 'faithful').length;
  const exerciseRecall = answered === 0 ? 0 : hits / answered * 100;
  const setChoice = (next: 'faithful'|'corrected') => setAnswers((current) => current.map((answer, i) => i === index ? next : answer));
  const reset = () => { setAnswers([null, null, null]); setIndex(0); };
  const draw = (ctx: CanvasRenderingContext2D) => {
    clearDesk(ctx, 560, 358); drawSceneLabel(ctx, '任务化奖励提升 → CHAOS 造冲突 → 逐页召回检验', 280, 24, PALETTE.ink, 'center');
    answers.forEach((answer, i) => { const x = 190 + i * 90; ctx.beginPath(); ctx.arc(x, 51, 16, 0, Math.PI * 2); ctx.fillStyle = answer === 'faithful' ? PALETTE.green : answer === 'corrected' ? PALETTE.red : i === index ? PALETTE.blue : '#fff'; ctx.fill(); ctx.strokeStyle = i === index ? PALETTE.blue : PALETTE.axis; ctx.lineWidth = 3; ctx.stroke(); drawSceneLabel(ctx, `${i + 1}`, x, 56, answer || i === index ? '#fff' : PALETTE.muted, 'center'); });
    roundedRect(ctx, 70, 78, 420, 70, 10); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = PALETTE.blue; ctx.lineWidth = 3; ctx.stroke(); drawSceneLabel(ctx, '图中实际文字', 132, 105, PALETTE.muted, 'center'); ctx.save(); ctx.fillStyle = PALETTE.blue; ctx.font = '700 30px "Cascadia Code", monospace'; ctx.textAlign = 'center'; ctx.fillText(item.source, 345, 121); ctx.restore();
    const faithfulTone = choice === 'faithful' ? PALETTE.green : PALETTE.axis; const correctedTone = choice === 'corrected' ? PALETTE.red : PALETTE.axis;
    roundedRect(ctx, 42, 183, 214, 78, 10); ctx.fillStyle = choice === 'faithful' ? '#e3f4ea' : '#fff'; ctx.fill(); ctx.strokeStyle = faithfulTone; ctx.lineWidth = 3; ctx.stroke(); drawSceneLabel(ctx, '忠实抄录', 149, 209, PALETTE.green, 'center'); drawSceneLabel(ctx, item.source, 149, 241, PALETTE.ink, 'center');
    roundedRect(ctx, 304, 183, 214, 78, 10); ctx.fillStyle = choice === 'corrected' ? '#fde8ec' : '#fff'; ctx.fill(); ctx.strokeStyle = correctedTone; ctx.lineWidth = 3; ctx.stroke(); drawSceneLabel(ctx, '常识纠错', 411, 209, PALETTE.red, 'center'); drawSceneLabel(ctx, item.corrected, 411, 241, PALETTE.ink, 'center');
    drawGuideLine(ctx, 256, 222, 302, 222, choice === null ? PALETTE.axis : choice === 'faithful' ? PALETTE.green : PALETTE.red, 4); if (choice !== null) drawTargetMark(ctx, choice === 'faithful' ? 149 : 411, 276, choice === 'faithful' ? PALETTE.green : PALETTE.red);
    drawSceneLabel(ctx, `${item.changed} · ${item.note}`, 280, 302, PALETTE.muted, 'center');
    drawSceneLabel(ctx, `练习命中：${hits}/${answered || 0} · 当前等页平均召回：${exerciseRecall.toFixed(1)}%`, 280, 328, answered ? PALETTE.blue : PALETTE.muted, 'center');
    drawSceneLabel(ctx, '正式 Table 11：14.15（领先，但绝对值仍低）', 280, 350, PALETTE.orange, 'center');
  };
  const message = choice === null ? '先选择：OCR 应忠实输出图中无意义拼写，还是按语言常识改词？' : choice === 'faithful' ? '命中：OCR 的首要目标是忠实于视觉证据，即使词语在语义上不合理。' : '未命中：这对普通拼写检查也许合理，但对 OCR 是幻觉——模型覆盖了图中真实字符。';
  return <div className="paper-widget chaos-widget">
    <PaperCanvas height={358} draw={draw} ariaLabel={`${chapterId}-${moduleId} CHAOS 三页视觉证据冲突挑战`} />
    <div className="ctrl" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{samples.map((sample, i) => <button key={sample.source} className={i === index ? 'active' : ''} onClick={() => setIndex(i)}>第 {i + 1} 页</button>)}<button onClick={() => setChoice('faithful')}>按图抄写</button><button onClick={() => setChoice('corrected')}>按常识纠正</button><button onClick={() => setIndex(Math.min(samples.length - 1, index + 1))} disabled={index === samples.length - 1}>下一页</button><button onClick={reset}>重置挑战</button></div>
    <Feedback tone={choice === 'faithful' ? 'green' : choice === 'corrected' ? 'red' : 'blue'}>{message} 练习每页只有一个扰动词；正式 CHAOS 每页选择 2–3 个词并按页面等权平均。</Feedback>
  </div>;
};

export default ChaosInspector;
