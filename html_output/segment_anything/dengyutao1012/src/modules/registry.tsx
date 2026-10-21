import React from 'react';
import { Ch1Compare } from './ch1Compare';
import { Ch2Prompts } from './ch2Prompts';
import { Ch3Loop } from './ch3Loop';
import { Ch4Arch } from './ch4Arch';
import { Ch5PromptEncode } from './ch5PromptEncode';
import { Ch6Ambiguity } from './ch6Ambiguity';
import { Ch6Decoder } from './ch6Decoder';
import { Ch7Loss } from './ch7Loss';
import { Ch8DataEngine } from './ch8DataEngine';
import { Ch9Dataset } from './ch9Dataset';
import { Ch9Scales } from './ch9Scales';
import { Ch10ZeroShot } from './ch10ZeroShot';
import { Ch10TextMask } from './ch10TextMask';

// Widget registry: maps a `componentId` (referenced from src/data/tutorial.ts) to a
// React component. Every id referenced in tutorial.ts MUST be registered here.

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['ch1-compare'] = Ch1Compare;
widgetRegistry['ch2-prompts'] = Ch2Prompts;
widgetRegistry['ch3-loop'] = Ch3Loop;
widgetRegistry['ch4-arch'] = Ch4Arch;
widgetRegistry['ch5-prompt-encode'] = Ch5PromptEncode;
widgetRegistry['ch6-ambiguity'] = Ch6Ambiguity;
widgetRegistry['ch6-decoder'] = Ch6Decoder;
widgetRegistry['ch7-loss'] = Ch7Loss;
widgetRegistry['ch8-dataengine'] = Ch8DataEngine;
widgetRegistry['ch9-dataset'] = Ch9Dataset;
widgetRegistry['ch9-scales'] = Ch9Scales;
widgetRegistry['ch10-zeroshot'] = Ch10ZeroShot;
widgetRegistry['ch10-textmask'] = Ch10TextMask;
