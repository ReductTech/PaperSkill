import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AnaKiteBatch } from './ana-kite-batch';
import { HeroNewEssDial } from './hero-new-ess-dial';
import { HeroOldStaticKnobs } from './hero-old-static-knobs';
import { MClipBatchView } from './m-clip-batch-view';
import { MClipBoundary } from './m-clip-boundary';
import { MCouplingAudit } from './m-coupling-audit';
import { MEssMeasure } from './m-ess-measure';
import { MForwardForward } from './m-forward-forward';
import { MGroupAdvantage } from './m-group-advantage';
import { MOffPolicyVariance } from './m-offpolicy-variance';
import { MP3oDualConsole } from './m-p3o-dual-console';
import { MP3oVsPpo } from './m-p3o-vs-ppo';
import { MStressClip } from './m-stress-clip';
import { MStressTemperature } from './m-stress-temperature';
import { MTerms } from './m-terms';
import { MTwoJobs } from './m-two-jobs';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ana-kite-batch'] = AnaKiteBatch;
widgetRegistry['hero-new-ess-dial'] = HeroNewEssDial;
widgetRegistry['hero-old-static-knobs'] = HeroOldStaticKnobs;
widgetRegistry['m-clip-batch-view'] = MClipBatchView;
widgetRegistry['m-clip-boundary'] = MClipBoundary;
widgetRegistry['m-coupling-audit'] = MCouplingAudit;
widgetRegistry['m-ess-measure'] = MEssMeasure;
widgetRegistry['m-forward-forward'] = MForwardForward;
widgetRegistry['m-group-advantage'] = MGroupAdvantage;
widgetRegistry['m-offpolicy-variance'] = MOffPolicyVariance;
widgetRegistry['m-p3o-dual-console'] = MP3oDualConsole;
widgetRegistry['m-p3o-vs-ppo'] = MP3oVsPpo;
widgetRegistry['m-stress-clip'] = MStressClip;
widgetRegistry['m-stress-temperature'] = MStressTemperature;
widgetRegistry['m-terms'] = MTerms;
widgetRegistry['m-two-jobs'] = MTwoJobs;
