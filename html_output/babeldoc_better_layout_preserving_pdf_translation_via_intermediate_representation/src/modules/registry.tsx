import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AblationLab } from './ablation-lab';
import { BenchmarkRace } from './benchmark-race';
import { ContextStitch } from './context-stitch';
import { CtmNesting } from './ctm-nesting';
import { FormulaShield } from './formula-shield';
import { GlossaryLab } from './glossary-lab';
import { IrInspector } from './ir-inspector';
import { MuseumAnalogy } from './museum-analogy';
import { MuseumHero } from './museum-hero';
import { PipelineMap } from './pipeline-map';
import { ScopeCompare } from './scope-compare';
import { TypesetSearch } from './typeset-search';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ablation-lab'] = AblationLab;
widgetRegistry['benchmark-race'] = BenchmarkRace;
widgetRegistry['context-stitch'] = ContextStitch;
widgetRegistry['ctm-nesting'] = CtmNesting;
widgetRegistry['formula-shield'] = FormulaShield;
widgetRegistry['glossary-lab'] = GlossaryLab;
widgetRegistry['ir-inspector'] = IrInspector;
widgetRegistry['museum-analogy'] = MuseumAnalogy;
widgetRegistry['museum-hero'] = MuseumHero;
widgetRegistry['pipeline-map'] = PipelineMap;
widgetRegistry['scope-compare'] = ScopeCompare;
widgetRegistry['typeset-search'] = TypesetSearch;
