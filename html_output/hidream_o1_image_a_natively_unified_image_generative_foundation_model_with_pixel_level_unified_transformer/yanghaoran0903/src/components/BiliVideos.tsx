import React, { useCallback, useState } from 'react';
import type { BiliDef } from '../types';
import { useBiliVideos, BiliCard } from '../lib/useBiliVideos';

export function BiliVideos({ items }: { items: BiliDef[] }) {
  const bvids = items.map((i) => i.bvid);
  const [data, setData] = useState<Record<string, BiliCard | null>>({});
  const [imgError, setImgError] = useState<Record<string, boolean>>({});
  const onLoad = useCallback((bvid: string, d: BiliCard | null) => {
    setData((prev) => ({ ...prev, [bvid]: d }));
  }, []);
  useBiliVideos(bvids, onLoad);
  const real = items.filter((i) => i.bvid && i.bvid.startsWith('BV'));
  return (
    <section className="dl-related-section">
      <h3>延伸学习 · B站讲解视频</h3>
      <p>这里放几条相关讲解，方便你继续补课。</p>
      <div className="dl-video-strip">
        {real.map((it) => {
          const d = data[it.bvid];
          const cover = it.cover || d?.cover;
          const showCover = !!cover && !imgError[it.bvid];
          return (
            <a key={it.bvid} className="dl-video-card" href={`https://www.bilibili.com/video/${it.bvid}`} target="_blank" rel="noopener">
              <div className={`dl-video-link-cover ${cover ? 'is-loaded' : 'is-loading'}`}>
                {showCover ? <img className="dl-video-cover-img" src={cover} alt={it.title} referrerPolicy="no-referrer" loading="lazy" onError={() => setImgError((prev) => ({ ...prev, [it.bvid]: true }))} /> : null}
                <div className="dl-video-play">▶</div>
                <span className="dl-video-link-tag">B站</span>
                {d?.duration ? <span className="dl-video-duration">{d.duration}</span> : null}
              </div>
              <strong>{it.title}</strong>
              {(it.views || d?.views) ? <div className="dl-video-meta"><span className="views">{it.views || d?.views}</span></div> : null}
            </a>
          );
        })}
      </div>
    </section>
  );
}
