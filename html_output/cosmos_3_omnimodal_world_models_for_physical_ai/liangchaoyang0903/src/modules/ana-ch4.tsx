import React from 'react';
import type { WidgetProps } from './registry';
import { AnalogyScene } from './studio-kit';
export const AnalogyCh4: React.FC<WidgetProps> = () => <AnalogyScene kind={4} labelText="推理条件单向传给生成分支" />;
export const AnalogyCh5: React.FC<WidgetProps> = () => <AnalogyScene kind={5} labelText="在条件之间调焦" />;
export const AnalogyCh6: React.FC<WidgetProps> = () => <AnalogyScene kind={6} labelText="一格胶片逐步显影" />;
