import React from 'react';
import { ScreenHost } from './ScreenHost';
import { mountS1 } from '../screens/s1.mount';
import html from '../screens/s1.html?raw';

// S1 screen — markup and behaviour ported from the single-file prototype.
export const S1Decompose: React.FC = () => <ScreenHost html={html} mount={mountS1} />;
