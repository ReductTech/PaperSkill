import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { LsmC1Compare } from './lsm-c1-compare';
import { LsmC1Main } from './lsm-c1-main';
import { LsmC10Main } from './lsm-c10-main';
import { LsmC2Main } from './lsm-c2-main';
import { LsmC3Main } from './lsm-c3-main';
import { LsmC4Main } from './lsm-c4-main';
import { LsmC5Main } from './lsm-c5-main';
import { LsmC6Main } from './lsm-c6-main';
import { LsmC7Main } from './lsm-c7-main';
import { LsmC8Main } from './lsm-c8-main';
import { LsmC9Main } from './lsm-c9-main';
import { LsmC9Mask } from './lsm-c9-mask';
import { LsmHeroContrast } from './lsm-hero-contrast';
import { LsmPhotoAnalogy } from './lsm-photo-analogy';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['lsm-c1-compare'] = LsmC1Compare;
widgetRegistry['lsm-c1-main'] = LsmC1Main;
widgetRegistry['lsm-c10-main'] = LsmC10Main;
widgetRegistry['lsm-c2-main'] = LsmC2Main;
widgetRegistry['lsm-c3-main'] = LsmC3Main;
widgetRegistry['lsm-c4-main'] = LsmC4Main;
widgetRegistry['lsm-c5-main'] = LsmC5Main;
widgetRegistry['lsm-c6-main'] = LsmC6Main;
widgetRegistry['lsm-c7-main'] = LsmC7Main;
widgetRegistry['lsm-c8-main'] = LsmC8Main;
widgetRegistry['lsm-c9-main'] = LsmC9Main;
widgetRegistry['lsm-c9-mask'] = LsmC9Mask;
widgetRegistry['lsm-hero-contrast'] = LsmHeroContrast;
widgetRegistry['lsm-photo-analogy'] = LsmPhotoAnalogy;
