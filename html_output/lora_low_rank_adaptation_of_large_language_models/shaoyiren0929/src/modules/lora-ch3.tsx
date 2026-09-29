import React from 'react';
import type { WidgetProps } from './registry';
import { LabWidget } from './lab-shared';
export const LoraCh3: React.FC<WidgetProps> = (props) => <LabWidget {...props} mode={3} />;
