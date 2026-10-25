import React, { useState } from 'react';
import { C, Chips, Stage, clearScene, drawPhoto, line, pill } from './BirdKit';

// Mechanism drawings only: no trained convolution or attention values are shown.
export function HeroComparison({ method }: { method: 'cnn' | 'vit' }) {
  const [region, setRegion] = useState(0);
  const isConv = method === 'cnn';
  return <div>
    <Stage width={560} height={280}
      label={isConv
        ? '单层卷积：同一个三乘三局部核移到不同位置，连接到特征图的对应位置'
        : '自注意力：选中的查询图块与整张图像的所有图块建立内容相关的联系；线粗为教学示意'}
      render={(c, w, h) => {
        clearScene(c, w, h);
        const px = 24, py = 52, size = 192;
        drawPhoto(c, px, py, size, isConv ? 6 : 4);
        c.font = '600 24px sans-serif'; c.fillStyle = C.ink;
        c.fillText(isConv ? '共享局部核' : '切成图块', 24, 29);
        c.fillText(isConv ? '对应位置响应' : '全图内容关联', 326, 29);
        if (isConv) {
          const col = region === 0 ? 3 : 1, row = region === 0 ? 1 : 2;
          const kx = px + col * 32, ky = py + row * 32;
          c.fillStyle = 'rgba(240,126,71,.16)'; c.fillRect(kx, ky, 96, 96);
          c.strokeStyle = C.orange; c.lineWidth = 4; c.strokeRect(kx, ky, 96, 96);
          // The same diagonal motif denotes the same learned kernel at both locations.
          for (let j = 0; j < 3; j++) {
            c.fillStyle = 'rgba(240,126,71,.5)';
            c.fillRect(kx + j * 32 + 8, ky + j * 32 + 8, 16, 16);
          }
          const fx = 334, fy = 61, cell = 44;
          for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
            pill(c, fx + x * cell, fy + y * cell, 35, 35, C.light);
          }
          const ox = fx + (col - 1) * cell, oy = fy + (row - 1) * cell;
          c.fillStyle = C.blue; c.fillRect(ox, oy, 35, 35);
          c.strokeStyle = C.orange; c.lineWidth = 3; c.strokeRect(ox - 4, oy - 4, 43, 43);
          // One local receptive field contributes to one output location.
          line(c, kx + 96, ky, ox, oy, C.orange, 2);
          line(c, kx + 96, ky + 96, ox, oy + 35, C.orange, 2);
          c.fillStyle = C.muted; c.font = '21px sans-serif';
          c.fillText('3×3 邻域 · 同一组参数', 24, 272);
        } else {
          const query = region === 0 ? 7 : 9;
          const qx = px + (query % 4) * 48, qy = py + Math.floor(query / 4) * 48;
          c.strokeStyle = C.orange; c.lineWidth = 4; c.strokeRect(qx, qy, 48, 48);
          const tx = 342, ty = 61, cell = 44;
          const cx = tx + (query % 4) * cell + 16, cy = ty + Math.floor(query / 4) * cell + 16;
          // All keys are available in one attention layer. Weights here are illustrative.
          for (let i = 0; i < 16; i++) {
            const x = tx + (i % 4) * cell + 16, y = ty + Math.floor(i / 4) * cell + 16;
            if (i !== query) {
              const strong = region === 0 ? [2, 9, 14].includes(i) : [0, 6, 15].includes(i);
              line(c, cx, cy, x, y, strong ? C.blue : '#bdcbbd', strong ? 4 : 1.5);
            }
          }
          for (let i = 0; i < 16; i++) {
            const x = tx + (i % 4) * cell, y = ty + Math.floor(i / 4) * cell;
            pill(c, x + 6, y + 6, 20, 20, i === query ? C.orange : C.blue);
          }
          c.strokeStyle = C.orange; c.lineWidth = 3;
          c.strokeRect(cx - 20, cy - 20, 40, 40);
          line(c, 228, 148, 310, 148, C.blue, 3);
          line(c, 300, 138, 310, 148, C.blue, 3);
          line(c, 300, 158, 310, 148, C.blue, 3);
          c.fillStyle = C.muted; c.font = '21px sans-serif';
          c.fillText('橙色为查询 · 线粗示意权重', 24, 272);
        }
      }} />
    <div style={{ padding: '0 14px' }}>
      <Chips label={isConv ? '移动共享卷积核' : '切换注意力查询'}
        options={[{ value: 0, label: isConv ? '卷积核：位置一' : '查询：鸟嘴' },
          { value: 1, label: isConv ? '卷积核：位置二' : '查询：翅膀' }]}
        value={region} onChange={setRegion} />
    </div>
  </div>;
}
