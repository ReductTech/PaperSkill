import React from 'react';
import type { BiliDef } from '../types';
export function BiliVideos({items}:{items:BiliDef[]}) {
 return <section className="dl-related-section"><h3>延伸学习 · B 站讲解视频</h3><p>相关主题的视频，补充空间智能与视觉搜索的背景。</p><div className="dl-video-strip">{items.map(it=><a key={it.bvid} className="dl-video-card" href={`https://www.bilibili.com/video/${it.bvid}`} target="_blank" rel="noopener" data-bvid={it.bvid}><div className="dl-video-link-cover is-loaded"><img className="dl-video-cover-img" src={it.cover} referrerPolicy="no-referrer" data-original-cover={it.cover} alt={it.title}/><div className="dl-video-play">▶</div><span className="dl-video-link-tag">B 站</span></div><strong>{it.title}</strong><div className="dl-video-meta"><span className="views">{it.views}</span></div></a>)}</div></section>;
}
