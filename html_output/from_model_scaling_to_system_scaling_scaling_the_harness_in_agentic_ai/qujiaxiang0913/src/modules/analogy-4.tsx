import React from 'react';
import type { WidgetProps } from './registry';
import { AnalogyView } from './analogy-view';

export const Analogy4: React.FC<WidgetProps> = (props) => <AnalogyView {...props} scene={4} />;
export default Analogy4;
