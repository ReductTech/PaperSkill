import React from 'react';
import { Continuum } from './museum-continuum';
import { MuseumCover } from './museum-cover';
import { Crank } from './museum-crank';
import { Definitions } from './museum-definitions';
import { Factory } from './museum-factory';
import { Future } from './museum-future';
import { Kitchen } from './museum-kitchen';
import { Origins } from './museum-origins';
import { Planning } from './museum-planning';
import { Review } from './museum-review';
import { Revolutions } from './museum-revolutions';
import { Scope } from './museum-scope';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['museum-continuum'] = Continuum;
widgetRegistry['museum-cover'] = MuseumCover;
widgetRegistry['museum-crank'] = Crank;
widgetRegistry['museum-definitions'] = Definitions;
widgetRegistry['museum-factory'] = Factory;
widgetRegistry['museum-future'] = Future;
widgetRegistry['museum-kitchen'] = Kitchen;
widgetRegistry['museum-origins'] = Origins;
widgetRegistry['museum-planning'] = Planning;
widgetRegistry['museum-review'] = Review;
widgetRegistry['museum-revolutions'] = Revolutions;
widgetRegistry['museum-scope'] = Scope;
