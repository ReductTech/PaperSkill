/* Refined 2026-10-22. Internal provenance; not rendered. */
import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Chip, Tag, Feedback, Timeline, Metric, SHAPE, stopRangeNav } from './ts-shared';

export const TsHeroOld: React.FC<WidgetProps> = () => <div className="ts-hero-mini"><div className="ts-hero-row"><span className="ts-dot blue"/><span>策略内样本</span><span className="ts-line"/><b>组归一化</b></div><div className="ts-hero-row"><span className="ts-dot red"/><span>时间区间搜索很大</span><span className="ts-line faint"/><span className="ts-muted">奖励不稳定</span></div><div className="ts-mini-bars"><i style={{height:'35%'}}/><i style={{height:'55%'}}/><i style={{height:'24%'}}/><i style={{height:'42%'}}/></div></div>;
