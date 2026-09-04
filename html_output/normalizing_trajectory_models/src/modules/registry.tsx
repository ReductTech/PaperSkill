import React from 'react';
import { HeroNew } from './hero-new';
import { HeroOld } from './hero-old';
import { M1Method } from './m1-method';
import { M1Steps } from './m1-steps';
import { M10Race } from './m10-race';
import { M3Frame } from './m3-frame';
import { M3Transport } from './m3-transport';
import { M4Gauss } from './m4-gauss';
import { M4Identity } from './m4-identity';
import { M5Finetune } from './m5-finetune';
import { M6Sample } from './m6-sample';
import { M7TSteps } from './m7-tsteps';
import { M9Denoise } from './m9-denoise';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['hero-new'] = HeroNew;
widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['m1-method'] = M1Method;
widgetRegistry['m1-steps'] = M1Steps;
widgetRegistry['m10-race'] = M10Race;
widgetRegistry['m3-frame'] = M3Frame;
widgetRegistry['m3-transport'] = M3Transport;
widgetRegistry['m4-gauss'] = M4Gauss;
widgetRegistry['m4-identity'] = M4Identity;
widgetRegistry['m5-finetune'] = M5Finetune;
widgetRegistry['m6-sample'] = M6Sample;
widgetRegistry['m7-tsteps'] = M7TSteps;
widgetRegistry['m9-denoise'] = M9Denoise;
