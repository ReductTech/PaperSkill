import React from 'react';
import { AblationScene } from './camf-ablations';
import { AdapterScene } from './camf-adapter';
import { BoundaryScene } from './camf-boundaries';
import { CaptionScene } from './camf-captions';
import { CodebookScene } from './camf-codebook';
import { CamfCover } from './camf-cover';
import { ProtocolScene } from './camf-protocol';
import { ResultsScene } from './camf-results';
import { ScalesScene } from './camf-scales';
import { TokenMatchScene } from './camf-token-match';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['camf-ablations'] = AblationScene;
widgetRegistry['camf-adapter'] = AdapterScene;
widgetRegistry['camf-boundaries'] = BoundaryScene;
widgetRegistry['camf-captions'] = CaptionScene;
widgetRegistry['camf-codebook'] = CodebookScene;
widgetRegistry['camf-cover'] = CamfCover;
widgetRegistry['camf-protocol'] = ProtocolScene;
widgetRegistry['camf-results'] = ResultsScene;
widgetRegistry['camf-scales'] = ScalesScene;
widgetRegistry['camf-token-match'] = TokenMatchScene;
