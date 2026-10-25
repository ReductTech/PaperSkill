import React from 'react';
import { HeroNew, HeroOld, PhotoAnalogy } from './photoAnalogies';
import {
  CriteriaMatrix,
  DimensionExplorer,
  RopeRotation,
  VNIAHDistractor,
  VNIAHPath,
} from './conceptWidgets';
import {
  ConfigGuard,
  DiagonalLayout,
  FrequencyAllocation,
  PhaseCollision,
  TemporalSpacing,
  VideoRopeAssembler,
} from './methodWidgets';
import {
  AblationExplorer,
  DesignGuide,
  ExperimentExplorer,
  ResultRace,
} from './evidenceWidgets';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

const analogy = (sceneId: string): React.FC<WidgetProps> =>
  function AnalogyScene(props) {
    return <PhotoAnalogy {...props} sceneId={sceneId} />;
  };

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['hero-mrope'] = HeroOld;
widgetRegistry['hero-videorope'] = HeroNew;
widgetRegistry['photo-focus'] = analogy('photo-focus');
widgetRegistry['photo-dial'] = analogy('photo-dial');
widgetRegistry['photo-level'] = analogy('photo-level');
widgetRegistry['photo-search'] = analogy('photo-search');
widgetRegistry['photo-slow-ring'] = analogy('photo-slow-ring');
widgetRegistry['photo-diagonal'] = analogy('photo-diagonal');
widgetRegistry['photo-shutter'] = analogy('photo-shutter');
widgetRegistry['photo-compose'] = analogy('photo-compose');
widgetRegistry['photo-review'] = analogy('photo-review');
widgetRegistry['photo-preset'] = analogy('photo-preset');
widgetRegistry['dimension-explorer'] = DimensionExplorer;
widgetRegistry['rope-rotation'] = RopeRotation;
widgetRegistry['criteria-matrix'] = CriteriaMatrix;
widgetRegistry['vniah-distractor'] = VNIAHDistractor;
widgetRegistry['vniah-path'] = VNIAHPath;
widgetRegistry['frequency-allocation'] = FrequencyAllocation;
widgetRegistry['phase-collision'] = PhaseCollision;
widgetRegistry['diagonal-layout'] = DiagonalLayout;
widgetRegistry['temporal-spacing'] = TemporalSpacing;
widgetRegistry['videorope-assembler'] = VideoRopeAssembler;
widgetRegistry['config-guard'] = ConfigGuard;
widgetRegistry['experiment-explorer'] = ExperimentExplorer;
widgetRegistry['ablation-explorer'] = AblationExplorer;
widgetRegistry['design-guide'] = DesignGuide;
widgetRegistry['result-race'] = ResultRace;
