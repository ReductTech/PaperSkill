import React, { useEffect, useState } from 'react';
import { tutorial } from '../data/tutorial';
import { BackupPanel } from '../modules/backup-panel';
import type { BackupSlideDef, FigureRef } from '../types';
import { ResultsDrawer } from './ResultsDrawer';

type DrawerKind = 'paper' | 'results' | 'qa';

const qaMap: Record<string, string[]> = {
  'page-5': ['backup-collapse'],
  'page-6': ['backup-qkv'],
  'page-7': ['backup-metrics', 'backup-limitations'],
};

function DrawerShell({ kind, label, title, open, suppressed, onToggle, children }: {
  kind: DrawerKind;
  label: string;
  title: string;
  open: boolean;
  suppressed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <aside className={`page-drawer drawer-${kind} ${open ? 'open' : ''} ${suppressed ? 'suppressed' : ''}`}>
      <button className="drawer-handle" onClick={onToggle} aria-expanded={open}>{label}</button>
      <div className="drawer-sheet" aria-hidden={!open}>
        <header><div><span>PAGE SIDE NOTE</span><h2>{title}</h2></div><button onClick={onToggle} aria-label="关闭侧边栏">×</button></header>
        <div className="drawer-scroll">{children}</div>
      </div>
    </aside>
  );
}

function QaDrawerContent({ pageId, items }: { pageId: string; items: BackupSlideDef[] }) {
  const [selected, setSelected] = useState(0);
  useEffect(() => setSelected(0), [pageId]);
  const item = items[Math.min(selected, items.length - 1)];
  return (
    <div className="qa-drawer-content">
      {items.length > 1 ? (
        <div className="qa-tabs">
          {items.map((qa, index) => <button className={selected === index ? 'active' : ''} onClick={() => setSelected(index)} key={qa.id}>{qa.indexLabel}</button>)}
        </div>
      ) : null}
      <span className="qa-index">{item.indexLabel}</span>
      <h3>{item.title.replace(/^备用\s*\d+：/, '')}</h3>
      <p className="qa-bridge">{item.bridge}</p>
      <BackupPanel chapterId={pageId} moduleId={item.module.id} />
      <section className="qa-answer"><strong>答疑要点</strong><p>{item.speakerNote}</p></section>
    </div>
  );
}

function PaperDrawerContent({ figures }: { figures: FigureRef[] }) {
  return (
    <div className="paper-drawer-content">
      <p className="paper-drawer-lead">本页收录 {figures.length} 幅论文原始图表。点击图片可在新窗口查看完整尺寸。</p>
      <div className="paper-drawer-gallery">
        {figures.map((figure, index) => (
          <figure key={figure.src}>
            <a href={figure.src} target="_blank" rel="noreferrer">
              <img src={figure.src} alt={figure.alt || figure.caption || `论文原图 ${index + 1}`} />
            </a>
            <figcaption><span>论文原图 · {String(index + 1).padStart(2, '0')}</span>{figure.caption}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

export function PageDrawers({ pageId, figures = [] }: { pageId: string; figures?: FigureRef[] }) {
  const [active, setActive] = useState<DrawerKind | null>(null);
  useEffect(() => setActive(null), [pageId]);
  const allQa = tutorial.backupSlides || [];
  const qaIds = qaMap[pageId] || [];
  const qaItems = qaIds.map((id) => allQa.find((item) => item.id === id)).filter((item): item is BackupSlideDef => Boolean(item));
  const hasResults = pageId === 'page-7';
  const hasFigures = figures.length > 0;

  if (!hasFigures && !hasResults && qaItems.length === 0) return null;
  const toggle = (kind: DrawerKind) => setActive((value) => value === kind ? null : kind);
  return (
    <>
      {active ? <button className="drawer-backdrop" aria-label="关闭侧边栏" onClick={() => setActive(null)} /> : null}
      {hasFigures ? (
        <DrawerShell kind="paper" label="论文原图" title="本页论文原始图表" open={active === 'paper'} suppressed={active !== null && active !== 'paper'} onToggle={() => toggle('paper')}>
          <PaperDrawerContent figures={figures} />
        </DrawerShell>
      ) : null}
      {hasResults ? (
        <DrawerShell kind="results" label="结果对比" title="论文结果交互对比" open={active === 'results'} suppressed={active !== null && active !== 'results'} onToggle={() => toggle('results')}>
          <figure className="drawer-hero-figure">
            <a href="./paper/sapiens2-task-comparison.png" target="_blank" rel="noreferrer"><img src="./paper/sapiens2-task-comparison.png" alt="Sapiens 与 Sapiens2 密集预测论文原图对比" /></a>
            <figcaption>Sapiens2 Figure 1：1B 模型在分割、深度与法线任务上的定性比较。</figcaption>
          </figure>
          <ResultsDrawer />
        </DrawerShell>
      ) : null}
      {qaItems.length ? (
        <DrawerShell kind="qa" label="备用答疑" title="本页关联答疑" open={active === 'qa'} suppressed={active !== null && active !== 'qa'} onToggle={() => toggle('qa')}>
          <QaDrawerContent pageId={pageId} items={qaItems} />
        </DrawerShell>
      ) : null}
    </>
  );
}
