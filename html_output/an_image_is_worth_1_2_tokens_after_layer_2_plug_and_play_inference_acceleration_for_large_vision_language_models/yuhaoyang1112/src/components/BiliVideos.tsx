import React from 'react';
import type { BiliDef } from '../types';

export function BiliVideos({ items }: { items: BiliDef[] }) {
  if (!items.length) return null;
  return (
    <section className="dl-related-section vtw-videos" id="videos" aria-labelledby="videos-t">
      <h3 id="videos-t">延伸学习 · B 站讲解视频</h3>
      <div className="dl-video-strip">
        {items.map((video) => (
          <a
            key={video.bvid}
            className="dl-video-card"
            href={`https://www.bilibili.com/video/${video.bvid}/`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`在 B 站打开《${video.title}》，${video.author}，时长 ${video.duration}（新标签页）`}
            data-bvid={video.bvid}
          >
            <div className="dl-video-link-cover is-loaded">
              <img className="dl-video-cover-img" src={video.cover} alt="" width="640" height="360" loading="lazy" decoding="async" />
              <span className="dl-video-play" aria-hidden="true">▶</span>
              <span className="dl-video-link-tag">{video.label}</span>
              <span className="dl-video-duration">{video.duration}</span>
            </div>
            <strong>{video.title}</strong>
            <div className="dl-video-meta"><span>{video.author}</span><span>B 站 ↗</span></div>
            <div className="dl-video-why">{video.reason}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
