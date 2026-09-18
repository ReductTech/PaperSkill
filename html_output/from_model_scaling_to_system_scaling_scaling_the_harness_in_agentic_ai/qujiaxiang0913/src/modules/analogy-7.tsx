import React from 'react';
import type { WidgetProps } from './registry';
import { AnalogyView } from './analogy-view';

export const Analogy7: React.FC<WidgetProps> = (props) => <AnalogyView {...props} scene={7} />;
export default Analogy7;
