import React from 'react';
import type { WidgetProps } from './registry';

export const ProsCons: React.FC<WidgetProps> = () => (
  <div className="pros-cons-layout">
    <p className="pros-cons-summary">PE-Field 4D将ViPE估计的源视频几何转换为参考Token在目标视角下的位置编码，并通过几何感知联合注意力引导Wan2.1在改变相机轨迹时保持内容与空间结构对齐。</p>
    <div className="pros-cons-grid">
      <section className="pros-cons-column" aria-label="PE-Field 4D的优点">
        <h3>优点</h3>
        <div className="pros-cons-item">
          <strong>更准确的几何对应关系</strong>
          <p>把参考Token在目标视角中的投影位置写入位置编码，使目标Token能够按照对齐的位置检索参考内容，减少模型自行猜测空间关系。</p>
        </div>
        <div className="pros-cons-item">
          <strong>保留预训练视频生成能力</strong>
          <p>通过LoRA微调，将位置编码作为编码接口，轻量修改且兼容原模型的生成能力。</p>
        </div>
      </section>

      <section className="pros-cons-column" aria-label="PE-Field 4D的缺点">
        <h3>缺点</h3>
        <div className="pros-cons-item">
          <strong>计算量与显存占用增加（重大缺陷）</strong>
          <p>为解决时间压缩歧义，每张源帧需要形成独立Context Latent，由此产生的额外Token既增加显存占用，又增加计算成本。</p>
        </div>
        <div className="pros-cons-item">
          <strong>依赖外部几何估计</strong>
          <p>投影位置依赖深度和相机位姿；ViPE等几何估计出现误差时，错误会继续传入位置编码，最终造成不完整的空间对齐。</p>
        </div>
      </section>
    </div>
  </div>
);

export default ProsCons;
