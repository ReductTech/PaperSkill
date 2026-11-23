import React from 'react';
import { Ablation } from './ablation';
import { Baseline } from './baseline';
import { Compare } from './compare';
import { Gather } from './gather';
import { HeroNew } from './hero-new';
import { HeroOld } from './hero-old';
import { Limits } from './limits';
import { Prompt } from './prompt';
import { Repair } from './repair';
import { Results } from './results';
import { Retrieve } from './retrieve';
import { Transfer } from './transfer';
import { Vote } from './vote';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['ablation'] = Ablation;
widgetRegistry['baseline'] = Baseline;
widgetRegistry['compare'] = Compare;
widgetRegistry['gather'] = Gather;
widgetRegistry['hero-new'] = HeroNew;
widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['limits'] = Limits;
widgetRegistry['prompt'] = Prompt;
widgetRegistry['repair'] = Repair;
widgetRegistry['results'] = Results;
widgetRegistry['retrieve'] = Retrieve;
widgetRegistry['transfer'] = Transfer;
widgetRegistry['vote'] = Vote;
