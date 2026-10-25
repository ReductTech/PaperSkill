import React from 'react';
import { MountainCover, MountainPack, MountainMap, MountainClimb, MountainSummit } from './MountainJourney';

// Runnable mountain-theme example registry. The scaffolder replaces this file for
// paper-specific output; the packet assembler writes every generated widget entry.
//
// Pattern to add a widget:
//   import { Ch1Mod1 } from './ch1mod1';
//   widgetRegistry['ch1mod1'] = Ch1Mod1;
// and create src/modules/ch1mod1.tsx exporting a component of type React.FC<WidgetProps>.

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['mountain-cover'] = MountainCover;
widgetRegistry['mountain-pack'] = MountainPack;
widgetRegistry['mountain-map'] = MountainMap;
widgetRegistry['mountain-climb'] = MountainClimb;
widgetRegistry['mountain-summit'] = MountainSummit;
