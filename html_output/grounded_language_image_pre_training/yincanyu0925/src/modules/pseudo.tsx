import React, { useState } from 'react';
import { Canvas, C, clear, box, text, exhibit, Feedback, Reset } from './glip-kit';

const scores = [.92, .78, .96, .42];
const truth = [true, true, false, true];
export function Pseudo() {
  const [threshold, setThreshold] = useState(.5);
  const [selected, setSelected] = useState([true, true, true, false]);
  const [audit, setAudit] = useState(false);
  const count = selected.filter(Boolean).length;
  const tp = selected.filter((v, i) => v && truth[i]).length;
  const fp = count - tp;
  const toggle = (index: number) => setSelected(values => values.map((v, i) => i === index ? !v : v));
  const reset = () => { setThreshold(.5); setSelected([true, true, true, false]); setAudit(false); };
  return <div data-exercise="pseudo">
    <p className="exercise-hint">任务：为文字“cup”选择可交给学生模型的伪框。教师分数是人工设置的；其中藏着一个高分错误框和一个低分真目标。</p>
    <Canvas label="四个教师候选框；点击展品或下方按钮决定是否保留" onPoint={(x, y) => { const index = Math.floor((x - 20) / 265); if (x >= 20 && x < 1080 && y > 30 && y < 245) toggle(index); }} draw={c => {
      clear(c); scores.forEach((score, i) => {
        const x = 20 + i * 265, color = audit ? truth[i] ? C.green : C.red : C.blue;
        exhibit(c, x + 125, 125, i === 2 ? 1 : 0);
        c.globalAlpha = selected[i] ? 1 : .22; box(c, x + 40, 40, 175, 190, color); c.globalAlpha = 1;
        text(c, String(i + 1), x + 48, 65, color); text(c, score.toFixed(2), x + 90, 261, C.ink, 23);
        if (selected[i]) { box(c, x + 185, 43, 24, 24, color, true); text(c, '✓', x + 186, 63, 'white', 20); }
      });
    }} />
    <div className="ctrl"><label htmlFor="pseudo-threshold">批量按分数筛选 ≥ {threshold.toFixed(2)}</label><input id="pseudo-threshold" type="range" min="0" max="1" step="0.05" value={threshold} onKeyDown={e => e.stopPropagation()} onChange={e => { const v = Number(e.target.value); setThreshold(v); setSelected(scores.map(s => s >= v)); }} /></div>
    <div className="ctrl">{scores.map((_, i) => <button className={`chip ${selected[i] ? 'selected' : ''}`} aria-pressed={selected[i]} key={i} onClick={() => toggle(i)}>保留候选 {i + 1}</button>)}</div>
    <div className="ctrl"><button className="tiny" onClick={() => setAudit(true)}>查看审校结果</button><Reset onClick={reset} /></div>
    <Feedback kind={audit ? fp === 0 && tp === 3 ? 'good' : 'bad' : ''}>已选 {count} / 4 个候选；拖动门槛会重新批量筛选，按钮可逐个修改。{audit ? ` 当前正确保留=${tp}，错误保留=${fp}，遗漏真目标=${3 - tp}；精确率=${count ? (tp / count).toFixed(2) : '未定义'}，召回率=${(tp / 3).toFixed(2)}。候选 3 是花瓶，0.96 的高分仍然会出错；候选 4 是杯子，低分不代表一定错误。试着留下 1、2、4。` : '先按图像判断，再查看审校结果。'}</Feedback>
    <p className="exercise-hint">论文 §3.3 用教师生成的伪框扩展训练数据。本练习的人工审校用于解释标签噪声，并非声称论文逐张人工复核；这里的精确率、召回率只属于四候选玩具例子。</p>
  </div>;
}
