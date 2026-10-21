import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { Chapter1Analogy } from './ch1-analogy';
import { Chapter1Main } from './ch1-main';
import { Ch10Analogy } from './ch10-analogy';
import { Ch10Main } from './ch10-main';
import { Ch10Second } from './ch10-second';
import { Chapter2Analogy } from './ch2-analogy';
import { Chapter2Main } from './ch2-main';
import { Chapter3Analogy } from './ch3-analogy';
import { Chapter3Main } from './ch3-main';
import { Ch4Analogy } from './ch4-analogy';
import { Ch4Main } from './ch4-main';
import { Ch4Second } from './ch4-second';
import { Ch5Analogy } from './ch5-analogy';
import { Ch5Main } from './ch5-main';
import { Ch6Analogy } from './ch6-analogy';
import { Ch6Main } from './ch6-main';
import { Ch7Analogy } from './ch7-analogy';
import { Ch7Main } from './ch7-main';
import { Ch8Analogy } from './ch8-analogy';
import { Ch8Main } from './ch8-main';
import { Ch9Analogy } from './ch9-analogy';
import { Ch9Main } from './ch9-main';
import { Ch9Second } from './ch9-second';
import { HeroNew } from './hero-new';
import { HeroOld } from './hero-old';
import { StudioKit } from './studio-kit';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

function withLocalKeys(Widget: React.FC<WidgetProps>): React.FC<WidgetProps> {
  return function LocalWidget(props) {
    return <div onKeyDown={event => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.stopPropagation();
    }}><Widget {...props} /></div>;
  };
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ch1-analogy'] = Chapter1Analogy;
widgetRegistry['ch1-main'] = withLocalKeys(Chapter1Main);
widgetRegistry['ch10-analogy'] = Ch10Analogy;
widgetRegistry['ch10-main'] = withLocalKeys(Ch10Main);
widgetRegistry['ch10-second'] = withLocalKeys(Ch10Second);
widgetRegistry['ch2-analogy'] = Chapter2Analogy;
widgetRegistry['ch2-main'] = withLocalKeys(Chapter2Main);
widgetRegistry['ch3-analogy'] = Chapter3Analogy;
widgetRegistry['ch3-main'] = withLocalKeys(Chapter3Main);
widgetRegistry['ch4-analogy'] = Ch4Analogy;
widgetRegistry['ch4-main'] = withLocalKeys(Ch4Main);
widgetRegistry['ch4-second'] = withLocalKeys(Ch4Second);
widgetRegistry['ch5-analogy'] = Ch5Analogy;
widgetRegistry['ch5-main'] = withLocalKeys(Ch5Main);
widgetRegistry['ch6-analogy'] = Ch6Analogy;
widgetRegistry['ch6-main'] = withLocalKeys(Ch6Main);
widgetRegistry['ch7-analogy'] = Ch7Analogy;
widgetRegistry['ch7-main'] = withLocalKeys(Ch7Main);
widgetRegistry['ch8-analogy'] = Ch8Analogy;
widgetRegistry['ch8-main'] = withLocalKeys(Ch8Main);
widgetRegistry['ch9-analogy'] = Ch9Analogy;
widgetRegistry['ch9-main'] = withLocalKeys(Ch9Main);
widgetRegistry['ch9-second'] = withLocalKeys(Ch9Second);
widgetRegistry['hero-new'] = HeroNew;
widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['studio-kit'] = StudioKit;
