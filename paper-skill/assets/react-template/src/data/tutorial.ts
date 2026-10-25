import type { TutorialData } from '../types';

// PAPER_SKILL_DEMO_CONTENT: runnable format example, not a paper tutorial.
// Generation replaces this entire object through assemble-chapter-packets.js.

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'Route Planning Under Time and Load Constraints',
    titleZh: '时间与载荷约束下的路径规划',
    venue: 'PAPER SKILL · 交互格式示例',
    authors: '', affiliation: '', domain: '生活主题教学示例',
    coreProblem: '同样从山脚出发，为什么有人赶不上日落？',
    coreInsight: '先整理装备、看清路线，再用路程、步速和休息时间估算能否登顶。',
    keywords: ['主题故事', '多场景动画', '原理映射'],
  },
  hero: {
    oldMethod: { title: '经验式路径选择', desc: '凭感觉绕路，日落时仍在山腰。', componentId: 'mountain-cover' },
    newMethod: { title: '约束驱动的路径规划', desc: '先规划路线，日落前登上山顶。', componentId: 'mountain-cover' },
  },
  chapters: [{
    kind: 'chapter', id: 'chap-1', title: '01 · 资源约束与路径规划',
    modules: [
      { kind: 'module', id: 'pack', title: '装备选择与载荷约束', desc: '点装备装入或取出，观察总重与容量约束。', componentId: 'mountain-pack' },
      { kind: 'module', id: 'map', title: '路径规划与时间估计', desc: '选择山脊或林间路线，观察预计到顶时间。', componentId: 'mountain-map' },
      { kind: 'module', id: 'climb', title: '行进参数敏感性分析', desc: '联动调整路程、步速和休息时间，观察山路、公式和结果。', componentId: 'mountain-climb' },
    ],
    scenes: [
      { id: 'chap-1-pack', title: '装备选择与载荷约束', goal: '点装备装入或取出背包，观察总重与示例重量上限。',
        summary: '装备组合须满足载荷上限', interaction: '点饮水、雨衣、头灯，观察背包内容、总重和反馈', next: '比较不同路线的时间需求',
        notes: '这页展示统一主题中的“准备”动作。背包重量 W≤Wmax 是演示约束，不是论文公式；装备选择还需天气、路线和个人需求等真实条件，不能只看重量。真实论文教程应换成论文的实际变量与证据。',
        componentId: 'mountain-pack', moduleId: 'pack' },
      { id: 'chap-1-map', title: '路径规划与到达时间估计', goal: '点选两条路线，比较路程与预计到顶时间。',
        summary: '路线长度影响预计到达时间', interaction: '点地图上的山脊小径或林间绕行，观察登山者动画和 T=D/v+R', next: '检验行进参数的影响',
        notes: '这页从“准备”推进到“选路”。演示关系 T=D/v+R：步速 2 km/h、休息 0.5 h，4 km 小径预计 2.5 h，6 km 绕行预计 3.5 h。它只说明路程会影响到顶时间，不等同真实论文模型；真实路线还需评估坡度、天气与安全。',
        componentId: 'mountain-map', moduleId: 'map' },
      { id: 'chap-1-climb', title: '行进参数敏感性分析', goal: '拖动三个滑块，让登山者位置、时间计算与日落反馈联动。',
        summary: '路程、步速和休息时间共同决定到达结果', interaction: '分别调路线长度、步速和休息时间，观察同一条山路和公式', next: '总结模型及适用边界',
        notes: '这页展示“多个小控件组成一个大交互”的另一种构图。三项输入共同驱动一个登山者和一个 T=D/v+R 演示关系；日落前可用时间设为 3 h。调整后山路上的位置、计算与反馈联动。路线长度可继承上一页选择的路线。这里的数字仅供示范，真实教程应替换为论文可信的变量、范围和证据。',
        componentId: 'mountain-climb', moduleId: 'climb' },
      { id: 'chap-1-summit', title: '模型总结与适用边界', goal: '从登顶风景回到时间关系，并指出生活类比不能代替论文证据。',
        summary: '回顾变量关系与类比的适用范围', interaction: '用公式解释路线与节奏，再说明类比边界', next: '',
        notes: '用山顶风景收束同一趟登山故事。引导学习者回顾整理背包、选路、调步速分别解决了什么问题；再指出演示模型和任何真实论文结果都需要分开。生成真实论文教程时，应该以论文自己的机制、公式、实验和适用条件替换这些示例内容。',
        componentId: 'mountain-summit' },
    ],
  }],
};
