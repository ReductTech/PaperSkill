import { createContext, useContext, useState, type ReactNode } from 'react';
import { CupScene } from './EvidenceGapScene';
import './styles/evidence-decision.css';

type Scenario = 'enough' | 'missing' | 'hypothetical';
type Action = 'answer' | 'retrieve' | 'generate';

type DecisionState = {
  scenario: Scenario;
  action: Action | null;
  chooseScenario: (scenario: Scenario) => void;
  chooseAction: (action: Action) => void;
};

const DecisionContext = createContext<DecisionState | null>(null);

const scenarios: { id: Scenario; tab: string; question: string; correct: Action }[] = [
  { id: 'enough', tab: 'A · 已有证据', question: '杯子最初放在哪里？', correct: 'answer' },
  { id: 'missing', tab: 'B · 缺少动作', question: '杯子是什么时候被拿起来的？', correct: 'retrieve' },
  { id: 'hypothetical', tab: 'C · 假设情境', question: '如果杯子没有被拿起，画面会怎样？', correct: 'generate' },
];

const feedback: Record<Scenario, Record<Action, string>> = {
  enough: {
    answer: '0 秒画面已经显示：杯子最初在桌面左侧。',
    retrieve: '0 秒已有杯子的初始位置，无需再从原视频补帧。',
    generate: '初始位置是真实视频事实，假设画面不能替代已有证据。',
  },
  missing: {
    answer: '2 秒杯子还在左侧，3 秒已到右侧；现有帧没有拍到拿起时刻。',
    retrieve: '补看原视频 2.3 秒的真实帧，可以看到杯子正被拿起。',
    generate: '拿起动作真实发生过，应回原视频取证，不能用生成画面代替。',
  },
  hypothetical: {
    answer: '已有画面只显示实际发生的移动，不能直接看到“没拿起”的结果。',
    retrieve: '原视频中没有“杯子未被拿起”的分支，检索无法找到该画面。',
    generate: '假设画面可辅助想象杯子仍在左侧，但它不是真实视频证据。',
  },
};

export function EvidenceDecisionProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState<Scenario>('enough');
  const [action, setAction] = useState<Action | null>(null);

  function chooseScenario(next: Scenario) {
    setScenario(next);
    setAction(null);
  }

  return <DecisionContext.Provider value={{ scenario, action, chooseScenario, chooseAction: setAction }}>
    {children}
  </DecisionContext.Provider>;
}

function useDecision() {
  const state = useContext(DecisionContext);
  if (!state) throw new Error('Evidence decision sections need their provider');
  return state;
}

function VideoFrame({ time, label, marked = false, variant = 'sample' }: {
  time: number;
  label: string;
  marked?: boolean;
  variant?: 'sample' | 'retrieved' | 'hypothesis';
}) {
  const imageDescription = variant === 'hypothesis'
    ? '假设画面：假如没有拿起杯子，3 秒时杯子仍在桌面左侧。并非原视频证据。'
    : variant === 'retrieved'
      ? '从原视频补取的 2.3 秒画面：杯子正在被拿起。'
      : label;

  return <figure className={`ed-frame ed-frame--${variant}`}>
    <div className="ed-image" role="img" aria-label={imageDescription}>
      <span className="ed-scene-svg" aria-hidden="true"><CupScene time={time}/></span>
      {marked && <svg className="ed-marker" viewBox="0 0 360 220" aria-hidden="true">
        <circle cx="86" cy="130" r="38" fill="rgba(34,141,92,.12)" stroke="#228d5c" strokeWidth="4" strokeDasharray="8 5"/>
        <path d="M85 75v15" stroke="#228d5c" strokeWidth="4" strokeLinecap="round"/>
      </svg>}
      {variant !== 'sample' && <span className="ed-image-tag">{variant === 'retrieved' ? '原视频补帧' : '假设画面'}</span>}
    </div>
    <figcaption>{label}</figcaption>
  </figure>;
}

function MissingFrame({ hypothesis = false }: { hypothesis?: boolean }) {
  return <div className="ed-frame ed-frame--empty" role="img" aria-label={hypothesis ? '尚无未发生情境的假设画面' : '拿起动作时刻尚无采样画面'}>
    <div className="ed-image ed-empty-image"><span className="ed-empty-line" aria-hidden="true"/><strong aria-hidden="true">?</strong></div>
    <span className="ed-empty-caption">{hypothesis ? '未发生的情境' : '2–3 秒之间'}</span>
  </div>;
}

export function EvidenceDecisionEvidence() {
  const { scenario, action, chooseScenario } = useDecision();
  const current = scenarios.find(item => item.id === scenario)!;

  return <div className="ed-evidence">
    <p className="ed-intro">同一段视频，面对不同问题，模型需要的画面可能不同。</p>
    <div className="ed-scenarios" role="group" aria-label="切换教学情境">
      {scenarios.map(item => <button key={item.id} type="button" aria-pressed={scenario === item.id} className={scenario === item.id ? 'is-active' : ''} onClick={() => chooseScenario(item.id)}>{item.tab}</button>)}
    </div>
    <p className="ed-question"><span>当前问题</span><strong>{current.question}</strong></p>
    <div className="ed-visual" aria-label="当前视频证据与行动后的画面变化">
      <div className="ed-visual-head"><strong>当前视频证据</strong><span>杯子场景 · 教学示意</span></div>
      <div className={`ed-frames ${action !== null && scenario !== 'enough' ? 'has-extra' : ''}`}>
        <VideoFrame time={0} label="0 秒 · 初始位置" marked={scenario === 'enough' && action !== null}/>
        <VideoFrame time={2} label="2 秒 · 仍在左侧"/>
        {scenario === 'missing' && action !== null && (action === 'retrieve'
          ? <VideoFrame time={2.3} label="2.3 秒 · 正在拿起" variant="retrieved"/>
          : <MissingFrame/>)}
        <VideoFrame time={3} label="3 秒 · 已到右侧"/>
        {scenario === 'hypothetical' && action !== null && (action === 'generate'
          ? <VideoFrame time={0} label="假设 3 秒 · 仍在左侧" variant="hypothesis"/>
          : <MissingFrame hypothesis/>)}
      </div>
    </div>
  </div>;
}

export function EvidenceDecisionChoice() {
  const { scenario, action, chooseAction } = useDecision();
  const correct = scenarios.find(item => item.id === scenario)!.correct;
  const actions: { id: Action; label: string }[] = [
    { id: 'answer', label: '直接回答' },
    { id: 'retrieve', label: '检索真实帧' },
    { id: 'generate', label: '生成假设帧' },
  ];

  return <div className="ed-decision">
    <div className="ed-actions" role="group" aria-label="选择下一步行动">
      {actions.map(item => <button key={item.id} type="button" aria-pressed={action === item.id} className={action === item.id ? 'is-active' : ''} onClick={() => chooseAction(item.id)}>{item.label}</button>)}
    </div>
    <div className="ed-result" role="status" aria-live="polite">
      {action && <p className={action === correct ? 'is-correct' : 'is-incorrect'}><strong>{action === correct ? '适合当前问题' : '这一步不合适'}</strong><span>{feedback[scenario][action]}</span></p>}
    </div>
  </div>;
}
