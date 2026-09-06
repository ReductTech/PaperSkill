import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { Notice } from './common';

type SubjectKey = 'person' | 'cup' | 'bamboo';

const subjects: Record<SubjectKey, {
  label: string;
  id: string;
  vector: string;
  mid: string[];
  high: string[];
}> = {
  person: {
    label: '人物', id: '#3F2A', vector: '[+0.41, −0.18, +0.72, …]',
    mid: ['暖色', '轮廓', '皮肤', '衣料', '竖线', '亮区', '背景', '边缘'],
    high: ['人物', '女性', '衣料', '姿态', '面部', '光照', '背景', '关系'],
  },
  cup: {
    label: '杯子', id: '#18A4', vector: '[−0.08, +0.67, +0.34, …]',
    mid: ['圆形', '硬边', '白色', '蓝纹', '高光', '弧线', '手部', '背景'],
    high: ['杯子', '陶瓷', '圆形', '手持', '饮用', '蓝白', '桌面', '关系'],
  },
  bamboo: {
    label: '竹叶', id: '#07C1', vector: '[+0.53, +0.12, −0.46, …]',
    mid: ['绿色', '细长', '尖角', '纹理', '枝线', '阴影', '密集', '背景'],
    high: ['竹叶', '绿色', '细长', '植物', '枝条', '纹理', '背景', '关系'],
  },
};

const rawIds = ['#7A', '#18', '#E2', '#4C', '#90', '#31', '#B7', '#0D'];

export const SemanticTokenizerV4: React.FC<WidgetProps> = () => {
  const [semantic, setSemantic] = useState(74);
  const [selected, setSelected] = useState<SubjectKey>('cup');
  const subject = subjects[selected];
  const semanticScore = Math.round(40 + semantic * 0.55);
  const detailScore = Math.round(96 - semantic * 0.38);
  const tiles = useMemo(() => {
    if (semantic > 66) return subject.high;
    if (semantic > 33) return subject.mid;
    return [subject.id, ...rawIds.slice(1)];
  }, [semantic, subject]);

  const choose = (key: SubjectKey) => {
    setSelected(key);
    setSemantic((value) => Math.max(value, 74));
  };

  return (
    <div className="ll-widget tokenizer-lab-v41">
      <div className="tokenizer-preview-v41">
        <div className="patch-scene" aria-label="带 3×3 网格的图像块示意图，可点选人物、杯子和竹叶">
          <span className="patch-scene__grid" aria-hidden="true" />
          {(Object.keys(subjects) as SubjectKey[]).map((key) => (
            <button key={key} type="button" className={`patch-hotspot is-${key} ${selected === key ? 'is-selected' : ''}`} aria-pressed={selected === key} onClick={() => choose(key)}>
              {key === 'person' ? '人' : key === 'cup' ? '杯' : '竹'}
            </button>
          ))}
          <small>图像块（Patch）</small>
        </div>

        <div className="vq-arrow-explain" aria-hidden="true"><b>语义量化 →</b><small>VQ（向量量化）在 16,384 个码本向量中检索最近匹配</small></div>

        <div className="semantic-output">
          <div className="selection-readout">
            <div><small>当前 Patch</small><b>{subject.label}</b></div>
            <div><small>Token ID</small><b>{subject.id}</b></div>
            <div><small>2048 维向量（节选）</small><b>{subject.vector}</b></div>
          </div>
          <div className="semantic-code-grid">
            {tiles.map((label, index) => <span key={`${label}-${index}`} className={index === 0 ? 'is-match' : ''}>{label}</span>)}
          </div>
        </div>
      </div>

      <div className="semantic-slider">
        <div className="semantic-slider__title"><b>语义侧重</b><output>{semantic}%</output></div>
        <input aria-label="调整语义侧重" type="range" min="0" max="100" value={semantic} onChange={(event) => setSemantic(Number(event.target.value))} />
        <div className="semantic-slider__ends"><span><b>0%</b> 原始离散编号</span><span><b>100%</b> 高层语义对齐</span></div>
      </div>

      <div className="tokenizer-stats">
        <article><small>语义可读性</small><strong>{semanticScore}%</strong><span>教学示意</span></article>
        <article><small>细节示意</small><strong>{detailScore}%</strong><span>语义侧重提高时，像素细节可能减少</span></article>
        <article className="is-fixed"><small>论文 Codebook</small><strong>16,384</strong><span>每码 2048 维</span><em>码本总容量固定，不随滑杆变化</em></article>
      </div>

      <Notice tone="orange">滑杆仅用于解释“原始编号 → 高层语义”的变化，不是在修改论文模型参数。点击左侧 Patch 会联动 Token ID、向量节选与右侧语义格。</Notice>
    </div>
  );
};
