import React from 'react'; import type { WidgetProps } from './registry'; import { LifeCanvas } from './shared-kit';
export const LifeScene: React.FC<WidgetProps> = (props) => <LifeCanvas {...props}/>;
