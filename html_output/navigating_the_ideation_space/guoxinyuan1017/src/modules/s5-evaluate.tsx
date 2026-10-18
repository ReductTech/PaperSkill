import React from 'react';
import { ScreenHost } from './ScreenHost';
import { mountS5 } from '../screens/s5.mount';
import html from '../screens/s5.html?raw';

// S5 screen — markup and behaviour ported from the single-file prototype.
export const S5Evaluate: React.FC = () => <ScreenHost html={html} mount={mountS5} />;
