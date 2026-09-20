import type { TutorialManifest } from '../types'

export const tutorial: TutorialManifest = {
  title: 'Janus：一颗大脑，两双眼睛',
  blocks: [
    { kind: 'chapter', id: 'problem', title: '统一任务，不等于统一表征' },
    { kind: 'module', componentId: 'conflict-lab', chapterId: 'problem' },
    { kind: 'chapter', id: 'architecture', title: '入口分开，主干共享' },
    { kind: 'module', componentId: 'architecture-router', chapterId: 'architecture' },
    { kind: 'chapter', id: 'tokens', title: '同一个下一个 token 游戏' },
    { kind: 'module', componentId: 'token-workbench', chapterId: 'tokens' },
    { kind: 'module', componentId: 'loss-mask-lab', chapterId: 'tokens' },
    { kind: 'chapter', id: 'training', title: '三阶段训练课程' },
    { kind: 'module', componentId: 'training-console', chapterId: 'training' },
    { kind: 'chapter', id: 'inference', title: 'CFG 条件引导推理' },
    { kind: 'module', componentId: 'cfg-lab', chapterId: 'inference' },
    { kind: 'chapter', id: 'evidence', title: '按口径读取基准证据' },
    { kind: 'module', componentId: 'benchmark-explorer', chapterId: 'evidence' },
    { kind: 'chapter', id: 'ablation', title: '六组消融与因果判断' },
    { kind: 'module', componentId: 'ablation-lab', chapterId: 'ablation' },
    { kind: 'chapter', id: 'boundaries', title: '证据边界与训练成本' },
    { kind: 'module', componentId: 'compute-audit', chapterId: 'boundaries' },
    { kind: 'chapter', id: 'map', title: '从 Janus 到 DeltaV' },
    { kind: 'module', componentId: 'research-map', chapterId: 'map' },
    { kind: 'chapter', id: 'check', title: '事实边界验收' },
    { kind: 'module', componentId: 'claim-audit', chapterId: 'check' },
  ],
}
