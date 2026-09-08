import React from 'react';
import { HeroMapWidget } from './promptGraphHero';
import { MapAnalogyWidget } from './mapAnalogy';
import { RqInteractive } from './rqInteractive';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['hero-old'] = HeroMapWidget;
widgetRegistry['hero-new'] = HeroMapWidget;
widgetRegistry['analogy-1'] = MapAnalogyWidget;
widgetRegistry['analogy-2'] = MapAnalogyWidget;
widgetRegistry['analogy-3'] = MapAnalogyWidget;
widgetRegistry['analogy-4'] = MapAnalogyWidget;
widgetRegistry['analogy-5'] = MapAnalogyWidget;
widgetRegistry['analogy-6'] = MapAnalogyWidget;
widgetRegistry['rq1-timeline'] = RqInteractive;
widgetRegistry['rq1-shapes'] = RqInteractive;
widgetRegistry['rq2-definition'] = RqInteractive;
widgetRegistry['rq2-test'] = RqInteractive;
widgetRegistry['rq3-graph'] = RqInteractive;
widgetRegistry['rq3-boundary'] = RqInteractive;
widgetRegistry['rq4-matrix'] = RqInteractive;
widgetRegistry['rq4-verdicts'] = RqInteractive;
widgetRegistry['rq5-axes'] = RqInteractive;
widgetRegistry['rq5-transversal'] = RqInteractive;
widgetRegistry['rq-recap'] = RqInteractive;
