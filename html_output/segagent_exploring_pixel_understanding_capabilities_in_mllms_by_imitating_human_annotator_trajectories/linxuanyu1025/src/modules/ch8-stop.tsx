import React from 'react';
import { SegAgentLab } from './segagent-core';
import type { WidgetProps } from './registry';
export const Ch8Stop: React.FC<WidgetProps> = (props) => <SegAgentLab {...props} mode="ch8-stop" />;
