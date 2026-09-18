// ============================================================
// 旧版多题型测验组件（自 paperjury_tutorial/src/components/Quiz.tsx 移入）
// 6 种题型：单选 / 多选 / 判断 / 排序（↑↓重排）/ 匹配（点击配对）/ 填空
// QuizBlock 为 widget 适配层：按 chapterId 渲染该章挂载的题目
// ============================================================
import { useState } from 'react';
import type { Quiz } from './legacyTypes';
import { QUIZZES, QUIZ_IDS_BY_CHAPTER } from './legacyData';
import type { WidgetProps } from './registry';

const positionLabel = { opening: '开篇预习', middle: '章节穿插', ending: '结尾综合' };
const typeLabel: Record<string, string> = { single: '单选题', multiple: '多选题', judge: '判断题', sort: '排序题', match: '匹配题', fill: '填空题' };

export function QuizComponent({ quiz }: { quiz: Quiz }) {
  const difficultyStars = '★'.repeat(quiz.difficulty) + '☆'.repeat(3 - quiz.difficulty);
  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <div className="quiz-badges">
          <span className={`quiz-badge ${quiz.position}`}>{positionLabel[quiz.position]}</span>
          <span className="quiz-type-badge">{typeLabel[quiz.type]}</span>
        </div>
        <span className="quiz-difficulty">难度 {difficultyStars}</span>
      </div>
      <div className="quiz-question">{quiz.question}</div>
      {quiz.type === 'single' && <SingleChoice quiz={quiz} />}
      {quiz.type === 'multiple' && <MultipleChoice quiz={quiz} />}
      {quiz.type === 'judge' && <JudgeQuiz quiz={quiz} />}
      {quiz.type === 'sort' && <SortQuiz quiz={quiz} />}
      {quiz.type === 'match' && <MatchQuiz quiz={quiz} />}
      {quiz.type === 'fill' && <FillQuiz quiz={quiz} />}
    </div>
  );
}

/** widget 适配：按章节渲染该章挂载的全部测验题 */
export const QuizBlock: React.FC<WidgetProps> = ({ chapterId }) => {
  const ids = QUIZ_IDS_BY_CHAPTER[chapterId] || [];
  if (ids.length === 0) return null;
  const quizzes = ids
    .map((id) => QUIZZES.find((q) => q.id === id))
    .filter((q): q is Quiz => Boolean(q));
  return (
    <div className="legacy-module">
      <div className="legacy-section-title">📝 测验：检验你的理解</div>
      {quizzes.map((q) => (
        <QuizComponent key={q.id} quiz={q} />
      ))}
    </div>
  );
};

// ===== 单选题 =====
function SingleChoice({ quiz }: { quiz: Quiz }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleSelect = (key: string) => {
    if (selected) return;
    setSelected(key);
    setShowAnalysis(true);
  };

  return (
    <>
      <div className="quiz-options">
        {quiz.options!.map((opt) => {
          let cls = 'quiz-option';
          if (selected) {
            cls += ' disabled';
            if (opt.isCorrect) cls += ' correct';
            else if (opt.key === selected) cls += ' wrong';
          }
          return (
            <div key={opt.key} className={cls} onClick={() => handleSelect(opt.key)}>
              <span className="option-key">{opt.key}.</span>
              <span>{opt.text}</span>
            </div>
          );
        })}
      </div>
      {showAnalysis && <Analysis quiz={quiz} />}
    </>
  );
}

// ===== 多选题 =====
function MultipleChoice({ quiz }: { quiz: Quiz }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const toggle = (key: string) => {
    if (submitted) return;
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const correctKeys = quiz.options!.filter((o) => o.isCorrect).map((o) => o.key);
  const isAllCorrect = submitted && selected.length === correctKeys.length && correctKeys.every((k) => selected.includes(k));

  return (
    <>
      <div className="quiz-hint">（多选题，至少选2个正确答案）</div>
      <div className="quiz-options">
        {quiz.options!.map((opt) => {
          let cls = 'quiz-option';
          if (selected.includes(opt.key)) cls += ' selected';
          if (submitted) {
            cls += ' disabled';
            if (opt.isCorrect) cls += ' correct';
            else if (selected.includes(opt.key)) cls += ' wrong';
          }
          return (
            <div key={opt.key} className={cls} onClick={() => toggle(opt.key)}>
              <span className="option-key">{opt.key}.</span>
              <span>{opt.text}</span>
              {selected.includes(opt.key) && !submitted && <span className="check-mark">✓</span>}
            </div>
          );
        })}
      </div>
      {!submitted && (
        <button className="quiz-submit-btn" disabled={selected.length < 2} onClick={() => setSubmitted(true)}>
          提交答案
        </button>
      )}
      {submitted && (
        <div className={`quiz-result ${isAllCorrect ? 'result-correct' : 'result-wrong'}`}>
          {isAllCorrect ? '✓ 全部正确！' : `✗ 回答不完全正确（正确答案：${correctKeys.join('、')}）`}
        </div>
      )}
      {submitted && <Analysis quiz={quiz} />}
    </>
  );
}

// ===== 判断题 =====
function JudgeQuiz({ quiz }: { quiz: Quiz }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleSelect = (key: string) => {
    if (selected) return;
    setSelected(key);
    setShowAnalysis(true);
  };

  return (
    <>
      <div className="judge-options">
        {quiz.options!.map((opt) => {
          let cls = 'judge-btn';
          if (selected) {
            cls += ' disabled';
            if (opt.isCorrect) cls += ' correct';
            else if (opt.key === selected) cls += ' wrong';
          }
          const icon = opt.key === 'T' ? '✓' : '✗';
          return (
            <div key={opt.key} className={cls} onClick={() => handleSelect(opt.key)}>
              <span className="judge-icon">{icon}</span>
              <span className="judge-text">{opt.text}</span>
            </div>
          );
        })}
      </div>
      {showAnalysis && <Analysis quiz={quiz} />}
    </>
  );
}

// ===== 排序题（↑↓ 按钮重排） =====
function SortQuiz({ quiz }: { quiz: Quiz }) {
  const items = quiz.sortItems!;
  const [order, setOrder] = useState(items.map((i) => i.id));
  const [submitted, setSubmitted] = useState(false);

  const move = (index: number, dir: -1 | 1) => {
    if (submitted) return;
    const newOrder = [...order];
    const target = index + dir;
    if (target < 0 || target >= newOrder.length) return;
    [newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]];
    setOrder(newOrder);
  };

  const correctOrder = items.sort((a, b) => a.correctOrder - b.correctOrder).map((i) => i.id);
  const isCorrect = submitted && order.every((id, i) => id === correctOrder[i]);

  return (
    <>
      <div className="quiz-hint">（点击 ↑↓ 调整顺序，使流程步骤正确排列）</div>
      <div className="sort-list">
        {order.map((id, index) => {
          const item = items.find((i) => i.id === id)!;
          const isItemCorrect = submitted && id === correctOrder[index];
          const isItemWrong = submitted && id !== correctOrder[index];
          return (
            <div key={id} className={`sort-item ${isItemCorrect ? 'correct' : ''} ${isItemWrong ? 'wrong' : ''}`}>
              <span className="sort-num">{index + 1}</span>
              <span className="sort-text">{item.text}</span>
              {!submitted && (
                <span className="sort-controls">
                  <button onClick={() => move(index, -1)} disabled={index === 0}>↑</button>
                  <button onClick={() => move(index, 1)} disabled={index === order.length - 1}>↓</button>
                </span>
              )}
              {submitted && isItemCorrect && <span className="sort-status">✓</span>}
              {submitted && isItemWrong && <span className="sort-status wrong">✗ 应为第{correctOrder.indexOf(id) + 1}步</span>}
            </div>
          );
        })}
      </div>
      {!submitted && (
        <button className="quiz-submit-btn" onClick={() => setSubmitted(true)}>提交排序</button>
      )}
      {submitted && (
        <div className={`quiz-result ${isCorrect ? 'result-correct' : 'result-wrong'}`}>
          {isCorrect ? '✓ 排序完全正确！' : '✗ 排序有误，请看解析'}
        </div>
      )}
      {submitted && <Analysis quiz={quiz} />}
    </>
  );
}

// ===== 匹配题（左右两列点击配对） =====
function MatchQuiz({ quiz }: { quiz: Quiz }) {
  const pairs = quiz.matchPairs!;
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const rightItems = pairs.map((p) => ({ id: p.rightId, text: p.rightText }));
  const usedRights = new Set(Object.values(matches));

  const handleLeft = (leftId: string) => {
    if (submitted || matches[leftId]) return;
    setSelectedLeft(selectedLeft === leftId ? null : leftId);
  };

  const handleRight = (rightId: string) => {
    if (submitted || !selectedLeft || usedRights.has(rightId)) return;
    setMatches((prev) => ({ ...prev, [selectedLeft]: rightId }));
    setSelectedLeft(null);
  };

  const removeMatch = (leftId: string) => {
    if (submitted) return;
    setMatches((prev) => {
      const next = { ...prev };
      delete next[leftId];
      return next;
    });
  };

  const correctCount = pairs.filter((p) => matches[p.leftId] === p.rightId).length;
  const isAllCorrect = submitted && correctCount === pairs.length;

  return (
    <>
      <div className="quiz-hint">（先点击左侧概念，再点击右侧对应定义进行配对）</div>
      <div className="match-container">
        <div className="match-column">
          <div className="match-col-title">概念</div>
          {pairs.map((p) => {
            const matched = matches[p.leftId];
            const isCorrect = submitted && matched === p.rightId;
            const isWrong = submitted && matched && matched !== p.rightId;
            return (
              <div
                key={p.leftId}
                className={`match-item left ${selectedLeft === p.leftId ? 'selected' : ''} ${matched ? 'matched' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                onClick={() => (matched ? removeMatch(p.leftId) : handleLeft(p.leftId))}
              >
                {p.leftText}
                {matched && <span className="match-tag">已配对</span>}
              </div>
            );
          })}
        </div>
        <div className="match-column">
          <div className="match-col-title">定义</div>
          {rightItems.map((r) => {
            const isUsed = usedRights.has(r.id);
            const isCorrect = submitted && pairs.some((p) => p.rightId === r.id && matches[p.leftId] === r.id);
            return (
              <div
                key={r.id}
                className={`match-item right ${isUsed ? 'used' : ''} ${isCorrect ? 'correct' : ''}`}
                onClick={() => handleRight(r.id)}
              >
                {r.text}
              </div>
            );
          })}
        </div>
      </div>
      {!submitted && (
        <button className="quiz-submit-btn" disabled={Object.keys(matches).length < pairs.length} onClick={() => setSubmitted(true)}>
          提交匹配（{Object.keys(matches).length}/{pairs.length}）
        </button>
      )}
      {submitted && (
        <div className={`quiz-result ${isAllCorrect ? 'result-correct' : 'result-wrong'}`}>
          {isAllCorrect ? '✓ 全部配对正确！' : `✗ 正确 ${correctCount}/${pairs.length} 对`}
        </div>
      )}
      {submitted && <Analysis quiz={quiz} />}
    </>
  );
}

// ===== 填空题 =====
function FillQuiz({ quiz }: { quiz: Quiz }) {
  const blanks = quiz.blanks!;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const correctCount = blanks.filter((b) => {
    const ans = (answers[b.id] || '').trim().toLowerCase();
    return ans === b.answer.toLowerCase() || (b.alternatives || []).some((a) => a.toLowerCase() === ans);
  }).length;
  const isAllCorrect = submitted && correctCount === blanks.length;

  return (
    <>
      <div className="fill-list">
        {blanks.map((b, i) => {
          const ans = (answers[b.id] || '').trim().toLowerCase();
          const isCorrect = submitted && (ans === b.answer.toLowerCase() || (b.alternatives || []).some((a) => a.toLowerCase() === ans));
          const isWrong = submitted && !isCorrect;
          return (
            <div key={b.id} className={`fill-item ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}>
              <span className="fill-num">({i + 1})</span>
              <span className="fill-text">{b.prefix}</span>
              <input
                type="text"
                className="fill-input"
                placeholder="输入答案"
                value={answers[b.id] || ''}
                disabled={submitted}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [b.id]: e.target.value }))}
              />
              {b.suffix && <span className="fill-text">{b.suffix}</span>}
              {submitted && isCorrect && <span className="fill-status">✓</span>}
              {submitted && isWrong && <span className="fill-status wrong">✗ 正确答案：{b.answer}</span>}
            </div>
          );
        })}
      </div>
      {!submitted && (
        <button className="quiz-submit-btn" disabled={blanks.some((b) => !answers[b.id])} onClick={() => setSubmitted(true)}>
          提交答案
        </button>
      )}
      {submitted && (
        <div className={`quiz-result ${isAllCorrect ? 'result-correct' : 'result-wrong'}`}>
          {isAllCorrect ? '✓ 全部正确！' : `✗ 正确 ${correctCount}/${blanks.length} 空`}
        </div>
      )}
      {submitted && <Analysis quiz={quiz} />}
    </>
  );
}

// ===== 通用解析区 =====
function Analysis({ quiz }: { quiz: Quiz }) {
  return (
    <div className="quiz-analysis">
      <div className="analysis-label">解析</div>
      <div>{quiz.analysis}</div>
      {quiz.options && (
        <div className="option-breakdown">
          {quiz.options.map((opt) => (
            <div key={opt.key}>
              <strong>{opt.key}.</strong> {opt.isCorrect ? '✓ 正确' : `✗ ${opt.errorType || '错误'}`}
              {opt.explanation && ` — ${opt.explanation}`}
            </div>
          ))}
        </div>
      )}
      <div className="quiz-anchor">论文依据：{quiz.paperAnchor}</div>
    </div>
  );
}
