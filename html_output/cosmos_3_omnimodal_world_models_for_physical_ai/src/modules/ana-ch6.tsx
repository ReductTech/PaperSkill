import React from 'react';
import type { WidgetProps } from './registry';
import { AnalogyScene } from './studio-kit';
export const AnalogyCh4: React.FC<WidgetProps> = () => <AnalogyScene kind={4} labelText="聚光灯只向舞台照" />;
export const AnalogyCh5: React.FC<WidgetProps> = () => <AnalogyScene kind={5} labelText="在条件之间调焦" />;
export const AnalogyCh6: React.FC<WidgetProps> = () => <AnalogyScene kind={6} labelText="DM latent 迭代恢复" />;
