import React from 'react'; import type { WidgetProps } from './registry'; import { LifeCanvas } from './shared-kit';
export const HeroOld: React.FC<WidgetProps> = (props) => <LifeCanvas {...props} variant="old"/>;
