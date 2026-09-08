import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Domain = 'poster' | 'game' | 'portrait' | 'product' | 'anime';
type PromptForm = 'keyword' | 'natural' | 'instruction' | 'detailed';

interface DomainExample {
  label: string;
  image: string;
  alt: string;
  caption: string;
  sourceLabel: string;
  sourceUrl: string;
  license: string;
  prompts: Record<PromptForm, string>;
}

const FORM_META: Record<PromptForm, { label: string; note: string }> = {
  keyword: { label: '关键词式', note: '只保留主体、属性和风格词，短而密集。' },
  natural: { label: '自然请求', note: '像用户直接提出需求，允许省略部分构图细节。' },
  instruction: { label: '指令式', note: '用明确动作和约束告诉模型要生成什么。' },
  detailed: { label: '详细构图', note: '补充主体位置、镜头、光线、色彩和画面层次。' },
};

const FORM_ORDER: PromptForm[] = ['keyword', 'natural', 'instruction', 'detailed'];

const EXAMPLES: Record<Domain, DomainExample> = {
  poster: {
    label: '海报设计',
    image: `${import.meta.env.BASE_URL}images/sft-poster.png`,
    alt: '法国枫丹白露复古旅行海报，水面黑天鹅、宫殿和秋日树林',
    caption: '一幅法国枫丹白露旅行海报：黑天鹅掠过水面，远处是宫殿与秋日树林。',
    sourceLabel: 'GDJ · Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Vintage_Travel_Poster_Fontainebleau_Paris_France.svg',
    license: 'CC0',
    prompts: {
      keyword: '复古旅行海报、法国宫殿、黑天鹅、秋日树林、蓝橙配色、竖版。',
      natural: '请帮我做一张法国小镇主题的复古旅行海报，画面里要有水面、宫殿和一只飞过的黑天鹅。',
      instruction: '生成竖版旅行海报：保留底部大标题，让黑天鹅位于前景，宫殿和秋色树林放在远景。',
      detailed: '竖版复古丝网印刷风格；低机位望向湖面，黑天鹅从画面中央掠过，金色宫殿与橙褐树林形成远景，天空留出大面积蓝色负空间，底部使用粗衬线标题。',
    },
  },
  game: {
    label: '游戏截图',
    image: `${import.meta.env.BASE_URL}images/sft-game.jpg`,
    alt: '开源即时战略游戏 0 A.D. 的俯视角城镇截图',
    caption: '一张俯视角即时战略游戏截图：山谷中的聚落、农田、道路和底部操作界面清晰可见。',
    sourceLabel: '0 A.D. Developers · Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:0_A.D._Alpha_23.jpg',
    license: 'CC BY-SA 3.0',
    prompts: {
      keyword: '即时战略游戏、俯视视角、山谷聚落、农田、资源栏、单位面板。',
      natural: '我想要一张古代城市经营游戏的截图，能看到村庄、农田、山地和完整的游戏界面。',
      instruction: '生成 RTS 游戏截图：使用高位俯视镜头，中央放置聚落和农田，顶部显示资源栏，底部显示地图与单位操作面板。',
      detailed: '16:9 游戏截图，高位斜俯视角；白色石砌聚落沿道路分布，麦田位于画面中央，森林和岩石山脉围合远景；顶部排列资源数值，左下角放圆形小地图，底部保留深色单位控制栏。',
    },
  },
  portrait: {
    label: '人像摄影',
    image: `${import.meta.env.BASE_URL}images/sft-portrait.jpg`,
    alt: '棕褐色历史棚拍女性肖像照片及其相纸背面',
    caption: '一张棕褐色历史肖像：人物正面凝视镜头，穿高领礼服，照片保留旧相纸边缘。',
    sourceLabel: 'SMU Central University Libraries · Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Bust_portrait_of_African_American_woman_(5433310329).jpg',
    license: 'No known restrictions',
    prompts: {
      keyword: '历史人像、女性半身像、正面凝视、棕褐色调、旧相纸、柔和棚拍光。',
      natural: '请生成一张有年代感的女性肖像，人物看向镜头，整体像保存完好的老照片。',
      instruction: '生成复古棚拍半身肖像：人物居中正视镜头，保留高领服装和旧相纸边缘，使用棕褐单色。',
      detailed: '四分之三半身构图，人物严格居中并直视镜头；柔和正面棚光刻画面部，深色高领礼服与浅色背景形成层次；使用低饱和棕褐色冲印质感，四周保留磨损和波浪形相纸边缘。',
    },
  },
  product: {
    label: '产品摄影',
    image: `${import.meta.env.BASE_URL}images/sft-product.jpg`,
    alt: '布满冷凝水滴的绿色喷雾瓶微距产品照片',
    caption: '一张绿色喷雾瓶的微距产品照片，瓶身覆盖水滴，背景深暗且虚化。',
    sourceLabel: 'A S M Jobaer · Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:A_close-up_artistic_shot_of_a_spray_bottle_featuring_condensation_droplets,_highlighting_its_texture_and_fine_details._01.jpg',
    license: 'CC BY-SA 4.0',
    prompts: {
      keyword: '喷雾瓶、微距、水滴、翠绿色、黑色背景、商业产品摄影。',
      natural: '帮我拍一张清凉感很强的喷雾瓶产品图，重点表现瓶身上的冷凝水珠。',
      instruction: '生成微距产品照片：让绿色喷雾瓶占满画面，清晰呈现水滴纹理，并将背景压暗虚化。',
      detailed: '横向微距商业摄影，镜头贴近弧形瓶身；密集冷凝水珠在硬质侧光下形成高光，主体使用饱和翠绿色，四周渐变至黑色，景深极浅，仅中央水滴保持锐利。',
    },
  },
  anime: {
    label: '动漫内容',
    image: `${import.meta.env.BASE_URL}images/sft-anime.png`,
    alt: '樱花背景中橙色长发猫耳少女的动漫插画',
    caption: '一幅明亮动漫插画：橙色长发猫耳少女站在栏杆旁，背景有蓝天和飘落的樱花。',
    sourceLabel: 'Niabot · Wikimedia Commons',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Anime_Girl.svg',
    license: 'CC BY 3.0',
    prompts: {
      keyword: '动漫少女、橙色长发、猫耳、樱花、蓝天、栏杆、清新高饱和。',
      natural: '请画一位橙色长发的猫耳少女，她站在户外栏杆旁，周围有樱花花瓣飘过。',
      instruction: '生成日系动漫插画：猫耳少女回头看向镜头，一只手向前伸，背景加入蓝天、栏杆和飞舞的樱花。',
      detailed: '横向日系赛璐璐插画；橙色长发猫耳少女位于画面中央偏右，身体沿栏杆形成对角线并回头微笑，前伸的手产生近大远小透视；浅蓝天空和虚化樱花树构成背景，粉色花瓣穿过前景。',
    },
  },
};

export const Ch5SftWidget: React.FC<WidgetProps> = () => {
  const [domain, setDomain] = useState<Domain>('poster');
  const [promptForm, setPromptForm] = useState<PromptForm>('natural');
  const example = EXAMPLES[domain];
  const domainOrder = Object.keys(EXAMPLES) as Domain[];

  return (
    <div className="sft-style-explorer">
      <div
        className="chip-row"
        role="radiogroup"
        aria-label="选择重点领域图片"
        onKeyDown={(event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
          event.preventDefault();
          const delta = event.key === 'ArrowRight' ? 1 : -1;
          setDomain(domainOrder[(domainOrder.indexOf(domain) + delta + domainOrder.length) % domainOrder.length]);
        }}
      >
        {domainOrder.map((item) => (
          <button
            key={item}
            type="button"
            className={`chip ${domain === item ? 'selected' : ''}`}
            role="radio"
            aria-checked={domain === item}
            onClick={() => setDomain(item)}
          >
            {EXAMPLES[item].label}
          </button>
        ))}
      </div>

      <div className="sft-example-grid" key={domain}>
        <figure className="sft-example-image">
          <img src={example.image} alt={example.alt} />
          <figcaption>
            <strong>原始图像描述</strong>
            <span>{example.caption}</span>
            <a href={example.sourceUrl} target="_blank" rel="noreferrer">
              {example.sourceLabel} · {example.license}
            </a>
          </figcaption>
        </figure>

        <div className="sft-prompt-stack" role="radiogroup" aria-label="同一图片的四种用户表达">
          {FORM_ORDER.map((form, index) => (
            <button
              key={form}
              type="button"
              className={`sft-prompt-card ${promptForm === form ? 'selected' : ''}`}
              style={{ animationDelay: `${index * 70}ms` }}
              role="radio"
              aria-checked={promptForm === form}
              onClick={() => setPromptForm(form)}
            >
              <span className="sft-prompt-label">{FORM_META[form].label}</span>
              <span className="sft-prompt-copy">{example.prompts[form]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="hotspot-info">
        <b>{FORM_META[promptForm].label}</b> · {FORM_META[promptForm].note}
        <br />
        左侧图片保持不变，右侧只改变用户如何描述它。
      </div>
      <div className="feedback good" aria-live="polite">
        SFT 在训练期让同一视觉内容对应多种用户表达，从而提高模型面对真实提示词时的鲁棒性。
      </div>
    </div>
  );
};

export default Ch5SftWidget;
