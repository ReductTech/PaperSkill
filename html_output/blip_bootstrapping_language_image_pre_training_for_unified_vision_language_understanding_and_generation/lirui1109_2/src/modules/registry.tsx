import React from 'react';
import { BlipAblation } from './blip-ablation';
import { BlipArchitecture } from './blip-architecture';
import { BlipBootstrap } from './blip-bootstrap';
import { BlipBoundary } from './blip-boundary';
import { BlipContrastive } from './blip-contrastive';
import { BlipCover } from './blip-cover';
import { BlipFiltering } from './blip-filtering';
import { BlipLanguage } from './blip-language';
import { BlipMatching } from './blip-matching';
import { BlipNoise } from './blip-noise';
import { BlipResults } from './blip-results';
import { BlipSampling } from './blip-sampling';
import { BlipSharing } from './blip-sharing';
import { BlipVideo } from './blip-video';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['blip-ablation'] = BlipAblation;
widgetRegistry['blip-architecture'] = BlipArchitecture;
widgetRegistry['blip-bootstrap'] = BlipBootstrap;
widgetRegistry['blip-boundary'] = BlipBoundary;
widgetRegistry['blip-contrastive'] = BlipContrastive;
widgetRegistry['blip-cover'] = BlipCover;
widgetRegistry['blip-filtering'] = BlipFiltering;
widgetRegistry['blip-language'] = BlipLanguage;
widgetRegistry['blip-matching'] = BlipMatching;
widgetRegistry['blip-noise'] = BlipNoise;
widgetRegistry['blip-results'] = BlipResults;
widgetRegistry['blip-sampling'] = BlipSampling;
widgetRegistry['blip-sharing'] = BlipSharing;
widgetRegistry['blip-video'] = BlipVideo;
