import React from 'react';
import { Localize } from './localize';
import { Pseudo } from './pseudo';
import { EvidenceQuiz } from './evidence-quiz';
import { ExampleSlider } from './exampleSlider';
import { WidgetAdapt } from './adapt';
import { WidgetAggregate } from './aggregate';
import { WidgetArchitecture } from './architecture';
import { WidgetData } from './data';
import { WidgetDot } from './dot';
import { WidgetFusion } from './fusion';
import { GlipKit } from './glip-kit';
import { HeroNew } from './hero-new';
import { HeroOld } from './hero-old';
import { MuseumScene } from './museum-scene';
import { WidgetResults } from './results';
import { WidgetTask } from './task';
import { WidgetThreshold } from './threshold';
import { WidgetTokens } from './tokens';
import { WidgetTrain } from './train';
import { WidgetUnify } from './unify';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['localize'] = Localize;
widgetRegistry['pseudo'] = Pseudo;
widgetRegistry['evidence-quiz'] = EvidenceQuiz;
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['adapt'] = WidgetAdapt;
widgetRegistry['aggregate'] = WidgetAggregate;
widgetRegistry['architecture'] = WidgetArchitecture;
widgetRegistry['data'] = WidgetData;
widgetRegistry['dot'] = WidgetDot;
widgetRegistry['fusion'] = WidgetFusion;
widgetRegistry['glip-kit'] = GlipKit;
widgetRegistry['hero-new'] = HeroNew;
widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['museum-scene'] = MuseumScene;
widgetRegistry['results'] = WidgetResults;
widgetRegistry['task'] = WidgetTask;
widgetRegistry['threshold'] = WidgetThreshold;
widgetRegistry['tokens'] = WidgetTokens;
widgetRegistry['train'] = WidgetTrain;
widgetRegistry['unify'] = WidgetUnify;
