import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Tier = 'tiny' | 'small' | 'medium';
type Task = 'detection' | 'recognition';
type CompareMode = 'single' | 'tiers' | 'tasks';
type ComponentKey = 'replkfpn' | 'lightsvtr' | 'ctc';

interface TierInfo {
  name: string;
  total: string;
  totalValue: number;
  det: string;
  detValue: number;
  rec: string;
  recValue: number;
  languages: number;
  capacity: string;
  recNeck: string;
}

interface StageConfig {
  input: string;
  stages: Array<{ name: string; depth: number; width: number }>;
}

const TIER_ORDER: Tier[] = ['tiny', 'small', 'medium'];

const TIERS: Record<Tier, TierInfo> = {
  tiny: {
    name: 'Tiny', total: '≈1.5M', totalValue: 1.5, det: '0.43M', detValue: 0.43,
    rec: '1.1M', recValue: 1.1, languages: 49, capacity: '极致容量 / 边缘友好', recNeck: 'Reshape + FC',
  },
  small: {
    name: 'Small', total: '≈7.7M', totalValue: 7.7, det: '2.48M', detValue: 2.48,
    rec: '5.2M', recValue: 5.2, languages: 50, capacity: '中间容量折中', recNeck: 'LightSVTR',
  },
  medium: {
    name: 'Medium', total: '34.5M', totalValue: 34.5, det: '15.5M', detValue: 15.5,
    rec: '19M', recValue: 19, languages: 50, capacity: '更高容量 / server-oriented', recNeck: 'LightSVTR',
  },
};

const STAGES: Record<Task, Record<Tier, StageConfig>> = {
  detection: {
    tiny: { input: 'Stem 16', stages: [{ name: 'S1', depth: 2, width: 16 }, { name: 'S2', depth: 3, width: 32 }, { name: 'S3', depth: 5, width: 64 }, { name: 'S4', depth: 3, width: 160 }] },
    small: { input: 'Stem 48', stages: [{ name: 'S1', depth: 2, width: 48 }, { name: 'S2', depth: 3, width: 96 }, { name: 'S3', depth: 5, width: 192 }, { name: 'S4', depth: 3, width: 384 }] },
    medium: { input: 'Stem 128', stages: [{ name: 'S1', depth: 2, width: 128 }, { name: 'S2', depth: 3, width: 256 }, { name: 'S3', depth: 5, width: 512 }, { name: 'S4', depth: 3, width: 896 }] },
  },
  recognition: {
    tiny: { input: 'Simple 48', stages: [{ name: 'S1', depth: 1, width: 48 }, { name: 'S2', depth: 1, width: 48 }, { name: 'S3', depth: 3, width: 96 }, { name: 'S4', depth: 4, width: 160 }] },
    small: { input: 'Branch 96', stages: [{ name: 'S1', depth: 1, width: 96 }, { name: 'S2', depth: 2, width: 96 }, { name: 'S3', depth: 7, width: 192 }, { name: 'S4', depth: 3, width: 384 }] },
    medium: { input: 'Branch 128', stages: [{ name: 'S1', depth: 1, width: 128 }, { name: 'S2', depth: 3, width: 256 }, { name: 'S3', depth: 7, width: 512 }, { name: 'S4', depth: 3, width: 768 }] },
  },
};

const COMPONENTS: Record<ComponentKey, { label: string; statuses: Record<Tier, string>; note: string }> = {
  replkfpn: { label: 'RepLKFPN', statuses: { tiny: '保留', small: '保留', medium: '保留' }, note: '三档 Detection Model 都采用 RepLKFPN 设计。' },
  lightsvtr: { label: 'LightSVTR', statuses: { tiny: '不使用', small: '保留', medium: '保留' }, note: 'Tiny Recognition 改走 Reshape + FC；Small / Medium 使用 LightSVTR。' },
  ctc: { label: 'CTC', statuses: { tiny: '保留', small: '保留', medium: '保留' }, note: '三档部署识别路径都以 CTC Head 输出文字。' },
};

function TierSelector({ tier, setTier, label = '选择模型档位' }: { tier: Tier; setTier: (tier: Tier) => void; label?: string }) {
  return (
    <div className="r9-tier-selector" role="group" aria-label={label}>
      {TIER_ORDER.map((key) => (
        <button type="button" key={key} className={tier === key ? 'selected' : ''} aria-pressed={tier === key} onClick={() => setTier(key)}>
          <span>{TIERS[key].name}</span><strong>{TIERS[key].total}</strong><small>{TIERS[key].capacity}</small>
        </button>
      ))}
    </div>
  );
}

function MiniBackbone({ tier, task }: { tier: Tier; task: Task }) {
  const config = STAGES[task][tier];
  return (
    <div className="r9-mini-backbone" title={`${config.input}；${config.stages.map((stage) => `${stage.name} ${stage.depth}×${stage.width}`).join('，')}`}>
      <strong>LCNetV4_{task === 'detection' ? 'det' : 'rec'}</strong>
      <span>{config.input}</span>
      <div>{config.stages.map((stage) => <i key={stage.name} style={{ flexGrow: stage.width }}>{stage.name}<small>{stage.depth}×{stage.width}</small></i>)}</div>
    </div>
  );
}

export const Ch8Architecture: React.FC<WidgetProps> = () => {
  const [tier, setTier] = useState<Tier>('small');
  const [component, setComponent] = useState<ComponentKey>('lightsvtr');
  const current = TIERS[tier];
  const totalScale = 30 + (current.totalValue / TIERS.medium.totalValue) * 70;

  return (
    <div className={`r9-system-lab r9-tier-${tier}`}>
      <div className="r9-capacity-ruler" aria-hidden="true"><span>Capacity</span><i /><small>Light</small><small>Heavy</small></div>
      <TierSelector tier={tier} setTier={setTier} />
      <p className="r9-tier-boundary"><strong>不是统一比例缩放。</strong>每个 tier、每个 task 都有独立的 depth / width configuration。</p>

      <section className="r9-deployment-pipeline" aria-label={`${current.name} 完整 OCR 部署流水线`}>
        <header><span>Inference / Deployment</span><strong>两套模型串联，不共享一次运行时 Backbone</strong></header>
        <div className="r9-pipeline-source"><strong>Full Image</strong><small>完整页面</small></div>
        <b className="r9-down-arrow">↓</b>

        <div className="r9-model-lane r9-det-lane">
          <header><span>Detection Model</span><strong>{current.det}</strong><small>independent LCNetV4 configuration</small></header>
          <div className="r9-model-path">
            <MiniBackbone tier={tier} task="detection" /><b>→</b><span>RepLKFPN</span><b>→</b><span>DB Head</span><b>→</b><em>Text Boxes</em>
          </div>
        </div>

        <div className="r9-crop-bridge"><span>Text Boxes</span><b>↓</b><strong>Crop &amp; Resize</strong><b>↓</b><span>Text Crop</span></div>

        <div className="r9-model-lane r9-rec-lane">
          <header><span>Recognition Model</span><strong>{current.rec}</strong><small>another task-specific LCNetV4 configuration</small></header>
          <div className="r9-model-path">
            <MiniBackbone tier={tier} task="recognition" /><b>→</b>
            <div className="r9-neck-slot">
              <span className="active">{current.recNeck}</span>
              <span className="absent">{tier === 'tiny' ? 'LightSVTR ×' : 'Reshape + FC · Tiny only'}</span>
            </div>
            <b>→</b><span>CTC Head</span><b>→</b><em>Text</em>
          </div>
        </div>
      </section>

      <section className="r9-parameter-split" aria-label={`${current.name} 参数拆分`}>
        <header><span>Table 2 · Full model params</span><strong>End-to-end 参数 = Detection Model + Recognition Model</strong></header>
        <div className="r9-param-equation">
          <div><span>Detection Model</span><strong>{current.det}</strong><small>backbone + neck + head</small></div><b>+</b>
          <div><span>Recognition Model</span><strong>{current.rec}</strong><small>backbone + neck + head</small></div><b>=</b>
          <div className="total"><span>End-to-end system</span><strong>{current.total}</strong><small>两个完整模型的合计</small></div>
        </div>
        <div className="r9-total-track"><div style={{ width: `${totalScale}%` }}><i style={{ flexGrow: current.detValue }}>Det {current.det}</i><i style={{ flexGrow: current.recValue }}>Rec {current.rec}</i></div></div>
        <small className="r9-bar-note">条形长度只帮助观察容量档位；精确值以标签为准，不表示性能排名。</small>
      </section>

      <div className="r9-tier-metrics">
        <div><span>End-to-end params</span><strong>{current.total}</strong></div>
        <div><span>Detection params</span><strong>{current.det}</strong></div>
        <div><span>Recognition params</span><strong>{current.rec}</strong></div>
        <div><span>Recognition neck</span><strong>{current.recNeck}</strong></div>
        <div><span>Languages</span><strong>{current.languages}{tier === 'tiny' ? ' · no Japanese' : ''}</strong></div>
      </div>

      <section className="r9-component-check">
        <header><strong>组件状态</strong><span>切换档位是主操作；这里仅核对组件是否存在。</span></header>
        <div className="r9-component-tabs" role="group" aria-label="查看组件在三档中的状态">
          {(Object.keys(COMPONENTS) as ComponentKey[]).map((key) => <button type="button" key={key} className={component === key ? 'selected' : ''} aria-pressed={component === key} onClick={() => setComponent(key)}>{COMPONENTS[key].label}</button>)}
        </div>
        <div className="r9-component-status" aria-live="polite">
          {TIER_ORDER.map((key) => <div key={key} className={COMPONENTS[component].statuses[key] === '不使用' ? 'absent' : ''}><span>{TIERS[key].name}</span><strong>{COMPONENTS[component].statuses[key]}</strong></div>)}
          <p>{COMPONENTS[component].note}</p>
        </div>
      </section>
    </div>
  );
};

function StageCard({ task, tier, title }: { task: Task; tier: Tier; title?: string }) {
  const config = STAGES[task][tier];
  return (
    <article className="r9-stage-card">
      <header><span>{title ?? TIERS[tier].name}</span><strong>{task === 'detection' ? 'Detection' : 'Recognition'}</strong><small>{config.input}</small></header>
      <div className="r9-stage-rows">
        {config.stages.map((stage) => (
          <div className="r9-stage-row" key={stage.name} title={`${stage.name}: depth ${stage.depth}，width ${stage.width}`}>
            <strong>{stage.name}</strong>
            <div className="r9-depth-blocks" aria-label={`depth ${stage.depth}`}>{Array.from({ length: stage.depth }, (_, index) => <i key={index} />)}</div>
            <div className="r9-width-track"><span style={{ width: `${28 + (stage.width / 896) * 72}%` }} /></div>
            <code>{stage.depth} × {stage.width}</code>
          </div>
        ))}
      </div>
    </article>
  );
}

export const TierStageExplorer: React.FC<WidgetProps> = () => {
  const [tier, setTier] = useState<Tier>('medium');
  const [task, setTask] = useState<Task>('detection');
  const [mode, setMode] = useState<CompareMode>('single');

  return (
    <div className="r9-stage-lab">
      <div className="r9-stage-controls">
        <TierSelector tier={tier} setTier={(next) => { setTier(next); setMode('single'); }} label="Stage Explorer 模型档位" />
        <div className="r9-task-tabs" role="group" aria-label="选择 Detection 或 Recognition 配置">
          <button type="button" className={task === 'detection' ? 'selected' : ''} aria-pressed={task === 'detection'} onClick={() => { setTask('detection'); setMode('single'); }}>Detection</button>
          <button type="button" className={task === 'recognition' ? 'selected' : ''} aria-pressed={task === 'recognition'} onClick={() => { setTask('recognition'); setMode('single'); }}>Recognition</button>
        </div>
      </div>

      <div className="r9-compare-tabs" role="group" aria-label="选择 Stage 对比方式">
        <button type="button" className={mode === 'single' ? 'selected' : ''} aria-pressed={mode === 'single'} onClick={() => setMode('single')}>单档配置</button>
        <button type="button" className={mode === 'tiers' ? 'selected' : ''} aria-pressed={mode === 'tiers'} onClick={() => setMode('tiers')}>Small vs Medium</button>
        <button type="button" className={mode === 'tasks' ? 'selected' : ''} aria-pressed={mode === 'tasks'} onClick={() => setMode('tasks')}>Medium Det vs Rec</button>
      </div>

      <div className={`r9-stage-canvas r9-mode-${mode}`} aria-live="polite">
        {mode === 'single' ? <StageCard task={task} tier={tier} /> : null}
        {mode === 'tiers' ? <><StageCard task={task} tier="small" /><StageCard task={task} tier="medium" /></> : null}
        {mode === 'tasks' ? <><StageCard task="detection" tier="medium" title="Medium Det" /><StageCard task="recognition" tier="medium" title="Medium Rec" /></> : null}
      </div>

      <div className="r9-stage-legend"><span><i className="depth" />Depth = 重复 block 数</span><span><i className="width" />Width = channel 数</span><small>每行的“depth × width”来自 Table 2；图形宽度用于辅助比较。</small></div>
      <div className="r9-stage-conclusion">
        <strong>{mode === 'single' ? `${TIERS[tier].name} ${task === 'detection' ? 'Detection' : 'Recognition'} 使用显式逐 stage 配置。` : mode === 'tiers' ? 'Small → Medium 不是统一 width multiplier。' : '同一个 Medium，Detection 与 Recognition 也不是同一配置。'}</strong>
        <span>{mode === 'single' ? '切换 tier 或 task，depth、width 与 input configuration 会分别变化。' : mode === 'tiers' ? (task === 'detection' ? 'Detection 的 stage depth 相同，但各 stage 的 channel 增长比例并不统一。' : 'Recognition 的 S2 depth 也发生变化，各 stage 的 width 增长比例同样不同。') : '两者共享 LCNetV4 block primitive，但使用不同的 depth、width、stride 与输出接口。'}</span>
      </div>
      <p className="r9-linkback">§3 已解释 Det / Rec 的 stride 差异；这里进一步看到两者的 stage depth / width 也分别配置。</p>
    </div>
  );
};

export const TierLanguageTradeoffs: React.FC<WidgetProps> = () => {
  const [languageTier, setLanguageTier] = useState<Tier>('tiny');
  const [showJapaneseReason, setShowJapaneseReason] = useState(false);

  return (
    <div className="r9-tradeoff-lab">
      <section className="r9-language-section">
        <header><span>Language Coverage · Table 10</span><strong>字典规模也是轻量化变量</strong></header>
        <div className="r9-language-grid" role="group" aria-label="选择模型查看语言覆盖">
          {TIER_ORDER.map((key) => (
            <button type="button" key={key} className={languageTier === key ? 'selected' : ''} aria-pressed={languageTier === key} onClick={() => setLanguageTier(key)}>
              <span>{TIERS[key].name}</span><strong>{TIERS[key].languages}</strong><small>{key === 'tiny' ? 'smaller dictionary · no Japanese' : 'languages'}</small>
            </button>
          ))}
        </div>
        <div className="r9-language-detail" aria-live="polite">
          <div><span>{TIERS[languageTier].name} Recognition</span><strong>{TIERS[languageTier].languages} languages</strong><p>{languageTier === 'tiny' ? 'Tiny 为控制 1.1M Recognition Model 的输出层规模，使用更小字符字典并省略 Japanese。' : 'Small / Medium 使用完整的 50-language dictionary。'}</p></div>
          {languageTier === 'tiny' ? <button type="button" aria-expanded={showJapaneseReason} onClick={() => setShowJapaneseReason((value) => !value)}>为什么 Tiny 少 1 种？</button> : null}
        </div>
        {showJapaneseReason && languageTier === 'tiny' ? (
          <div className="r9-vocab-explanation visible">
            <code>Output Head ∝ hidden_dim × vocab_size</code><b>+</b><span>约 4,000 个 Japanese Kanji / Kana entries</span><b>→</b><strong>输出分类层明显扩大</strong>
            <p>论文没有给出这里的精确参数增量；结论只到“大字典会对 1.1M Tiny 输出层造成不成比例的容量压力”。</p>
          </div>
        ) : null}
        <div className="r9-training-note"><span>Training-only note</span><strong>Tiny 训练时使用 vocabulary-matched Medium Teacher。</strong><a href="#r8-map">已在 §8 解释</a></div>
      </section>

      <section className="r9-config-summary">
        <header><span>Table 2 摘要</span><strong>参数属于两个完整模型，不是一份共享权重</strong></header>
        <div className="r9-summary-table" role="table" aria-label="三档参数、识别 neck 与语言覆盖摘要">
          <div role="row" className="head"><span>Tier</span><span>Det</span><span>Rec</span><span>Total</span><span>Rec neck</span><span>Languages</span></div>
          {TIER_ORDER.map((key) => <div role="row" key={key}><strong>{TIERS[key].name}</strong><span>{TIERS[key].det}</span><span>{TIERS[key].rec}</span><span>{TIERS[key].total}</span><span>{TIERS[key].recNeck}</span><span>{TIERS[key].languages}{key === 'tiny' ? ' · no JP' : ''}</span></div>)}
        </div>
      </section>

      <section className="r9-shared-specific">
        <div><span>Shared design</span><strong>真正共享什么？</strong><ul><li>LCNetV4 block primitives / design family</li><li>Detection → crop → Recognition 的整体 pipeline</li><li>RepLKFPN detection design</li><li>CTC inference head</li></ul></div>
        <div><span>Tier / task specific</span><strong>什么会主动改变？</strong><ul><li>LCNetV4 stage depth 与 channel width</li><li>Detection / Recognition stride 与 input config</li><li>Recognition neck</li><li>Dictionary size / language coverage</li><li>Det、Rec 与 end-to-end 参数量</li></ul></div>
      </section>

      <div className="r9-final-takeaway"><strong>统一设计不等于统一尺寸</strong><span>PP-OCRv6 的统一来自共同的 block primitive 与工程接口；可缩放来自针对每个任务、每个 tier 独立配置 depth、width、neck 和 vocabulary。</span></div>
    </div>
  );
};
