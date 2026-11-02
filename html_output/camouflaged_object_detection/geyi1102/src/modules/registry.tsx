import React from 'react';
import { SinetArch } from './sinet-arch';
import { SinetCod10k } from './sinet-cod10k';
import { SinetCover } from './sinet-cover';
import { SinetGeneral } from './sinet-general';
import { SinetLoss } from './sinet-loss';
import { SinetPdc } from './sinet-pdc';
import { SinetResults } from './sinet-results';
import { SinetRf } from './sinet-rf';
import { SinetSearch } from './sinet-search';
import { SinetSimilarity } from './sinet-similarity';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['sinet-arch'] = SinetArch;
widgetRegistry['sinet-cod10k'] = SinetCod10k;
widgetRegistry['sinet-cover'] = SinetCover;
widgetRegistry['sinet-general'] = SinetGeneral;
widgetRegistry['sinet-loss'] = SinetLoss;
widgetRegistry['sinet-pdc'] = SinetPdc;
widgetRegistry['sinet-results'] = SinetResults;
widgetRegistry['sinet-rf'] = SinetRf;
widgetRegistry['sinet-search'] = SinetSearch;
widgetRegistry['sinet-similarity'] = SinetSimilarity;
