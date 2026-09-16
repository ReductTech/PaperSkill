import React from 'react';
import type { WidgetProps } from './registry';
import { AnalogyView } from './analogy-view';

export const Analogy2: React.FC<WidgetProps> = (props) => <AnalogyView {...props} scene={2} />;
export default Analogy2;
