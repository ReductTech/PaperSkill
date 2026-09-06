import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { Analogy1 } from './ana-1';
import { Analogy3 } from './ana-3';
import { Analogy4 } from './ana-4';
import { Analogy6 } from './ana-6';
import { Analogy7 } from './ana-7';
import { Analogy8 } from './ana-8';
import { HeroNew } from './hero-new';
import { HeroOld } from './hero-old';
import { Ch1Stress } from './ppocrv6-ch1-stress';
import {
  FinalBoundaries,
  FinalEvidenceBrowser,
  FinalEvidenceIntro,
  FinalReadingGuide,
} from './ppocrv6-ch10-results';
import {
  Ch2PipelineIntro,
  Ch2Representation,
  Ch2StrideMechanism,
} from './ppocrv6-ch2-representation';
import { Ch3Benefits, Ch3Mixers } from './ppocrv6-ch3-mixers';
import { Ch4Fusion, Ch4ReparamScope } from './ppocrv6-ch4-fusion';
import {
  CompactDetectionAnalogy,
  CompactDetectionLesson,
  CompactRecognitionLesson,
  CompactScalingLesson,
  CompactTrainingLesson,
} from './ppocrv6-ch6-9-compact';
import { OcrIntroAnalogy, OcrResearchTimeline, OcrScanDemo } from './ppocrv6-ocr-intro';
import { PpOcrSeries } from './ppocrv6-series';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ana-1'] = Analogy1;
widgetRegistry['ana-3'] = Analogy3;
widgetRegistry['ana-4'] = Analogy4;
widgetRegistry['ana-6'] = Analogy6;
widgetRegistry['ana-7'] = Analogy7;
widgetRegistry['ana-8'] = Analogy8;
widgetRegistry['hero-new'] = HeroNew;
widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['ppocrv6-ch1-stress'] = Ch1Stress;
widgetRegistry['ppocrv6-final-boundaries'] = FinalBoundaries;
widgetRegistry['ppocrv6-final-evidence'] = FinalEvidenceBrowser;
widgetRegistry['ppocrv6-final-intro'] = FinalEvidenceIntro;
widgetRegistry['ppocrv6-final-reading-guide'] = FinalReadingGuide;
widgetRegistry['ppocrv6-ch2-representation'] = Ch2Representation;
widgetRegistry['ppocrv6-ch2-pipeline-intro'] = Ch2PipelineIntro;
widgetRegistry['ppocrv6-ch2-stride'] = Ch2StrideMechanism;
widgetRegistry['ppocrv6-ch3-mixers'] = Ch3Mixers;
widgetRegistry['ppocrv6-ch3-benefits'] = Ch3Benefits;
widgetRegistry['ppocrv6-ch4-fusion'] = Ch4Fusion;
widgetRegistry['ppocrv6-ch4-reparam-scope'] = Ch4ReparamScope;
widgetRegistry['ppocrv6-compact-detection-analogy'] = CompactDetectionAnalogy;
widgetRegistry['ppocrv6-compact-detection'] = CompactDetectionLesson;
widgetRegistry['ppocrv6-compact-recognition'] = CompactRecognitionLesson;
widgetRegistry['ppocrv6-compact-training'] = CompactTrainingLesson;
widgetRegistry['ppocrv6-compact-scaling'] = CompactScalingLesson;
widgetRegistry['ppocrv6-ocr-analogy'] = OcrIntroAnalogy;
widgetRegistry['ppocrv6-ocr-research'] = OcrResearchTimeline;
widgetRegistry['ppocrv6-ocr-scan'] = OcrScanDemo;
widgetRegistry['ppocrv6-series'] = PpOcrSeries;
