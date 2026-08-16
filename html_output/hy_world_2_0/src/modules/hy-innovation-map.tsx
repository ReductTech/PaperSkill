import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type Chain = {
  id: string;
  subsystem: string;
  problem: string;
  mechanism: string;
  effect: string;
  evidence: string;
  boundary: string;
  locator: string;
  media?: string;
};

const chains: Chain[] = [
  {
    id: 'coverage', subsystem: 'HY-Pano + WorldNav',
    problem: '单张透视图既看不到背面，也不知道下一步应该把相机预算投向哪里。',
    mechanism: '先用 HY-Pano 2.0 建立 360 度世界种子，再由 WorldNav 结合点云、语义、NavMesh 与五类轨迹主动补盲区。',
    effect: '生成器获得全局上下文，后续关键帧不再只围绕初始视点重复采样。',
    evidence: 'Figure 2、Section 3、Table 1；五类轨迹的数量与用途由论文报告。',
    boundary: '轨迹是场景感知的启发式组合，不是论文证明的全局最优规划。',
    locator: 'Figure 2 · Table 1', media: '/images/official-stage-nav.webp',
  },
  {
    id: 'consistency', subsystem: 'WorldStereo 2.0',
    problem: '多条轨迹独立生成时，同一面墙可能在不同路径中改变位置、颜色或纹理。',
    mechanism: 'Keyframe-VAE 保存跨视角细节，GGM 守住全局骨架，SSM++ 检索局部参考，再用相机条件约束目标视角。',
    effect: '全局结构与局部对应由两种记忆分工处理，回访同一区域时更稳定。',
    evidence: '记忆消融中，完整空间拼接配置达到 PSNR 21.63、SSIM 0.669、PSNRm 30.76。',
    boundary: '消融支持特定测试协议下的改进，不能推出任意长轨迹绝不漂移。',
    locator: 'WorldStereo · Table 8',
  },
  {
    id: 'scale', subsystem: 'WorldMirror 2.0',
    problem: '整数位置编码在训练外分辨率上需要外推，大视图输入还会迅速推高显存和时间。',
    mechanism: 'Normalized RoPE 将 patch 位置归一化到固定区间，Any-Modal 共享骨干联合多头输出，并用 SP、BF16、FSDP 扩展视图规模。',
    effect: '新分辨率更接近区间内插值；单次前向可同时恢复相机、点图、深度、法线与 3DGS 属性。',
    evidence: 'Table 11 的 7-Scenes 高分辨率 Acc. 误差 0.079 -> 0.037；Table 14 报告多视图效率。',
    boundary: '5.60 秒只属于 H20 四卡、128 视图重建步骤，不代表 712 秒完整生成管线。',
    locator: 'Figure 12 · Table 11/14', media: '/images/figure-12-worldmirror.png',
  },
  {
    id: 'asset', subsystem: '3DGS + WorldLens',
    problem: '直接保留全部高斯会产生冗余与漂浮物；只得到静态资产也还不能支持碰撞、光照和角色漫游。',
    mechanism: '深度线性对齐后，以非天空增密和 MaskGaussian 做概率稀疏化；生成完成后由 WorldLens 接入 IBL、碰撞代理与角色控制。',
    effect: '同一世界可保存为紧凑显式资产，并在运行时被重新照明和交互探索。',
    evidence: 'Table 9 中高斯数从 6.000M 降到 1.381M，PSNR 25.176 -> 25.023；官方仓库展示 Mesh 与角色交互。',
    boundary: '约 77% 的数量减少并非无损；官方 GIF 不是统一帧率或物理准确率基准。',
    locator: 'Table 9 · WorldLens', media: '/images/official-interactive.gif',
  },
];

const mechanismOptions = chains.map((item) => ({ id: item.id, subsystem: item.subsystem, text: item.mechanism }));

export const HyInnovationMap: React.FC<WidgetProps> = () => {
  const [problemId, setProblemId] = useState(chains[0].id);
  const [mechanismId, setMechanismId] = useState(chains[0].id);
  const selected = chains.find((item) => item.id === problemId)!;
  const selectedMechanism = mechanismOptions.find((item) => item.id === mechanismId)!;
  const matched = problemId === mechanismId;
  const alternatives = useMemo(() => mechanismOptions.filter((item) => item.id !== mechanismId), [mechanismId]);

  const chooseProblem = (id: string) => {
    setProblemId(id);
    setMechanismId(id);
  };

  return (
    <div className="innovation-workbench">
      <div className="innovation-problem-switch" role="tablist" aria-label="选择论文要解决的旧问题">
        {chains.map((item, index) => <button key={item.id} type="button" role="tab" aria-selected={problemId === item.id} className={problemId === item.id ? 'selected' : ''} onClick={() => chooseProblem(item.id)}>
          <span>问题 0{index + 1}</span><strong>{item.subsystem}</strong><small>{item.problem}</small>
        </button>)}
      </div>

      <section className="innovation-workspace" aria-live="polite">
        <article className="innovation-chain-node problem"><span>旧问题</span><p>{selected.problem}</p></article>
        <i aria-hidden="true">-&gt;</i>
        <article className={`innovation-chain-node mechanism ${matched ? 'matched' : 'mismatch'}`}>
          <span>连接机制</span><strong>{selectedMechanism.subsystem}</strong><p>{selectedMechanism.text}</p>
          <label>切换一条机制<select value={mechanismId} onChange={(event) => setMechanismId(event.target.value)}>
            <option value={mechanismId}>{selectedMechanism.subsystem}</option>
            {alternatives.map((item) => <option key={item.id} value={item.id}>{item.subsystem}</option>)}
          </select></label>
        </article>
        <i aria-hidden="true">-&gt;</i>
        <article className={`innovation-chain-node effect ${matched ? 'revealed' : ''}`}>
          <span>结果与证据</span>
          {matched ? <><p>{selected.effect}</p><b>{selected.locator}</b></> : <p>这条机制属于另一处瓶颈，不能直接支持当前问题。切换回与问题对应的子系统，证据链才会闭合。</p>}
        </article>
      </section>

      <div className={`innovation-chain-status ${matched ? 'good' : 'bad'}`}>
        <strong>{matched ? '证据链已闭合' : '机制与问题错位'}</strong>
        <span>{matched ? selected.evidence : '论文创新不是可互换的功能清单：规划、记忆、重建与运行时分别处理不同瓶颈。'}</span>
      </div>

      {matched ? <div className="innovation-proof-grid">
        <article><span>论文支持到哪里</span><p>{selected.evidence}</p></article>
        <article><span>不能外推到哪里</span><p>{selected.boundary}</p></article>
        {selected.media ? <figure><img src={selected.media} alt={`${selected.subsystem} 相关论文或官方素材`} /><figcaption>补充视觉材料；图片或 GIF 只帮助理解对应模块，不替代论文实验。</figcaption></figure> : null}
      </div> : null}

      <p className="innovation-hint">灰色提示：先选旧问题，再尝试切换连接机制。该模块不计分，只用错位反馈说明每项创新究竟解决哪一类瓶颈。</p>
    </div>
  );
};
