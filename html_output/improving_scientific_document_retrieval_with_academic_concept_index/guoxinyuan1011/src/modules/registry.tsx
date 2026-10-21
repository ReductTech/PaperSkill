import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { Ch1Failures } from './ch1-failures';
import { Ch1Fence } from './ch1-fence';
import { Ch2PhraseGrid } from './ch2-phrase-grid';
import { Ch2Subtree } from './ch2-subtree';
import { Ch4Complement } from './ch4-complement';
import { Ch4Elsewhere } from './ch4-elsewhere';
import { Ch4Enrich } from './ch4-enrich';
import { Ch5CcqgenRing } from './ch5-ccqgen-ring';
import { Ch7Route } from './ch7-route';
import { Ch7Slice } from './ch7-slice';
import { Ch8Alpha } from './ch8-alpha';
import { Ch8Pipeline } from './ch8-pipeline';
import { HeroNewDial } from './hero-new-dial';
import { HeroOldDial } from './hero-old-dial';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ch1-failures'] = Ch1Failures;
widgetRegistry['ch1-fence'] = Ch1Fence;
widgetRegistry['ch2-phrase-grid'] = Ch2PhraseGrid;
widgetRegistry['ch2-subtree'] = Ch2Subtree;
widgetRegistry['ch4-complement'] = Ch4Complement;
widgetRegistry['ch4-elsewhere'] = Ch4Elsewhere;
widgetRegistry['ch4-enrich'] = Ch4Enrich;
widgetRegistry['ch5-ccqgen-ring'] = Ch5CcqgenRing;
widgetRegistry['ch7-route'] = Ch7Route;
widgetRegistry['ch7-slice'] = Ch7Slice;
widgetRegistry['ch8-alpha'] = Ch8Alpha;
widgetRegistry['ch8-pipeline'] = Ch8Pipeline;
widgetRegistry['hero-new-dial'] = HeroNewDial;
widgetRegistry['hero-old-dial'] = HeroOldDial;
