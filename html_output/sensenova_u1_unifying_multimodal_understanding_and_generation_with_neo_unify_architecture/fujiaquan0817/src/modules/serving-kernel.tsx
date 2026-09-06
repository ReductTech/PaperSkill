import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type QueryMode = 'textBefore' | 'image' | 'textAfter';

const tokens = ['T', 'T', 'T', 'I', 'I', 'I', 'T', 'T', 'T', 'T'] as const;
const imageEnd = 5;

const modes = {
  textBefore: {
    title: '图前文本行',
    query: 2,
    containsImage: false,
    rule: '标准 causal：只能读取当前位置及其前文。',
    decision: '当前 M-block 不含图像 token，保持 causal K range。',
    feedback: '纯文本块保留标准因果快路；纯文本请求可以回退到 vanilla FlashAttention3。',
  },
  image: {
    title: '图像行',
    query: 4,
    containsImage: true,
    rule: '读取全部文本前缀，并在同一图像 span 内双向读取。',
    decision: '当前 M-block 含图像 token，把 K range 扩展到 image-span end。',
    feedback: '扩展只服务于图像行；行级图像标记仍保证文本行遵守因果规则。',
  },
  textAfter: {
    title: '图后文本行',
    query: 7,
    containsImage: false,
    rule: '仍按 causal 读取，但此前的图像 token 已属于历史前文。',
    decision: '当前文本 M-block 不含新的图像 token，继续使用 causal K range。',
    feedback: '图像之后的文本行仍是因果注意力，不会读取未来文本。',
  },
} satisfies Record<QueryMode, {
  title: string;
  query: number;
  containsImage: boolean;
  rule: string;
  decision: string;
  feedback: string;
}>;

function canAttend(query: number, key: number) {
  if (tokens[query] === 'I') return key <= imageEnd;
  return key <= query;
}

export const ServingKernel: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<QueryMode>('image');
  const current = modes[mode];

  return (
    <div className="kernel-lab">
      <div className="kernel-lab-head">
        <div>
          <p className="training-map-kicker">论文 Figure 6 · Hybrid Attention Kernel</p>
          <h4>先判断 Query 行，再决定 M-block 的 Key 范围</h4>
        </div>
        <p>文本行保持因果读取；图像行读取文本前缀和完整图像 span。</p>
      </div>

      <div className="ctrl" role="radiogroup" aria-label="选择注意力 Query 行">
        {(Object.keys(modes) as QueryMode[]).map((item) => (
          <button key={item} type="button" role="radio" aria-checked={mode === item} onClick={() => setMode(item)}>
            {modes[item].title}
          </button>
        ))}
      </div>

      <div className="kernel-layout">
        <section className="kernel-sequence">
          <h5>① 序列与 token 类型</h5>
          <div className="kernel-token-row">
            {tokens.map((token, index) => (
              <div key={index} className={`${token === 'I' ? 'is-image' : 'is-text'} ${index === current.query ? 'is-query' : ''}`}>
                <small>{index}</small>
                <strong>{token}</strong>
              </div>
            ))}
          </div>
          <div className="kernel-legend">
            <span><i className="is-text" />T = 文本 token</span>
            <span><i className="is-image" />I = 图像 token</span>
            <span><i className="is-query" />当前 Query：{current.query}</span>
          </div>

          <h5>② 注意力矩阵</h5>
          <div className="kernel-matrix" role="img" aria-label={`10×10 注意力矩阵，当前高亮第 ${current.query} 行`}>
            <span className="kernel-axis-corner">Q\K</span>
            {tokens.map((_, key) => <span key={`kh-${key}`} className="kernel-axis">{key}</span>)}
            {tokens.map((queryToken, query) => (
              <React.Fragment key={`row-${query}`}>
                <span className={`kernel-axis ${query === current.query ? 'is-selected' : ''}`}>{query}</span>
                {tokens.map((_, key) => {
                  const allowed = canAttend(query, key);
                  const expanded = queryToken === 'I' && key > query && allowed;
                  return (
                    <span
                      key={`${query}-${key}`}
                      className={`kernel-cell ${allowed ? 'is-allowed' : 'is-blocked'} ${expanded ? 'is-expanded' : ''} ${query === current.query ? 'is-selected-row' : ''}`}
                      title={`Q${query} → K${key}：${allowed ? '允许' : '阻断'}`}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          <p className="kernel-rule"><strong>{current.title}：</strong>{current.rule}</p>
        </section>

        <section className="kernel-decision">
          <h5>③ 每个 M-block 的内核判定</h5>
          <ol>
            <li>
              <span>输入边界</span>
              <strong>读取行级图像标记与 b_image_token_end</strong>
              <small>图像 span 的末端位置为 {imageEnd}</small>
            </li>
            <li className={current.containsImage ? 'is-yes' : 'is-no'}>
              <span>条件判断</span>
              <strong>当前 M-block 是否含图像 token？</strong>
              <small>{current.containsImage ? 'Yes · 进入混合注意力路径' : 'No · 保留文本快路'}</small>
            </li>
            <li className={current.containsImage ? 'is-yes' : 'is-no'}>
              <span>Key 范围</span>
              <strong>{current.containsImage ? '扩展到 image-span end' : '保持 causal K range'}</strong>
              <small>{current.decision}</small>
            </li>
          </ol>

          <div className="kernel-backends">
            <div><span>Triton</span><p>更容易集成该混合掩码机制。</p></div>
            <div><span>修改的 FA3</span><p>论文报告其吞吐更高。</p></div>
          </div>
        </section>
      </div>

      <div className={`feedback ${current.containsImage ? '' : 'good'}`} aria-live="polite">{current.feedback}</div>
      <p className="note">注意：内核只在含图像的 M-block 扩展必要的 Key 范围；这不意味着文本行可以读取未来文本。纯文本请求仍走 vanilla FA3 快路。</p>
    </div>
  );
};

export default ServingKernel;
