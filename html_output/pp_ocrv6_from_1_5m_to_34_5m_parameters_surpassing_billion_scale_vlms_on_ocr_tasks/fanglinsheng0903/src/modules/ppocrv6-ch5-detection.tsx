import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type Improvement = 'rep' | 'aux' | 'focal';
type PyramidLevel = 'P1' | 'P2' | 'P3' | 'P4';
type NeckMode = 'rse' | 'rep';
type GraphView = 'training' | 'inference';
type SupervisionMode = 'final' | 'deep';
type PixelMode = 'dice' | 'focal';
type FormulaSymbol = 'pt' | 'gamma' | 'alpha';

const IMPROVEMENTS: Record<Improvement, { title: string; question: string; target: string }> = {
  rep: {
    title: '① RepLKFPN',
    question: '不同尺度文字怎样获得更大的局部上下文？',
    target: 'd6-fpn',
  },
  aux: {
    title: '② Auxiliary Deep Supervision',
    question: 'FPN 中间层怎样直接收到训练信号？',
    target: 'd6-aux',
  },
  focal: {
    title: '③ Dice + Focal',
    question: '边界和困难像素怎样获得更细监督？',
    target: 'd6-pixel',
  },
};

const LEVELS: Array<{ id: PyramidLevel; scale: string }> = [
  { id: 'P4', scale: '1/32' },
  { id: 'P3', scale: '1/16' },
  { id: 'P2', scale: '1/8' },
  { id: 'P1', scale: '1/4' },
];

const AUX_WEIGHTS: Record<Exclude<PyramidLevel, 'P1'>, string> = {
  P2: '0.4',
  P3: '0.3',
  P4: '0.2',
};

function SegmentedButton({
  selected,
  onClick,
  children,
  disabled = false,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button type="button" className={selected ? 'selected' : ''} aria-pressed={selected} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

export const DetectionOverview: React.FC<WidgetProps> = () => {
  const [focus, setFocus] = useState<Improvement>('rep');
  const current = IMPROVEMENTS[focus];
  const select = (next: Improvement) => {
    setFocus(next);
    window.setTimeout(() => document.getElementById(IMPROVEMENTS[next].target)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 160);
  };

  return (
    <div className={`d6-overview d6-focus-${focus}`}>
      <div className="d6-pipeline" aria-label="PP-OCRv6 文本检测流水线">
        <div className="d6-main-path">
          <span>Input</span><b>→</b><span>LCNetV4</span><b>→</b>
          <span className="features">P1 / P2 / P3 / P4</span><b>→</b>
          <strong>RepLKFPN <i>①</i></strong><b>→</b><span>DB Head</span><b>→</b><span>PostProcess</span>
        </div>
        <div className="d6-training-path">
          <span>P2</span><span>P3</span><span>P4</span>
          <b>→</b><strong>3 × Aux DB Head <i>②</i></strong><em>Train only</em>
        </div>
        <div className="d6-loss-path">
          <span>Main / Aux predictions</span><b>→</b><strong>Dice + Focal <i>③</i></strong><small>训练监督</small>
        </div>
      </div>

      <div className="d6-hotspots" role="group" aria-label="检测分支三个改进">
        {(Object.keys(IMPROVEMENTS) as Improvement[]).map((key) => (
          <button type="button" key={key} className={focus === key ? 'selected' : ''} aria-pressed={focus === key} onClick={() => select(key)}>
            <strong>{IMPROVEMENTS[key].title}</strong>
            <span>{IMPROVEMENTS[key].question}</span>
          </button>
        ))}
      </div>
      <p className="d6-overview-feedback"><strong>{current.title}</strong>{current.question}</p>
    </div>
  );
};

function FeatureGrid({ radius }: { radius: 1 | 3 }) {
  const cells = useMemo(() => Array.from({ length: 81 }, (_, index) => index), []);
  return (
    <div className={`d6-feature-grid radius-${radius}`} aria-label={`${radius === 1 ? '3×3' : '7×7'} feature-level local receptive field`}>
      {cells.map((index) => {
        const row = Math.floor(index / 9);
        const col = index % 9;
        const active = Math.abs(row - 4) <= radius && Math.abs(col - 4) <= radius;
        const center = row === 4 && col === 4;
        return <i key={index} className={`${active ? 'active' : ''} ${center ? 'center' : ''}`} />;
      })}
    </div>
  );
}

export const Ch5Detection: React.FC<WidgetProps> = () => {
  const [level, setLevel] = useState<PyramidLevel>('P2');
  const [neck, setNeck] = useState<NeckMode>('rse');
  const [view, setView] = useState<GraphView>('training');
  const [showBranches, setShowBranches] = useState(false);
  const isRep = neck === 'rep';
  const metric = !isRep
    ? { label: 'RSEFPN', params: '172K', rf: '3×3', detail: 'Per-level local refinement' }
    : view === 'training'
      ? { label: 'RepLKFPN · Training', params: '140K', rf: '7×7', detail: 'DilatedReparamBlock' }
      : { label: 'RepLKFPN · Inference', params: '118K', rf: '7×7', detail: 'single 7×7 DWConv' };

  return (
    <div id="d6-fpn" className={`d6-fpn-lab d6-neck-${neck} d6-view-${view}`}>
      <div className="d6-fpn-stage">
        <section className="d6-pyramid" aria-label="FPN top-down 多尺度融合">
          <header><span>LCNetV4 Backbone outputs</span><strong>Top-down FPN fusion</strong></header>
          <div className="d6-levels">
            {LEVELS.map((item, index) => (
              <React.Fragment key={item.id}>
                <button type="button" className={level === item.id ? 'selected' : ''} aria-pressed={level === item.id} onClick={() => setLevel(item.id)}>
                  <strong>{item.id}</strong><span>{item.scale}</span><i aria-hidden="true" />
                </button>
                {index < LEVELS.length - 1 ? <b><span>↑ 2× upsample</span>↓ merge</b> : null}
              </React.Fragment>
            ))}
          </div>
          <div className="d6-fpn-output"><span>聚合输出</span><strong>1/4 feature</strong></div>
          <p>RepLKFPN 保留 FPN 的 top-down 多尺度融合框架。</p>
        </section>

        <section className="d6-refinement">
          <header><span>放大 {level} 的 per-level refinement</span><strong>{metric.label}</strong></header>
          <div className="d6-refinement-controls">
            <div role="group" aria-label="选择检测 neck">
              <SegmentedButton selected={neck === 'rse'} onClick={() => setNeck('rse')}>RSEFPN</SegmentedButton>
              <SegmentedButton selected={neck === 'rep'} onClick={() => setNeck('rep')}>RepLKFPN</SegmentedButton>
            </div>
            <div role="group" aria-label="选择 RepLKFPN 状态">
              <SegmentedButton selected={view === 'training'} onClick={() => setView('training')} disabled={!isRep}>训练</SegmentedButton>
              <SegmentedButton selected={view === 'inference'} onClick={() => setView('inference')} disabled={!isRep}>推理</SegmentedButton>
            </div>
          </div>
          <div className="d6-grid-compare">
            <FeatureGrid radius={isRep ? 3 : 1} />
            <div>
              <span>教学 feature grid</span>
              <strong>Per-level local RF: {metric.rf}</strong>
              <code>{isRep ? 'DilatedReparamBlock → 1×1 PW → SE' : '3×3 local refinement'}</code>
              <p>{isRep ? '一次 refinement 可直接结合更大的 feature-level 局部上下文。' : '一次 refinement 直接聚合较局部的 3×3 邻域。'}</p>
            </div>
          </div>
          <div className="d6-neck-metric">
            <span>{metric.label}</span><strong>{metric.params}</strong><b>RF {metric.rf}</b><small>{metric.detail}</small>
          </div>
        </section>
      </div>

      <aside className="d6-rf-boundary">
        <strong>不要混淆</strong>
        <span>Table 3 的 3×3 / 7×7 是 per-level refinement block 的局部 receptive field，不是整个检测模型的总感受野，也不是输入图片上的像素窗口。</span>
        <em>参数数对应整个 FPN neck · out_channels=96</em>
      </aside>

      <button type="button" className="d6-expand" aria-expanded={showBranches} onClick={() => setShowBranches((current) => !current)}>
        {showBranches ? '收起 DilatedReparamBlock' : '看看 7×7 是怎么来的'}
      </button>

      <div className={`d6-dilated-detail ${showBranches ? 'visible' : ''}`} aria-hidden={!showBranches}>
        <div className="d6-reparam-branches">
          <small className="d6-reparam-label">训练阶段 · 多尺度 dilated paths</small>
          <span>7×7 DW <small>main branch</small></span>
          <span>5×5 DW <small>dilation 1</small></span>
          <span>3×3 DW <small>dilation 2</small></span>
          <span>3×3 DW <small>dilation 3</small></span>
        </div>
        <b>→ Deploy-time reparameterization →</b>
        <strong>single 7×7 DWConv</strong>
        <p><b>与 §5 共享设计思想，但不是同一个模块：</b>RepDWConv 部署为 3×3；这里的 DilatedReparamBlock 使用多尺度 dilated paths，部署为 7×7。</p>
      </div>

      <div className={`feedback ${isRep ? 'good' : ''}`} role="status">
        {isRep
          ? '更大的 refinement RF 为大文字和密集文本提供更丰富的局部上下文；这不是对最终检测结果的单因素保证。'
          : '3×3 per-level refinement 只能在一次 refinement 中直接聚合较局部的 feature 邻域。'}
      </div>
    </div>
  );
};

export const DetectionAuxLab: React.FC<WidgetProps> = () => {
  const [supervision, setSupervision] = useState<SupervisionMode>('final');
  const [view, setView] = useState<GraphView>('training');
  const [selectedAux, setSelectedAux] = useState<Exclude<PyramidLevel, 'P1'> | null>(null);
  const showAux = view === 'training' && supervision === 'deep';
  const selectSupervision = (next: SupervisionMode) => {
    setSupervision(next);
    if (next === 'deep' && selectedAux === null) setSelectedAux('P2');
  };

  return (
    <div id="d6-aux" className={`d6-aux-lab d6-aux-${supervision} d6-view-${view}`}>
      <div className="d6-dual-controls">
        <div role="group" aria-label="选择监督方式">
          <SegmentedButton selected={supervision === 'final'} onClick={() => selectSupervision('final')}>只监督最终输出</SegmentedButton>
          <SegmentedButton selected={supervision === 'deep'} onClick={() => selectSupervision('deep')}>加入 Deep Supervision</SegmentedButton>
        </div>
        <div role="group" aria-label="选择检测图视图">
          <SegmentedButton selected={view === 'training'} onClick={() => setView('training')}>训练视图</SegmentedButton>
          <SegmentedButton selected={view === 'inference'} onClick={() => setView('inference')}>推理视图</SegmentedButton>
        </div>
      </div>

      <div className="d6-aux-stage">
        <div className="d6-aux-features">
          {(['P2', 'P3', 'P4'] as const).map((item) => (
            <div key={item}>
              <strong>{item}</strong>
              <span className="main-arrow">→ Final Fused Feature</span>
              <button
                type="button"
                className={`${showAux ? 'visible' : ''} ${selectedAux === item ? 'selected' : ''}`}
                disabled={!showAux}
                aria-pressed={selectedAux === item}
                onClick={() => setSelectedAux(item)}
              >
                Aux DB Head → Aux Loss
              </button>
            </div>
          ))}
        </div>
        <div className="d6-main-head">
          <span>RepLKFPN</span><b>→</b><strong>Main DB Head</strong><b>→</b>
          <em>{view === 'training' ? 'Main Loss' : 'PostProcess'}</em>
        </div>
        <div className="d6-gradient-note">
          {view === 'inference'
            ? '三个紫色 Aux Heads 与所有 Loss 已从推理图移除。'
            : showAux
              ? 'P2 / P3 / P4 各有一条更直接的辅助梯度路径。'
              : '只有最终输出被监督时，中间特征主要依赖较长的反向梯度路径。'}
        </div>
      </div>

      <div className={`d6-aux-detail ${showAux && selectedAux ? 'visible' : ''}`}>
        {showAux && selectedAux ? (
          <>
            <div><span>深入查看</span><strong>{selectedAux} Auxiliary DB Head</strong><code>λ{selectedAux} = {AUX_WEIGHTS[selectedAux]}</code></div>
            <div className="d6-aux-maps"><span>shrink map<small>Dice + Focal</small></span><span>threshold map<small>L1</small></span><span>binary map<small>Dice + Focal</small></span></div>
            <p>辅助权重属于训练配置；辅助预测不会进入部署模型。</p>
          </>
        ) : (
          <p>{view === 'inference' ? 'Inference：只保留 RepLKFPN → Main DB Head → PostProcess。' : '切换到 Deep Supervision，再点击任一 Aux Head 查看其三类预测与辅助权重。'}</p>
        )}
      </div>

      <div className={`feedback ${view === 'inference' || showAux ? 'good' : ''}`} role="status">
        {view === 'inference'
          ? 'Auxiliary Heads 只服务训练，推理时全部移除，因此不会增加部署模型的额外辅助分支。'
          : showAux
            ? 'Auxiliary Heads 给 P2 / P3 / P4 更直接的训练信号，同时起到 regularization 作用。'
            : '当前只有 Main Loss；中间层没有独立的辅助监督路径。'}
      </div>
    </div>
  );
};

type PixelCell = { target: 0 | 1; probability: number; kind: 'easy' | 'boundary' | 'hard-negative' };

function buildPixels(): PixelCell[] {
  return Array.from({ length: 63 }, (_, index) => {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const target = row >= 2 && row <= 4 && col >= 1 && col <= 7 ? 1 : 0;
    const specialPositive = (row === 2 && col === 2) || (row === 4 && col === 6);
    const specialNegative = (row === 1 && col === 5) || (row === 5 && col === 3);
    if (target && specialPositive) return { target, probability: 0.46, kind: 'boundary' };
    if (!target && specialNegative) return { target, probability: 0.58, kind: 'hard-negative' };
    return { target, probability: target ? 0.92 : 0.08, kind: 'easy' };
  });
}

const SYMBOL_HELP: Record<FormulaSymbol, { title: string; detail: string }> = {
  pt: { title: 'p_t · 真类概率', detail: '模型分配给当前像素真实类别的概率。' },
  gamma: { title: 'γ · 聚焦指数', detail: '控制容易样本被降低权重的程度；论文设置为 2.5。' },
  alpha: { title: 'α_t · 类别权重', detail: '平衡类别贡献；论文设置 α = 0.25。' },
};

export const DetectionPixelLab: React.FC<WidgetProps> = () => {
  const pixels = useMemo(buildPixels, []);
  const [mode, setMode] = useState<PixelMode>('dice');
  const [selected, setSelected] = useState(20);
  const [formulaPt, setFormulaPt] = useState(0.46);
  const [showFormula, setShowFormula] = useState(false);
  const [symbol, setSymbol] = useState<FormulaSymbol>('gamma');
  const pixel = pixels[selected];
  const selectedPt = pixel.target === 1 ? pixel.probability : 1 - pixel.probability;
  const focalWeight = Math.pow(1 - formulaPt, 2.5);
  const help = SYMBOL_HELP[symbol];
  const choosePixel = (index: number) => {
    const next = pixels[index];
    setSelected(index);
    setFormulaPt(Number((next.target === 1 ? next.probability : 1 - next.probability).toFixed(2)));
  };

  return (
    <div id="d6-pixel" className={`d6-pixel-lab d6-pixel-${mode}`}>
      <div className="d6-pixel-controls" role="group" aria-label="选择像素损失视图">
        <SegmentedButton selected={mode === 'dice'} onClick={() => setMode('dice')}>Dice only</SegmentedButton>
        <SegmentedButton selected={mode === 'focal'} onClick={() => setMode('focal')}>Dice + Focal</SegmentedButton>
      </div>

      <div className="d6-map-stage">
        <section>
          <header><span>Ground Truth</span><strong>Shrink Map</strong></header>
          <div className="d6-pixel-grid gt" aria-label="教学 Ground Truth shrink map">
            {pixels.map((item, index) => <i key={index} className={item.target ? 'positive' : ''} />)}
          </div>
          <p>Dice 观察整体区域 overlap。</p>
        </section>
        <section>
          <header><span>Prediction</span><strong>Probability Map · 教学示意</strong></header>
          <div className="d6-pixel-grid prediction" aria-label="可点击的教学预测概率网格">
            {pixels.map((item, index) => {
              const pt = item.target === 1 ? item.probability : 1 - item.probability;
              return (
                <button
                  type="button"
                  key={index}
                  className={`${item.kind} ${selected === index ? 'selected' : ''} ${mode === 'focal' && pt > 0.8 ? 'downweighted' : ''}`}
                  aria-label={`像素 ${index + 1}，target ${item.target}，预测概率 ${item.probability.toFixed(2)}`}
                  aria-pressed={selected === index}
                  style={{ backgroundColor: `rgba(39, 68, 110, ${0.08 + item.probability * 0.78})` }}
                  onClick={() => choosePixel(index)}
                />
              );
            })}
          </div>
          <p>{mode === 'focal' ? '困难与错分 pixel 被单独强调；容易 pixel 的视觉权重降低。' : '当前主要观察预测区域与 GT 是否整体重叠。'}</p>
        </section>
        <aside className="d6-pixel-readout">
          <span>当前像素 · 教学数字</span>
          <strong>{pixel.kind === 'easy' ? '容易像素' : pixel.kind === 'boundary' ? '困难边界像素' : '困难负样本'}</strong>
          <code>target = {pixel.target}</code>
          <code>p_t = {selectedPt.toFixed(2)}</code>
          <em>{selectedPt > 0.8 ? '模型较确定' : '需要更明确的逐像素信号'}</em>
        </aside>
      </div>

      <div className="d6-complement-note">
        <div><strong>Dice</strong><span>关注全局区域 overlap</span></div><b>+</b><div><strong>Focal</strong><span>提供逐像素信号并强调 hard examples</span></div>
        <p>两者互补，Focal 不替代 Dice。</p>
      </div>

      <div className="d6-formula-lab">
        <div className="d6-main-formula">
          <span>论文训练目标</span>
          <strong>L_shrink = λ_dice L_Dice + λ_focal L_Focal</strong>
          <small>λ_dice = 1 · λ_focal = 1</small>
          <button type="button" aria-expanded={showFormula} onClick={() => setShowFormula((current) => !current)}>{showFormula ? '收起 Focal' : '展开 Focal'}</button>
        </div>
        <div className={`d6-focal-formula ${showFormula ? 'visible' : ''}`} aria-hidden={!showFormula}>
          <div>
            <span>L_Focal = −</span>
            <button type="button" className={symbol === 'alpha' ? 'selected' : ''} onClick={() => setSymbol('alpha')}>α_t</button>
            <span>(1 − </span><button type="button" className={symbol === 'pt' ? 'selected' : ''} onClick={() => setSymbol('pt')}>p_t</button>
            <span>)</span><button type="button" className={`d6-exponent ${symbol === 'gamma' ? 'selected' : ''}`} onClick={() => setSymbol('gamma')}>γ</button>
            <span>log(p_t)</span>
          </div>
          <p><strong>{help.title}</strong>{help.detail}</p>
          <small>α = 0.25 · γ = 2.5</small>
        </div>
      </div>

      <div className="d6-focal-slider">
        <div><span>公式演示 · 模型对真类有多确定？</span><strong>p_t = {formulaPt.toFixed(2)}</strong></div>
        <input type="range" min="0.05" max="0.99" step="0.01" value={formulaPt} aria-label="公式演示真类概率" onChange={(event) => setFormulaPt(Number(event.target.value))} />
        <div className="d6-weight-result"><span>Focal 调制项</span><code>(1 − p_t)^2.5 = {focalWeight.toFixed(3)}</code><em>{formulaPt > 0.8 ? '容易像素权重较小' : '困难像素保留更大权重'}</em></div>
      </div>

      <details className="d6-ohem-note">
        <summary>为什么已有 OHEM 还要 Focal？</summary>
        <p>PP-OCRv5_mobile_det 已使用 OHEM；论文认为仅靠 Dice 的全局区域目标仍缺少足够显式的逐像素优化信号，因此额外加入 Focal Loss。</p>
      </details>

      <div className={`feedback ${mode === 'focal' ? 'good' : ''}`} role="status">
        {mode === 'focal' ? 'Dice 保持全局区域目标，Focal 同时让困难像素获得更明确的独立监督。' : 'Dice 更关注预测区域与 Ground Truth 的整体重叠。'}
      </div>
    </div>
  );
};

export const DetectionSummary: React.FC<WidgetProps> = () => {
  const [view, setView] = useState<GraphView>('training');

  return (
    <div className={`d6-summary d6-view-${view}`}>
      <div className="d6-summary-controls" role="group" aria-label="完整检测网络视图">
        <SegmentedButton selected={view === 'training'} onClick={() => setView('training')}>Training</SegmentedButton>
        <SegmentedButton selected={view === 'inference'} onClick={() => setView('inference')}>Inference</SegmentedButton>
      </div>

      <div className="d6-summary-graph" role="status" aria-live="polite">
        <div className="d6-summary-main">
          <span>LCNetV4</span><b>→</b><span>P1 P2 P3 P4</span><b>→</b><strong>RepLKFPN <i>①</i><small>{view === 'training' ? 'Dilated training paths' : 'single 7×7 DWConv'}</small></strong><b>→</b><span>Main DB Head</span><b>→</b><em>Output</em>
        </div>
        <div className={`d6-summary-aux ${view === 'training' ? 'visible' : ''}`}>
          <span>P2 / P3 / P4</span><b>→</b><strong>Aux Heads <i>②</i></strong><b>→</b><span>Aux Loss</span><em>Train only</em>
        </div>
        <div className={`d6-summary-loss ${view === 'training' ? 'visible' : ''}`}>
          <span>Main + Aux predictions</span><b>→</b><strong>Dice + Focal <i>③</i></strong><em>训练监督</em>
        </div>
        <p>{view === 'training' ? '训练图：多尺度 reparameterization branches、Aux Heads 与 Loss 都参与学习。' : '推理图：训练分支已融合，Aux Heads 与 Loss 已移除，只保留主检测路径。'}</p>
      </div>

      <aside className="d6-ablation">
        <header><div><span>论文证据 · Appendix Table 13</span><strong>这些改动真的有贡献吗？</strong></div><small>PP-OCRv6_small detection · 1/5 training data</small></header>
        <div className="d6-ablation-steps">
          <article><span>LCNetV4 Backbone</span><strong>79.37</strong></article><b>→</b>
          <article><span>+ RepLKFPN</span><strong>79.75</strong><em>+0.38</em></article><b>→</b>
          <article><span>+ Aux Supervision</span><strong>80.28</strong><em>+0.53</em></article><b>→</b>
          <article><span>+ Focal Loss</span><strong>81.43</strong><em>+1.15</em></article>
        </div>
        <p>这是 sequential ablation：每一行都建立在上一行之上，不能把增量解释为三个组件在所有设置中的独立固定贡献。</p>
        <details><summary>查看 Full Data Training</summary><p>完整数据训练后的报告值为 84.12；该结果与上方 1/5 data 的逐步消融处于不同训练条件。</p></details>
      </aside>

    </div>
  );
};
