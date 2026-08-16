import React from 'react';
import type { Meta, HeroConfig } from '../types';
import { widgetRegistry } from '../modules/registry';

type GlossaryKind = 'umap' | 'knn' | 'pagerank' | 'kcore' | 'coefficient';

type GlossaryEntry = {
  kind: GlossaryKind;
  plain: string;
  analogy: string;
  example: string;
};

const heroGlossary: Record<string, GlossaryEntry> = {
  UMAP: {
    kind: 'umap',
    plain: '一种非线性降维方法。它先在高维空间寻找局部近邻，再优化每个样本在二维平面中的位置。',
    analogy: '像把一份每个人都有很多项资料的名册排成二维座位图：尽量让原本相近的人坐近，但座位间距不再等于资料中的完整差异。',
    example: '一张 28×28 的服饰图包含 784 个像素特征。UMAP 把每张图画成一个点，让相似服饰尽量靠近，方便观察整体分布。',
  },
  'kNN graph': {
    kind: 'knn',
    plain: 'UMAP 在投影前依据高维距离建立的有向图。每个样本指向自己的 k 个近邻，边还可以记录邻近关系的强弱。',
    analogy: '像让每个人写下与自己最相似的 k 个名字。A 把 B 写进名单只产生 A→B，B 不一定也选择 A，因此方向不能反读。',
    example: '若 k=3，一只运动鞋会指向高维特征最接近的 3 只鞋。每个点都有 3 条出边，但入度会随被选择次数而变化。',
  },
  PageRank: {
    kind: 'pagerank',
    plain: '一种沿加权有向边递归传递分数的全局排名。入边数量重要，指向该节点的来源节点有多重要也同样重要。',
    analogy: '像专家推荐：被许多人推荐是一条线索，而一位公认专家的推荐权重更高；推荐关系反复传递，直到所有人的排名稳定。',
    example: '论文把高 PageRank 的 Fashion-MNIST 样本视为代表点；它们通常比低分样本更接近该类服饰的典型外观。',
  },
  'in-degree k-core': {
    kind: 'kcore',
    plain: '一种按当前入度反复剥离节点的方法。节点的 coreness 是它能够留在图中的最高入度门槛。',
    analogy: '像逐轮提高留场门槛：每轮移除在剩余人群中获得推荐不足 k 次的人；移除会让其他人失去入边，所以必须继续检查，直到结构稳定。',
    example: '论文筛出 Fashion-MNIST 中 coreness=6 的 bag 节点，发现 messenger bag、waist pack 与不同纹理等稳定子区域。',
  },
  'clustering coefficient': {
    kind: 'coefficient',
    plain: '一种局部凝聚指标。它不统计某个点有多少近邻，而是检查这些近邻之间实际存在多少条可能的有向连接。',
    analogy: '像检查一份熟人名单：重点不是“我认识多少人”，而是名单上的人彼此是否也熟悉；互相认识得越完整，局部群体越紧密。',
    example: '论文在 MNIST 数字 6 中找到高分微邻域，同一区域的样本具有相近的倾斜角度、圆环大小与笔画弯曲。',
  },
};

function GlossaryVisual({ kind }: { kind: GlossaryKind }) {
  const markerId = `glossary-arrow-${kind}`;
  const marker = (
    <defs>
      <marker id={markerId} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
        <path d="M0,0 L5,2.5 L0,5 Z" fill="#68778f" />
      </marker>
    </defs>
  );

  if (kind === 'umap') {
    return (
      <svg viewBox="0 0 148 88" role="img" aria-label="高维特征经过 UMAP 变成二维簇">
        {marker}
        {[0, 1, 2, 3, 4].map((index) => (
          <rect key={index} x={13 + index * 8} y={21 + (index % 2) * 7} width="5" height={36 - index * 3} rx="1" fill={index % 2 ? '#d97706' : '#27446e'} opacity="0.78" />
        ))}
        <path d="M60 43 H87" stroke="#68778f" strokeWidth="1.5" markerEnd={`url(#${markerId})`} />
        {[[105, 28], [114, 23], [119, 34], [101, 38], [128, 55], [119, 62], [136, 64], [111, 55]].map(([cx, cy], index) => (
          <circle key={index} cx={cx} cy={cy} r="3" fill={index < 4 ? '#228d5c' : '#7c3aed'} />
        ))}
      </svg>
    );
  }

  if (kind === 'knn') {
    const neighbors = [[103, 19], [118, 45], [93, 69]];
    return (
      <svg viewBox="0 0 148 88" role="img" aria-label="一个样本指向三个最近邻">
        {marker}
        {neighbors.map(([x, y], index) => (
          <path key={index} d={`M49 44 L${x - 6} ${y}`} stroke="#68778f" strokeWidth="1.4" markerEnd={`url(#${markerId})`} />
        ))}
        <circle cx="43" cy="44" r="8" fill="#d97706" stroke="#fff" strokeWidth="2" />
        {neighbors.map(([x, y], index) => <circle key={index} cx={x} cy={y} r="6" fill="#228d5c" stroke="#fff" strokeWidth="2" />)}
        {[[22, 20], [22, 67], [132, 24], [132, 68]].map(([cx, cy], index) => <circle key={index} cx={cx} cy={cy} r="3" fill="#b8c1ce" />)}
      </svg>
    );
  }

  if (kind === 'pagerank') {
    const sources = [[24, 20], [27, 68], [73, 16], [122, 30], [119, 66]];
    return (
      <svg viewBox="0 0 148 88" role="img" aria-label="多个节点把重要性传向中心节点">
        {marker}
        {sources.map(([x, y], index) => <path key={index} d={`M${x} ${y} L70 43`} stroke="#68778f" strokeWidth={index === 3 ? 2 : 1.2} opacity="0.72" markerEnd={`url(#${markerId})`} />)}
        {sources.map(([cx, cy], index) => <circle key={index} cx={cx} cy={cy} r={index === 3 ? 6 : 4} fill={index === 3 ? '#27446e' : '#8fa0b7'} />)}
        <circle cx="76" cy="44" r="15" fill="rgba(217,119,6,0.12)" stroke="#d97706" strokeWidth="2" />
        <circle cx="76" cy="44" r="7" fill="#d97706" stroke="#fff" strokeWidth="2" />
      </svg>
    );
  }

  if (kind === 'kcore') {
    return (
      <svg viewBox="0 0 148 88" role="img" aria-label="节点从外围到核心形成三层结构">
        <ellipse cx="74" cy="44" rx="59" ry="34" fill="none" stroke="#cbd3de" strokeDasharray="4 4" />
        <ellipse cx="74" cy="44" rx="38" ry="23" fill="rgba(39,68,110,0.04)" stroke="#8fa0b7" />
        <ellipse cx="74" cy="44" rx="18" ry="12" fill="rgba(34,141,92,0.1)" stroke="#228d5c" strokeWidth="1.5" />
        {[[21, 25], [22, 63], [126, 25], [127, 62]].map(([cx, cy], index) => <circle key={index} cx={cx} cy={cy} r="3.5" fill="#c43f52" />)}
        {[[46, 28], [43, 56], [103, 31], [102, 58]].map(([cx, cy], index) => <circle key={index} cx={cx} cy={cy} r="4" fill="#27446e" />)}
        {[[67, 42], [77, 36], [83, 47], [70, 52]].map(([cx, cy], index) => <circle key={index} cx={cx} cy={cy} r="4.5" fill="#228d5c" />)}
      </svg>
    );
  }

  const neighbors = [[74, 15], [113, 34], [100, 72], [42, 67]];
  return (
    <svg viewBox="0 0 148 88" role="img" aria-label="中心节点有四个近邻，其中三个近邻通过有向边形成紧密局部结构">
      {marker}
      {neighbors.slice(0, 3).map(([x, y], index) => {
        const next = neighbors[(index + 1) % 3];
        const dx = next[0] - x;
        const dy = next[1] - y;
        const length = Math.hypot(dx, dy) || 1;
        const ux = dx / length;
        const uy = dy / length;
        return <line key={index} x1={x + ux * 6} y1={y + uy * 6} x2={next[0] - ux * 8} y2={next[1] - uy * 8} stroke="#228d5c" strokeWidth="2" markerEnd={`url(#${markerId})`} />;
      })}
      {neighbors.map(([x, y], index) => <line key={index} x1="72" y1="45" x2={x} y2={y} stroke={index === 3 ? '#cbd3de' : '#8fa0b7'} strokeWidth="1.4" />)}
      {neighbors.map(([cx, cy], index) => <circle key={index} cx={cx} cy={cy} r="5" fill={index === 3 ? '#cbd3de' : '#228d5c'} stroke="#fff" strokeWidth="1.5" />)}
      <circle cx="72" cy="45" r="7" fill="#d97706" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

function GlossaryChip({ label, entry }: { label: string; entry: GlossaryEntry }) {
  const tooltipId = React.useId();
  const chipRef = React.useRef<HTMLSpanElement>(null);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return undefined;
    const onDocumentPointerDown = (event: PointerEvent) => {
      if (!chipRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('pointerdown', onDocumentPointerDown);
    document.addEventListener('keydown', onDocumentKeyDown);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('pointerdown', onDocumentPointerDown);
      document.removeEventListener('keydown', onDocumentKeyDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const toggle = () => setOpen((value) => !value);
  const onKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    }
  };

  return (
    <span
      ref={chipRef}
      className="tag hero-glossary-chip"
      role="button"
      tabIndex={0}
      aria-expanded={open}
      aria-controls={tooltipId}
      aria-label={`查看 ${label} 的概念解释`}
      onClick={(event) => { event.stopPropagation(); toggle(); }}
      onKeyDown={onKeyDown}
    >
      <span>{label}</span>
      <span className="hero-glossary-info" aria-hidden="true">i</span>
      <span className="hero-glossary-popover" id={tooltipId} role="dialog" aria-hidden={!open}>
        <span className="hero-glossary-visual"><GlossaryVisual kind={entry.kind} /></span>
        <span className="hero-glossary-copy">
          <strong>{label}</strong>
          <span><b>概念：</b>{entry.plain}</span>
          <span><b>怎么理解：</b>{entry.analogy}</span>
          <span><b>论文例子：</b>{entry.example}</span>
        </span>
      </span>
    </span>
  );
}

// Hero: paper metadata + old/new two-column contrast. Each side may show a canvas
// widget (componentId) and/or a paper figure. A "start" button kicks off progressive
// chapter reveal.
export function Hero({
  meta,
  hero,
  onStart,
  started,
}: {
  meta: Meta;
  hero: HeroConfig;
  onStart: () => void;
  started: boolean;
}) {
  const insightRef = React.useRef<HTMLParagraphElement>(null);
  const OldWidget = hero.oldMethod.componentId ? widgetRegistry[hero.oldMethod.componentId] : undefined;
  const NewWidget = hero.newMethod.componentId ? widgetRegistry[hero.newMethod.componentId] : undefined;
  const FlowWidget = NewWidget || OldWidget;
  const titleKeyword = '数据理解';
  const titleParts = meta.titleZh.split(titleKeyword);
  const hasTitleKeyword = titleParts.length > 1;

  React.useEffect(() => {
    const host = insightRef.current;
    if (!host) return undefined;
    const terms = Array.from(host.querySelectorAll<HTMLElement>('.hero-term[data-tip]'));
    const closeAll = (except?: HTMLElement) => terms.forEach((term) => {
      if (term !== except) {
        term.dataset.open = 'false';
        term.setAttribute('aria-expanded', 'false');
      }
    });
    const toggle = (term: HTMLElement) => {
      const nextOpen = term.dataset.open !== 'true';
      closeAll(term);
      term.dataset.open = String(nextOpen);
      term.setAttribute('aria-expanded', String(nextOpen));
    };
    const cleanups = terms.map((term) => {
      term.setAttribute('role', 'button');
      term.setAttribute('aria-expanded', 'false');
      term.dataset.open = 'false';
      const onClick = (event: MouseEvent) => {
        event.stopPropagation();
        toggle(term);
      };
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle(term);
        } else if (event.key === 'Escape') {
          closeAll();
        }
      };
      term.addEventListener('click', onClick);
      term.addEventListener('keydown', onKeyDown);
      return () => {
        term.removeEventListener('click', onClick);
        term.removeEventListener('keydown', onKeyDown);
      };
    });
    const onDocumentPointerDown = (event: PointerEvent) => {
      if (!host.contains(event.target as Node)) closeAll();
    };
    const onScroll = () => closeAll();
    document.addEventListener('pointerdown', onDocumentPointerDown);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      cleanups.forEach((cleanup) => cleanup());
      document.removeEventListener('pointerdown', onDocumentPointerDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [meta.coreInsight]);

  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-venue">Interactive Tutorial</div>
        <h1>{meta.titleEn}</h1>
        <div className="hero-sub">
          {hasTitleKeyword ? (
            <>
              {titleParts[0]}
              <strong className="hero-keyword">{titleKeyword}</strong>
              {titleParts.slice(1).join(titleKeyword)}
            </>
          ) : meta.titleZh}
          <span className="hero-sub-sep"> · </span>
          <span className="hero-paper-id">{meta.venue}</span>
        </div>
        <div className="hero-affiliation" aria-label="论文作者机构：Apple">
          <img src="/images/apple-logo.svg" alt="" />
          <span>Apple</span>
          <small>论文作者机构</small>
        </div>
        <p ref={insightRef} className="hero-abs" dangerouslySetInnerHTML={{ __html: meta.coreInsight }} />
        <div className="hero-meta">
          {(meta.keywords || []).map((keyword) => {
            const entry = heroGlossary[keyword];
            return entry
              ? <GlossaryChip key={keyword} label={keyword} entry={entry} />
              : <span key={keyword} className="tag">{keyword}</span>;
          })}
        </div>

        {FlowWidget ? (
          <div className="hero-flow">
            <div className="hero-flow-head">
              <div>
                <span>UMAP 的主要流程</span>
                <strong>先构建近邻图，再优化二维布局</strong>
              </div>
              <span className="hero-flow-note">两个值得保留的产物</span>
            </div>
            <FlowWidget chapterId="hero" moduleId="overview" />
          </div>
        ) : null}

        <div className="hero-compare-title">
          <span>同一条 UMAP 流程</span>
          <strong>两种数据理解入口</strong>
        </div>
        <div className="hero-compare">
          <div className="bg-side old">
            <div className="bg-side-head">
              <span>传统分析</span>
              <small>读取二维布局</small>
            </div>
            <div className="bg-side-canvas">
              {OldWidget ? <OldWidget chapterId="hero" moduleId="old" /> : null}
              {hero.oldMethod.figure ? (
                <img src={hero.oldMethod.figure} alt="传统方法" style={{ width: '100%' }} />
              ) : null}
            </div>
            <div className="bg-side-tag">
              <span dangerouslySetInnerHTML={{ __html: hero.oldMethod.desc }} />
            </div>
          </div>
          <div className="bg-side new">
            <div className="bg-side-head">
              <span>本文分析</span>
              <small>读取 kNN graph</small>
            </div>
            <div className="bg-side-canvas">
              {NewWidget ? <NewWidget chapterId="hero" moduleId="new" /> : null}
              {hero.newMethod.figure ? (
                <img src={hero.newMethod.figure} alt="本文方法" style={{ width: '100%' }} />
              ) : null}
            </div>
            <div className="bg-side-tag">
              <span dangerouslySetInnerHTML={{ __html: hero.newMethod.desc }} />
            </div>
          </div>
        </div>

        {!started ? (
          <div className="chap-loader">
            <div className="chap-loader-hint">准备好了吗？</div>
            <button className="chap-loader-btn" onClick={onStart}>
              开始学习 §1 <span className="chap-loader-arrow">→</span>
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
