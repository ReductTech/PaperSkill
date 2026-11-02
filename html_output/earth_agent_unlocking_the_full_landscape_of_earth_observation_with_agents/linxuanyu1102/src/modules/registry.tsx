import React from 'react';
import { EarthCoverNew } from './earth-cover-new';
import { EarthCoverOld } from './earth-cover-old';
import { EarthScene01 } from './earth-scene-01';
import { EarthScene02 } from './earth-scene-02';
import { EarthScene03 } from './earth-scene-03';
import { EarthScene04 } from './earth-scene-04';
import { EarthScene05 } from './earth-scene-05';
import { EarthScene06 } from './earth-scene-06';
import { EarthScene07 } from './earth-scene-07';
import { EarthScene08 } from './earth-scene-08';
import { EarthScene09 } from './earth-scene-09';
import { EarthScene10 } from './earth-scene-10';
import { EarthScene11 } from './earth-scene-11';
import { EarthScene12 } from './earth-scene-12';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['earth-cover-new'] = EarthCoverNew;
widgetRegistry['earth-cover-old'] = EarthCoverOld;
widgetRegistry['earth-scene-01'] = EarthScene01;
widgetRegistry['earth-scene-02'] = EarthScene02;
widgetRegistry['earth-scene-03'] = EarthScene03;
widgetRegistry['earth-scene-04'] = EarthScene04;
widgetRegistry['earth-scene-05'] = EarthScene05;
widgetRegistry['earth-scene-06'] = EarthScene06;
widgetRegistry['earth-scene-07'] = EarthScene07;
widgetRegistry['earth-scene-08'] = EarthScene08;
widgetRegistry['earth-scene-09'] = EarthScene09;
widgetRegistry['earth-scene-10'] = EarthScene10;
widgetRegistry['earth-scene-11'] = EarthScene11;
widgetRegistry['earth-scene-12'] = EarthScene12;
