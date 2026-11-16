import React from 'react';
import { Stage, colors, drawFrame, drawPhoto, drawBrush } from './SceneKit';
import type { WidgetProps } from './registry';

export const HeroNew: React.FC<WidgetProps> = () => <Stage height={350} animate label="合理纹理的教学示意，非模型输出" draw={(context, width, height, time) => {
  drawFrame(context, width, height);
  drawPhoto(context, 70, 25, 580, 290, 1);
  const x = 360 + Math.sin(time / 750) * 150;
  drawBrush(context, x, 205, -.45);
  context.strokeStyle = colors.green; context.lineWidth = 4; context.strokeRect(287, 145, 126, 98);
}} />;
