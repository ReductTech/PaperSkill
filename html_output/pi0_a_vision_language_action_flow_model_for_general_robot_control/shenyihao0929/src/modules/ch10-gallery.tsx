import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// Module 10.2 — 画廊与告示 (DOM gallery, no canvas). Figure-12 is a static
// collage, so the seven master tasks are browsed as chips + a text card; the
// module figure shows the full collage poster. Below it: the three
// red-bordered limitation notices the authors posted themselves, plus the
// official blog link. No video elements in this tutorial.

interface GalleryItem {
  name: string;
  note: string;
}

const ITEMS: GalleryItem[] = [
  { name: '叠皱衣', note: '柔性布料带褶皱，最吃手感' },
  { name: '纸箱组装', note: '折页合箱，精细对位' },
  { name: '装鸡蛋', note: '易碎品，最怕失手' },
  { name: '外带盒', note: '装盒扣盖，一步不能差' },
  { name: '新物收拾', note: '没见过的物件照收不误' },
  { name: '卸烘干机', note: '开门取衣，多阶段连贯' },
  { name: '移动叠衣', note: '叠好还要端走，长程再加一程' },
];

const NOTICES: { title: string; text: string }[] = [
  {
    title: '配方未明',
    text: '数据怎么组配仍是开放问题，作者把手头数据全用上。',
  },
  {
    title: '并非全可靠',
    text: '不是所有任务都稳定，数据需求不可预测。',
  },
  {
    title: '边界未试',
    text: '驾驶、导航、足式等更异质域留待未来。',
  },
];

const cardStyle: React.CSSProperties = {
  margin: '6px auto 14px',
  padding: '14px 22px',
  maxWidth: 520,
  background: '#fff',
  border: '1px solid #d7deea',
  borderRadius: 10,
  textAlign: 'center',
};
const noticeTextStyle: React.CSSProperties = {
  color: '#5c6b82',
  fontSize: 13,
  lineHeight: 1.6,
  marginTop: 4,
};

export const Ch10Gallery: React.FC<WidgetProps> = () => {
  const [sel, setSel] = useState(0);
  const item = ITEMS[sel];

  return (
    <div>
      <div className="chip-row">
        {ITEMS.map((it, i) => (
          <button
            key={it.name}
            className={`chip${i === sel ? ' selected' : ''}`}
            onClick={() => setSel(i)}
          >
            {it.name}
          </button>
        ))}
      </div>
      <div style={cardStyle}>
        <div style={{ fontSize: 19, fontWeight: 700, color: '#21324a' }}>
          {item.name}
          <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 600, color: '#228d5c' }}>
            5-20 分钟 · 得分过半
          </span>
        </div>
        <div style={{ marginTop: 6, color: '#68778f' }}>{item.note}</div>
      </div>
      <div className="three-col-demo">
        {NOTICES.map((n) => (
          <div className="three-col-panel noisy" key={n.title}>
            <div className="three-col-label">
              <b>{n.title}</b>
            </div>
            <div style={noticeTextStyle}>{n.text}</div>
          </div>
        ))}
      </div>
      <p style={{ textAlign: 'center', marginTop: 10, fontSize: 14 }}>
        视频与更多信息：
        <a href="https://physicalintelligence.company/blog/pi0" target="_blank" rel="noopener noreferrer">
          physicalintelligence.company/blog/pi0
        </a>
      </p>
      <div className="feedback">看的分，也看的边界——下一座窑（π0.5/0.6/0.7）已在路上。</div>
    </div>
  );
};

export default Ch10Gallery;
