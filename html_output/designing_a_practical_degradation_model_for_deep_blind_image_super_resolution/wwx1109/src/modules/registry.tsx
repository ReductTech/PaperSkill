import React from 'react';
import { BsrganCover } from './bsrgan-cover';
import { Ch1FailureChart } from './ch1-failure-chart';
import { Ch1TraditionalModel } from './ch1-traditional-model';
import { Ch2Blur } from './ch2-blur';
import { Ch2Downsample } from './ch2-downsample';
import { Ch2Noise } from './ch2-noise';
import { Ch2Sampler } from './ch2-sampler';
import { Ch2Shuffle } from './ch2-shuffle';
import { Ch3Patch } from './ch3-patch';
import { Ch3Training } from './ch3-training';
import { Ch4Diagnosis } from './ch4-diagnosis';
import { Ch4Div2k4d } from './ch4-div2k4d';
import { Ch4ReadTable } from './ch4-read-table';
import { Ch4Realsrset } from './ch4-realsrset';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['bsrgan-cover'] = BsrganCover;
widgetRegistry['ch1-failure-chart'] = Ch1FailureChart;
widgetRegistry['ch1-traditional-model'] = Ch1TraditionalModel;
widgetRegistry['ch2-blur'] = Ch2Blur;
widgetRegistry['ch2-downsample'] = Ch2Downsample;
widgetRegistry['ch2-noise'] = Ch2Noise;
widgetRegistry['ch2-sampler'] = Ch2Sampler;
widgetRegistry['ch2-shuffle'] = Ch2Shuffle;
widgetRegistry['ch3-patch'] = Ch3Patch;
widgetRegistry['ch3-training'] = Ch3Training;
widgetRegistry['ch4-diagnosis'] = Ch4Diagnosis;
widgetRegistry['ch4-div2k4d'] = Ch4Div2k4d;
widgetRegistry['ch4-read-table'] = Ch4ReadTable;
widgetRegistry['ch4-realsrset'] = Ch4Realsrset;
