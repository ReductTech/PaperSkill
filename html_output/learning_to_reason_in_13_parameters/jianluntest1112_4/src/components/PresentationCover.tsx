import React from 'react';
import type { Meta, HeroConfig } from '../types';
import { Typography } from './Typography';
import { widgetRegistry } from '../modules/registry';
import { CoverPlaybackContext } from './CoverPlayback';
import { useTimeline } from '../lib/useTimeline';
export function PresentationCover({ meta, hero }: { meta: Meta; hero: HeroConfig }) {
  const playback = useTimeline({ autoPlay: true, loop: true, duration: 6000 });
  const panel = (side: 'oldMethod' | 'newMethod') => {
    const data = hero[side];
    const Widget = widgetRegistry[data.componentId || ''];
    return <div className={`ppt-cover-panel ${side === 'oldMethod' ? 'is-old' : 'is-new'}`}>
      <div className="ppt-cover-panel-heading"><Typography variant="h3">{data.title || (side === 'oldMethod' ? '原有方法' : '本文方法')}</Typography>
        <Typography variant="small" muted>{data.desc}</Typography></div>
      <div className="ppt-cover-animation">{Widget ? <Widget chapterId="cover" moduleId={side} /> :
        <Typography variant="small" muted>请配置此方法的教学动画。</Typography>}</div>
    </div>;
  };
  return <section className="ppt-cover">
    <div className={`ppt-cover-top${meta.titleEn.length > 115 ? ' is-very-long-title' : meta.titleEn.length > 70 ? ' is-long-title' : ''}`} data-slot="cover-title">
      <Typography variant="small" muted>{meta.venue}</Typography>
      <Typography variant="display">{meta.titleEn}</Typography>
      <Typography variant="subtitle" muted>{meta.coreProblem}</Typography>
    </div>
    <CoverPlaybackContext.Provider value={{ progress: playback.progress, playing: playback.playing }}>
      <div className="ppt-cover-comparison" data-slot="comparison">{panel('oldMethod')}{panel('newMethod')}</div>
    </CoverPlaybackContext.Provider>
    <div className="ppt-cover-footer" data-slot="cover-footer">
      <Typography variant="small" muted>{meta.coreInsight}</Typography>
    </div>
  </section>;
}
