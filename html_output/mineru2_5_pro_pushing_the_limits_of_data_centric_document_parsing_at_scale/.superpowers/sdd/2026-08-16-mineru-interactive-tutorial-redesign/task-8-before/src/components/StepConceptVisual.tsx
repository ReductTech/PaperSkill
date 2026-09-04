import { useEffect, useId, useRef, useState } from 'react';
import { GlossaryText } from './Glossary';

type StepKey = 'step-1' | 'step-2' | 'step-3' | 'step-4' | 'step-5' | 'step-6';

interface StepConceptVisualProps {
  stepId: string;
  title?: string;
  intro?: string;
  finalAnswer?: string;
  onInteract?: () => void;
}

interface StepCopy {
  kicker: string;
  title: string;
  intro: string;
  bridge: readonly [string, string, string];
  stateLabels: string[];
  buttonLabels: string[];
  conclusions: string[];
}

const COPY: Record<StepKey, StepCopy> = {
  'step-1': {
    kicker: '先看数据问题',
    title: '更多数据，为什么不一定更有用？',
    intro: '先把普通页面继续堆高，再把同样的预算移向少见场景，观察“数量”和“覆盖”带来的区别。',
    bridge: ['模型共同失败', '检查长尾覆盖', '待筛候选池'],
    stateLabels: ['普通页面已占满数据池', '继续加入相似页面', '把预算移向长尾场景'],
    buttonLabels: ['追加普通数据', '改补长尾样本', '重新比较'],
    conclusions: [
      '先做一个预测：继续增加最常见的页面，覆盖会明显变好吗？',
      '样本数增加了，但模型看到的场景几乎没有变化。',
      '关键不是把数据堆得更高，而是补上模型尚未覆盖的区域。',
    ],
  },
  'step-2': {
    kicker: '先看筛选路径',
    title: '怎样从海量页面中留下真正有价值的数据？',
    intro: '页面整体可能很常见，但其中的公式或表格仍然稀有。点击观察筛选如何从整页继续深入到局部元素。',
    bridge: ['待筛候选池', '双层 DDAS', '平衡训练数据'],
    stateLabels: ['候选数据进入筛选器', '先按页面场景筛一遍', '再放大页面内部元素', '得到兼顾两层覆盖的集合'],
    buttonLabels: ['启动页级筛选', '放大局部元素', '汇合两层结果', '重新观察'],
    conclusions: [
      '第一层回答“这是什么页面”，第二层还要回答“页面里有什么”。',
      '页级筛选让少见版式不再被大簇淹没。',
      '元素级筛选继续找出藏在普通页面里的稀有内容。',
      '两层视角合在一起，才同时照顾场景与元素的长尾。',
    ],
  },
  'step-3': {
    kicker: '先看模型分歧',
    title: '没有标准答案，怎样判断一个样本有多难？',
    intro: '让三个模型独立阅读同一处结构。我们不先相信某一个模型，而是观察它们在哪里一致、在哪里分歧。',
    bridge: ['没有 GT 的输出', 'CMCV 比较分歧', 'Easy / Medium / Hard'],
    stateLabels: ['三个模型等待独立作答', '三份结构化输出已出现', '比较输出间的一致关系', '按分歧程度送往不同路径'],
    buttonLabels: ['收集三个输出', '比较模型分歧', '执行难度分流', '重新会诊'],
    conclusions: [
      '先不问谁一定正确，只问三个模型是否给出了相同结构。',
      '同一页面产生了三份可比较的输出。',
      '一致与分歧成为没有 GT 时可用的难度代理信号。',
      '样本被分流，而模型共识仍需要后续验证，不能直接等同真值。',
    ],
  },
  'step-4': {
    kicker: '先把结构画出来',
    title: '源码里难发现的错误，为什么渲染后会暴露？',
    intro: '一段结构代码表面上很规整，但它真正控制的是视觉排布。把它还原成图像，错位就有了可以比较的位置。',
    bridge: ['待复核 Hard', '渲染与局部修正', '可信困难标注'],
    stateLabels: ['只查看结构源码', '把源码渲染成视觉结果', '叠加原图并定位差异', '只修正发生错误的局部'],
    buttonLabels: ['渲染结构', '叠加视觉差异', '执行局部修复', '重新检查'],
    conclusions: [
      '字符序列看似合理，并不代表最终版面正确。',
      '渲染把抽象结构变成了人眼可见的排布。',
      '与原图叠加后，隐藏错误被转化成明确的视觉差异。',
      '定位后只改错处，比重新生成整个结构更可控。',
    ],
  },
  'step-5': {
    kicker: '先看学习顺序',
    title: '不同质量的数据，为什么不能一次混合训练？',
    intro: '训练目标会从“看得广”逐步变成“攻克难例”和“对齐任务指标”。点击沿着时间轴查看数据职责的变化。',
    bridge: ['分层数据', 'SFT / Replay / GRPO', '对齐后的模型'],
    stateLabels: ['训练尚未开始', '第一阶段建立广泛覆盖', '第二阶段学习难例并回放旧知识', '第三阶段比较 16 个候选结果'],
    buttonLabels: ['建立基础覆盖', '加入难例与 Replay', '展开 16 个 Rollout', '重新训练'],
    conclusions: [
      '先区分三个目标：覆盖、困难能力和最终指标对齐。',
      '先用规模数据建立宽广而稳定的解析基础。',
      '再集中学习难例，并用 Replay 减少对已有能力的遗忘。',
      '最后让多个候选在同组内比较，用任务反馈选择更好的方向。',
    ],
  },
  'step-6': {
    kicker: '先看评分是否公平',
    title: '内容相同但分块不同，应该被判成错误吗？',
    intro: '保持标准答案完全不动，只改变预测侧的分块方式，再观察匹配分数和最终证据如何变化。',
    bridge: ['Held-out 预测', 'MGAM 与 Hard 测试', '公平证据'],
    stateLabels: ['固定 GT，预测仍被拆成多块', '合并预测侧相邻分块', '重新计算最合适的匹配', '把改进放回完整证据链'],
    buttonLabels: ['合并预测分块', '重新匹配评分', '查看消融证据', '重新验证'],
    conclusions: [
      '低分可能来自内容错误，也可能只是预测与 GT 的粒度不同。',
      '只调整预测侧粒度，GT 与考题本身保持不变。',
      '重新匹配后，评分更接近内容真正的一致程度。',
      '公平评测与消融证据一起，才能说明提升来自哪里、边界在哪里。',
    ],
  },
};

const STEP_KEYS = Object.keys(COPY) as StepKey[];

function normalizeStep(stepId: string): StepKey {
  return STEP_KEYS.includes(stepId as StepKey) ? (stepId as StepKey) : 'step-1';
}

function DataCoverageVisual({ phase }: { phase: number }) {
  return (
    <div className="scv-scene scv-coverage" data-phase={phase}>
      <div className="scv-coverage-column scv-common">
        <span className="scv-mini-label">高频普通页</span>
        <div className="scv-page-stack" aria-hidden="true">
          {Array.from({ length: 7 }, (_, index) => (
            <span className="scv-paper" key={index}><i /><i /><i /></span>
          ))}
        </div>
        <strong>数量</strong>
        <span className="scv-meter"><i /></span>
      </div>
      <div className="scv-balance" aria-hidden="true"><span>预算</span><i /></div>
      <div className="scv-coverage-column scv-tail">
        <span className="scv-mini-label">稀有长尾</span>
        <div className="scv-tail-grid" aria-hidden="true">
          <span className="scv-tail-card">∑</span>
          <span className="scv-tail-card"><i /><i /></span>
          <span className="scv-tail-card">双栏</span>
          <span className="scv-tail-card">表</span>
        </div>
        <strong>覆盖</strong>
        <span className="scv-meter"><i /></span>
      </div>
    </div>
  );
}

function SamplingFunnelVisual({ phase }: { phase: number }) {
  return (
    <div className="scv-scene scv-funnel" data-phase={phase}>
      <div className="scv-source-cloud" aria-hidden="true">
        <span>单栏</span><span>公式页</span><span>多栏</span><span>表格页</span><span>图文页</span>
      </div>
      <div className="scv-funnel-layer scv-page-layer">
        <span className="scv-funnel-name">页级视角</span>
        <i className="scv-funnel-neck" aria-hidden="true" />
        <span className="scv-funnel-note">场景覆盖</span>
      </div>
      <div className="scv-page-zoom" aria-hidden="true">
        <span className="scv-zoom-text" /><span className="scv-zoom-formula">∫</span><span className="scv-zoom-table"><i /><i /><i /><i /></span>
      </div>
      <div className="scv-funnel-layer scv-element-layer">
        <span className="scv-funnel-name">元素级视角</span>
        <i className="scv-funnel-neck" aria-hidden="true" />
        <span className="scv-funnel-note">局部长尾</span>
      </div>
      <div className="scv-balanced-tray" aria-label="平衡后的训练集合">
        <span>文</span><span>∑</span><span>表</span><strong>平衡集合</strong>
      </div>
    </div>
  );
}

function ConsensusVisual({ phase }: { phase: number }) {
  return (
    <div className="scv-scene scv-consensus" data-phase={phase}>
      <div className="scv-model-row">
        {[
          ['目标模型', 'x − y'],
          ['外部模型 A', 'x + y'],
          ['外部模型 B', 'x + y'],
        ].map(([name, output], index) => (
          <div className={`scv-model scv-model-${index + 1}`} key={name}>
            <span className="scv-avatar" aria-hidden="true"><i /><i /></span>
            <strong>{name}</strong>
            <code>{output}</code>
          </div>
        ))}
      </div>
      <div className="scv-consensus-links" aria-hidden="true">
        <i className="scv-link scv-link-agree" /><i className="scv-link scv-link-disagree" />
      </div>
      <div className="scv-route-row">
        <span className="scv-route easy"><i />Easy</span>
        <span className="scv-route medium"><i />Medium</span>
        <span className="scv-route hard"><i />Hard</span>
      </div>
      <div className="scv-routing-token" aria-hidden="true">样本</div>
    </div>
  );
}

function RenderVisual({ phase }: { phase: number }) {
  return (
    <div className="scv-scene scv-render" data-phase={phase}>
      <div className="scv-render-panel scv-code-panel">
        <span className="scv-mini-label">结构源码</span>
        <code>{'\\frac{a+b}{c+d}'}</code>
        <span className="scv-code-lines" aria-hidden="true"><i /><i /><i /></span>
      </div>
      <span className="scv-flow-arrow" aria-hidden="true">→</span>
      <div className="scv-render-panel scv-image-panel">
        <span className="scv-mini-label">渲染结果</span>
        <span className="scv-formula-result"><i>a + b</i><b /><i>c + d</i></span>
        <span className="scv-formula-ghost" aria-hidden="true"><i>a + b</i><b /><i>c + d</i></span>
      </div>
      <span className="scv-flow-arrow" aria-hidden="true">→</span>
      <div className="scv-render-panel scv-diff-panel">
        <span className="scv-mini-label">视觉差异</span>
        <span className="scv-diff-target" aria-hidden="true"><i /><i /><i /><i /></span>
        <strong>局部定位</strong>
      </div>
    </div>
  );
}

function TrainingVisual({ phase }: { phase: number }) {
  return (
    <div className="scv-scene scv-training" data-phase={phase}>
      <div className="scv-stage-track" aria-hidden="true"><i /></div>
      <div className="scv-training-stages">
        <div className="scv-train-stage scv-train-one"><span>1</span><strong>建立覆盖</strong><small>规模数据</small></div>
        <div className="scv-train-stage scv-train-two"><span>2</span><strong>攻克难例</strong><small>Hard + Replay</small><i className="scv-replay">↶</i></div>
        <div className="scv-train-stage scv-train-three"><span>3</span><strong>指标对齐</strong><small>组内比较</small></div>
      </div>
      <div className="scv-rollouts" aria-label="16 个 rollout 候选">
        {Array.from({ length: 16 }, (_, index) => <i key={index} className={index === 12 ? 'is-best' : ''} />)}
        <span>16 个候选</span>
      </div>
    </div>
  );
}

function EvidenceVisual({ phase }: { phase: number }) {
  return (
    <div className="scv-scene scv-evidence" data-phase={phase}>
      <div className="scv-match-area">
        <div className="scv-gt-card"><span>GT 固定</span><i /><i /></div>
        <div className="scv-match-lines" aria-hidden="true"><i /><i /><i /></div>
        <div className="scv-prediction-card">
          <span>预测侧</span>
          <div><i>块 A</i><i>块 B</i><i>块 C</i></div>
        </div>
      </div>
      <div className="scv-score" aria-label="匹配分数变化"><strong><span className="scv-old-score">低</span><span className="scv-new-score">合理</span></strong><small>匹配分数</small></div>
      <div className="scv-ablation" aria-label="逐步增加的消融证据">
        <i /><i /><i /><i />
        <span>消融证据</span>
      </div>
    </div>
  );
}

function Scene({ step, phase }: { step: StepKey; phase: number }) {
  if (step === 'step-1') return <DataCoverageVisual phase={phase} />;
  if (step === 'step-2') return <SamplingFunnelVisual phase={phase} />;
  if (step === 'step-3') return <ConsensusVisual phase={phase} />;
  if (step === 'step-4') return <RenderVisual phase={phase} />;
  if (step === 'step-5') return <TrainingVisual phase={phase} />;
  return <EvidenceVisual phase={phase} />;
}

function StepConceptVisualBody({
  step,
  title,
  intro,
  finalAnswer,
  onInteract,
}: {
  step: StepKey;
  title?: string;
  intro?: string;
  finalAnswer?: string;
  onInteract?: () => void;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const reduceMotionRef = useRef(false);
  const [phase, setPhase] = useState(0);
  const [autoRunning, setAutoRunning] = useState(false);
  const headingId = useId();
  const conclusionId = useId();
  const copy = COPY[step];
  const lastPhase = copy.stateLabels.length - 1;
  const nextPhase = phase >= lastPhase ? 0 : phase + 1;

  useEffect(() => {
    reduceMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const node = rootRef.current;
    if (!node) return undefined;
    if (!('IntersectionObserver' in window)) {
      if (reduceMotionRef.current) setPhase(lastPhase);
      else setAutoRunning(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      if (reduceMotionRef.current) setPhase(lastPhase);
      else setAutoRunning(true);
      observer.disconnect();
    }, { threshold: 0.48 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [lastPhase]);

  useEffect(() => {
    if (!autoRunning) return undefined;
    if (phase >= lastPhase) {
      setAutoRunning(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setPhase((current) => Math.min(lastPhase, current + 1)), 820);
    return () => window.clearTimeout(timer);
  }, [autoRunning, lastPhase, phase]);

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) setAutoRunning(false);
    };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden);
  }, []);

  const handleAction = () => {
    onInteract?.();
    if (phase >= lastPhase) {
      if (reduceMotionRef.current) setPhase(lastPhase);
      else {
        setPhase(0);
        setAutoRunning(true);
      }
      return;
    }
    setAutoRunning(false);
    setPhase(nextPhase);
  };

  const specimenStatus = step === 'step-6'
    ? 'HELD-OUT TEST'
    : ['DATA POOL', 'TRAIN CANDIDATE', 'ROUTED', 'EXPERT VERIFIED', 'TRAIN'][Number(step.slice(-1)) - 1];

  return (
    <aside
      ref={rootRef}
      className={`step-concept-visual scv-${step}`}
      aria-labelledby={headingId}
      data-phase={phase}
      data-auto={autoRunning}
      onClickCapture={(event) => {
        if ((event.target as Element).closest('.glossary-term')) {
          setAutoRunning(false);
          onInteract?.();
        }
      }}
    >
      <div className="scv-chapter-bridge" aria-label="本节在完整研究路径中的作用">
        <span className="scv-bridge-icon" aria-hidden="true">↳</span>
        <div>
          <small>本节作用</small>
          <p className="scv-bridge-path">
            {copy.bridge.map((item, index) => (
              <span key={item}>
                <b><GlossaryText text={item} /></b>
                {index < copy.bridge.length - 1 ? <i aria-hidden="true">→</i> : null}
              </span>
            ))}
          </p>
        </div>
      </div>

      <div className="scv-copy">
        <div className="scv-meta">
          <span className="scv-kicker">{copy.kicker}</span>
          <span className="source-tag teaching">基于论文重绘 · 教学示意</span>
        </div>
        <h3 id={headingId}>{title ?? copy.title}</h3>
        <p><GlossaryText text={intro ?? copy.intro} /></p>
      </div>

      <figure className="scv-figure">
        <div className={`scv-specimen-thread ${step === 'step-6' ? 'is-held-out' : ''}`}>
          <span className="scv-specimen-page" aria-hidden="true"><i /><i /><i /></span>
          <span><small>{step === 'step-6' ? '新样本 · TEST-296' : '同一样本 · DOC-A17'}</small><b>{specimenStatus}</b></span>
        </div>
        <div className="scv-canvas" key={`${step}-${phase}`} aria-hidden="true">
          <Scene step={step} phase={phase} />
        </div>
        <figcaption className="scv-state-label">
          <span>{phase + 1}/{copy.stateLabels.length}</span>
          {copy.stateLabels[phase]}
        </figcaption>
      </figure>

      <div className="scv-controls">
        <button
          className="scv-action"
          type="button"
          onClick={handleAction}
          aria-describedby={conclusionId}
        >
          <span>{autoRunning ? '接管并继续' : copy.buttonLabels[phase]}</span>
          <span aria-hidden="true">{phase >= lastPhase ? '↺' : '→'}</span>
        </button>
        <p className="scv-conclusion" id={conclusionId} role="status" aria-live="polite" data-resolved={phase > 0}>
          <i aria-hidden="true">{phase > 0 ? '✓' : '?'}</i>
          <span><GlossaryText text={phase >= lastPhase && finalAnswer ? finalAnswer : copy.conclusions[phase]} /></span>
        </p>
      </div>
    </aside>
  );
}

export function StepConceptVisual({ stepId, title, intro, finalAnswer, onInteract }: StepConceptVisualProps) {
  const step = normalizeStep(stepId);
  return (
    <StepConceptVisualBody
      key={step}
      step={step}
      title={title}
      intro={intro}
      finalAnswer={finalAnswer}
      onInteract={onInteract}
    />
  );
}
