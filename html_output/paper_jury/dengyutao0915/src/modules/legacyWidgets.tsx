// ============================================================
// 旧版互动组件移入：漫画查看器 / 符号概念卡片 / 论文图表库 / 步进动画
// 分别自 paperjury_tutorial/src/components 下的
// ComicViewer / SymbolCard / FigureGallery+FigureModal / InteractiveAnimator 移入
// 均为自包含实现（图片走 public/ 绝对路径）
// ============================================================
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { Comic, SymbolItem, FigureItem, InteractiveAnimation } from './legacyTypes';
import {
  COMICS, COMIC_IDS_BY_CHAPTER,
  SYMBOLS, SYMBOL_CATEGORIES, SYMBOL_CATEGORY_BY_CHAPTER,
  FIGURE_DATA,
  ANIMATIONS, ANIMATION_ID_BY_CHAPTER,
} from './legacyData';
import type { WidgetProps } from './registry';

// ===================== 漫画查看器 =====================
function ComicViewer({ comic }: { comic: Comic }) {
  return (
    <div className="comic-viewer">
      <span className="comic-concept-tag">{comic.concept}</span>
      <img
        src={comic.imagePath}
        alt={comic.title}
        className="comic-image"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
      <div className="comic-caption">{comic.caption}</div>
    </div>
  );
}

/** widget 适配：按章节渲染挂载的漫画 */
export const ComicStrip: React.FC<WidgetProps> = ({ chapterId }) => {
  const ids = COMIC_IDS_BY_CHAPTER[chapterId] || [];
  if (ids.length === 0) return null;
  const comics = ids
    .map((id) => COMICS.find((c) => c.id === id))
    .filter((c): c is Comic => Boolean(c));
  return (
    <div className="legacy-module">
      <div className="legacy-section-title">🎨 漫画图解</div>
      {comics.map((c) => (
        <ComicViewer key={c.id} comic={c} />
      ))}
    </div>
  );
};

// ===================== 符号概念卡片 =====================
const categoryColors: Record<string, string> = {
  '控制流': '#2563eb',
  '审判': '#7c3aed',
  '编辑': '#ea580c',
  '评估': '#16a34a',
};

/** widget 适配：按章节聚焦对应类别，同时保留全部 17 个符号的分类切换 */
export const SymbolCardGrid: React.FC<WidgetProps> = ({ chapterId }) => {
  const focus = SYMBOL_CATEGORY_BY_CHAPTER[chapterId];
  const [activeCategory, setActiveCategory] = useState<string>(focus || '全部');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setActiveCategory(focus || '全部');
  }, [focus]);

  const filtered = useMemo(() => {
    if (activeCategory === '全部') return SYMBOLS;
    return SYMBOLS.filter((s) => s.category === activeCategory);
  }, [activeCategory]);

  const sectionTitles: Record<string, string> = {
    'chap-4': '📐 核心符号 · 控制流',
    'chap-7': '📐 核心符号 · 审判',
    'chap-8': '📐 核心符号 · 编辑',
    'chap-10': '📐 核心符号 · 评估',
  };

  return (
    <div className="symbol-grid-section">
      <div className="symbol-grid-header">
        <h3 className="symbol-grid-title">{sectionTitles[chapterId] || '📐 核心符号速查'}</h3>
        <div className="symbol-category-tabs">
          {['全部', ...SYMBOL_CATEGORIES].map((cat) => (
            <button
              key={cat}
              className={`symbol-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
              style={activeCategory === cat && categoryColors[cat] ? { background: categoryColors[cat], borderColor: categoryColors[cat] } : {}}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div className="symbol-grid">
        {filtered.map((sym) => (
          <SymbolCard
            key={sym.id}
            symbol={sym}
            expanded={expandedId === sym.id}
            onToggle={() => setExpandedId(expandedId === sym.id ? null : sym.id)}
            color={categoryColors[sym.category] || '#6b7280'}
          />
        ))}
      </div>
    </div>
  );
};

function SymbolCard({
  symbol,
  expanded,
  onToggle,
  color,
}: {
  symbol: SymbolItem;
  expanded: boolean;
  onToggle: () => void;
  color: string;
}) {
  return (
    <div
      className={`symbol-card ${expanded ? 'expanded' : ''}`}
      style={{ borderLeftColor: color }}
      onClick={onToggle}
    >
      <div className="symbol-card-header">
        <span className="symbol-icon">{symbol.icon}</span>
        <code className="symbol-code" style={{ color }}>{symbol.symbol}</code>
      </div>
      <div className="symbol-card-name">{symbol.nameZh}</div>
      <div className="symbol-card-en-name">{symbol.name}</div>
      <div className="symbol-card-intuition">{symbol.intuition}</div>
      {expanded && (
        <div className="symbol-card-detail">
          <div className="symbol-detail-row">
            <span className="symbol-detail-label">论文定义</span>
            <span className="symbol-detail-value">{symbol.paperDefinition}</span>
          </div>
          <div className="symbol-detail-row">
            <span className="symbol-detail-label">类别</span>
            <span className="symbol-detail-value" style={{ color }}>{symbol.category}</span>
          </div>
          <div className="symbol-detail-row">
            <span className="symbol-detail-label">出处</span>
            <span className="symbol-detail-value">Table 1, 第 {symbol.page} 页</span>
          </div>
          {symbol.related.length > 0 && (
            <div className="symbol-detail-row">
              <span className="symbol-detail-label">关联</span>
              <span className="symbol-detail-value">{symbol.related.join(' · ')}</span>
            </div>
          )}
        </div>
      )}
      <div className="symbol-card-hint">
        {expanded ? '点击收起 ▲' : '点击展开详情 ▼'}
      </div>
    </div>
  );
}

// ===================== 论文图表库（搜索/筛选/模态查看） =====================
type FilterType = 'all' | 'figure' | 'table';

/** widget 适配：完整图表库（11 张图表，可搜索、按类型/章节筛选、点击放大） */
export const FigureGalleryWidget: React.FC<WidgetProps> = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterChapter, setFilterChapter] = useState<number | 'all'>('all');
  const [openFigure, setOpenFigure] = useState<FigureItem | null>(null);

  const chapters = useMemo(() => {
    const set = new Set(FIGURE_DATA.map((f) => f.chapter));
    return Array.from(set).sort((a, b) => a - b);
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return FIGURE_DATA.filter((f) => {
      if (filterType !== 'all' && f.type !== filterType) return false;
      if (filterChapter !== 'all' && f.chapter !== filterChapter) return false;
      if (q) {
        const searchable = [f.title, f.number, f.description, ...f.keywords, ...f.relatedConcepts]
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [searchQuery, filterType, filterChapter]);

  const highlightText = (text: string) => {
    if (!searchQuery.trim()) return text;
    const q = searchQuery.trim();
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i} className="search-highlight">{part}</mark> : part
    );
  };

  const figureCount = FIGURE_DATA.filter((f) => f.type === 'figure').length;
  const tableCount = FIGURE_DATA.filter((f) => f.type === 'table').length;

  return (
    <div className="legacy-module">
      <div className="gallery-toolbar">
        <div className="gallery-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="搜索图表（标题 / 关键词 / 概念）"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="gallery-search-input"
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>
        <div className="gallery-filters">
          <div className="filter-group">
            <span className="filter-label">类型</span>
            <div className="filter-tabs">
              <button className={`filter-tab ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>全部</button>
              <button className={`filter-tab ${filterType === 'figure' ? 'active' : ''}`} onClick={() => setFilterType('figure')}>📊 图 ({figureCount})</button>
              <button className={`filter-tab ${filterType === 'table' ? 'active' : ''}`} onClick={() => setFilterType('table')}>📋 表 ({tableCount})</button>
            </div>
          </div>
          <div className="filter-group">
            <span className="filter-label">章节</span>
            <select
              className="filter-select"
              value={filterChapter}
              onChange={(e) => setFilterChapter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            >
              <option value="all">全部章节</option>
              {chapters.map((c) => (
                <option key={c} value={c}>第 {c} 章</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="gallery-result-count">
        找到 <strong>{filtered.length}</strong> 张图表
        {searchQuery && <span>（关键词："{searchQuery}"）</span>}
      </div>

      {filtered.length > 0 ? (
        <div className="gallery-grid">
          {filtered.map((fig) => (
            <div key={fig.id} className={`gallery-card ${fig.type}`} onClick={() => setOpenFigure(fig)}>
              <div className="gallery-card-thumb">
                {fig.imagePath ? (
                  <img src={fig.imagePath} alt={fig.title} loading="lazy" />
                ) : (
                  <div className="gallery-card-thumb-placeholder">
                    <span style={{ fontSize: '36px' }}>📋</span>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>结构化数据表</span>
                  </div>
                )}
                <span className={`gallery-card-type-badge ${fig.type}`}>
                  {fig.type === 'figure' ? 'Figure' : 'Table'}
                </span>
              </div>
              <div className="gallery-card-info">
                <div className="gallery-card-number">{fig.number}</div>
                <h4 className="gallery-card-title">{highlightText(fig.title)}</h4>
                <p className="gallery-card-desc">{highlightText(fig.description.slice(0, 60))}…</p>
                <div className="gallery-card-meta">
                  <span>第 {fig.page} 页</span>
                  <span>·</span>
                  <span>第 {fig.chapter} 章</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="gallery-empty">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <p>未找到匹配的图表</p>
          <button
            className="btn primary"
            style={{ marginTop: '16px' }}
            onClick={() => { setSearchQuery(''); setFilterType('all'); setFilterChapter('all'); }}
          >
            清除所有筛选
          </button>
        </div>
      )}

      {openFigure && <FigureModal figure={openFigure} onClose={() => setOpenFigure(null)} />}
    </div>
  );
};

function FigureModal({ figure, onClose }: { figure: FigureItem; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="figure-modal-overlay" onClick={onClose}>
      <div className="figure-modal" onClick={(e) => e.stopPropagation()}>
        <div className="figure-modal-header">
          <div className="figure-modal-title-row">
            <span className={`figure-badge ${figure.type}`}>
              {figure.type === 'figure' ? '📊' : '📋'} {figure.number}
            </span>
            <span className="figure-modal-page">第 {figure.page} 页</span>
          </div>
          <h3 className="figure-modal-title">{figure.title}</h3>
          <button className="figure-modal-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>
        <div className="figure-modal-body">
          {figure.imagePath ? (
            <img src={figure.imagePath} alt={figure.title} className="figure-modal-image" loading="lazy" />
          ) : (
            <div className="figure-modal-table-hint">
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
              <p>此为结构化数据表，详细数据请查看第10章实验验证模块。</p>
              <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
                表号：{figure.number} · 所属章节：第 {figure.chapter} 章
              </p>
            </div>
          )}
        </div>
        <div className="figure-modal-footer">
          <p className="figure-modal-desc">{figure.description}</p>
          <div className="figure-modal-tags">
            {figure.relatedConcepts.map((c) => (
              <span key={c} className="figure-tag">{c}</span>
            ))}
          </div>
          <div className="figure-modal-source">
            来源：论文第 {figure.page} 页 · {figure.number}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== 交互式动画演示（步进 SVG） =====================
function StepAnimator({ animation }: { animation: InteractiveAnimation }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = animation.steps.length;

  const next = useCallback(() => {
    setStep((s) => Math.min(s + 1, total - 1));
  }, [total]);

  const prev = () => setStep((s) => Math.max(s - 1, 0));
  const reset = () => { setStep(0); setPlaying(false); };

  useEffect(() => {
    if (playing) {
      if (step >= total - 1) {
        setPlaying(false);
        return;
      }
      timerRef.current = setTimeout(() => {
        setStep((s) => Math.min(s + 1, total - 1));
      }, 2000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, step, total]);

  const current = animation.steps[step];
  const progressRef = useRef<HTMLDivElement>(null);

  const handleProgressClick = (e: React.MouseEvent) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const newStep = Math.round(ratio * (total - 1));
    setStep(Math.max(0, Math.min(total - 1, newStep)));
  };

  return (
    <div className="animator-container">
      <div className="animator-header">
        <h4>{animation.title}</h4>
        <span className="animator-step-indicator">第 {step + 1} / {total} 步</span>
      </div>
      <div className="animator-canvas">
        <svg viewBox="0 0 800 320" preserveAspectRatio="xMidYMid meet" className="animator-svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f0f0f0" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="800" height="320" fill="url(#grid)" />
          {current.connections?.map((conn, i) => {
            const fromEl = current.elements.find((e) => e.id === conn.from);
            const toEl = current.elements.find((e) => e.id === conn.to);
            if (!fromEl || !toEl) return null;
            const x1 = fromEl.x * 8, y1 = fromEl.y * 3.2 + 25;
            const x2 = toEl.x * 8, y2 = toEl.y * 3.2 + 25;
            const midX = (x1 + x2) / 2;
            return (
              <g key={i}>
                <path
                  d={`M ${x1} ${y1} Q ${midX} ${y1 - 30} ${x2} ${y2}`}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  className="animator-connection"
                />
                {conn.label && (
                  <text x={midX} y={(y1 + y2) / 2 - 20} textAnchor="middle" fontSize="11" fill="#6b7280">
                    {conn.label}
                  </text>
                )}
              </g>
            );
          })}
          {current.elements.map((el) => {
            const cx = el.x * 8;
            const cy = el.y * 3.2 + 25;
            const stateColor = el.state === 'done' ? '#16a34a'
              : el.state === 'active' ? '#2563eb'
              : el.state === 'error' ? '#dc2626'
              : '#9ca3af';
            const fillColor = el.state === 'active' ? '#eff6ff'
              : el.state === 'done' ? '#f0fdf4'
              : el.state === 'error' ? '#fef2f2'
              : '#f9fafb';
            if (el.type === 'circle') {
              return (
                <g key={el.id} className="animator-element">
                  <circle cx={cx} cy={cy} r="28" fill={fillColor} stroke={stateColor} strokeWidth="2.5" />
                  <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill={stateColor}>
                    {el.label.length > 6 ? el.label.slice(0, 5) + '…' : el.label}
                  </text>
                </g>
              );
            }
            if (el.type === 'diamond') {
              return (
                <g key={el.id} className="animator-element">
                  <polygon
                    points={`${cx},${cy - 28} ${cx + 45},${cy} ${cx},${cy + 28} ${cx - 45},${cy}`}
                    fill={fillColor} stroke={stateColor} strokeWidth="2.5"
                  />
                  <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fontWeight="600" fill={stateColor}>
                    {el.label.length > 8 ? el.label.slice(0, 7) + '…' : el.label}
                  </text>
                </g>
              );
            }
            return (
              <g key={el.id} className="animator-element">
                <rect
                  x={cx - 55} y={cy - 22} width="110" height="44"
                  rx="8" fill={fillColor} stroke={stateColor} strokeWidth="2.5"
                />
                <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill={stateColor}>
                  {el.label.length > 10 ? el.label.slice(0, 9) + '…' : el.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="animator-step-desc">
        <div className="animator-step-title">{current.title}</div>
        <div className="animator-step-text">{current.description}</div>
      </div>
      <div className="animator-progress-wrap">
        <div ref={progressRef} className="animator-progress-track" onClick={handleProgressClick}>
          <div className="animator-progress-fill" style={{ width: `${(step / (total - 1)) * 100}%` }} />
          {animation.steps.map((_, i) => (
            <div
              key={i}
              className={`animator-progress-dot ${i <= step ? 'active' : ''} ${i === step ? 'current' : ''}`}
              style={{ left: `${(i / (total - 1)) * 100}%` }}
              onClick={(e) => { e.stopPropagation(); setStep(i); }}
            />
          ))}
        </div>
      </div>
      <div className="animator-controls">
        <button className="animator-btn" onClick={reset} title="重置">⏮ 重置</button>
        <button className="animator-btn" onClick={prev} disabled={step === 0}>◀ 上一步</button>
        <button
          className={`animator-btn animator-btn-primary ${playing ? 'playing' : ''}`}
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? '⏸ 暂停' : '▶ 播放'}
        </button>
        <button className="animator-btn" onClick={next} disabled={step === total - 1}>下一步 ▶</button>
      </div>
    </div>
  );
}

/** widget 适配：按章节选择动画（第4章=完整流水线，第7章=审判内部） */
export const StepAnimatorWidget: React.FC<WidgetProps> = ({ chapterId }) => {
  const animId = ANIMATION_ID_BY_CHAPTER[chapterId];
  if (!animId) return null;
  const anim = ANIMATIONS.find((a) => a.id === animId);
  if (!anim) return null;
  return (
    <div className="legacy-module">
      <StepAnimator animation={anim} />
    </div>
  );
};
