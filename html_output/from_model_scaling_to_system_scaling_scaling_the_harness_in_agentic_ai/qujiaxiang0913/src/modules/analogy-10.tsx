import React from 'react';
import type { WidgetProps } from './registry';
import { AnalogyView } from './analogy-view';

export const Analogy10: React.FC<WidgetProps> = (props) => <AnalogyView {...props} scene={10} />;
export default Analogy10;
