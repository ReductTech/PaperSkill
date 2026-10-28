import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { AlbumScene } from './album-scene';
import { Clip01 } from './clip-01';
import { Clip02 } from './clip-02';
import { Clip03 } from './clip-03';
import { Clip04 } from './clip-04';
import { Clip05 } from './clip-05';
import { Clip06 } from './clip-06';
import { Clip07 } from './clip-07';
import { Clip07Update } from './clip-07-update';
import { Clip08 } from './clip-08';
import { Clip09 } from './clip-09';
import { Clip10 } from './clip-10';
import { ClipKit } from './clip-kit';
import { HeroNew } from './hero-new';
import { HeroOld } from './hero-old';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['album-scene'] = AlbumScene;
widgetRegistry['clip-01'] = Clip01;
widgetRegistry['clip-02'] = Clip02;
widgetRegistry['clip-03'] = Clip03;
widgetRegistry['clip-04'] = Clip04;
widgetRegistry['clip-05'] = Clip05;
widgetRegistry['clip-06'] = Clip06;
widgetRegistry['clip-07'] = Clip07;
widgetRegistry['clip-07-update'] = Clip07Update;
widgetRegistry['clip-08'] = Clip08;
widgetRegistry['clip-09'] = Clip09;
widgetRegistry['clip-10'] = Clip10;
widgetRegistry['clip-kit'] = ClipKit;
widgetRegistry['hero-new'] = HeroNew;
widgetRegistry['hero-old'] = HeroOld;
