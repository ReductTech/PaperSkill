import { useState } from 'react';
import './styles/reliability.css';

const failures = [
  { label: '语义错误', count: 7, detail: '物体、属性、空间关系或组合不符合要求。', kind: 'semantic' },
  { label: '物理错误', count: 4, detail: '生成画面出现不合理的物理现象。', kind: 'physical' },
  { label: '几何错误', count: 2, detail: '物体形状、比例或尺寸异常。', kind: 'geometry' },
] as const;

export function FailureStatistics() {
  return <div className="reliability-statistics">
    <p>生成画面可能偏离请求。论文附录 F 在 VCR-Bench 的 127 次生成调用中识别出 13 次失败。</p>
    <figure className="reliability-figure">
      <div className="reliability-chart">
        <div className="reliability-chart-caption">13 次已识别失败的内部组成</div>
        <div className="reliability-bar" role="img" aria-label="13 次失败中，语义错误 7 次，物理错误 4 次，几何错误 2 次">
          {failures.map(item => <span key={item.kind} className={`reliability-segment ${item.kind}`} style={{ flex: item.count }}>{item.count}</span>)}
        </div>
        <ul className="reliability-legend">
          {failures.map(item => <li key={item.kind}><span className={`reliability-swatch ${item.kind}`} aria-hidden="true"/><span><strong>{item.label} · {item.count} 次</strong><small>{item.detail}</small></span></li>)}
        </ul>
      </div>
      <div className="reliability-total" aria-label="127 次生成调用中有 13 次失败，约百分之十点二">
        <strong>13 / 127</strong><span>生成调用失败</span><b>10.2%</b>
      </div>
    </figure>
  </div>;
}

export function LimitsPanel() {
  return <div className="reliability-limits">
    <p><strong>工具依赖。</strong>检索结果取决于视频检索工具；假设画面的质量取决于图像生成模型。模型主动调用工具，不保证返回的画面可靠。</p>
    <p><strong>计算与延迟。</strong>检索和生成需要额外执行，可能增加推理延迟与计算量；最终成本还取决于输入帧预算和比较条件。附录 F 的成本比较采用不同帧数，不能据此推断每次调用的固定开销。</p>
    <p><strong>真实与假设的边界。</strong>Retrieve 返回原视频画面，Generate 构造假设画面。生成结果可辅助反事实推理，却不能作为真实发生过的视频证据。附录 F 的反事实子集结果支持生成分支在该设置下有益，不能推广为所有场景都可靠。</p>
    <p className="reliability-conclusion">主动观察增加了模型获取证据的能力，但新增视觉信息的可靠性仍然需要判断。</p>
  </div>;
}

const quiz = [
  {
    question: '固定采样为什么可能遗漏关键证据？',
    options: ['它只给出预先选定的帧，推理中才发现的关键时刻可能不在其中。', '它会删除原视频。', '它只能输入文字。', '它一定比检索画面更模糊。'],
    correct: 0,
    why: '固定帧在推理前确定，无法按后来发现的证据缺口补看原视频。',
  },
  {
    question: 'Retrieve 和 Generate 的区别是什么？',
    options: ['两者都只返回原视频帧。', 'Retrieve 找原视频中的画面；Generate 合成假设画面。', 'Retrieve 合成反事实；Generate 搜索原视频。', '两者都能证明假设真的发生过。'],
    correct: 1,
    why: '生成分支先检索条件帧，再结合生成查询合成画面；合成结果不是原视频记录。',
  },
  {
    question: '新视觉帧如何进入交错式 CoT？',
    options: ['工具返回帧后，把它加入已有推理轨迹，模型再继续推理。', '先结束回答，再在网页上展示帧。', '用新帧替换全部文字推理。', '只在训练前离线加入，推理时不能调用。'],
    correct: 0,
    why: '模型发出视觉调用，工具返回新帧；已有推理和新帧共同成为后续推理的上下文。',
  },
  {
    question: 'SFT 中哪些输出属于学习目标？',
    options: ['只训练最终答案。', '训练返回图像的像素，不训练工具查询。', '对整条输出轨迹的文字及工具查询 token 计算损失，排除返回图像帧。', '只训练检索器，不训练视觉语言模型。'],
    correct: 2,
    why: '论文对 rollout 中的文字与检索／生成查询计算 token 级损失，返回帧不计入该损失。',
  },
  {
    question: '论文实验结果能证明什么，不能证明什么？',
    options: ['证明每张生成帧都准确。', '证明主动观察在论文五项基准设置下有收益，但不保证每次生成可靠或所有场景都提升。', '证明工具调用没有任何计算成本。', '证明所有提升只来自 Generate。'],
    correct: 1,
    why: '五项主基准显示相对同一基座的提升；附录仍记录生成失败，且反事实与成本结论受实验设置限制。',
  },
] as const;

export function FinalQuiz() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const finished = index === quiz.length;
  const item = quiz[index];
  const score = answers.filter((answer, questionIndex) => answer === quiz[questionIndex].correct).length;

  function restart() { setIndex(0); setSelected(null); setSubmitted(false); setAnswers([]); }
  function next() { setIndex(index + 1); setSelected(null); setSubmitted(false); }

  return <div className="reliability-quiz">
    {finished ? <div className="reliability-result" role="status">
      <h3>测验完成</h3>
      <p className="reliability-score">答对 {score} / {quiz.length} 题</p>
      <p>Act2See 的创新是让模型在推理过程中主动决定何时检索真实证据、何时生成假设画面，并利用新增视觉信息继续推理。</p>
      <button className="button-primary" type="button" onClick={restart}>重新测验</button>
    </div> : <>
      <div className="reliability-quiz-progress">第 {index + 1} / {quiz.length} 题</div>
      <fieldset>
        <legend>{item.question}</legend>
        <div className="reliability-options">
          {item.options.map((option, optionIndex) => <button key={option} type="button" aria-pressed={selected === optionIndex} className={selected === optionIndex ? 'selected' : ''} disabled={submitted} onClick={() => setSelected(optionIndex)}><span aria-hidden="true">{String.fromCharCode(65 + optionIndex)}.</span>{option}</button>)}
        </div>
      </fieldset>
      {submitted && selected !== null && <p className={`reliability-feedback ${selected === item.correct ? 'correct' : 'incorrect'}`} role="status"><strong>{selected === item.correct ? '答对了。' : `答错了。正确答案是 ${String.fromCharCode(65 + item.correct)}。`}</strong> {item.why}</p>}
      <div className="reliability-quiz-actions">
        {!submitted ? <button className="button-primary" type="button" disabled={selected === null} onClick={() => { if (selected !== null) { setAnswers([...answers, selected]); setSubmitted(true); } }}>提交答案</button> : <button className="button-primary" type="button" onClick={next}>{index === quiz.length - 1 ? '查看成绩' : '下一题'}</button>}
      </div>
    </>}
  </div>;
}
