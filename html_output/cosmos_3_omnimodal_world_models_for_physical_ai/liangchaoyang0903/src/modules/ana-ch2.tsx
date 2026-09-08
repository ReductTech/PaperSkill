import React from 'react';
import type { WidgetProps } from './registry';
import { AnalogyScene } from './studio-kit';
export const AnalogyCh1: React.FC<WidgetProps> = () => <AnalogyScene kind={1} labelText="摄影机对准同一目标" />;
export const AnalogyCh2: React.FC<WidgetProps> = () => <AnalogyScene kind={2} labelText="异构 token 映射到统一 hidden dimension" />;
export const AnalogyCh3: React.FC<WidgetProps> = () => <AnalogyScene kind={3} labelText="分镜卡决定条件或目标" />;
