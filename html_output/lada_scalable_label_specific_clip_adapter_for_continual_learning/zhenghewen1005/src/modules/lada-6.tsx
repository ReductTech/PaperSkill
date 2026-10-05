import { useState } from 'react';
import { C, Scene, Chips, Feedback, Readout, Source, drawCard, line, arrow, roundRect, text } from './lada-kit';

const LABELS = ['猫', '狗', '鸟'];
const SEEN_TEXT = [1.8, 1.6, 0.9];
const UNSEEN_TEXT = [0.8, 0.7, 2.1];
const MEMORY = [1.1, 2.4];
const ALPHA = 1;
const STAGES = ['构造文本候选', '统一文本比较', '判定候选范围', '得到最终输出'];

const styles = `
.lada-six { color:#24352d; }
.lada-six-top { display:flex; gap:12px; flex-wrap:wrap; align-items:center; justify-content:space-between; margin:0 0 16px; }
.lada-six-example { font-size:12px; color:#61716b; margin:0; }
.lada-six-stagebar { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:7px; margin:0 0 13px; }
.lada-six-stagebar button { text-align:left; display:flex; gap:8px; align-items:center; color:#68778f; background:#f9fbf5; border:1px solid #dce5d9; border-radius:9px; font:inherit; font-size:12px; min-height:48px; padding:9px 10px; cursor:pointer; }
.lada-six-stagebar button span { font-size:16px; font-weight:700; opacity:.7; }
.lada-six-stagebar button[aria-pressed=true] { background:#edf3e8; color:#27446e; border-color:#76906a; }
.lada-six-stagebar button[data-done=true] { color:#228d5c; }
.lada-six-stagebar button:focus-visible,.lada-six-nav button:focus-visible { outline:3px solid #a3c1e8; outline-offset:3px; }
.lada-six-nav { display:flex; flex-wrap:wrap; gap:9px; margin:14px 0 17px; }
.lada-six-nav button { font:inherit; font-size:13px; border:1px solid #d0dccd; background:#fff; border-radius:9px; color:#27446e; min-height:40px; padding:8px 14px; cursor:pointer; }
.lada-six-nav button.lada-six-next { background:#27446e; color:#fff; border-color:#27446e; }
.lada-six-nav button:disabled { color:#9aa498; border-color:#e1e7dc; background:#f3f6ef; cursor:default; }
.lada-six-key { display:flex; flex-wrap:wrap; justify-content:space-between; gap:9px; font-size:12px; color:#61716b; margin:8px 0 15px; }
.lada-six-key strong { color:#27446e; font-weight:600; }
.lada-six-tablewrap { max-width:100%; overflow-x:auto; margin:16px 0; border:1px solid #dce5d9; border-radius:11px; }
.lada-six-table { width:100%; border-collapse:collapse; font-size:12px; font-variant-numeric:tabular-nums; }
.lada-six-table th { color:#61716b; font-weight:500; background:#f9fbf5; }
.lada-six-table th,.lada-six-table td { padding:11px 10px; text-align:left; border-bottom:1px solid #edf0e9; }
.lada-six-table th:nth-child(n+3),.lada-six-table td:nth-child(n+3) { text-align:right; }
.lada-six-table tr:last-child td { border-bottom:0; }
.lada-six-table tbody tr[data-active=true] { background:#f0f6ea; }
.lada-six-table td strong { color:#27446e; font-weight:700; }
.lada-six-table td small { display:block; font-size:10px; color:#61716b; line-height:1.5; margin-top:2px; }
.lada-six-table td.lada-six-final { color:#228d5c; font-weight:700; }
.lada-six-rule { background:#f8faf4; border:1px solid #e0e7da; border-radius:10px; padding:12px 14px; margin:14px 0; font-size:12px; line-height:1.7; color:#61716b; }
.lada-six-rule strong { color:#27446e; font-weight:600; }
@media(max-width:560px) { .lada-six-stagebar { grid-template-columns:repeat(2,minmax(0,1fr)); } .lada-six-stagebar button { min-height:43px; } .lada-six-table th,.lada-six-table td { padding:9px 6px; } .lada-six-table { font-size:11px; } .lada-six-table th:nth-child(2),.lada-six-table td:nth-child(2) { width:26%; } }
`;

export function LadaSix() {
  const [sample, setSample] = useState<'seen' | 'unseen'>('seen');
  const [step, setStep] = useState(0);
  const isSeen = sample === 'seen';
  const textScores = isSeen ? SEEN_TEXT : UNSEEN_TEXT;
  const textWinner = textScores.indexOf(Math.max(...textScores));
  const fused = SEEN_TEXT.slice(0, 2).map((value, index) => value + ALPHA * MEMORY[index]);
  const finalWinner = isSeen ? fused.indexOf(Math.max(...fused)) : textWinner;
  const finalScore = isSeen ? fused[finalWinner] : textScores[finalWinner];
  const messages = [
    '文本候选包含已见类的缓存向量和未见类的原始 CLIP 向量。猫、狗、鸟同时进入候选集合。',
    `统一文本匹配首先预测“${LABELS[textWinner]}”，该候选的文本分数为 ${textScores[textWinner].toFixed(1)}。`,
    `最高候选“${LABELS[textWinner]}”属于${isSeen ? '已见' : '未见'}类，激活${isSeen ? '文本与 LADA 融合' : '文本直接输出'}路径。`,
    isSeen ? '融合后猫为 2.9 分，狗为 4.0 分，最终输出“狗”。' : '鸟的文本分数为 2.1，沿用统一文本结果，最终输出“鸟”。',
  ];

  return <div className="lada-six" onKeyDown={event => event.stopPropagation()}>
    <style>{styles}</style>
    <div className="lada-six-top">
      <Chips label="输入样本" options={[{ value:'seen', label:'已见类样本' }, { value:'unseen', label:'未见类样本' }]} value={sample} onChange={value => { setSample(value as 'seen' | 'unseen'); setStep(0); }} />
      <p className="lada-six-example">教学示例 · α = 1</p>
    </div>
    <div className="lada-six-stagebar" role="group" aria-label="推理步骤">
      {STAGES.map((label, index) => <button type="button" key={label} aria-pressed={step === index} data-done={step > index} onClick={() => setStep(index)} onKeyDown={event => event.stopPropagation()}><span>0{index + 1}</span>{label}</button>)}
    </div>
    <Scene label={`推理第 ${step + 1} 步，${STAGES[step]}。${messages[step]}`} height={280} draw={(ctx, w, h) => {
      const cardY = h * 0.2;
      const cardSize = Math.min(58, w * 0.14);
      const xPositions = [w * 0.2, w * 0.5, w * 0.8];
      const joint = { x:w * 0.5, y:h * 0.49 };
      const fusion = { x:w * 0.3, y:h * 0.7 };
      const output = { x:w * 0.7, y:h * 0.83 };
      const wire = step >= 1 ? C.blue : C.line;
      roundRect(ctx, w * 0.07, h * 0.035, w * 0.86, h * 0.38, 12, '#fafcf6', C.line);
      xPositions.forEach(x => {
        line(ctx, x, cardY + cardSize * 0.65, x, h * 0.42, wire, 1.4);
        line(ctx, x, h * 0.42, joint.x, joint.y, wire, 1.4);
      });
      const seenColor = step >= 2 && isSeen ? C.green : C.line;
      const directColor = step >= 2 && !isSeen ? C.green : C.line;
      arrow(ctx, joint.x, joint.y + 7, fusion.x, fusion.y - 10, seenColor, 2.4);
      line(ctx, joint.x + 7, joint.y, w * 0.82, joint.y, directColor, 2.4);
      line(ctx, w * 0.82, joint.y, w * 0.82, output.y, directColor, 2.4);
      arrow(ctx, w * 0.82, output.y, output.x + 22, output.y, directColor, 2.4);
      arrow(ctx, fusion.x + 13, fusion.y + 4, output.x - 23, output.y - 8, seenColor, 2.4);
      for (let i = 0; i < 2; i++) roundRect(ctx, w * 0.09 + i * 5, h * 0.7 - 8 + i * 4, Math.min(25, w * 0.07), 18, 3, step >= 2 && isSeen ? '#e1efdb' : '#edf0e9', seenColor);
      arrow(ctx, w * 0.18, fusion.y + 3, fusion.x - 13, fusion.y + 3, seenColor, 2);
      xPositions.forEach((x, index) => {
        if (step >= 1 && index === textWinner) roundRect(ctx, x - cardSize * 0.62, cardY - cardSize * 0.72, cardSize * 1.24, cardSize * 1.43, 7, '#edf2f8', C.blue);
        drawCard(ctx, x, cardY, cardSize, index, index < 2 ? C.blue : C.purple);
      });
      ctx.beginPath(); ctx.arc(joint.x, joint.y, 8, 0, Math.PI * 2); ctx.fillStyle = wire; ctx.fill();
      ctx.beginPath(); ctx.arc(fusion.x, fusion.y, 12, 0, Math.PI * 2); ctx.fillStyle = step >= 2 && isSeen ? '#e1efdb' : '#f1f4ec'; ctx.fill(); ctx.strokeStyle = seenColor; ctx.lineWidth = 2; ctx.stroke();
      line(ctx, fusion.x - 5, fusion.y, fusion.x + 5, fusion.y, seenColor, 1.8);
      line(ctx, fusion.x, fusion.y - 5, fusion.x, fusion.y + 5, seenColor, 1.8);
      text(ctx, '文本比较', w * 0.18, h * 0.51, 12, step >= 1 ? C.blue : C.muted);
      text(ctx, 'LADA', w * 0.15, h * 0.85, 12, step >= 2 && isSeen ? C.green : C.muted);
      if (step === 3) {
        roundRect(ctx, output.x - 27, output.y - 30, 54, 62, 8, '#e6f1de', C.green);
        drawCard(ctx, output.x, output.y, 36, finalWinner, C.green);
      } else {
        ctx.save(); ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(output.x, output.y, 21, 0, Math.PI * 2); ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
      }
    }} />
    <div className="lada-six-key"><span><strong>猫、狗：</strong>已见缓存文本</span><span><strong>鸟：</strong>原始 CLIP 文本</span><span>{step >= 2 ? isSeen ? '当前路径：融合' : '当前路径：直接输出' : '路径等待文本最高候选'}</span></div>
    <div className="lada-six-nav">
      <button type="button" disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))} onKeyDown={event => event.stopPropagation()}>上一步</button>
      <button type="button" className="lada-six-next" disabled={step === 3} onClick={() => setStep(Math.min(3, step + 1))} onKeyDown={event => event.stopPropagation()}>下一步</button>
      <button type="button" onClick={() => setStep(0)} onKeyDown={event => event.stopPropagation()}>重置</button>
    </div>
    <Readout items={[
      { label:'当前步骤', value:`${step + 1} / 4` },
      { label:'统一文本最高候选', value:step >= 1 ? `${LABELS[textWinner]} · ${textScores[textWinner].toFixed(1)}` : '待计算' },
      { label:'候选范围', value:step >= 2 ? isSeen ? '已见类' : '未见类' : '2 已见 + 1 未见' },
      { label:'最终输出', value:step === 3 ? `${LABELS[finalWinner]} · ${finalScore.toFixed(1)}` : '等待输出步骤' },
    ]} />
    <div className="lada-six-tablewrap">
      <table className="lada-six-table" aria-label="候选类别、文本与记忆分数">
        <thead><tr><th scope="col">候选</th><th scope="col">文本来源</th><th scope="col">文本分数</th><th scope="col">LADA</th><th scope="col">最终分数</th></tr></thead>
        <tbody>{LABELS.map((label, index) => <tr key={label} data-active={step === 3 ? index === finalWinner : step >= 1 && index === textWinner}>
          <td><strong>{label}</strong><small>{index < 2 ? '已见' : '未见'}</small></td>
          <td>{index < 2 ? '学习后缓存' : '原始 CLIP'}</td>
          <td>{step >= 1 ? textScores[index].toFixed(1) : '待计算'}</td>
          <td>{step === 3 && isSeen && index < 2 ? MEMORY[index].toFixed(1) : '—'}</td>
          <td className={step === 3 && index === finalWinner ? 'lada-six-final' : ''}>{step === 3 ? isSeen ? index < 2 ? fused[index].toFixed(1) : '—' : index === textWinner ? textScores[index].toFixed(1) : '—' : '待输出'}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <Feedback tone={step === 3 ? 'good' : 'neutral'}>{messages[step]}</Feedback>
    <div className="lada-six-rule">分支条件：<strong>统一文本分数的最高候选所属范围</strong>。已见分支在已见候选上计算文本分数 + α × LADA 分数；此处 α = 1，已见样本得到 [1.8 + 1.1, 1.6 + 2.4] = [2.9, 4.0]。</div>
    <Source page={5} label="Overall Framework 与第 8 页 §4.5 · 推理分支" />
  </div>;
}
