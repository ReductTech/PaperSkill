import React, { useMemo, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';

type Method = 'ranpac' | 'l2p';
type Width = '10000' | '2000';

export function RpCh8Parameters() {
  const [method, setMethod] = useState<Method>('ranpac');
  const [width, setWidth] = useState<Width>('10000');
  const values = useMemo(() => {
    if (method === 'l2p') {
      return {
        frozen: '无同构固定板',
        classWeights: '按方法结构而异',
        trainable: '约 0.3M-0.5M',
        frozenBar: 8,
        classBar: 18,
        trainableBar: 16,
        plateCount: 1,
        ledgerCount: 4,
        feedback: 'L2P 的可训练结构不同，不能只按一个参数条比较方法优劣。',
      };
    }
    const narrow = width === '2000';
    return {
      frozen: narrow ? '约 2M 量级' : '约 10M 量级',
      classWeights: narrow ? '约 200×M（约 0.4M 量级）' : '约 200×M（约 2M 量级）',
      trainable: '约 2.0-2.5M',
      frozenBar: narrow ? 20 : 100,
      classBar: narrow ? 20 : 100,
      trainableBar: 90,
      plateCount: narrow ? 2 : 6,
      ledgerCount: narrow ? 4 : 20,
      feedback: narrow
        ? '存储与类权重缩小到约五分之一，但宽度消融显示准确率下降。'
        : '约 10M 冻结 RP 权重，分类权重约为原始维数的 10 倍，总可训练参数约 2-2.5M（依 PETL 方法）。',
    };
  }, [method, width]);

  const chooseMethod = (next: Method) => {
    setMethod(next);
  };

  return (
    <div className="rp-widget rp-parameters-widget">
      <section className="rp-panel rp-parameter-visual">
        <div className="rp-panel-heading">
          <span>{method === 'ranpac' ? '随机板柜与类权重账本' : '方法结构对照'}</span>
          <strong>按论文讨论估算</strong>
        </div>

        <div className="rp-parameter-scale">
          <div className="rp-plate-cabinet" aria-label={`固定投影板显示 ${values.plateCount} 层，仅表示相对存储`}>
            <div className="rp-cabinet-label">
              <span>冻结随机板</span>
              <b>{method === 'ranpac' ? `M=${width}` : '无同构固定板'}</b>
            </div>
            <div className="rp-plate-stack">
              {Array.from({ length: 6 }, (_, index) => (
                <span
                  key={index}
                  className={index < values.plateCount ? 'is-visible' : ''}
                  style={{ transform: `translateY(${index * -9}px) rotate(${index % 2 ? 0.8 : -0.8}deg)` }}
                />
              ))}
            </div>
          </div>

          <div className="rp-ledger-board" aria-label="类权重账本格数，仅表示相对规模">
            <div className="rp-cabinet-label">
              <span>前向类权重</span>
              <b>{values.classWeights}</b>
            </div>
            <div className="rp-parameter-ledger">
              {Array.from({ length: 20 }, (_, index) => (
                <i key={index} className={index < values.ledgerCount ? 'is-visible' : ''} />
              ))}
            </div>
          </div>
        </div>

        <div className="rp-parameter-note">
          <span><SymbolHint meaning="原始冻结特征维数，论文讨论中取 768">L</SymbolHint> = 768</span>
          <span><SymbolHint meaning="已见类别数，论文讨论中取 200">K</SymbolHint> = 200</span>
          <span><SymbolHint meaning="随机投影宽度，决定冻结随机板与类权重的规模">M</SymbolHint>{method === 'ranpac' ? ` = ${width}` : ' 不适用'}</span>
        </div>
      </section>

      <section className="rp-panel rp-parameter-controls">
        <div className="rp-parameter-groups">
          <div>
            <span className="rp-control-label">方法</span>
            <div className="rp-segmented" role="group" aria-label="选择比较方法">
              <button
                type="button"
                className={method === 'ranpac' ? 'is-active' : ''}
                aria-pressed={method === 'ranpac'}
                onClick={() => chooseMethod('ranpac')}
              >
                RanPAC
              </button>
              <button
                type="button"
                className={method === 'l2p' ? 'is-active' : ''}
                aria-pressed={method === 'l2p'}
                onClick={() => chooseMethod('l2p')}
              >
                L2P
              </button>
            </div>
          </div>

          <div className={method === 'l2p' ? 'rp-control-disabled' : ''}>
            <span className="rp-control-label">投影宽度</span>
            <div className="rp-segmented" role="group" aria-label="选择投影宽度">
              <button
                type="button"
                disabled={method === 'l2p'}
                className={method === 'ranpac' && width === '10000' ? 'is-active' : ''}
                aria-pressed={method === 'ranpac' && width === '10000'}
                onClick={() => setWidth('10000')}
              >
                M=10000
              </button>
              <button
                type="button"
                disabled={method === 'l2p'}
                className={method === 'ranpac' && width === '2000' ? 'is-active' : ''}
                aria-pressed={method === 'ranpac' && width === '2000'}
                onClick={() => setWidth('2000')}
              >
                M=2000
              </button>
            </div>
          </div>
        </div>

        <div className="rp-parameter-cards">
          <article>
            <span>冻结 RP 存储</span>
            <strong>{values.frozen}</strong>
            <i><b style={{ width: `${values.frozenBar}%` }} /></i>
          </article>
          <article>
            <span>前向类权重规模</span>
            <strong>{values.classWeights}</strong>
            <i><b style={{ width: `${values.classBar}%` }} /></i>
          </article>
          <article>
            <span>总可训练参数</span>
            <strong>{values.trainable}</strong>
            <i><b style={{ width: `${values.trainableBar}%` }} /></i>
          </article>
        </div>

        <div className="rp-comparison-warning">
          <strong>比较边界</strong>
          <span>这些是参数与存储规模，不是精确总参数量、延迟或能耗测量。</span>
        </div>
        <div className={`rp-feedback ${method === 'l2p' ? 'is-orange' : width === '2000' ? 'is-blue' : 'is-green'}`}>
          <strong>{method === 'l2p' ? 'L2P 对照' : `RanPAC · M=${width}`}</strong>
          <span>{values.feedback}</span>
        </div>
      </section>
    </div>
  );
}
