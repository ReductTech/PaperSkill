import React from 'react';
import { ScreenHost } from './ScreenHost';
import { mountS4 } from '../screens/s4.mount';
import html from '../screens/s4.html?raw';

// S4 — 评测：银标集的压量漏斗、判官校准、三条水位尺与 top-100 天花板。
export const S4Evaluation: React.FC = () => <ScreenHost html={html} mount={mountS4} />;
