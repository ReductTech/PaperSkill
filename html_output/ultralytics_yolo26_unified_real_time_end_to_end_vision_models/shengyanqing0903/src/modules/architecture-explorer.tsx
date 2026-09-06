import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clear, label, rounded } from './yolo-shared';

type Phase = 'train' | 'infer';
type Node = 'backbone' | 'stal' | 'o2m' | 'o2o' | 'direct' | 'progressive' | 'musgd';
const W = 840;
const H = 460;
const names: Record<Node, string> = {
  backbone: 'Backbone + Neck',
  stal: 'STAL',
  o2m: 'One to many',
  o2o: 'One to one',
  direct: 'Direct Regression',
  progressive: 'Progressive Loss',
  musgd: 'MuSGD',
};
const trainingOnly: Node[] = ['stal', 'o2m', 'progressive', 'musgd'];
const info: Record<Node, string> = {
  backbone: '主干与颈部网络提取并融合多尺度图像特征。',
  stal: '在候选筛选时补足极小标注框的候选点。',
  o2m: '任务对齐分配选择 10 个正样本，提供密集训练监督。',
  o2o: '首轮选择 7 个候选，第二轮保留 1 个正样本，形成默认端到端路径。',
  direct: '每个空间点直接预测到边界框四条边的连续距离。',
  progressive: '逐步降低 one to many 权重并提高 one to one 权重。',
  musgd: '混合 Muon 与 SGD 更新模型权重。',
};

export const ArchitectureExplorer: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>('train');
  const [node, setNode] = useState<Node>('backbone');
  const selectPhase = (next: Phase) => {
    setPhase(next);
    if (next === 'infer' && trainingOnly.includes(node)) setNode('o2o');
  };

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    clear(ctx, W, H);
    label(ctx, phase === 'train' ? '训练路径：双分支 + 训练机制' : '默认推理路径：One to one + 直接回归 + 无 NMS', 28, 27, phase === 'train' ? C.blue : C.green, 16, 700);

    const positions: Record<Node, [number, number, number, number]> = {
      backbone: [35, 92, 170, 58],
      stal: [250, 48, 145, 52],
      o2m: [250, 112, 145, 58],
      o2o: [250, 205, 145, 58],
      direct: [445, 155, 155, 58],
      progressive: [635, 112, 165, 58],
      musgd: [635, 205, 165, 58],
    };
    const edge = (from: Node, to: Node, active: boolean) => {
      const source = positions[from];
      const target = positions[to];
      ctx.strokeStyle = active ? (phase === 'train' ? C.blue : C.green) : C.border;
      ctx.lineWidth = active ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(source[0] + source[2], source[1] + source[3] / 2);
      ctx.lineTo(target[0], target[1] + target[3] / 2);
      ctx.stroke();
    };
    edge('backbone', 'o2m', phase === 'train');
    edge('backbone', 'o2o', true);
    edge('o2m', 'direct', phase === 'train');
    edge('o2o', 'direct', true);
    edge('direct', 'progressive', phase === 'train');
    edge('progressive', 'musgd', phase === 'train');

    (Object.keys(positions) as Node[]).forEach(item => {
      const [x, y, width, height] = positions[item];
      const disabled = phase === 'infer' && trainingOnly.includes(item);
      ctx.fillStyle = item === node ? (phase === 'train' ? C.blue : C.green) : disabled ? '#eef1f4' : '#fff';
      rounded(ctx, x, y, width, height, 9);
      ctx.fill();
      ctx.strokeStyle = item === node ? C.orange : C.border;
      ctx.lineWidth = item === node ? 3 : 1.5;
      ctx.stroke();
      label(ctx, names[item], x + 12, y + height / 2, disabled ? C.muted : item === node ? '#fff' : C.text, 13, 700);
    });

    ctx.fillStyle = '#fff';
    rounded(ctx, 34, 315, 766, 102, 9);
    ctx.fill();
    ctx.strokeStyle = C.border;
    ctx.stroke();
    label(ctx, names[node], 54, 339, phase === 'train' ? C.blue : C.green, 15, 700);
    label(ctx, info[node], 54, 370, C.text, 13, 600);
    label(ctx, phase === 'infer' ? '当前节点位于默认端到端推理路径。' : '当前节点参与训练。', 54, 397, phase === 'infer' ? C.green : C.blue, 12, 600);
    canvas.classList.add('is-ready');
  }, [phase, node]);

  return (
    <div>
      <canvas ref={ref} width={W} height={H} aria-label="YOLO26 训练与推理路径" />
      <div className="ctrl">
        <button className={`chip ${phase === 'train' ? 'active' : ''}`} onClick={() => selectPhase('train')}>训练</button>
        <button className={`chip ${phase === 'infer' ? 'active' : ''}`} onClick={() => selectPhase('infer')}>推理</button>
      </div>
      <div className="ctrl" aria-label="架构组件">
        {(Object.keys(names) as Node[]).map(item => (
          <button
            key={item}
            className={`chip ${node === item ? 'active' : ''}`}
            disabled={phase === 'infer' && trainingOnly.includes(item)}
            title={phase === 'infer' && trainingOnly.includes(item) ? '该组件只参与训练' : ''}
            onClick={() => setNode(item)}
          >
            {names[item]}
          </button>
        ))}
      </div>
      <div className={`feedback ${phase === 'infer' ? 'good' : ''}`}>
        {phase === 'infer'
          ? '默认路径：图像 → Backbone + Neck → One to one → 直接边界框 → 无 NMS。'
          : '训练路径同时使用 one to many 和 one to one 分支，并由 Progressive Loss 与 MuSGD 更新权重。'}
      </div>
      <p style={{ color: C.muted, fontSize: 13 }}>部分运行时缺少端到端解码所需的 top-K 支持，此时会使用带 NMS 的兼容路径。</p>
    </div>
  );
};
