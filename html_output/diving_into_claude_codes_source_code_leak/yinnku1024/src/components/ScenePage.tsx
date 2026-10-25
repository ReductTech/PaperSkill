import React from 'react';
import type { DeckPage } from '../lib/scenes';
import { widgetRegistry } from '../modules/registry';
import { Typography } from './Typography';
export function ScenePage({ page }: { page: DeckPage }) {
  const chapter = page.chapter!;
  const Widget = widgetRegistry[page.componentId || ''];
  return <section className="ppt-page" aria-label={page.title} data-chapter={chapter.id}>
    <header className="ppt-heading" data-slot="heading">
      <div className="ppt-heading-chapter"><Typography variant="small" muted>{chapter.title}</Typography></div>
      <div className="ppt-heading-title"><Typography variant="h1">{page.title}</Typography></div>
      {page.goal && <div className="ppt-heading-goal"><Typography variant="subtitle" muted>{page.goal}</Typography></div>}
    </header>
    <div className="ppt-body" data-slot="body">
      {Widget ? <Widget chapterId={chapter.id} moduleId={page.moduleId || page.id} /> :
        <Typography>缺少页面组件：{page.componentId}</Typography>}
    </div>
  </section>;
}
