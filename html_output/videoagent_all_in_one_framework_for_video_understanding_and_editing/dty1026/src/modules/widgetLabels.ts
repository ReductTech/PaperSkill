export function controlLabel(variant: number, value: number): string {
  if (variant === 2) return `${2 + Math.round(value * 4)} 个镜头`;
  if (variant === 3) return ['山路', '车站', '海岸', '街巷', '室内'][Math.round(value * 4)];
  if (variant === 6) return value > .48 ? '出现回边' : '无环依赖';
  if (variant === 7) return `第 ${1 + Math.min(3, Math.floor(value * 4))} 轮`;
  if (variant === 8) return ['解析', '筛选', '初始图', '评估', '文本编辑', '工作流'][Math.min(5, Math.round(value * 5))];
  if (variant === 9) return ['VideoEdit', 'Shot2Story', '成本', '人工评价'][Math.min(3, Math.floor(value * 4))];
  return `${Math.round(value * 100)}%`;
}

export function feedbackNote(variant: number, value: number, fallback: string): string {
  if (variant === 3) return Math.round(value * 4) === 2
    ? '海岸是示意列表中的最高相似候选；接下来仍需定位准确时间段。'
    : '当前候选不是示意列表中的最高相似项，请对照各候选的排序。';
  if (variant === 6) return value > .48
    ? '回边形成环路，当前图不满足可执行工作流的结构约束。'
    : '依赖关系保持连通且无环；还需检查工具选择是否符合编辑意图。';
  if (variant === 10) return value > .66
    ? '高传播风险内容需要核验来源，并在发布前加入人工复核。'
    : '自动化处理仍需保留基本的来源核验与人工抽查。';
  return fallback;
}
