import React from 'react';
import type { WidgetProps } from './registry';
import { AnalogyView } from './analogy-view';

export const Analogy9: React.FC<WidgetProps> = (props) => <AnalogyView {...props} scene={9} />;
export default Analogy9;
