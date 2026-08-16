import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, bar, clear, label, metric } from './yolo-shared';

type Mode = 'cost' | 'range' | '640' | '1280';
const W = 720;
const H = 360;
const modes: [Mode, string][] = [
  ['cost', '参数开销'],
  ['range', '回归范围'],
  ['640', '640 实验'],
  ['1280', '1280 实验'],
];

export const DflEvidenceModes: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>('cost');

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    clear(ctx, W, H);
    ctx.fillStyle = '#fff';
    ctx.fillRect(24, 28, 672, 274);

    if (mode === 'cost') {
      label(ctx, 'YOLO11n：移除 DFL 后的检测头成本', 46, 55, C.text, 16, 700);
      const rows = [['参数量', 2.6, 2.3, 'M'], ['FLOPs', 6.5, 5.2, 'G']] as const;
      rows.forEach((row, index) => {
        const y = 92 + index * 84;
        label(ctx, row[0], 48, y, C.muted, 12, 600);
        bar(ctx, 130, y - 10, 420, 16, row[1], 7, C.red);
        label(ctx, `${row[1]}${row[3]} · 使用 DFL`, 565, y - 2, C.red, 12, 600);
        bar(ctx, 130, y + 20, 420, 16, row[2], 7, C.green);
        label(ctx, `${row[2]}${row[3]} · 移除 DFL`, 565, y + 28, C.green, 12, 600);
      });
    }

    if (mode === 'range') {
      label(ctx, 'K=16 时，回归范围随特征层步长变化', 46, 55, C.text, 16, 700);
      ([['P3', 8, 240], ['P4', 16, 480], ['P5', 32, 960]] as const).forEach((row, index) => {
        const y = 96 + index * 58;
        label(ctx, `${row[0]} · stride ${row[1]}`, 52, y, C.blue, 13, 700);
        bar(ctx, 200, y - 9, 380, 18, row[2], 960, C.orange);
        label(ctx, `整框宽高约 ${row[2]} px`, 595, y, C.orange, 12, 600);
      });
      label(ctx, '单边上限：(K−1)s；整框宽高约：2(K−1)s', 50, 275, C.muted, 12, 600);
    }

    if (mode === '640' || mode === '1280') {
      const values = mode === '640'
        ? { ap: [46.0, 46.3], apl: [62.8, 63.8] }
        : { ap: [49.8, 51.1], apl: [61.8, 64.0] };
      label(ctx, `${mode} 分辨率 · YOLO26s 同协议对照`, 46, 55, C.text, 16, 700);
      const rows = [['AP', values.ap], ['APᴸ', values.apl]] as const;
      rows.forEach((row, index) => {
        const y = 108 + index * 88;
        label(ctx, row[0], 50, y, C.muted, 13, 700);
        bar(ctx, 120, y - 16, 430, 22, row[1][0], 70, C.red);
        label(ctx, `使用 DFL ${row[1][0].toFixed(1)}`, 565, y - 5, C.red, 12, 600);
        bar(ctx, 120, y + 18, 430, 22, row[1][1], 70, C.green);
        label(ctx, `移除 DFL ${row[1][1].toFixed(1)}`, 565, y + 29, C.green, 12, 600);
      });
    }

    metric(ctx, 430, 305, 250, '数据来源', mode === 'cost' ? '第 2 页参数示例' : mode === 'range' ? 'Equation 1 / Section 3.2.2' : `Table 3 · ${mode}`, C.blue);
    canvas.classList.add('is-ready');
  }, [mode]);

  const feedback = mode === 'cost'
    ? '检测头参数量从 2.6M 降到 2.3M，FLOPs 从 6.5G 降到 5.2G。'
    : mode === 'range'
      ? '16 个离散位置使每个特征层具有固定的单边距离上限；完整框的宽高上限约为单边上限的两倍。'
      : mode === '640'
        ? '640 分辨率同协议实验：移除 DFL 为 46.3 AP，使用 DFL 为 46.0 AP。'
        : '1280 分辨率同协议实验：移除 DFL 为 51.1 AP，使用 DFL 为 49.8 AP。';

  return (
    <div>
      <canvas ref={ref} width={W} height={H} aria-label="DFL 成本、范围与同协议实验" />
      <div className="ctrl">
        {modes.map(([value, text]) => (
          <button key={value} className={`chip ${mode === value ? 'active' : ''}`} onClick={() => setMode(value)}>{text}</button>
        ))}
      </div>
      <div className="feedback good">{feedback}</div>
      <details>
        <summary>表 2 与表 3 分别回答什么问题？</summary>
        <p>表 2 展示累积系统消融：47.0 → 移除 DFL 后 46.4，再加入 L1、STAL 和 neck refinement。表 3 固定训练协议，单独比较使用 DFL 与移除 DFL 的结果。</p>
      </details>
    </div>
  );
};
