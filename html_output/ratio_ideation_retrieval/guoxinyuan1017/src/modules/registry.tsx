import React from 'react';
import { HeroTopicSimilarity, HeroTypedMoves } from './heroWidgets';
import { S0Moves } from './s0-moves';
import { S0Imbalance } from './s0-imbalance';
import { S1Problem } from './s1-problem';
import { S2Construction } from './s2-construction';
import { S3Split } from './s3-split';
import { S4Evaluation } from './s4-evaluation';
import { S5Human } from './s5-human';

// Widget registry: maps a `componentId` (referenced from `src/data/tutorial.ts`) to a
// React component. A missing id renders a graceful placeholder, so the app never crashes
// on an unfinished id.

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

// Cover widgets rendered inside the Hero contrast cards.
widgetRegistry['hero-topic-similarity'] = HeroTopicSimilarity;
widgetRegistry['hero-typed-moves'] = HeroTypedMoves;

// Paper-specific screens (2608.27394). Each screen is one self-contained interactive card;
// its markup lives in src/screens/sN.html and its behaviour in src/screens/sN.mount.ts.
widgetRegistry['s0-moves'] = S0Moves;
widgetRegistry['s0-imbalance'] = S0Imbalance;
widgetRegistry['s1-problem'] = S1Problem;
widgetRegistry['s2-construction'] = S2Construction;
widgetRegistry['s3-split'] = S3Split;
widgetRegistry['s4-evaluation'] = S4Evaluation;
widgetRegistry['s5-human'] = S5Human;
