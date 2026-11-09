import React, { useMemo, useRef, useState } from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';
import { L2P_NARRATIVE } from './l2p-narrative-anchor';

type ChapterKey = keyof typeof L2P_NARRATIVE;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function withoutCitations(text: string) {
  return text.replace(/【[^】]+】/g, '').replace(/\s+/g, ' ').trim();
}

function firstSentences(text: string, count: number) {
  const sentences = withoutCitations(text).match(/[^。！？]+[。！？]?/g) ?? [text];
  return sentences.slice(0, count).join('');
}

function keyExcerpt(text: string, maxLength = 108) {
  const excerpt = firstSentences(text, 2).trim();
  if (excerpt.length <= maxLength) return excerpt;
  const head = excerpt.slice(0, maxLength);
  const naturalBreak = Math.max(head.lastIndexOf('，'), head.lastIndexOf('；'), head.lastIndexOf('。'));
  if (naturalBreak >= 72) return head.slice(0, naturalBreak + 1);
  return `${head.replace(/[，、；：\s]+$/u, '')}…`;
}

export function L2PReadableAnchor() {
  return null;
}

function NarrativePage({
  chapter,
  visual,
  source,
}: {
  chapter: ChapterKey;
  visual: React.ReactNode;
  source: string;
}) {
  const content = L2P_NARRATIVE[chapter];
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailLength = [...content.paragraphs, 'takeaway' in content ? content.takeaway : '']
    .join('').replace(/[^\u4e00-\u9fff]/g, '').length;
  return (
    <div className="l2p-explainer">
      <article className="l2p-explainer-copy">
        <p className="l2p-explainer-kicker">一句话先懂</p>
        <p className="l2p-explainer-lead">{firstSentences(content.lead, 2)}</p>
        <div className="l2p-explainer-points" aria-label="本页三个关键要点">
          {content.paragraphs.slice(0, 3).map((paragraph, index) => (
            <div key={index}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{keyExcerpt(paragraph)}</p>
            </div>
          ))}
        </div>
        {'takeaway' in content && <div className="l2p-explainer-takeaway">{content.takeaway}</div>}
        <button
          type="button"
          className="l2p-explainer-toggle"
          aria-expanded={detailsOpen}
          onClick={() => setDetailsOpen(true)}
        >
          <span>继续阅读完整论证</span>
          <small>另有约 {detailLength} 字论文细读</small>
          <b aria-hidden="true">→</b>
        </button>
        <small className="l2p-explainer-source">{source}</small>
        {detailsOpen && (
          <section
            className="l2p-explainer-detail-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="完整论文论证"
            onKeyDown={event => {
              if (event.key === 'Escape') setDetailsOpen(false);
            }}
          >
            <header className="l2p-explainer-detail-head">
              <div>
                <b>完整论文论证</b>
                <span>向下滚动阅读逐段解释与原文定位</span>
              </div>
              <button type="button" onClick={() => setDetailsOpen(false)} aria-label="关闭完整论证">
                关闭
              </button>
            </header>
            <div className="l2p-explainer-detail-body">
              {content.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </div>
            <small className="l2p-explainer-detail-source">{source}</small>
          </section>
        )}
      </article>
      <section className="l2p-explainer-visual">{visual}</section>
    </div>
  );
}

const tones = {
  coast: ['#dcebdc', '#75a49b', '#e2ac76'],
  night: ['#25344e', '#50617f', '#efa45d'],
  herb: ['#e4ddbd', '#93a375', '#687354'],
} as const;

function MiniPhoto({ tone, label, faded = false }: { tone: keyof typeof tones; label: string; faded?: boolean }) {
  const color = tones[tone];
  return (
    <div className={`l2p-mini-photo ${faded ? 'is-faded' : ''}`}>
      <div style={{ background: color[0] }}>
        <span style={{ background: color[1] }} />
        <i style={{ background: color[2] }} />
      </div>
      <b>{label}</b>
    </div>
  );
}

function MiniFilter({ label, color, active = false }: { label: string; color: string; active?: boolean }) {
  return <div className={`l2p-mini-filter ${active ? 'is-active' : ''}`}><span style={{ background: color }} /><b>{label}</b></div>;
}

function SourceBadge({ children }: { children: React.ReactNode }) {
  return <div className="l2p-mini-source">{children}</div>;
}

export function L2PCoverOldWidget(props: WidgetProps) {
  return <L2PCoverScene {...props} forcedSide="oldMethod" />;
}

export function L2PCoverNewWidget(props: WidgetProps) {
  return <L2PCoverScene {...props} forcedSide="newMethod" />;
}

export const L2PCoverOld = L2PCoverOldWidget;
export const L2PCoverNew = L2PCoverNewWidget;

function L2PCoverScene({ moduleId, forcedSide }: WidgetProps & { forcedSide?: 'oldMethod' | 'newMethod' }) {
  const { progress } = useCoverPlayback();
  const isNew = (forcedSide || moduleId) === 'newMethod';
  const move = clamp(progress, 0, 1);
  return (
    <div className="l2p-cover-lite" aria-label={isNew ? '从提示池选择提示' : '覆盖同一套旧参数'}>
      <div className="l2p-cover-lite-photos">
        {(['coast', 'night', 'herb'] as const).map((tone, index) => (
          <MiniPhoto key={tone} tone={tone} label={`任务 ${index + 1}`} faded={!isNew && move > .24 + index * .16} />
        ))}
      </div>
      <div className="l2p-cover-lite-path">
        <b>{isNew ? '冻结相机' : '改写配方'}</b>
        <i>→</i>
        <div className="l2p-cover-lite-filters">
          {['A', 'B', 'C', 'D'].map((label, index) => (
            <MiniFilter key={label} label={label} color={['#5a9c8f', '#d58562', '#5d78a8', '#7e6aa8'][index]}
              active={isNew ? [0, 1, 3].includes(index) && move > .3 : index === 0} />
          ))}
        </div>
      </div>
      <p className={isNew ? 'is-green' : 'is-red'}>
        {isNew ? '旧任务提示保留，当前输入只组合需要的提示。' : '每次新任务都改写同一套配方，旧能力被挤占。'}
      </p>
    </div>
  );
}

export function L2PForgettingWidget() {
  const [step, setStep] = useState(1);
  const visual = (
    <div className="l2p-mini-stack">
      <div className="l2p-mini-contact">
        {(['coast', 'night', 'herb'] as const).map((tone, index) => (
          <MiniPhoto key={tone} tone={tone} label={`任务 ${index + 1}`} faded={step > index + 1} />
        ))}
      </div>
      <div className="l2p-mini-buttons">
        {[1, 2, 3].map(value => (
          <button key={value} className={step === value ? 'is-active' : ''} onClick={() => setStep(value)}>推进到任务 {value}</button>
        ))}
      </div>
      <div className="l2p-mini-note">照片褪色是灾难性遗忘的类比，不对应论文中的任何曲线。</div>
    </div>
  );
  return <NarrativePage chapter="c1" source="原始依据：p.1 Abstract/§1；p.2–3 §2；p.6 Table 1；p.12 App. B。" visual={visual} />;
}

export function L2PPretokensWidget() {
  const visual = (
    <div className="l2p-mini-stack">
      <div className="l2p-token-diagram">
        <div><b>[CLS]</b><span>class token</span></div>
        {Array.from({ length: 8 }, (_, index) => <div key={index}><i /> <span>patch {index + 1}</span></div>)}
        <em>… 共 L = 197 个基础 token</em>
      </div>
      <div className="l2p-shape-card">
        <span>一张 224×224 图</span>
        <b>16×16 patch → 14×14 = 196</b>
        <span>再加 [CLS] → L = 197，D = 768</span>
      </div>
      <div className="l2p-parameter-card">
        <b>10×5×768 + 10×768 = 46,080</b>
        <span>约占主干参数 0.05%【p.7 §5.2】</span>
      </div>
    </div>
  );
  return <NarrativePage chapter="c2" source="原始依据：p.3–4 §3.2/§4.1；p.5 §5.1；p.7 §5.2；p.8 §5.4。L=197、D=768 为按 ViT-B/16 与 224×224 输入推导。" visual={visual} />;
}

export function L2PProtocolWidget() {
  const [selected, setSelected] = useState(3);
  const rows = [
    ['任务增量', '知道 task id', '分类头按任务隔离', '最简单'],
    ['类别增量', '不知道 task id', '统一判别全部已见类', 'Table 1'],
    ['域增量', '不知道 task id', '类别不变，输入域变化', 'Table 3'],
    ['任务无关', '无边界、无 task id', '只能依赖输入本身', 'Table 4'],
  ];
  const visual = (
    <div className="l2p-mini-stack">
      <div className="l2p-protocol-table">
        {rows.map((row, index) => (
          <button key={row[0]} className={selected === index ? 'is-active' : ''} onClick={() => setSelected(index)}>
            <b>{row[0]}</b><span>{row[1]}</span><span>{row[2]}</span><em>{row[3]}</em>
          </button>
        ))}
      </div>
      <SourceBadge>指标不是同一个：有任务边界时看平均准确率与遗忘率，单一测试集时看最终准确率。</SourceBadge>
    </div>
  );
  return <NarrativePage chapter="c3" source="原始依据：p.3 §3.1；p.7 §5.2；p.12 App. C。" visual={visual} />;
}

const keys = [
  { id: 'A', x: 68, y: 74, c: '#5a9c8f' },
  { id: 'B', x: 144, y: 48, c: '#d58562' },
  { id: 'C', x: 320, y: 58, c: '#5d78a8' },
  { id: 'D', x: 360, y: 112, c: '#7e6aa8' },
  { id: 'E', x: 120, y: 178, c: '#b08b55' },
  { id: 'F', x: 265, y: 184, c: '#6c8d55' },
];

export function L2PQueryWidget() {
  const [point, setPoint] = useState({ x: 95, y: 92 });
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const ranked = useMemo(() => keys
    .map(key => ({ ...key, distance: Math.hypot(key.x - point.x, key.y - point.y) }))
    .sort((a, b) => a.distance - b.distance), [point]);
  const move = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPoint({ x: clamp((event.clientX - rect.left) / rect.width * 420, 18, 400), y: clamp((event.clientY - rect.top) / rect.height * 210, 18, 192) });
  };
  const visual = (
    <div className="l2p-mini-stack">
      <svg
        ref={svgRef}
        className="l2p-mini-query-map"
        viewBox="0 0 420 210"
        role="application"
        tabIndex={0}
        aria-label="拖动查询点，观察离输入最近的三个提示键"
        onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); move(event); }}
        onPointerMove={event => { if (dragging) move(event); }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onKeyDown={event => {
          if (event.key === 'ArrowLeft') setPoint(p => ({ ...p, x: clamp(p.x - 12, 18, 400) }));
          if (event.key === 'ArrowRight') setPoint(p => ({ ...p, x: clamp(p.x + 12, 18, 400) }));
          if (event.key === 'ArrowUp') setPoint(p => ({ ...p, y: clamp(p.y - 12, 18, 192) }));
          if (event.key === 'ArrowDown') setPoint(p => ({ ...p, y: clamp(p.y + 12, 18, 192) }));
        }}
      >
        <rect width="420" height="210" rx="12" fill="#fbfaf6" />
        {ranked.map((key, index) => {
          const selected = index < 3;
          return <g key={key.id}>
            <line x1={point.x} y1={point.y} x2={key.x} y2={key.y} stroke={selected ? '#228d5c' : '#c9d0da'} strokeWidth={selected ? 3 : 1.5} strokeDasharray={selected ? '' : '4 5'} />
            <circle cx={key.x} cy={key.y} r={selected ? 12 : 9} fill={key.c} stroke={selected ? '#228d5c' : '#fff'} strokeWidth={selected ? 4 : 2} />
            <text x={key.x} y={key.y + 5} textAnchor="middle" fill="#fff" fontSize="12">{key.id}</text>
          </g>;
        })}
        <circle cx={point.x} cy={point.y} r="8" fill="#27446e" stroke="#fff" strokeWidth="3" />
        <text x="12" y="18" fill="#68778f" fontSize="10">拖动查询点 q(x)</text>
      </svg>
      <div className="l2p-rank-list">
        <b>最近的三把键</b>
        {ranked.slice(0, 3).map((key, index) => <span key={key.id}>第 {index + 1} 近：{key.id}</span>)}
      </div>
      <div className="l2p-formula-mini">
        K<sub>x</sub> = argmin<sub>{"{sᵢ}"}⊆[1,M]</sub> Σ<sub>i=1</sub><sup>N</sup> γ(q(x), k<sub>sᵢ</sub>)
      </div>
      <div className="l2p-mini-note">二维位置只是把高维查询与键投影到平面，便于观察；实际按余弦距离计算。</div>
    </div>
  );
  return <NarrativePage chapter="c4" source="原始依据：p.5 §4.2 Eq.3–4；p.7 Table 5；p.8 §5.4。二维图为教学示意。" visual={visual} />;
}

export function L2PPoolWidget() {
  const [n, setN] = useState(5);
  const chosen = [0, 1, 2, 3, 4].slice(0, n);
  const visual = (
    <div className="l2p-mini-stack">
      <div className="l2p-original-figure is-method"><img src="./images/l2p-method.png" alt="论文 Figure 2：从提示池选择提示并拼接到输入 token" /></div>
      <label className="l2p-mini-range"><span>选择数 N = {n}</span><input type="range" min="1" max="5" value={n} onChange={event => setN(Number(event.target.value))} /></label>
      <div className="l2p-sequence-bar">
        {Array.from({ length: n }, (_, index) => <span key={`p-${index}`} className="is-prompt">P{chosen[index] + 1}</span>)}
        {Array.from({ length: 6 }, (_, index) => <span key={`x-${index}`}>x{index + 1}</span>)}
        <em>…</em>
      </div>
      <div className="l2p-formula-mini">
        x<sub>p</sub> = [P<sub>s₁</sub>; … ; P<sub>s<sub>N</sub></sub>; x<sub>e</sub>]，长度 N·L<sub>p</sub> + L
      </div>
      <div className="l2p-shape-card"><b>{n} × L<sub>p</sub> + 197</b><span>提示参与序列长度，也通过注意力影响后续所有层。</span></div>
    </div>
  );
  return <NarrativePage chapter="c5" source="原始依据：p.4 §4.1 Eq.1–2；p.7 §5.2；p.13 Algorithm 1。" visual={visual} />;
}

export function L2PSelectionWidget() {
  const [dataset, setDataset] = useState<'cifar' | 'five'>('cifar');
  const visual = (
    <div className="l2p-mini-stack">
      <div className="l2p-mini-tabs">
        <button className={dataset === 'cifar' ? 'is-active' : ''} onClick={() => setDataset('cifar')}>Split CIFAR-100</button>
        <button className={dataset === 'five' ? 'is-active' : ''} onClick={() => setDataset('five')}>5-datasets</button>
      </div>
      <div className="l2p-original-figure"><img src="./images/l2p-selection.png" alt="不同任务的提示选择频率直方图" /></div>
      <div className="l2p-mini-note">
        {dataset === 'cifar' ? '同源任务之间共享更多提示。' : '异构任务之间共享更少，专用提示更多。'}
        原图仅展示前五个 CIFAR-100 任务；不是准确率图。
      </div>
    </div>
  );
  return <NarrativePage chapter="c6" source="原始依据：p.7 Figure 3/§5.3；p.8 §5.4；p.12 App. C。" visual={visual} />;
}

export function L2PLossWidget() {
  const visual = (
    <div className="l2p-mini-stack">
      <div className="l2p-objective-card">
        <b><SymbolHint meaning="L：总训练损失；越小越好。">L</SymbolHint> = </b>
        <span><SymbolHint meaning="CE：分类交叉熵，约束预测类别与标签一致。">CE</SymbolHint>(g<sub>φ</sub>(f<sub>r</sub><sup>avg</sup>(x<sub>p</sub>)), y)</span>
        <span>+ <SymbolHint meaning="λ：键对齐项权重，论文取 0.5。">λ</SymbolHint>Σ<SymbolHint meaning="γ：查询 q(x) 与选中键的距离分数，越小表示越接近。">γ</SymbolHint>(q(x), k<sub>sᵢ</sub>)</span>
      </div>
      <div className="l2p-pool-token-bar">
        <span className="is-prompt">P₁</span><span className="is-prompt">…</span><span className="is-prompt">P<sub>N·Lp</sub></span>
        <span className="is-image">[CLS]</span><span className="is-image">patch 1</span><span className="is-image">…</span>
        <em>不参与 AvgPool</em>
      </div>
      <div className="l2p-pooling-note">只对前 N·L<sub>p</sub> 个提示位置的输出做 AvgPool。</div>
      <div className="l2p-mini-note">训练变量只有 P、K、φ；冻结主干不做梯度更新。</div>
    </div>
  );
  return <NarrativePage chapter="c7" source="原始依据：p.5 §4.3 Eq.5；p.7 §5.2；p.13 Algorithm 1。" visual={visual} />;
}

export function L2PTrainingWidget() {
  const [stage, setStage] = useState(0);
  const stages = [
    ['计算查询', '冻结模型输出 [CLS] 特征 q(x)。'],
    ['选择提示', '在 M 把键中取余弦距离最近的 N 把。'],
    ['拼接并前向', '把 N 个提示拼在图像 token 前，送入冻结 Transformer。'],
    ['更新小参数', '只更新提示 P、键 K 与分类器 φ。'],
  ];
  const visual = (
    <div className="l2p-mini-stack">
      <div className="l2p-training-mini-flow">
        {['输入 x', 'q(x)', 'Top-N', '拼接', '冻结 Transformer', 'AvgPool', '分类器'].map((label, index) => (
          <React.Fragment key={label}>
            <div className={`l2p-flow-mini ${index < stage + 3 ? 'is-active' : ''} ${index < 2 || index === 4 ? 'is-frozen' : 'is-trainable'}`}>{label}</div>
            {index < 6 && <i>→</i>}
          </React.Fragment>
        ))}
      </div>
      <div className="l2p-mini-buttons">
        {stages.map(([label], index) => <button key={label} className={stage === index ? 'is-active' : ''} onClick={() => setStage(index)}>{label}</button>)}
      </div>
      <div className="l2p-stage-explain"><b>{stages[stage][0]}</b><span>{stages[stage][1]}</span></div>
      <div className="l2p-mini-note">每个任务：CIFAR/CORe50 配置训 5 epoch；任务无关配置每个 batch 只训一次。</div>
    </div>
  );
  return <NarrativePage chapter="c8" source="原始依据：p.7 §5.2；p.12 App. D；p.13 Algorithm 1。" visual={visual} />;
}

const resultRows = {
  cifar: {
    title: 'Split CIFAR-100',
    rows: [['FT-seq', '33.61 / 86.87'], ['EWC', '47.01 / 33.27'], ['LwF', '60.69 / 27.77'], ['L2P', '83.83 / 7.63'], ['上界', '90.85 / —']],
  },
  five: {
    title: '5-datasets',
    rows: [['FT-seq', '20.12 / 94.63'], ['EWC', '50.93 / 34.94'], ['LwF', '47.91 / 38.01'], ['L2P', '81.14 / 4.64'], ['上界', '93.93 / —']],
  },
  core50: {
    title: 'CORe50 域增量',
    rows: [['EWC', '74.82'], ['LwF', '75.45'], ['L2P', '78.33'], ['ER', '80.10'], ['L2P-R', '81.07'], ['上界', '82.15']],
  },
  agnostic: {
    title: '任务无关 CIFAR-100',
    rows: [['EWC', '63.04'], ['L2P', '88.34'], ['ER', '82.63'], ['DER++', '85.24'], ['L2P-R', '88.92'], ['上界', '90.85']],
  },
};

export function L2PResultsWidget() {
  const [dataset, setDataset] = useState<keyof typeof resultRows>('cifar');
  const data = resultRows[dataset];
  const visual = (
    <div className="l2p-mini-stack">
      <div className="l2p-mini-tabs is-four">
        {([
          ['cifar', 'CIFAR-100'],
          ['five', '5-datasets'],
          ['core50', 'CORe50'],
          ['agnostic', '任务无关'],
        ] as const).map(([key, label]) => <button key={key} className={dataset === key ? 'is-active' : ''} onClick={() => setDataset(key)}>{label}</button>)}
      </div>
      <div className="l2p-result-table">
        <div className="is-head"><b>{data.title}</b><span>{dataset === 'cifar' || dataset === 'five' ? '准确率 / 遗忘率' : '最终准确率'}</span></div>
        {data.rows.map(([method, value]) => <div key={method} className={method === 'L2P' ? 'is-paper' : ''}><b>{method}</b><span>{value}</span></div>)}
      </div>
      <div className="l2p-mini-note">不同协议与指标不可相加；上界不是增量训练曲线。</div>
    </div>
  );
  return <NarrativePage chapter="c9" source="原始依据：p.6 Table 1–3；p.7 Table 4/§5.3；p.7 §5.2 统计口径。" visual={visual} />;
}

export function L2PAblationWidget() {
  const [active, setActive] = useState(0);
  const rows = [
    ['完整 L2P', 81.14, 4.64],
    ['去掉提示池', 51.96, 26.60],
    ['去掉键值对', 58.33, 20.45],
    ['去掉多样化选择', 62.26, 17.84],
  ] as const;
  const visual = (
    <div className="l2p-mini-stack">
      <div className="l2p-ablation-mini">
        {rows.map(([label, accuracy, forgetting], index) => (
          <button key={label} className={active === index ? 'is-active' : ''} onClick={() => setActive(index)}>
            <span>{label}</span><i><em style={{ width: `${accuracy}%` }} /></i>
            <b>{accuracy.toFixed(2)}%</b><small>F={forgetting.toFixed(2)}</small>
          </button>
        ))}
      </div>
      <div className="l2p-stage-explain"><b>{rows[active][0]}</b><span>平均准确率 {rows[active][1].toFixed(2)}%，遗忘率 {rows[active][2].toFixed(2)}%。</span></div>
      <div className="l2p-mini-note">全部为 5-datasets 消融；各变体与完整模型的差值不可相加。</div>
    </div>
  );
  return <NarrativePage chapter="c10" source="原始依据：p.7 Table 5；p.8 §5.4。" visual={visual} />;
}

const hyper = {
  cifar: {
    label: 'Split CIFAR-100',
    ns: [1, 5, 10, 20],
    rows: [[77.01, 82.49, 83.39, 83.15], [82.88, 83.50, 83.39, 82.84], [83.28, 83.18, 83.13, 81.84], [83.40, 82.60, 81.60, 79.65]],
  },
  five: {
    label: '5-datasets',
    ns: [1, 2, 4, 8],
    rows: [[70.87, 78.34, 79.26, 79.50], [75.30, 80.65, 80.68, 80.83], [74.82, 81.14, 80.84, 79.81], [77.20, 76.54, 77.25, 76.03]],
  },
};

export function L2PHyperparamsWidget() {
  const [dataset, setDataset] = useState<'cifar' | 'five'>('cifar');
  const [cell, setCell] = useState<[number, number]>([1, 1]);
  const data = hyper[dataset];
  const lps = [1, 5, 10, 20];
  const visual = (
    <div className="l2p-mini-stack">
      <div className="l2p-mini-tabs">
        <button className={dataset === 'cifar' ? 'is-active' : ''} onClick={() => { setDataset('cifar'); setCell([1, 1]); }}>CIFAR-100</button>
        <button className={dataset === 'five' ? 'is-active' : ''} onClick={() => { setDataset('five'); setCell([1, 1]); }}>5-datasets</button>
      </div>
      <table className="l2p-mini-heatmap">
        <thead><tr><th>L<sub>p</sub> \ N</th>{data.ns.map(n => <th key={n}>{n}</th>)}</tr></thead>
        <tbody>{data.rows.map((row, rowIndex) => (
          <tr key={lps[rowIndex]}><th>{lps[rowIndex]}</th>{row.map((value, colIndex) => (
            <td key={colIndex}><button className={cell[0] === rowIndex && cell[1] === colIndex ? 'is-active' : ''} onClick={() => setCell([rowIndex, colIndex])}>{value.toFixed(2)}</button></td>
          ))}</tr>
        ))}</tbody>
      </table>
      <div className="l2p-stage-explain"><b>L<sub>p</sub>={lps[cell[0]]}，N={data.ns[cell[1]]}</b><span>{data.label} 平均准确率 {data.rows[cell[0]][cell[1]].toFixed(2)}%。固定 M=20。</span></div>
      <div className="l2p-mini-note">两个数据集的 N 取值不同；色深只辅助读表。默认实验配置与 Figure 4 的 M 不同。</div>
    </div>
  );
  return <NarrativePage chapter="c11" source="原始依据：p.7 §5.2；p.8 Figure 4/§5.4。" visual={visual} />;
}

export function L2PBoundaryWidget() {
  const cards = [
    ['无回放', '类别增量、零缓存结果支持这一点；但仍需标签与交叉熵训练，不是无监督方法。'],
    ['无任务编号', '依靠实例查询；若启用多样化选择，训练时仍需要任务边界。'],
    ['容量受控', 'M、L_p、N 共同决定容量，最优组合依数据集变化，没有通用最优值。'],
  ];
  const visual = (
    <div className="l2p-mini-stack">
      <div className="l2p-stamp-stack">
        {cards.map(([title, text], index) => (
          <div key={title} className={`l2p-stamp ${index === 0 ? 'is-green' : index === 1 ? 'is-blue' : 'is-orange'}`}>
            <b>{title}</b><span>{text}</span>
          </div>
        ))}
      </div>
      <div className="l2p-boundary-box">
        <b>论文没有证明的四件事</b>
        <span>不是所有模态都已验证；不代表 ConvNet 已经可用；任务无关基准仍属合成；λ 不是越大越好。</span>
      </div>
    </div>
  );
  return <NarrativePage chapter="c12" source="原始依据：p.6 Table 2–3；p.7 Table 4/§5.2；p.12 App. A–B。" visual={visual} />;
}
