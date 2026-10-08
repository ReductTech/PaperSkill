import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AnalogyScene } from './analogy-scene';
import { ContrastiveModes } from './contrastive-modes';
import { EnsembleMixer } from './ensemble-mixer';
import { HeroNewScene } from './hero-new-scene';
import { HeroOldScene } from './hero-old-scene';
import { HierarchicalArchitecture } from './hierarchical-architecture';
import { HierarchyStepper } from './hierarchy-stepper';
import { IdentityHotspots } from './identity-hotspots';
import { ObjectiveBalance } from './objective-balance';
import { PathSwitcher } from './path-switcher';
import { RepresentationMap } from './representation-map';
import { ResultRace } from './result-race';
import { StatisticsBudget } from './statistics-budget';
import { UniversalStamp } from './universal-stamp';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['analogy-scene'] = AnalogyScene;
widgetRegistry['contrastive-modes'] = ContrastiveModes;
widgetRegistry['ensemble-mixer'] = EnsembleMixer;
widgetRegistry['hero-new-scene'] = HeroNewScene;
widgetRegistry['hero-old-scene'] = HeroOldScene;
widgetRegistry['hierarchical-architecture'] = HierarchicalArchitecture;
widgetRegistry['hierarchy-stepper'] = HierarchyStepper;
widgetRegistry['identity-hotspots'] = IdentityHotspots;
widgetRegistry['objective-balance'] = ObjectiveBalance;
widgetRegistry['path-switcher'] = PathSwitcher;
widgetRegistry['representation-map'] = RepresentationMap;
widgetRegistry['result-race'] = ResultRace;
widgetRegistry['statistics-budget'] = StatisticsBudget;
widgetRegistry['universal-stamp'] = UniversalStamp;
