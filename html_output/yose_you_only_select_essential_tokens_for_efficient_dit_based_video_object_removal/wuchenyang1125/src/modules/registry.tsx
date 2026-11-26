import React from 'react';
import { AblationDesk } from './ablation-desk';
import { BviTray } from './bvi-tray';
import { CostFixed } from './cost-fixed';
import { CoverFull } from './cover-full';
import { CoverSelect } from './cover-select';
import { FilmDevelop } from './film-develop';
import { LimitRepair } from './limit-repair';
import { MaskSpeed } from './mask-speed';
import { PhotoSticker } from './photo-sticker';
import { PhotoTiles } from './photo-tiles';
import { ResultBars } from './result-bars';
import { SeamBlend } from './seam-blend';
import { SwatchSim } from './swatch-sim';
import { TileAttention } from './tile-attention';
import { TrainKnobs } from './train-knobs';
import { VaceKeep } from './vace-keep';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['ablation-desk'] = AblationDesk;
widgetRegistry['bvi-tray'] = BviTray;
widgetRegistry['cost-fixed'] = CostFixed;
widgetRegistry['cover-full'] = CoverFull;
widgetRegistry['cover-select'] = CoverSelect;
widgetRegistry['film-develop'] = FilmDevelop;
widgetRegistry['limit-repair'] = LimitRepair;
widgetRegistry['mask-speed'] = MaskSpeed;
widgetRegistry['photo-sticker'] = PhotoSticker;
widgetRegistry['photo-tiles'] = PhotoTiles;
widgetRegistry['result-bars'] = ResultBars;
widgetRegistry['seam-blend'] = SeamBlend;
widgetRegistry['swatch-sim'] = SwatchSim;
widgetRegistry['tile-attention'] = TileAttention;
widgetRegistry['train-knobs'] = TrainKnobs;
widgetRegistry['vace-keep'] = VaceKeep;
