import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AtomCoding } from './atom-coding';
import { BayerMask } from './bayer-mask';
import { CriticalReflections, CriticalReview } from './critical-review';
import { DictionaryLearn } from './dictionary-learn';
import { HeroJoint } from './hero-joint';
import { MaskedRebuild } from './masked-rebuild';
import { OverlapMerge } from './overlap-merge';
import { HeroOld } from './paper-canvas';
import { PatchMatch } from './patch-match';
import { RawMotivation } from './raw-motivation';
import { RawPipeline } from './raw-pipeline';
import { RawTest } from './raw-test';
import { RealEffects } from './real-effects';
import { ResultsCompare } from './results-compare';
import { SharedCoding } from './shared-coding';
import { TileAnalogy } from './tile-analogy';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['atom-coding'] = AtomCoding;
widgetRegistry['bayer-mask'] = BayerMask;
widgetRegistry['critical-review'] = CriticalReview;
widgetRegistry['critical-reflections'] = CriticalReflections;
widgetRegistry['dictionary-learn'] = DictionaryLearn;
widgetRegistry['hero-joint'] = HeroJoint;
widgetRegistry['masked-rebuild'] = MaskedRebuild;
widgetRegistry['overlap-merge'] = OverlapMerge;
widgetRegistry['paper-canvas'] = HeroOld;
widgetRegistry['patch-match'] = PatchMatch;
widgetRegistry['raw-motivation'] = RawMotivation;
widgetRegistry['raw-pipeline'] = RawPipeline;
widgetRegistry['raw-test'] = RawTest;
widgetRegistry['real-effects'] = RealEffects;
widgetRegistry['results-compare'] = ResultsCompare;
widgetRegistry['shared-coding'] = SharedCoding;
widgetRegistry['tile-analogy'] = TileAnalogy;
