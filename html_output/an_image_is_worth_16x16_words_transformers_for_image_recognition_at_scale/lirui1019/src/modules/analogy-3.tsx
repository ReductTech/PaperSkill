import React from 'react';
import { C, Stage, clearScene, drawBird, line, pill } from './BirdKit';

export function Analogy3() {
  return <Stage width={560} height={292}
    label="静态布局对照：两页使用完全相同的四块照片。布局 A 中鸟嘴在右上、翅膀在左下；布局 B 中两块互换。只有内容清单相同，内容与地址的配对不同。"
    render={(c, w, h) => {
      clearScene(c, w, h);
      const photo = document.createElement('canvas');
      photo.width = 224; photo.height = 224;
      const context = photo.getContext('2d');
      if (context) drawBird(context, 0, 0, 224);
      c.textAlign = 'center'; c.font = '600 18px sans-serif'; c.fillStyle = C.ink;
      c.fillText('同样四块照片，两种空间布局', 280, 25);
      [false, true].forEach((swapped, panel) => {
        const x = 40 + panel * 286, y = 66, side = 80;
        pill(c, x - 8, y - 8, 176, 176, '#fffefa');
        c.font = '600 16px sans-serif'; c.fillStyle = C.blue;
        c.fillText(`相册布局 ${panel === 0 ? 'A' : 'B'}`, x + 80, 50);
        for (let cell = 0; cell < 4; cell++) {
          const source = swapped && (cell === 1 || cell === 2) ? 3 - cell : cell;
          const px = x + (cell % 2) * side, py = y + Math.floor(cell / 2) * side;
          c.drawImage(photo, (source % 2) * 112, Math.floor(source / 2) * 112, 112, 112, px, py, side, side);
          c.strokeStyle = cell === 1 || cell === 2 ? C.orange : C.line;
          c.lineWidth = cell === 1 || cell === 2 ? 3 : 1;
          c.strokeRect(px, py, side, side);
          pill(c, px + 3, py + 3, 34, 19, '#fffefa');
          c.font = '12px sans-serif'; c.fillStyle = C.ink;
          c.fillText(['左上', '右上', '左下', '右下'][cell], px + 20, py + 17);
        }
        c.font = '600 15px sans-serif'; c.fillStyle = C.support;
        c.fillText(`鸟嘴：${swapped ? '左下' : '右上'}`, x + 80, 250);
        c.fillText(`翅膀：${swapped ? '右上' : '左下'}`, x + 80, 272);
      });
      line(c, 280, 66, 280, 226, C.line, 1);
      c.textAlign = 'left';
    }} />;
}
