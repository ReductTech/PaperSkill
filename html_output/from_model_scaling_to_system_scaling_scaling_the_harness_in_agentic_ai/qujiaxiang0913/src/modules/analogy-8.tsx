import React from 'react';
import type { WidgetProps } from './registry';
import { AnalogyView } from './analogy-view';

export const Analogy8: React.FC<WidgetProps> = (props) => <AnalogyView {...props} scene={8} />;
export default Analogy8;
