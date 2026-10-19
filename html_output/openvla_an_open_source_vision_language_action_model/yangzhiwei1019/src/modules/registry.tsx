import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { Ov2Analogy } from './ov2-analogy';
import { Ov2Ch1Tasks } from './ov2-ch1-tasks';
import { Ov2Ch2Encoder } from './ov2-ch2-encoder';
import { Ov2Ch3Binning } from './ov2-ch3-binning';
import { Ov2Ch3Drag } from './ov2-ch3-drag';
import { Ov2Ch4Decisions } from './ov2-ch4-decisions';
import { Ov2Ch5Decode } from './ov2-ch5-decode';
import { Ov2Ch6Arch } from './ov2-ch6-arch';
import { Ov2Ch6Backbone } from './ov2-ch6-backbone';
import { Ov2Ch7Peft } from './ov2-ch7-peft';
import { Ov2Ch7Quant } from './ov2-ch7-quant';
import { Ov2Ch8Limits } from './ov2-ch8-limits';
import { Ov2Ch8Race } from './ov2-ch8-race';
import { Ov2Hero } from './ov2-hero';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ov2-analogy'] = Ov2Analogy;
widgetRegistry['ov2-ch1-tasks'] = Ov2Ch1Tasks;
widgetRegistry['ov2-ch2-encoder'] = Ov2Ch2Encoder;
widgetRegistry['ov2-ch3-binning'] = Ov2Ch3Binning;
widgetRegistry['ov2-ch3-drag'] = Ov2Ch3Drag;
widgetRegistry['ov2-ch4-decisions'] = Ov2Ch4Decisions;
widgetRegistry['ov2-ch5-decode'] = Ov2Ch5Decode;
widgetRegistry['ov2-ch6-arch'] = Ov2Ch6Arch;
widgetRegistry['ov2-ch6-backbone'] = Ov2Ch6Backbone;
widgetRegistry['ov2-ch7-peft'] = Ov2Ch7Peft;
widgetRegistry['ov2-ch7-quant'] = Ov2Ch7Quant;
widgetRegistry['ov2-ch8-limits'] = Ov2Ch8Limits;
widgetRegistry['ov2-ch8-race'] = Ov2Ch8Race;
widgetRegistry['ov2-hero'] = Ov2Hero;
