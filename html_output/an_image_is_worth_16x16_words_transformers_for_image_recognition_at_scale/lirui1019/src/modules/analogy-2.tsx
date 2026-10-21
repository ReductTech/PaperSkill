import React from 'react';
import { C, Stage, clearScene, drawPhoto, line, pill } from './BirdKit';

const records = [
  { label: '鸟嘴', x: 184, y: 88, values: ['0.8', '−0.2', '0.1', '0.6', '−0.4', '0.3'] },
  { label: '翅膀', x: 96, y: 128, values: ['−0.3', '0.7', '0.5', '−0.1', '0.2', '0.9'] },
];

export function Analogy2() {
  const selected = 0;
  const record = records[selected];
  return <div style={{ width: '100%', minWidth: 0 }}>
    <Stage width={560} height={250}
      label={`正在记录${record.label}：${record.values.join('、')}。鸟嘴与翅膀都用同一套规则，均得到六格记录；数值仅为教学示意。`}
      render={(c, w, h) => {
        clearScene(c, w, h);
        c.font = '600 18px sans-serif'; c.fillStyle = C.ink;
        c.fillText(`观察：${record.label}图块`, 20, 29);
        drawPhoto(c, 26, 58, 144);
        c.strokeStyle = C.orange; c.lineWidth = 3;
        c.strokeRect(26 + record.x * 144 / 224, 58 + record.y * 144 / 224, 16 * 144 / 224, 16 * 144 / 224);
        c.font = '15px sans-serif'; c.fillStyle = C.muted;
        c.fillText('内容不同', 67, 232);

        // One notebook, with matching columns for both observations.
        pill(c, 211, 9, 336, 232, '#e0e8d8');
        pill(c, 218, 15, 322, 220, '#fffefa');
        c.font = '600 17px sans-serif'; c.fillStyle = C.blue;
        c.fillText('同一套记录规则（可学习）', 237, 40);
        for (let i = 0; i < 6; i++) {
          c.font = '13px sans-serif'; c.fillStyle = C.muted;
          c.textAlign = 'center'; c.fillText(`第${i + 1}格`, 268 + i * 45, 65);
        }
        records.forEach((row, index) => {
          const y = 94 + index * 63;
          c.textAlign = 'left'; c.font = '600 15px sans-serif';
          c.fillStyle = selected === index ? C.support : C.muted;
          c.fillText(`${row.label}记录`, 236, y - 9);
          row.values.forEach((value, i) => {
            const x = 248 + i * 45;
            pill(c, x, y, 40, 34, selected === index ? '#fce4d6' : '#eef2e9');
            c.textAlign = 'center'; c.font = '16px sans-serif';
            c.fillStyle = selected === index ? C.ink : C.muted;
            c.fillText(value, x + 20, y + 23);
          });
          if (selected === index) {
            c.strokeStyle = C.orange; c.lineWidth = 2;
            c.strokeRect(244, y - 3, 273, 40);
          }
        });
        line(c, 248, 211, 513, 211, C.blue, 1.5);
        line(c, 248, 206, 248, 211, C.blue, 1.5);
        line(c, 513, 206, 513, 211, C.blue, 1.5);
        c.textAlign = 'center'; c.font = '600 15px sans-serif'; c.fillStyle = C.blue;
        c.fillText('格数相同，记录值不同', 380, 230);
        c.textAlign = 'left';
      }} />
  </div>;
}
