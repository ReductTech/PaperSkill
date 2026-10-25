import React from 'react';
import { ScreenHost } from './ScreenHost';
import { mountS0 } from '../screens/s0.mount';
import html from '../screens/s0.html?raw';

// S0 — 论文档案、三个动作、三个数字（封面屏）。
export const S0Moves: React.FC = () => <ScreenHost html={html} mount={mountS0} />;
