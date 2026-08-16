import React from 'react'; import type { WidgetProps } from './registry'; import { WorldWidget } from './shared-kit';
export const ClosedLoopStress: React.FC<WidgetProps> = (props) => <WorldWidget {...props} kind="stress"/>;
