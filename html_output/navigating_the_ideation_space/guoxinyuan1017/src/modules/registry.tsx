import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { HeroSingleVector, HeroDecompose } from './heroWidgets';
import { S0Overview } from './s0-overview';
import { S1Decompose } from './s1-decompose';
import { S2Transition } from './s2-transition';
import { S2Cost } from './s2-cost';
import { S3Negatives } from './s3-negatives';
import { S4Retrieval } from './s4-retrieval';
import { S5Evaluate } from './s5-evaluate';

// Widget registry: maps a `componentId` (referenced from `src/data/tutorial.ts`) to a
// React component. A missing id renders a graceful placeholder, so the app never crashes
// on an unfinished id.

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

// Framework example kept so a fresh scaffold runs out-of-the-box.
widgetRegistry['example-slider'] = ExampleSlider;

// Cover widgets rendered inside the Hero contrast cards.
widgetRegistry['hero-single-vector'] = HeroSingleVector;
widgetRegistry['hero-decompose'] = HeroDecompose;

// Paper-specific screens (2601.08901). Each is one self-contained interactive card.
widgetRegistry['s0-overview'] = S0Overview;
widgetRegistry['s1-decompose'] = S1Decompose;
widgetRegistry['s2-transition'] = S2Transition;
widgetRegistry['s2-cost'] = S2Cost;
widgetRegistry['s3-negatives'] = S3Negatives;
widgetRegistry['s4-retrieval'] = S4Retrieval;
widgetRegistry['s5-evaluate'] = S5Evaluate;
