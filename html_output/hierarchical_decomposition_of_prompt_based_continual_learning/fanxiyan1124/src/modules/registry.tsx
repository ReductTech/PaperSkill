import React from 'react';
import { HideCh1Obscured } from './hide-ch1-obscured';
import { HideCh10Results } from './hide-ch10-results';
import { HideCh2Representations } from './hide-ch2-representations';
import { HideCh3Decomposition } from './hide-ch3-decomposition';
import { HideCh4PromptEnsemble } from './hide-ch4-prompt-ensemble';
import { HideCh5Inference } from './hide-ch5-inference';
import { HideCh6Wtp } from './hide-ch6-wtp';
import { HideCh7Statistics } from './hide-ch7-statistics';
import { HideCh8Architecture } from './hide-ch8-architecture';
import { HideCh8Objectives } from './hide-ch8-objectives';
import { HideCh9Analysis } from './hide-ch9-analysis';
import { HideCh9Robustness } from './hide-ch9-robustness';
import { HideCoverNew } from './hide-cover-new';
import { HideCoverOld } from './hide-cover-old';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['hide-ch1-obscured'] = HideCh1Obscured;
widgetRegistry['hide-ch10-results'] = HideCh10Results;
widgetRegistry['hide-ch2-representations'] = HideCh2Representations;
widgetRegistry['hide-ch3-decomposition'] = HideCh3Decomposition;
widgetRegistry['hide-ch4-prompt-ensemble'] = HideCh4PromptEnsemble;
widgetRegistry['hide-ch5-inference'] = HideCh5Inference;
widgetRegistry['hide-ch6-wtp'] = HideCh6Wtp;
widgetRegistry['hide-ch7-statistics'] = HideCh7Statistics;
widgetRegistry['hide-ch8-architecture'] = HideCh8Architecture;
widgetRegistry['hide-ch8-objectives'] = HideCh8Objectives;
widgetRegistry['hide-ch9-analysis'] = HideCh9Analysis;
widgetRegistry['hide-ch9-robustness'] = HideCh9Robustness;
widgetRegistry['hide-cover-new'] = HideCoverNew;
widgetRegistry['hide-cover-old'] = HideCoverOld;
