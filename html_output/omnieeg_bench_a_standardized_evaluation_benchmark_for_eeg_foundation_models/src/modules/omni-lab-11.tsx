import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type ClaimLevel = 'paper' | 'causal';

const CLAIMS: Array<{
  id: ClaimLevel;
  label: string;
  hint: string;
  verdict: string;
  sentence: string;
}> = [
  {
    id: 'paper',
    label: '论文结论',
    hint: '限定当前评测',
    verdict: '三组证据可以共同支撑',
    sentence: '在统一协议覆盖的任务上，当前模型的直接迁移仍受限、能力分布不均；数据与模型设计提供了改进线索。',
  },
  {
    id: 'causal',
    label: '因果外推',
    hint: '归因单一因素',
    verdict: '现有证据无法通过',
    sentence: '只增大参数量，就会独立提升所有 EEG 任务的性能。',
  },
];

const EVIDENCE = [
  {
    id: 'transfer',
    code: 'E1',
    title: '迁移与适配',
    detail: '超过 EEGConformer 的模型数',
    scope: '线性探测 5/10 · 全量微调 7/10',
    blocked: '只回答适配差异',
  },
  {
    id: 'difficulty',
    code: 'E2',
    title: '能力短板',
    detail: '六类任务的统一比较',
    scope: '自然刺激解码属于最困难类别之一',
    blocked: '只定位困难任务',
  },
  {
    id: 'factors',
    code: 'E3',
    title: '性能因素',
    detail: '逐数据集 Spearman 相关',
    scope: 'ρ数据 = −0.27 · ρ参数量 = −0.21',
    blocked: '缺少规模干预',
  },
] as const;

export const OmniLab11: React.FC<WidgetProps> = () => {
  const [level, setLevel] = useState<ClaimLevel>('paper');
  const claim = CLAIMS.find((item) => item.id === level) ?? CLAIMS[0];
  const supported = level !== 'causal';

  return <div className={`oi-unit oc-synthesis-v2 is-${level}`}>
    <div className="oc-claim-levels" role="radiogroup" aria-label="选择结论的推断强度">
      {CLAIMS.map((item, index) => <button
        key={item.id}
        type="button"
        role="radio"
        aria-checked={level === item.id}
        className={level === item.id ? 'active' : ''}
        onClick={() => setLevel(item.id)}
      >
        <span>{index + 1}</span>
        <b>{item.label}</b>
        <small>{item.hint}</small>
      </button>)}
    </div>

    <div className="oi-caption">
      <span>选择结论强度，观察三组证据能否穿过推断边界</span>
      <strong>{supported ? '证据范围内' : '超出证据范围'}</strong>
    </div>

    <div className="oc-synthesis-stage" key={level}>
      <div className="oc-synthesis-head" aria-hidden="true">
        <span>论文证据</span><span>推断边界</span><span>对当前结论</span>
      </div>
      <div className="oc-evidence-lanes">
        {EVIDENCE.map((item, index) => <div className="oc-evidence-lane" key={item.id} style={{ '--lane-delay': `${index * 90}ms` } as React.CSSProperties}>
          <div className="oc-evidence-source">
            <span className="oc-evidence-code">{item.code}</span>
            <div className="oc-evidence-copy">
              <b>{item.title}</b>
              <small>{item.detail}</small>
              <p>{item.scope}</p>
            </div>
          </div>
          <div className={`oc-inference-track ${supported ? 'passes' : 'blocked'}`} aria-hidden="true">
            <i className="oc-track-line" />
            <i className="oc-track-pulse" />
            <span className="oc-boundary-mark">{supported ? '✓' : '×'}</span>
          </div>
          <div className={`oc-lane-verdict ${supported ? 'pass' : 'stop'}`}>
            <b>{supported ? '条件支持' : '无法归因'}</b>
            <small>{supported ? '保留任务与协议范围' : item.blocked}</small>
          </div>
        </div>)}
      </div>

      <div className={`oc-claim-result ${supported ? 'supported' : 'rejected'}`}>
        <div className="oc-result-status">
          <span>{supported ? 'SUPPORTED' : 'OUT OF SCOPE'}</span>
          <b>{claim.verdict}</b>
        </div>
        <p>{claim.sentence}</p>
      </div>
      <div className="oc-source-line">论文原文定位：§4.1、§4.4、Figure 1、Figure 4、Figure 7 与 Supplementary Figure 5</div>
    </div>

    <div className={`oi-feedback ${supported ? 'good' : 'bad'}`}><b>{supported
      ? '这就是论文的证据收束：统一评测定位迁移限制与能力短板，因素分析提供改进假设；结论范围限定在当前模型、任务和协议内。'
      : '相关、分组比较和榜单差异都没有隔离单一因素。把“共同关联”改写成“参数量独立导致提升”会越过现有实验设计。'}</b></div>
  </div>;
};
