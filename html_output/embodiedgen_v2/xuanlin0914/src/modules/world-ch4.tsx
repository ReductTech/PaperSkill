import { createWorldWidget } from './world-kit';

export const WorldCh4 = createWorldWidget({
  chapter: 4, action: '滑动道具', goal: '可行位姿', type: 'drag',
  options: ['支撑','避碰','可达'], canvasLabels: ['拖动位姿','三项约束'],
  feedback: ['当前位置未同时满足支撑、避碰与机器人可达条件。','三个条件同时满足，可交给物理沉降处理残余穿透。']
});
