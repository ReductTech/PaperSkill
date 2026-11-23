import React from 'react';
import { GlcAblation } from './glc-ablation';
import { GlcApplications } from './glc-applications';
import { GlcArchitecture } from './glc-architecture';
import { GlcClosing } from './glc-closing';
import { GlcCodePrediction } from './glc-code-prediction';
import { GlcCover } from './glc-cover';
import { GlcHyper } from './glc-hyper';
import { GlcKitFrame } from './glc-kit';
import { GlcLatent } from './glc-latent';
import { GlcLimits } from './glc-limits';
import { GlcProblem } from './glc-problem';
import { GlcRate } from './glc-rate';
import { GlcReproduce } from './glc-reproduce';
import { GlcResults } from './glc-results';
import { GlcStageOne } from './glc-stage-one';
import { GlcTransform } from './glc-transform';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['glc-ablation'] = GlcAblation;
widgetRegistry['glc-applications'] = GlcApplications;
widgetRegistry['glc-architecture'] = GlcArchitecture;
widgetRegistry['glc-closing'] = GlcClosing;
widgetRegistry['glc-code-prediction'] = GlcCodePrediction;
widgetRegistry['glc-cover'] = GlcCover;
widgetRegistry['glc-hyper'] = GlcHyper;
widgetRegistry['glc-kit'] = GlcKitFrame;
widgetRegistry['glc-latent'] = GlcLatent;
widgetRegistry['glc-limits'] = GlcLimits;
widgetRegistry['glc-problem'] = GlcProblem;
widgetRegistry['glc-rate'] = GlcRate;
widgetRegistry['glc-reproduce'] = GlcReproduce;
widgetRegistry['glc-results'] = GlcResults;
widgetRegistry['glc-stage-one'] = GlcStageOne;
widgetRegistry['glc-transform'] = GlcTransform;
