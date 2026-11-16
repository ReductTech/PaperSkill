const original = 'https://www.di.ens.fr/~fbach/iccv09_mairal.pdf';
const bm3d = 'https://webpages.tuni.fi/foi/GCF-BM3D/index.html';
const groupSC = 'https://www.ecva.net/papers/eccv_2020/papers_ECCV/papers/123670239.pdf';
const extremeRaw = 'https://openaccess.thecvf.com/content_CVPR_2020/html/Wei_A_Physics-Based_Noise_Formation_Model_for_Extreme_Low-Light_Raw_CVPR_2020_paper.html';
const rawChallenge = 'https://openaccess.thecvf.com/content/ICCV2025W/AIM/html/Li_AIM_2025_Challenge_on_Real-World_RAW_Image_Denoising_ICCVW_2025_paper.html';
const adaBoost = 'https://www.sciencedirect.com/science/article/pii/S002200009791504X';
const sonyPixelShift = 'https://support.d-imaging.sony.co.jp/app/imagingedge/en/instruction/1_2_about_psm.php';
const nikonDemosaicing = 'https://www.nikon.com/company/technology/technology_fields/software_and_systems/image_processing_engine/';

function Source({ href, children }: { href: string; children: string }) {
  return <a className="paper-source" href={href} target="_blank" rel="noreferrer">{children} ↗</a>;
}

export function CriticalReview() {
  return (
    <div className="critical-review">
      <section aria-labelledby="critical-limits">
        <h4 id="critical-limits">LSSC 的优势和适用边界</h4>
        <div className="critical-cards">
          <div>
            <h5>重复纹理提供约束</h5>
            <p>共享字典原子让相似块保留共同纹样，各块仍可用不同系数。匹配、原子选择与融合都可检查。</p>
            <p>强噪声可能干扰匹配，孤立结构也难找到可靠邻居。若不相似的块被分到一组，共享原子可能带来纹理误差。这是由模型机制作出的推断。</p>
            <Source href={original}>原文 §3.1–3.3</Source>
          </div>
          <div>
            <h5>真实 RAW 的证据有限</h5>
            <p>原文在手动缩放通道后，用用户估计的全局 σ 近似噪声。真实传感器的噪声会随亮度、相机和拍摄条件变化。</p>
            <p>三张实拍都来自 Canon PowerShot G9、ISO 1600。作者做的是定性比较，并指出第三张背景仍保留一部分噪声。</p>
            <div className="critical-links">
              <Source href={original}>原文 §4.3 和图 4</Source>
              <Source href={extremeRaw}>RAW 噪声模型</Source>
            </div>
          </div>
          <div>
            <h5>字典适配增加计算量</h5>
            <p>方法包含离线字典学习、图块匹配和逐图求解。原文在一张 256 × 256 的 peppers 合成噪声图上报告，SC 为 0.5 秒，LSC 为 85 秒，LSSC 为 220 秒。</p>
            <p>这些时间来自原文的质量优先设置与 Intel Q9450 测试机，适合说明引入适配和联合编码的成本。</p>
            <Source href={original}>原文 §4.1</Source>
          </div>
        </div>
      </section>

      <section aria-labelledby="critical-methods">
        <h4 id="critical-methods">和其他去噪方法比较</h4>
        <div className="critical-comparison">
          <article>
            <h5>BM3D · 经典非局部基线</h5>
            <p>两者都匹配相似图块。BM3D 用预设变换和协同滤波，省去逐图学习字典。LSSC 学习适合输入的字典，并让同组图块共享所用原子。</p>
            <p>原文表 2 在 12 张标准图、合成白高斯噪声 σ = 25 的条件下，LSSC 为 <strong>29.74 dB</strong>，BM3D 为 <strong>29.72 dB</strong>。优势随噪声档位而变。</p>
            <div className="critical-links">
              <Source href={bm3d}>BM3D 作者页</Source>
              <Source href={original}>原文表 2</Source>
            </div>
          </article>
          <article>
            <h5>ELD · 极低照度 RAW 去噪</h5>
            <p>Wei 等人用传感器和读出电子噪声模型合成训练数据，针对极低照度下的真实 RAW。LSSC 仍有显式先验和可检查的中间步骤。</p>
            <p>两类方法各有代价。LSSC 依赖可靠的块匹配及合理的噪声参数。物理噪声模型依赖传感器噪声特性的估计，训练结果也要用跨机型数据验证。</p>
            <Source href={extremeRaw}>Wei 等，CVPR 2020</Source>
          </article>
        </div>
      </section>

      <section aria-labelledby="critical-followups">
        <h4 id="critical-followups">从这篇论文出发的工作</h4>
        <div className="critical-lineage">
          <div>
            <h5>直接延续 · GroupSC</h5>
            <p>Lecouat、Ponce 和 Mairal 保留非局部自相似与组稀疏，用连续的相似度权重构造可微的组收缩，并展开迭代进行端到端训练。</p>
            <p>该论文表 3 在 BSD68 灰度图、合成噪声 σ = 25 下报告 LSSC 为 <strong>28.71 dB</strong>、GroupSC 为 <strong>29.20 dB</strong>。这组结果评价灰度合成去噪。</p>
            <Source href={groupSC}>Lecouat 等，ECCV 2020 §3 与表 3</Source>
          </div>
          <div>
            <h5>相关进展 · 跨机型 RAW 评估</h5>
            <p>AIM 2025 的真实 RAW 去噪挑战用多机型和多场景检验方法的泛化，给评估原文单一机型、单一 ISO 的个案提供了可借鉴的协议。</p>
            <Source href={rawChallenge}>AIM 2025 挑战报告</Source>
          </div>
        </div>
      </section>

      <details className="critical-question">
        <summary>汇报讨论 · 怎样验证换相机后仍然有效？</summary>
        <p>选取多个相机与 ISO 下的含噪 RAW 和低噪参考，固定输入归一化和后续显影。保留原版 LSSC，再分别更换噪声方差模型与匹配规则，每次改一个因素。</p>
        <p>同时记录 RAW 域 PSNR、平坦区残噪、纹理区域误差和每张处理时间。把易匹配和难匹配的样例分开看，才能判断改善来自噪声建模还是匹配。</p>
        <a className="paper-source" href="#experiments">回看方差加权的教学对照 →</a>
      </details>
    </div>
  );
}

export function CriticalReflections() {
  return (
    <div className="critical-review critical-reflections">
      <section aria-labelledby="reflection-combine">
        <h5 id="reflection-combine">组合技术，先看各自能补上什么</h5>
        <p>单独看一个含噪图块，稀疏编码可能选到恰好与这块噪声相似的原子。LSSC 先借助非局部匹配找到其他含有同类纹样的图块，再让这些块共同选原子、各自估计系数。<strong>相似图块提供多份结构证据，稀疏约束则限制需要多少种原子来解释这些观测。</strong></p>
        <p>这让我想到人工智能导论里的 <strong>AdaBoost（自适应提升）</strong>。它逐轮训练弱分类器，对本轮分错的样本提高相对权重，让下一轮更关注这些难例，最后由各轮分类器加权投票。AdaBoost 组合的是分类器的判断，LSSC 结合的是恢复同一幅图像的两种先验。</p>
        <p>两种方法给我的启发是，组合前先说明各部分能解决什么问题，再对照单独使用与组合使用的结果。论文里的 LSC 对图块独立编码，LSSC 在字典适配和重建时都利用相似组。比较两者的去噪效果和耗时，可以看出引入分组后整套方案的收益和成本。</p>
        <div className="critical-links">
          <Source href={original + '#page=3'}>LSSC 原文 §3</Source>
          <Source href={adaBoost}>Freund 与 Schapire · AdaBoost</Source>
        </div>
      </section>

      <section aria-labelledby="reflection-demosaicing">
        <h5 id="reflection-demosaicing">像素位移已经能采更多颜色，为什么还需要去马赛克？</h5>
        <p>采用 Bayer 彩色滤镜阵列的相机，在单次曝光中每个感光位置只记录 R、G、B 之一。比如绿色位置只测到绿色强度。要从这帧 RAW 输出全彩图，还需要估计该位置的红色和蓝色。</p>
        <p><strong>像素位移用多次曝光增加实测信息。</strong> 相机在连拍之间微移传感器，同一景物位置就会先后落到不同颜色的滤镜下。在四帧整像素位移方案中，同一位置可以得到一份 R、两份 G 和一份 B 采样，合成时能利用这些 RGB 测量。它适合稳定机位下的静物，主体移动或光线变化可能造成合成伪影。</p>
        <p>目前主流彩色相机仍采用彩色滤镜阵列。从这样的单帧 RAW 生成全彩图，仍需去马赛克。2009 年论文讨论的两个问题因此仍有现实意义。已测颜色带噪声，另外两个颜色需要估计，今天的 RAW 恢复仍然要解决这两个问题。</p>
        <div className="critical-links">
          <Source href={sonyPixelShift}>索尼 · 像素位移拍摄</Source>
          <Source href={nikonDemosaicing}>尼康 · 颜色重建</Source>
          <a className="paper-source" href="#bayer-raw">回看 Bayer 采样 →</a>
        </div>
      </section>

      <section aria-labelledby="reflection-noise">
        <h5 id="reflection-noise">真实噪声偏离高斯白噪声，为什么 LSSC 还能有效？</h5>
        <p><strong>论文用全局 σ 决定拟合时允许多大的残差。</strong> 即使噪声偏离高斯，只要各处的噪声强度差异有限，全局 σ 仍能提供大致合理的误差尺度。</p>
        <p>如果相似块还能可靠分组，一条真实边缘就会在多块中为同一原子提供证据。各块的随机扰动通常缺少这种一致性，稀疏编码也限制了为零散扰动引入的原子数。最后融合重叠图块，还能减弱部分随机残差。</p>
        <p>原文的实拍流程也做了粗略适配。作者手动缩放 R、G、B 采样，使三通道的噪声看起来大致相当，然后用统一的 σ 在 Bayer 数据上去噪，再进行去马赛克。这个顺序减少了去马赛克先把噪声扩散到其他位置和通道的影响。实验只比较了三张实拍图的视觉效果，第三张背景仍有部分噪声。</p>
        <p>更贴近传感器的噪声模型有望进一步改善结果。用随亮度和通道变化的方差给残差加权，可以减少对高噪声观测的过度拟合，并帮助低噪声区域保留细纹理。强噪声会干扰匹配，重复出现的条纹也可能被当成纹理保留。论文把非均匀噪声建模列为后续工作，具体收益需要在真实 RAW 上做对照验证。</p>
        <div className="critical-links">
          <Source href={original + '#page=7'}>原文 §4.3–5</Source>
          <a className="paper-source" href="#experiments">第七节 · 方差加权教学实验 →</a>
        </div>
      </section>
    </div>
  );
}
