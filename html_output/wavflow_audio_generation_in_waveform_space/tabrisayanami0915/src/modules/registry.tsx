import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { Ch1CodecVsRaw } from './ch1CodecVsRaw';
import { Ch2WaveformPatchify } from './ch2WaveformPatchify';
import { Ch2AmplitudeLifting } from './ch2AmplitudeLifting';
import { Ch3ManifoldXpred } from './ch3ManifoldXpred';
import { Ch4FlowMatchingOde } from './ch4FlowMatchingOde';
import { Ch5DualConditioning } from './ch5DualConditioning';
import { Ch6CfgOdeSpace } from './ch6CfgOdeSpace';
import { Ch7VlossStepper } from './ch7VlossStepper';
import { Ch8MmditBlocks } from './ch8MmditBlocks';
import { Ch9DataCuration } from './ch9DataCuration';
import { Ch10ResultsBenchmark } from './ch10ResultsBenchmark';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

// Default and paper-specific widgets
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ch1-codec-vs-raw'] = Ch1CodecVsRaw;
widgetRegistry['ch2-waveform-patchify'] = Ch2WaveformPatchify;
widgetRegistry['ch2-amplitude-lifting'] = Ch2AmplitudeLifting;
widgetRegistry['ch3-manifold-xpred'] = Ch3ManifoldXpred;
widgetRegistry['ch4-flow-matching-ode'] = Ch4FlowMatchingOde;
widgetRegistry['ch5-dual-conditioning'] = Ch5DualConditioning;
widgetRegistry['ch6-cfg-ode-space'] = Ch6CfgOdeSpace;
widgetRegistry['ch7-vloss-stepper'] = Ch7VlossStepper;
widgetRegistry['ch8-mmdit-blocks'] = Ch8MmditBlocks;
widgetRegistry['ch9-data-curation'] = Ch9DataCuration;
widgetRegistry['ch10-results-benchmark'] = Ch10ResultsBenchmark;
