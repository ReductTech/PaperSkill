import React from 'react';
import { ScreenHost } from './ScreenHost';
import { mountS2 } from '../screens/s2.mount';
import html from '../screens/s2.html?raw';

// S2 screen — markup and behaviour ported from the single-file prototype.
export const S2Transition: React.FC = () => <ScreenHost html={html} mount={mountS2} />;
