import React from 'react';
import { AblationScene } from './re-ablation';
import { BenchmarkScene } from './re-benchmark';
import { CompositionScene } from './re-composition';
import { ResonanceCover } from './re-cover';
import { DecoderScene } from './re-decoder';
import { HaarScene } from './re-haar';
import { HandoffScene } from './re-handoff';
import { HistoryScene } from './re-history';
import { LinearScene } from './re-linear';
import { ObjectivesScene } from './re-objectives';
import { PairingScene } from './re-pairing';
import { QualitativeScene } from './re-qualitative';
import { SamplingScene } from './re-sampling';
import { SectorsScene } from './re-sectors';
import { SelfBiasScene } from './re-self';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['re-ablation'] = AblationScene;
widgetRegistry['re-benchmark'] = BenchmarkScene;
widgetRegistry['re-composition'] = CompositionScene;
widgetRegistry['re-cover'] = ResonanceCover;
widgetRegistry['re-decoder'] = DecoderScene;
widgetRegistry['re-haar'] = HaarScene;
widgetRegistry['re-handoff'] = HandoffScene;
widgetRegistry['re-history'] = HistoryScene;
widgetRegistry['re-linear'] = LinearScene;
widgetRegistry['re-objectives'] = ObjectivesScene;
widgetRegistry['re-pairing'] = PairingScene;
widgetRegistry['re-qualitative'] = QualitativeScene;
widgetRegistry['re-sampling'] = SamplingScene;
widgetRegistry['re-sectors'] = SectorsScene;
widgetRegistry['re-self'] = SelfBiasScene;
