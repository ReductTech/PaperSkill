import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { Boundary } from './boundary';
import { CLR } from './clr';
import { Context } from './context';
import { Curriculum } from './curriculum';
import { Instruct } from './instruct';
import { LongShort } from './long-short';
import { NotebookScene } from './notebook-scene';
import { Pipeline } from './pipeline';
import { Potential } from './potential';
import { Results } from './results';
import { Review } from './review';
import { Spectrum } from './spectrum';
import { Verifier } from './verifier';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['boundary'] = Boundary;
widgetRegistry['clr'] = CLR;
widgetRegistry['context'] = Context;
widgetRegistry['curriculum'] = Curriculum;
widgetRegistry['instruct'] = Instruct;
widgetRegistry['long-short'] = LongShort;
widgetRegistry['notebook-scene'] = NotebookScene;
widgetRegistry['pipeline'] = Pipeline;
widgetRegistry['potential'] = Potential;
widgetRegistry['results'] = Results;
widgetRegistry['review'] = Review;
widgetRegistry['spectrum'] = Spectrum;
widgetRegistry['verifier'] = Verifier;
