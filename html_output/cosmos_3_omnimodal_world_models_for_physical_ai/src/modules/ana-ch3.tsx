import React from 'react';
import type { WidgetProps } from './registry';
import { AnalogyScene } from './studio-kit';
export const AnalogyCh1: React.FC<WidgetProps> = () => <AnalogyScene kind={1} labelText="摄影机对准同一目标" />;
export const AnalogyCh2: React.FC<WidgetProps> = () => <AnalogyScene kind={2} labelText="五条素材归入同一 take" />;
export const AnalogyCh3: React.FC<WidgetProps> = () => <AnalogyScene kind={3} labelText="干净条件与加噪目标" />;
