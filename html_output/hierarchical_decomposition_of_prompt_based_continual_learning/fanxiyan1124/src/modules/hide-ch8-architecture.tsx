import React, { useEffect, useState, type ReactNode } from 'react';
import {
  HideBadge,
  HideKeyValue,
  HideNote,
  HidePanel,
  HideScene,
  HideSegment,
  HideStat,
  HideSymbol,
  type HideTone,
} from './hide-kit';

type PartId = 'backbone' | 'prompt' | 'taskHead' | 'outputHead' | 'tiiStats' | 'tapStats';

type OwnershipPart = {
  id: PartId;
  kicker: string;
  title: string;
  symbol: ReactNode;
  state: string;
  stateTone: HideTone;
  upstream: ReactNode;
  downstream: ReactNode;
  lock: string;
  storage: string;
  detail: ReactNode;
  tone: HideTone;
};

const PARTS: OwnershipPart[] = [
  {
    id: 'backbone',
    kicker: '共享负片光路',
    title: '冻结 ViT 主干',
    symbol: <HideSymbol symbol="fθ" meaning="冻结的视觉 Transformer 主干" />,
    state: '全程冻结',
    stateTone: 'blue',
    upstream: '输入图像 x，并由当前任务提示给出显影条件。',
    downstream: (
      <>
        同时产生未受提示表征 <HideSymbol symbol="fθ(x)" meaning="不使用任务提示时的主干表征" /> 与受提示表征{' '}
        <HideSymbol symbol="fθ(x;pᵢ)" meaning="使用任务 i 提示后的主干表征" />。
      </>
    ),
    lock: '所有任务共享同一组主干参数，不随任务更新。',
    storage: '不保存旧任务图片，也不复制多份主干。',
    detail: '冻结不等于静止：提示像显影条件一样改变同一负片的输出，但底片本身的参数不变。',
    tone: 'blue',
  },
  {
    id: 'prompt',
    kicker: '任务曝光控制',
    title: '旧提示与当前提示',
    symbol: <HideSymbol symbol="pₜ" meaning="第 t 个任务使用的提示集成结果" />,
    state: '旧提示冻结 · 当前提示训练',
    stateTone: 'orange',
    upstream: (
      <>
        当前提示 <HideSymbol symbol="eₜ" meaning="当前任务的可训练提示参数" /> 从上一任务提示初始化，再与全部旧提示混合。
      </>
    ),
    downstream: '作为冻结主干的显影条件，控制受提示表征。',
    lock: '已结束任务的提示 e₁…eₜ₋₁ 冻结；只有当前 eₜ 继续轻量更新。',
    storage: '每个已见任务保留一条提示底片，供后续提示集成使用。',
    detail: (
      <>
        旧提示锁定后仍可参与 <HideSymbol symbol="pₜ" meaning="由旧提示与当前提示混合得到的提示" /> 的构造；被训练的是当前任务的新曝光，而不是重写整个提示柜。
      </>
    ),
    tone: 'orange',
  },
  {
    id: 'taskHead',
    kicker: '先定位任务行',
    title: '任务头 ω',
    symbol: <HideSymbol symbol="ω" meaning="任务身份推断头参数" />,
    state: '轻量训练',
    stateTone: 'green',
    upstream: (
      <>
        未受提示表征 <HideSymbol symbol="fθ(x)" meaning="用于任务身份推断的未受提示表征" />；训练时还使用 TII 统计档案生成的平衡伪表征。
      </>
    ),
    downstream: '只在已见任务集合上给出任务身份，不知道类别格。',
    lock: '不锁死；每个任务都适配，但仍属于轻量任务头。',
    storage: '保存 ω 参数，不保存回放样本。',
    detail: 'ω 的目标是选对任务提示。它的输出是任务身份分布，不能当作最终类别准确率。',
    tone: 'green',
  },
  {
    id: 'outputHead',
    kicker: '共享类别出口',
    title: '输出头 ψ',
    symbol: <HideSymbol symbol="ψ" meaning="任务内预测与任务自适应预测共用的输出层参数" />,
    state: '轻量训练',
    stateTone: 'orange',
    upstream: (
      <>
        当前任务的受提示表征供 WTP 使用；全部已见类的受提示伪表征供 <HideSymbol symbol="TAP" meaning="任务自适应预测" /> 使用。
      </>
    ),
    downstream: '在任务类别内输出 WTP logits，也能在全部已见类上执行 TAP。',
    lock: '不锁死；随任务轻量更新，并同时服务两条输出路径。',
    storage: '保存共享 ψ 参数，不保存类别样本。',
    detail: 'ψ 是两条目标的共同参数，不是同一个总损失：WTP 与 TAP 分别构造交叉熵目标。',
    tone: 'orange',
  },
  {
    id: 'tiiStats',
    kicker: '未显影档案',
    title: 'TII 表征统计',
    symbol: <span>TII stats</span>,
    state: '任务末更新 · 冻结统计',
    stateTone: 'purple',
    upstream: (
      <>
        本任务各类别的未受提示表征 <HideSymbol symbol="fθ(x)" meaning="用于生成 TII 统计的未受提示表征" />。
      </>
    ),
    downstream: '按类别平衡生成伪表征，用于持续训练任务头 ω。',
    lock: '任务结束后不再改统计；旧任务统计供后续任务使用。',
    storage: '默认保存每个类别的均值与协方差；可选方差或约五个 KNN 中心。',
    detail: '档案里是可采样统计，不是旧照片。TII 伪表征从每个类别的统计分布中平衡抽取。',
    tone: 'purple',
  },
  {
    id: 'tapStats',
    kicker: '显影后档案',
    title: 'TAP 表征统计',
    symbol: <span>TAP stats</span>,
    state: '任务末更新 · 冻结统计',
    stateTone: 'green',
    upstream: (
      <>
        本任务各类别的受提示表征 <HideSymbol symbol="fθ(x;pᵢ)" meaning="使用对应任务提示后的受提示表征" />。
      </>
    ),
    downstream: '按类别平衡生成受提示伪表征，用于共享输出层 ψ 的 TAP 目标。',
    lock: '任务结束后冻结统计，旧任务无需重新编码。',
    storage: '保存受提示表征的紧凑类别统计；默认均值与协方差，不存原图。',
    detail: 'TAP 统计描述“照片显影后”的类别位置，供共享输出层在全部已见类之间比较。',
    tone: 'green',
  },
];

export function HideCh8Architecture() {
  const [selected, setSelected] = useState(0);
  const part = PARTS[selected];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < PARTS.length) {
        event.preventDefault();
        setSelected(index);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const selectPart = (id: PartId) => {
    const index = PARTS.findIndex((item) => item.id === id);
    if (index >= 0) setSelected(index);
  };

  return (
    <HideScene chapter="暗房架 08A · 所有权光路" cue="负片冻结，显影控制轻量更新" tone={part.tone}>
      <div className="hide-grid hide-ch8-layout hide-ch8-architecture-layout">
        <HidePanel
          title="沿显影光路核对所有者"
          meta={`部件 ${selected + 1} / 6 · 按键 1-6`}
          tone={part.tone}
          className="hide-ch8-map-panel"
        >
          <HideSegment
            value={part.id}
            options={PARTS.map((item, index) => ({
              value: item.id,
              label: `${index + 1} ${item.kicker}`,
              note: item.title,
            }))}
            onChange={selectPart}
            label="选择架构部件"
          />

          <div className="hide-ch8-part-rail" role="group" aria-label="六个架构部件">
            {PARTS.map((item, index) => {
              const isSelected = index === selected;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={
                    isSelected
                      ? `hide-ch8-part-button hide-ch8-part-${item.id} hide-ch8-is-selected`
                      : `hide-ch8-part-button hide-ch8-part-${item.id}`
                  }
                  aria-pressed={isSelected}
                  aria-label={`部件 ${index + 1}：${item.title}，${item.state}`}
                  onClick={() => setSelected(index)}
                >
                  <span className="hide-ch8-part-number">{index + 1}</span>
                  <span className="hide-ch8-part-kicker">{item.kicker}</span>
                  <strong>{item.title}</strong>
                  <em>{item.state}</em>
                </button>
              );
            })}
          </div>

          <div className="hide-ch8-dependency-strip" aria-label="架构上游依赖摘要">
            <span>输入 x</span>
            <b>+</b>
            <span>pₜ 显影条件</span>
            <i aria-hidden="true">→</i>
            <span>冻结 fθ</span>
            <i aria-hidden="true">→</i>
            <span>未受提示 / 受提示表征</span>
            <i aria-hidden="true">→</i>
            <span>ω / ψ</span>
          </div>

          <div className="hide-ch8-status-strip">
            <HideBadge tone="blue">主干全程冻结</HideBadge>
            <HideBadge tone="orange">旧提示冻结</HideBadge>
            <HideBadge tone="green">ω 与 ψ 轻量训练</HideBadge>
            <HideBadge tone="purple">统计档案累计</HideBadge>
          </div>
        </HidePanel>

        <div className="hide-side-stack hide-ch8-detail-stack">
          <HidePanel
            title={<><span className="hide-ch8-detail-index">{selected + 1}</span>{part.title}</>}
            meta={part.state}
            tone={part.tone}
          >
            <div className="hide-ch8-owner-detail" aria-live="polite">
              <div className="hide-ch8-owner-symbol">
                <span>当前部件</span>
                <strong>{part.symbol}</strong>
              </div>
              <div className="hide-ch8-owner-locks">
                <HideStat label="训练状态" value={part.state} tone={part.stateTone} />
                <HideStat
                  label="依赖方向"
                  value={part.id === 'tiiStats' || part.id === 'tapStats' ? '档案 → 轻量头' : '上游 → 当前'}
                  tone={part.tone}
                />
              </div>
              <HideKeyValue label="上游依赖" value={part.upstream} />
              <HideKeyValue label="输出去向" value={part.downstream} />
              <HideKeyValue label="冻结锁" value={part.lock} />
              <HideKeyValue label="存储内容" value={part.storage} />
            </div>
          </HidePanel>

          <HideNote title="所有权边界" tone={part.tone}>
            {part.detail}
          </HideNote>
        </div>
      </div>
    </HideScene>
  );
}
