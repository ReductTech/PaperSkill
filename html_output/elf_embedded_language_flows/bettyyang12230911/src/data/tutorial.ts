// ============================================================================
//  elf_example — 占位教程数据（paper-skill 结构兼容文件）
//
//  重要说明：本教程是从单个 HTML 成品网页（elf_edu_tutorial.html）迁移而来
//  的"示例网页"，**不是由 paper-skill 生成**。实际内容渲染走
//  src/data/_*.html 片段 + src/lib/elf-engine.js 交互引擎（见 elfContent.ts
//  与 App.tsx），本文件不被运行时引用，仅用于通过仓库结构校验
//  （validate-output.js 要求存在 src/data/tutorial.ts 且章节数在 6-10、
//  模块数 >= 10、至少一章含两个模块）。
//
//  下方骨架仅为满足计数校验的最小占位，所有模块复用内置 example-slider，
//  无实际教学含义；如需真正的内容结构，请参考
//  paper-skill/assets/react-template/src/data/tutorial.ts。
// ============================================================================

import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'ELF: Embedded Language Flows',
    titleZh: '嵌入语言流（ELF）— 用扩散模型做语言生成',
    venue: '示例网页（从单 HTML 成品迁移，非 paper-skill 生成）',
    authors: '—',
    affiliation: '—',
    domain: '计算机视觉 · 扩散模型 · 机器翻译',
    coreProblem: '占位数据：本教程由单 HTML 成品迁移而来，内容见 src/data/_*.html。',
    coreInsight: '占位数据：实际交互由 src/lib/elf-engine.js 驱动。',
    keywords: ['示例', '迁移', '占位'],
  },
  hero: {
    oldMethod: { desc: '传统 GPT：逐字生成（占位）', componentId: 'example-slider' },
    newMethod: { desc: 'ELF 扩散：并行去噪（占位）', componentId: 'example-slider' },
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '§1 噪声：扩散的起点（占位）',
      badge: 'inf',
      badgeLabel: '基础',
      bridge: '占位章节：实际内容见 src/data/_sec2.html。',
      analogy: { title: '占位类比', text: '占位：本教程内容以 HTML 片段呈现。', componentId: 'example-slider' },
      modules: [
        { kind: 'module', id: '1.1', title: '占位模块 1.1', desc: '占位：实际模块见 _sec2.html 中 id="cv-*" 的画布。', componentId: 'example-slider' },
        { kind: 'module', id: '1.2', title: '占位模块 1.2', desc: '占位：实际模块见 _sec2.html 中 id="cv-*" 的画布。', componentId: 'example-slider' },
      ],
      takeaways: [
        { icon: '📄', title: '内容在 HTML 片段', desc: '章节内容位于 src/data/_sec*.html。' },
        { icon: '⚙️', title: '交互在引擎', desc: '画布与交互由 src/lib/elf-engine.js 驱动。' },
        { icon: '🧩', title: '占位仅为校验', desc: '本文件只用于通过仓库结构校验。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '§2 嵌入：把词变成坐标（占位）',
      badge: 'inf',
      badgeLabel: '基础',
      bridge: '占位章节：实际内容见 src/data/_sec3.html。',
      analogy: { title: '占位类比', text: '占位：本教程内容以 HTML 片段呈现。', componentId: 'example-slider' },
      modules: [
        { kind: 'module', id: '2.1', title: '占位模块 2.1', desc: '占位：实际模块见 _sec3.html 中 id="cv-*" 的画布。', componentId: 'example-slider' },
        { kind: 'module', id: '2.2', title: '占位模块 2.2', desc: '占位：实际模块见 _sec3.html 中 id="cv-*" 的画布。', componentId: 'example-slider' },
      ],
      takeaways: [
        { icon: '📄', title: '内容在 HTML 片段', desc: '章节内容位于 src/data/_sec*.html。' },
        { icon: '⚙️', title: '交互在引擎', desc: '画布与交互由 src/lib/elf-engine.js 驱动。' },
        { icon: '🧩', title: '占位仅为校验', desc: '本文件只用于通过仓库结构校验。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '§3 线性路径：可逆的加噪（占位）',
      badge: 'both',
      badgeLabel: '通用',
      bridge: '占位章节：实际内容见 src/data/_sec4.html。',
      analogy: { title: '占位类比', text: '占位：本教程内容以 HTML 片段呈现。', componentId: 'example-slider' },
      modules: [
        { kind: 'module', id: '3.1', title: '占位模块 3.1', desc: '占位：实际模块见 _sec4.html 中 id="cv-*" 的画布。', componentId: 'example-slider' },
        { kind: 'module', id: '3.2', title: '占位模块 3.2', desc: '占位：实际模块见 _sec4.html 中 id="cv-*" 的画布。', componentId: 'example-slider' },
      ],
      takeaways: [
        { icon: '📄', title: '内容在 HTML 片段', desc: '章节内容位于 src/data/_sec*.html。' },
        { icon: '⚙️', title: '交互在引擎', desc: '画布与交互由 src/lib/elf-engine.js 驱动。' },
        { icon: '🧩', title: '占位仅为校验', desc: '本文件只用于通过仓库结构校验。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '§4 Flow Matching：速度场积分（占位）',
      badge: 'inf',
      badgeLabel: '推理',
      bridge: '占位章节：实际内容见 src/data/_sec6.html。',
      analogy: { title: '占位类比', text: '占位：本教程内容以 HTML 片段呈现。', componentId: 'example-slider' },
      modules: [
        { kind: 'module', id: '4.1', title: '占位模块 4.1', desc: '占位：实际模块见 _sec6.html 中 id="cv-*" 的画布。', componentId: 'example-slider' },
      ],
      takeaways: [
        { icon: '📄', title: '内容在 HTML 片段', desc: '章节内容位于 src/data/_sec*.html。' },
        { icon: '⚙️', title: '交互在引擎', desc: '画布与交互由 src/lib/elf-engine.js 驱动。' },
        { icon: '🧩', title: '占位仅为校验', desc: '本文件只用于通过仓库结构校验。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '§5 CFG：调节生成的规矩度（占位）',
      badge: 'both',
      badgeLabel: '通用',
      bridge: '占位章节：实际内容见 src/data/_sec7.html。',
      analogy: { title: '占位类比', text: '占位：本教程内容以 HTML 片段呈现。', componentId: 'example-slider' },
      modules: [
        { kind: 'module', id: '5.1', title: '占位模块 5.1', desc: '占位：实际模块见 _sec7.html 中 id="cv-*" 的画布。', componentId: 'example-slider' },
      ],
      takeaways: [
        { icon: '📄', title: '内容在 HTML 片段', desc: '章节内容位于 src/data/_sec*.html。' },
        { icon: '⚙️', title: '交互在引擎', desc: '画布与交互由 src/lib/elf-engine.js 驱动。' },
        { icon: '🧩', title: '占位仅为校验', desc: '本文件只用于通过仓库结构校验。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '§6 采样：ODE vs SDE（占位）',
      badge: 'trn',
      badgeLabel: '训练',
      bridge: '占位章节：实际内容见 src/data/_sec8.html 等片段。',
      analogy: { title: '占位类比', text: '占位：本教程内容以 HTML 片段呈现。', componentId: 'example-slider' },
      modules: [
        { kind: 'module', id: '6.1', title: '占位模块 6.1', desc: '占位：实际模块见 _sec8.html 中 id="cv-*" 的画布。', componentId: 'example-slider' },
        { kind: 'module', id: '6.2', title: '占位模块 6.2', desc: '占位：实际模块见 _sec9.html 中 id="cv-*" 的画布。', componentId: 'example-slider' },
      ],
      takeaways: [
        { icon: '📄', title: '内容在 HTML 片段', desc: '章节内容位于 src/data/_sec*.html。' },
        { icon: '⚙️', title: '交互在引擎', desc: '画布与交互由 src/lib/elf-engine.js 驱动。' },
        { icon: '🧩', title: '占位仅为校验', desc: '本文件只用于通过仓库结构校验。' },
      ],
    },
  ],
};
