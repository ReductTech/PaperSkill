import React from 'react';
import { An2 } from './an2';
import { An6 } from './an6';
import { An8 } from './an8';
import { An9 } from './an9';
import { An10 } from './an10';
import { An11 } from './an11';
import { HeroOld } from './heroOld';
import { HeroNew } from './heroNew';
import { M1b } from './m1b';
import { M2a } from './m2a';
import { RlPipeline } from './rlPipeline';
import { M6a } from './m6a';
import { M8a } from './m8a';
import { M9a } from './m9a';
import { M9b } from './m9b';
import { M10a } from './m10a';
import { ScaleRace } from './scaleRace';
import { M10b } from './m10b';
import { EndToEnd } from './endToEnd';

// Widget registry: maps a `componentId` (referenced from src/data/tutorial.ts) to a
// React component. A missing id renders a graceful placeholder, so the app never
// crashes on an unfinished id.

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

// Hero 两侧对比：旧的断路 vs ClawGUI 打通后的一条路
widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['hero-new'] = HeroNew;

// 每章的生活化类比动画（按章取材，不强行统一到单一主线）
widgetRegistry['an2'] = An2; // 第 1 章 · 断了三处的路
widgetRegistry['an6'] = An6; // 第 2 章 · 炖汤时尝咸淡
widgetRegistry['an8'] = An8; // 第 3 章 · 两台没对齐的秤
widgetRegistry['an9'] = An9; // 第 4 章 · 常去那家店的「老样子」
widgetRegistry['an10'] = An10; // 第 5 章 · 练过的小个子跑赢大块头
widgetRegistry['an11'] = An11; // 第 6 章 · 三处断口都架上了桥

// 各章主动交互模块（共 10 个）
widgetRegistry['m1b'] = M1b; // 1.1 GUI 智能体单步循环
widgetRegistry['m2a'] = M2a; // 1.2 三道裂缝地图
widgetRegistry['rl-pipeline'] = RlPipeline; // 2.1 训练闭环
widgetRegistry['m6a'] = M6a; // 2.2 两种奖励设置
widgetRegistry['m8a'] = M8a; // 3.1 配置漂移 ⇄ 配置锁定
widgetRegistry['m10b'] = M10b; // 3.2 复现率 46/48
widgetRegistry['m9a'] = M9a; // 4.1 CLI / GUI / 混合链路
widgetRegistry['m9b'] = M9b; // 4.2 一句话下达到真机
widgetRegistry['m10a'] = M10a; // 5.1 奖励消融 + 同规模对比
widgetRegistry['scale-race'] = ScaleRace; // 5.2 跨规模成绩赛跑
widgetRegistry['end-to-end'] = EndToEnd; // 6.1 走完训练 → 评测 → 部署
