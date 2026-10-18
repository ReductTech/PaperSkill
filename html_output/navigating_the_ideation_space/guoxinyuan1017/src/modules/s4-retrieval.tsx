import React from 'react';
import { ScreenHost } from './ScreenHost';
import { mountS4 } from '../screens/s4.mount';
import html from '../screens/s4.html?raw';

// S4 screen — markup and behaviour ported from the single-file prototype.
export const S4Retrieval: React.FC = () => <ScreenHost html={html} mount={mountS4} />;
