import React from 'react';
import { PalmCoverSeen } from './palm-cover-seen';
import { PalmCoverText } from './palm-cover-text';
import { PalmEncode } from './palm-encode';
import { PalmFreeze } from './palm-freeze';
import { PalmGeneral } from './palm-general';
import { PalmGround } from './palm-ground';
import { PalmLoop } from './palm-loop';
import { PalmLoss } from './palm-loss';
import { PalmPrefix } from './palm-prefix';
import { PalmRefer } from './palm-refer';
import { PalmRepair } from './palm-repair';
import { PalmTable } from './palm-table';
import { PalmTamp } from './palm-tamp';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['palm-cover-seen'] = PalmCoverSeen;
widgetRegistry['palm-cover-text'] = PalmCoverText;
widgetRegistry['palm-encode'] = PalmEncode;
widgetRegistry['palm-freeze'] = PalmFreeze;
widgetRegistry['palm-general'] = PalmGeneral;
widgetRegistry['palm-ground'] = PalmGround;
widgetRegistry['palm-loop'] = PalmLoop;
widgetRegistry['palm-loss'] = PalmLoss;
widgetRegistry['palm-prefix'] = PalmPrefix;
widgetRegistry['palm-refer'] = PalmRefer;
widgetRegistry['palm-repair'] = PalmRepair;
widgetRegistry['palm-table'] = PalmTable;
widgetRegistry['palm-tamp'] = PalmTamp;
