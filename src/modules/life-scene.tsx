import React from 'react';
import { Stage, colors, drawPhoto, drawBrush, drawFrame } from './SceneKit';
import type { WidgetProps } from './registry';

function magnifier(context: CanvasRenderingContext2D, x: number, y: number) {
  context.strokeStyle = colors.blue; context.lineWidth = 5;
  context.beginPath(); context.arc(x, y, 20, 0, Math.PI * 2); context.moveTo(x + 15, y + 15); context.lineTo(x + 36, y + 36); context.stroke();
}

export const LifeScene: React.FC<WidgetProps> = ({ chapterId }) => {
  const chapter = Number(chapterId.replace(/\D/g, '')) || 1;
  return <Stage height={180} animate label="旧照片修复类比，非模型输出" draw={(context, width, height, time) => {
    drawFrame(context, width, height);
    const phase = (time % 3600) / 3600;
    const wave = Math.sin(phase * Math.PI * 2);
    context.fillStyle = colors.light; context.fillRect(120, 151, 470, 6);
    drawPhoto(context, 220, 15, 265, 145, .8);
    let x = 350 + wave * 77;
    let y = 96;
    if (chapter === 2) { x = 226; y = 52 + (wave + 1) * 35; }
    if (chapter === 3) { x = 323 + wave * 25; y = 64 - Math.abs(wave) * 21; }
    if (chapter === 4 || chapter === 10) { magnifier(context, 355 + wave * 48, 83 + Math.cos(phase * Math.PI * 2) * 12); return; }
    if (chapter === 5) { x = 290 + wave * 38; y = 100; }
    if (chapter === 6) {
      context.strokeStyle = colors.support; context.lineWidth = 4;
      context.beginPath(); context.moveTo(225 + (wave + 1) * 125, 19); context.lineTo(225 + (wave + 1) * 125, 156); context.stroke(); return;
    }
    if (chapter === 7) { x = 350 + Math.cos(phase * Math.PI * 2) * 22; y = 112 + wave * 12; }
    if (chapter === 8) { x = 476; y = 96 + wave * 7; }
    if (chapter === 9) { x = 255 + wave * 15; y = 133; }
    drawBrush(context, x, y, -.5 + wave * .15);
  }} />;
};
