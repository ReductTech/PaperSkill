import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FURTHER_LEARNING_RESOURCES,
  LEARNING_RESOURCE_KIND_LABEL,
  LEARNING_RESOURCE_SECTIONS,
  type LearningResource,
} from '../data/further-learning';
import { getMediaAsset } from '../data/media';
import '../styles/further-learning.css';
import { GlossaryText } from './Glossary';

function ResourceGlyph({ resource }: { resource: LearningResource }) {
  return <span className="further-footer-glyph" aria-hidden="true">{resource.kind === 'code' ? '&lt;/&gt;' : resource.kind === 'video' ? 'BILI' : 'PDF'}</span>;
}

function ReferenceCard({ resource }: { resource: LearningResource }) {
  return (
    <article className="further-reference-card">
      <ResourceGlyph resource={resource} />
      <div>
        <small>{LEARNING_RESOURCE_KIND_LABEL[resource.kind]} · {resource.provider}</small>
        <h4><GlossaryText text={resource.title} /></h4>
        <p><GlossaryText text={resource.learn} /></p>
      </div>
      <a href={resource.href} target="_blank" rel="noopener noreferrer">打开原始资料 ↗</a>
    </article>
  );
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), iframe, input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  ));
}

export function FurtherLearning({ id = 'further-learning' }: { id?: string }) {
  const [activeResource, setActiveResource] = useState<LearningResource | null>(null);
  const [pendingResource, setPendingResource] = useState<LearningResource | null>(null);
  const [hasConsented, setHasConsented] = useState(false);
  const [modalHost, setModalHost] = useState<HTMLDivElement | null>(null);
  const requestedButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const videos = FURTHER_LEARNING_RESOURCES.filter((resource) => resource.videoAssetId);
  const asset = activeResource?.videoAssetId ? getMediaAsset(activeResource.videoAssetId) : null;
  const modalOpen = Boolean(activeResource || pendingResource);

  useEffect(() => {
    const host = document.createElement('div');
    host.dataset.furtherLearningModalHost = 'true';
    document.body.appendChild(host);
    setModalHost(host);
    return () => host.remove();
  }, []);

  useEffect(() => {
    if (!modalOpen || !modalHost) return;
    const background = Array.from(document.body.children).filter((element) => element !== modalHost);
    const previous = background.map((element) => ({
      element,
      inert: element.hasAttribute('inert'),
      ariaHidden: element.getAttribute('aria-hidden'),
    }));
    background.forEach((element) => {
      element.setAttribute('inert', '');
      element.setAttribute('aria-hidden', 'true');
    });
    return () => {
      previous.forEach(({ element, inert, ariaHidden }) => {
        if (!inert) element.removeAttribute('inert');
        if (ariaHidden === null) element.removeAttribute('aria-hidden');
        else element.setAttribute('aria-hidden', ariaHidden);
      });
    };
  }, [modalHost, modalOpen]);

  const returnFocus = () => requestAnimationFrame(() => requestedButtonRef.current?.focus());
  const closeModal = () => {
    setActiveResource(null);
    setPendingResource(null);
    returnFocus();
  };

  useEffect(() => {
    if (!modalOpen) return;
    requestAnimationFrame(() => getFocusableElements(dialogRef.current ?? document.body)[0]?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [modalOpen, activeResource, pendingResource]);

  const requestPlayback = (resource: LearningResource, button: HTMLButtonElement) => {
    requestedButtonRef.current = button;
    if (hasConsented) setActiveResource(resource);
    else setPendingResource(resource);
  };

  const continuePlayback = () => {
    if (!pendingResource) return;
    setHasConsented(true);
    setActiveResource(pendingResource);
    setPendingResource(null);
  };

  const trapFocus = (event: React.KeyboardEvent) => {
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = getFocusableElements(dialogRef.current);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (!dialogRef.current.contains(document.activeElement) || document.activeElement === first)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (!dialogRef.current.contains(document.activeElement) || document.activeElement === last)) {
      event.preventDefault();
      first.focus();
    }
  };

  const renderModal = () => {
    if (!modalHost || !modalOpen) return null;
    const isPlayer = Boolean(activeResource && asset);
    return createPortal(
      <div className="further-modal-layer" role="presentation" onKeyDown={trapFocus}>
        {isPlayer && activeResource && asset ? (
          <section ref={dialogRef} className="further-modal further-modal--player" role="dialog" aria-modal="true" aria-label="Bilibili 播放器">
            <header className="further-modal__header">
              <div><span>第三方播放器</span><h3>{activeResource.title}</h3></div>
              <button type="button" onClick={closeModal}>关闭播放器</button>
            </header>
            <iframe src={asset.src} title={`${activeResource.title} · Bilibili`} tabIndex={0} loading="eager" referrerPolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen />
            <p>播放器无法加载时，可<a href={activeResource.href} target="_blank" rel="noopener noreferrer">打开 Bilibili 原页</a>。关闭按钮始终可用；在对话框中按 Esc 也会立即移除播放器。</p>
          </section>
        ) : pendingResource ? (
          <section ref={dialogRef} className="further-modal" role="dialog" aria-modal="true" aria-labelledby={`${id}-consent-title`}>
            <h3 id={`${id}-consent-title`}>连接第三方视频提示</h3>
            <p>继续后会连接 Bilibili 播放器，第三方可能收到你的 IP、浏览器信息或已有 Cookie。此同意只在当前页面会话有效。</p>
            <div className="further-modal__actions"><button type="button" onClick={continuePlayback}>继续播放</button><button type="button" onClick={closeModal}>取消</button></div>
          </section>
        ) : null}
      </div>,
      modalHost,
    );
  };

  return (
    <>
      <section className="further-learning" id={id} aria-labelledby={`${id}-title`}>
        <header className="further-learning__header">
          <span className="source-tag research">可选延伸 · 站外资料</span>
          <div>
            <h2 id={`${id}-title`}>完成第 6 步后，还可以继续看什么？</h2>
            <p>下面资料不参与章节解锁、学习进度或论文事实判断；教程主体始终可离线使用。</p>
          </div>
        </header>

        <section className="further-video-section" aria-labelledby={`${id}-video-title`}>
          <div className="further-section-heading">
            <div><span>可选视频</span><h3 id={`${id}-video-title`}>Bilibili：只作背景与实践参考</h3></div>
            <p>点击播放才会连接第三方站点；不保存同意或观看进度。</p>
          </div>
          <div className="further-video-grid">
            {videos.map((resource) => {
              const videoAsset = getMediaAsset(resource.videoAssetId!);
              return (
                <article className="further-video-card" key={resource.id}>
                  <small>{resource.provider}</small>
                  <h4><GlossaryText text={resource.title} /></h4>
                  <p><b>为什么看：</b><GlossaryText text={resource.videoWhy ?? resource.learn} /></p>
                  {resource.watchFor ? <ul aria-label="观看关注点">{resource.watchFor.map((point) => <li key={point}><GlossaryText text={point} /></li>)}</ul> : null}
                  <div className="further-video-card__actions">
                    <button type="button" onClick={(event) => requestPlayback(resource, event.currentTarget)}>播放视频</button>
                    <a href={resource.href} target="_blank" rel="noopener noreferrer">打开 Bilibili 原页 ↗</a>
                  </div>
                  <p className="further-video-card__boundary">边界：{resource.note ?? videoAsset.allowedClaim}</p>
                </article>
              );
            })}
          </div>
        </section>

        {LEARNING_RESOURCE_SECTIONS.filter((section) => section.id !== 'video').map((section) => (
          <section className="further-reference-section" key={section.id} aria-labelledby={`${id}-${section.id}-title`}>
            <div className="further-section-heading">
              <div><span>{section.eyebrow}</span><h3 id={`${id}-${section.id}-title`}>{section.label}</h3></div>
              <p><GlossaryText text={section.answer} /></p>
            </div>
            <div className="further-reference-grid">
              {FURTHER_LEARNING_RESOURCES.filter((resource) => resource.section === section.id).map((resource) => <ReferenceCard key={resource.id} resource={resource} />)}
            </div>
          </section>
        ))}
      </section>
      {renderModal()}
    </>
  );
}
