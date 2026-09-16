import React from 'react';
import { AlignmentTower } from './alignment-tower';
import { Ana1, Ana2, Ana3, Ana4, Ana5, Ana6 } from './analogy-scenes';
import { AttentionMaskLab } from './attention-mask';
import { AblationLab } from './ablation-lab';
import { ConversionTimeline } from './conversion-timeline';
import { DecodingRace } from './decoding-race';
import { HeroAR, HeroDLM } from './hero-visual';
import { KnowledgeGraph } from './knowledge-graph';
import { ManualAlign } from './manual-align';
import { RepresentationSpace } from './representation-space';
import { ResultExplorer } from './result-explorer';
import { ChapterQuiz } from './chapter-quiz';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['alignment-tower'] = AlignmentTower;
widgetRegistry['attention-mask-lab'] = AttentionMaskLab;
widgetRegistry['ablation-lab'] = AblationLab;
widgetRegistry['ana-1'] = Ana1;
widgetRegistry['ana-2'] = Ana2;
widgetRegistry['ana-3'] = Ana3;
widgetRegistry['ana-4'] = Ana4;
widgetRegistry['ana-5'] = Ana5;
widgetRegistry['ana-6'] = Ana6;
widgetRegistry['conversion-timeline'] = ConversionTimeline;
widgetRegistry['decoding-race'] = DecodingRace;
widgetRegistry['hero-ar'] = HeroAR;
widgetRegistry['hero-dlm'] = HeroDLM;
widgetRegistry['knowledge-graph'] = KnowledgeGraph;
widgetRegistry['manual-align'] = ManualAlign;
widgetRegistry['representation-space'] = RepresentationSpace;
widgetRegistry['result-explorer'] = ResultExplorer;
widgetRegistry['chapter-quiz'] = ChapterQuiz;
