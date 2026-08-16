import React from 'react';
import type { WidgetProps } from './registry';
import { AnalogyScene } from './studio-kit';
export const AnalogyCh7: React.FC<WidgetProps> = () => <AnalogyScene kind={7} labelText="直线路径流匹配的速度方向" />;
export const AnalogyCh8: React.FC<WidgetProps> = () => <AnalogyScene kind={8} labelText="三条轨道对齐同一秒" />;
