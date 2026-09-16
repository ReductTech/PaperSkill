import React from 'react';
import type { WidgetProps } from './registry';
import { AnalogyView } from './analogy-view';

export const Analogy6: React.FC<WidgetProps> = (props) => <AnalogyView {...props} scene={6} />;
export default Analogy6;
