import React from 'react';
import { ExampleSlider } from './exampleSlider';
import {
  FwSpectrum,
  FwFreeze,
  FwScale,
  FwCompress,
  FwCompressors,
  FwGate,
  FwFrequency,
} from './fwCh1to4';
import {
  FwPrompt,
  FwMask,
  FwChannel,
  FwWebpage,
  FwLoss,
  FwDelta,
  FwMatch,
} from './fwCh5to10';
import {
  AnaSpectrum,
  AnaFreeze,
  AnaCompress,
  AnaGate,
  AnaPrompt,
  AnaMask,
  AnaWebpage,
  AnaLoss,
  AnaDelta,
  AnaMatch,
} from './fwAnalogies';

// Widget registry: maps a `componentId` (referenced from src/data/tutorial.ts) to a
// React component. A missing id renders a graceful placeholder, so the app never
// crashes on an unfinished id.

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

// Template example kept so the scaffold runs out-of-the-box.
widgetRegistry['example-slider'] = ExampleSlider;

// Flamingo widgets — chapters 1–4
widgetRegistry['fw-spectrum'] = FwSpectrum;
widgetRegistry['fw-freeze'] = FwFreeze;
widgetRegistry['fw-scale'] = FwScale;
widgetRegistry['fw-compress'] = FwCompress;
widgetRegistry['fw-compressors'] = FwCompressors;
widgetRegistry['fw-gate'] = FwGate;
widgetRegistry['fw-frequency'] = FwFrequency;

// Flamingo widgets — chapters 5–10
widgetRegistry['fw-prompt'] = FwPrompt;
widgetRegistry['fw-mask'] = FwMask;
widgetRegistry['fw-channel'] = FwChannel;
widgetRegistry['fw-webpage'] = FwWebpage;
widgetRegistry['fw-loss'] = FwLoss;
widgetRegistry['fw-delta'] = FwDelta;
widgetRegistry['fw-match'] = FwMatch;

// Flamingo analogy cards — one animated scene per chapter (560x140 canvas)
widgetRegistry['ana-spectrum'] = AnaSpectrum;
widgetRegistry['ana-freeze'] = AnaFreeze;
widgetRegistry['ana-compress'] = AnaCompress;
widgetRegistry['ana-gate'] = AnaGate;
widgetRegistry['ana-prompt'] = AnaPrompt;
widgetRegistry['ana-mask'] = AnaMask;
widgetRegistry['ana-webpage'] = AnaWebpage;
widgetRegistry['ana-loss'] = AnaLoss;
widgetRegistry['ana-delta'] = AnaDelta;
widgetRegistry['ana-match'] = AnaMatch;
