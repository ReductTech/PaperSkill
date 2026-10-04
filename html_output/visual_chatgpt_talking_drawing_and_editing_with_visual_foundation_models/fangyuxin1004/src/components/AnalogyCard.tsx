import type { AnalogyCard as AnalogyCardDef } from '../types';
import { widgetRegistry } from '../modules/registry';
export function AnalogyCard({ analogy, chapterId }: { analogy: AnalogyCardDef; chapterId: string }) {
  const Widget = analogy.componentId ? widgetRegistry[analogy.componentId] : undefined;
  return <div className={`analogy-card ${Widget ? '' : 'concept-card'}`}>
    {Widget && <div className="analogy-visual"><Widget chapterId={chapterId} moduleId="ana" /></div>}
    <div className="analogy-body"><div className="analogy-title">{analogy.title}</div><div className="analogy-text" dangerouslySetInnerHTML={{ __html: analogy.text }} /></div>
  </div>;
}
