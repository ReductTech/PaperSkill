import React from 'react';
import { HeroSpecialist } from './heroSpecialist';
import { HeroUnified } from './heroUnified';
import { Ch1AnalogyV2 } from './ch1AnalogyV2';
import { Ch1Mod1V2 } from './ch1Mod1V2';
import { Ch1Mod2V2 } from './ch1Mod2V2';
import { Ch2AnalogyV2 } from './ch2AnalogyV2';
import { Ch2Mod1V2 } from './ch2Mod1V2';
import { Ch2Mod2V2 } from './ch2Mod2V2';
import { Ch2Mod3V2 } from './ch2Mod3V2';
import { Ch3AnalogyV2 } from './ch3AnalogyV2';
import { Ch3Mod1V2 } from './ch3Mod1V2';
import { Ch3Mod2V2 } from './ch3Mod2V2';
import { Ch3Mod3V2 } from './ch3Mod3V2';
import { Ch4AnalogyV2 } from './ch4AnalogyV2';
import { Ch4Mod1V2 } from './ch4Mod1V2';
import { Ch4Mod2V2 } from './ch4Mod2V2';
import { Ch4Mod3V2 } from './ch4Mod3V2';
import { Ch5AnalogyV2 } from './ch5AnalogyV2';
import { Ch5Mod1V2 } from './ch5Mod1V2';
import { Ch5Mod2V2 } from './ch5Mod2V2';
import { Ch5Mod3V2 } from './ch5Mod3V2';
import { Ch6AnalogyV2 } from './ch6AnalogyV2';
import { Ch6Mod1V2 } from './ch6Mod1V2';
import { Ch6Mod2V2 } from './ch6Mod2V2';
import { Ch6Mod3V2 } from './ch6Mod3V2';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['hero-specialist'] = HeroSpecialist;
widgetRegistry['hero-unified'] = HeroUnified;

widgetRegistry['ch1-analogy'] = Ch1AnalogyV2;
widgetRegistry['ch1-mod1'] = Ch1Mod1V2;
widgetRegistry['ch1-mod2'] = Ch1Mod2V2;

widgetRegistry['ch2-analogy'] = Ch2AnalogyV2;
widgetRegistry['ch2-mod1'] = Ch2Mod1V2;
widgetRegistry['ch2-mod2'] = Ch2Mod2V2;
widgetRegistry['ch2-mod3'] = Ch2Mod3V2;

widgetRegistry['ch3-analogy'] = Ch3AnalogyV2;
widgetRegistry['ch3-mod1'] = Ch3Mod1V2;
widgetRegistry['ch3-mod2'] = Ch3Mod2V2;
widgetRegistry['ch3-mod3'] = Ch3Mod3V2;

widgetRegistry['ch4-analogy'] = Ch4AnalogyV2;
widgetRegistry['ch4-mod1'] = Ch4Mod1V2;
widgetRegistry['ch4-mod2'] = Ch4Mod2V2;
widgetRegistry['ch4-mod3'] = Ch4Mod3V2;

widgetRegistry['ch5-analogy'] = Ch5AnalogyV2;
widgetRegistry['ch5-mod1'] = Ch5Mod1V2;
widgetRegistry['ch5-mod2'] = Ch5Mod2V2;
widgetRegistry['ch5-mod3'] = Ch5Mod3V2;

widgetRegistry['ch6-analogy'] = Ch6AnalogyV2;
widgetRegistry['ch6-mod1'] = Ch6Mod1V2;
widgetRegistry['ch6-mod2'] = Ch6Mod2V2;
widgetRegistry['ch6-mod3'] = Ch6Mod3V2;
