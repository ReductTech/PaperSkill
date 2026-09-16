import React from 'react';
import type { ChapterDef } from '../types';
import { learningResources } from '../data/learning-resources';

export function LearningResources({ chapters }: { chapters: ChapterDef[] }) {
  const groups = ['秩', 'SVD', 'Embedding', '注意力机制'] as const;
  return <section className="learning-resources" aria-labelledby="learning-title">
    <h2 id="learning-title">延伸学习</h2>
    <p>按需要补充基础，再回到对应章节操作。以下为 5 个视频与 1 篇图文教程；卡片使用主题标题帮助选择。</p>
    <p className="resource-open-note">访问入口在新标签页打开。无需在本页加载播放器。</p>
    {groups.map((group, i) => <section className="resource-group" aria-labelledby={'resource-group-' + i} key={group}>
      <h3 id={'resource-group-' + i}>{group}</h3>
      <div className="resource-grid">
        {learningResources.filter(item => item.group === group).map(item => <article className="resource-card" key={item.id} data-resource-id={item.id}>
          <p className="resource-meta"><span aria-hidden="true">{item.type === '视频' ? '▶' : '▤'}</span> {item.platform} · {item.type}</p>
          <h4>{item.title}</h4>
          <p>{item.purpose}</p>
          <p className="resource-chapters">对应章节：{item.chapterIds.map(id => {
            const index = chapters.findIndex(ch => ch.id === id);
            return index >= 0 ? '§' + (index + 1) + ' ' + chapters[index].title : id;
          }).join('；')}</p>
          <a className="resource-link" href={item.url} target="_blank" rel="noopener noreferrer"
            aria-label={(item.type === '视频' ? '观看视频：' : '阅读教程：') + item.title + '（新标签页）'}>
            {item.type === '视频' ? '观看视频' : '阅读教程'} <span aria-hidden="true">↗</span>
          </a>
        </article>)}
      </div>
    </section>)}
  </section>;
}
