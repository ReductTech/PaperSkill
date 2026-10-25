import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { Ch1Contour } from './ch1-contour';
import { Ch1Interface } from './ch1-interface';
import { Ch10Failures } from './ch10-failures';
import { Ch10Results } from './ch10-results';
import { Ch2Click } from './ch2-click';
import { Ch2State } from './ch2-state';
import { Ch3Simulator } from './ch3-simulator';
import { Ch4Guards } from './ch4-guards';
import { Ch5Capabilities } from './ch5-capabilities';
import { Ch6Rollout } from './ch6-rollout';
import { Ch7StarAction } from './ch7-star-action';
import { Ch7StarPool } from './ch7-star-pool';
import { Ch8Search } from './ch8-search';
import { Ch8Stop } from './ch8-stop';
import { Ch9Datasets } from './ch9-datasets';
import { PaperCutAnalogy } from './paper-analogy';
import { PaperHero } from './paper-hero';
import { SegAgentLab } from './segagent-core';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ch1-contour'] = Ch1Contour;
widgetRegistry['ch1-interface'] = Ch1Interface;
widgetRegistry['ch10-failures'] = Ch10Failures;
widgetRegistry['ch10-results'] = Ch10Results;
widgetRegistry['ch2-click'] = Ch2Click;
widgetRegistry['ch2-state'] = Ch2State;
widgetRegistry['ch3-simulator'] = Ch3Simulator;
widgetRegistry['ch4-guards'] = Ch4Guards;
widgetRegistry['ch5-capabilities'] = Ch5Capabilities;
widgetRegistry['ch6-rollout'] = Ch6Rollout;
widgetRegistry['ch7-star-action'] = Ch7StarAction;
widgetRegistry['ch7-star-pool'] = Ch7StarPool;
widgetRegistry['ch8-search'] = Ch8Search;
widgetRegistry['ch8-stop'] = Ch8Stop;
widgetRegistry['ch9-datasets'] = Ch9Datasets;
widgetRegistry['paper-analogy'] = PaperCutAnalogy;
widgetRegistry['paper-hero'] = PaperHero;
widgetRegistry['segagent-core'] = SegAgentLab;
