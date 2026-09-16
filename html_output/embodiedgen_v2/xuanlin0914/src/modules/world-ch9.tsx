import { createWorldWidget } from './world-kit';

export const WorldCh9 = createWorldWidget({
  chapter: 9, action: '迁移道具', goal: '跨后端复用', type: 'chips',
  options: ['Genesis','SAPIEN','Isaac Sim','Isaac Gym','MuJoCo','PyBullet'], canvasLabels: ['统一描述','目标后端'],
  feedback: ['Genesis 通过 XML 路径接收规范化资产。','SAPIEN 直接消费 URDF 资产与布局。','Isaac Sim 使用 USD 封装。','Isaac Gym 使用标准资产描述。','MuJoCo 使用 MJCF/XML 路径。','PyBullet 使用 URDF 路径；论文展示无需手工改布局。']
});
