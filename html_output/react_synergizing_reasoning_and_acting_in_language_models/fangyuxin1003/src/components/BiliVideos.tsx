import React from 'react';
import type { BiliDef } from '../types';

// Optional Bilibili recommendations. Renders whenever >=1 real BVID is passed.
// Cards are ALWAYS shown from the static `it` data (title + optional baked-in cover),
// so a failed runtime metadata fetch can never hide a video. The runtime fetch only
// enriches with live views/duration and can supply a cover when none is baked in.
// UI copy is Simplified Chinese.
export function BiliVideos({ items }: { items: BiliDef[] }) {
  const real = items.filter((i) => i.bvid && i.bvid.startsWith('BV'));

  return (
    <section className="dl-related-section">
      <h3>延伸学习 · B 站讲解视频</h3>
      <p>推荐几个相关的视频讲解，帮助加深理解。</p>
      <div className="dl-video-strip">
        {real.map((it) => {
          return (
            <a
              key={it.bvid}
              className="dl-video-card"
              href={`https://www.bilibili.com/video/${it.bvid}`}
              target="_blank"
              rel="noopener"
              data-bvid={it.bvid}
            >
              <div className="dl-video-link-cover is-loaded">
                <img className="dl-video-cover-img" src={`${import.meta.env.BASE_URL}${it.cover}`} alt={it.title} loading="lazy" />
                <div className="dl-video-play">▶</div>
                <span className="dl-video-link-tag">B 站</span>
              </div>
              <strong>{it.title}</strong>
              {it.views ? (
                <div className="dl-video-meta">
                  <span className="views">{it.views}</span>
                </div>
              ) : null}
            </a>
          );
        })}
      </div>
    </section>
  );
}
