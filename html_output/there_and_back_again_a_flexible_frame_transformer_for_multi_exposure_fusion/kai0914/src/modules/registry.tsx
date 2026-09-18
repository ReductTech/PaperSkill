import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { FrameCountSlider } from './frameCountSlider';
import { RssmCycle } from './rssmCycle';
import { DcnAlign } from './dcnAlign';
import { ParadoxToggle } from './paradoxToggle';
import { ExtremityGate } from './extremityGate';
import { AffnAffine } from './affnAffine';
import { FusionOrderPicker } from './fusionOrderPicker';
import { DataFilter } from './dataFilter';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['frame-count-slider'] = FrameCountSlider;
widgetRegistry['rssm-cycle'] = RssmCycle;
widgetRegistry['dcn-align'] = DcnAlign;
widgetRegistry['paradox-toggle'] = ParadoxToggle;
widgetRegistry['extremity-gate'] = ExtremityGate;
widgetRegistry['affn-affine'] = AffnAffine;
widgetRegistry['fusion-order-picker'] = FusionOrderPicker;
widgetRegistry['data-filter'] = DataFilter;