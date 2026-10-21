import React from 'react';
import { CaptionToggle } from './caption-toggle';
import { DogScene } from './dog-scene';
import { Evidence } from './evidence';
import { HeroScene } from './hero-scene';
import { Pipeline } from './pipeline';
import { Roles } from './roles';
import { GenericToggle } from './generic-toggle';
import { HeadInspector } from './head-inspector';
import { ResultsExplorer } from './results-explorer';
import { AblationExplorer } from './ablation-explorer';
import { FailureExplorer } from './failure-explorer';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['caption-toggle'] = CaptionToggle;
widgetRegistry['dog-scene'] = DogScene;
widgetRegistry['evidence'] = Evidence;
widgetRegistry['hero-scene'] = HeroScene;
widgetRegistry['pipeline'] = Pipeline;
widgetRegistry['roles'] = Roles;
widgetRegistry['generic-toggle'] = GenericToggle;
widgetRegistry['head-inspector'] = HeadInspector;
widgetRegistry['results-explorer'] = ResultsExplorer;
widgetRegistry['ablation-explorer'] = AblationExplorer;
widgetRegistry['failure-explorer'] = FailureExplorer;
