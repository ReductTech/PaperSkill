import { tutorialSections } from '../data/tutorial';
import { AnalogyCard } from '../components/AnalogyCard';
import { Module } from '../components/Module';
import { Formula } from '../components/Formula';
import { InsightBar } from '../components/InsightBar';
import { Takeaway } from '../components/Takeaway';
import type { WidgetProps } from './registry';

/** Topic containers preserve every original section, including its formula and recap. */
export function TopicSection({ chapterId, moduleId }: WidgetProps) {
  const section = tutorialSections.find(item => item.id === moduleId);
  if (!section) return <p role="alert">小节内容未找到：{moduleId}</p>;
  return <section aria-label={`${section.id} ${section.title}`}>
    <AnalogyCard analogy={section.analogy} chapterId={`${chapterId}-${section.id}`} />
    {section.modules.map(module => <Module key={module.id} module={module} chapterId={chapterId} />)}
    {section.insight ? <InsightBar text={section.insight} /> : null}
    {section.formula ? <Formula formula={section.formula} /> : null}
    <Takeaway items={section.takeaways} />
  </section>;
}
