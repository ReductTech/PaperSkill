import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { StateBadge } from './colleague-ui';

const candidates = [
  { id: 'book', label: '第一人称著作', stars: 5, weight: 30, note: '直接、长篇、可定位' },
  { id: 'interview', label: '长篇访谈', stars: 5, weight: 28, note: '可观察推理过程' },
  { id: 'decision', label: '有记录的公开决策', stars: 4, weight: 22, note: '行动与上下文可核查' },
  { id: 'summary', label: '短摘要', stars: 2, weight: 10, note: '容易丢失限定条件' },
  { id: 'farm', label: '内容农场', stars: 1, weight: 3, note: '转述链长、来源薄弱' },
];

export const PublicEvidenceLab: React.FC<WidgetProps> = () => {
  const [selected, setSelected] = useState<string[]>(['summary']);
  const toggle = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const quality = useMemo(() => Math.min(100, selected.reduce((sum, id) => sum + (candidates.find(x => x.id === id)?.weight ?? 0), 0)), [selected]);
  const grounded = selected.includes('book') || selected.includes('interview') || selected.includes('decision');
  const tone = quality >= 55 && grounded ? 'good' : quality >= 25 ? 'current' : 'bad';
  return <div className="paper-widget public-evidence-lab">
    <div className="evidence-lab-grid">
      <section className="source-shelf"><b>你会信任哪些材料？</b>{candidates.map(item => <button key={item.id} className={`source-card${selected.includes(item.id) ? ' active' : ''}`} onClick={() => toggle(item.id)}><span className="source-stars" aria-label={`${item.stars} 星`}>{'★'.repeat(item.stars)}{'☆'.repeat(5 - item.stars)}</span><b>{item.label}</b><small>{item.note}</small></button>)}</section>
      <section className="evidence-basket"><header><StateBadge tone={tone}>证据篮</StateBadge><b>{selected.length} 项材料</b></header><div className="confidence-gauge"><span style={{ width: `${quality}%` }} /><b>{quality}</b></div><small>教学用证据充足度指示，不是论文报告的评测指标</small><div className="basket-list">{selected.length ? selected.map(id => <span key={id}>{candidates.find(x => x.id === id)?.label}</span>) : <em>尚未加入材料</em>}</div><div className={`evidence-verdict verdict-${tone}`}>{tone === 'good' ? '可继续研究，但仍需保留来源限制。' : tone === 'current' ? '证据仍薄弱：降低置信度并寻找更直接来源。' : '不要用通用 persona 文本填补证据缺口。'}</div></section>
    </div>
    <div className={`feedback ${tone === 'good' ? 'good' : tone === 'bad' ? 'bad' : ''}`}>{tone === 'good' ? '已有第一人称或长篇证据；工具链仍不能自动认证事实真伪。' : '论文的关键原则是：Evidence Thin → Downgrade Confidence，而不是补写一个听起来合理的人格。'}</div>
  </div>;
};

export default PublicEvidenceLab;
