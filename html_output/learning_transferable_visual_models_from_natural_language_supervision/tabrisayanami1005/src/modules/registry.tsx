import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { ClipCh1 } from './clip-ch1';
import { ClipCh10 } from './clip-ch10';
import { ClipCh2 } from './clip-ch2';
import { ClipCh3 } from './clip-ch3';
import { ClipCh4 } from './clip-ch4';
import { ClipCh5 } from './clip-ch5';
import { ClipCh6 } from './clip-ch6';
import { ClipCh7 } from './clip-ch7';
import { ClipCh8 } from './clip-ch8';
import { ClipCh9 } from './clip-ch9';
import { ClipScenes } from './clip-scenes';
import { ClipFoundations } from './clip-foundations';
import { ClipBackbones, ClipAttention, ClipConfigurations } from './clip-backbones';
import { ClipMethodChoice, ClipTransfer } from './clip-method-evidence';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['clip-ch1'] = ClipCh1;
widgetRegistry['clip-ch10'] = ClipCh10;
widgetRegistry['clip-ch2'] = ClipCh2;
widgetRegistry['clip-ch3'] = ClipCh3;
widgetRegistry['clip-ch4'] = ClipCh4;
widgetRegistry['clip-ch5'] = ClipCh5;
widgetRegistry['clip-ch6'] = ClipCh6;
widgetRegistry['clip-ch7'] = ClipCh7;
widgetRegistry['clip-ch8'] = ClipCh8;
widgetRegistry['clip-ch9'] = ClipCh9;
widgetRegistry['clip-scenes'] = ClipScenes;
widgetRegistry['clip-foundations'] = ClipFoundations;
widgetRegistry['clip-backbones'] = ClipBackbones;
widgetRegistry['clip-attention'] = ClipAttention;
widgetRegistry['clip-configurations'] = ClipConfigurations;
widgetRegistry['clip-method-choice'] = ClipMethodChoice;
widgetRegistry['clip-transfer'] = ClipTransfer;
