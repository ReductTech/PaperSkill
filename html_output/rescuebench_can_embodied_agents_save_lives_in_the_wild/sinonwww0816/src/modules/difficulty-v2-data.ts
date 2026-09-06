export type DifficultyLevel = {
  code: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
  title: string;
  short: string;
  environment: string;
  task: string;
  reasoning: string;
  image: string;
  distance: string;
  maxDistance: number;
  height: '无' | '可能' | '必须';
  interaction: '无' | '有';
};

export const difficultyLevels: DifficultyLevel[] = [
  {
    code: 'L1', title: '基础近距', short: '近距离 · 干净环境',
    environment: '干净、开阔', task: '直接发现', reasoning: '近距离辅助',
    image: '/images/rescuebench-figure-3-l1.png', distance: '5–15 m', maxDistance: 15,
    height: '无', interaction: '无',
  },
  {
    code: 'L2', title: '视觉干扰', short: '视觉干扰增加',
    environment: '视觉内容增加，路径仍无遮挡', task: '视觉筛选', reasoning: '更复杂视觉辨认',
    image: '/images/rescuebench-figure-3-l2.png', distance: '5–30 m', maxDistance: 30,
    height: '无', interaction: '无',
  },
  {
    code: 'L3', title: '主动搜索', short: '主动搜索开始',
    environment: '搜索空间扩大', task: '主动搜索', reasoning: '视觉匹配',
    image: '/images/rescuebench-figure-3-l3.png', distance: '10–40 m', maxDistance: 40,
    height: '可能', interaction: '无',
  },
  {
    code: 'L4', title: '跨区域', short: '跨区域搜索',
    environment: '跨区域与室内外过渡', task: '跨区域搜索', reasoning: '方向推理',
    image: '/images/rescuebench-figure-3-l4.png', distance: '10–60 m', maxDistance: 60,
    height: '可能', interaction: '有',
  },
  {
    code: 'L5', title: '多楼层', short: '多楼层空间',
    environment: '显著高度变化与多层结构', task: '层级空间搜索', reasoning: '层级空间推理',
    image: '/images/rescuebench-figure-3-l5.png', distance: '10–80 m', maxDistance: 80,
    height: '必须', interaction: '有',
  },
];
