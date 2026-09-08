import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { MgcnAblationLab } from './mgcn-ablation-lab';
import { MgcnArchitectureMap } from './mgcn-architecture-map';
import { MgcnFuserMixer } from './mgcn-fuser-mixer';
import { MgcnHeroCompare } from './mgcn-hero-compare';
import { MgcnKnnView } from './mgcn-knn-view';
import { MgcnLossBalance } from './mgcn-loss-balance';
import { MgcnModalityMap } from './mgcn-modality-map';
import { MgcnNoiseLab } from './mgcn-noise-lab';
import { MgcnPurifierCompare } from './mgcn-purifier-compare';
import { MgcnResultRace } from './mgcn-result-race';
import { MgcnStudioAnalogy } from './mgcn-studio-analogy';
import { MgcnUserItemSteps } from './mgcn-user-item-steps';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['mgcn-ablation-lab'] = MgcnAblationLab;
widgetRegistry['mgcn-architecture-map'] = MgcnArchitectureMap;
widgetRegistry['mgcn-fuser-mixer'] = MgcnFuserMixer;
widgetRegistry['mgcn-hero-compare'] = MgcnHeroCompare;
widgetRegistry['mgcn-knn-view'] = MgcnKnnView;
widgetRegistry['mgcn-loss-balance'] = MgcnLossBalance;
widgetRegistry['mgcn-modality-map'] = MgcnModalityMap;
widgetRegistry['mgcn-noise-lab'] = MgcnNoiseLab;
widgetRegistry['mgcn-purifier-compare'] = MgcnPurifierCompare;
widgetRegistry['mgcn-result-race'] = MgcnResultRace;
widgetRegistry['mgcn-studio-analogy'] = MgcnStudioAnalogy;
widgetRegistry['mgcn-user-item-steps'] = MgcnUserItemSteps;
