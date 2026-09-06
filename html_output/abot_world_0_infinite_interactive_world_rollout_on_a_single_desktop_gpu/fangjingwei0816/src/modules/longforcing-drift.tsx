import React from 'react'; import type { WidgetProps } from './registry'; import { WorldWidget } from './shared-kit';
export const LongForcingDrift: React.FC<WidgetProps> = (props) => <WorldWidget {...props} kind="drift"/>;
