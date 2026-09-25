import React, { useState } from 'react';
import { Canvas, C, clear, box, text, Feedback } from './glip-kit';

const questions = [
  { title: 'GLIP-L 的 49.8 应该怎样写？', choices: ['COCO 上 49.8% 的图片识别正确', 'COCO2017 val 零样本 box AP 为 49.8', 'LVIS 稀有类别 AP 为 49.8'], answer: 1, evidence: '表 2：49.8 对应 COCO2017 val 的零样本 box AP。AP 汇总检测的精确率—召回率表现，不是逐图分类准确率。' },
  { title: '可以把 61.5 写成普通配置的 COCO val 结果吗？', choices: ['可以，val 与 test-dev 可以互换', '可以，论文最高数值就是统一结果', '不可以；它是特殊训练配置的 test-dev 结果'], answer: 2, evidence: '表 2：61.5 对应使用 GoldG+ 与 COCO 的特殊配置、COCO test-dev；因数据重叠未报告 val。普通 GLIP-L 微调结果为 val 60.8 / test-dev 61.0。' },
  { title: 'Flickr30K 的 87.1 R@1 能证明该任务是零样本吗？', choices: ['不能，GoldG 包含 Flickr30K 数据', '能，因为输入是自由文本', '能，因为 R@1 与 AP 是同一种指标'], answer: 0, evidence: '表 4 与数据说明：GLIP-L 在 Flickr30K test 的 any-box R@1 为 87.1；GoldG 包含该数据集，不能把它称为该任务零样本。R@1 与 COCO box AP 也不能直接排名。' },
  { title: '从 GLIP-T(C) 到加入 Cap4M 的 GLIP-T，哪项结论有证据？', choices: ['所有指标都随数据规模增长而提升', 'COCO AP 下降 0.4，MiniVal 稀有类 APr 上升 3.1', '只要数据更多，任意新类别都能识别'], answer: 1, evidence: '表 2：COCO2017 val AP 从 46.7 到 46.3；表 1：LVIS MiniVal 稀有类 APr 从 17.7 到 20.8。两项变化方向不同，不能推出“所有指标都提升”。' },
];
export function EvidenceQuiz() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null, null]);
  const [checked, setChecked] = useState([false, false, false, false]);
  const q = questions[current], correct = answers[current] === q.answer;
  const done = checked.filter(Boolean).length, score = checked.filter((v, i) => v && answers[i] === questions[i].answer).length;
  return <div data-exercise="evidence-quiz">
    <Canvas height={160} label={`证据挑战进度：已核对 ${done} 题，当前答对 ${score} 题`} draw={c => {
      clear(c, 1080, 160); questions.forEach((_, i) => {
        const color = !checked[i] ? C.env : answers[i] === questions[i].answer ? C.green : C.red;
        box(c, 120 + i * 220, 30, 170, 82, color, checked[i]); text(c, String(i + 1), 193 + i * 220, 83, checked[i] ? 'white' : C.ink, 30);
        if (i === current) { c.fillStyle = C.blue; c.fillRect(120 + i * 220, 126, 170, 5); }
      });
    }} />
    <div className="ctrl">{questions.map((_, i) => <button key={i} className={`chip ${i === current ? 'selected' : ''}`} aria-pressed={i === current} onClick={() => setCurrent(i)}>第 {i + 1} 题{checked[i] ? answers[i] === questions[i].answer ? ' ✓' : ' · 待订正' : ''}</button>)}</div>
    <p><strong>{q.title}</strong></p>
    <div className="exercise-options">{q.choices.map((choice, i) => <button key={`${current}-${i}`} className={`chip ${answers[current] === i ? 'selected' : ''}`} aria-pressed={answers[current] === i} disabled={checked[current]} onClick={() => setAnswers(a => a.map((v, j) => j === current ? i : v))}>{String.fromCharCode(65 + i)}. {choice}</button>)}</div>
    <div className="ctrl"><button className="tiny" disabled={answers[current] === null || checked[current]} onClick={() => setChecked(a => a.map((v, i) => i === current ? true : v))}>核对证据</button><button className="tiny" disabled={!checked[current]} onClick={() => { setChecked(a => a.map((v, i) => i === current ? false : v)); setAnswers(a => a.map((v, i) => i === current ? null : v)); }}>重答本题</button><button className="tiny" onClick={() => setCurrent((current + 1) % 4)}>下一题</button><button className="tiny" onClick={() => { setCurrent(0); setAnswers([null, null, null, null]); setChecked([false, false, false, false]); }}>重新挑战</button></div>
    <Feedback kind={checked[current] ? correct ? 'good' : 'bad' : ''}>{checked[current] ? `${correct ? '判断正确。' : '这项结论不成立。'} ${q.evidence}` : '选出可由论文支持的表述，再核对证据。'} 已核对 {done}/4；当前答对 {score}/4。{done === 4 && score === 4 ? '全部通过！你已经区分了指标、评测集合与训练配置。' : ''}</Feedback>
  </div>;
}
