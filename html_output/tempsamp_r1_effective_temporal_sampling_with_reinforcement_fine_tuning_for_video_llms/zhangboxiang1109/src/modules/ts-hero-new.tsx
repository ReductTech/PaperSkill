/* Refined 2026-10-22. Internal provenance; not rendered. */
import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Chip, Tag, Feedback, Timeline, Metric, SHAPE, stopRangeNav } from './ts-shared';

export const TsHeroNew: React.FC<WidgetProps> = () => <div className="ts-hero-mini"><div className="ts-hero-row"><span className="ts-dot blue"/><span>策略候选</span><span className="ts-plus">+</span><span className="ts-dot green"/><span>真值指导</span></div><div className="ts-hero-row"><span className="ts-arrow">↓</span><b>非线性奖励整形</b><span className="ts-arrow">→</span><b className="ts-good">更稳的优势信号</b></div><div className="ts-mini-bars good"><i style={{height:'48%'}}/><i style={{height:'42%'}}/><i style={{height:'51%'}}/><i style={{height:'46%'}}/></div></div>;
