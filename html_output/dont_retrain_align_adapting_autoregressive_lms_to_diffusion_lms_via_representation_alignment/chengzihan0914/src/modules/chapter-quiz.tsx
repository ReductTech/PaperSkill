import { useState } from 'react';
import type { WidgetProps } from './registry';

type VisualKind = 'speed' | 'mask' | 'scatter' | 'ablation' | 'decode' | 'scope';
const CHAPTER_IDS = ['chap-1', 'chap-2', 'chap-3', 'chap-4', 'chap-5', 'chap-6'] as const;
type ChapterId = typeof CHAPTER_IDS[number];

interface QuizQuestion {
  id: string;
  label: '核心概念' | '证据判断' | '看图判断';
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  visual?: VisualKind;
}

const QUIZ_BANK: Record<ChapterId, QuizQuestion[]> = {
  'chap-1': [
    {
      id: '1-map',
      label: '核心概念',
      prompt: 'REPR-ALIGN 认为，AR 转成 DLM 时最值得显式保留的是什么？',
      options: ['预训练形成的隐藏表示结构', 'AR 的左到右生成顺序', '原模型的 KV cache', '所有参数的冻结状态'],
      answer: 0,
      explanation: 'AR 已经学到语言的语义与句法结构。方法用冻结教师锚定这些表示，同时让学生学习双向去噪。',
    },
    {
      id: '1-speed',
      label: '证据判断',
      prompt: '页面中的“最高 4×”应该怎样理解？',
      options: ['任何硬件上推理都快 4×', '论文设置下达到目标水平所需训练步数更少', '模型参数量缩小为四分之一', '每项任务都稳定提高 4 倍'],
      answer: 1,
      explanation: '这是论文实验范围内的训练步数效率结论，不能直接外推成通用墙钟速度或推理速度保证。',
      visual: 'speed',
    },
  ],
  'chap-2': [
    {
      id: '2-mask',
      label: '看图判断',
      prompt: '在包含自身位置的因果注意力中，第 4 个 query token 可以读取哪些位置？',
      options: ['只有第 4 个', '第 1～4 个', '第 4 个之后的所有位置', '序列中的全部位置'],
      answer: 1,
      explanation: '因果 mask 是下三角：位置 i 可以读取自己和左侧位置，但不能读取未来位置。',
      visual: 'mask',
    },
    {
      id: '2-teacher',
      label: '核心概念',
      prompt: '表示对齐训练中，哪一部分保持冻结并提供参考 hidden state？',
      options: ['DLM 学生', 'AR 教师', 'attention mask', '去噪标签'],
      answer: 1,
      explanation: '干净序列经过冻结的 AR 教师产生参考表示；梯度只更新接收遮蔽输入的 DLM 学生。',
    },
    {
      id: '2-valid',
      label: '证据判断',
      prompt: '论文实现把对齐与去噪信号主要施加在哪些位置？',
      options: ['所有 padding 位置', '只在序列第一个位置', '被遮蔽且移位后有效的位置', '只在教师预测错误的位置'],
      answer: 2,
      explanation: '页面采用论文实现边界：在被遮蔽并且 shift 后仍有效的位置计算训练信号，padding 等无效位置不参与。',
    },
    {
      id: '2-cosine',
      label: '证据判断',
      prompt: '余弦对齐直接鼓励 DLM hidden state 与 AR reference 对齐什么？',
      options: ['向量方向', '向量绝对长度', '词元出现次数', '模型参数总量'],
      answer: 0,
      explanation: '余弦相似度经过范数归一化，核心比较是方向。长度变化不是这个损失的主要目标。',
    },
  ],
  'chap-3': [
    {
      id: '3-transfer',
      label: '核心概念',
      prompt: '“表示可以迁移”在本教程里最准确的含义是什么？',
      options: ['AR 与 DLM 的生成步骤完全相同', 'DLM 可以复用 AR 已学到的表示结构并重学解码路径', '任何模型之间都能零训练转换', 'attention mask 不会改变信息流'],
      answer: 1,
      explanation: '共享的是可复用的语言表示结构；因果生成与双向去噪仍是不同的解码机制。',
    },
    {
      id: '3-evidence',
      label: '看图判断',
      prompt: '本章的二维散点融合动画属于哪一类证据？',
      options: ['论文直接报告的真实 t-SNE 坐标', '帮助理解机制的概念投影', '证明所有模态都可迁移的定理', '模型训练日志的逐步回放'],
      answer: 1,
      explanation: '散点和损失曲线是教学示意。论文证据来自下游代码生成结果以及距离、权重和层范围等消融。',
      visual: 'scatter',
    },
  ],
  'chap-4': [
    {
      id: '4-result',
      label: '证据判断',
      prompt: '比较训练效率时，哪种说法符合论文结果的边界？',
      options: ['最高 4× 是所有规模上的固定常数', 'REPR-ALIGN 在论文设置中能用更少训练步数达到可比水平', '结果证明推理延迟一定降低 4×', '提升完全来自参数量减少'],
      answer: 1,
      explanation: '论文比较的是特定模型、数据和评估协议下的适配效率；“最高”本身也表示不同设置的收益会变化。',
      visual: 'speed',
    },
    {
      id: '4-ablation',
      label: '看图判断',
      prompt: 'Table 2 的 HumanEval pass@1 消融支持哪项选择？',
      options: ['L2 优于 cosine，且 λ 越大越好', 'cosine 优于 L2，λ=10 优于 λ=20', 'λ=20 与 λ=10 完全相同', '消融无法比较距离函数'],
      answer: 1,
      explanation: '同一协议下，cosine 为 18.0、L2 为 12.0；λ=10 为 18.0、λ=20 为 11.3。更强的对齐并不总是更好。',
      visual: 'ablation',
    },
  ],
  'chap-5': [
    {
      id: '5-decode',
      label: '看图判断',
      prompt: '哪一项正确描述了两种生成路径？',
      options: ['AR 与 DLM 都只能逐词向右', 'AR 固定从左到右，DLM 可并行更新多个遮蔽位置', 'DLM 不使用上下文', 'AR 每轮都会重新遮蔽已生成词元'],
      answer: 1,
      explanation: 'AR 按因果顺序追加词元；掩码 DLM 使用双向上下文，多轮并行预测并逐渐确定多个位置。',
      visual: 'decode',
    },
    {
      id: '5-boundary',
      label: '证据判断',
      prompt: '训练步数减少能否直接推出 DLM 端到端推理一定更快？',
      options: ['能，两者是同一个指标', '不能，还取决于采样步数、全序列计算和缓存方式', '能，因为 DLM 总是一步生成', '不能，因为 DLM 无法并行'],
      answer: 1,
      explanation: '训练适配效率与推理延迟是不同问题。本章动画说明解码路径，不能替代实际硬件上的延迟测量。',
    },
  ],
  'chap-6': [
    {
      id: '6-scope',
      label: '证据判断',
      prompt: '本文最直接支持的结论范围是什么？',
      options: ['所有语言模型和所有模态', '同架构 Qwen3 到掩码 DLM 的代码生成适配', '任意视觉模型的零样本迁移', '不同架构之间无需训练的转换'],
      answer: 1,
      explanation: '可靠结论应限定在论文验证过的架构、任务和评估协议内；跨架构、跨任务和跨模态仍待检验。',
      visual: 'scope',
    },
    {
      id: '6-open',
      label: '核心概念',
      prompt: '下面哪一项更适合作为后续研究问题？',
      options: ['AR 教师在本文训练中是否冻结', '跨模态模型能否复用同样的跨生成顺序表示对齐', '论文默认 λ 是否为 10', '因果 mask 是否是下三角'],
      answer: 1,
      explanation: '前三项在当前方法或实验中已有明确设定；跨模态能否沿用这一规律仍是开放问题。',
    },
  ],
};

const STORE_PREFIX = 'repr-align-quiz-v1';

function readSession(key: string): unknown {
  if (typeof window === 'undefined') return undefined;
  try {
    const value = window.sessionStorage.getItem(key);
    return value ? JSON.parse(value) as unknown : undefined;
  } catch {
    return undefined;
  }
}

function writeSession(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The quiz still works when storage is unavailable; only revisit persistence is lost.
  }
}

function isChapterId(value: string): value is ChapterId {
  return CHAPTER_IDS.some((chapterId) => chapterId === value);
}

function readBoolean(key: string, fallback: boolean): boolean {
  const value = readSession(key);
  return typeof value === 'boolean' ? value : fallback;
}

function readAnswers(key: string, questions: QuizQuestion[]): Record<string, number> {
  const value = readSession(key);
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};

  const stored = value as Record<string, unknown>;
  return questions.reduce<Record<string, number>>((answers, question) => {
    const answer = stored[question.id];
    if (Number.isInteger(answer) && Number(answer) >= 0 && Number(answer) < question.options.length) {
      answers[question.id] = Number(answer);
    }
    return answers;
  }, {});
}

function readCompletedChapters(key: string): ChapterId[] {
  const value = readSession(key);
  if (!Array.isArray(value)) return [];
  return CHAPTER_IDS.filter((chapterId) => value.includes(chapterId));
}

function pickQuestions(chapterId: ChapterId): QuizQuestion[] {
  const pool = QUIZ_BANK[chapterId];
  if (chapterId !== 'chap-2') return pool.slice(0, 2);

  const key = `${STORE_PREFIX}:${chapterId}:selection`;
  const storedIds = readSession(key);
  const cachedIds = Array.isArray(storedIds)
    ? storedIds.filter((id): id is string => typeof id === 'string')
    : [];
  const cached = cachedIds.flatMap((id) => {
    const question = pool.find((item) => item.id === id);
    return question ? [question] : [];
  });
  if (cached.length === 2 && new Set(cached.map((question) => question.id)).size === 2) {
    return cached;
  }

  const mechanismPool = pool.slice(0, 2);
  const evidencePool = pool.slice(2);
  if (!mechanismPool.length || !evidencePool.length) return pool.slice(0, 2);
  const selected = [
    mechanismPool[Math.floor(Math.random() * mechanismPool.length)],
    evidencePool[Math.floor(Math.random() * evidencePool.length)],
  ];
  writeSession(key, selected.map((question) => question.id));
  return selected;
}

function QuizVisual({ kind }: { kind: VisualKind }) {
  if (kind === 'mask') {
    return (
      <div className="quiz-visual quiz-mask-visual" role="img" aria-label="左侧是因果下三角矩阵，右侧是双向全联通矩阵">
        {(['因果', '双向'] as const).map((mode) => (
          <div key={mode}>
            <span>{mode}</span>
            <div className="quiz-mini-mask">
              {Array.from({ length: 16 }, (_, index) => {
                const row = Math.floor(index / 4);
                const col = index % 4;
                const open = mode === '双向' || col <= row;
                return <i key={index} className={`${open ? 'open' : ''} ${row === 3 ? 'query' : ''}`} />;
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (kind === 'speed') {
    return (
      <div className="quiz-visual quiz-speed-visual" role="img" aria-label="达到同一目标水平时，两种方法需要的训练步数示意">
        <div><span>常规转换</span><i style={{ width: '92%' }} /><b>较多步数</b></div>
        <div><span>REPR-ALIGN</span><i className="good" style={{ width: '32%' }} /><b>较少步数</b></div>
      </div>
    );
  }

  if (kind === 'scatter') {
    return (
      <div className="quiz-visual quiz-scatter-visual" role="img" aria-label="教师与学生表示逐渐重叠的概念示意">
        <svg viewBox="0 0 320 78" aria-hidden="true">
          <title>概念表示投影示意</title>
          {[42, 78, 116, 154, 194, 232].map((x, index) => <circle key={`a${x}`} cx={x} cy={30 + index % 2 * 20} r="7" className="teacher" />)}
          {[54, 92, 128, 166, 205, 244].map((x, index) => <circle key={`b${x}`} cx={x} cy={34 + index % 2 * 18} r="7" className="student" />)}
          <text x="260" y="32">教学示意</text><text x="260" y="52">≠ 原始坐标</text>
        </svg>
      </div>
    );
  }

  if (kind === 'ablation') {
    return (
      <div className="quiz-visual quiz-ablation-visual" role="img" aria-label="Table 2 HumanEval pass at 1 消融值">
        {[['L2', 12], ['cosine', 18], ['λ=10', 18], ['λ=20', 11.3]].map(([label, value]) => (
          <div key={String(label)}><span>{label}</span><i style={{ width: `${Number(value) / 20 * 100}%` }} /><b>{value}</b></div>
        ))}
      </div>
    );
  }

  if (kind === 'decode') {
    return (
      <div className="quiz-visual quiz-decode-visual" role="img" aria-label="AR 逐词生成与 DLM 多位置并行更新示意">
        <div><span>AR</span>{['✓', '✓', '✓', '…', '…'].map((token, index) => <i key={index} className={index < 3 ? 'ar' : ''}>{token}</i>)}</div>
        <div><span>DLM</span>{['·', '✓', '·', '✓', '·'].map((token, index) => <i key={index} className={index % 2 ? 'dlm' : ''}>{token}</i>)}</div>
      </div>
    );
  }

  return (
    <div className="quiz-visual quiz-scope-visual" role="img" aria-label="已验证范围与开放问题">
      <span className="verified">✓ 同架构 Qwen3</span>
      <span className="verified">✓ 代码生成</span>
      <span className="open">? 跨架构</span>
      <span className="open">? 跨模态</span>
    </div>
  );
}

export const ChapterQuiz: React.FC<WidgetProps> = ({ chapterId }) => {
  const chapterKey = isChapterId(chapterId) ? chapterId : null;
  const [questions] = useState(() => chapterKey ? pickQuestions(chapterKey) : []);
  const answerKey = `${STORE_PREFIX}:${chapterId}:answers`;
  const closedKey = `${STORE_PREFIX}:${chapterId}:closed`;
  const completedKey = `${STORE_PREFIX}:completed`;
  const [answers, setAnswers] = useState<Record<string, number>>(() => readAnswers(answerKey, questions));
  const [closed, setClosed] = useState(() => readBoolean(closedKey, false));
  const firstUnanswered = questions.findIndex((question) => answers[question.id] === undefined);
  const [questionIndex, setQuestionIndex] = useState(firstUnanswered < 0 ? 0 : firstUnanswered);
  const [showSummary, setShowSummary] = useState(firstUnanswered < 0 && questions.length > 0);
  const [completed, setCompleted] = useState<ChapterId[]>(() => readCompletedChapters(completedKey));

  if (!chapterKey || !questions.length) return null;

  const question = questions[questionIndex];
  const selected = answers[question.id];
  const answeredCount = questions.filter((item) => answers[item.id] !== undefined).length;
  const score = questions.filter((item) => answers[item.id] === item.answer).length;
  const chapterNumber = CHAPTER_IDS.indexOf(chapterKey) + 1;
  const completedCount = completed.length;

  const setCollapsed = (next: boolean) => {
    setClosed(next);
    writeSession(closedKey, next);
  };

  const choose = (optionIndex: number) => {
    if (selected !== undefined) return;
    const nextAnswers = { ...answers, [question.id]: optionIndex };
    setAnswers(nextAnswers);
    writeSession(answerKey, nextAnswers);
    if (questions.every((item) => nextAnswers[item.id] !== undefined) && !completed.includes(chapterKey)) {
      const nextCompleted = [...completed, chapterKey];
      setCompleted(nextCompleted);
      writeSession(completedKey, nextCompleted);
    }
  };

  const advance = () => {
    const nextUnanswered = questions.findIndex((item) => answers[item.id] === undefined);
    if (nextUnanswered >= 0) {
      setQuestionIndex(nextUnanswered);
    } else {
      setShowSummary(true);
    }
  };

  const retry = () => {
    setAnswers({});
    writeSession(answerKey, {});
    const nextCompleted = completed.filter((id) => id !== chapterKey);
    setCompleted(nextCompleted);
    writeSession(completedKey, nextCompleted);
    setQuestionIndex(0);
    setShowSummary(false);
  };

  if (closed) {
    return (
      <div className="chapter-quiz is-collapsed">
        <button type="button" onClick={() => setCollapsed(false)}>
          {completed.includes(chapterKey) ? `✓ 本章小测 ${score}/${questions.length}` : '📝 本章小测'}
        </button>
      </div>
    );
  }

  return (
    <section className="chapter-quiz" aria-labelledby={`quiz-title-${chapterId}`}>
      <div className="quiz-toolbar">
        <div>
          <span className="quiz-kicker">CHECKPOINT</span>
          <b id={`quiz-title-${chapterId}`}>本章小测 · 约 30 秒</b>
        </div>
        <button type="button" className="quiz-close" onClick={() => setCollapsed(true)} aria-label="收起本章小测" title="暂时不答">×</button>
      </div>

      <div className="quiz-session-progress" aria-label={`本次会话已完成 ${completedCount} 章，共 ${CHAPTER_IDS.length} 章`}>
        <span>本次学习进度</span>
        <div aria-hidden="true">{CHAPTER_IDS.map((id, index) => <i key={id} className={completed.includes(id) ? 'done' : index + 1 === chapterNumber ? 'current' : ''} />)}</div>
        <b>{completedCount}/{CHAPTER_IDS.length}</b>
      </div>

      {showSummary ? (
        <div className="quiz-summary" role="status">
          <span className="quiz-score-ring">{score}<small>/{questions.length}</small></span>
          <div>
            <h5>{score === 2 ? '本章关键点已经掌握' : '已经完成，再看一眼反馈会更牢'}</h5>
            <p>{score === 2 ? '两道题全部答对，可以带着这张知识地图进入下一章。' : '完成比一次全对更重要；你可以立即重答，也可以继续阅读。'}</p>
          </div>
          <button type="button" className="quiz-secondary" onClick={retry}>重新答题</button>
        </div>
      ) : (
        <>
          <div className="quiz-question-meta">
            <span>{question.label}</span>
            <b>{questionIndex + 1} / {questions.length}</b>
          </div>
          <div
            className="quiz-progress-track"
            role="progressbar"
            aria-label="本章小测答题进度"
            aria-valuemin={0}
            aria-valuemax={questions.length}
            aria-valuenow={answeredCount}
          ><i style={{ width: `${answeredCount / questions.length * 100}%` }} /></div>
          {question.visual ? <QuizVisual kind={question.visual} /> : null}
          <h5 className="quiz-prompt">{question.prompt}</h5>
          <div className="quiz-options" role="radiogroup" aria-label={question.prompt}>
            {question.options.map((option, index) => {
              const revealed = selected !== undefined;
              const isCorrect = revealed && index === question.answer;
              const isWrong = revealed && index === selected && index !== question.answer;
              return (
                <button
                  type="button"
                  key={option}
                  className={`${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                  onClick={() => choose(index)}
                  disabled={revealed}
                  role="radio"
                  aria-checked={selected === index}
                >
                  <span>{String.fromCharCode(65 + index)}</span>{option}
                </button>
              );
            })}
          </div>
          {selected !== undefined ? (
            <div className={`quiz-feedback ${selected === question.answer ? 'correct' : 'wrong'}`} role="status">
              <b>{selected === question.answer ? '答对了' : '再校准一下'}</b>
              <span>{question.explanation}</span>
            </div>
          ) : null}
          <div className="quiz-actions">
            <span>不计分，不影响进入下一章</span>
            <button type="button" onClick={advance} disabled={selected === undefined}>
              {answeredCount === questions.length ? '查看结果' : '下一题'} →
            </button>
          </div>
        </>
      )}
    </section>
  );
};
