import React from 'react';
import type { WidgetProps } from './registry';
import { AnalogyScene } from './studio-kit';
export const AnalogyCh7: React.FC<WidgetProps> = () => <AnalogyScene kind={7} labelText="铅笔标出速度方向" />;
export const AnalogyCh8: React.FC<WidgetProps> = () => <AnalogyScene kind={8} labelText="不同采样速率对齐同一物理秒" />;
