import React, { useState, useCallback } from 'react';
import type { BiliDef } from '../types';
import { useBiliVideos, BiliCard } from '../lib/useBiliVideos';

// Optional Bilibili recommendations. Renders whenever >=1 real BVID is passed.
// Cards are ALWAYS shown from the static `it` data (title + optional baked-in cover),
// so a failed runtime metadata fetch can never hide a video. The runtime fetch only
// enriches with live views/duration and can supply a cover when none is baked in.
// UI copy is Simplified Chinese.
export function BiliVideos({ items }: { items: BiliDef[] }) {
  const bvids = items.map((i) => i.bvid);
  const [data, setData] = useState<Record<string, BiliCard | null>>({});
  // Track per-card cover load failures so we can fall back to the gradient
  // placeholder instead of showing a broken-image icon.
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

  const onLoad = useCallback((bvid: string, d: BiliCard | null) => {
    setData((prev) => ({ ...prev, [bvid]: d }));
  }, []);
  useBiliVideos(bvids, onLoad);

  const real = items.filter((i) => i.bvid && i.bvid.startsWith('BV'));

  return (
    <section className="dl-related-section">
      <h3>延伸学习 · B 站讲解视频</h3>
      <p className="video-open-tip">
        点击卡片会在浏览器新标签页打开 B 站，需要联网。这些是 3DMM 与数字人方向的背景视频，
        不是本论文作者的官方讲解。
      </p>
      <div className="dl-video-strip">
        {real.map((it) => {
          const d = data[it.bvid];
          // Prefer a baked-in static cover, then the live fetch; else none.
          const cover = it.cover || d?.cover;
          const showCover = !!cover && !imgError[it.bvid];
          return (
            <a
              key={it.bvid}
              className="dl-video-card"
              href={`https://www.bilibili.com/video/${it.bvid}`}
              target="_blank"
              rel="noopener"
              data-bvid={it.bvid}
            >
              <div className={`dl-video-link-cover ${cover ? 'is-loaded' : 'is-loading'}`}>
                {showCover ? (
                  <img
                    className="dl-video-cover-img"
                    src={cover}
                    alt={it.title}
                    // Bilibili's cover CDN blocks requests that carry a foreign
                    // Referer (hotlink protection -> 403). Sending no Referer lets
                    // the image load on any host.
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={() =>
                      setImgError((prev) => ({ ...prev, [it.bvid]: true }))
                    }
                  />
                ) : null}
                <div className="dl-video-play">▶</div>
                <span className="dl-video-link-tag">B 站</span>
                {d?.duration ? <span className="dl-video-duration">{d.duration}</span> : null}
              </div>
              <strong>{it.title}</strong>
              {it.reason ? <p className="dl-video-reason">{it.reason}</p> : null}
              {(it.views || d?.views) ? (
                <div className="dl-video-meta">
                  <span className="views">{it.views || d?.views}</span>
                  <span className="video-open-label">打开 B 站 ↗</span>
                </div>
              ) : null}
            </a>
          );
        })}
      </div>
    </section>
  );
}
