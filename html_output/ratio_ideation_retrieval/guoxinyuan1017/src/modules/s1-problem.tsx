import React from 'react';
import { ScreenHost } from './ScreenHost';
import { mountS1 } from '../screens/s1.mount';
import html from '../screens/s1.html?raw';

// S1 — 问题定义：给定 q 与动作 r，从共享池里排出最符合 r 的句子。
export const S1Problem: React.FC = () => <ScreenHost html={html} mount={mountS1} />;
