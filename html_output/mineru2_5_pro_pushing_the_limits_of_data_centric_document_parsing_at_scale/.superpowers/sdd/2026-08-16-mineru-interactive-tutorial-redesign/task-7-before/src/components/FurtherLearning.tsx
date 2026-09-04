import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FURTHER_LEARNING_RESOURCES,
  LEARNING_RESOURCE_KIND_LABEL,
  LEARNING_RESOURCE_SECTIONS,
  type LearningResource,
  type LearningResourceSectionId,
} from '../data/further-learning';
import '../styles/further-learning.css';
import { GlossaryText } from './Glossary';

const VIDEO_PROGRESS_STORAGE_KEY = 'mineru2.5-pro.video-learning.v1';

type VideoTaskStage = 'before' | 'watching' | 'check';

function ResourceGlyph({ resource }: { resource: LearningResource }) {
  if (resource.kind === 'video') {
    return (
      <span className="further-resource__glyph further-resource__glyph--video" aria-hidden="true">
        <i />
        <small>BILI</small>
      </span>
    );
  }

  return (
    <span className={`further-resource__glyph further-resource__glyph--${resource.kind}`} aria-hidden="true">
      <b>{resource.kind === 'code' ? '&lt;/&gt;' : resource.kind === 'survey' ? 'Σ' : 'PDF'}</b>
    </span>
  );
}

function ResourceCard({
  resource,
  index,
  completed = false,
  onCompletedChange,
}: {
  resource: LearningResource;
  index: number;
  completed?: boolean;
  onCompletedChange?: (completed: boolean) => void;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewState, setPreviewState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [taskStage, setTaskStage] = useState<VideoTaskStage>(completed ? 'check' : 'before');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(
    completed && resource.videoTask ? resource.videoTask.correctOptionId : null,
  );
  const previewButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const selfCheckRef = useRef<HTMLDivElement>(null);
  const task = resource.videoTask;
  const answerIsCorrect = Boolean(task && selectedAnswer === task.correctOptionId);

  useEffect(() => {
    if (!previewOpen) return;
    setPreviewState('loading');
    requestAnimationFrame(() => closeButtonRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setPreviewOpen(false);
      requestAnimationFrame(() => previewButtonRef.current?.focus());
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [previewOpen]);

  const closePreview = () => {
    setPreviewOpen(false);
    requestAnimationFrame(() => previewButtonRef.current?.focus());
  };

  const beginWatching = () => {
    setTaskStage('watching');
    setPreviewOpen(true);
  };

  const beginSelfCheck = () => {
    setTaskStage('check');
    setPreviewOpen(false);
    requestAnimationFrame(() => selfCheckRef.current?.focus());
  };

  const resetTask = () => {
    setSelectedAnswer(null);
    setTaskStage('before');
    onCompletedChange?.(false);
  };

  return (
    <article className={`further-resource further-resource--${resource.kind}${previewOpen ? ' has-preview' : ''}`}>
      <div className="further-resource__visual">
        <ResourceGlyph resource={resource} />
        <span>{String(index + 1).padStart(2, '0')}</span>
      </div>

      <div className="further-resource__body">
        <div className="further-resource__meta">
          <span>{LEARNING_RESOURCE_KIND_LABEL[resource.kind]}</span>
          <span>{resource.audience}</span>
          <small>{resource.provider}</small>
        </div>
        <h3><GlossaryText text={resource.title} /></h3>
        <p><GlossaryText text={resource.summary} /></p>
        {task ? (
          <section className={`video-learning-task is-${taskStage}${completed ? ' is-complete' : ''}`} aria-label="视频学习任务">
            <div className="video-learning-task__rail" aria-label="观看任务进度">
              <span className={taskStage === 'before' ? 'is-current' : 'is-passed'}><i>1</i>观看前</span>
              <span className={taskStage === 'watching' ? 'is-current' : taskStage === 'check' ? 'is-passed' : ''}><i>2</i>观看中</span>
              <span className={taskStage === 'check' ? 'is-current' : ''}><i>{completed ? '✓' : '3'}</i>看完后</span>
            </div>

            {taskStage === 'before' ? (
              <div className="video-learning-task__stage">
                <small>先预测</small>
                <strong><GlossaryText text={task.beforeQuestion} /></strong>
                <div className="video-learning-task__buttons">
                  <button type="button" onClick={beginWatching}>带着问题播放 <span aria-hidden="true">▶</span></button>
                  <button type="button" className="is-quiet" onClick={beginSelfCheck}>已看过，直接自检</button>
                </div>
              </div>
            ) : taskStage === 'watching' ? (
              <div className="video-learning-task__stage">
                <small>观看时只抓三件事</small>
                <ol className="video-learning-task__focus">
                  {task.focusPoints.map((point, pointIndex) => (
                    <li key={point}><i>{pointIndex + 1}</i><GlossaryText text={point} /></li>
                  ))}
                </ol>
                <div className="video-learning-task__buttons">
                  <button type="button" onClick={beginSelfCheck}>已观看，开始自检</button>
                  <a href={task.relatedChapter.href}>{task.relatedChapter.label} →</a>
                </div>
              </div>
            ) : (
              <div className="video-learning-task__stage video-learning-task__stage--check" ref={selfCheckRef} tabIndex={-1}>
                <small>{completed ? '任务已完成' : '一分钟自检'}</small>
                <strong><GlossaryText text={task.selfCheckQuestion} /></strong>
                <div className="video-learning-task__options" role="group" aria-label={task.selfCheckQuestion}>
                  {task.selfCheckOptions.map((option) => {
                    const isSelected = selectedAnswer === option.id;
                    const stateClass = isSelected
                      ? option.id === task.correctOptionId ? 'is-correct' : 'is-wrong'
                      : '';
                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={stateClass}
                        aria-pressed={isSelected}
                        onClick={() => setSelectedAnswer(option.id)}
                      >
                        <span aria-hidden="true">{isSelected ? option.id === task.correctOptionId ? '✓' : '×' : '○'}</span>
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {selectedAnswer ? (
                  <p className={`video-learning-task__feedback ${answerIsCorrect ? 'is-correct' : 'is-wrong'}`} role="status">
                    {answerIsCorrect ? task.correctFeedback : task.retryFeedback}
                  </p>
                ) : null}
                <div className="video-learning-task__buttons">
                  {answerIsCorrect && !completed ? (
                    <button type="button" onClick={() => onCompletedChange?.(true)}>完成这个观看任务</button>
                  ) : null}
                  {completed ? <button type="button" className="is-quiet" onClick={resetTask}>重新自检</button> : null}
                  <a href={task.relatedChapter.href}>{task.relatedChapter.label} →</a>
                </div>
              </div>
            )}
          </section>
        ) : (
          <div className="further-resource__learn">
            <b>带着这个问题看</b>
            <span><GlossaryText text={resource.learn} /></span>
          </div>
        )}
        <ul className="further-resource__tags" aria-label="资源主题">
          {resource.tags.map((tag) => <li key={tag}><GlossaryText text={tag} /></li>)}
        </ul>
        {resource.note ? <small className="further-resource__note">边界：{resource.note}</small> : null}
      </div>

      <div className="further-resource__actions">
        {resource.embedHref ? (
          <button
            ref={previewButtonRef}
            type="button"
            className="further-resource__preview-button"
            aria-expanded={previewOpen}
            onClick={() => {
              if (previewOpen) {
                closePreview();
              } else {
                if (task && taskStage === 'before') setTaskStage('watching');
                setPreviewOpen(true);
              }
            }}
          >
            <span>{previewOpen ? '关闭预览' : '页面内播放'}</span>
            <small>{previewOpen ? '停止外部加载' : '点击后才连接 Bilibili'}</small>
          </button>
        ) : null}
        <a
          className="further-resource__action"
          href={resource.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`离开本站，在新标签页打开：${resource.title}`}
          onClick={() => {
            if (task && taskStage === 'before') setTaskStage('watching');
          }}
        >
          <span>{resource.kind === 'video' ? '打开原站' : resource.kind === 'code' ? '查看仓库' : '阅读原文'}</span>
          <small>将离开本站 ↗</small>
        </a>
      </div>

      {previewOpen && resource.embedHref ? (
        <section className="further-resource__preview" aria-label={`${resource.title} 页面内预览`}>
          <header>
            <div>
              <b>正在连接 Bilibili 外部播放器</b>
              <p>播放器会请求 player.bilibili.com，并可能向该站传递 IP、浏览器信息或已有 Cookie。关闭预览后，播放器 iframe 会立即从页面移除。</p>
            </div>
            <button ref={closeButtonRef} type="button" onClick={closePreview}>关闭预览</button>
          </header>
          <div className={`further-resource__preview-layout${task ? ' has-focus-guide' : ''}`}>
            <div className="further-resource__iframe-shell">
              <iframe
                src={resource.embedHref}
                title={`${resource.title} · Bilibili 外部播放器`}
                loading="eager"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
                onLoad={() => setPreviewState('ready')}
                onError={() => setPreviewState('failed')}
              />
            </div>
            {task ? (
              <aside className="further-resource__focus-guide" aria-label="观看关注点">
                <small>WATCH FOR</small>
                <b>不必记笔记，只找这三件事</b>
                <ol>
                  {task.focusPoints.map((point, pointIndex) => (
                    <li key={point}><i>{pointIndex + 1}</i><GlossaryText text={point} /></li>
                  ))}
                </ol>
                <button type="button" onClick={beginSelfCheck}>已观看 · 开始自检 →</button>
              </aside>
            ) : null}
          </div>
          <div className={`further-resource__preview-status is-${previewState}`} aria-live="polite">
            <span>
              {previewState === 'loading'
                ? '正在载入外部播放器…'
                : previewState === 'failed'
                  ? '页面内播放器载入失败。'
                  : '播放器已载入；视频内容和可用性由 Bilibili 提供。'}
            </span>
            <a href={resource.href} target="_blank" rel="noopener noreferrer">无法播放？前往 Bilibili 原页 ↗</a>
          </div>
        </section>
      ) : null}
    </article>
  );
}

export function FurtherLearning({
  id = 'further-learning',
  initialSection = 'video',
}: {
  id?: string;
  initialSection?: LearningResourceSectionId;
}) {
  const [activeSection, setActiveSection] = useState<LearningResourceSectionId>(initialSection);
  const [completedVideoIds, setCompletedVideoIds] = useState<Set<string>>(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(VIDEO_PROGRESS_STORAGE_KEY) ?? '[]');
      return new Set(Array.isArray(saved) ? saved.filter((item): item is string => typeof item === 'string') : []);
    } catch {
      return new Set();
    }
  });
  const section = LEARNING_RESOURCE_SECTIONS.find((item) => item.id === activeSection)
    ?? LEARNING_RESOURCE_SECTIONS[0];
  const resources = useMemo(
    () => FURTHER_LEARNING_RESOURCES.filter((resource) => resource.section === activeSection),
    [activeSection],
  );
  const videoResources = useMemo(
    () => FURTHER_LEARNING_RESOURCES.filter((resource) => resource.videoTask),
    [],
  );
  const completedVideoCount = videoResources.filter((resource) => completedVideoIds.has(resource.id)).length;

  const setVideoCompleted = (resourceId: string, completed: boolean) => {
    setCompletedVideoIds((current) => {
      const next = new Set(current);
      if (completed) next.add(resourceId);
      else next.delete(resourceId);
      try {
        window.localStorage.setItem(VIDEO_PROGRESS_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // Progress is a convenience only; the learning tasks remain fully usable.
      }
      return next;
    });
  };

  const moveTabFocus = (currentIndex: number, direction: 'next' | 'previous' | 'first' | 'last') => {
    const lastIndex = LEARNING_RESOURCE_SECTIONS.length - 1;
    const nextIndex = direction === 'first'
      ? 0
      : direction === 'last'
        ? lastIndex
        : direction === 'next'
          ? (currentIndex + 1) % LEARNING_RESOURCE_SECTIONS.length
          : (currentIndex - 1 + LEARNING_RESOURCE_SECTIONS.length) % LEARNING_RESOURCE_SECTIONS.length;
    const nextSection = LEARNING_RESOURCE_SECTIONS[nextIndex];
    setActiveSection(nextSection.id);
    requestAnimationFrame(() => document.getElementById(`${id}-tab-${nextSection.id}`)?.focus());
  };

  return (
    <section className="further-learning" id={id} aria-labelledby={`${id}-title`}>
      <header className="further-learning__header">
        <div>
          <span className="source-tag research">可选延伸 · 站外资源</span>
          <h2 id={`${id}-title`}>从交互教程走向原始资料</h2>
          <p>页面本身无需联网。下面的资源只在你主动点击时打开，用于建立直觉、核对论文或补齐先修知识。</p>
        </div>
        <div className="further-learning__route" aria-hidden="true">
          <span>看见问题</span><i>→</i><span>核对证据</span><i>→</i><span>补齐概念</span>
        </div>
      </header>

      <div className="further-learning__tabs" role="tablist" aria-label="进一步学习路线">
        {LEARNING_RESOURCE_SECTIONS.map((item, index) => {
          const selected = item.id === activeSection;
          return (
            <button
              key={item.id}
              id={`${id}-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${id}-panel`}
              tabIndex={selected ? 0 : -1}
              className={selected ? 'is-active' : ''}
              onClick={() => setActiveSection(item.id)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight') {
                  event.preventDefault();
                  moveTabFocus(index, 'next');
                } else if (event.key === 'ArrowLeft') {
                  event.preventDefault();
                  moveTabFocus(index, 'previous');
                } else if (event.key === 'Home') {
                  event.preventDefault();
                  moveTabFocus(index, 'first');
                } else if (event.key === 'End') {
                  event.preventDefault();
                  moveTabFocus(index, 'last');
                }
              }}
            >
              <i>{String(index + 1).padStart(2, '0')}</i>
              <span><b>{item.label}</b><small>{item.eyebrow}</small></span>
            </button>
          );
        })}
      </div>

      <div
        className="further-learning__panel"
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${activeSection}`}
      >
        <div className="further-learning__question">
          <span>本路线先回答</span>
          <h3><GlossaryText text={section.question} /></h3>
          <p><GlossaryText text={section.answer} /></p>
        </div>

        {activeSection === 'video' ? (
          <div className="video-learning-progress" aria-live="polite">
            <div>
              <span>观看任务</span>
              <b>{completedVideoCount} / {videoResources.length}</b>
            </div>
            <div className="video-learning-progress__track" aria-hidden="true">
              {videoResources.map((resource) => (
                <i key={resource.id} className={completedVideoIds.has(resource.id) ? 'is-complete' : ''} />
              ))}
            </div>
            <p>{completedVideoCount === videoResources.length ? '三个视角已连成完整学习路径。' : '每段视频只完成一个小任务；进度保存在本机。'}</p>
          </div>
        ) : null}

        <div className="further-learning__grid">
          {resources.map((resource, index) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              index={index}
              completed={completedVideoIds.has(resource.id)}
              onCompletedChange={(completed) => setVideoCompleted(resource.id, completed)}
            />
          ))}
        </div>
      </div>

      <footer className="further-learning__footer">
        <span aria-hidden="true">✓</span>
        <p><b>来源规则：</b>论文数字仍以 MinerU2.5-Pro arXiv 版本为准；视频只承担背景导读和实践演示，不作为实验结论证据。</p>
      </footer>
    </section>
  );
}
