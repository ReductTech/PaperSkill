import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type EvidenceTab = 'detection' | 'recognition' | 'faithfulness' | 'robustness' | 'efficiency';
type RobustnessMode = 'crop-margin' | 'resolution';
type EfficiencyMode = 'cpu' | 'gpu';

interface BarDatum {
  label: string;
  value: number;
  display: string;
  tone: 'baseline' | 'paper' | 'muted';
}

interface RawTableSpec {
  caption: string;
  columns: string[];
  rows: string[][];
}

const TAB_LABELS: Record<EvidenceTab, string> = {
  detection: '检测',
  recognition: '识别',
  faithfulness: '忠实性',
  robustness: '鲁棒性',
  efficiency: '效率',
};

const DETECTION_ROWS: BarDatum[] = [
  { label: 'PP-OCRv5_server', value: 81.6, display: '81.6%', tone: 'baseline' },
  { label: 'PP-OCRv6_medium', value: 86.2, display: '86.2%', tone: 'paper' },
];

const RECOGNITION_ROWS: BarDatum[] = [
  { label: 'PP-OCRv5_server', value: 78.1, display: '78.1%', tone: 'baseline' },
  { label: 'PP-OCRv6_medium', value: 83.2, display: '83.2%', tone: 'paper' },
];

const FAITHFULNESS_ROWS: BarDatum[] = [
  { label: 'PP-OCRv6_medium', value: 93.2, display: '93.20%', tone: 'paper' },
  { label: 'Kimi-K2.6', value: 85, display: '85.00%', tone: 'muted' },
  { label: 'Qwen3-VL-235B', value: 80.56, display: '80.56%', tone: 'baseline' },
  { label: 'GPT-5.5', value: 78, display: '78.00%', tone: 'muted' },
  { label: 'MiniMax-M3', value: 72.6, display: '72.60%', tone: 'muted' },
];

const CROP_ROWS: BarDatum[] = [
  { label: 'PP-OCRv5_server', value: 54.82, display: '54.82%', tone: 'baseline' },
  { label: 'PP-OCRv6_medium', value: 75.32, display: '75.32%', tone: 'paper' },
];

const RESOLUTION_SCALES = ['0.35×', '0.50×', '0.71×', '1.00×', '1.41×', '2.00×', '2.83×'];
const RESOLUTION_VALUES = [76.29, 85.0, 89.04, 89.72, 89.69, 89.04, 87.94];

const EFFICIENCY_ROWS: Record<EfficiencyMode, BarDatum[]> = {
  cpu: [
    { label: 'PP-OCRv6_medium', value: 1.4, display: '1.40 s', tone: 'paper' },
    { label: 'PP-OCRv6_small', value: 0.59, display: '0.59 s', tone: 'paper' },
    { label: 'PP-OCRv6_tiny', value: 0.2, display: '0.20 s', tone: 'paper' },
  ],
  gpu: [
    { label: 'PP-OCRv6_medium', value: 0.29, display: '0.29 s', tone: 'paper' },
    { label: 'PP-OCRv6_small', value: 0.25, display: '0.25 s', tone: 'paper' },
    { label: 'PP-OCRv6_tiny', value: 0.13, display: '0.13 s', tone: 'paper' },
  ],
};

const RAW_TABLES: Record<Exclude<EvidenceTab, 'robustness' | 'efficiency'>, RawTableSpec> = {
  detection: {
    caption: 'Table 4 数据摘录：自建 16 类检测 benchmark 的平均 Hmean',
    columns: ['模型', 'AVG Hmean'],
    rows: [
      ['Gemini-3.1-Pro', '46.8%'],
      ['GPT-5.5', '45.6%'],
      ['Qwen3-VL-235B', '38.3%'],
      ['Kimi-K2.6', '12.8%'],
      ['MiniMax-M3', '12.0%'],
      ['PP-OCRv5_server', '81.6%'],
      ['PP-OCRv5_mobile', '75.2%'],
      ['PP-OCRv6_medium', '86.2%'],
      ['PP-OCRv6_small', '84.1%'],
      ['PP-OCRv6_tiny', '80.6%'],
    ],
  },
  recognition: {
    caption: 'Table 6 数据摘录：自建 15 类识别 benchmark 的加权平均准确率',
    columns: ['模型', 'W-Avg Accuracy'],
    rows: [
      ['Qwen3-VL-235B', '74.9%'],
      ['Gemini-3.1-Pro', '71.4%'],
      ['PP-OCRv5_server', '78.1%'],
      ['PP-OCRv5_mobile', '73.7%'],
      ['PP-OCRv6_medium', '83.2%'],
      ['PP-OCRv6_small', '81.3%'],
      ['PP-OCRv6_tiny', '73.5%'],
    ],
  },
  faithfulness: {
    caption: 'Table 7：Hallucination Evaluation Accuracy',
    columns: ['模型', 'Accuracy'],
    rows: [
      ['Qwen3-VL-235B', '80.56%'],
      ['GPT-5.5', '78.00%'],
      ['Kimi-K2.6', '85.00%'],
      ['MiniMax-M3', '72.60%'],
      ['PP-OCRv6_medium', '93.20%'],
      ['PP-OCRv6_small', '88.20%'],
      ['PP-OCRv6_tiny', '86.80%'],
    ],
  },
};

function EvidenceBars({ rows, max, lowerIsBetter = false }: { rows: BarDatum[]; max: number; lowerIsBetter?: boolean }) {
  return (
    <div
      className={`final-bars ${lowerIsBetter ? 'lower-is-better' : ''}`}
      role="img"
      aria-label={rows.map((row) => `${row.label} ${row.display}`).join('；')}
    >
      {rows.map((row) => (
        <div className="final-bar-row" key={row.label}>
          <div className="final-bar-label">
            <span>{row.label}</span>
            <strong>{row.display}</strong>
          </div>
          <div className="final-bar-track" aria-hidden="true">
            <i className={row.tone} style={{ width: `${Math.max(3, row.value / max * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SourceLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="final-source-line">
      <span>论文实验</span>
      <strong>{children}</strong>
    </div>
  );
}

function RawTable({ spec }: { spec: RawTableSpec }) {
  return (
    <div className="final-raw-wrap">
      <table className="paper-result-table final-raw-table">
        <caption>{spec.caption}</caption>
        <thead>
          <tr>{spec.columns.map((column) => <th scope="col" key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {spec.rows.map((row) => (
            <tr key={row.join('-')}>
              {row.map((cell, index) => index === 0
                ? <th scope="row" key={cell}>{cell}</th>
                : <td key={`${cell}-${index}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <p>这里只摘录本页用于比较的模型与列；完整类别明细见论文对应表格。</p>
    </div>
  );
}

function KeyComparison({
  title,
  metric,
  delta,
  source,
  rows,
  takeaway,
}: {
  title: string;
  metric: string;
  delta: string;
  source: string;
  rows: BarDatum[];
  takeaway: string;
}) {
  return (
    <>
      <div className="final-stage-heading">
        <div>
          <span>{metric}</span>
          <h5>{title}</h5>
        </div>
        <strong className="final-delta">{delta}</strong>
      </div>
      <SourceLine>{source}</SourceLine>
      <EvidenceBars rows={rows} max={100} />
      <p className="final-stage-takeaway">{takeaway}</p>
    </>
  );
}

function RecognitionSceneDetails() {
  const rows = [
    ['Ancient text', '60.4%', '72.4%'],
    ['Japanese', '73.7%', '90.5%'],
    ['Industrial', '70.2%', '77.4%'],
    ['Screen', '68.1%', '82.5%'],
  ];

  return (
    <details className="final-scene-details">
      <summary>查看不同场景</summary>
      <div className="final-scene-table-wrap">
        <table className="paper-result-table final-scene-table">
          <caption>Table 6 场景摘录：Recognition Accuracy</caption>
          <thead><tr><th scope="col">场景</th><th scope="col">PP-OCRv5_server</th><th scope="col">PP-OCRv6_medium</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row[0]}><th scope="row">{row[0]}</th><td>{row[1]}</td><td>{row[2]}</td></tr>)}</tbody>
        </table>
      </div>
    </details>
  );
}

function FaithfulnessPanel() {
  return (
    <>
      <div className="final-stage-heading">
        <div>
          <span>Hallucination Evaluation Accuracy</span>
          <h5>§2 的现象，论文怎样测量？</h5>
        </div>
        <strong className="final-delta">93.20%</strong>
      </div>
      <SourceLine>自建 OCR 幻觉评测集 · Table 7</SourceLine>
      <EvidenceBars rows={FAITHFULNESS_ROWS} max={100} />
      <div className="final-evidence-note">
        这里的 Accuracy 越高，表示模型越能输出正确文字、越少引入图像中不存在的内容。
      </div>
      <div className="final-inline-links">
        <a className="ui-page-link ui-page-link-back" href="#chap-2">回看 §2：合理为什么不等于忠实</a>
        <a href="https://arxiv.org/html/2606.13108#A5.F8" target="_blank" rel="noreferrer">查看论文 Figure 8</a>
      </div>
    </>
  );
}

function CropIllustration() {
  return (
    <div className="final-crop-strip" aria-label="tight、normal、loose 三种裁剪边界示意">
      {[
        ['tight', '紧'],
        ['normal', '正常'],
        ['loose', '松'],
      ].map(([mode, label]) => (
        <div className={`final-crop-sample ${mode}`} key={mode}>
          <span>{label}</span>
          <div><b>TEH</b><i aria-hidden="true" /></div>
        </div>
      ))}
    </div>
  );
}

function ResolutionChart() {
  const points = RESOLUTION_VALUES.map((value, index) => {
    const x = 34 + index * 82;
    const y = 132 - (value - 72) * 5;
    return { x, y, value, scale: RESOLUTION_SCALES[index] };
  });
  const path = points.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <div className="final-resolution-chart">
      <svg viewBox="0 0 560 166" role="img" aria-label={`PP-OCRv6_medium 七档分辨率 Hmean：${RESOLUTION_VALUES.join('、')}%`}>
        <line x1="28" y1="140" x2="540" y2="140" />
        <line x1="28" y1="34" x2="28" y2="140" />
        <polyline points={path} />
        {points.map((point) => (
          <g key={point.scale}>
            <circle cx={point.x} cy={point.y} r="4" />
            <text x={point.x} y={Math.max(20, point.y - 10)} textAnchor="middle">{point.value.toFixed(1)}</text>
            <text x={point.x} y="158" textAnchor="middle">{point.scale}</text>
          </g>
        ))}
      </svg>
      <div className="final-resolution-summary">
        <span>Mean Hmean <strong>86.67%</strong></span>
        <span>CV <strong>5.19%</strong> · 越低越稳定</span>
      </div>
    </div>
  );
}

function RobustnessPanel({ mode, onModeChange }: { mode: RobustnessMode; onModeChange: (mode: RobustnessMode) => void }) {
  return (
    <>
      <div className="final-stage-heading final-stage-heading-with-control">
        <div>
          <span>{mode === 'crop-margin' ? 'Crop Margin Consistency' : 'Resolution Robustness'}</span>
          <h5>{mode === 'crop-margin' ? '边界变化后，预测还能一致吗？' : '分辨率变化后，检测还能稳定吗？'}</h5>
        </div>
        <div className="final-subtabs" role="group" aria-label="鲁棒性实验类型">
          <button className={mode === 'crop-margin' ? 'selected' : ''} onClick={() => onModeChange('crop-margin')}>裁剪边界</button>
          <button className={mode === 'resolution' ? 'selected' : ''} onClick={() => onModeChange('resolution')}>输入分辨率</button>
        </div>
      </div>
      {mode === 'crop-margin' ? (
        <>
          <SourceLine>Recognition Crop Margin Robustness · Table 8</SourceLine>
          <div className="final-robust-grid">
            <CropIllustration />
            <EvidenceBars rows={CROP_ROWS} max={100} />
          </div>
          <p className="final-stage-takeaway"><strong>+20.50 pp</strong>：同一文字在不同 crop margin 下保持相同预测的比例显著提高。</p>
        </>
      ) : (
        <>
          <SourceLine>600 张检测验证图 · 七档尺度 · Table 5</SourceLine>
          <ResolutionChart />
          <p className="final-stage-takeaway">鲁棒性不是只看某个最佳尺度，而是看输入条件变化后结果是否仍然稳定。</p>
        </>
      )}
    </>
  );
}

function EfficiencyPanel({ mode, onModeChange }: { mode: EfficiencyMode; onModeChange: (mode: EfficiencyMode) => void }) {
  const cpu = mode === 'cpu';
  return (
    <>
      <div className="final-stage-heading final-stage-heading-with-control">
        <div>
          <span>End-to-end inference · 秒/图</span>
          <h5>同一硬件与后端内比较三档模型</h5>
        </div>
        <div className="final-subtabs" role="group" aria-label="效率测试环境">
          <button className={cpu ? 'selected' : ''} onClick={() => onModeChange('cpu')}>CPU</button>
          <button className={!cpu ? 'selected' : ''} onClick={() => onModeChange('gpu')}>GPU</button>
        </div>
      </div>
      <SourceLine>{cpu ? 'Intel Xeon 8350C + OpenVINO · Table 9' : 'NVIDIA A100 + PaddlePaddle · Table 9'}</SourceLine>
      <EvidenceBars rows={EFFICIENCY_ROWS[mode]} max={cpu ? 1.4 : 0.29} lowerIsBetter />
      <div className="final-efficiency-context">
        <span>测试包括图像 I/O、预处理、模型推理与后处理。</span>
        <strong>同组数字越低越快</strong>
      </div>
      <div className="final-evidence-note warning">
        实际延迟还受算子融合、并行度、kernel scheduling 与硬件利用率影响；模型更小，不代表在任何设备上都一定更快。
      </div>
    </>
  );
}

function rawSpecFor(tab: EvidenceTab, robustnessMode: RobustnessMode, efficiencyMode: EfficiencyMode): RawTableSpec {
  if (tab === 'robustness') {
    if (robustnessMode === 'crop-margin') {
      return {
        caption: 'Table 8 数据摘录：Crop Margin Robustness Consistency',
        columns: ['模型', 'Consistency'],
        rows: [
          ['PP-OCRv5_server', '54.82%'],
          ['PP-OCRv5_mobile', '57.74%'],
          ['PP-OCRv6_medium', '75.32%'],
          ['PP-OCRv6_small', '67.80%'],
          ['PP-OCRv6_tiny', '44.80%'],
        ],
      };
    }
    return {
      caption: 'Table 5 数据摘录：PP-OCRv6_medium 在七档输入尺度下的检测 Hmean',
      columns: ['模型', ...RESOLUTION_SCALES, 'Mean', 'CV'],
      rows: [['PP-OCRv6_medium', ...RESOLUTION_VALUES.map((value) => `${value.toFixed(2)}%`), '86.67%', '5.19%']],
    };
  }

  if (tab === 'efficiency') {
    const cpu = efficiencyMode === 'cpu';
    return {
      caption: `Table 9 数据摘录：${cpu ? 'Intel Xeon 8350C + OpenVINO' : 'NVIDIA A100 + PaddlePaddle'}，秒/图`,
      columns: ['模型', '端到端延迟'],
      rows: cpu
        ? [
          ['PP-OCRv6_medium', '1.40'], ['PP-OCRv6_small', '0.59'], ['PP-OCRv6_tiny', '0.20'],
          ['PP-OCRv5_server', '7.30'], ['PP-OCRv5_mobile', '0.78'],
        ]
        : [
          ['PP-OCRv6_medium', '0.29'], ['PP-OCRv6_small', '0.25'], ['PP-OCRv6_tiny', '0.13'],
          ['PP-OCRv5_server', '0.32'], ['PP-OCRv5_mobile', '0.25'],
        ],
    };
  }

  return RAW_TABLES[tab];
}

export const FinalEvidenceIntro: React.FC<WidgetProps> = () => (
  <div className="final-intro-diagram" role="img" aria-label="准确率、忠实性、鲁棒性与延迟共同汇入 PP-OCRv6 的结果判断">
    <div>
      <span>Accuracy</span>
      <span>Faithfulness</span>
      <span>Robustness</span>
      <span>Latency</span>
    </div>
    <b aria-hidden="true">↓</b>
    <strong>PP-OCRv6</strong>
  </div>
);

export const FinalEvidenceBrowser: React.FC<WidgetProps> = () => {
  const [evidenceTab, setEvidenceTab] = useState<EvidenceTab>('detection');
  const [robustnessMode, setRobustnessMode] = useState<RobustnessMode>('crop-margin');
  const [efficiencyMode, setEfficiencyMode] = useState<EfficiencyMode>('cpu');
  const [showRawTable, setShowRawTable] = useState(false);

  const selectTab = (tab: EvidenceTab) => {
    setEvidenceTab(tab);
    setShowRawTable(false);
  };

  const selectRobustness = (mode: RobustnessMode) => {
    setRobustnessMode(mode);
    setShowRawTable(false);
  };

  const selectEfficiency = (mode: EfficiencyMode) => {
    setEfficiencyMode(mode);
    setShowRawTable(false);
  };

  return (
    <div className="final-evidence-browser">
      <div className="final-tabs" role="tablist" aria-label="论文实验维度">
        {(Object.keys(TAB_LABELS) as EvidenceTab[]).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={evidenceTab === tab}
            className={evidenceTab === tab ? 'selected' : ''}
            onClick={() => selectTab(tab)}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <section className="final-evidence-stage" role="tabpanel" aria-live="polite">
        <div className="final-stage-main">
          {evidenceTab === 'detection' ? (
            <KeyComparison
              title="精确定位能力提升"
              metric="Detection Hmean"
              delta="+4.6 pp"
              source="自建 16 类检测 benchmark · Table 4"
              rows={DETECTION_ROWS}
              takeaway="在同一检测协议下，PP-OCRv6_medium 的平均 Hmean 从 81.6% 提升到 86.2%。"
            />
          ) : null}
          {evidenceTab === 'recognition' ? (
            <>
              <KeyComparison
                title="字符转录能力提升"
                metric="Weighted Recognition Accuracy"
                delta="+5.1 pp"
                source="自建 15 类识别 benchmark · Table 6"
                rows={RECOGNITION_ROWS}
                takeaway="在同一识别协议下，PP-OCRv6_medium 的加权平均准确率从 78.1% 提升到 83.2%。"
              />
              <RecognitionSceneDetails />
            </>
          ) : null}
          {evidenceTab === 'faithfulness' ? <FaithfulnessPanel /> : null}
          {evidenceTab === 'robustness' ? <RobustnessPanel mode={robustnessMode} onModeChange={selectRobustness} /> : null}
          {evidenceTab === 'efficiency' ? <EfficiencyPanel mode={efficiencyMode} onModeChange={selectEfficiency} /> : null}
        </div>

        <div className="final-table-toggle-row">
          <button
            className="final-table-toggle"
            aria-expanded={showRawTable}
            onClick={() => setShowRawTable((visible) => !visible)}
          >
            {showRawTable ? '收起论文表格摘录' : '查看论文表格摘录'}
          </button>
          <a href="https://arxiv.org/html/2606.13108" target="_blank" rel="noreferrer">打开论文 HTML</a>
        </div>
        {showRawTable ? <RawTable spec={rawSpecFor(evidenceTab, robustnessMode, efficiencyMode)} /> : null}
      </section>
    </div>
  );
};

const METRICS = [
  ['Hmean', '越高越好'],
  ['Accuracy', '越高越好'],
  ['Consistency', '越高越好'],
  ['CV', '越低越稳定'],
  ['Latency', '越低越快'],
] as const;

export const FinalReadingGuide: React.FC<WidgetProps> = () => (
  <div className="final-guide-grid">
    <article>
      <span>Benchmark</span>
      <h5>在哪测的？</h5>
      <p>论文主要结果来自作者自建 benchmark，覆盖面广，但不能自动代表所有现实 OCR 场景。</p>
      <div className="final-guide-facts"><b>Detection · 16 类</b><b>Recognition · 15 类</b></div>
    </article>
    <article>
      <span>Metric</span>
      <h5>什么叫“更好”？</h5>
      <ul>{METRICS.map(([metric, direction]) => <li key={metric}><b>{metric}</b><span>{direction}</span></li>)}</ul>
    </article>
    <article>
      <span>Hardware / Protocol</span>
      <h5>在哪台机器上跑的？</h5>
      <p>延迟只能在相同 hardware、backend、input size 与测量协议下直接比较。</p>
      <div className="final-guide-warning">不要把不同设备上的秒数放进同一根柱状图。</div>
    </article>
  </div>
);

export const FinalBoundaries: React.FC<WidgetProps> = () => (
  <div className="final-boundary-grid">
    <article>
      <span>01</span>
      <h5>自建 benchmark</h5>
      <strong>高分不等于所有现实场景都同样高。</strong>
      <p>实验覆盖多种类别，但结论仍受数据分布与评测协议限制。</p>
    </article>
    <article>
      <span>02</span>
      <h5>模型档位不同</h5>
      <strong>Medium 的结果不能直接代表 Tiny。</strong>
      <p>Tiny 的结构更简单，识别侧没有 LightSVTR neck，使用更小词典并依赖蒸馏。</p>
    </article>
    <article>
      <span>03</span>
      <h5>速度依赖环境</h5>
      <strong>参数量不是实际延迟的唯一决定因素。</strong>
      <p>后端优化、算子实现、并行度和硬件利用率都会改变最终速度。</p>
    </article>
  </div>
);
