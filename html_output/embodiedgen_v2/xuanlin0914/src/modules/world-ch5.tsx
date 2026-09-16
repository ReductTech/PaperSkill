import { createWorldWidget } from './world-kit';

export const WorldCh5 = createWorldWidget({
  chapter: 5, action: '安装把手', goal: '稳定抓取', type: 'chips',
  options: ['部件分割','语义标注','抓取候选','物理验证'], values: [69.5,99.3,72.5,50.0], canvasLabels: ['部件到动作','级联验证'],
  feedback: ['分割先提供功能部件的几何载体。','语义标注补充名称、功能、可抓取性与场景。','GraspGen 生成与部件关联的 6-DoF 候选。','SAPIEN 中的闭合、抬升、扰动与放下筛掉不稳定抓取。']
});
