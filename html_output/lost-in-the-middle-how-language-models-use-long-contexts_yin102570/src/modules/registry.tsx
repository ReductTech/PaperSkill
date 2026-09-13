import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { LitmKeyPosition } from './LitmKeyPosition';
import { LitmPositionCurve } from './LitmPositionCurve';
import { LitmDocOrder } from './LitmDocOrder';
import { LitmRagWindow } from './LitmRagWindow';
import { LitmQueryAware } from './LitmQueryAware';
import { LitmMethodsCompare } from './LitmMethodsCompare';
import { LitmTasks } from './LitmTasks';
import { LitmContextLength } from './LitmContextLength';

// Widget registry: maps a `componentId` (referenced from src/data/tutorial.ts) to a
// React component. Every paper-specific canvas widget is registered here.
export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

// Example kept so the scaffold runs out-of-the-box. Replace/extend as needed.
widgetRegistry['example-slider'] = ExampleSlider;

// Lost in the Middle — paper-specific widgets
widgetRegistry['litm-key-position'] = LitmKeyPosition;
widgetRegistry['litm-position-curve'] = LitmPositionCurve;
widgetRegistry['litm-doc-order'] = LitmDocOrder;
widgetRegistry['litm-rag-window'] = LitmRagWindow;
widgetRegistry['litm-query-aware'] = LitmQueryAware;
widgetRegistry['litm-methods-compare'] = LitmMethodsCompare;
widgetRegistry['litm-tasks'] = LitmTasks;
widgetRegistry['litm-context-length'] = LitmContextLength;
