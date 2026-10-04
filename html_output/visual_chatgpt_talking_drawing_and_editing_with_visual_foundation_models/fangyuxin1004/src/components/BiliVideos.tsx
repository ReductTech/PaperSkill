import type { BiliDef } from '../types';
export function BiliVideos({ items }: { items: BiliDef[] }) {
  return <section className="dl-related-section"><h3>延伸学习 · 视频讲解</h3><p>结合动画回顾多模态工具协作，再听一遍完整讲解。</p><div className="dl-video-strip">
    {items.filter(it => it.bvid.startsWith('BV')).map(it => <a key={it.bvid} className="dl-video-card" href={`https://www.bilibili.com/video/${it.bvid}`} target="_blank" rel="noopener noreferrer" data-bvid={it.bvid}>
      <div className="dl-video-link-cover is-loaded">{it.cover && <img className="dl-video-cover-img" src={it.cover} alt={it.title} loading="lazy" referrerPolicy="no-referrer" />}<div className="dl-video-play" aria-hidden="true">▶</div><span className="dl-video-link-tag">B 站</span></div>
      <strong>{it.title}</strong><span className="video-reason">{it.reason}</span>{it.views && <span className="dl-video-meta">{it.views}</span>}
    </a>)}
  </div></section>;
}
