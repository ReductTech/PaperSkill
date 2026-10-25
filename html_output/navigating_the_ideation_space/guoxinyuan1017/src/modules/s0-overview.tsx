import React from 'react';
import { ScreenHost } from './ScreenHost';
import { mountS0 } from '../screens/s0.mount';
import html from '../screens/s0.html?raw';

// S0 screen — markup and behaviour ported from the single-file prototype.
export const S0Overview: React.FC = () => <ScreenHost html={html} mount={mountS0} />;
