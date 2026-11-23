import React from 'react';
import { Blip01 } from './blip-01';
import { Blip02 } from './blip-02';
import { Blip03 } from './blip-03';
import { Blip04 } from './blip-04';
import { Blip05 } from './blip-05';
import { Blip06 } from './blip-06';
import { Blip07 } from './blip-07';
import { Blip08 } from './blip-08';
import { Blip09 } from './blip-09';
import { Blip10 } from './blip-10';
import { Blip11 } from './blip-11';
import { Blip12 } from './blip-12';
import { Blip13 } from './blip-13';
import { Blip14 } from './blip-14';
import { BlipCover } from './blip-cover';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['blip-01'] = Blip01;
widgetRegistry['blip-02'] = Blip02;
widgetRegistry['blip-03'] = Blip03;
widgetRegistry['blip-04'] = Blip04;
widgetRegistry['blip-05'] = Blip05;
widgetRegistry['blip-06'] = Blip06;
widgetRegistry['blip-07'] = Blip07;
widgetRegistry['blip-08'] = Blip08;
widgetRegistry['blip-09'] = Blip09;
widgetRegistry['blip-10'] = Blip10;
widgetRegistry['blip-11'] = Blip11;
widgetRegistry['blip-12'] = Blip12;
widgetRegistry['blip-13'] = Blip13;
widgetRegistry['blip-14'] = Blip14;
widgetRegistry['blip-cover'] = BlipCover;
