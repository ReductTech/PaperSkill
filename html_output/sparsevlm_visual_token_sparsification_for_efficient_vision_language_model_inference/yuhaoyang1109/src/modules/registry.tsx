import React from 'react';
import { SvCover } from './sv-cover';
import { SvBill } from './sv-m1-bill';
import { SvAgnostic } from './sv-m2-agnostic';
import { SvRaters } from './sv-m3-raters';
import { SvScore } from './sv-m4-score';
import { SvFlashV } from './sv-m4-flashv';
import { SvRank } from './sv-m5-rank';
import { SvRecycle } from './sv-m6-recycle';
import { SvTr } from './sv-m6-tr';
import { SvTower } from './sv-m7-tower';
import { SvOthers, SvResults, SvVersions } from './sv-m8';
import { SvFlops, SvTradeoff } from './sv-m9';
import { SvCodemap, SvVerdict } from './sv-m10-codemap';

// SparseVLM 精读的交互模块注册表。componentId 与 src/data/tutorial.ts 对应。
// 所有模块都是容器适配的：按卡片实际宽度绘制，不经整体缩放。

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {
  'sv-cover': SvCover,
  'sv-bill': SvBill,
  'sv-agnostic': SvAgnostic,
  'sv-raters': SvRaters,
  'sv-score': SvScore,
  'sv-flashv': SvFlashV,
  'sv-rank': SvRank,
  'sv-recycle': SvRecycle,
  'sv-tr': SvTr,
  'sv-tower': SvTower,
  'sv-results': SvResults,
  'sv-versions': SvVersions,
  'sv-others': SvOthers,
  'sv-flops': SvFlops,
  'sv-tradeoff': SvTradeoff,
  'sv-codemap': SvCodemap,
  'sv-verdict': SvVerdict,
};
