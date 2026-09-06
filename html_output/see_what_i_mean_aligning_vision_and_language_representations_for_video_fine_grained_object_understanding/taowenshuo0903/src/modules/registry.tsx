import React from 'react';
import { PhotoAnalogy } from './analogy';
import { HeroFocus } from './hero';
import { Mod1Focus, Mod2Words } from './mods1';
import { Mod4Spread, Mod4Agg, Mod5Refer } from './mods2';
import { Mod6Infer, Mod7Loss, Mod8Arch } from './mods3';
import { Mod9Ablate, Mod10Race } from './mods4';

// Widget registry: maps a `componentId` (referenced from src/data/tutorial.ts) to a
// React component. The generator ADDS entries here for every paper-specific canvas
// widget (hero sides, analogy animations, and interactive modules). A missing id
// renders a graceful placeholder, so the app never crashes on an unfinished id.

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['photo-analogy'] = PhotoAnalogy;
widgetRegistry['hero-focus'] = HeroFocus;
widgetRegistry['mod1-focus'] = Mod1Focus;
widgetRegistry['mod2-words'] = Mod2Words;
widgetRegistry['mod4-spread'] = Mod4Spread;
widgetRegistry['mod4-agg'] = Mod4Agg;
widgetRegistry['mod5-refer'] = Mod5Refer;
widgetRegistry['mod6-infer'] = Mod6Infer;
widgetRegistry['mod7-loss'] = Mod7Loss;
widgetRegistry['mod8-arch'] = Mod8Arch;
widgetRegistry['mod9-ablate'] = Mod9Ablate;
widgetRegistry['mod10-race'] = Mod10Race;
