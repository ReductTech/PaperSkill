import React from 'react';
import { ScreenHost } from './ScreenHost';
import { mountS5 } from '../screens/s5.mount';
import html from '../screens/s5.html?raw';

// S5 — 人类盲评：并排两列 top-10、三色票条、两本账、跨论文一句注。
export const S5Human: React.FC = () => <ScreenHost html={html} mount={mountS5} />;
