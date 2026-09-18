import React from 'react';
import type { WidgetProps } from './registry';
import { AnalogyView } from './analogy-view';

export const Analogy3: React.FC<WidgetProps> = (props) => <AnalogyView {...props} scene={3} />;
export default Analogy3;
