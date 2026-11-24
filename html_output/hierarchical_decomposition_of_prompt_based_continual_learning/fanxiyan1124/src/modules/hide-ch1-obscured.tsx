import React, { useState } from 'react';
import {
  HideBadge,
  HideBar,
  HideFigure,
  HideNote,
  HidePanel,
  HideScene,
  HideSegment,
} from './hide-kit';

type Pretrain = 'sup' | 'ibot';

const schemes = ['L2P', 'DualPrompt', 'S-Prompt++', 'CODA-Prompt'] as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function HideCh1Obscured() {
  const [pretrain, setPretrain] = useState<Pretrain>('ibot');

  // 论文 Figure 2(c) 的真实 CKA 数据
  const ckaCifar = pretrain === 'sup' ? 0.743 : 0.928;
  const ckaImageNet = pretrain === 'sup' ? 0.498 : 0.774;

  const cue = pretrain === 'sup'
    ? '监督预训练：CKA 低，提示写入了任务知识'
    : '自监督预训练：CKA 高，提示难以写入任务知识';

  return (
    <HideScene chapter="暗房架 01 · 次优性被遮蔽" cue={cue} tone={pretrain === 'sup' ? 'blue' : 'orange'}>
      <div className="hide-grid hide-ch1-layout">
        <HidePanel
          title="核心观察：CKA 相似度揭示的问题"
          meta={pretrain === 'sup' ? 'Sup-21K' : 'iBOT-21K'}
          tone={pretrain === 'sup' ? 'blue' : 'orange'}
          className="hide-ch1-stage-panel"
        >
          <HideSegment
            value={pretrain}
            onChange={setPretrain}
            label="切换预训练范式对比"
            options={[
              { value: 'sup', label: 'Sup-21K', note: '监督预训练' },
              { value: 'ibot', label: 'iBOT-21K', note: '自监督预训练' },
            ]}
          />

          <div className="hide-ch1-metrics">
            <HideBar
              label="CIFAR-100 CKA"
              value={ckaCifar * 100}
              tone={ckaCifar < 0.8 ? 'green' : 'orange'}
              note={`${ckaCifar.toFixed(3)} ${ckaCifar < 0.8 ? '✓ 提示有效' : '✗ 提示受限'}`}
            />
            <HideBar
              label="ImageNet-R CKA"
              value={ckaImageNet * 100}
              tone={ckaImageNet < 0.7 ? 'green' : 'orange'}
              note={`${ckaImageNet.toFixed(3)} ${ckaImageNet < 0.7 ? '✓ 提示有效' : '✗ 提示受限'}`}
            />
          </div>

          <HideNote title="CKA 相似度的含义" tone="purple">
            CKA (Centered Kernel Alignment) 衡量<strong>未受提示表征</strong>与<strong>受提示表征</strong>的相似程度。
            <br />
            <strong>CKA 低（如 Sup-21K 的 0.743）：</strong>提示改变了表征，任务知识被写入。
            <br />
            <strong>CKA 高（如 iBOT-21K 的 0.928）：</strong>提示几乎不改变表征，任务知识难以写入。
          </HideNote>

          <div className="hide-ch1-comparison">
            <div className="hide-ch1-method-card">
              <h4>L2P / DualPrompt / S-Prompt 的范式切换</h4>
              <div className="hide-ch1-method-flow">
                <span>
                  <b>Sup-21K</b>
                  <small>性能接近饱和</small>
                </span>
                <i>→</i>
                <span>
                  <b>iBOT-21K</b>
                  <small>性能大幅下降</small>
                </span>
              </div>
            </div>
            <div className="hide-ch1-insight">
              <HideBadge tone="orange">关键洞察</HideBadge>
              <p>表面的高性能掩盖了底层问题：提示参数没有有效地编码任务特定知识。</p>
            </div>
          </div>
        </HidePanel>

        <div className="hide-side-stack">
          <HidePanel
            title="论文证据"
            meta="Figure 2(c)(d)"
            tone="blue"
            className="hide-ch1-evidence-panel"
          >
            <div className="hide-figure-pair hide-ch1-evidence-pair">
              <HideFigure
                src="./images/fig2-cka.png"
                alt="Figure 2(c) acquisition of task specificity CKA similarity"
                caption="Fig.2(c) · CKA 相似度对比"
                tone="blue"
              />
              <HideFigure
                src="./images/fig2-task-id.png"
                alt="Figure 2(d) prediction of task identity"
                caption="Fig.2(d) · 任务身份预测准确率"
                tone="orange"
              />
            </div>
          </HidePanel>

          <HidePanel
            title="为什么监督预训练掩盖了问题？"
            meta="单头补偿效应"
            tone="purple"
            className="hide-ch1-mechanism-panel"
          >
            <HideNote title="两种预训练下的机制" tone="blue">
              <div className="hide-ch1-mechanism-rows">
                <div>
                  <strong>Sup-21K · 问题被遮住</strong>
                  <span>CKA 低 → TII 高 → 单头补偿仍可维持表面性能</span>
                </div>
                <div>
                  <strong>iBOT-21K · 次优性暴露</strong>
                  <span>CKA 高 → TII &lt;40% → 单头输出层难以弥补编码不足</span>
                </div>
              </div>
              <p className="hide-ch1-mechanism-takeaway">
                S-Prompt++ 使用单头输出层，即使任务身份预测准确率低于 40%，仍能达到相当的性能。
                这说明<strong>用错提示不会立刻毁掉分类结果</strong>，表面性能掩盖了底层的任务知识编码不足问题。
              </p>
            </HideNote>
          </HidePanel>
        </div>
      </div>
    </HideScene>
  );
}
