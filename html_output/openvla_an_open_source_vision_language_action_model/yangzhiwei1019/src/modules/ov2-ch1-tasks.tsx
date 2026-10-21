import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { V, startScene, field } from './ov2-analogy';

const W = 1080;
const H = 280;

/* 论文 Table 4（BridgeData V2，WidowX，每任务 10 次试跑）的原始成功次数，
   依次为 RT-1-X / Octo / RT-2-X / OpenVLA；部分任务允许 0.5 分。 */
type Row = { name: string; en: string; cat: string; v: number[]; note: string };
const ROWS: Row[] = [
  { name: '茄子入锅（易）', en: 'Put Eggplant into Pot (Easy Version)', cat: '视觉泛化', v: [1, 5, 7, 10], note: '最容易的一档：只有本文做到 10 次全成。' },
  { name: '茄子入锅', en: 'Put Eggplant into Pot', cat: '视觉泛化', v: [0, 1, 5, 10], note: '换背景后，前两家几乎归零。' },
  { name: '杯子入水槽', en: 'Put Cup from Counter into Sink', cat: '视觉泛化', v: [1, 1, 0, 7], note: 'RT-2-X 这里反而 0 次，说明排名不是逐项单调的。' },
  { name: '茄子入锅（杂乱）', en: 'Put Eggplant into Pot (w/ Clutter)', cat: '视觉泛化', v: [1, 3.5, 6, 7.5], note: '加干扰物后差距缩小，Octo 拿到 3.5。' },
  { name: '玉米上粉盘', en: 'Put Yellow Corn on Pink Plate', cat: '视觉泛化', v: [1, 4, 8, 9], note: '颜色/外观泛化，两个 VLA 都在 8 次以上。' },
  { name: '举起茄子', en: 'Lift Eggplant', cat: '运动泛化', v: [3, 0.5, 6.5, 7.5], note: '位置与朝向变化，Octo 只剩半次。' },
  { name: '胡萝卜上盘（变高）', en: 'Put Carrot on Plate (w/ Height Change)', cat: '运动泛化', v: [2, 1, 4.5, 4.5], note: '这一项 RT-2-X 与本文并列。' },
  { name: '胡萝卜上盘', en: 'Put Carrot on Plate', cat: '物理泛化', v: [1, 0, 1, 8], note: '物体尺寸/形状变化：只有本文过 8 次。' },
  { name: '把锅翻正', en: 'Flip Pot Upright', cat: '物理泛化', v: [2, 6, 5, 8], note: 'Octo 在这里高过 RT-2-X。' },
  { name: '举起 AAA 电池', en: 'Lift AAA Battery', cat: '物理泛化', v: [0, 0, 2, 7], note: '小物体抓取，前两家一次未成。' },
  { name: '骷髅入沥水架', en: 'Move Skull into Drying Rack', cat: '语义泛化', v: [1, 0, 5, 5], note: '语义类：本文与 RT-2-X 持平。' },
  { name: '举起白胶带', en: 'Lift White Tape', cat: '语义泛化', v: [3, 0, 0, 1], note: '两个 VLA 只有 0–1 次，RT-1-X 反倒拿了 3 次；这一类是双方的共同短板。' },
  { name: '从锅里取葡萄', en: 'Take Purple Grapes out of Pot', cat: '语义泛化', v: [6, 0, 5, 4], note: 'RT-1-X 反而最高，说明从零训练也能吃透单项。' },
  { name: '蓝杯叠粉杯', en: 'Stack Blue Cup on Pink Cup', cat: '语义泛化', v: [0.5, 0, 5.5, 4.5], note: 'RT-2-X 略高于本文，属于语义泛化的弱项。' },
  { name: '指茄子/红瓶入锅', en: 'Put {Eggplant, Red Bottle} into Pot', cat: '语言定位', v: [2.5, 4, 8.5, 7.5], note: '考「抓对那一个」，两个 VLA 都到 7.5 以上。' },
  { name: '指奶酪/辣椒', en: 'Lift {Cheese, Red Chili Pepper}', cat: '语言定位', v: [1.5, 2.5, 8.5, 10], note: '本文 10 次全成。' },
  { name: '指蓝杯/粉杯上盘', en: 'Put {Blue Cup, Pink Cup} on Plate', cat: '语言定位', v: [5, 5.5, 8.5, 9.5], note: '语言定位类普遍偏高。' },
];

const NAMES = ['RT-1-X', 'Octo', 'RT-2-X', 'OpenVLA'];
const COLORS = [V.red, '#d98a97', V.purple, V.green];

export const Ov2Ch1Tasks: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(0);
  const [idx, setIdx] = useState(0);
  const [fb, setFb] = useState({ text: ROWS[0].note, cls: '' });

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    return startScene(cv, W, H, (ctx) => {
      const r = ROWS[stateRef.current];
      field(ctx, W, H);
      const x0 = 220;
      const gap = 190;
      const base = 218;
      r.v.forEach((val, i) => {
        const h = Math.max(3, (val / 10) * 180);
        ctx.fillStyle = COLORS[i];
        ctx.beginPath();
        ctx.roundRect(x0 + i * gap, base - h, 96, h, 4);
        ctx.fill();
        // 满分参考线
        ctx.strokeStyle = V.line;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x0 + i * gap - 6, base - 180);
        ctx.lineTo(x0 + i * gap + 102, base - 180);
        ctx.stroke();
        ctx.setLineDash([]);
        // 数值
        ctx.fillStyle = V.ink;
        ctx.font = '700 18px "Segoe UI", sans-serif';
        ctx.fillText(String(val), x0 + i * gap + 10, base - h - 10);
        // 策略名
        ctx.fillStyle = V.muted;
        ctx.font = '600 13px "Segoe UI", sans-serif';
        ctx.fillText(NAMES[i], x0 + i * gap + 4, base + 24);
      });
      ctx.strokeStyle = V.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(200, base + 0.5);
      ctx.lineTo(1040, base + 0.5);
      ctx.stroke();
      // 编号与该任务类别
      ctx.fillStyle = V.ink;
      ctx.font = '700 40px "Segoe UI", sans-serif';
      ctx.fillText(String(stateRef.current + 1).padStart(2, '0'), 60, 110);
      ctx.font = '600 15px "Segoe UI", sans-serif';
      ctx.fillStyle = V.muted;
      ctx.fillText(r.cat, 60, 140);
    });
  }, []);

  const pick = (i: number) => {
    stateRef.current = i;
    setIdx(i);
    const r = ROWS[i];
    const gapv = (r.v[3] - r.v[1]).toFixed(1);
    setFb({
      text: `第 ${i + 1} 项「${r.name}」${r.en}（${r.cat}）：本文 ${r.v[3]} 次，Octo ${r.v[1]} 次，相差 ${gapv} 次。${r.note}`,
      cls: r.v[3] >= 8 ? 'good' : r.v[3] <= 2 ? 'bad' : '',
    });
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          第 <span className="val">{idx + 1}</span> / 17 项
        </label>
        <input type="range" min={0} max={16} value={idx} onChange={(e) => pick(Number(e.target.value))} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ov2Ch1Tasks;
