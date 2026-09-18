import React from 'react';
import {HeroOld,HeroNew,Analogy1,Analogy2,Analogy3,Analogy4,Analogy5,Analogy6,Analogy7,Analogy8,Analogy9,Analogy10,Clip1Main,ClipDataMain,Clip2Main,Clip3Main,Clip4Main,Clip5Main,ClipPromptEnsemble,Clip6Main,Clip7Main,Clip8Main,Clip8Variant,Clip9Main,Clip10Main,ClipLimitations} from './clipWidgets';
export interface WidgetProps {chapterId:string;moduleId:string}
export const widgetRegistry:Record<string,React.FC<WidgetProps>>={};
widgetRegistry['clip-hero-old']=HeroOld;widgetRegistry['clip-hero-new']=HeroNew;
widgetRegistry['clip-analogy-1']=Analogy1;widgetRegistry['clip-analogy-2']=Analogy2;widgetRegistry['clip-analogy-3']=Analogy3;widgetRegistry['clip-analogy-4']=Analogy4;widgetRegistry['clip-analogy-5']=Analogy5;widgetRegistry['clip-analogy-6']=Analogy6;widgetRegistry['clip-analogy-7']=Analogy7;widgetRegistry['clip-analogy-8']=Analogy8;widgetRegistry['clip-analogy-9']=Analogy9;widgetRegistry['clip-analogy-10']=Analogy10;
widgetRegistry['clip-1-main']=Clip1Main;widgetRegistry['clip-2-main']=Clip2Main;widgetRegistry['clip-3-main']=Clip3Main;widgetRegistry['clip-4-main']=Clip4Main;widgetRegistry['clip-5-main']=Clip5Main;widgetRegistry['clip-6-main']=Clip6Main;widgetRegistry['clip-7-main']=Clip7Main;widgetRegistry['clip-8-main']=Clip8Main;widgetRegistry['clip-8-variant']=Clip8Variant;widgetRegistry['clip-9-main']=Clip9Main;widgetRegistry['clip-10-main']=Clip10Main;
widgetRegistry['clip-data-main']=ClipDataMain;widgetRegistry['clip-prompt-ensemble']=ClipPromptEnsemble;widgetRegistry['clip-limitations']=ClipLimitations;
