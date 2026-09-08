import React from 'react';
import {
  HeroOld, HeroNew, EvidenceStub, IntroProblem, Contributions, Pipeline,
  BaselineResults, HeadDesigns, HeadResults, Pretrain, DataEngineering,
  GeneralistProtocol, GeneralistResults, GeneralistFactors, RealWorld, Conclusion,
} from './starvla-revision';

export interface WidgetProps { chapterId: string; moduleId: string; }

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['sv-hero-old'] = HeroOld;
widgetRegistry['sv-hero-new'] = HeroNew;
widgetRegistry['sv-intro-problem'] = IntroProblem;
widgetRegistry['sv-contributions'] = Contributions;
widgetRegistry['sv-pipeline'] = Pipeline;
widgetRegistry['sv-baseline-results'] = BaselineResults;
widgetRegistry['sv-head-designs'] = HeadDesigns;
widgetRegistry['sv-head-results'] = HeadResults;
widgetRegistry['sv-pretrain'] = Pretrain;
widgetRegistry['sv-data-engineering'] = DataEngineering;
widgetRegistry['sv-generalist-protocol'] = GeneralistProtocol;
widgetRegistry['sv-generalist-results'] = GeneralistResults;
widgetRegistry['sv-generalist-factors'] = GeneralistFactors;
widgetRegistry['sv-real-world'] = RealWorld;
widgetRegistry['sv-conclusion'] = Conclusion;
widgetRegistry['sv-ana-1'] = EvidenceStub;
widgetRegistry['sv-ana-2'] = EvidenceStub;
widgetRegistry['sv-ana-3'] = EvidenceStub;
widgetRegistry['sv-ana-4'] = EvidenceStub;
widgetRegistry['sv-ana-5'] = EvidenceStub;
widgetRegistry['sv-ana-6'] = EvidenceStub;
widgetRegistry['sv-ana-7'] = EvidenceStub;
widgetRegistry['sv-ana-8'] = EvidenceStub;
