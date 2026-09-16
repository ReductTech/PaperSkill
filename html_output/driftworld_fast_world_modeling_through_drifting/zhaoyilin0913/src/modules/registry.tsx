import React from 'react';
import { BoatPaddle } from './boatPaddle';
import { BoatGlide } from './boatGlide';
import { BoatAnalogy } from './boatAnalogy';
import { Ch1Noise } from './ch1Noise';
import { Ch2Condition } from './ch2Condition';
import { Ch3Compare } from './ch3Compare';
import { Ch4Field } from './ch4Field';
import { Ch5Gamma } from './ch5Gamma';
import { Ch6Infer } from './ch6Infer';
import { Ch7Train } from './ch7Train';
import { Ch8Arch } from './ch8Arch';
import { Ch8Feature } from './ch8Feature';
import { Ch9Motion } from './ch9Motion';
import { Ch10Race } from './ch10Race';

// Widget registry: maps a `componentId` (referenced from src/data/tutorial.ts) to a
// React component. The generator ADDS entries here for every paper-specific canvas
// widget (hero sides, analogy animations, and interactive modules). A missing id
// renders a graceful placeholder, so the app never crashes on an unfinished id.
//
// Pattern to add a widget:
//   import { Ch1Mod1 } from './ch1mod1';
//   widgetRegistry['ch1mod1'] = Ch1Mod1;
// and create src/modules/ch1mod1.tsx exporting a component of type React.FC<WidgetProps>.

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['hero-paddle'] = BoatPaddle;
widgetRegistry['hero-glide'] = BoatGlide;
widgetRegistry['analogy-boat'] = BoatAnalogy;
widgetRegistry['ch1-noise'] = Ch1Noise;
widgetRegistry['ch2-condition'] = Ch2Condition;
widgetRegistry['ch3-compare'] = Ch3Compare;
widgetRegistry['ch4-field'] = Ch4Field;
widgetRegistry['ch5-gamma'] = Ch5Gamma;
widgetRegistry['ch6-infer'] = Ch6Infer;
widgetRegistry['ch7-train'] = Ch7Train;
widgetRegistry['ch8-arch'] = Ch8Arch;
widgetRegistry['ch8-feature'] = Ch8Feature;
widgetRegistry['ch9-motion'] = Ch9Motion;
widgetRegistry['ch10-race'] = Ch10Race;
