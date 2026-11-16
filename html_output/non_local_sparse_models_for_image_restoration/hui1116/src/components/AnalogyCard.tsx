import type { AnalogyCard as AnalogyCardDef } from '../types';
import { widgetRegistry } from '../modules/registry';
import { Figure } from './Figure';
import '../styles/animation-intro.css';

// Life-metaphor analogy card (560x140 canvas animation OR an optional paper figure).
export function AnalogyCard({
  analogy,
  chapterId,
}: {
  analogy: AnalogyCardDef;
  chapterId: string;
}) {
  const Widget = analogy.componentId ? widgetRegistry[analogy.componentId] : undefined;
  return (
    <figure className="analogy-card analogy-card--intro-first">
      <figcaption className="analogy-body">
        <div className="analogy-title">{analogy.title}</div>
        <div className="analogy-text" dangerouslySetInnerHTML={{ __html: analogy.text }} />
      </figcaption>
      <div className="analogy-visual">
        {Widget ? (
          <Widget chapterId={chapterId} moduleId="ana" />
        ) : analogy.figure ? (
          <Figure src={analogy.figure} alt={analogy.title} />
        ) : (
          <canvas width={560} height={140} />
        )}
      </div>
    </figure>
  );
}
