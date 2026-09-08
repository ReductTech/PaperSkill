import React from 'react';
import { TaskCarousel } from './task-carousel';
import { V1Pipeline } from './v1-pipeline';
import { MaeAnimation } from './mae-animation';
import { MaeGap } from './mae-gap';
import { DistillationAnimation } from './distillation-animation';
import { UpgradeMatrix } from './upgrade-matrix';
import { EvidenceConclusion } from './evidence-conclusion';
import { BackupPanel } from './backup-panel';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['task-carousel'] = TaskCarousel;
widgetRegistry['v1-pipeline'] = V1Pipeline;
widgetRegistry['mae-animation'] = MaeAnimation;
widgetRegistry['mae-gap'] = MaeGap;
widgetRegistry['distillation-animation'] = DistillationAnimation;
widgetRegistry['upgrade-matrix'] = UpgradeMatrix;
widgetRegistry['evidence-conclusion'] = EvidenceConclusion;
widgetRegistry['backup-panel'] = BackupPanel;
