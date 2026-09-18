import { createWorldWidget } from './world-kit';

export const WorldCh3 = createWorldWidget({
  chapter: 3, action: '退回缺陷', goal: '检查通过', type: 'steps',
  options: ['生成','检查','重试','修复','封装'], canvasLabels: ['Quality Gate','通过才封装'],
  feedback: ['先产生候选，不把候选当成最终资产。','语义、完整性和跨模态一致性必须通过检查。','失败会更换随机种子重试，而不是静默放行。','网格修复与凸分解处理物理可用性。','通过的资产才进入标准格式封装。']
});
