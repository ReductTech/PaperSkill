import React from 'react';
import { ScreenHost } from './ScreenHost';
import { mountS2 } from '../screens/s2.mount';
import html from '../screens/s2.html?raw';

// S2 — 构造：四个来源的标记词表 → 扫全库 → 吐出 query/gold/动作三元组。
export const S2Construction: React.FC = () => <ScreenHost html={html} mount={mountS2} />;
