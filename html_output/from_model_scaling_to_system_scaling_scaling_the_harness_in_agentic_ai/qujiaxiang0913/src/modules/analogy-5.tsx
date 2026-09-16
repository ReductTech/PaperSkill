import React from 'react';
import type { WidgetProps } from './registry';
import { AnalogyView } from './analogy-view';

export const Analogy5: React.FC<WidgetProps> = (props) => <AnalogyView {...props} scene={5} />;
export default Analogy5;
