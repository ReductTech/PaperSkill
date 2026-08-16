import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AttributionTracer } from './attribution-tracer';
import { AttributionPathLab } from './attribution-path-lab';
import { CaseFileAnalogy } from './case-file-analogy';
import { CandidateCollectionLab } from './candidate-collection-lab';
import { CircuitBuilder } from './circuit-builder';
import { CircuitDiagnosisAnalogy } from './circuit-diagnosis-analogy';
import { ConclusionEvidenceChain } from './conclusion-evidence-chain';
import { CoreCircuitMap } from './core-circuit-map';
import { CorePairTest } from './core-pair-test';
import { DeceptionTaskLab } from './deception-task-lab';
import { FeatureIntro } from './feature-intro';
import { FeatureDiscoverySteps } from './feature-discovery-steps';
import { HeroCircuitContrast } from './hero-circuit-contrast';
import { SteeringLab } from './steering-lab';
import { SteeringOutcomeCompare } from './steering-outcome-compare';
import { SteeringValidationLab } from './steering-validation-lab';
import { TranscoderMap } from './transcoder-map';
import { TranscoderIntro } from './transcoder-intro';
import { VisibilityCompare } from './visibility-compare';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['attribution-tracer'] = AttributionTracer;
widgetRegistry['attribution-path-lab'] = AttributionPathLab;
widgetRegistry['case-file-analogy'] = CaseFileAnalogy;
widgetRegistry['candidate-collection-lab'] = CandidateCollectionLab;
widgetRegistry['circuit-builder'] = CircuitBuilder;
widgetRegistry['circuit-diagnosis-analogy'] = CircuitDiagnosisAnalogy;
widgetRegistry['conclusion-evidence-chain'] = ConclusionEvidenceChain;
widgetRegistry['core-circuit-map'] = CoreCircuitMap;
widgetRegistry['core-pair-test'] = CorePairTest;
widgetRegistry['deception-task-lab'] = DeceptionTaskLab;
widgetRegistry['feature-intro'] = FeatureIntro;
widgetRegistry['feature-discovery-steps'] = FeatureDiscoverySteps;
widgetRegistry['hero-circuit-contrast'] = HeroCircuitContrast;
widgetRegistry['steering-lab'] = SteeringLab;
widgetRegistry['steering-outcome-compare'] = SteeringOutcomeCompare;
widgetRegistry['steering-validation-lab'] = SteeringValidationLab;
widgetRegistry['transcoder-map'] = TranscoderMap;
widgetRegistry['transcoder-intro'] = TranscoderIntro;
widgetRegistry['visibility-compare'] = VisibilityCompare;
