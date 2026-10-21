import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ModuleDef } from '../types';
import { widgetRegistry } from '../modules/registry';

export function Module({ module, chapterId }: { module: ModuleDef; chapterId: string }) {
  const Widget = widgetRegistry[module.componentId];
  const [mobileView, setMobileView] = useState<'lab' | 'paper'>('lab');
  const [focusIndex, setFocusIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const zoomTriggerRef = useRef<HTMLButtonElement>(null);
  const zoomCloseRef = useRef<HTMLButtonElement>(null);
  const regions = module.figureRegions || [];
  const focus = regions[focusIndex];
  const crop = module.figureCrop;
  const paperMaxWidth = crop ? Math.min(crop.width * 1.7, crop.width / crop.height < 1.2 ? 560 : 900) : 900;
  const cropFrameStyle = crop ? { aspectRatio: `${crop.width} / ${crop.height}` } : undefined;
  const cropImageStyle = crop ? {
    position: 'absolute' as const,
    width: `${crop.sourceWidth / crop.width * 100}%`,
    maxWidth: 'none',
    left: `${-crop.x / crop.width * 100}%`,
    top: `${-crop.y / crop.height * 100}%`,
  } : undefined;
  const zoomImageStyle = crop ? { width: `min(100%, ${78 * crop.width / crop.height}vh, ${crop.width * 2}px)` } : undefined;
  const setFocus = (index: number) => setFocusIndex(Math.max(0, Math.min(index, regions.length - 1)));
  useEffect(() => {
    if (!zoomOpen) return;
    zoomCloseRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setZoomOpen(false);
        requestAnimationFrame(() => zoomTriggerRef.current?.focus());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomOpen]);
  const paperImage = () => <div className={'vl-paper-image ' + (crop ? 'is-cropped' : '')} style={cropFrameStyle}><img src={module.figure} style={cropImageStyle} alt={module.title + '对应的论文原图'} loading="lazy"/>{focus && <i className="vl-paper-focus" style={{ left: focus.left + '%', top: focus.top + '%', width: focus.width + '%', height: focus.height + '%' }}/>}</div>;
  return <div className="module vl-module">
    <div className="module-head"><span className="num">{module.id}</span><h4>{module.title}</h4></div>
    <div className="module-body">
      <p className="module-desc">{module.desc}</p>
      {module.evidence && <div className="vl-source-line"><span className={'vl-evidence-tag ' + module.evidence.kind.toLowerCase()}>{module.evidence.kind === 'PAPER' ? '论文证据' : module.evidence.kind === 'DEMO' ? '教学模拟' : '延伸推演'}</span><strong>{module.evidence.source}</strong>{module.evidence.note && <small>{module.evidence.note}</small>}</div>}
      {module.figure && <div className="vl-local-view-tabs" role="tablist" aria-label={module.title + '的视图'}><button type="button" role="tab" aria-selected={mobileView === 'lab'} onClick={() => setMobileView('lab')}>交互实验</button><button type="button" role="tab" aria-selected={mobileView === 'paper'} onClick={() => setMobileView('paper')}>论文原图</button></div>}
      <div className={module.figure ? 'vl-linked-layout' : 'vl-single-layout'}>
        <div className={'vl-linked-lab ' + (mobileView === 'paper' ? 'mobile-hidden' : '')}>
          {Widget ? <Widget chapterId={chapterId} moduleId={module.id} onEvidenceFocus={setFocus}/> : <div className="feedback bad">组件未实现：{module.componentId}</div>}
        </div>
        {module.figure && <div className={'vl-linked-paper ' + (mobileView === 'lab' ? 'mobile-hidden' : '')} style={{ maxWidth: paperMaxWidth }}>
          <div className="vl-paper-caption"><b>论文原图</b><span>{module.evidence?.source}</span><button type="button" ref={zoomTriggerRef} onClick={() => setZoomOpen(true)}>放大 ↗</button></div>
          {paperImage()}
          {regions.length > 0 && <div className="vl-paper-region-tabs">{regions.map((region, index) => <button type="button" key={region.label} className={focusIndex === index ? 'selected' : ''} onClick={() => setFocus(index)}>{region.label}</button>)}</div>}
        </div>}
      </div>
      {module.figure && zoomOpen && createPortal(<div className="vl-paper-zoom" onClick={() => setZoomOpen(false)}><div className="vl-paper-zoom-dialog" role="dialog" aria-modal="true" aria-label={module.title + '论文原图放大'} onClick={event => event.stopPropagation()}><div className="vl-paper-zoom-head"><strong>{module.evidence?.source}</strong><button type="button" ref={zoomCloseRef} onClick={() => { setZoomOpen(false); requestAnimationFrame(() => zoomTriggerRef.current?.focus()); }}>关闭 ✕</button></div><div className="vl-paper-zoom-image" style={zoomImageStyle}>{paperImage()}</div></div></div>, document.body)}
    </div>
  </div>;
}
