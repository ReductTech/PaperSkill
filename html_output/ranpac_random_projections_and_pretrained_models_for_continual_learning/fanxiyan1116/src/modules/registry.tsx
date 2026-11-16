import React from 'react';
import { RpCh1Drift } from './rp-ch1-drift';
import { RpCh10Results } from './rp-ch10-results';
import { RpCh2FeatureLens } from './rp-ch2-feature-lens';
import { RpCh3Gram } from './rp-ch3-gram';
import { RpCh3Ncm } from './rp-ch3-ncm';
import { RpCh4Width } from './rp-ch4-width';
import { RpCh5Ridge } from './rp-ch5-ridge';
import { RpCh6Phase2 } from './rp-ch6-phase2';
import { RpCh7Firstsession } from './rp-ch7-firstsession';
import { RpCh8Architecture } from './rp-ch8-architecture';
import { RpCh8Parameters } from './rp-ch8-parameters';
import { RpCh9WidthGauge } from './rp-ch9-width-gauge';
import { RpCoverNew } from './rp-cover-new';
import { RpCoverOld } from './rp-cover-old';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['rp-ch1-drift'] = RpCh1Drift;
widgetRegistry['rp-ch10-results'] = RpCh10Results;
widgetRegistry['rp-ch2-feature-lens'] = RpCh2FeatureLens;
widgetRegistry['rp-ch3-gram'] = RpCh3Gram;
widgetRegistry['rp-ch3-ncm'] = RpCh3Ncm;
widgetRegistry['rp-ch4-width'] = RpCh4Width;
widgetRegistry['rp-ch5-ridge'] = RpCh5Ridge;
widgetRegistry['rp-ch6-phase2'] = RpCh6Phase2;
widgetRegistry['rp-ch7-firstsession'] = RpCh7Firstsession;
widgetRegistry['rp-ch8-architecture'] = RpCh8Architecture;
widgetRegistry['rp-ch8-parameters'] = RpCh8Parameters;
widgetRegistry['rp-ch9-width-gauge'] = RpCh9WidthGauge;
widgetRegistry['rp-cover-new'] = RpCoverNew;
widgetRegistry['rp-cover-old'] = RpCoverOld;
