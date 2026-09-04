import { useEffect, useRef, useState } from 'react';
import { Term } from '../components/Glossary';
import { PaperMedia } from '../components/PaperMedia';
import type { MediaAssetId } from '../data/media';
import type { ChapterExperienceProps } from '../types';

type CandidateId = 'repeat-a' | 'repeat-b' | 'double-column' | 'triple-column' | 'formula-table' | 'complex-layout';
type PageState = 'random' | 'cluster' | 'ddas';
type DdasView = 'candidates' | 'page' | 'element';
type ElementKind = 'text' | 'formula' | 'table';
type ArrowKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown';

interface DdasCandidate {
  id: CandidateId;
  x: number;
  y: number;
  label: string;
  cluster: string;
  isLongTail: boolean;
  assetId?: MediaAssetId;
  cropId?: string;
}

const CANDIDATES: readonly DdasCandidate[] = [
  { id: 'repeat-a', x: 14, y: 24, label: '普通单栏 A', cluster: '高频单栏', isLongTail: false },
  { id: 'repeat-b', x: 32, y: 37, label: '普通单栏 B', cluster: '高频单栏', isLongTail: false },
  { id: 'double-column', x: 54, y: 22, label: '双栏论文', cluster: '多栏版式', isLongTail: false, assetId: 'omni-layout', cropId: 'doubleColumn' },
  { id: 'triple-column', x: 75, y: 31, label: '三栏法规', cluster: '多栏版式', isLongTail: true, assetId: 'omni-layout', cropId: 'tripleColumn' },
  { id: 'formula-table', x: 36, y: 74, label: '公式与表格', cluster: '结构元素', isLongTail: true, assetId: 'omni-table', cropId: 'formula' },
  { id: 'complex-layout', x: 86, y: 72, label: '复杂版式', cluster: '复杂版式', isLongTail: true, assetId: 'omni-layout', cropId: 'complexLayout' },
];

const DEFAULT_CANDIDATE: Record<PageState, CandidateId> = {
  random: 'repeat-a',
  cluster: 'double-column',
  ddas: 'formula-table',
};

const ELEMENT_EVIDENCE: Record<ElementKind, { assetId: MediaAssetId; cropId: string; key: string; label: string }> = {
  text: { assetId: 'omni-layout', cropId: 'tripleColumn', key: 'omni-layout/tripleColumn', label: '文本与多栏阅读顺序' },
  formula: { assetId: 'omni-table', cropId: 'formula', key: 'omni-table/formula', label: '公式结构' },
  table: { assetId: 'omni-table', cropId: 'mergedCellTable', key: 'omni-table/mergedCellTable', label: '合并单元格表格' },
};

const ELEMENT_LABEL: Record<ElementKind, string> = { text: '文本', formula: '公式', table: '表格' };

function findCandidate(id: CandidateId) {
  return CANDIDATES.find((candidate) => candidate.id === id) ?? CANDIDATES[0];
}

function nearestCandidate(x: number, y: number) {
  return CANDIDATES.reduce((best, candidate) => {
    const bestDistance = (best.x - x) ** 2 + (best.y - y) ** 2;
    const candidateDistance = (candidate.x - x) ** 2 + (candidate.y - y) ** 2;
    return candidateDistance < bestDistance ? candidate : best;
  });
}

function nearestInDirection(current: DdasCandidate, key: ArrowKey) {
  const candidates = CANDIDATES.filter((candidate) => {
    if (key === 'ArrowLeft') return candidate.x < current.x;
    if (key === 'ArrowRight') return candidate.x > current.x;
    if (key === 'ArrowUp') return candidate.y < current.y;
    return candidate.y > current.y;
  });
  return candidates.reduce<DdasCandidate | undefined>((best, candidate) => {
    if (!best) return candidate;
    const distance = (candidate.x - current.x) ** 2 + (candidate.y - current.y) ** 2;
    const bestDistance = (best.x - current.x) ** 2 + (best.y - current.y) ** 2;
    return distance < bestDistance ? candidate : best;
  }, undefined) ?? current;
}

function OrdinaryPage({ suffix }: { suffix: string }) {
  return <span className="ddas-ordinary-page" aria-hidden="true">
    <b>{suffix}</b><i /><i /><i className="short" /><i /><i className="short" />
  </span>;
}

function CandidateVisual({ candidate }: { candidate: DdasCandidate }) {
  return candidate.assetId && candidate.cropId
    ? <PaperMedia assetId={candidate.assetId} cropId={candidate.cropId} variant="thumbnail" viewer={false} chrome={false} />
    : <OrdinaryPage suffix={candidate.id === 'repeat-a' ? 'A' : 'B'} />;
}

function FigureEvidence({ view }: { view: DdasView }) {
  const elementLevel = view === 'element';
  return <div className="ddas-figure-rail" data-testid="ddas-figure-rail">
    <span className="source-tag paper">论文原图节选</span>
    <PaperMedia assetId="mineru-ddas" cropId={elementLevel ? 'elementLevel' : 'pageLevel'} variant="stage" viewer="crop" chrome={false} />
    <p><strong>Figure 3</strong><span>{elementLevel ? '元素级筛选' : '页面级筛选'}</span></p>
  </div>;
}

export function DdasMicroscope({ restoredModuleState, onComplete, onInteract, onStateChange }: ChapterExperienceProps) {
  const [view, setView] = useState<DdasView>('candidates');
  const [pageState, setPageState] = useState<PageState>('cluster');
  const [activeCandidateId, setActiveCandidateId] = useState<CandidateId>('double-column');
  const [selectedCandidateId, setSelectedCandidateId] = useState<CandidateId>('double-column');
  const [element, setElement] = useState<ElementKind>('text');
  const candidateRefs = useRef<Partial<Record<CandidateId, HTMLButtonElement | null>>>({});
  const restoreFocus = useRef(false);
  const completed = useRef(false);
  const restoredModuleId = restoredModuleState?.moduleId;
  const restoredState = restoredModuleState?.state;

  useEffect(() => {
    if (restoredModuleId === 'page-ddas' && restoredState && ['random', 'cluster', 'ddas'].includes(restoredState)) {
      const next = restoredState as PageState;
      const candidateId = DEFAULT_CANDIDATE[next];
      if (view === 'candidates' && pageState === next && activeCandidateId === candidateId) return;
      setPageState(next);
      setActiveCandidateId(candidateId);
      setSelectedCandidateId(candidateId);
      setView('candidates');
      return;
    }
    if (restoredModuleId === 'element-ddas' && restoredState && ['text', 'formula', 'table'].includes(restoredState)) {
      const restoredElement = restoredState as ElementKind;
      if (view === 'element' && element === restoredElement) return;
      setPageState('ddas');
      setActiveCandidateId('formula-table');
      setSelectedCandidateId('formula-table');
      setElement(restoredElement);
      setView('element');
    }
    // Restoration is intentionally keyed to semantic primitives. App creates
    // a fresh object on every render, but equal hash state must be inert.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoredModuleId, restoredState]);

  useEffect(() => {
    if (view === 'candidates' && restoreFocus.current) {
      restoreFocus.current = false;
      candidateRefs.current[selectedCandidateId]?.focus();
    }
  }, [selectedCandidateId, view]);

  const activeCandidate = findCandidate(activeCandidateId);
  const selectedCandidate = findCandidate(selectedCandidateId);
  const evidence = ELEMENT_EVIDENCE[element];

  const choosePageState = (next: PageState) => {
    const candidateId = DEFAULT_CANDIDATE[next];
    setPageState(next);
    setActiveCandidateId(candidateId);
    setSelectedCandidateId(candidateId);
    setView('candidates');
    onInteract('page-ddas');
    onStateChange({ moduleId: 'page-ddas', state: next });
  };

  const openPage = (candidateId: CandidateId) => {
    setActiveCandidateId(candidateId);
    setSelectedCandidateId(candidateId);
    setView('page');
    onInteract('page-ddas');
  };

  const inspectElement = (next: ElementKind) => {
    setElement(next);
    setPageState('ddas');
    setView('element');
    onInteract('element-ddas');
    onStateChange({ moduleId: 'element-ddas', state: next });
    if (!completed.current) {
      completed.current = true;
      onComplete();
    }
  };

  const returnToCandidates = () => {
    restoreFocus.current = true;
    setActiveCandidateId(selectedCandidateId);
    setView('candidates');
  };

  const movePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const x = Math.max(0, Math.min(100, ((event.clientX - box.left) / box.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - box.top) / box.height) * 100));
    setActiveCandidateId(nearestCandidate(x, y).id);
  };

  const moveByKey = (event: React.KeyboardEvent<HTMLButtonElement>, current: DdasCandidate) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const next = nearestInDirection(current, event.key as ArrowKey);
    setActiveCandidateId(next.id);
    candidateRefs.current[next.id]?.focus();
  };

  const modeReason = pageState === 'random'
    ? activeCandidate.isLongTail ? '长尾页被大簇淹没，抽中机会低。' : '高频普通页会被反复抽中。'
    : pageState === 'cluster'
      ? `它属于“${activeCandidate.cluster}”版式簇；这里只看覆盖，不声称难度加权。`
      : activeCandidate.isLongTail ? '保留：补足训练分布中的长尾版式。' : '降权：减少重复普通页继续占用预算。';

  return <section
    className={`ddas-microscope ddas-microscope--${view}`}
    aria-label="DDAS 采样显微镜"
    data-view={view}
    data-page-state={pageState}
    data-active-candidate={activeCandidateId}
    data-selected-candidate={selectedCandidateId}
  >
    <div className="ddas-toolbar">
      {view === 'candidates' ? <>
        <div className="ddas-toolbar__facts">
          <Term id="ddas">DDAS</Term>
          <span><strong>512 维 <Term id="vit">ViT-base</Term></strong> · 约 60M 页级候选</span>
        </div>
        <div className="ddas-mode-switch" role="group" aria-label="选择页面采样方式">
          <button type="button" aria-pressed={pageState === 'random'} onClick={() => choosePageState('random')}>随机抽样</button>
          <button type="button" aria-pressed={pageState === 'cluster'} onClick={() => choosePageState('cluster')}>仅按版式聚类</button>
          <button type="button" aria-pressed={pageState === 'ddas'} onClick={() => choosePageState('ddas')}>启用页级 DDAS</button>
        </div>
      </> : <div className={`ddas-page-toolbar ddas-page-toolbar--${view}`} role="group" aria-label="选择页面元素">
        <button type="button" aria-pressed={view === 'element' && element === 'text'} onClick={() => inspectElement('text')}>查看文本元素</button>
        <button type="button" aria-pressed={view === 'element' && element === 'formula'} onClick={() => inspectElement('formula')}>放大公式区域</button>
        <button type="button" aria-pressed={view === 'element' && element === 'table'} onClick={() => inspectElement('table')}>查看表格元素</button>
        {view === 'element' ? <button type="button" className="ddas-back" onClick={() => setView('page')}>返回所选页面</button> : null}
        <button type="button" className="ddas-back" onClick={returnToCandidates}>返回版式簇</button>
      </div>}
    </div>

    <div className="ddas-microscope__stage" data-testid="figure-3-canvas" data-view={view === 'candidates' ? 'cluster' : view}>
      {view === 'candidates' ? <div className="ddas-candidate-workspace">
        <div className="ddas-candidate-board" data-testid="ddas-candidate-board" onPointerMove={movePointer}>
          {pageState === 'cluster' ? <div className="ddas-cluster-regions" aria-hidden="true">
            {['高频单栏', '多栏版式', '结构元素', '复杂版式'].map((cluster) => <span key={cluster} data-testid="cluster-region" data-cluster={cluster}>{cluster}</span>)}
          </div> : null}
          {CANDIDATES.map((candidate) => <button
            key={candidate.id}
            ref={(node) => { candidateRefs.current[candidate.id] = node; }}
            type="button"
            className={`ddas-candidate ${activeCandidateId === candidate.id ? 'is-active' : ''}`}
            data-testid="ddas-candidate"
            data-candidate-id={candidate.id}
            data-cluster={candidate.cluster}
            aria-label={`候选页：${candidate.label}；${candidate.cluster}`}
            style={{ left: `${candidate.x}%`, top: `${candidate.y}%` }}
            onFocus={() => setActiveCandidateId(candidate.id)}
            onKeyDown={(event) => moveByKey(event, candidate)}
            onClick={() => openPage(candidate.id)}
          >
            <CandidateVisual candidate={candidate} />
            <span className="ddas-candidate__name">{candidate.label}</span>
            {pageState === 'random' && !candidate.isLongTail && candidate.id.startsWith('repeat')
              ? <b className="ddas-sample-count" data-testid="random-repeat-marker">{candidate.id === 'repeat-a' ? '×3' : '×2'}</b> : null}
            {pageState === 'ddas' && candidate.isLongTail
              ? <b className="ddas-outcome ddas-outcome--keep" data-testid="ddas-retained">保留</b> : null}
            {pageState === 'ddas' && candidate.id.startsWith('repeat')
              ? <b className="ddas-outcome ddas-outcome--down" data-testid="ddas-downweighted">降权</b> : null}
          </button>)}
          <span className="ddas-snap-lens" aria-hidden="true" style={{ left: `${activeCandidate.x}%`, top: `${activeCandidate.y}%` }} />
        </div>
        <aside className="ddas-magnifier" data-testid="ddas-magnifier" data-candidate-id={activeCandidate.id}>
          <span>镜头锁定</span>
          <div className="ddas-magnifier__visual"><CandidateVisual candidate={activeCandidate} /></div>
          <strong>{activeCandidate.label}</strong>
          <p className="ddas-live-state" role="status" aria-live="polite">当前镜头：{activeCandidate.label}。{modeReason}</p>
          <FigureEvidence view={view} />
        </aside>
      </div> : <div className="ddas-page-workspace" data-testid="ddas-page-stage">
        <div className="ddas-page-context">
          <span className="ddas-page-context__label">所选页面 · {selectedCandidate.label}</span>
          <div className="ddas-page-context__visual"><CandidateVisual candidate={selectedCandidate} /></div>
          {(['text', 'formula', 'table'] as const).map((kind, index) => <button
            key={kind}
            type="button"
            className={`ddas-hotspot ddas-hotspot--${kind}`}
            data-testid="element-hotspot"
            data-active={view === 'element' && element === kind ? 'true' : 'false'}
            id={`hotspot-${kind}`}
            onClick={() => inspectElement(kind)}
            aria-label={`检查${ELEMENT_LABEL[kind]}区域`}
          ><span>{index + 1}</span></button>)}
        </div>
        <div className="ddas-element-panel">
          {view === 'element' ? <div className="ddas-element-evidence" data-testid="ddas-element-evidence" data-evidence-key={evidence.key}>
            <span className="source-tag paper">同类真实例图</span>
            <PaperMedia assetId={evidence.assetId} cropId={evidence.cropId} variant="thumbnail" viewer="crop" chrome={false} />
            <strong>正在放大：{ELEMENT_LABEL[element]}</strong>
            <p className="ddas-live-state" role="status" aria-live="polite">{ELEMENT_LABEL[element]}独立聚类，再与其他元素平衡采样。</p>
          </div> : <div className="ddas-page-prompt">
            <span>下一层</span><strong>页面内部还有哪些长尾？</strong><p className="ddas-live-state" role="status" aria-live="polite">已打开：{selectedCandidate.label}。点一个热点，把采样粒度切到元素。</p>
          </div>}
          <FigureEvidence view={view} />
        </div>
      </div>}
    </div>

    <details className="ddas-boundary">
      <summary><strong>事实边界</strong><span>K 与权重未披露 · 示例不是训练样本</span></summary>
      <div className="ddas-boundary__body">
        <p><Term id="k-means">K-Means</Term> 的 K、难度采样权重均未披露；同类真实例图来自 OmniDocBench，仅用于解释任务难点，不是 MinerU2.5-Pro 训练样本。</p>
        <a href="https://arxiv.org/html/2604.04771v2#S3.F3" target="_blank" rel="noreferrer">核对论文 Figure 3</a>
      </div>
    </details>
  </section>;
}

export default DdasMicroscope;
