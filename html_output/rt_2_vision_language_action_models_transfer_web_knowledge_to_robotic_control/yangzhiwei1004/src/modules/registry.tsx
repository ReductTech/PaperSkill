import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AnalogyCore } from './analogy-core';
import { MActionRead } from './m-action-read';
import { MArchHotspots } from './m-arch-hotspots';
import { MClosedLoop } from './m-closed-loop';
import { MGuidanceAmount } from './m-guidance-amount';
import { MPlanAction } from './m-plan-action';
import { MQuantize } from './m-quantize';
import { MRecipeChips } from './m-recipe-chips';
import { MResultRace } from './m-result-race';
import { MTokenizerBind } from './m-tokenizer-bind';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['analogy-core'] = AnalogyCore;
widgetRegistry['m-action-read'] = MActionRead;
widgetRegistry['m-arch-hotspots'] = MArchHotspots;
widgetRegistry['m-closed-loop'] = MClosedLoop;
widgetRegistry['m-guidance-amount'] = MGuidanceAmount;
widgetRegistry['m-plan-action'] = MPlanAction;
widgetRegistry['m-quantize'] = MQuantize;
widgetRegistry['m-recipe-chips'] = MRecipeChips;
widgetRegistry['m-result-race'] = MResultRace;
widgetRegistry['m-tokenizer-bind'] = MTokenizerBind;
