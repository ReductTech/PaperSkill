import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';

export const LsmHeroContrast: React.FC<WidgetProps> = ({ moduleId }) => {
  const isOld = moduleId === 'old';
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => setPaused(true));
  }, []);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setPaused(false)).catch(() => setPaused(true));
    } else {
      video.pause();
      setPaused(true);
    }
  };

  return (
    <figure className={`hero-video-compare ${isOld ? 'old' : 'new'}`}>
      <div className="hero-video-stage">
        <video
          ref={videoRef}
          src={isOld ? '/images/gen3c.mp4' : '/images/ours.mp4'}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label={isOld ? 'Gen3C 生成结果视频' : 'Mirage 生成结果视频'}
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
        />
        <div className="hero-video-topline">
          <span className="hero-video-method">{isOld ? 'Gen3C' : 'Mirage · Ours'}</span>
          <span className="hero-video-route">同一类长轨迹</span>
        </div>
        <button
          type="button"
          className="hero-video-toggle"
          onClick={togglePlayback}
          aria-label={paused ? '播放对比视频' : '暂停对比视频'}
        >
          {paused ? '▶ 播放' : 'Ⅱ 暂停'}
        </button>
      </div>
      <figcaption className="hero-video-observe">
        <span className="hero-video-eye" aria-hidden="true">◎</span>
        <div>
          <b>{isOld ? '基于RGB 点云的记忆存储' : '基于潜空间的记忆存储'}</b>
        </div>
      </figcaption>
    </figure>
  );
};
