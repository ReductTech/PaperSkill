import React from 'react';
import { DfaAblation } from './dfa-ablation';
import { DfaChallenge } from './dfa-challenge';
import { DfaContrast } from './dfa-contrast';
import { DfaCost } from './dfa-cost';
import { DfaCover } from './dfa-cover';
import { DfaDual } from './dfa-dual';
import { DfaProtocol } from './dfa-protocol';
import { DfaPrototype } from './dfa-prototype';
import { DfaQueue } from './dfa-queue';
import { DfaResults } from './dfa-results';
import { DfaRouter } from './dfa-router';
import { DfaScr } from './dfa-scr';
import { DfaTraining } from './dfa-training';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['dfa-ablation'] = DfaAblation;
widgetRegistry['dfa-challenge'] = DfaChallenge;
widgetRegistry['dfa-contrast'] = DfaContrast;
widgetRegistry['dfa-cost'] = DfaCost;
widgetRegistry['dfa-cover'] = DfaCover;
widgetRegistry['dfa-dual'] = DfaDual;
widgetRegistry['dfa-protocol'] = DfaProtocol;
widgetRegistry['dfa-prototype'] = DfaPrototype;
widgetRegistry['dfa-queue'] = DfaQueue;
widgetRegistry['dfa-results'] = DfaResults;
widgetRegistry['dfa-router'] = DfaRouter;
widgetRegistry['dfa-scr'] = DfaScr;
widgetRegistry['dfa-training'] = DfaTraining;
