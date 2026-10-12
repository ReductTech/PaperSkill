import React from 'react';
import { PizzaProgramLab, ApiToolboxLab, PizzaExecutionLab } from './pizza-lab';
import { HeroOldProof, HeroNewProof, MuffinTrace, GqaLab } from './reasoning-lab';
import { BearKnowledgeLab, VideoFramesLab } from './knowledge-video-lab';
import { SystemLab, ContextLab, InterventionLab } from './system-lab';
import { EvidenceNote } from './evidence-note';
import { Analogy1 } from './analogy-1';
import { Analogy10 } from './analogy-10';
import { Analogy2 } from './analogy-2';
import { Analogy3 } from './analogy-3';
import { Analogy4 } from './analogy-4';
import { Analogy5 } from './analogy-5';
import { Analogy6 } from './analogy-6';
import { Analogy7 } from './analogy-7';
import { Analogy8 } from './analogy-8';
import { Analogy9 } from './analogy-9';
import { DetectionDivision } from './c1-share';
import { ViperBenchmarkRace } from './c10-results';
import { ImagePatchCrop } from './c2-crop';
import { ViperTrainingBoundary } from './c7-training';
import { ViperScene } from './viper-kit';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

function withEvidence(Component: React.FC<WidgetProps>, id: string): React.FC<WidgetProps> {
  return function EvidenceWidget(props) {
    return <div className="viper-tool">
      <style>{`.viper-tool pre { font-size: 18px; line-height: 1.7; white-space: pre-wrap; overflow-wrap: anywhere; padding: 14px 18px; border-radius: 10px; background: #f5f8f0; color: #21324a; }
      .viper-tool table th, .viper-tool table td { white-space: nowrap; }
      .viper-tool summary:focus-visible { outline: 3px solid #f07e47; outline-offset: 4px; }
      .viper-tool .viper-protocol { display: flex; flex-wrap: wrap; gap: 8px 20px; margin: 14px 0; font-size: 18px; color: #27446e; }
      .viper-tool .viper-legend { display: flex; flex-wrap: wrap; gap: 12px 24px; margin: 14px 0; font-size: 18px; }`}</style>
      <Component {...props} /><EvidenceNote id={id} />
    </div>;
  };
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['analogy-1'] = Analogy1;
widgetRegistry['analogy-10'] = Analogy10;
widgetRegistry['analogy-2'] = Analogy2;
widgetRegistry['analogy-3'] = Analogy3;
widgetRegistry['analogy-4'] = Analogy4;
widgetRegistry['analogy-5'] = Analogy5;
widgetRegistry['analogy-6'] = Analogy6;
widgetRegistry['analogy-7'] = Analogy7;
widgetRegistry['analogy-8'] = Analogy8;
widgetRegistry['analogy-9'] = Analogy9;
widgetRegistry['c1-share'] = withEvidence(DetectionDivision, 'c1-share');
widgetRegistry['c10-results'] = withEvidence(ViperBenchmarkRace, 'c10-results');
widgetRegistry['c2-crop'] = withEvidence(ImagePatchCrop, 'c2-crop');
widgetRegistry['c6-trace'] = withEvidence(MuffinTrace, 'c6-trace');
widgetRegistry['c7-training'] = withEvidence(ViperTrainingBoundary, 'c7-training');
widgetRegistry['c8-system'] = withEvidence(SystemLab, 'c8-system');
widgetRegistry['c9-intervene'] = withEvidence(InterventionLab, 'c9-intervene');
widgetRegistry['hero-new'] = HeroNewProof;
widgetRegistry['hero-old'] = HeroOldProof;
widgetRegistry['viper-kit'] = ViperScene;
widgetRegistry['pizza-program'] = withEvidence(PizzaProgramLab, 'pizza-program');
widgetRegistry['api-toolbox'] = withEvidence(ApiToolboxLab, 'api-toolbox');
widgetRegistry['gqa-reasoning'] = withEvidence(GqaLab, 'gqa-reasoning');
widgetRegistry['pizza-execution'] = withEvidence(PizzaExecutionLab, 'pizza-execution');
widgetRegistry['bear-knowledge'] = withEvidence(BearKnowledgeLab, 'bear-knowledge');
widgetRegistry['temporal-examples'] = withEvidence(VideoFramesLab, 'temporal-examples');
widgetRegistry['context-switch'] = withEvidence(ContextLab, 'context-switch');
