import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

const tasks = [
  { name: 'Pose', zh: '关键点与骨架', src: './paper/task-pose-pair.png', metric: '308 KEYPOINTS', note: '覆盖身体、双手、双脚与 243 个面部关键点。', source: 'Sapiens Figure 1 / Sapiens2 Figure 6' },
  { name: 'Segmentation', zh: '身体部位类别', src: './paper/task-segmentation-pair.png', metric: '29 CLASSES', note: '逐像素标注人体部位；Sapiens2 新增眼镜类别。', source: 'Sapiens Figure 1 / Sapiens2 Figure 6' },
  { name: 'Pointmap', zh: '逐像素三维坐标', src: './paper/task-pointmap-pair.png', metric: 'XYZ PER PIXEL', note: '每个像素回归相机坐标系中的三维位置。', source: 'Sapiens2 Figure 6' },
  { name: 'Normal', zh: '人体表面朝向', src: './paper/task-normal-pair.png', metric: 'UNIT NORMAL', note: 'RGB 颜色编码每个像素的三维单位法线方向。', source: 'Sapiens2 Figure 6' },
  { name: 'Albedo', zh: '去除光照后的固有颜色', src: './paper/task-albedo-pair.png', metric: 'DIFFUSE COLOR', note: '分离光照影响，恢复皮肤与衣物的固有漫反射颜色。', source: 'Sapiens2 Figure 6' },
] as const;

export const TaskCarousel: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState(0);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (locked) return;
    const id = window.setInterval(() => setActive((value) => (value + 1) % tasks.length), 1800);
    return () => window.clearInterval(id);
  }, [locked]);

  const selectTask = (index: number) => {
    setActive(index);
    setLocked(true);
  };

  const task = tasks[active];

  return (
    <div className="academic-figure task-carousel paper-task-carousel">
      <div className="paper-task-demo">
        <div className="paper-task-pair" key={task.name}>
          <img src={task.src} alt={`论文中的原始人体图像与 ${task.name} 批注输出对比`} />
          <span className="paper-task-label input">原图输入</span>
          <span className="paper-task-label output">论文批注输出</span>
          <i className="paper-task-divider" aria-hidden="true" />
          <i className="paper-task-reveal" aria-hidden="true" />
        </div>
        <aside className="paper-task-note">
          <span>当前任务 · {String(active + 1).padStart(2, '0')}</span>
          <h3>{task.name}</h3>
          <strong>{task.zh}</strong>
          <b>{task.metric}</b>
          <p>{task.note}</p>
          <small>{task.source}</small>
        </aside>
      </div>
      <div className="auto-tabs paper-task-tabs" aria-label="选择人体视觉任务">
        {tasks.map((item, index) => <button aria-pressed={active === index} className={active === index ? 'active' : ''} onClick={() => selectTask(index)} key={item.name}>{item.name}</button>)}
      </div>
      <p className="paper-task-hint">{locked ? '已停留在所选任务，可继续点击切换。' : '论文图片自动演示中；点击任务可停留查看。'}</p>
    </div>
  );
};
