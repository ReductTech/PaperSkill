import React from 'react';
import { CacheEconomics } from './cache-economics';
import { ClinicCover } from './clinic-cover';
import { Closing } from './closing';
import { DreamGates } from './dream-gates';
import { KairosRhythm } from './kairos-rhythm';
import { KnobConsole } from './knob-console';
import { PromptAssembly } from './prompt-assembly';
import { RemoteControl } from './remote-control';
import { SourceCards } from './source-cards';
import { TwoHands } from './two-hands';
import { Verification } from './verification';
import { WhyRead } from './why-read';
import { YoloClassifier } from './yolo-classifier';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['cache-economics'] = CacheEconomics;
widgetRegistry['clinic-cover'] = ClinicCover;
widgetRegistry['closing'] = Closing;
widgetRegistry['dream-gates'] = DreamGates;
widgetRegistry['kairos-rhythm'] = KairosRhythm;
widgetRegistry['knob-console'] = KnobConsole;
widgetRegistry['prompt-assembly'] = PromptAssembly;
widgetRegistry['remote-control'] = RemoteControl;
widgetRegistry['source-cards'] = SourceCards;
widgetRegistry['two-hands'] = TwoHands;
widgetRegistry['verification'] = Verification;
widgetRegistry['why-read'] = WhyRead;
widgetRegistry['yolo-classifier'] = YoloClassifier;
