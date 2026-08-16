import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { assetPath } from '../lib/assetPath';

type ViewMode = 'parallel' | 'focus';

const videoSources = [
  { name: 'LingBot-map', src: assetPath('images/kitti07-lingbot-preview.mp4'), tone: '#c66a16' },
  { name: 'HorizonStream', src: assetPath('images/kitti07-horizon-preview.mp4'), tone: '#16875b' },
] as const;

export const Chap01SynchronizedComparison: React.FC<WidgetProps> = ({ moduleId }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const oldRef = useRef<HTMLVideoElement>(null);
  const newRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<ViewMode>('parallel');
  const [showFrame, setShowFrame] = useState(true);
  const [autoDemo, setAutoDemo] = useState(() =>
    typeof window === 'undefined' || typeof window.matchMedia !== 'function' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [isVisible, setIsVisible] = useState(true);
  const [feedback, setFeedback] = useState('两段官方视频已对齐到同一相对时间轴；长时段的轨迹差异是本页的定性证据。');

  const videos = () => [oldRef.current, newRef.current].filter(Boolean) as HTMLVideoElement[];

  const seekTo = (normalized: number) => {
    const next = Math.max(0, Math.min(1, normalized));
    setProgress(next);
    videos().forEach((video) => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = Math.min(video.duration - 0.01, next * video.duration);
      }
    });
    setFeedback(
      next >= 0.7
        ? '已定位到长时段：观察轨迹抖动与局部结构一致性；这是定性证据，不是 ATE。'
        : '两段片段保持相对进度同步；长时段最能显露轨迹抖动与结构一致性差异。'
    );
  };

  const pauseAll = (message?: string) => {
    videos().forEach((video) => video.pause());
    setPlaying(false);
    if (message) setFeedback(message);
  };

  const startPlayback = async () => {
    const pair = videos();
    if (pair.length !== 2) {
      setFeedback('视频仍在加载，请稍后再试。');
      return;
    }
    pair.forEach((video) => {
      if (video.ended) video.currentTime = 0;
      video.muted = true;
    });
    const results = await Promise.allSettled(pair.map((video) => video.play()));
    if (results.every((result) => result.status === 'fulfilled')) {
      setPlaying(true);
      setFeedback('正在同步播放；若两段媒体时间差超过 120 ms，会自动校正。');
    } else {
      pauseAll('浏览器暂未允许媒体播放；静态海报仍保留论文的官方对比。');
    }
  };

  const togglePlayback = async () => {
    setAutoDemo(false);
    if (playing) {
      pauseAll('已暂停；两条视频仍停在同一相对进度。');
      return;
    }
    await startPlayback();
  };

  const reset = () => {
    pauseAll();
    seekTo(0);
    setFeedback('已回到开头，并保持两段视频同步。');
  };

  useEffect(() => {
    const primary = oldRef.current;
    if (!primary) return;
    const onTime = () => {
      if (!Number.isFinite(primary.duration) || primary.duration <= 0) return;
      const normalized = Math.max(0, Math.min(1, primary.currentTime / primary.duration));
      setProgress(normalized);
      const peer = newRef.current;
      if (peer && Number.isFinite(peer.duration) && peer.duration > 0) {
        const target = normalized * peer.duration;
        if (Math.abs(peer.currentTime - target) > 0.12) peer.currentTime = target;
      }
      if (normalized >= 0.995) pauseAll('对比播放结束；时间轴仍保留完整片段。');
    };
    primary.addEventListener('timeupdate', onTime);
    return () => primary.removeEventListener('timeupdate', onTime);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
      if (!entry.isIntersecting) pauseAll('组件已离开视口，视频自动暂停以节省资源。');
    }, { threshold: 0.05 });
    observer.observe(root);
    const onVisibility = () => {
      if (document.hidden) pauseAll('页面不可见，视频已自动暂停。');
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      videos().forEach((video) => video.pause());
    };
  }, []);

  useEffect(() => {
    if (!autoDemo || !isVisible || playing) return;
    const timer = window.setTimeout(() => { void startPlayback(); }, 260);
    return () => window.clearTimeout(timer);
  }, [autoDemo, isVisible, playing]);

  return (
    <div ref={rootRef}>
      <div className="chip-row" role="group" aria-label="对比布局">
        <button
          type="button"
          className={`chip ${mode === 'parallel' ? 'selected' : ''}`}
          aria-pressed={mode === 'parallel'}
          onClick={() => setMode('parallel')}
        >
          并排观察
        </button>
        <button
          type="button"
          className={`chip ${mode === 'focus' ? 'selected' : ''}`}
          aria-pressed={mode === 'focus'}
          onClick={() => setMode('focus')}
        >
          聚焦差异
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 14,
          alignItems: 'stretch',
        }}
      >
        {videoSources.map((item, index) => (
          <figure
            key={item.name}
            style={{
              margin: 0,
              minWidth: 0,
              padding: 10,
              border: `2px solid ${mode === 'focus' ? item.tone : '#d5dbe3'}`,
              background: '#f7f8fa',
              borderRadius: 6,
              boxShadow: mode === 'focus' ? `0 0 0 3px ${item.tone}22` : 'none',
            }}
          >
            <figcaption style={{ marginBottom: 8, color: '#17202b', fontWeight: 800, fontSize: 15 }}>
              <span style={{ color: item.tone }}>{item.name}</span>
            </figcaption>
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16 / 9',
                overflow: 'hidden',
                background: '#10151c',
                borderRadius: 4,
              }}
            >
              <video
                ref={index === 0 ? oldRef : newRef}
                src={item.src}
                muted
                playsInline
                preload="metadata"
                aria-label={`${item.name} 官方 KITTI 07 定性结果视频`}
                onLoadedMetadata={() => seekTo(progress)}
                style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
              />
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${progress * 100}%`,
                  width: 1,
                  background: '#ffffff',
                  boxShadow: '0 0 0 1px rgba(23,32,43,0.55)',
                  pointerEvents: 'none',
                }}
              />
              {showFrame && (
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: '12%',
                    border: `1px solid ${item.tone}`,
                    borderRadius: 2,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          </figure>
        ))}
      </div>

      <div className="ctrl">
        <button type="button" className="tiny" onClick={togglePlayback} aria-label={playing ? '暂停两段视频' : '播放两段视频'}>
          {playing ? '暂停' : '播放'}
        </button>
        <button type="button" className="tiny ghost" onClick={reset} aria-label="重置两段视频">
          重置
        </button>
        <button type="button" className={`tiny ${autoDemo ? '' : 'ghost'}`} aria-pressed={autoDemo} onClick={() => setAutoDemo((value) => !value)}>
          {autoDemo ? '暂停自动演示' : '自动演示'}
        </button>
        <label htmlFor={`sync-progress-${moduleId}`} style={{ flex: 1, minWidth: 190 }}>
          相对进度 <span className="val">{Math.round(progress * 100)}%</span>
        </label>
        <input
          id={`sync-progress-${moduleId}`}
          aria-label="两段视频的共同相对进度"
          type="range"
          min={0}
          max={1000}
          value={Math.round(progress * 1000)}
          onChange={(event) => seekTo(Number(event.target.value) / 1000)}
        />
        <label>
          <input
            type="checkbox"
            checked={showFrame}
            onChange={(event) => setShowFrame(event.target.checked)}
          />
          显示观察框
        </label>
      </div>

      <div className={`feedback ${progress >= 0.7 ? 'good' : ''}`} aria-live="polite">
        {feedback}
      </div>
      <div style={{ marginTop: 8, color: '#758195', fontSize: 13 }}>
        来源：官方项目页 · KITTI 07 qualitative comparison。叠加层只标记共同时间位置，不修改模型轨迹。
      </div>
    </div>
  );
};

export default Chap01SynchronizedComparison;
