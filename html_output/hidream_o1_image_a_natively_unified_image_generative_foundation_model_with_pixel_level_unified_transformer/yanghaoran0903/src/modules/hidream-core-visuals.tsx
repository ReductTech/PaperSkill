import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { ArchitectureDiagram } from '../components/svg/ArchitectureDiagram';

type TokenKind = 'text' | 'cond' | 'gen';

interface UnifiedTokenSpaceProps extends WidgetProps {
  prompt?: string;
  conditionImageUrl?: string;
  noisyTargetImageUrl?: string;
}

interface MixedAttentionProps extends WidgetProps {
  tokens?: string[];
}

interface DiffusionStepperProps extends WidgetProps {
  cleanImageUrl?: string;
  noiseImageUrl?: string;
}

interface TrainingStage {
  id: string;
  name: string;
  res: string;
  tasks: string[];
  dataLabel: string;
  dataPercent: number;
}

interface TrainingTimelineProps extends WidgetProps {
  stages?: TrainingStage[];
}

interface LossStackProps extends WidgetProps {
  dmd?: number;
  diff?: number;
  adv?: number;
}

interface SceneItem {
  title: string;
  caption: string;
  hint: string;
  imageUrl?: string;
}

interface ApplicationScenesProps extends WidgetProps {
  scenes?: SceneItem[];
}

interface CoreSummaryProps extends WidgetProps {
  terms?: string[];
}

interface PromptAgentProps extends WidgetProps {
  prompt?: string;
  resultImageUrl?: string;
}

const TOKEN_COLORS: Record<TokenKind, string> = {
  text: '#3498db',
  cond: '#2ecc71',
  gen: '#f72585',
};

const DEFAULT_PROMPT = '画一个穿着红色连衣裙、戴着草帽、站在向日葵田里的女孩';
const DEFAULT_TRAINING: TrainingStage[] = [
  { id: 'stage-i', name: 'Stage I', res: '512x512', tasks: ['T2I', 'LM', 'MMU'], dataLabel: '基础关联', dataPercent: 34 },
  { id: 'stage-ii', name: 'Stage II', res: '1024x1024', tasks: ['Editing', 'Personalization'], dataLabel: '上下文推理', dataPercent: 66 },
  { id: 'stage-iii', name: 'Stage III', res: '2048x2048', tasks: ['T2I', 'Editing', 'Personalization', 'MMU'], dataLabel: '高保真精炼', dataPercent: 100 },
];

const useTimer = (active: boolean, fn: () => void, ms: number) => {
  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(fn, ms);
    return () => window.clearTimeout(id);
  }, [active, fn, ms]);
};

function Frame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="hd-widget reveal-on-scroll">
      <header className="hd-widget-head">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </header>
      <div className="hd-widget-body">{children}</div>
    </section>
  );
}

function Pill({ kind, text, className = '', tip }: { kind: TokenKind; text: string; className?: string; tip?: string }) {
  return (
    <span
      className={`hd-token ${kind} ${className}`}
      data-tip={tip}
      style={{ ['--hd-token-color' as string]: TOKEN_COLORS[kind] }}
    >
      {text}
    </span>
  );
}

function ImageBox({ url, fallback, className = '' }: { url?: string; fallback: string; className?: string }) {
  return url ? (
    <img className={className} src={url} alt={fallback} loading="lazy" />
  ) : (
    <div className={`hd-art ${className}`}>{fallback}</div>
  );
}

export function ProblemIntroBoard() {
  return (
    <Frame title="问题引入页" subtitle="传统LDM的两个痛点：VAE压缩损细节，分离式文本编码器损对齐。">
      <div className="hd-problem-grid">
        <article className="hd-problem-card danger">
          <strong>VAE压缩前 vs 压缩后</strong>
          <p>压缩前文字和高频纹理完整；压缩后小字边缘变糊，纹理和细线容易丢失。</p>
          <div className="hd-problem-compare">
            <div className="hd-art hd-art-clean">压缩前：清晰文字</div>
            <div className="hd-art hd-art-noise">压缩后：文字发糊</div>
          </div>
        </article>
        <article className="hd-problem-card warn">
          <strong>文本空间和图像空间是两个气泡</strong>
          <p>分离式文本编码器让文字和图像像各说各话，复杂属性、数量和位置关系更难稳定对齐。</p>
          <div className="hd-problem-bubbles" aria-label="文本空间和图像空间分离示意">
            <div className="hd-bubble text">文本空间</div>
            <div className="hd-bubble image">图像空间</div>
          </div>
        </article>
      </div>
      <div className="hd-callout">能不能把所有信息放到同一个“语言”里？</div>
    </Frame>
  );
}

export function UnifiedTokenSpaceVisualizer({
  prompt = DEFAULT_PROMPT,
  conditionImageUrl = '',
  noisyTargetImageUrl = '',
}: UnifiedTokenSpaceProps) {
  const [text, setText] = useState(prompt);
  const [conditionUrl, setConditionUrl] = useState(conditionImageUrl);
  const [noiseUrl, setNoiseUrl] = useState(noisyTargetImageUrl);
  const [mapped, setMapped] = useState(false);
  const [animating, setAnimating] = useState(false);
  const textTokens = useMemo(() => text.replace(/\s+/g, '').split('').slice(0, 16), [text]);
  const condTokens = useMemo(() => Array.from({ length: 12 }, (_, i) => `C${i + 1}`), []);
  const genTokens = useMemo(() => Array.from({ length: 16 }, (_, i) => `G${i + 1}`), []);

  useTimer(animating, () => {
    setAnimating(false);
    setMapped(true);
  }, 760);
  useEffect(() => setMapped(false), [text, conditionUrl, noiseUrl]);

  return (
    <Frame title="统一Token空间可视化器" subtitle="文本Token、条件Token、生成Token先映射到共享空间，再拼成一条长序列输入统一Transformer。">
      <div className="hd-form-grid">
        <label className="hd-field">
          <span>文本提示</span>
          <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <label className="hd-field">
          <span>条件图像URL</span>
          <input value={conditionUrl} onChange={(e) => setConditionUrl(e.target.value)} placeholder="https://..." />
        </label>
        <label className="hd-field">
          <span>目标图像（带噪声）URL</span>
          <input value={noiseUrl} onChange={(e) => setNoiseUrl(e.target.value)} placeholder="https://..." />
        </label>
      </div>
      <div className="ctrl">
        <button className="chip selected" onClick={() => { setMapped(false); setAnimating(true); }}>
          映射到共享空间
        </button>
        <span className="hd-note">{mapped ? '已完成映射：三类Token正在同一空间对齐' : animating ? 'Token正在飞入共享空间' : '等待映射'}</span>
      </div>
      <div className="hd-token-space">
        <div className="hd-source">
          <div className="hd-source-head">文本Token</div>
          <div className="hd-token-cluster">
            {textTokens.map((ch, i) => (
              <Pill key={`${ch}-${i}`} kind="text" text={ch} className={animating ? 'is-flying' : ''} tip={`文本Token：字符“${ch}”`} />
            ))}
          </div>
        </div>
        <div className="hd-source">
          <div className="hd-source-head">条件Token</div>
          <div className="hd-image-card">
            <ImageBox url={conditionUrl} fallback="参考图像" />
            <div className="hd-grid-mask">
              {condTokens.map((t) => (
                <Pill key={t} kind="cond" text="" className={animating ? 'is-flying' : ''} tip={`条件Token：SigLip-2图像网格 ${t}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="hd-source">
          <div className="hd-source-head">生成Token</div>
          <div className="hd-image-card">
            <ImageBox url={noiseUrl} fallback="噪声图像" />
            <div className="hd-grid-mask">
              {genTokens.map((t) => (
                <Pill key={t} kind="gen" text="" className={animating ? 'is-flying' : ''} tip={`生成Token：噪声Patch ${t}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="hd-center">
          <div className="hd-source-head">共享Token序列</div>
          <div className="hd-sequence">
            {textTokens.map((t, i) => <Pill key={`text-${i}`} kind="text" text={t} tip="文本Token：提示词片段" />)}
            {condTokens.map((t) => <Pill key={t} kind="cond" text={t} tip="条件Token：参考图像片段" />)}
            {genTokens.map((t) => <Pill key={t} kind="gen" text={t} tip="生成Token：待去噪图像块" />)}
          </div>
        </div>
      </div>
    </Frame>
  );
}

export function ArchitectureFlowExplorer() {
  return (
    <Frame title="核心架构：对比演进" subtitle="按顺序看三步：旧方法卡在哪，像素空间怎么改，HiDream 又统一了什么。">
      <div className="hd-arch-intro">
        <article className="hd-flow-box main">
          <strong>先抓住一个问题</strong>
          <p>把文本、条件图像和待生成图像拆成不同空间后，Transformer 需要同时理解多套语言，容易对不齐。</p>
          <span>这一页先把“分离”与“统一”放在一张图里对比。</span>
        </article>
      </div>
      <ArchitectureDiagram />
      <div className="hd-flow-graph">
        <div className="hd-flow-col">
          <div className="hd-flow-box">
            <strong>条件图像</strong>
            <p>条件图像 → SigLip-2 → 投影 → 共享空间</p>
          </div>
          <div className="hd-flow-box">
            <strong>文本提示</strong>
            <p>文本提示 → Tokenizer → 嵌入 → 共享空间</p>
          </div>
          <div className="hd-flow-box">
            <strong>目标图像</strong>
            <p>目标图像 → Patchify + 噪声 → 嵌入 → 共享空间</p>
          </div>
        </div>
        <div className="hd-flow-center">
          <div className="hd-flow-box main">
            <strong>共享空间 + Time Embed</strong>
            <p>时间步嵌入告诉模型当前去噪进度，让统一 Transformer 明白这一步该做什么。</p>
          </div>
          <div className="hd-flow-arrow">预测干净 Patch</div>
          <div className="hd-flow-box">
            <strong>统一 Transformer 输出</strong>
            <p>共享空间 → 统一 Transformer → 预测干净 Patch → Unpatchify → 输出图像</p>
          </div>
        </div>
      </div>
    </Frame>
  );
}

export function MixedAttentionDemonstrator({ tokens }: MixedAttentionProps) {
  const labels = tokens ?? ['条件1', '条件2', '文本1', '文本2', '生成1', '生成2'];
  const [mode, setMode] = useState<'causal' | 'full'>('causal');
  const [hover, setHover] = useState<number | null>(null);
  const tokenKindAt = (index: number): TokenKind => (index < 2 ? 'cond' : index < 4 ? 'text' : 'gen');
  const edges = useMemo(() => {
    const out: Array<{ from: number; to: number; kind: 'language' | 'image' | 'full' }> = [];
    labels.forEach((_, from) => {
      labels.forEach((__, to) => {
        if (from === to) return;
        if (mode === 'full') {
          if (from < to) out.push({ from, to, kind: 'full' });
          return;
        }
        if (from >= 4 || to >= 4) out.push({ from, to, kind: 'image' });
        else if (from < to) out.push({ from, to, kind: 'language' });
      });
    });
    return out;
  }, [labels, mode]);

  return (
    <Frame title="混合注意力机制演示器" subtitle="条件和文本用因果注意力，生成Token用全注意力；切到全注意力后所有Token两两互看。">
      <div className="ctrl">
        <button className={`chip ${mode === 'causal' ? 'selected' : ''}`} onClick={() => setMode('causal')}>因果/混合模式</button>
        <button className={`chip ${mode === 'full' ? 'selected' : ''}`} onClick={() => setMode('full')}>全注意力模式</button>
      </div>
      <div className="hd-attention">
        <svg viewBox="0 0 640 250" className="hd-attention-svg" role="img" aria-label="注意力连线演示">
          <defs>
            <marker id="hd-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="currentColor" />
            </marker>
          </defs>
          <g key={mode} className="hd-attention-lines">
            {edges.map((e, i) => {
              const x1 = 80 + e.from * 96;
              const x2 = 80 + e.to * 96;
              const lift = e.kind === 'language' ? 46 : e.kind === 'image' ? 86 : 66;
              const y = 166;
              const dx = Math.abs(x2 - x1);
              const path = `M ${x1} ${y} C ${x1} ${y - lift - dx * 0.04}, ${x2} ${y - lift - dx * 0.04}, ${x2} ${y}`;
              const strong = hover === e.from || hover === e.to;
              return (
                <path
                  key={`${e.from}-${e.to}-${i}`}
                  className={`hd-attn-path ${e.kind}`}
                  d={path}
                  markerEnd={mode === 'causal' && e.kind === 'language' ? 'url(#hd-arrow)' : undefined}
                  style={{ ['--delay' as string]: `${i * 34}ms` }}
                  data-strong={strong ? 'true' : 'false'}
                />
              );
            })}
          </g>
          {labels.map((label, i) => (
            <g key={label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect className={`hd-attn-node ${tokenKindAt(i)}`} x={42 + i * 96} y={176} width="76" height="34" rx="10" />
              <text x={80 + i * 96} y={198} textAnchor="middle">{label}</text>
            </g>
          ))}
        </svg>
        <div className="hd-attention-row">
          {labels.map((label, i) => (
            <button key={label} className={`hd-attention-token ${tokenKindAt(i)}`} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </Frame>
  );
}

export function LossStackIllustrator({ dmd = 0.52, diff = 0.31, adv = 0.17 }: LossStackProps) {
  return (
    <Frame title="总体目标函数" subtitle="三项损失像三层信号：蒸馏负责效率，扩散负责去噪，对抗负责真实感。">
      <div className="hd-loss-stack">
        <div className="hd-loss-card dmd"><strong>L_DMD</strong><p>DMD蒸馏：把强教师模型的能力压给更小、更快的学生模型。</p><span>{dmd.toFixed(2)}</span></div>
        <div className="hd-loss-card diff"><strong>lambda_diff · L_diff</strong><p>标准扩散损失：学习一步步去噪、重建结构和细节。</p><span>{diff.toFixed(2)}</span></div>
        <div className="hd-loss-card adv"><strong>lambda_adv · L_adv</strong><p>对抗损失：让输出更锐利、更接近真实图像分布。</p><span>{adv.toFixed(2)}</span></div>
      </div>
      <div className="formula hd-latex">
        <span className="var-blue">L_total</span> = <span>L_DMD</span> + <span>lambda_diff · L_diff</span> + <span>lambda_adv · L_adv</span>
      </div>
    </Frame>
  );
}

export function DiffusionTimeStepper({ cleanImageUrl = '', noiseImageUrl = '' }: DiffusionStepperProps) {
  const [t, setT] = useState(0.5);
  return (
    <Frame title="扩散过程时间步调节器" subtitle="拖动t，观察 x_t = t·x + (1-t)·epsilon 如何从噪声混合到干净图像。">
      <div className="hd-diffusion">
        <div className="hd-diff-card">
          <div className="hd-source-head">干净图像 x</div>
          <div className="hd-image-stage clean">{cleanImageUrl ? <img src={cleanImageUrl} alt="干净图像" loading="lazy" /> : <div className="hd-art hd-art-clean" />}</div>
        </div>
        <div className="hd-diff-card">
          <div className="hd-source-head">中间结果 x_t</div>
          <div className="hd-image-stage mix" style={{ ['--mix-a' as string]: t, ['--mix-b' as string]: 1 - t }}>
            {cleanImageUrl ? <img className="hd-layer clean" src={cleanImageUrl} alt="干净图像层" loading="lazy" /> : <div className="hd-art hd-art-clean hd-layer clean" />}
            {noiseImageUrl ? <img className="hd-layer noise" src={noiseImageUrl} alt="噪声图像层" loading="lazy" /> : <div className="hd-art hd-art-noise hd-layer noise" />}
          </div>
        </div>
        <div className="hd-diff-card">
          <div className="hd-source-head">噪声 epsilon</div>
          <div className="hd-image-stage noise">{noiseImageUrl ? <img src={noiseImageUrl} alt="噪声图像" loading="lazy" /> : <div className="hd-art hd-art-noise" />}</div>
        </div>
      </div>
      <div className="ctrl">
        <label>t <input type="range" min={0} max={1} step={0.01} value={t} onChange={(e) => setT(Number(e.target.value))} /> <span className="val">{t.toFixed(2)}</span></label>
      </div>
      <div className="formula hd-latex">
        <span className="var-blue">x_t</span> = <span className="var-green">t</span> · <span className="var-blue">x</span> + (1 - <span className="var-green">t</span>) · <span className="var-red">epsilon</span>
      </div>
      <p className="hd-note">当前 t = {t.toFixed(2)}，干净图像权重 = {t.toFixed(2)}，噪声权重 = {(1 - t).toFixed(2)}</p>
    </Frame>
  );
}

export function ApplicationScenesShowcase({ scenes }: ApplicationScenesProps) {
  const items: SceneItem[] = scenes ?? [
    { title: '电影镜头控制', caption: '用15种镜头和角度控制画面语言，让生成结果更像可导演的分镜。', hint: '15 shots + angles' },
    { title: '多面板故事板', caption: '让角色、场景和叙事在多个面板中保持连续。', hint: 'Storyboard' },
    { title: '电商产品图编辑', caption: '替换背景、调整摆放，同时保留商品主体和品牌细节。', hint: 'Product editing' },
    { title: '个性化头像生成', caption: '保持身份特征，在新风格和新场景中复用同一人物。', hint: 'Personalization' },
  ];
  return (
    <Frame title="应用场景补充" subtitle="这些场景把统一生成、编辑和个性化能力落到真实创作任务里。">
      <div className="hd-scene-grid">
        {items.map((item) => (
          <article key={item.title} className="hd-scene-card">
            <div className="hd-scene-thumb">
              {item.imageUrl ? <img src={item.imageUrl} alt={item.title} loading="lazy" /> : <div className="hd-art hd-art-scene">{item.hint}</div>}
            </div>
            <strong>{item.title}</strong>
            <p>{item.caption}</p>
          </article>
        ))}
      </div>
    </Frame>
  );
}

export function TrainingProgressTimeline({ stages = DEFAULT_TRAINING }: TrainingTimelineProps) {
  const [active, setActive] = useState(0);
  const current = stages[active];
  return (
    <Frame title="三阶段训练进度条" subtitle="点击节点查看分辨率、任务和数据金字塔。">
      <div className="hd-timeline">
        {stages.map((stage, index) => {
          const activeClass = index === active ? 'active' : index < active ? 'done' : '';
          return (
            <button key={stage.id} className={`hd-node ${activeClass}`} onClick={() => setActive(index)}>
              <span className="hd-node-dot" />
              <strong>{stage.name}</strong>
              <small>{stage.res}</small>
            </button>
          );
        })}
      </div>
      <div className="hd-stage-detail">
        <div className="hd-stage-top"><h4>{current.name}</h4><span>{current.res}</span></div>
        <div className="hd-task-row">{current.tasks.map((task) => <span key={task} className="chip selected">{task}</span>)}</div>
        <div className="hd-pyramid">{Array.from({ length: 5 }, (_, i) => <div key={i} className="hd-pyramid-slice" style={{ width: `${52 + i * 10}%`, opacity: 0.35 + i * 0.1 }} />)}</div>
        <div className="hd-progress"><div className="hd-progress-bar" style={{ width: `${current.dataPercent}%` }} /></div>
        <p className="hd-note">{current.dataLabel} · 数据和任务难度随阶段递增。</p>
      </div>
    </Frame>
  );
}

export function CoreSummaryBoard({ terms = ['Native Unification', 'In-Context Reasoning', 'Scaling Law'] }: CoreSummaryProps) {
  return (
    <Frame title="核心洞察总结" subtitle="一句话、三个关键词、一条架构演进线。">
      <div className="hd-summary">
        <div className="hd-summary-quote">HiDream-O1-Image把所有信息放到同一个Token空间，让Transformer像理解语言一样理解图像生成。</div>
        <div className="hd-summary-terms">{terms.map((term) => <span key={term} className="chip selected">{term}</span>)}</div>
        <div className="hd-summary-flow"><span>LDM</span><span>→</span><span>像素空间DiT</span><span>→</span><span>HiDream-O1-Image</span></div>
      </div>
    </Frame>
  );
}

export function PromptAgentChain({ prompt = DEFAULT_PROMPT, resultImageUrl = '' }: PromptAgentProps) {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const steps = useMemo(() => [
    { title: '步骤1：识别主体', text: '主体：女孩' },
    { title: '步骤2：识别属性', text: '属性：红色连衣裙、草帽' },
    { title: '步骤3：识别场景', text: '场景：向日葵田' },
    { title: '步骤4：识别空间关系', text: '空间关系：站在向日葵田里' },
    { title: '步骤5：输出精炼提示', text: '精炼提示：一个女孩，红色连衣裙，草帽，站在明亮的向日葵田里，清晰细节，自然光' },
  ], []);
  useTimer(running && step < steps.length - 1, () => setStep((v) => v + 1), 900);
  useTimer(running && step >= steps.length - 1, () => setRunning(false), 1200);

  return (
    <Frame title="推理驱动提示智能体思考链" subtitle="Prompt Agent先拆解复杂需求，再输出模型更容易执行的精炼指令。">
      <div className="hd-prompt-box">
        <div className="hd-input-bubble"><span>用户输入</span><p>{prompt}</p></div>
        <button className="chip selected" onClick={() => { setStep(0); setRunning(true); }}>开始思考链</button>
      </div>
      <div className="hd-thought-chain">
        {steps.map((item, index) => (
          <article key={item.title} className={`hd-thought-step ${index <= step ? 'active' : ''}`}>
            <strong>{item.title}</strong>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
      <div className="hd-result-grid">
        <div className="hd-refined-prompt"><div className="hd-source-head">精炼提示</div><p>{steps[Math.min(step, steps.length - 1)].text.replace('精炼提示：', '')}</p></div>
        <div className="hd-result-preview"><div className="hd-source-head">生成结果</div>{resultImageUrl ? <img src={resultImageUrl} alt="生成结果" loading="lazy" /> : <div className="hd-art hd-art-result" />}</div>
      </div>
    </Frame>
  );
}
