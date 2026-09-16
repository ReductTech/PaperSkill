import React from 'react';
import type { WidgetProps } from './registry';
import { AnalogyView } from './analogy-view';

export const Analogy1: React.FC<WidgetProps> = (props) => <AnalogyView {...props} scene={1} />;
export default Analogy1;
