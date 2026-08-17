import { useEffect, useRef, useState } from 'react';
import { Term } from '../components/Glossary';
import { PaperMedia } from '../components/PaperMedia';
import type { ChapterExperienceProps } from '../types';

type View = 'cluster' | 'page' | 'element';
type ElementKind = 'text' | 'formula' | 'table';
type PageState = 'random' | 'cluster' | 'ddas';

const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

export function DdasMicroscope({ restoredModuleState, onComplete, onInteract, onStateChange }: ChapterExperienceProps) {
  const [view, setView] = useState<View>('cluster');
  const [pageState, setPageState] = useState<PageState>('cluster');
  const [element, setElement] = useState<ElementKind>('text');
  const [lens, setLens] = useState({ x: 50, y: 50 });
  const completed = useRef(false);

  useEffect(() => {
    if (restoredModuleState?.moduleId === 'page-ddas' && ['random', 'cluster', 'ddas'].includes(restoredModuleState.state)) {
      const restoredPageState = restoredModuleState.state as PageState;
      setPageState(restoredPageState);
      setView(restoredPageState === 'ddas' ? 'page' : 'cluster');
    }
    if (restoredModuleState?.moduleId === 'element-ddas' && ['text', 'formula', 'table'].includes(restoredModuleState.state)) {
      setElement(restoredModuleState.state as ElementKind);
      setPageState('ddas');
      setView('element');
    }
  }, [restoredModuleState]);

  const choosePageState = (next: PageState) => {
    setPageState(next);
    setView(next === 'ddas' ? 'page' : 'cluster');
    onInteract('page-ddas');
    onStateChange({ moduleId: 'page-ddas', state: next });
  };

  const openPage = () => choosePageState('ddas');

  const inspectElement = (next: ElementKind) => {
    setElement(next);
    setView('element');
    onInteract('element-ddas');
    onStateChange({ moduleId: 'element-ddas', state: next });
    if (!completed.current) {
      completed.current = true;
      onComplete();
    }
  };

  const returnToPage = () => {
    setPageState('ddas');
    setView('page');
    onInteract('page-ddas');
    onStateChange({ moduleId: 'page-ddas', state: 'ddas' });
  };

  const moveLens = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    if (!box.width || !box.height) return;
    setLens({ x: clamp(((event.clientX - box.left) / box.width) * 100), y: clamp(((event.clientY - box.top) / box.height) * 100) });
  };

  const keyMove = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const delta = event.key === 'ArrowLeft' ? { x: -5, y: 0 } : event.key === 'ArrowRight' ? { x: 5, y: 0 } : event.key === 'ArrowUp' ? { x: 0, y: -5 } : event.key === 'ArrowDown' ? { x: 0, y: 5 } : null;
    if (event.key === 'Enter') { event.preventDefault(); openPage(); return; }
    if (!delta) return;
    event.preventDefault();
    setLens((current) => ({ x: clamp(current.x + delta.x), y: clamp(current.y + delta.y) }));
  };

  const cropId = view === 'element' ? 'elementLevel' : 'pageLevel';
  const pageStatus = pageState === 'random' ? '随机候选：高频页面更容易重复进入。' : pageState === 'cluster' ? '版式簇：观察长尾版式的聚类差异。' : '页面级 DDAS 已进入同一画布。';
  return (
    <section className={`ddas-microscope ddas-microscope--${view}`} aria-label="DDAS 采样显微镜">
      <header className="ddas-microscope__header">
        <div><span className="source-tag paper">论文原图节选</span><h3>在同一画布中放大 <Term id="ddas">DDAS</Term></h3></div>
        <p><strong>512 维 <Term id="vit">ViT-base</Term></strong><span>约 60M 页候选</span></p>
      </header>

      <div
        className="ddas-microscope__canvas"
        data-testid="figure-3-canvas"
        data-view={view}
        data-page-state={pageState}
        data-lens-x={lens.x}
        data-lens-y={lens.y}
        tabIndex={0}
        role="application"
        aria-label="可移动的采样镜头；方向键移动 5%，Enter 打开聚焦页"
        onPointerMove={moveLens}
        onKeyDown={keyMove}
      >
        <PaperMedia assetId="mineru-ddas" cropId={cropId} label="论文原图节选" caption={view === 'element' ? 'Figure 3：切换到元素级采样裁图。' : 'Figure 3：页面级采样裁图。'} />
        {view === 'cluster' ? <div className="ddas-microscope__clusters">
          {(['doubleColumn', 'tripleColumn', 'complexLayout'] as const).map((crop) => <PaperMedia key={crop} className="ddas-microscope__thumbnail" assetId="omni-layout" cropId={crop} label="论文原图节选" />)}
        </div> : null}
        <span className="ddas-microscope__lens" aria-hidden="true" style={{ left: `${lens.x}%`, top: `${lens.y}%` }} />
        {view === 'element' ? <div className="ddas-microscope__element-overlay" data-element={element}>正在放大：{element === 'formula' ? '公式' : element === 'table' ? '表格' : '文本'}</div> : null}
      </div>

      <div className="ddas-microscope__controls" role="group" aria-label="显微镜操作">
        {view === 'cluster' ? <>
          <button type="button" onClick={() => choosePageState('random')}>查看随机候选</button>
          <button type="button" onClick={() => choosePageState('cluster')}>观察版式簇</button>
          <button type="button" onClick={() => choosePageState('ddas')}>观察长尾版式簇</button>
        </> : <>
          <button type="button" onClick={() => inspectElement('text')}>查看文本元素</button>
          <button type="button" onClick={() => inspectElement('formula')}>放大公式区域</button>
          <button type="button" onClick={() => inspectElement('table')}>查看表格元素</button>
          {view === 'element' ? <button type="button" onClick={returnToPage}>返回页面级</button> : null}
        </>}
      </div>

      <p className="ddas-microscope__state" role="status">{view === 'element' ? `元素级 DDAS：${element}。` : pageStatus}</p>
      <p className="experience-boundary">事实边界：<Term id="k-means">K-Means</Term> 的 K 和采样权重均未披露。版式缩略图通过 PaperMedia 使用本地图像及其故障占位，仅作观察锚点。</p>
    </section>
  );
}

export default DdasMicroscope;
