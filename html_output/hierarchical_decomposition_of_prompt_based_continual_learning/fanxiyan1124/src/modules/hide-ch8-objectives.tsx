import React, { useEffect, useState, type ReactNode } from 'react';
import {
  HideBadge,
  HideFormula,
  HideKeyValue,
  HideNote,
  HidePanel,
  HideScene,
  HideSegment,
  HideSymbol,
  type HideTone,
} from './hide-kit';

type StageId = 'naive' | 'wtp' | 'tii' | 'tap' | 'cr';
type ObjectiveId = 'wtp' | 'tii' | 'tap' | 'cr';

type Stage = {
  id: StageId;
  label: string;
  title: string;
  summary: string;
  objectives: ObjectiveId[];
  affected: string;
  closedPath: string;
  tone: HideTone;
};

type Objective = {
  id: ObjectiveId;
  code: string;
  title: string;
  target: string;
  owner: string;
  path: string;
  tone: HideTone;
};

const STAGES: Stage[] = [
  {
    id: 'naive',
    label: 'Naive',
    title: '只有冻结架构',
    summary: '显示冻结主干和类别出口，但没有显式的持续训练闭环。',
    objectives: [],
    affected: '无持续训练目标',
    closedPath: '当前任务 → 冻结光路 → 输出',
    tone: 'neutral',
  },
  {
    id: 'wtp',
    label: 'WTP',
    title: '先完成当前任务',
    summary: '用当前任务的受提示表征计算 WTP 交叉熵，轻量更新当前提示和类别输出。',
    objectives: ['wtp'],
    affected: 'eₜ / pₜ、ψ',
    closedPath: '当前受提示表征 → L_CE → ψ',
    tone: 'orange',
  },
  {
    id: 'tii',
    label: '+TII',
    title: '补上任务身份闭环',
    summary: '从未受提示伪表征持续训练 ω，让已见任务之间保持可判别。',
    objectives: ['wtp', 'tii'],
    affected: 'ω；TII 统计档案提供平衡伪表征',
    closedPath: '未受提示伪表征 → ω → 任务身份',
    tone: 'green',
  },
  {
    id: 'tap',
    label: '+TAP',
    title: '让全类输出同时闭环',
    summary: '把全部已见类的受提示伪表征送入共享 ψ，直接优化跨任务类别预测。',
    objectives: ['wtp', 'tii', 'tap'],
    affected: 'ψ；TAP 统计档案提供全类伪表征',
    closedPath: '全部已见受提示伪表征 → ψ → 全类 logits',
    tone: 'blue',
  },
  {
    id: 'cr',
    label: '+CR',
    title: '再收紧 WTP 表征空间',
    summary: '把对比正则加入 WTP 目标，让当前受提示表征与旧类统计更兼容；其他目标仍分别计算。',
    objectives: ['wtp', 'tii', 'tap', 'cr'],
    affected: 'pₜ 的 WTP 表征空间；主设置 λ=0.1',
    closedPath: '当前受提示表征 ↔ 旧类记录 → L_CR → WTP',
    tone: 'purple',
  },
];

const OBJECTIVES: Objective[] = [
  {
    id: 'wtp',
    code: 'WTP',
    title: '任务内预测',
    target: '当前任务内的具体类别',
    owner: '当前提示 + ψ',
    path: '当前受提示表征 → ψ',
    tone: 'orange',
  },
  {
    id: 'tii',
    code: 'TII',
    title: '任务身份推断',
    target: '已见任务集合中的任务身份',
    owner: 'ω',
    path: '未受提示伪表征 → ω',
    tone: 'green',
  },
  {
    id: 'tap',
    code: 'TAP',
    title: '任务自适应预测',
    target: '全部已见类别',
    owner: 'ψ',
    path: '全部受提示伪表征 → ψ',
    tone: 'blue',
  },
  {
    id: 'cr',
    code: 'CR',
    title: '对比正则',
    target: '旧类兼容的 WTP 表征空间',
    owner: '当前提示的表征',
    path: '当前表征 ↔ 旧类统计',
    tone: 'purple',
  },
];

function objectiveFormula(id: ObjectiveId): ReactNode {
  if (id === 'wtp') {
    return (
      <>
        <HideSymbol symbol="L_WTP" meaning="任务内预测目标" />(
        <HideSymbol symbol="ψ" meaning="类别输出层参数" />, <HideSymbol symbol="pₜ" meaning="当前提示集成结果" />)
        = <HideSymbol symbol="L_CE" meaning="交叉熵损失" />
      </>
    );
  }
  if (id === 'tii') {
    return (
      <>
        <HideSymbol symbol="L_TII" meaning="任务身份推断目标" />(
        <HideSymbol symbol="ω" meaning="任务身份推断头参数" />) = CE(
        <HideSymbol symbol="ω(fθ(x_u))" meaning="任务头对未受提示伪表征的输出" />, i)
      </>
    );
  }
  if (id === 'tap') {
    return (
      <>
        <HideSymbol symbol="L_TAP" meaning="任务自适应预测目标" />(
        <HideSymbol symbol="ψ" meaning="与 WTP 共用的类别输出层参数" />) = CE(
        <HideSymbol symbol="ψ(fθ(x;pᵢ))" meaning="共享输出层对受提示伪表征的全类输出" />, y)
      </>
    );
  }
  return (
    <>
      <HideSymbol symbol="L_CR" meaning="对比正则项" />(
      <HideSymbol symbol="pₜ" meaning="被正则化的当前提示表征空间" />)；主设置{' '}
      <HideSymbol symbol="λ" meaning="对比正则权重" /> = 0.1
    </>
  );
}

export function HideCh8Objectives() {
  const [stageIndex, setStageIndex] = useState(0);
  const stage = STAGES[stageIndex];
  const activeObjectives = OBJECTIVES.filter((objective) => stage.objectives.includes(objective.id));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < STAGES.length) {
        event.preventDefault();
        setStageIndex(index);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <HideScene chapter="暗房架 08B · 训练闭环" cue="共享参数，分别计算目标" tone={stage.tone}>
      <div className="hide-grid hide-ch8-layout hide-ch8-objectives-layout">
        <HidePanel
          title="选择目标组合"
          meta={`${stage.label} · 按键 1-5`}
          tone={stage.tone}
          className="hide-ch8-objective-map"
        >
          <HideSegment
            value={stage.id}
            options={STAGES.map((item, index) => ({
              value: item.id,
              label: `${index + 1} ${item.label}`,
              note: item.title,
            }))}
            onChange={(id) => {
              const index = STAGES.findIndex((item) => item.id === id);
              if (index >= 0) setStageIndex(index);
            }}
            label="选择训练目标组合"
          />

          <div className="hide-ch8-stage-track" aria-hidden="true">
            {STAGES.map((item, index) => (
              <div
                key={item.id}
                className={
                  index === stageIndex
                    ? 'hide-ch8-stage-tick hide-ch8-is-active'
                    : index < stageIndex
                      ? 'hide-ch8-stage-tick hide-ch8-is-past'
                      : 'hide-ch8-stage-tick'
                }
              >
                <span>{index + 1}</span>
                <b>{item.label}</b>
              </div>
            ))}
          </div>

          <div className="hide-ch8-objective-cards" aria-label="四个目标">
            {OBJECTIVES.map((objective) => {
              const active = stage.objectives.includes(objective.id);
              return (
                <article
                  key={objective.id}
                  className={
                    active
                      ? `hide-ch8-objective-card hide-ch8-objective-${objective.id} hide-ch8-is-active`
                      : `hide-ch8-objective-card hide-ch8-objective-${objective.id}`
                  }
                  aria-label={`${objective.code} ${objective.title}，${active ? '已启用' : '未启用'}`}
                >
                  <div className="hide-ch8-objective-head">
                    <span>{objective.code}</span>
                    <HideBadge tone={active ? objective.tone : 'neutral'}>{active ? '启用' : '未启用'}</HideBadge>
                  </div>
                  <h4>{objective.title}</h4>
                  <p>{objective.target}</p>
                  <footer>
                    <span>{objective.owner}</span>
                    <b>{objective.path}</b>
                  </footer>
                </article>
              );
            })}
          </div>

          <div className="hide-ch8-closed-paths" aria-label="当前启用的闭环路径">
            {activeObjectives.length > 0 ? (
              activeObjectives.map((objective) => (
                <div key={objective.id} className={`hide-ch8-closed-path hide-ch8-path-${objective.id}`}>
                  <span>{objective.code}</span>
                  <strong>{objective.path}</strong>
                  <em>{objective.owner}</em>
                </div>
              ))
            ) : (
              <div className="hide-ch8-closed-path hide-ch8-closed-path-empty">
                <span>基线</span>
                <strong>尚未闭合显式层级目标</strong>
                <em>Naive</em>
              </div>
            )}
          </div>
        </HidePanel>

        <div className="hide-side-stack hide-ch8-objective-detail">
          <HidePanel title={stage.title} meta={stage.label} tone={stage.tone}>
            <div aria-live="polite" className="hide-ch8-stage-detail">
              <p>{stage.summary}</p>
              <HideKeyValue label="当前组合" value={stage.label} note={stage.title} />
              <HideKeyValue label="受影响参数" value={stage.affected} />
              <HideKeyValue label="闭环边界" value={stage.closedPath} />
            </div>
          </HidePanel>

          <HidePanel title="当前分别计算的目标" meta="非单一总损失" tone={stage.tone}>
            <div className="hide-ch8-formula-stack" aria-live="polite">
              {activeObjectives.length > 0 ? (
                <>
                  {activeObjectives.map((objective) => (
                    <HideFormula
                      key={objective.id}
                      lead={objective.code}
                      note={
                        objective.id === 'wtp' && stage.id === 'cr'
                          ? '仅 WTP 目标追加 λL_CR；TII 与 TAP 保持独立。'
                          : objective.id === 'wtp'
                            ? '当前任务的类别交叉熵。'
                            : objective.id === 'tii'
                              ? '只在已见任务上训练任务头。'
                              : objective.id === 'tap'
                                ? '与 WTP 共用 ψ，但单独计算。'
                                : '只作用于 WTP 表征空间。'
                      }
                    >
                      {objectiveFormula(objective.id)}
                    </HideFormula>
                  ))}
                  {stage.id === 'cr' ? (
                    <HideFormula
                      lead="WTP + CR"
                      note="追加项只进入 WTP，不把四个目标汇成一个损失。"
                    >
                      <HideSymbol symbol="L_WTP" meaning="加入对比正则后的任务内预测目标" /> ={' '}
                      <HideSymbol symbol="L_CE" meaning="类别交叉熵项" /> +{' '}
                      <HideSymbol symbol="λ" meaning="对比正则权重，主设置为 0.1" />
                      <HideSymbol symbol="L_CR" meaning="对比正则项，只修改 WTP 表征空间" />
                    </HideFormula>
                  ) : null}
                </>
              ) : (
                <div className="hide-ch8-empty-formula">Naive：没有显式层级目标。</div>
              )}
            </div>
          </HidePanel>

          <HideNote title="共同参数，不是一个总损失" tone="purple">
            ψ 同时参与 WTP 与 TAP，ω 只在已见任务上判别类别外的任务身份；CR 只进入 WTP 目标。三者共享轻量参数，但分别计算损失。
          </HideNote>
        </div>
      </div>
    </HideScene>
  );
}
