import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type InputMode = '文本' | '单图' | '多视图' | '视频';

type Mission = {
  lane: '世界生成' | '世界重建';
  goal: string;
  condition: string;
  stages: Array<{ name: string; detail: string }>;
  outputs: string[];
  caution: string;
};

const missions: Record<InputMode, Mission> = {
  文本: {
    lane: '世界生成',
    goal: '从语言条件想象未观测空间，再合成为可漫游三维资产。',
    condition: '没有真实多视图约束，需要生成先验补足外观与空间。',
    stages: [
      { name: 'HY-Pano 2.0', detail: '生成 360° 全景种子' },
      { name: 'WorldNav', detail: '规划可探索轨迹' },
      { name: 'WorldStereo', detail: '沿轨迹扩展关键帧' },
      { name: 'WorldMirror 2.0', detail: '重建并组合三维世界' },
    ],
    outputs: ['3DGS', 'Mesh', '视频'],
    caution: '生成结果包含模型补全，不能当作真实场景测量。',
  },
  单图: {
    lane: '世界生成',
    goal: '保留参考图语义与风格，同时生成图外的可探索区域。',
    condition: '单张图像只约束一个视角，遮挡区和背面仍需要生成。',
    stages: [
      { name: 'HY-Pano 2.0', detail: '把单视图扩展为全景' },
      { name: 'WorldNav', detail: '寻找值得补拍的区域' },
      { name: 'WorldStereo', detail: '生成跨视角关键帧' },
      { name: 'WorldMirror 2.0', detail: '恢复几何并输出资产' },
    ],
    outputs: ['3DGS', 'Mesh', '视频'],
    caution: '参考图之外的结构来自生成先验，几何并非唯一解。',
  },
  多视图: {
    lane: '世界重建',
    goal: '利用多视角对应关系恢复被观测场景的几何与相机。',
    condition: '输入已经提供跨视角约束，重点从想象转为前馈重建。',
    stages: [
      { name: 'Any-Modal 输入', detail: '融合图像与可选几何先验' },
      { name: 'WorldMirror 2.0', detail: '共享骨干一次前馈预测' },
    ],
    outputs: ['点图', '深度', '法线', '相机', '3DGS'],
    caution: '重建质量仍取决于视角覆盖、图像质量和输入数量。',
  },
  视频: {
    lane: '世界重建',
    goal: '从随手拍摄的视频中恢复持续一致的三维场景。',
    condition: '视频提供连续观察，但仍要处理运动模糊、重复帧与覆盖盲区。',
    stages: [
      { name: '帧与先验整理', detail: '组织多帧输入和可选相机信息' },
      { name: 'WorldMirror 2.0', detail: '联合预测几何、相机与 3DGS' },
    ],
    outputs: ['点云', '深度', '法线', '相机', '3DGS'],
    caution: '视频输入不自动保证完整覆盖，拍摄不到的区域仍可能缺失。',
  },
};

const modes: InputMode[] = ['文本', '单图', '多视图', '视频'];

export const HyMissionPlanner: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<InputMode>('单图');
  const mission = missions[mode];
  const isGeneration = mission.lane === '世界生成';

  return (
    <div className="mission-planner">
      <div className="mission-inputs" role="group" aria-label="选择输入形式">
        {modes.map((item) => (
          <button
            key={item}
            className={`mission-input ${mode === item ? 'selected' : ''}`}
            onClick={() => setMode(item)}
            aria-pressed={mode === item}
          >
            <span>{item}</span>
            <small>{item === '文本' || item === '单图' ? '生成入口' : '重建入口'}</small>
          </button>
        ))}
      </div>

      <div className={`mission-board ${isGeneration ? 'generation' : 'reconstruction'}`} aria-live="polite">
        <section className="mission-brief">
          <span className="mission-lane">{mission.lane}</span>
          <h5>{mode}任务卡</h5>
          <p>{mission.goal}</p>
          <div className="mission-condition">为什么这样分流：{mission.condition}</div>
        </section>

        <section className="mission-route" aria-label={`${mode}处理路径`}>
          {mission.stages.map((stage, index) => (
            <React.Fragment key={stage.name}>
              <div className="mission-stage">
                <b>{index + 1}</b>
                <span>{stage.name}</span>
                <small>{stage.detail}</small>
              </div>
              {index < mission.stages.length - 1 ? <span className="mission-connector" aria-hidden="true">→</span> : null}
            </React.Fragment>
          ))}
        </section>

        <section className="mission-outputs">
          <strong>本路径可观察的输出</strong>
          <div>
            {mission.outputs.map((output) => <span key={output}>{output}</span>)}
          </div>
        </section>
      </div>

      <div className={`feedback ${isGeneration ? '' : 'good'}`}>
        {mission.caution} 官网展示的导出格式是产品能力说明，论文中的指标仍需按各自实验协议判断。
      </div>
    </div>
  );
};
