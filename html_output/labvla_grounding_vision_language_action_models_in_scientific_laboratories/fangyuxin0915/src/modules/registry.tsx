import React from 'react';
import { HeroProblem, Placement, Fast, Insulation, Limitations } from './lab-scenes';
import { HeroSolution, Problems, Genesis, Recipe, Flow, Positioning } from './motion-scenes';
export interface WidgetProps {chapterId:string;moduleId:string;}
export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['hero-problem'] = HeroProblem;
widgetRegistry['hero-solution'] = HeroSolution;
widgetRegistry['problems'] = Problems;
widgetRegistry['placement'] = Placement;
widgetRegistry['genesis'] = Genesis;
widgetRegistry['recipe'] = Recipe;
widgetRegistry['fast'] = Fast;
widgetRegistry['flow'] = Flow;
widgetRegistry['insulation'] = Insulation;
widgetRegistry['positioning'] = Positioning;
widgetRegistry['limitations'] = Limitations;
