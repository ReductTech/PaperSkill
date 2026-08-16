import React from 'react';
import {
  HeroDemo, HeroProduction, SceneAudition, ScenePhoneme, SceneFrameReview,
  SceneDistill, SceneRouting, SceneCleaning, SceneFinish,
} from './StudioScenes';
import {
  FailureLab, SolutionMap, PhonemeCompare, AudioAlignment, FrameRewardProbe,
  HandPresence, NfeRace, LoraMemory, SpeakerRouting, DataCuration, ResultConsole, CrossModelBench,
} from './MechanismWidgets';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['hero-demo'] = HeroDemo;
widgetRegistry['hero-production'] = HeroProduction;
widgetRegistry['scene-audition'] = SceneAudition;
widgetRegistry['scene-phoneme'] = ScenePhoneme;
widgetRegistry['scene-frame-review'] = SceneFrameReview;
widgetRegistry['scene-distill'] = SceneDistill;
widgetRegistry['scene-routing'] = SceneRouting;
widgetRegistry['scene-cleaning'] = SceneCleaning;
widgetRegistry['scene-finish'] = SceneFinish;
widgetRegistry['failure-lab'] = FailureLab;
widgetRegistry['solution-map'] = SolutionMap;
widgetRegistry['phoneme-compare'] = PhonemeCompare;
widgetRegistry['audio-alignment'] = AudioAlignment;
widgetRegistry['frame-reward-probe'] = FrameRewardProbe;
widgetRegistry['hand-presence'] = HandPresence;
widgetRegistry['nfe-race'] = NfeRace;
widgetRegistry['lora-memory'] = LoraMemory;
widgetRegistry['speaker-routing'] = SpeakerRouting;
widgetRegistry['data-curation'] = DataCuration;
widgetRegistry['result-console'] = ResultConsole;
widgetRegistry['cross-model-bench'] = CrossModelBench;
