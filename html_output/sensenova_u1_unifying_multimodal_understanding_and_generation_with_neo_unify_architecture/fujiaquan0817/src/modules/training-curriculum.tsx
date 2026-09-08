import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type View = 'recipe' | 'mix';

type Recipe = {
  id: string;
  name: string;
  steps: string;
  peakLr: string;
  minLr: string;
  scheduler: string;
  loss: string;
  undResolution: string;
  genResolution: string;
  seq: string;
  ema: string;
  warmup: string;
  tokens: string;
  mix: [number, number, number, number];
  update: string;
  note: string;
};

const recipes: Recipe[] = [
  {
    id: 'S1',
    name: '理解预热',
    steps: '120K',
    peakLr: '2×10⁻⁵',
    minLr: '—',
    scheduler: 'Constant',
    loss: '1 : 0',
    undResolution: '256²→4096²',
    genResolution: '—',
    seq: '32,768',
    ema: '—',
    warmup: '—',
    tokens: '0.75T',
    mix: [1, 0, 0, 0],
    update: '先仅注意力层，后整个理解分支',
    note: 'Table 2 将 Stage 1 汇总为一列；正文进一步拆成 Attention-Fusion 与 Full-Model Continuation 两步。',
  },
  {
    id: 'S2-I',
    name: '生成预训 I',
    steps: '120K',
    peakLr: '2×10⁻⁴',
    minLr: '—',
    scheduler: 'Constant',
    loss: '0 : 1',
    undResolution: '—',
    genResolution: '256²→512²',
    seq: '8,192',
    ema: '0.9999',
    warmup: '2,000',
    tokens: '0.25T',
    mix: [0, 1, 0, 0],
    update: '理解冻结；生成更新',
    note: '使用纯文生图数据建立像素空间生成基础；超过 512×512 的图像按宽高比缩放。',
  },
  {
    id: 'S2-II',
    name: '生成预训 II',
    steps: '60K',
    peakLr: '1×10⁻⁴',
    minLr: '—',
    scheduler: 'Constant',
    loss: '0 : 1',
    undResolution: '—',
    genResolution: '512²→2048²',
    seq: '16,384',
    ema: '0.9999',
    warmup: '2,000',
    tokens: '0.25T',
    mix: [0, 1, 0, 0],
    update: '理解冻结；生成更新',
    note: '继续纯文生图训练，将样本下限提高到 512²，并把最大生成分辨率扩展到 2048²。',
  },
  {
    id: 'S2-III',
    name: '生成预训 III',
    steps: '120K',
    peakLr: '1×10⁻⁴',
    minLr: '2×10⁻⁵',
    scheduler: 'Cosine',
    loss: '0 : 1',
    undResolution: '—',
    genResolution: '512²→2048²',
    seq: '16,384',
    ema: '0.9999',
    warmup: '2,000',
    tokens: '0.88T',
    mix: [0, 0.56, 0.37, 0.07],
    update: '理解冻结；生成更新',
    note: '加入图像编辑、推理和交错图文任务。Table 2 的采样栏将任务归入生成、编辑与交错三类。',
  },
  {
    id: 'S3',
    name: '统一中训',
    steps: '84K',
    peakLr: '2×10⁻⁵',
    minLr: '—',
    scheduler: 'Constant',
    loss: '0.1 : 1',
    undResolution: '256²→4096²',
    genResolution: '512²→2048²',
    seq: '32,768',
    ema: '0.999',
    warmup: '2,000',
    tokens: '1.19T',
    mix: [0.33, 0.37, 0.24, 0.06],
    update: '理解与生成完整联合更新',
    note: '论文报告训练 84K steps，并指出在少于 80M 数据时约 40K steps 已接近收敛；这不是提前停止规则。',
  },
  {
    id: 'S4',
    name: '统一 SFT',
    steps: '9K',
    peakLr: '2×10⁻⁵',
    minLr: '0',
    scheduler: 'Cosine',
    loss: '0.1 : 1',
    undResolution: '256²→4096²',
    genResolution: '512²→2048²',
    seq: '32,768',
    ema: '0.999',
    warmup: '100',
    tokens: '0.13T',
    mix: [0.33, 0.37, 0.24, 0.06],
    update: '完整模型继续联合更新',
    note: '数据比例沿用 Stage 3，但样本换为高质量指令跟随数据；学习率余弦衰减到 0。',
  },
];

const mixNames = ['理解', '生成', '编辑', '交错'];

export const TrainingCurriculum: React.FC<WidgetProps> = () => {
  const [view, setView] = useState<View>('recipe');
  const [activeIndex, setActiveIndex] = useState(0);
  const active = recipes[activeIndex];

  return (
    <div className="training-recipe">
      <div className="training-recipe-head">
        <div>
          <p className="training-map-kicker">论文 Table 2 · Stage 1–4</p>
          <h4>训练配方对照</h4>
        </div>
        <div className="ctrl" role="tablist" aria-label="选择训练配方视图">
          <button type="button" role="tab" aria-selected={view === 'recipe'} onClick={() => setView('recipe')}>优化设置</button>
          <button type="button" role="tab" aria-selected={view === 'mix'} onClick={() => setView('mix')}>数据与参数</button>
        </div>
      </div>

      <div className="training-table-wrap">
        {view === 'recipe' ? (
          <table className="training-recipe-table">
            <thead>
              <tr>
                <th>阶段</th>
                <th>步数</th>
                <th>峰值 / 最小 LR</th>
                <th>调度</th>
                <th>CE : MSE</th>
                <th>理解 / 生成分辨率</th>
                <th>训练 tokens</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((item, index) => (
                <tr key={item.id} className={index === activeIndex ? 'is-active' : ''}>
                  <th scope="row">
                    <button type="button" onClick={() => setActiveIndex(index)}>
                      <strong>{item.id}</strong>
                      <span>{item.name}</span>
                    </button>
                  </th>
                  <td>{item.steps}</td>
                  <td>{item.peakLr} / {item.minLr}</td>
                  <td>{item.scheduler}</td>
                  <td><strong>{item.loss}</strong></td>
                  <td>Und {item.undResolution}<br />Gen {item.genResolution}</td>
                  <td>{item.tokens}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="training-recipe-table training-mix-table">
            <thead>
              <tr>
                <th>阶段</th>
                {mixNames.map((name) => <th key={name}>{name}</th>)}
                <th>参数更新范围</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((item, index) => (
                <tr key={item.id} className={index === activeIndex ? 'is-active' : ''}>
                  <th scope="row">
                    <button type="button" onClick={() => setActiveIndex(index)}>
                      <strong>{item.id}</strong>
                      <span>{item.name}</span>
                    </button>
                  </th>
                  {item.mix.map((value, mixIndex) => (
                    <td key={mixNames[mixIndex]}>
                      <span className={`training-mix-value mix-${mixIndex}`} style={{ '--mix-value': `${value * 100}%` } as React.CSSProperties}>
                        {(value * 100).toFixed(0)}%
                      </span>
                    </td>
                  ))}
                  <td>{item.update}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <article className="training-recipe-detail" key={active.id}>
        <header>
          <span>{active.id}</span>
          <div><h5>{active.name}</h5><p>{active.note}</p></div>
        </header>
        <dl>
          <div><dt>序列长度</dt><dd>{active.seq}</dd></div>
          <div><dt>Warmup</dt><dd>{active.warmup} steps</dd></div>
          <div><dt>EMA</dt><dd>{active.ema}</dd></div>
          <div><dt>更新对象</dt><dd>{active.update}</dd></div>
        </dl>
      </article>

      <div className="feedback good" aria-live="polite">
        当前查看 {active.id}：{active.name}。{view === 'recipe' ? `训练 ${active.steps}，目标权重 ${active.loss}。` : `数据比例为 ${active.mix.map((value) => (value * 100).toFixed(0)).join(' / ')}。`}
      </div>
      <p className="note">表中数值来自论文 Table 2。Stage 2 的三个 Phase 属于同一个“生成预训练”阶段，不能误读为 Stage 2、3、4。</p>
    </div>
  );
};

export default TrainingCurriculum;
