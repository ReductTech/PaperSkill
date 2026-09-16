import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type Choice = { id: string; text: string };
type Question = {
  id: string;
  stem: string;
  choices: Choice[];
  answer: string;
  explain: string;
};

const QUESTIONS: Question[] = [
  {
    id: 'q1',
    stem: 'FlowEdit 相对「编辑-by-反演」最核心的改变是什么？',
    choices: [
      { id: 'a', text: '先把图像精确反演到噪声，再换提示采样' },
      { id: 'b', text: '构造源与目标分布之间的直接 ODE，不经过标准高斯反演' },
      { id: 'c', text: '对图像做测试时反向传播优化以贴合提示' },
      { id: 'd', text: '向采样过程注入注意力图以保结构' },
    ],
    answer: 'b',
    explain: 'FlowEdit 用随机噪声配对上的速度差平均，走更短的直接路径，无需反演。',
  },
  {
    id: 'q2',
    stem: '编辑方向 VΔ 通常如何定义？',
    choices: [
      { id: 'a', text: 'V_src + V_tar' },
      { id: 'b', text: '仅使用目标提示速度 V_tar' },
      { id: 'c', text: 'V_tar − V_src（目标条件速度减去源条件速度）' },
      { id: 'd', text: '噪声图 N_t 本身' },
    ],
    answer: 'c',
    explain: '速度差编码「相对源提示，朝目标提示应改动的方向」。',
  },
  {
    id: 'q3',
    stem: '增大 n_max（更接近总步数 T）通常会怎样？',
    choices: [
      { id: 'a', text: '编辑更弱，结构几乎不动' },
      { id: 'b', text: '编辑路径更完整，编辑通常更强' },
      { id: 'c', text: '自动切换到风格模式 n_min' },
      { id: 'd', text: '必须重新训练流模型' },
    ],
    answer: 'b',
    explain: 'n_max = T 走完整路径、编辑最强；减小 n_max 会跳过早期步、编辑变弱。',
  },
  {
    id: 'q4',
    stem: '为何说 FlowEdit 比「反演 + 特征注入」更易跨模型迁移？',
    choices: [
      { id: 'a', text: '它只查询条件速度场，不依赖特定架构内部表示' },
      { id: 'b', text: '它必须绑定 FLUX 的注意力层' },
      { id: 'c', text: '它需要每换一个模型就微调一遍' },
      { id: 'd', text: '它只能用于 SD3，不能用于其他流模型' },
    ],
    answer: 'a',
    explain: '方法是模型无关的：不注入注意力等内部特征，换骨干更直接。',
  },
  {
    id: 'q5',
    stem: '论文指出 FlowEdit「强结构保持」的一个局限是？',
    choices: [
      { id: 'a', text: '完全无法做局部文字或物体编辑' },
      { id: 'b', text: '在需要大幅改姿态/背景等大区域时可能反而受限' },
      { id: 'c', text: '只能提高 LPIPS、无法提高 CLIP' },
      { id: 'd', text: '必须始终设置 n_avg ≥ 8 才能工作' },
    ],
    answer: 'b',
    explain: '保结构利于精确局部编辑；大幅区域改动时强保持可能成为限制。',
  },
];

/** 章末五题测验小结 */
export const Ch10Quiz: React.FC<WidgetProps> = () => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(() => {
    if (!submitted) return 0;
    return QUESTIONS.reduce((n, q) => n + (answers[q.id] === q.answer ? 1 : 0), 0);
  }, [answers, submitted]);

  const allAnswered = QUESTIONS.every((q) => answers[q.id]);

  const pick = (qid: string, cid: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qid]: cid }));
  };

  const onSubmit = () => {
    if (!allAnswered) return;
    setSubmitted(true);
  };

  const onReset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  let summaryCls = '';
  let summaryText = '请完成全部 5 题后提交。';
  if (submitted) {
    if (score >= 4) {
      summaryCls = 'good';
      summaryText = `得分 ${score}/5：很扎实，已抓住 FlowEdit 的直接路径与适用边界。`;
    } else if (score >= 3) {
      summaryCls = '';
      summaryText = `得分 ${score}/5：大体正确，建议回看错题讲解，再对照第 4–9 章。`;
    } else {
      summaryCls = 'bad';
      summaryText = `得分 ${score}/5：先复习「反演绕路 vs 直接 ODE」与 n_max/n_min，再重测。`;
    }
  } else if (!allAnswered) {
    summaryText = `已作答 ${Object.keys(answers).length}/5，全部选完后可提交。`;
  } else {
    summaryText = '五题已齐，点击「提交测验」查看得分与解析。';
    summaryCls = 'good';
  }

  return (
    <div className="quiz">
      {QUESTIONS.map((q, idx) => {
        const picked = answers[q.id];
        const show = submitted;
        return (
          <div key={q.id} className="quiz-item">
            <div className="quiz-stem">
              <span className="quiz-num">{idx + 1}</span>
              {q.stem}
            </div>
            <div className="quiz-choices">
              {q.choices.map((c) => {
                let cls = 'quiz-choice';
                if (picked === c.id) cls += ' selected';
                if (show && c.id === q.answer) cls += ' correct';
                if (show && picked === c.id && c.id !== q.answer) cls += ' wrong';
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={cls}
                    disabled={submitted}
                    onClick={() => pick(q.id, c.id)}
                  >
                    <span className="quiz-key">{c.id.toUpperCase()}</span>
                    <span>{c.text}</span>
                  </button>
                );
              })}
            </div>
            {show ? <div className="quiz-explain">{q.explain}</div> : null}
          </div>
        );
      })}

      <div className="ctrl quiz-actions">
        <button type="button" className="tiny" disabled={!allAnswered || submitted} onClick={onSubmit}>
          提交测验
        </button>
        <button type="button" className="tiny ghost" onClick={onReset}>
          重测
        </button>
        {submitted ? <span className="val">{score} / 5</span> : null}
      </div>
      <div className={`feedback ${summaryCls}`}>{summaryText}</div>
    </div>
  );
};

export default Ch10Quiz;
