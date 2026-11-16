import React from 'react';
import { FlamingoAblation } from './flamingo-ablation';
import { FlamingoAttention } from './flamingo-attention';
import { FieldCoverNew } from './flamingo-cover-new';
import { FieldCoverOld } from './flamingo-cover-old';
import { FlamingoFrozen } from './flamingo-frozen';
import { FlamingoGate } from './flamingo-gate';
import { FlamingoInference } from './flamingo-inference';
import { FlamingoLimits } from './flamingo-limits';
import { FlamingoMask } from './flamingo-mask';
import { FlamingoPrompt } from './flamingo-prompt';
import { FlamingoResampler } from './flamingo-resampler';
import { FlamingoResults } from './flamingo-results';
import { FlamingoTraining } from './flamingo-training';
import { FlamingoVideo } from './flamingo-video';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['flamingo-ablation'] = FlamingoAblation;
widgetRegistry['flamingo-attention'] = FlamingoAttention;
widgetRegistry['flamingo-cover-new'] = FieldCoverNew;
widgetRegistry['flamingo-cover-old'] = FieldCoverOld;
widgetRegistry['flamingo-frozen'] = FlamingoFrozen;
widgetRegistry['flamingo-gate'] = FlamingoGate;
widgetRegistry['flamingo-inference'] = FlamingoInference;
widgetRegistry['flamingo-limits'] = FlamingoLimits;
widgetRegistry['flamingo-mask'] = FlamingoMask;
widgetRegistry['flamingo-prompt'] = FlamingoPrompt;
widgetRegistry['flamingo-resampler'] = FlamingoResampler;
widgetRegistry['flamingo-results'] = FlamingoResults;
widgetRegistry['flamingo-training'] = FlamingoTraining;
widgetRegistry['flamingo-video'] = FlamingoVideo;
