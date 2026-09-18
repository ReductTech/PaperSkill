import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const SECTIONS = [
  {
    id: 'author',
    label: '作者简介',
    title: 'Robert Dilworth',
    note: '要点：先记住作者与系列来源；引用本文时按 CC BY 4.0 保留署名。',
    items: [
      '密西西比州立大学计算机科学与工程系，联系邮箱 rkd103@msstate.edu。',
      '研究方向为对抗性文体计量、作者归属与文本隐写。',
      '本文属于 TraceTarnish 系列研究。前作与预印本编号：Tuning for TraceTarnish（arXiv:2512.03465）、Unveiling Unicode\u2019s Unseen Underpinnings（arXiv:2508.15840）、Hijacking Text Heritage（arXiv:2604.10271）、StegoStylo（arXiv:2601.09056）。',
      '论文原文：<a href="https://arxiv.org/abs/2607.24411" target="_blank" rel="noreferrer noopener">arXiv:2607.24411v2 — Occluded Oculus: Operationalizing Stylistic Obscurement</a>。许可协议为 CC BY 4.0，允许转载与改编，需保留署名。',
    ],
  },
  {
    id: 'purpose',
    label: '研究目的与方法',
    title: '哪个模块最能击穿作者归属？',
    note: '要点：理解「消融 + 对照」的实验设计，三项评估维度都是定性描述。',
    items: [
      '目的：在公开、不加密的匿名写作场景下，判断翻译、混淆、模仿、注入四个模块中哪一个最能击穿作者归属，以及单点是否足够。',
      '方法：对四模块的全部 15 种非空组合做消融，另以未改写原文为对照；用 R 包 stylo 的 classify() 在 Gilmore / Hughes / May 三人语料上评估，测试文本是 Hughes 的 A Cypherpunk\u2019s Manifesto。',
      '补充验证：附录再用 imposters()、crossv()、十种距离度量、PCA、层次聚类与 bootstrap 共识树交叉核对。',
      '评估维度：语义完整度（Soundness）、可读性（Sensibility）、安全度（Safety）——论文以定性方式描述这三项，未给出数值评分。',
    ],
  },
  {
    id: 'novelty',
    label: '创新点与口径',
    title: '证明注入既必要又充分',
    note: '要点：注入既必要又充分；引用排序时须注明用的是正文口径还是附录口径。',
    items: [
      '创新点：首次把四个模块做系统消融，发现注入单点即可翻转归属——Hughes 的文本被改判为 May；移除注入后，其余七种组合全部无法造成误判。',
      '创新点：把注入进一步拆成 Liminal Injection 与 Doppelgänger Injection 比较，发现同形字替换更强（距离 4.0035–4.4665，零宽字符为 2.4142–2.8363）。',
      '正文口径（PCA / 聚类 / bootstrap）：注入 > 模仿 > 混淆 > 翻译。',
      '附录口径（全文 crossv() 与 imposters() 分数）：注入 > 模仿 > 翻译 > 混淆。两种口径取决于距离度量与文本长度，翻译与混淆本就接近，引用时必须注明。',
    ],
  },
  {
    id: 'limits',
    label: '局限与伦理',
    title: '论文自陈的边界',
    note: '要点：结论限于英文检测系统，且是以读屏体验为代价换来的隐私。',
    items: [
      '结论主要针对英文检测系统；其它语言（尤其使用多种书写系统的语言）泛化性未知。',
      '同形字并非处处隐形：不同字体与环境下会暴露 Unicode，某些软件会显式显示零宽字符。',
      '攻击依赖平台接受多语言文本并保留零宽字符；一旦平台做常规 Unicode 预处理，注入即可被中和。',
      '伦理代价明确：注入会损害屏幕阅读器与视障用户体验，作者承认这一权衡可能超过隐私动机。',
      '只测试了 100% 最大注入比例；且作者承认翻译、混淆、模仿都还没有充分调优，注入的优势可能部分源于调优差异。',
      '注入会留下共同痕迹，使用者本身会聚成一个可被识别的群体。',
    ],
  },
  {
    id: 'related',
    label: '延伸阅读',
    title: '相关工作',
    note: '要点：四篇相关工作依次是奠基工作、地下论坛、Unicode 水印与可解释混淆。',
    items: [
      'Brennan, Afroz & Greenstadt 2012, ACM TISSEC 15(3):1–22：对抗性文体计量的奠基工作，doi 10.1145/2382448.2382450。',
      'Afroz, Islam, Stolerman, Greenstadt & McCoy 2014, IEEE S&P:212–226：Doppelgänger Finder，把文体计量引入地下论坛，doi 10.1109/SP.2014.21。',
      'Rizzo, Bertini & Montesi 2016, IDEAS \u201916:97–104：通过 Unicode 同形字替换做内容保持的文本水印，doi 10.1145/2938503.2938510。',
      'Fisher et al. 2024, EMNLP:4172–4206：StyleRemix，可解释的作者混淆方法，doi 10.18653/v1/2024.emnlp-main.241。',
    ],
  },
];

export const Ch10Mod2: React.FC<WidgetProps> = () => {
  const [sectionId, setSectionId] = useState('author');
  const section = SECTIONS.find((s) => s.id === sectionId) || SECTIONS[0];

  return (
    <div>
      <div className="ctrl chips">
        {SECTIONS.map((s) => (
          <button key={s.id} className={'chip' + (sectionId === s.id ? ' selected' : '')} onClick={() => setSectionId(s.id)}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="detail-panel" style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>{section.title}</div>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          {section.items.map((it, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: it }} />
          ))}
        </ul>
      </div>
      <div className="feedback">{section.note}</div>
    </div>
  );
};

export default Ch10Mod2;
