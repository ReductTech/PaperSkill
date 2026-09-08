import type React from 'react';
import { ArchitectureLock } from './architecture-lock';
import { CmcvRouter } from './cmcv-router';
import { CmcvTrust } from './cmcv-trust';
import { DataBias } from './data-bias';
import { ElementDdas } from './element-ddas';
import { GrpoLab } from './grpo-lab';
import { MgamLab } from './mgam-lab';
import { PageDdas } from './page-ddas';
import { RenderVerify } from './render-verify';
import { ResultsBoundary } from './results-boundary';
import { StageTraining } from './stage-training';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
  mode?: 'explore' | 'guided';
  guidedState?: string;
  onInteract?: () => void;
  onStateChange?: (state: string) => void;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

// PaperSkill's official validator detects this explicit registration form.
widgetRegistry['architecture-lock'] = ArchitectureLock;
widgetRegistry['data-bias'] = DataBias;
widgetRegistry['page-ddas'] = PageDdas;
widgetRegistry['element-ddas'] = ElementDdas;
widgetRegistry['cmcv-router'] = CmcvRouter;
widgetRegistry['cmcv-trust'] = CmcvTrust;
widgetRegistry['render-verify'] = RenderVerify;
widgetRegistry['stage-training'] = StageTraining;
widgetRegistry['grpo-lab'] = GrpoLab;
widgetRegistry['mgam-lab'] = MgamLab;
widgetRegistry['results-boundary'] = ResultsBoundary;
