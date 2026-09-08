import React from 'react';
import { HeroOld } from './heroOld';
import { HeroNew } from './heroNew';
import { An1 } from './an1';
import { An4 } from './an4';
import { An5 } from './an5';
import { An6 } from './an6';
import { An7 } from './an7';
import { M11 } from './m11';
import { M12 } from './m12';
import { M22Img } from './m22img';
import { M21 } from './m21';
import { M43Predict } from './m43predict';
import { M42 } from './m42';
import { M43 } from './m43';
import { M1A } from './m1a';
import { M44Text } from './m44sys';
import { M42View } from './m42view';
import { M51Flow } from './m51flow';
import { M52Loss } from './m52loss';
import { M61Abl } from './m61abl';
import { M62Feat } from './m62feat';
import { M63Depth } from './m63depth';
import { M64Wh } from './m64wh';

// Widget registry: maps a `componentId` (referenced from src/data/tutorial.ts) to a
// React component.

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

// Hero
widgetRegistry['hero-old-canvas'] = HeroOld;
widgetRegistry['hero-new-canvas'] = HeroNew;

// Analogy animations
widgetRegistry['an1'] = An1;
widgetRegistry['an4'] = An4;
widgetRegistry['an5'] = An5;
widgetRegistry['an6'] = An6;
widgetRegistry['an7'] = An7;

// Interactive modules
widgetRegistry['m-1-1'] = M1A;   // 识别 vs 空间感知
widgetRegistry['m-2-1'] = M11;   // DINO/iBOT 蒸馏
widgetRegistry['m-2-2'] = M22Img; // 完整算法闭环总览（架构图）
widgetRegistry['m-3-1'] = M21;   // 签名① 掩码对比
widgetRegistry['m-4-1'] = M44Text; // 系统三件套（表格）
widgetRegistry['m-4-2'] = M42View; // 一张图的旅程：multi-view 增强
widgetRegistry['m-4-3'] = M43Predict; // ① Predict：边界场表示 + 分类化（静态展开）
widgetRegistry['m-4-4'] = M42;   // ② Decode+Vote：角点投票
widgetRegistry['m-4-5'] = M43;   // ③ Validate+Re-render：NFA
widgetRegistry['m-5-1'] = M51Flow; // 完整算法闭环（总流程梳理）
widgetRegistry['m-5-2'] = M52Loss; // 训练总损失 L
widgetRegistry['m-6-1'] = M61Abl;  // 因果消融（表格）
widgetRegistry['m-6-2'] = M62Feat; // 特征对比（静态）
widgetRegistry['m-6-3'] = M63Depth; // LingBot-Depth 2.0（静态）
widgetRegistry['m-6-4'] = M64Wh;   // WHERE/WHAT/HOW 复盘（静态）
