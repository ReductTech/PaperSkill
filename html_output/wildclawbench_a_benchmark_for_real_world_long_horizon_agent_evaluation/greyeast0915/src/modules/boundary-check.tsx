import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 300;
const claims = [
  { short: '模型已稳定完成真实工作', expected: false, reason: '百分制最高 62.2，不能推出已经解决。' },
  { short: '单轮任务不代表多轮协作', expected: true, reason: '论文明确承认不含澄清与追问。' },
  { short: '英文更高证明语言能力更强', expected: false, reason: '中英文任务子集不同，并非受控实验。' },
  { short: '五任务足以证明评审绝对可靠', expected: false, reason: '人工对照只有五个任务，范围很小。' },
] as const;

export const BoundaryCheck: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [answers, setAnswers] = useState<Array<boolean | null>>([null, null, null, null]);
  const answered = answers.filter(v => v !== null).length;
  const correct = answers.reduce((sum, answer, i) => sum + (answer === claims[i].expected ? 1 : 0), 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#21324a'; ctx.font = '700 22px "Segoe UI", sans-serif'; ctx.fillText('证据围栏', 42, 38);
    claims.forEach((claim, i) => {
      const col = i % 2; const row = Math.floor(i / 2); const x = 42 + col * 510; const y = 64 + row * 106;
      const answer = answers[i]; const ok = answer !== null && answer === claim.expected;
      ctx.fillStyle = answer === null ? '#ffffff' : ok ? '#edf8f2' : '#fff0f2'; ctx.fillRect(x, y, 470, 82);
      ctx.strokeStyle = answer === null ? '#d7deea' : ok ? '#228d5c' : '#c43f52'; ctx.strokeRect(x, y, 470, 82);
      ctx.fillStyle = '#21324a'; ctx.font = '700 17px "Segoe UI", sans-serif'; ctx.fillText(`${i + 1}. ${claim.short}`, x + 16, y + 30);
      ctx.fillStyle = '#68778f'; ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText(answer === null ? '等待判断' : claim.reason, x + 16, y + 58);
      if (answer !== null) { ctx.fillStyle = ok ? '#228d5c' : '#c43f52'; ctx.font = '700 22px "Segoe UI", sans-serif'; ctx.fillText(ok ? '✓' : '×', x + 435, y + 30); }
    });
    ctx.fillStyle = answered === 4 && correct === 4 ? '#228d5c' : '#27446e'; ctx.font = '700 18px "Segoe UI", sans-serif';
    ctx.fillText(`已判断 ${answered}/4 · 正确 ${correct}/4`, 42, 286);
    canvas.classList.add('is-ready');
  }, [answers, answered, correct]);

  const answer = (index: number, value: boolean) => setAnswers(prev => prev.map((v, i) => i === index ? value : v));
  const feedback = answered === 0
    ? '逐条判断：论文直接支持，还是超出了证据覆盖范围？'
    : answered < 4
      ? `已完成 ${answered}/4；继续给剩余说法加上证据边界。`
      : correct === 4
        ? '四项全部正确：结论强度没有越过证据覆盖范围。'
        : `答对 ${correct}/4；注意单轮限制、非受控语言子集与五任务评审样本。`;

  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    <div className="chip-row" aria-label="结论边界判断">
      {claims.map((claim, i) => <span key={claim.short} style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
        <span>{i + 1}</span>
        <button className={`chip ${answers[i] === true ? 'active' : ''} ${answers[i] === true ? (claims[i].expected ? 'answer-correct' : 'answer-wrong') : ''}`} aria-pressed={answers[i] === true} aria-label={`支持说法 ${i + 1}`} onClick={() => answer(i, true)}>支持</button>
        <button className={`chip ${answers[i] === false ? 'active' : ''} ${answers[i] === false ? (!claims[i].expected ? 'answer-correct' : 'answer-wrong') : ''}`} aria-pressed={answers[i] === false} aria-label={`拒绝说法 ${i + 1}`} onClick={() => answer(i, false)}>拒绝</button>
      </span>)}
    </div>
    <div className={`feedback ${answered === 4 ? (correct === 4 ? 'good' : 'bad') : ''}`}>{feedback}</div>
  </div>;
};

export default BoundaryCheck;
