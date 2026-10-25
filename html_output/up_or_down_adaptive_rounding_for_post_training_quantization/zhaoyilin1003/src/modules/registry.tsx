import React from 'react';
import { Fp32Bar } from './fp32Bar';
import { Int4Bar } from './int4Bar';
import { BitSlider } from './bitSlider';
import { RoundChips } from './roundChips';
import { OutlierToggle } from './outlierToggle';
import { TransformToggle } from './transformToggle';
import { LayerStep } from './layerStep';
import { QuantRace } from './quantRace';
import { GridAnalog } from './gridAnalog';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['fp32-bar'] = Fp32Bar;
widgetRegistry['int4-bar'] = Int4Bar;
widgetRegistry['bit-slider'] = BitSlider;
widgetRegistry['round-chips'] = RoundChips;
widgetRegistry['outlier-toggle'] = OutlierToggle;
widgetRegistry['transform-toggle'] = TransformToggle;
widgetRegistry['layer-step'] = LayerStep;
widgetRegistry['quant-race'] = QuantRace;
widgetRegistry['grid-analog'] = GridAnalog;
