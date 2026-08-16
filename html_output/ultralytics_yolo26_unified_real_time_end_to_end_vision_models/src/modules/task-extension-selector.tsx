import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, box, clear, dot, label, metric, rounded } from './yolo-shared';

type Task = 'seg' | 'pose' | 'obb' | 'yoloe';
const W = 760;
const H = 400;
const taskNames: Record<Task, string> = {
  seg: '实例分割',
  pose: '姿态估计',
  obb: '旋转框检测',
  yoloe: '开放词汇检测',
};
const purposes: Record<Task, { title: string; text: string }> = {
  seg: {
    title: '实例分割解决什么问题？',
    text: '它为图像中的每个目标输出独立的像素级掩膜，可区分相互遮挡的同类目标，适合缺陷区域测量、医学轮廓和精细抠图。',
  },
  pose: {
    title: '姿态估计解决什么问题？',
    text: '它定位人体或物体的关键点，并由关键点关系描述姿态，常用于动作分析、运动训练和人机交互。',
  },
  obb: {
    title: '旋转框检测解决什么问题？',
    text: '它为倾斜目标输出带角度的边界框，能更紧密地包围航拍图中的车辆、船舶和细长物体。',
  },
  yoloe: {
    title: '开放词汇检测解决什么问题？',
    text: '它根据文本或图片提示寻找目标，使检测类别可以在使用时指定，适合检索训练标签之外的新类别。',
  },
};

export const TaskExtensionSelector: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [task, setTask] = useState<Task>('seg');

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    clear(ctx, W, H);
    ctx.fillStyle = '#fff';
    rounded(ctx, 24, 25, 712, 315, 9);
    ctx.fill();
    ctx.strokeStyle = C.border;
    ctx.stroke();

    ctx.fillStyle = C.blue;
    rounded(ctx, 42, 78, 155, 96, 10);
    ctx.fill();
    label(ctx, 'YOLO26 共享核心', 58, 111, '#fff', 15, 700);
    label(ctx, 'Backbone + Neck', 58, 142, '#fff', 12, 600);
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(197, 126);
    ctx.lineTo(254, 126);
    ctx.stroke();

    ctx.fillStyle = C.purple;
    rounded(ctx, 254, 58, 278, 178, 10);
    ctx.fill();
    label(ctx, taskNames[task], 276, 81, '#fff', 16, 700);

    if (task === 'seg') {
      label(ctx, '多尺度特征 → Proto 掩膜', 276, 118, '#fff', 12, 600);
      label(ctx, '每个目标输出独立像素区域', 276, 151, '#fff', 13, 700);
      label(ctx, '训练期增加辅助分割损失', 276, 184, '#fff', 12, 600);
      metric(ctx, 557, 65, 156, 'COCO Mask mAP', '32.0 → 32.7', C.green);
    }
    if (task === 'pose') {
      for (const [x, y] of [[330, 110], [300, 143], [360, 143], [285, 190], [375, 190]]) dot(ctx, x, y, C.orange, 5);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(330, 110);
      ctx.lineTo(300, 143);
      ctx.lineTo(285, 190);
      ctx.moveTo(330, 110);
      ctx.lineTo(360, 143);
      ctx.lineTo(375, 190);
      ctx.stroke();
      label(ctx, '关键点位置 + 每轴不确定性', 276, 218, '#fff', 12, 600);
      metric(ctx, 557, 65, 156, 'COCO Pose mAP', '63.0', C.green);
    }
    if (task === 'obb') {
      ctx.save();
      ctx.translate(385, 145);
      ctx.rotate(-0.42);
      box(ctx, -64, -28, 128, 56, '#fff');
      ctx.restore();
      label(ctx, '长边角度范围 [-45°, 135°)', 276, 205, '#fff', 12, 600);
      metric(ctx, 557, 65, 156, 'DOTA mAP', '47.7 → 50.2', C.green);
    }
    if (task === 'yoloe') {
      ['文本提示', '图片提示', '无提示'].forEach((text, i) => {
        label(ctx, text, 276, 112 + i * 34, '#fff', 12, 600);
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(344, 112 + i * 34);
        ctx.lineTo(405, 146);
        ctx.stroke();
      });
      label(ctx, '按提示定位目标', 412, 146, '#fff', 12, 700);
      metric(ctx, 557, 65, 156, 'LVIS Text AP', '40.6', C.green);
    }

    label(ctx, '复用特征提取', 54, 295, C.blue, 12, 700);
    label(ctx, '增加任务专用输出与损失', 278, 295, C.purple, 12, 700);
    const evidence = task === 'seg'
      ? 'Table 8 · COCO mask'
      : task === 'pose'
        ? 'Table 9 · COCO keypoints'
        : task === 'obb'
          ? 'Tables 10–11 · DOTA-v1.0'
          : 'Table 12 / Sec. 4.6 · LVIS';
    label(ctx, evidence, 557, 292, C.muted, 11, 600);
    canvas.classList.add('is-ready');
  }, [task]);

  const results: Record<Task, string> = {
    seg: '多尺度 Proto 和训练期辅助损失将 mask mAP 从 32.0 提升到 32.7。',
    pose: '位置与每轴不确定性联合建模；24×OKS 加 1×RLE 达到 63.0 mAP。',
    obb: '长边定义缓解角度边界不连续，角度损失将 mAP 提升到 50.2。',
    yoloe: '四项开放词汇改动叠加后，YOLOE-26x 的文本提示检测达到 40.6 AP。',
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} aria-label="YOLO26 不同视觉任务的输出结构" />
      <div className="ctrl">
        {(Object.keys(taskNames) as Task[]).map(item => (
          <button
            key={item}
            className={`chip ${task === item ? 'active' : ''}`}
            onClick={() => setTask(item)}
          >
            {taskNames[item]}
          </button>
        ))}
      </div>
      <div className="task-purpose">
        <strong>{purposes[task].title}</strong>
        {purposes[task].text}
      </div>
      <div className="feedback good">论文结果：{results[task]}</div>
      <p style={{ color: C.muted, fontSize: 13 }}>
        图像分类任务输出整幅图像的类别。上述四项任务分别使用对应数据集和评价指标。
      </p>
    </div>
  );
};
