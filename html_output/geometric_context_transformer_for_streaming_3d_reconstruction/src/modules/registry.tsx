import type { FC } from 'react';
import { GcaTimeline } from './gca-context';
import { ApplicabilityBoundary, LongSequenceEvidence } from './evidence-boundary';
import { GctPipeline, PagedKvDemo, TrainingSupport, VideoRopeDemo } from './gct-system';
import { CampusWalkAnalogy, HeroNew, HeroOld } from './hero-scenes';
import { AttentionPatterns, StreamingTradeoff } from './streaming-problem';
import { MemoryComplexityExact } from './token-memory';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, FC<WidgetProps>> = {};
widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['hero-new'] = HeroNew;
widgetRegistry['campus-walk-analogy'] = CampusWalkAnalogy;
widgetRegistry['streaming-tradeoff'] = StreamingTradeoff;
widgetRegistry['attention-patterns'] = AttentionPatterns;
widgetRegistry['gca-timeline'] = GcaTimeline;
widgetRegistry['memory-complexity-exact'] = MemoryComplexityExact;
widgetRegistry['gct-pipeline'] = GctPipeline;
widgetRegistry['training-support'] = TrainingSupport;
widgetRegistry['video-rope-demo'] = VideoRopeDemo;
widgetRegistry['paged-kv-demo'] = PagedKvDemo;
widgetRegistry['long-sequence-evidence'] = LongSequenceEvidence;
widgetRegistry['applicability-boundary'] = ApplicabilityBoundary;
