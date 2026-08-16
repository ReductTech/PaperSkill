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
import { M31 } from './m31';
import { M41B } from './m41b';
import { M41 } from './m41';
import { M42 } from './m42';
import { M43 } from './m43';
import { M51 } from './m51';
import { M52 } from './m52';
import { M61 } from './m61';
import { M62 } from './m62';
import { M72 } from './m72';
import { M1A } from './m1a';
import { M63Mask } from './m63mask';
import { M7A } from './m7a';
import { M44Sys } from './m44sys';

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
widgetRegistry['m-4-1'] = M44Sys; // 系统三件套
widgetRegistry['m-4-2'] = M31;   // 完整算法流程（12 步闭环）
widgetRegistry['m-5-1'] = M41B;  // 边界场预测与分类化（目标生成五步）
widgetRegistry['m-5-2'] = M42;   // 签名② 角点投票
widgetRegistry['m-5-3'] = M43;   // 签名③ NFA
widgetRegistry['m-6-1'] = M63Mask; // 边界强制掩码 M⁺ = M ∪ B
widgetRegistry['m-6-2'] = M41;   // 三路监督
widgetRegistry['m-6-3'] = M52;   // 双重作业
widgetRegistry['m-6-4'] = M7A;   // 三个关键设计依据
widgetRegistry['m-7-1'] = M51;   // 因果消融
widgetRegistry['m-7-2'] = M62;   // 特征对比
widgetRegistry['m-7-3'] = M72;   // LingBot-Depth 2.0
widgetRegistry['m-7-4'] = M61;   // WHERE/WHAT/HOW 复盘
