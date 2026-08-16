import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type Tone = 'bad' | 'mid' | 'good' | 'warn';

const toneClass: Record<Tone, string> = {
  bad: 'bad',
  mid: '',
  good: 'good',
  warn: 'warn',
};

function Feedback({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <div className={`feedback ${toneClass[tone]}`}>{children}</div>;
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button className={`chip ${active ? 'active' : ''}`} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function useAutoIndex(length: number, delay = 2000) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return undefined;
    const timer = window.setInterval(() => {
      setIndex((cur) => (cur + 1) % length);
    }, delay);
    return () => window.clearInterval(timer);
  }, [delay, length, paused]);

  return { index, setIndex, paused, setPaused };
}

function PageStack({ risk = 0 }: { risk?: number }) {
  return (
    <div className="paper-stack" aria-hidden="true">
      <div className="paper-sheet rear" />
      <div className="paper-sheet mid" />
      <div className="paper-sheet front">
        <span className={risk > 1 ? 'redline on' : 'redline'} />
        <span className={risk > 2 ? 'redline on wide' : 'redline wide'} />
        <span className={risk > 0 ? 'claim-dot on' : 'claim-dot'} />
      </div>
    </div>
  );
}

export const HeroOld: React.FC<WidgetProps> = () => {
  return (
    <div className="hero-widget">
      <PageStack risk={3} />
      <div className="hero-badges">
        <span className="risk">引用错配</span>
        <span className="risk">数字漂移</span>
        <span className="risk">主张越界</span>
      </div>
    </div>
  );
};

export const HeroNew: React.FC<WidgetProps> = () => {
  return (
    <div className="hero-widget">
      <div className="triad">
        <span className="node exec">工作流</span>
        <span className="node review">互审</span>
        <span className="node evidence">证据审计</span>
        <span className="link l1" />
        <span className="link l2" />
        <span className="link l3" />
      </div>
      <div className="hero-badges">
        <span>异构互审</span>
        <span>模块化流程</span>
        <span>证据约束</span>
      </div>
    </div>
  );
};

export const AnalogyNotebook: React.FC<WidgetProps> = ({ chapterId }) => {
  const index = Number((chapterId || '').replace(/\D/g, '')) || 1;
  const labels = ['标红', '约束', '分层', '流转', '核验', '归档'];
  return (
    <div className="analogy-mini" aria-label="科研审查桌">
      <div className={`mini-pen p${index}`}>
        <span />
      </div>
      <div className="mini-page">
        <i />
        <i />
        <b>{labels[(index - 1) % labels.length]}</b>
      </div>
    </div>
  );
};

const riskCases = {
  citation: {
    title: '引用错配',
    text: '引用看起来存在，但不一定真的支撑正文里的那句话。',
    risk: 2,
  },
  result: {
    title: '实验失真',
    text: '结果文件、指标口径或实验范围一旦错位，论文叙事仍可能显得很顺。',
    risk: 3,
  },
  claim: {
    title: '主张越界',
    text: '只在一个设置里成立的发现，被写成更大范围的结论。',
    risk: 4,
  },
};

export const RiskLens: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<keyof typeof riskCases>('citation');
  const cur = riskCases[mode];
  return (
    <div className="aris-tool">
      <div className="aris-split">
        <div className="aris-scene">
          <PageStack risk={cur.risk} />
          <div className="risk-meter">
            <span style={{ width: `${cur.risk * 22}%` }} />
          </div>
        </div>
        <div className="aris-detail">
          <h4>{cur.title}</h4>
          <p>{cur.text}</p>
          <div className="ctrl">
            <Chip active={mode === 'citation'} onClick={() => setMode('citation')}>
              引用错配
            </Chip>
            <Chip active={mode === 'result'} onClick={() => setMode('result')}>
              实验失真
            </Chip>
            <Chip active={mode === 'claim'} onClick={() => setMode('claim')}>
              主张越界
            </Chip>
          </div>
        </div>
      </div>
      <Feedback tone="bad">页面越完整、证据越薄弱，风险反而越隐蔽。</Feedback>
    </div>
  );
};

const mechanisms = {
  review: {
    title: '异构多智能体互审',
    short: '减少共享盲点',
    text: '不同模型和角色互相审查，不让同一个模型自己给自己兜底。',
    tags: ['多模型审查', '独立判断', '暴露盲点'],
    tone: 'good' as Tone,
  },
  workflow: {
    title: '模块化科研工作流',
    short: '留下可检产物',
    text: '把科研拆成想法、实验、审查、写作、回复，每一步都有可检查产物。',
    tags: ['阶段拆分', '可检产物', '路径追踪'],
    tone: 'mid' as Tone,
  },
  audit: {
    title: '证据到主张审计',
    short: '把话拉回证据',
    text: '论文里的主张必须回到证据，不能只靠文字流畅放行。',
    tags: ['主张核对', '证据约束', '弱化删除'],
    tone: 'warn' as Tone,
  },
};

export const HarnessTriad: React.FC<WidgetProps> = () => {
  const [part, setPart] = useState<keyof typeof mechanisms>('review');
  const cur = mechanisms[part];
  return (
    <div className="aris-tool">
      <div className="mechanism-layout">
        <div className="mechanism-board">
          {Object.entries(mechanisms).map(([key, item], idx) => (
            <button
              key={key}
              className={`mechanism-card m${idx + 1} ${part === key ? 'active' : ''}`}
              onClick={() => setPart(key as keyof typeof mechanisms)}
              type="button"
            >
              <span>{idx + 1}</span>
              <strong>{item.title}</strong>
              <em>{item.short}</em>
            </button>
          ))}
          <div className={`mechanism-line l-review ${part === 'review' ? 'active' : ''}`} />
          <div className={`mechanism-line l-workflow ${part === 'workflow' ? 'active' : ''}`} />
          <div className={`mechanism-line l-audit ${part === 'audit' ? 'active' : ''}`} />
          <div className="mechanism-center">ARIS</div>
        </div>
        <div className="mechanism-detail">
          <h4>{cur.title}</h4>
          <p>{cur.text}</p>
          <div className="tag-list">
            {cur.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
      <Feedback tone={cur.tone}>ARIS 不是训练科研大模型，而是搭建自主科研框架。</Feedback>
    </div>
  );
};

const reviewSteps = [
  {
    self: '生成草稿',
    cross: '生成产物',
    selfRisk: 25,
    crossTrace: 25,
  },
  {
    self: '自己审查',
    cross: '异构 reviewer 审查',
    selfRisk: 50,
    crossTrace: 50,
  },
  {
    self: '自己修改',
    cross: '追问 evidence',
    selfRisk: 75,
    crossTrace: 75,
  },
  {
    self: '共享盲点保留',
    cross: '修改 claim',
    selfRisk: 100,
    crossTrace: 100,
  },
];

export const ReviewModeSwitch: React.FC<WidgetProps> = () => {
  const { index, setIndex } = useAutoIndex(reviewSteps.length, 1500);
  const cur = reviewSteps[index];

  return (
    <div className="aris-tool">
      <div className="review-flow">
        <div className="review-lane self">
          <div className="lane-head">
            <strong>同模型自审</strong>
            <span>容易循环确认自己</span>
          </div>
          <div className="flow-nodes">
            {reviewSteps.map((step, i) => (
              <button
                key={step.self}
                className={`flow-node ${i === index ? 'active' : ''} ${i < index ? 'done' : ''}`}
                onClick={() => setIndex(i)}
                type="button"
              >
                {step.self}
              </button>
            ))}
          </div>
          <div className="score-row">
            <span>共享盲点</span>
            <i>
              <b style={{ width: `${cur.selfRisk}%` }} />
            </i>
            <em>{cur.selfRisk}%</em>
          </div>
        </div>

        <div className="review-lane cross">
          <div className="lane-head">
            <strong>异构模型互审</strong>
            <span>直接追问证据</span>
          </div>
          <div className="flow-nodes">
            {reviewSteps.map((step, i) => (
              <button
                key={step.cross}
                className={`flow-node ${i === index ? 'active' : ''} ${i < index ? 'done' : ''}`}
                onClick={() => setIndex(i)}
                type="button"
              >
                {step.cross}
              </button>
            ))}
          </div>
          <div className="score-row good">
            <span>证据追问</span>
            <i>
              <b style={{ width: `${cur.crossTrace}%` }} />
            </i>
            <em>{cur.crossTrace}%</em>
          </div>
        </div>
      </div>
      <Feedback tone={index === reviewSteps.length - 1 ? 'good' : 'mid'}>
        异构互审不能保证绝对正确，但能降低同源盲点。
      </Feedback>
    </div>
  );
};

const layers = {
  orchestration: {
    label: '编排层',
    subtitle: '调度 workflow',
    text: '负责安排科研阶段、控制 effort、分配 reviewer，让长期任务按节奏推进。',
    terms: ['流程调度', '轮次控制', '审查路由'],
  },
  execution: {
    label: '执行层',
    subtitle: '产出 artifact',
    text: '负责调用 skill 和 tool，产出代码、实验结果、图表、论文草稿等材料。',
    terms: ['文献', '实验', '写作'],
  },
  assurance: {
    label: '保障层',
    subtitle: '审计 claim',
    text: '负责核对 evidence、审查 claim、检查论文质量，把风险暴露出来。',
    terms: ['证据审计', '引用检查', '论文质检'],
  },
};

export const LayerMap: React.FC<WidgetProps> = () => {
  const [layer, setLayer] = useState<keyof typeof layers>('orchestration');
  const cur = layers[layer];
  return (
    <div className="aris-tool">
      <div className="stack-layout">
        <div className="architecture-stack">
          {Object.entries(layers).map(([key, item]) => (
            <button
              key={key}
              className={`stack-layer ${key} ${layer === key ? 'active' : ''}`}
              onClick={() => setLayer(key as keyof typeof layers)}
              type="button"
            >
              <strong>{item.label}</strong>
              <span>{item.subtitle}</span>
            </button>
          ))}
        </div>
        <div className="layer-card">
          <h4>{cur.label}</h4>
          <p>{cur.text}</p>
          <div className="tag-list">
            {cur.terms.map((term) => (
              <span key={term}>{term}</span>
            ))}
          </div>
        </div>
      </div>
      <Feedback tone="mid">先把责任分清，后面的自动科研才不会混成一团。</Feedback>
    </div>
  );
};

const layerSkills = {
  orchestration: {
    label: '编排层',
    desc: '决定科研流程怎么走，什么时候审查，什么时候继续修改。',
    skills: [
      { name: '/workflow', note: '串起五个科研阶段' },
      { name: '/route-reviewer', note: '安排 reviewer 路由' },
      { name: '/revise-loop', note: '控制审查修改轮次' },
    ],
  },
  execution: {
    label: '执行层',
    desc: '真正调用工具和 skill，生成可以被检查的 artifact。',
    skills: [
      { name: '/idea', note: '提出候选研究想法' },
      { name: '/experiment', note: '运行实验并记录结果' },
      { name: '/writing', note: '组织论文草稿' },
    ],
  },
  assurance: {
    label: '保障层',
    desc: '不负责写得更漂亮，而是负责查证据、查引用、查主张边界。',
    skills: [
      { name: '/claim-audit', note: '核对 claim 与 evidence' },
      { name: '/citation-check', note: '检查引用是否支撑正文' },
      { name: '/paper-review', note: '审查论文质量和风险' },
    ],
  },
};

export const ResponsibilitySorter: React.FC<WidgetProps> = () => {
  const [layer, setLayer] = useState<keyof typeof layerSkills>('execution');
  const cur = layerSkills[layer];
  return (
    <div className="aris-tool">
      <div className="stack-layout">
        <div className="architecture-stack compact">
          {Object.entries(layerSkills).map(([key, item]) => {
            const typedKey = key as keyof typeof layerSkills;
            return (
              <button
                key={key}
                className={`stack-layer ${key} ${layer === key ? 'active' : ''}`}
                onClick={() => setLayer(typedKey)}
                type="button"
              >
                <strong>{item.label}</strong>
                <span>查看典型 skill</span>
              </button>
            );
          })}
        </div>
        <div className="skill-panel">
          <h4>{cur.label}的典型 skill</h4>
          <p>{cur.desc}</p>
          <div className="skill-grid">
            {cur.skills.map((skill) => (
              <div className="skill-card" key={skill.name}>
                <strong>{skill.name}</strong>
                <span>{skill.note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Feedback tone="good">这些 skill 让三层架构从静态分工变成可执行系统。</Feedback>
    </div>
  );
};

const workflowStages = [
  {
    label: '想法发现',
    short: '提出候选 idea',
    action: '在研究方向中筛出值得尝试的问题。',
    artifact: 'idea 报告',
    focus: '编排层定方向',
    roles: ['推进选题', '形成想法', '检查新颖性'],
  },
  {
    label: '实验桥接',
    short: '变成能跑实验',
    action: '把 idea 翻译成代码、设置和可运行实验。',
    artifact: '代码与结果',
    focus: '执行层产出',
    roles: ['安排实验', '运行代码', '检查结果'],
  },
  {
    label: '自动审查',
    short: '多轮修改',
    action: '多个 reviewer 找问题，系统据此补实验、改叙述。',
    artifact: '修改清单',
    focus: '保障层介入',
    roles: ['推进轮次', '修改产物', '审查 claim'],
  },
  {
    label: '论文写作',
    short: '组织草稿',
    action: '把实验结果、图表和主张组织成论文。',
    artifact: '论文草稿',
    focus: '执行层写作',
    roles: ['组织结构', '生成草稿', '核对证据'],
  },
  {
    label: '回复审稿',
    short: '形成回应',
    action: '把评审意见整理成可提交的回应文本。',
    artifact: '回复文本',
    focus: '保障层把关',
    roles: ['分配意见', '起草回应', '检查夸大'],
  },
];

export const WorkflowTimeline: React.FC<WidgetProps> = () => {
  const { index, setIndex } = useAutoIndex(workflowStages.length, 2000);
  const cur = workflowStages[index];
  return (
    <div className="aris-tool">
      <div className="workflow-note">
        同一套三层结构，会在每个阶段动态协同：编排层推进，执行层产出，保障层检查。
      </div>
      <div className="timeline refined">
        {workflowStages.map((stage, i) => (
          <button
            key={stage.label}
            className={`stage ${i === index ? 'active' : ''} ${i < index ? 'done' : ''}`}
            onClick={() => setIndex(i)}
            type="button"
          >
            <strong>{stage.label}</strong>
            <span>{stage.short}</span>
          </button>
        ))}
      </div>
      <div className="workflow-detail">
        <div>
          <span>当前阶段</span>
          <strong>{cur.action}</strong>
        </div>
        <div>
          <span>关键 artifact</span>
          <strong>{cur.artifact}</strong>
        </div>
        <div>
          <span>突出层级</span>
          <strong>{cur.focus}</strong>
        </div>
      </div>
      <div className="role-strip">
        <span>编排层：{cur.roles[0]}</span>
        <span>执行层：{cur.roles[1]}</span>
        <span>保障层：{cur.roles[2]}</span>
      </div>
      <Feedback tone="mid">ARIS 不是一口气写完论文，而是分阶段留下可检查产物。</Feedback>
    </div>
  );
};

const auditStages = [
  {
    label: '实验完整性审计',
    question: '实验有没有真的跑对？',
    target: '代码、配置、输出文件',
    text: '先查实验记录是否完整，避免不存在的结果被写进叙事。',
    tone: 'warn' as Tone,
  },
  {
    label: '结果到主张映射',
    question: '结果能不能支撑 claim？',
    target: '数字、表格、图表',
    text: '再把实验结果映射到 claim，判断能说、弱化说，还是不能说。',
    tone: 'mid' as Tone,
  },
  {
    label: '论文主张审计',
    question: '论文有没有写过头？',
    target: '正文、摘要、结论',
    text: '最后审查论文文字，删除或弱化没有资格出现的主张。',
    tone: 'good' as Tone,
  },
];

export const AuditCascade: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState(0);
  const cur = auditStages[stage];
  return (
    <div className="aris-tool">
      <div className="audit-gates">
        {auditStages.map((item, i) => (
          <button
            key={item.label}
            className={`audit-gate ${i <= stage ? 'open' : ''} ${i === stage ? 'active' : ''}`}
            onClick={() => setStage(i)}
            type="button"
          >
            <span>第{i + 1}道闸门</span>
            <strong>{item.label}</strong>
          </button>
        ))}
      </div>
      <div className="audit-question">
        <strong>{cur.question}</strong>
        <p>{cur.text}</p>
        <span>检查对象：{cur.target}</span>
      </div>
      <div className="ctrl">
        <button
          className="chip active"
          onClick={() => setStage((value) => (value + 1) % auditStages.length)}
          type="button"
        >
          下一道闸门
        </button>
      </div>
      <Feedback tone={cur.tone}>三道闸门共同决定 claim 有没有资格写进论文。</Feedback>
    </div>
  );
};

const claimCases = [
  {
    id: 'score',
    claim: '一次运行中评分从 5.0 提升到 7.5',
    verdict: '支持',
    type: 'good',
    action: '保留',
    reason: '论文报告了这次 overnight run，但必须限定为一次运行观察。',
  },
  {
    id: 'guarantee',
    claim: 'ARIS 能稳定保证科研正确',
    verdict: '不支持',
    type: 'bad',
    action: '删除',
    reason: '论文没有证明稳定保证，反而明确承认不能保证正确性。',
  },
  {
    id: 'remove',
    claim: '系统删除了缺少证据支持的主张',
    verdict: '部分支持',
    type: 'warn',
    action: '弱化',
    reason: '可以写成这次运行中删除了部分 unsupported claims，不能写成总能删除。',
  },
];

export const ClaimEvidenceMatcher: React.FC<WidgetProps> = () => {
  const [selectedId, setSelectedId] = useState(claimCases[0].id);
  const [auditedId, setAuditedId] = useState<string | null>(null);
  const audited = auditedId ? claimCases.find((item) => item.id === auditedId) || null : null;

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain');
    if (claimCases.some((item) => item.id === id)) {
      setSelectedId(id);
      setAuditedId(id);
    }
  };

  return (
    <div className="aris-tool">
      <div className="claim-audit-layout">
        <div className="claim-list">
          <strong>待审 claim</strong>
          {claimCases.map((item) => (
            <button
              key={item.id}
              className={`claim-card draggable ${selectedId === item.id ? 'active' : ''}`}
              draggable
              onClick={() => setSelectedId(item.id)}
              onDragStart={(event) => {
                setSelectedId(item.id);
                event.dataTransfer.setData('text/plain', item.id);
              }}
              type="button"
            >
              {item.claim}
            </button>
          ))}
        </div>
        <div
          className="audit-dropzone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <span>evidence 审核区</span>
          <strong>把 claim 放到这里审</strong>
          <p>系统只判断这句话有没有证据资格，不判断它写得漂不漂亮。</p>
        </div>
      </div>
      {audited ? (
        <div className="verdict-panel">
          <span className={`verdict ${audited.type}`}>{audited.verdict}</span>
          <div>
            <strong>处理：{audited.action}</strong>
            <p>{audited.reason}</p>
          </div>
        </div>
      ) : (
        <div className="verdict-panel empty">
          <span>等待审核</span>
          <div>
            <strong>把左侧 claim 拖到右侧审核区</strong>
            <p>只有经过 evidence 审核后，这里才显示判定结果。</p>
          </div>
        </div>
      )}
      {audited ? (
        <Feedback tone={audited.type as Tone}>ARIS 审的是这句话有没有资格写进论文。</Feedback>
      ) : null}
    </div>
  );
};

const rounds = [
  {
    label: '第1轮',
    score: 5.0,
    experiments: 4,
    unsupported: 7,
    status: '问题暴露，继续修改',
    pass: false,
  },
  {
    label: '第2轮',
    score: 6.0,
    experiments: 10,
    unsupported: 5,
    status: '补实验，继续修改',
    pass: false,
  },
  {
    label: '第3轮',
    score: 6.8,
    experiments: 17,
    unsupported: 2,
    status: '削弱过度 claim，接近通过',
    pass: false,
  },
  {
    label: '第4轮',
    score: 7.5,
    experiments: 22,
    unsupported: 0,
    status: '20+ GPU experiments，通过',
    pass: true,
  },
];

export const RunCase: React.FC<WidgetProps> = () => {
  const [round, setRound] = useState(0);
  const cur = rounds[round];
  const bars = useMemo(
    () => [
      { label: '评分', value: cur.score, max: 10, text: cur.score.toFixed(1) },
      { label: '实验数量', value: cur.experiments, max: 24, text: cur.experiments >= 20 ? '20+' : String(cur.experiments) },
      { label: '未支持主张', value: cur.unsupported, max: 8, text: cur.unsupported === 0 ? '已删除' : String(cur.unsupported), reverse: true },
    ],
    [cur],
  );

  return (
    <div className="aris-tool">
      <div className="round-layout">
        <div className="round-tabs">
          {rounds.map((item, i) => (
            <button
              key={item.label}
              className={`round-tab ${round === i ? 'active' : ''} ${item.pass ? 'pass' : ''}`}
              onClick={() => setRound(i)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="round-panel">
          <div className="round-verdict">
            <strong>{cur.label}</strong>
            <span className={cur.pass ? 'pass' : ''}>{cur.status}</span>
          </div>
          <div className="run-bars">
            {bars.map((bar) => (
              <div className={`run-bar ${bar.reverse ? 'reverse' : ''}`} key={bar.label}>
                <em>{bar.label}</em>
                <span>
                  <i style={{ width: `${Math.max(8, (bar.value / bar.max) * 100)}%` }} />
                </span>
                <b>{bar.text}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Feedback tone={cur.pass ? 'good' : 'warn'}>这是一次运行观察，不代表稳定保证。</Feedback>
    </div>
  );
};

const limits = {
  correctness: {
    label: '不保证正确性',
    text: 'ARIS 能降低风险，但不能保证输出一定正确、新颖或科学可靠。',
  },
  bias: {
    label: '审查偏见',
    text: '如果 reviewer 本身有偏见，循环审查可能继承甚至放大这种偏见。',
  },
  privacy: {
    label: '隐私风险',
    text: 'repo-level review 可能把源代码或中间材料发送给外部模型服务。',
  },
  human: {
    label: '人类责任',
    text: '研究方向、证据复核和最终提交，仍然需要研究者负责。',
  },
};

export const LimitSwitch: React.FC<WidgetProps> = () => {
  const [limit, setLimit] = useState<keyof typeof limits>('correctness');
  const cur = limits[limit];
  return (
    <div className="aris-tool">
      <div className="limit-panel">
        <strong>{cur.label}</strong>
        <p>{cur.text}</p>
      </div>
      <div className="ctrl">
        {Object.entries(limits).map(([key, item]) => (
          <Chip key={key} active={limit === key} onClick={() => setLimit(key as keyof typeof limits)}>
            {item.label}
          </Chip>
        ))}
      </div>
      <Feedback tone="warn">ARIS 是降低风险的 harness，不是替人保证科研结论的机器。</Feedback>
    </div>
  );
};
