import React from 'react';
import { C, Stage, clearScene, drawPhoto, line, pill } from './BirdKit';

export function Analogy4() {
  return <Stage width={560} height={288}
    label="机制类比：翅膀带着‘哪些线索能补充我的形态？’这个问题参考照片。翅膀纹理和鸟嘴轮廓是候选线索，背景是否有用也取决于问题。参考比例由匹配得到，而非预先规定。"
    render={(c, w, h) => {
      clearScene(c, w, h);
      pill(c, 12, 10, 536, 46, '#fffefa');
      c.font = '600 17px sans-serif'; c.fillStyle = C.ink;
      c.fillText('翅膀在问：哪些线索能补充我的形态？', 26, 39);
      drawPhoto(c, 24, 80, 170);
      const wing = {x: 24 + 100 / 224 * 170, y: 80 + 133 / 224 * 170};
      c.strokeStyle = C.orange; c.lineWidth = 3;
      c.strokeRect(wing.x - 15, wing.y - 15, 30, 30);
      const candidates = [
        { label: '翅膀纹理', detail: '局部细节', y: 93, color: C.blue, width: 4 },
        { label: '鸟嘴轮廓', detail: '其他部位', y: 159, color: C.blue, width: 3 },
        { label: '背景叶片', detail: '是否有关？', y: 225, color: C.muted, width: 1 },
      ];
      candidates.forEach(item => {
        c.save(); if (item.width === 1) c.setLineDash([5, 5]);
        line(c, wing.x + 16, wing.y, 304, item.y, item.color, item.width);
        c.restore();
        pill(c, 304, item.y - 25, 232, 51, '#fffefa');
        c.fillStyle = C.ink; c.font = '600 17px sans-serif';
        c.fillText(item.label, 317, item.y - 1);
        c.fillStyle = C.muted; c.font = '14px sans-serif';
        c.fillText(item.detail, 422, item.y + 1);
      });
      c.font = '15px sans-serif'; c.fillStyle = C.support;
      c.fillText('橙框：提问的图块', 24, 275);
      c.fillStyle = C.muted; c.fillText('线粗为类比，不是实测权重', 307, 275);
    }} />;
}
