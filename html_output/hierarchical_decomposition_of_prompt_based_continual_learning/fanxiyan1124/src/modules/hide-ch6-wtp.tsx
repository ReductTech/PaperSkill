import React, { useMemo, useRef, useState } from 'react';
import {
  HideBadge,
  HideBar,
  HideFormula,
  HideKeyValue,
  HideMetric,
  HideNote,
  HidePanel,
  HideScene,
  HideSegment,
  HideSymbol,
  hideClass,
} from './hide-kit';

type LambdaChoice = '0' | '0.01' | '0.1';

const lambdaTargets: Record<LambdaChoice, number> = {
  '0': 0.74,
  '0.01': 0.6,
  '0.1': 0.42,
};

const lambdaNotes: Record<LambdaChoice, string> = {
  '0': 'CR 关闭：当前任务优先保留自身边界。',
  '0.01': '弱兼容：只施加少量旧类对齐。',
  '0.1': '主实验设置：更强调旧类兼容。',
};

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

// Table 4 的真实数据：iBOT-1K Split CIFAR-100
const table4Data = {
  wtpOnly: {
    '0': 75.13,
    '0.01': 72.75,
    '0.1': 71.53,
  },
  fullModel: {
    '0': 90.15,
    '0.01': 91.18,
    '0.1': 93.35,
  },
};

export function HideCh6Wtp() {
  const [lambda, setLambda] = useState<LambdaChoice>('0.1');

  return (
    <HideScene chapter="暗房架 06 · 对比正则的权衡" cue="Table 4 揭示的 trade-off" tone="orange">
      <div className="hide-grid hide-ch6-layout">
        <HidePanel
          title="λ 的精确权衡：牺牲局部，改善全局"
          meta={`λ = ${lambda}`}
          tone="orange"
          className="hide-ch6-work-panel"
        >
          <HideSegment
            value={lambda}
            onChange={setLambda}
            label="切换对比正则权重 λ"
            options={[
              { value: '0', label: 'λ=0', note: '关闭 CR' },
              { value: '0.01', label: 'λ=0.01', note: '弱 CR' },
              { value: '0.1', label: 'λ=0.1', note: '主实验设置' },
            ]}
          />

          <div className="hide-ch6-table4">
            <div className="hide-ch6-model-comparison">
              <div className="hide-ch6-model-card">
                <h4>仅 WTP（无 TII/TAP）</h4>
                <div className="hide-ch6-bars">
                  <HideBar
                    label="λ=0"
                    value={table4Data.wtpOnly['0']}
                    tone={lambda === '0' ? 'green' : undefined}
                    note={`${table4Data.wtpOnly['0'].toFixed(2)}%`}
                  />
                  <HideBar
                    label="λ=0.01"
                    value={table4Data.wtpOnly['0.01']}
                    tone={lambda === '0.01' ? 'blue' : undefined}
                    note={`${table4Data.wtpOnly['0.01'].toFixed(2)}%`}
                  />
                  <HideBar
                    label="λ=0.1"
                    value={table4Data.wtpOnly['0.1']}
                    tone={lambda === '0.1' ? 'orange' : undefined}
                    note={`${table4Data.wtpOnly['0.1'].toFixed(2)}%`}
                  />
                </div>
                <p className="hide-ch6-trend">
                  <strong>↓ 下降 {(table4Data.wtpOnly['0'] - table4Data.wtpOnly['0.1']).toFixed(2)} 点</strong>
                  <span>λ 增大，任务内准确率下降</span>
                </p>
              </div>

              <div className="hide-ch6-model-card hide-ch6-model-card--highlight">
                <h4>完整模型（WTP + TII + TAP + CR）</h4>
                <div className="hide-ch6-bars">
                  <HideBar
                    label="λ=0"
                    value={table4Data.fullModel['0']}
                    tone={lambda === '0' ? 'green' : undefined}
                    note={`${table4Data.fullModel['0'].toFixed(2)}%`}
                  />
                  <HideBar
                    label="λ=0.01"
                    value={table4Data.fullModel['0.01']}
                    tone={lambda === '0.01' ? 'blue' : undefined}
                    note={`${table4Data.fullModel['0.01'].toFixed(2)}%`}
                  />
                  <HideBar
                    label="λ=0.1"
                    value={table4Data.fullModel['0.1']}
                    tone={lambda === '0.1' ? 'orange' : undefined}
                    note={`${table4Data.fullModel['0.1'].toFixed(2)}%`}
                  />
                </div>
                <p className="hide-ch6-trend hide-ch6-trend--up">
                  <strong>↑ 上升 {(table4Data.fullModel['0.1'] - table4Data.fullModel['0']).toFixed(2)} 点</strong>
                  <span>λ 增大，整体准确率上升</span>
                </p>
              </div>
            </div>

            <HideNote title="关键机制" tone="purple">
              <strong>为什么方向相反？</strong>
              <br /><br />
              λ 增大 → CR 更强 → 当前任务表征更靠近旧类均值 → 牺牲<strong>任务内</strong>的特异性 →
              仅 WTP 准确率下降
              <br /><br />
              但同时 → 受提示表征与旧类更兼容 → <strong>TAP（全类预测）</strong>时不易混淆 →
              完整模型准确率上升
              <br /><br />
              这就是层级设计的价值：<strong>局部牺牲，全局受益</strong>。
            </HideNote>
          </div>
        </HidePanel>

        <div className="hide-side-stack">
          <HidePanel
            title="WTP 的总目标"
            meta="主实验 τ=0.8 · λ=0.1"
            tone="orange"
            className="hide-ch6-objective-panel"
          >
            <div className="hide-ch6-objective">
              <div>
                <HideBadge tone="blue">保留分类</HideBadge>
                <strong>交叉熵</strong>
                <span>让当前任务类别仍然可分</span>
              </div>
              <b>+</b>
              <div>
                <HideBadge tone="orange">兼容旧类</HideBadge>
                <strong>λ · CR</strong>
                <span>拉向旧类均值，并推开当前批次的其他表征</span>
              </div>
            </div>
            <HideFormula
              lead="任务内预测"
              note="CR 改变当前任务提示的学习方向，不是单独替换分类器。"
            >
              L_WTP(<HideSymbol symbol="ψ" meaning="任务内与全类共享的输出层参数" />,
              <HideSymbol symbol="pₜ" meaning="任务 t 使用的提示集成结果" />)
              = L_CE + <HideSymbol symbol="λ" meaning="对比正则权重，主实验为 0.1" />
              <HideSymbol symbol="L_CR" meaning="将受提示表征拉向旧类均值并推开同批次表征的对比正则" />
            </HideFormula>
            <div className="hide-metric-pair">
              <HideMetric label="兼容记录" value="μc" tone="blue" note="旧类受提示均值" />
              <HideMetric label="推开对象" value="h′" tone="orange" note="同批次其他表征" />
            </div>
          </HidePanel>

          <HidePanel title="λ 的精确取舍" meta="FAA · iBOT-1K · Split CIFAR-100" tone="red">
            <div className="hide-ch6-tradeoff">
              <HideKeyValue label="仅 WTP" value="75.13 → 71.53" note="λ 0 → 0.1 · −3.60 点" />
              <HideKeyValue label="完整模型" value="90.15 → 93.35" note="λ 0 → 0.1 · +3.20 点" />
            </div>
            <HideNote title="方向相同，不等于普遍更优" tone="red">
              DINO-1K 在 Split CIFAR-100 上也是仅 WTP `74.99 → 70.87`，完整模型 `88.97 → 92.61`。
              较强 CR 牺牲部分任务内特异性，换取层级组合后的跨任务兼容。
            </HideNote>
          </HidePanel>
        </div>
      </div>
    </HideScene>
  );
}
