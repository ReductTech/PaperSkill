import { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type Tab = {
  id: string;
  label: string;
  srcImg: string;
  srcAlt: string;
  tags: { label: string; value: string }[];
  prompt: string;
  note: string;
};

const TABS: Tab[] = [
  {
    id: 't2i',
    label: '文本生成图像',
    srcImg: '/s4/src-t2i.png',
    srcAlt: '夕阳下的女孩参考图',
    tags: [
      { label: '用户标签', value: '女孩' },
      { label: '场景描述', value: '夕阳 / 山头' },
      { label: '风格标签', value: '油画 / 暖色调 / 8K' },
    ],
    prompt: '一位女孩站在夕阳下的山头，油画风格，暖色调，8K 高清。',
    note: '描述对象、属性、空间关系、场景和风格，形成可直接训练的生成提示。',
  },
  {
    id: 'edit',
    label: '图像编辑',
    srcImg: '/s4/src-edit.png',
    srcAlt: '草地上的房屋编辑参考图',
    tags: [
      { label: '源图描述', value: '绿色草地 / 房屋 / 树木' },
      { label: '目标描述', value: '雪地 / 房屋 / 树木' },
      { label: '变化区域', value: '地面从草地变为雪地' },
    ],
    prompt: '把绿色草地改成雪地，保持房屋和树木不变。',
    note: '比较源图与目标意图，生成简洁、局部明确的编辑指令。',
  },
  {
    id: 'subject',
    label: '主题个性化',
    srcImg: '/s4/src-subject.png',
    srcAlt: '戴红色贝雷帽的女性参考图',
    tags: [
      { label: '身份特征', value: '发型 / 面部特征 / 姿态' },
      { label: '服装描述', value: '红色贝雷帽 / 黑色大衣' },
      { label: '一致性要求', value: '保持人物身份不变' },
    ],
    prompt: '把这位戴红色贝雷帽、穿黑色大衣的女性放到埃菲尔铁塔前，保持发型和面部特征一致。',
    note: '先抽取主体身份，再组合新场景，避免个性化训练里主体漂移。',
  },
  {
    id: 'panel',
    label: '多面板',
    srcImg: '/s4/src-panel.png',
    srcAlt: '四格漫画分镜参考图',
    tags: [
      { label: '全局排列', value: '2 x 2 网格' },
      { label: '面板数量', value: '4 格' },
      { label: '时序关系', value: 'P1 -> P2 -> P3 -> P4' },
    ],
    prompt: '四格漫画：P1 主角走进房间，P2 家人为主角庆祝生日，P3 主角感到很惊喜，P4 主角和家人拥抱在一起。',
    note: '同时标注全局布局和每个面板的差异，让模型学会按顺序生成故事板。',
  },
  {
    id: 'graphic',
    label: '图形排版',
    srcImg: '/s4/src-graphic.png',
    srcAlt: '促销海报排版参考图',
    tags: [
      { label: 'OCR 文本', value: '春季大促 / 活动时间' },
      { label: '布局线索', value: '顶部标题 / 三列商品 / 底部二维码' },
      { label: '风格标签', value: '促销 / 蓝色主色' },
    ],
    prompt: '海报：顶部蓝色标题“春季大促”，中间三列商品图，底部二维码和活动时间。',
    note: '保留关键文字、阅读顺序和版式结构，服务含文字的图形生成任务。',
  },
];

export function AnnotationWorkshopSection(_props: WidgetProps) {
  return (
    <section className="annotation-section">
      <div className="annotation-section-head">
        <span>4.1</span>
        <h2>Qwen3-VL 智能标注工坊</h2>
      </div>
      <div className="annotation-section-body">
        <p>
          根据生成、编辑和多模态理解等任务，自动产出不同格式的训练提示。点击上方任务类型，查看对应的源图、输入信息与输出提示。
        </p>
        <AnnotationWorkshop />
      </div>
    </section>
  );
}

function AnnotationWorkshop() {
  const [activeId, setActiveId] = useState(TABS[0].id);
  const active = useMemo(() => TABS.find((tab) => tab.id === activeId) ?? TABS[0], [activeId]);

  return (
    <div className="annotation-workshop">
      <div role="tablist" aria-label="任务类型" className="annotation-tabs">
        {TABS.map((tab) => {
          const selected = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={selected ? 'is-active' : ''}
              onClick={() => setActiveId(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="annotation-layout">
        <div className="annotation-col">
          <span className="annotation-label">源图</span>
          <div className="annotation-src-frame">
            <img src={active.srcImg} alt={active.srcAlt} />
          </div>
          <p>{active.srcAlt}</p>
        </div>

        <div className="annotation-col">
          <span className="annotation-label">输入信息</span>
          <ul className="annotation-tags">
            {active.tags.map((tag) => (
              <li key={tag.label}>
                <b>{tag.label}</b>
                <span>{tag.value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="annotation-col">
          <span className="annotation-label">输出提示</span>
          <blockquote className="annotation-prompt">{active.prompt}</blockquote>
          <p>{active.note}</p>
        </div>
      </div>
    </div>
  );
}
