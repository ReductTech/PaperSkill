import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

const PHASE_COPY = [
  '冻结骨干，把每段 EEG 映射为表征 z',
  'k > 0：少量训练标签确定线性边界',
  'k = 0：测试表征比较与验证样本的方向',
  '两种读出规则遍历同一完整测试集',
  '预测与测试真值汇总为任务指标',
] as const;

const EMBEDDINGS = [
  { x: 66, y: 84, label: 'A', selected: true },
  { x: 94, y: 66, label: 'A', selected: true },
  { x: 118, y: 104, label: 'A', selected: true },
  { x: 76, y: 133, label: 'A', selected: false },
  { x: 132, y: 53, label: 'A', selected: false },
  { x: 151, y: 84, label: 'A', selected: false },
  { x: 111, y: 151, label: 'A', selected: false },
  { x: 163, y: 123, label: 'A', selected: false },
  { x: 270, y: 169, label: 'B', selected: true },
  { x: 298, y: 140, label: 'B', selected: true },
  { x: 322, y: 178, label: 'B', selected: true },
  { x: 282, y: 209, label: 'B', selected: false },
  { x: 339, y: 129, label: 'B', selected: false },
  { x: 354, y: 160, label: 'B', selected: false },
  { x: 315, y: 223, label: 'B', selected: false },
  { x: 368, y: 197, label: 'B', selected: false },
] as const;

const TEST_LABELS = ['A', 'B', 'A', 'A', 'B', 'B', 'A', 'B'] as const;
const LINEAR_PREDICTIONS = ['A', 'B', 'A', 'B', 'B', 'B', 'A', 'B'] as const;
const NEIGHBOR_PREDICTIONS = ['A', 'A', 'A', 'A', 'B', 'B', 'A', 'B'] as const;

function LinearProbePlot({ phase }: { phase: number }) {
  const fitted = phase >= 1;
  const predicting = phase >= 3;

  return (
    <svg viewBox="0 0 440 276" role="img" aria-label="冻结表征空间中，少量带标签训练样本拟合线性分类边界">
      <defs>
        <clipPath id="lfs-linear-clip"><rect x="42" y="22" width="366" height="222" /></clipPath>
      </defs>

      <g className="lfs-grid" clipPath="url(#lfs-linear-clip)">
        {[103, 164, 225, 286, 347].map((x) => <line x1={x} y1="22" x2={x} y2="244" key={`x-${x}`} />)}
        {[66, 110, 154, 198].map((y) => <line x1="42" y1={y} x2="408" y2={y} key={`y-${y}`} />)}
      </g>

      <g className={`lfs-regions ${fitted ? 'visible' : ''}`} clipPath="url(#lfs-linear-clip)">
        <path d="M42 22H264L99 244H42Z" className="lfs-region-a" />
        <path d="M264 22H408V244H99Z" className="lfs-region-b" />
      </g>

      <g className="lfs-observations">
        {EMBEDDINGS.map((point, index) => <circle key={`base-${index}`} cx={point.x} cy={point.y} r="3.7" />)}
      </g>

      <g className={`lfs-contours ${fitted ? 'visible' : ''}`}>
        <ellipse cx="117" cy="104" rx="83" ry="59" transform="rotate(16 117 104)" className="a outer" />
        <ellipse cx="117" cy="104" rx="57" ry="39" transform="rotate(16 117 104)" className="a inner" />
        <ellipse cx="318" cy="176" rx="82" ry="58" transform="rotate(12 318 176)" className="b outer" />
        <ellipse cx="318" cy="176" rx="55" ry="37" transform="rotate(12 318 176)" className="b inner" />
      </g>

      <g className={`lfs-selected ${fitted ? 'visible' : ''}`}>
        {EMBEDDINGS.filter((point) => point.selected).map((point, index) => (
          <g key={`selected-${index}`} style={{ '--delay': `${index * 70}ms` } as React.CSSProperties}>
            <circle cx={point.x} cy={point.y} r="6.6" className={point.label.toLowerCase()} />
            <text x={point.x} y={point.y + 2.7} textAnchor="middle">{point.label}</text>
          </g>
        ))}
        <text x="53" y="41" className="lfs-class-label a">抽中的 A 类标签</text>
        <text x="294" y="237" className="lfs-class-label b">抽中的 B 类标签</text>
      </g>

      <g className={`lfs-boundary ${fitted ? 'visible' : ''}`}>
        <path d="M237 22L102 244" className="uncertainty" />
        <path d="M285 22L150 244" className="uncertainty" />
        <path d="M261 22L126 244" className="decision" />
        <text x="207" y="145" transform="rotate(-59 207 145)" className="lfs-boundary-text">Wz + b = 0</text>
      </g>

      <g className={`lfs-query ${predicting ? 'visible' : ''}`}>
        <circle cx="326" cy="76" r="7.2" />
        <circle cx="326" cy="76" r="12.5" className="halo" />
        <path d="M318 83L307 95" />
        <text x="337" y="69">测试 z*</text>
        <text x="337" y="85" className="result">落在 B 侧</text>
      </g>

      <path d="M42 244H408M42 244V22" className="lfs-axis" />
      <text x="406" y="264" textAnchor="end" className="lfs-axis-text">表征维度 z₁</text>
      <text x="18" y="27" className="lfs-axis-text">z₂</text>
      <text x="48" y="231" className="lfs-frozen-note">灰点：冻结骨干输出</text>
    </svg>
  );
}

function CosineNeighborPlot({ phase }: { phase: number }) {
  const ready = phase >= 2;

  return (
    <svg viewBox="0 0 440 276" role="img" aria-label="归一化后的测试表征位于两个验证表征之间，通过比较两个余弦夹角读取方向较近样本的标签">
      <defs>
        <marker id="lfs-arrow-a" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" /></marker>
        <marker id="lfs-arrow-b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" /></marker>
        <marker id="lfs-arrow-q" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" /></marker>
      </defs>

      <g className="lfs-polar-grid">
        <path d="M70 238A70 70 0 0 1 140 168" />
        <path d="M70 238A140 140 0 0 1 210 98" />
        <path d="M70 238A210 210 0 0 1 280 28" className="unit-arc" />
        <line x1="70" y1="238" x2="408" y2="238" />
        <line x1="70" y1="238" x2="70" y2="22" />
      </g>

      <g className={`lfs-reference-space ${ready ? 'visible' : ''}`}>
        <path d="M70 238L260 149" className="vector a" markerEnd="url(#lfs-arrow-a)" />
        <circle cx="260" cy="149" r="5.4" className="anchor a" />
        <text x="271" y="154" className="lfs-vector-label a">验证 A</text>

        <path d="M70 238L159 48" className="vector b" markerEnd="url(#lfs-arrow-b)" />
        <circle cx="159" cy="48" r="5.4" className="anchor b" />
        <text x="170" y="44" className="lfs-vector-label b">验证 B</text>

        <path d="M70 238L224 95" className="vector query" markerEnd="url(#lfs-arrow-q)" />
        <circle cx="224" cy="95" r="7" className="query-anchor" />
        <text x="235" y="89" className="lfs-vector-label query">测试 z*</text>

        <path d="M128 184A80 80 0 0 1 142 200" className="lfs-angle a" />
        <text x="151" y="191" className="lfs-angle-label a">θA</text>
        <path d="M128 184A80 80 0 0 0 104 166" className="lfs-angle b" />
        <text x="103" y="151" className="lfs-angle-label b">θB</text>

        <g className="lfs-cosine-verdict">
          <text x="282" y="78" className="equation">θA &lt; θB</text>
          <line x1="282" y1="89" x2="397" y2="89" />
          <text x="282" y="110">z* 只略偏向 A</text>
          <text x="282" y="130" className="prediction">读取 A 标签</text>
        </g>
      </g>

      <circle cx="70" cy="238" r="3.2" className="lfs-origin" />
      <text x="51" y="258" className="lfs-axis-text">原点</text>
      <text x="302" y="229" className="lfs-normalized-note">比较方向：向量已归一化</text>
    </svg>
  );
}

function PredictionRow({ label, notation, values, tone, visible, truth }: {
  label: string;
  notation: string;
  values: readonly string[];
  tone: 'linear' | 'neighbor' | 'truth';
  visible: boolean;
  truth?: readonly string[];
}) {
  return (
    <div className={`lfs-prediction-row ${tone} ${visible ? 'visible' : ''}`}>
      <div className="lfs-row-label"><span>{label}</span><code>{notation}</code></div>
      <div className="lfs-row-values">
        {values.map((value, index) => {
          const mismatch = Boolean(truth && value !== truth[index]);
          return <b className={mismatch ? 'mismatch' : ''} key={`${tone}-${index}`}>{value}</b>;
        })}
      </div>
    </div>
  );
}

function SharedEvaluation({ phase }: { phase: number }) {
  const predicting = phase >= 3;
  const scored = phase >= 4;

  return (
    <section className={`lfs-evaluation ${predicting ? 'is-predicting' : ''} ${scored ? 'is-scored' : ''}`}>
      <div className="lfs-eval-heading">
        <span>COMMON TEST SET</span>
        <b>读出器不同，评测样本保持一致</b>
        <small>示意 8 个测试表征；实际协议遍历完整 N<sub>test</sub></small>
      </div>

      <div className="lfs-prediction-matrix" aria-label="两种读出方法在同一批测试样本上产生预测，并与测试真值比较">
        <div className="lfs-sample-header">
          <span>测试表征</span>
          <div>{TEST_LABELS.map((_, index) => <code key={`z-${index}`}>z{index + 1}</code>)}</div>
        </div>
        <PredictionRow label="线性读出" notation="ŷLP" values={LINEAR_PREDICTIONS} tone="linear" visible={predicting} truth={scored ? TEST_LABELS : undefined} />
        <PredictionRow label="余弦 1-NN" notation="ŷNN" values={NEIGHBOR_PREDICTIONS} tone="neighbor" visible={predicting} truth={scored ? TEST_LABELS : undefined} />
        <PredictionRow label="测试真值" notation="y" values={TEST_LABELS} tone="truth" visible={scored} />
      </div>

      <div className="lfs-eval-output">
        <span>逐样本比较</span>
        <code>ŷ ↔ y</code>
        <i aria-hidden="true" />
        <b>按任务卡指定指标汇总</b>
        <small>BA / AUROC / 其他任务指标</small>
      </div>
    </section>
  );
}

export const OmniLab8: React.FC<WidgetProps> = () => {
  const [phase, setPhase] = useState(0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase(4);
      return undefined;
    }
    setPhase(0);
    const timers = [
      window.setTimeout(() => setPhase(1), 900),
      window.setTimeout(() => setPhase(2), 2400),
      window.setTimeout(() => setPhase(3), 4000),
      window.setTimeout(() => setPhase(4), 5500),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [run]);

  return (
    <div className={`oi-unit lfs-unit phase-${phase}`}>
      <header className="lfs-figure-head">
        <div className="lfs-figure-copy">
          <span>MECHANISM STUDY · LABEL EFFICIENCY</span>
          <b>{PHASE_COPY[phase]}</b>
        </div>
        <div className="lfs-figure-legend" aria-label="图例">
          <span><i className="embedding" />冻结表征</span>
          <span><i className="a" />A 类</span>
          <span><i className="b" />B 类</span>
          <span><i className="query" />测试表征</span>
        </div>
        <div className="lfs-stage-count" aria-live="polite"><b>0{phase + 1}</b><span>/ 05</span></div>
        <button type="button" title="重播机制动画" aria-label="重播机制动画" onClick={() => setRun((value) => value + 1)}>↻</button>
        <div className="lfs-stage-line" aria-hidden="true">
          {PHASE_COPY.map((_, index) => <i className={index <= phase ? 'active' : ''} key={index} />)}
        </div>
      </header>

      <div className="lfs-plate" key={run}>
        <figure className="lfs-panel linear">
          <figcaption>
            <span className="lfs-panel-letter">a</span>
            <div><small>WITH TRAINING LABELS</small><b>k &gt; 0 · Linear probe</b></div>
          </figcaption>
          <LinearProbePlot phase={phase} />
          <div className="lfs-method-rule">
            <code>ŷ = argmax(Wz + b)</code>
            <span>每类抽取 k% 训练标签，只拟合 <b>W、b</b></span>
            <em>fθ 冻结</em>
          </div>
        </figure>

        <figure className="lfs-panel cosine">
          <figcaption>
            <span className="lfs-panel-letter">b</span>
            <div><small>WITHOUT TRAINING LABELS</small><b>k = 0 · Cosine 1-NN</b></div>
          </figcaption>
          <CosineNeighborPlot phase={phase} />
          <div className="lfs-method-rule">
            <code>j* = argmaxⱼ cos(z*, zⱼᵛᵃˡ)</code>
            <span>测试表征读取最相近的<b>验证样本标签</b></span>
            <em>无任务头训练</em>
          </div>
        </figure>
      </div>

      <SharedEvaluation phase={phase} />

      <div className="lfs-invariant">
        <span>变化项</span><b>读出规则与可用监督</b>
        <i aria-hidden="true" />
        <span>固定项</span><b>跨受试者切分、完整测试集与任务指标</b>
      </div>
      <p className="lfs-source-note">协议依据：论文 §3 与 Figure 3。二维位置、类别标签及预测序列用于解释评测机制，不代表论文中的具体样本或性能数值。</p>
    </div>
  );
};
