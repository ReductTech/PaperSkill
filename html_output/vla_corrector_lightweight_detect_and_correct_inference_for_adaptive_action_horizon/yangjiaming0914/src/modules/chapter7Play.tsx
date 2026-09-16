import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  ChipButton,
  COLORS,
  Feedback,
  useRememberedState,
} from './shared';

type Protocol = 'metaworld' | 'libero' | 'real';
const DATA = {
  metaworld: {
    title: 'MetaWorld', unit: '成功率（%）', note: '论文表 1：三个 VLA 骨干分别与各自基线比较，数值为四个难度划分的平均成功率。',
    groups: [
      { name: 'π0.5', values: [{ label: '基线', value: 48.70, color: COLORS.normal }, { label: '+ VLA-Corrector', value: 64.35, color: COLORS.recovery }] },
      { name: 'SmolVLA', values: [{ label: '基线', value: 61.90, color: COLORS.normal }, { label: '+ VLA-Corrector', value: 66.65, color: COLORS.recovery }] },
      { name: 'X-VLA', values: [{ label: '基线', value: 55.55, color: COLORS.normal }, { label: '+ VLA-Corrector', value: 59.60, color: COLORS.recovery }] },
    ],
  },
  libero: {
    title: 'LIBERO', unit: '成功率（%）', note: '三根独立柱对应不同训练条件，不能把 97.80 误写成“全文微调后的本文方法”。',
    groups: [
      { name: 'LIBERO', values: [{ label: 'Few-shot', value: 94.00, color: COLORS.normal }, { label: 'Full fine-tuned', value: 96.95, color: COLORS.prediction }, { label: 'Few-shot + VLA-Corrector', value: 97.80, color: COLORS.recovery }] },
    ],
  },
  real: {
    title: '实机 PiPER', unit: '成功率（%）', note: '论文表 5：每组 3 个任务、每个任务 20 次测试；“九项总体”和“扰动场景”按各自口径与基线比较。',
    groups: [
      { name: '九项总体', values: [{ label: '基线', value: 55.6, color: COLORS.normal }, { label: '+ VLA-Corrector', value: 73.3, color: COLORS.recovery }] },
      { name: '扰动场景', values: [{ label: '基线', value: 40.0, color: COLORS.normal }, { label: '+ VLA-Corrector', value: 68.3, color: COLORS.recovery }] },
    ],
  },
} as const;

export function ResultRace(_: WidgetProps) {
  const [protocol, setProtocol] = useRememberedState<Protocol>('result-race-protocol-v4', 'metaworld');
  const [activeGroup, setActiveGroup] = useRememberedState('result-active-group-v4', 0);
  const current = DATA[protocol];
  const chosen = current.groups[Math.min(activeGroup, current.groups.length - 1)];
  const gain = chosen.values.length === 2 ? chosen.values[1].value - chosen.values[0].value : chosen.values[2].value - chosen.values[0].value;
  return (
    <div className="v2-widget result-race evidence-notebook">
      <div className="mission-callout"><b>按协议查看结果：</b>选择实验协议，再点一组结果查看比较条件。所有条形都从 0 开始，不跨数据集排名。</div>
      <div className="scenario-tabs" role="tablist" aria-label="实验协议">
        {(['metaworld', 'libero', 'real'] as Protocol[]).map((key) => <button type="button" role="tab" aria-selected={protocol === key} className={protocol === key ? 'active' : ''} key={key} onClick={() => { setProtocol(key); setActiveGroup(0); }}>{DATA[key].title}</button>)}
      </div>
      <div className="result-title"><div><small>当前协议</small><h3>{current.title}</h3></div><b>{current.unit} · 0—100</b></div>
      <div className="result-axis" aria-hidden="true">{[0,25,50,75,100].map((tick) => <span key={tick} style={{ left: `${tick}%` }}>{tick}</span>)}</div>
      <div className="protocol-result-list">
        {current.groups.map((group, groupIndex) => (
          <button type="button" key={group.name} className={`protocol-result-group ${activeGroup === groupIndex ? 'active' : ''}`} onClick={() => setActiveGroup(groupIndex)}>
            <header><b>{group.name}</b>{group.values.length === 2 ? <em>+{(group.values[1].value - group.values[0].value).toFixed(2)} 个百分点</em> : <em>+{(group.values[2].value - group.values[0].value).toFixed(2)} vs Few-shot</em>}</header>
            {group.values.map((item) => <span className="result-bar-row" key={item.label}><i>{item.label}</i><span className="result-track"><span style={{ width: `${item.value}%`, background: item.color }} /></span><strong>{item.value.toFixed(2)}</strong></span>)}
          </button>
        ))}
      </div>
      <div className="result-focus"><span>正在读：{chosen.name}</span><b>{gain >= 0 ? '+' : ''}{gain.toFixed(2)} 个百分点</b></div>
      <Feedback tone="good">{current.note}</Feedback>
    </div>
  );
}

const SCENARIOS = [
  { id: 'move', title: '目标碗被移动，但仍在可达范围', answer: true, why: '视觉偏差可以被发现，冻结主干也具备朝新位置移动的动作能力。' },
  { id: 'blocked', title: '目标被完全遮挡，画面几乎没有可比较特征', answer: false, why: '严重遮挡或低对比度会削弱视觉检测，LVM 可能无法得到可靠方向。' },
  { id: 'force', title: '插接时摩擦突然增大，但画面变化很小', answer: false, why: '缺少力觉反馈时，接触与摩擦误差可能难以仅靠视觉发现。' },
  { id: 'reachable', title: '目标已不可达，或机械臂进入不利姿态', answer: false, why: 'Corrector 不能凭空创造冻结 VLA 从未掌握的恢复动作。' },
] as const;
const FIGURES = [
  { src: 'images/figure-3-system.png', title: '论文图 3 · 系统总览' },
  { src: 'images/figure-6-critical-phase.png', title: '论文图 6 · 关键阶段' },
  { src: 'images/figure-8-recovery.png', title: '论文图 8 · 恢复示例' },
] as const;
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export function DeploymentJudge(_: WidgetProps) {
  const [scenario, setScenario] = useRememberedState('deployment-judge-scenario', 0);
  const [guess, setGuess] = useRememberedState<boolean | null>('deployment-judge-guess', null);
  const [figure, setFigure] = useRememberedState('deployment-judge-figure', 0);
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const item = SCENARIOS[scenario];
  const chooseScenario = (index: number) => { setScenario(index); setGuess(null); };
  useEffect(() => {
    if (!open) return;
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); window.setTimeout(() => opener.current?.focus(), 0); } };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [open]);
  return (
    <div className="v2-widget deployment-judge">
      <div className="mission-callout"><b>别把“更鲁棒”理解成“什么都能救”：</b>选择一个场景，判断论文机制是否有合理恢复条件。</div>
      <div className="judge-layout">
        <nav className="scenario-list" aria-label="失败边界场景">{SCENARIOS.map((entry, index) => <button type="button" className={scenario === index ? 'active' : ''} key={entry.id} onClick={() => chooseScenario(index)}><span>{index + 1}</span>{entry.title}</button>)}</nav>
        <section className="judge-question" aria-live="polite"><small>场景 {scenario + 1}</small><h3>{item.title}</h3><p>你认为 VLA-Corrector 在这个条件下有合理机会恢复吗？</p><div><ChipButton selected={guess === true} onClick={() => setGuess(true)}>有机会</ChipButton><ChipButton selected={guess === false} onClick={() => setGuess(false)}>不能承诺</ChipButton></div>{guess !== null && <Feedback tone={guess === item.answer ? 'good' : 'bad'}>{guess === item.answer ? '判断合理。' : '再想想检测信号与主干能力的边界。'} {item.why}</Feedback>}</section>
      </div>
      <div className="cost-strip" aria-label="计算代价"><div><span>外置 Corrector</span><b>38–42M 参数</b></div><div><span>每步额外时延（总体）</span><b>约 7.93 ms</b></div><div><span>墙钟开销（总体）</span><b>约 1.64×</b></div><div><span>关键阶段截断</span><b>83.7%</b></div></div>
      <p className="cost-context">时延与墙钟数值来自 MetaWorld 默认设置下三个骨干的总体平均；83.7% 来自 MetaWorld 轨迹的关键阶段统计。它们不是所有部署环境的固定开销。</p>
      <details className="paper-evidence supplementary-evidence"><summary><span>补充实验：模块、容量与跨域迁移</span><small>这些结果用于界定提升来自哪里，以及它能否跨域泛化</small></summary><div className="supplement-grid"><article><b>组件消融</b><p>π0.5：基线 48.70 → 仅截断 60.35 → 截断 + OGG 64.35。</p><small>截断贡献主要提升，OGG 在此基础上继续改善恢复。</small></article><article><b>LVM 容量</b><p>10M：56.58；40M：64.35；160M：64.28。</p><small>40M 已达到最好平均结果，增大到 160M 没有继续提升。</small></article><article><b>跨域迁移</b><p>基线 48.7；LIBERO 训练 51.8；MetaWorld 训练 58.7。</p><small>存在有限迁移，但域匹配仍很重要，不能理解为无需目标域数据。</small></article></div></details>
      <details className="paper-evidence"><summary><span>论文原图证据</span><small>按“系统流程 / 关键阶段 / 恢复示例”切换查看，点击图片可放大</small></summary><div className="figure-tabs">{FIGURES.map((entry, index) => <button type="button" className={figure === index ? 'active' : ''} key={entry.title} onClick={() => setFigure(index)}>{entry.title}</button>)}</div><figure><button ref={opener} type="button" className="paper-image-button" onClick={() => setOpen(true)} aria-label={`放大${FIGURES[figure].title}`}><img src={asset(FIGURES[figure].src)} alt={FIGURES[figure].title} /><span>点击放大</span></button><figcaption><b>{FIGURES[figure].title}</b><span>这是论文原图的局部裁剪，用于与本页教学动画相互核对，不作为独立实验比较。</span></figcaption></figure></details>
      <section className="final-story-summary" aria-label="VLA-Corrector核心故事总结"><p><b>最后把全文收成一条线：</b>它不是替 VLA 重新学习一个万能策略，而是在执行期间发现旧动作何时不再可信。</p><div><article><span>01</span><b>预测并监控</b><small>Corrector 预测动作应造成的视觉变化，LVM 与真实变化比较。</small></article><i>→</i><article><span>02</span><b>截断并纠正</b><small>持续异常才截断旧队列，并为下一次 VLA 调用开启一次 OGG。</small></article><i>→</i><article><span>03</span><b>恢复普通推理</b><small>新动作块生成后关闭 OGG；恢复能力仍受视觉、可达性和主干能力限制。</small></article></div></section>
      {open && <div className="image-lightbox" role="dialog" aria-modal="true" aria-label={FIGURES[figure].title} onClick={() => setOpen(false)}><button type="button" onClick={() => setOpen(false)} aria-label="关闭放大图">关闭</button><img src={asset(FIGURES[figure].src)} alt={FIGURES[figure].title} onClick={(event) => event.stopPropagation()} /></div>}
    </div>
  );
}
