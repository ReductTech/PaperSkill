import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AbacPolicyLab } from './abac-policy-lab';
import { ConversationStateLab } from './conversation-state-lab';
import { EvidenceMatrixLab } from './evidence-matrix-lab';
import { GateToggleLab } from './gate-toggle-lab';
import { IngestionStampLab } from './ingestion-stamp-lab';
import { LayeredArchitectureLab } from './layered-architecture-lab';
import { LibraryScenes } from './library-scenes';
import { OgxProviderLab } from './ogx-provider-lab';
import { OrchestrationBypassLab } from './orchestration-bypass-lab';
import { PushdownScaleLab } from './pushdown-scale-lab';
import { RelevanceLeakLab } from './relevance-leak-lab';
import { SecureSetBuilderLab } from './secure-set-builder-lab';
import { SharedInferenceLab } from './shared-inference-lab';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['abac-policy-lab'] = AbacPolicyLab;
widgetRegistry['conversation-state-lab'] = ConversationStateLab;
widgetRegistry['evidence-matrix-lab'] = EvidenceMatrixLab;
widgetRegistry['gate-toggle-lab'] = GateToggleLab;
widgetRegistry['ingestion-stamp-lab'] = IngestionStampLab;
widgetRegistry['layered-architecture-lab'] = LayeredArchitectureLab;
widgetRegistry['library-scenes'] = LibraryScenes;
widgetRegistry['ogx-provider-lab'] = OgxProviderLab;
widgetRegistry['orchestration-bypass-lab'] = OrchestrationBypassLab;
widgetRegistry['pushdown-scale-lab'] = PushdownScaleLab;
widgetRegistry['relevance-leak-lab'] = RelevanceLeakLab;
widgetRegistry['secure-set-builder-lab'] = SecureSetBuilderLab;
widgetRegistry['shared-inference-lab'] = SharedInferenceLab;
