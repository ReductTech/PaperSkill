import React, { useId, useState } from 'react';
import { GlossaryText } from './Glossary';
import '../styles/real-document-cases.css';

interface CaseHotspot {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  problem: string;
  target: string;
  lesson: string;
}

interface DocumentCase {
  id: string;
  title: string;
  short: string;
  figure: string;
  sourcePage: number;
  image: string;
  width: number;
  height: number;
  alt: string;
  intro: string;
  hotspots: readonly CaseHotspot[];
}

const OMNI_PDF = 'https://arxiv.org/pdf/2412.07626';

const CASES: readonly DocumentCase[] = [
  {
    id: 'content-standard',
    short: '内容取舍',
    title: '同一页，为何会得到两种 Markdown？',
    figure: 'OmniDocBench Figure S3',
    sourcePage: 16,
    image: 'images/real-case-output-comparison.png',
    width: 1045,
    height: 540,
    alt: '真实论文页面与 Qwen2-VL、GPT-4o 两种 Markdown 输出对照，展示页眉页脚处理差异',
    intro: '文字都能识别出来仍不够：页眉、脚注和页脚应不应该进入最终输出，取决于结构定义与评测协议。',
    hotspots: [
      {
        label: '原始 PDF 的边缘区域', x: 2.5, y: 4, width: 31, height: 84,
        problem: '正文、页眉、脚注和页码同时存在。只按视觉顺序抄写，会把辅助信息混进正文。',
        target: '先识别区域类型，再决定它在结构化输出中的位置或是否保留。',
        lesson: '训练标注必须明确内容边界，否则模型即使“看见了字”，也可能学到相互冲突的输出规范。',
      },
      {
        label: '漏掉页眉的输出', x: 34.4, y: 5, width: 31.3, height: 84,
        problem: '中间输出省略了论文页眉。字符识别正确，并不代表结构选择符合目标协议。',
        target: '用类型标签和上下文决定页眉、页脚、标题与正文的角色。',
        lesson: '这正是数据准确性问题：伪标签若标准不一致，会把错误规范继续传给学生模型。',
      },
      {
        label: '保留页眉的输出', x: 66.4, y: 5, width: 31.2, height: 84,
        problem: '右侧输出保留了页眉，但仍需核对它是否符合任务要求，而不能只看字符串相似。',
        target: '评价内容、类型和结构是否一起正确，而不只是统计识别到多少字符。',
        lesson: '文档解析需要统一的标注与评测口径；这也是 MinerU2.5-Pro 同时改数据与评测的原因。',
      },
    ],
  },
  {
    id: 'layout-order',
    short: '阅读顺序',
    title: '双栏、三栏和杂志页，谁应该先读？',
    figure: 'OmniDocBench Figure S7',
    sourcePage: 19,
    image: 'images/real-case-layout-diversity.png',
    width: 1040,
    height: 555,
    alt: 'OmniDocBench 中双栏、三栏和复杂杂志版式的真实 PDF 页面示例',
    intro: '页面不是一条从上到下的文本流。模型还要恢复区域边界、类别和阅读顺序。',
    hotspots: [
      {
        label: '双栏论文', x: 2.2, y: 6, width: 31.2, height: 82,
        problem: '标题跨栏，正文分成两列，公式和图注又嵌在列内。直接按横向扫描会把两列句子交错。',
        target: '先做全局 layout 定位，再按栏和区域生成连续的结构化内容。',
        lesson: '页级 DDAS 要覆盖这种版式；元素级数据再补公式、图注等局部长尾。',
      },
      {
        label: '三栏法规', x: 34.1, y: 6, width: 31.2, height: 82,
        problem: '三列字号更小、段落更密，任何区域边界偏差都会放大后续识别错误。',
        target: '利用粗到细架构先确定全局区域，再对原分辨率裁块做局部识别。',
        lesson: '复杂布局不仅要求“看得清”，还要求训练数据包含足够多的三栏和密集页面。',
      },
      {
        label: '复杂杂志版式', x: 66.1, y: 6, width: 31.2, height: 82,
        problem: '大图、侧栏、标题和多个短文本块共同出现，阅读顺序不能由坐标简单排序。',
        target: '同时预测类别、位置和上下文关系，再组合成稳定的阅读顺序。',
        lesson: '长尾版式正是随机采样容易漏掉、DDAS 希望主动补齐的区域。',
      },
    ],
  },
  {
    id: 'table-structure',
    short: '表格结构',
    title: '识别了单元格文字，为什么表格仍可能不可用？',
    figure: 'OmniDocBench Figure S10',
    sourcePage: 20,
    image: 'images/real-case-table-structure.png',
    width: 1040,
    height: 640,
    alt: 'OmniDocBench 中旋转表格、含公式表格、彩色表格和合并单元格的真实示例',
    intro: '表格解析必须恢复行列、跨行跨列和单元格内公式；单独输出所有文字无法重建关系。',
    hotspots: [
      {
        label: '旋转表格', x: 2.2, y: 7, width: 31, height: 80,
        problem: '表格整体旋转，文字方向和行列方向不再与页面坐标一致。',
        target: '先判断方向和表格边界，再在校正后的局部区域恢复行列。',
        lesson: '训练数据需要旋转等困难属性，而不只是更多普通横向表格。',
      },
      {
        label: '公式嵌入表格', x: 34.2, y: 7, width: 31, height: 80,
        problem: '同一单元格同时包含中文、化学公式和上下标，OCR 字符串不足以表达结构。',
        target: '联合恢复 cell、row/column 关系与 LaTeX 等结构化内容。',
        lesson: '元素级采样要分别平衡公式和表格，再让模型学习二者组合出现的困难样本。',
      },
      {
        label: '彩色与合并单元格', x: 66, y: 7, width: 31.4, height: 80,
        problem: '背景颜色、图片和合并单元格会干扰线框检测，也使一对一文字匹配失真。',
        target: '恢复 rowspan、colspan 和内容归属，最后用 TEDS 等结构指标核对。',
        lesson: 'Render-then-Verify 能把隐藏的 HTML 结构错误转成可见的错位，帮助修正 Hard 标注。',
      },
    ],
  },
];

export function RealDocumentCases() {
  const [caseIndex, setCaseIndex] = useState(0);
  const [hotspotIndex, setHotspotIndex] = useState(0);
  const titleId = useId();
  const current = CASES[caseIndex];
  const hotspot = current.hotspots[hotspotIndex];

  const chooseCase = (index: number) => {
    setCaseIndex(index);
    setHotspotIndex(0);
  };

  const moveFocus = (delta: number) => {
    setHotspotIndex((index) => (index + delta + current.hotspots.length) % current.hotspots.length);
  };

  return (
    <section className="real-cases" id="real-pdf-cases" aria-labelledby={titleId}>
      <header className="real-cases__intro">
        <span className="eyebrow">真实 PDF 解析台</span>
        <h2 id={titleId}>把“OCR 识字”放回真实论文页面，会多出哪些问题？</h2>
        <p><GlossaryText text="下面三组页面来自 OmniDocBench 原论文。点击页面区域，分别观察内容取舍、阅读顺序和表格结构为什么都需要训练数据与结构化评测。" /></p>
      </header>

      <div className="real-cases__tabs" role="tablist" aria-label="选择真实 PDF 案例">
        {CASES.map((item, index) => (
          <button
            type="button"
            role="tab"
            aria-selected={index === caseIndex}
            className={index === caseIndex ? 'is-active' : ''}
            key={item.id}
            onClick={() => chooseCase(index)}
          >
            <img src={`${import.meta.env.BASE_URL}${item.image}`} width={item.width} height={item.height} loading="lazy" alt="" aria-hidden="true" />
            <span><small>案例 {index + 1}</small><b>{item.short}</b></span>
          </button>
        ))}
      </div>

      <div className="real-cases__workspace" role="tabpanel">
        <figure className="real-cases__figure">
          <div className="real-cases__image-wrap">
            <img src={`${import.meta.env.BASE_URL}${current.image}`} width={current.width} height={current.height} loading="lazy" alt={current.alt} />
            {current.hotspots.map((item, index) => (
              <button
                type="button"
                key={item.label}
                className={index === hotspotIndex ? 'is-active' : ''}
                aria-label={`查看区域：${item.label}`}
                aria-pressed={index === hotspotIndex}
                onClick={() => setHotspotIndex(index)}
                style={{
                  left: `${item.x}%`, top: `${item.y}%`,
                  width: `${item.width}%`, height: `${item.height}%`,
                }}
              >
                <i>{index + 1}</i><span>{item.label}</span>
              </button>
            ))}
          </div>
          <figcaption>
            <span className="source-tag paper">论文原图</span>
            <span>{current.figure} · PDF 第 {current.sourcePage} 页</span>
            <a href={`${OMNI_PDF}#page=${current.sourcePage}`} target="_blank" rel="noreferrer">打开来源 ↗</a>
          </figcaption>
        </figure>

        <aside className="real-cases__explain" aria-live="polite">
          <div className="real-cases__progress"><span>{hotspotIndex + 1}/{current.hotspots.length}</span><b>{hotspot.label}</b></div>
          <h3>{current.title}</h3>
          <p><GlossaryText text={current.intro} /></p>
          <dl>
            <div><dt>这里难在哪</dt><dd><GlossaryText text={hotspot.problem} /></dd></div>
            <div><dt>解析目标</dt><dd><GlossaryText text={hotspot.target} /></dd></div>
            <div><dt>对应论文机制</dt><dd><GlossaryText text={hotspot.lesson} /></dd></div>
          </dl>
          <div className="real-cases__controls">
            <button type="button" onClick={() => moveFocus(-1)} aria-label="上一个页面区域">← 上一区域</button>
            <button type="button" onClick={() => moveFocus(1)}>下一区域 →</button>
          </div>
          <p className="real-cases__boundary"><span className="source-tag teaching">教学映射</span>彩色聚焦框和机制说明为教程重绘；底图与示例类别来自论文原图。</p>
        </aside>
      </div>
    </section>
  );
}
