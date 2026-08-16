import React from 'react';

export type PaperTableId = 'table-1' | 'table-4' | 'table-8' | 'table-9' | 'table-10' | 'table-11' | 'table-12' | 'table-14';

type PaperTableSpec = {
  number: number;
  title: string;
  scope: string;
  headers: string[];
  rows: string[][];
  note: string;
  page: number;
  emphasisRows?: number[];
  emphasisColumns?: number[];
};

const tables: Record<PaperTableId, PaperTableSpec> = {
  'table-1': {
    number: 1,
    title: 'WorldNav 五类轨迹细节',
    scope: '完整表格',
    headers: ['条件', '常规', '环绕', '重建感知', '漫游', '航拍', '总计'],
    rows: [
      ['最大数量', '9', '5', '10', '3', '8', '35'],
      ['绑定对象', '否', '是', '是', '否', '-', '-'],
      ['迭代执行', '否', '否', '是', '否', '否', '-'],
    ],
    note: '航拍类别包含环绕与漫游轨迹。环绕、重建感知轨迹的最大数量由全景图中检测到的对象分割数量决定。',
    page: 8,
    emphasisColumns: [2, 3],
  },
  'table-4': {
    number: 4,
    title: '图像到全景（I2P）定量比较',
    scope: 'I2P 子表',
    headers: ['指标（均为越高越好）', 'CubeDiff', 'GenEx', 'HY-World 1.0', 'HY-Pano 2.0'],
    rows: [
      ['CLIP-I', '0.828', '0.831', '0.831', '0.844'],
      ['Q-Align 质量（透视）', '2.938', '2.917', '3.317', '4.026'],
      ['Q-Align 质量（等距柱状）', '3.814', '3.868', '4.076', '4.277'],
      ['Q-Align 美学（透视）', '2.319', '2.445', '2.638', '3.208'],
      ['Q-Align 美学（等距柱状）', '3.645', '3.646', '3.767', '4.056'],
    ],
    note: '论文还报告了文本到全景（T2P）子表。这里搬入与本章 I2P 交互直接对应的全部五项指标；每张全景会投影为 12 个透视面参与 Persp 评估。',
    page: 23,
    emphasisColumns: [4],
  },
  'table-8': {
    number: 8,
    title: 'WorldStereo 2.0 记忆与蒸馏消融',
    scope: '完整表格；PSNRm / SSIMm 在有效 warp mask 内计算',
    headers: ['配置', 'PSNR ↑', 'SSIM ↑', 'LPIPS ↓', 'PSNRm ↑', 'SSIMm ↑', 'RotErr ↓', 'TransErr ↓', 'ATE ↓'],
    rows: [
      ['相机控制基线', '16.13', '0.474', '0.349', '28.81', '0.448', '0.396', '0.053', '0.071'],
      ['A · GGM + SSM++', '20.94', '0.640', '0.170', '30.27', '0.623', '0.407', '0.047', '0.046'],
      ['B · 可训练 FFN', '21.56', '0.667', '0.162', '30.44', '0.624', '0.351', '0.036', '0.035'],
      ['C · 点云增强', '21.36', '0.632', '0.163', '30.72', '0.619', '0.360', '0.050', '0.053'],
      ['D · 检索帧增强', '20.86', '0.639', '0.165', '30.66', '0.636', '0.322', '0.049', '0.067'],
      ['E · 相机嵌入', '21.06', '0.639', '0.164', '30.58', '0.617', '0.329', '0.042', '0.048'],
      ['A* · 时间拼接 SSM', '19.83', '0.581', '0.219', '29.77', '0.571', '0.545', '0.087', '0.114'],
      ['F · batch size 64', '21.63', '0.669', '0.156', '30.76', '0.647', '0.296', '0.036', '0.041'],
      ['G · 后蒸馏', '21.84', '0.669', '0.165', '30.93', '0.656', '0.316', '0.052', '0.072'],
    ],
    note: 'A* 只把空间拼接替换为时间拼接，全部指标均退化。F 是论文最终记忆模型，G 是后蒸馏模型；增强会牺牲少量干净数据指标，但用于提高推理时面对不完美点云与检索帧的鲁棒性。',
    page: 28,
    emphasisRows: [1, 6, 7, 8],
  },
  'table-9': {
    number: 9,
    title: '3DGS 组件消融',
    scope: '完整表格，10 个场景平均',
    headers: ['体素降采样', '自适应增密', 'MaskGaussian', '高斯数', 'PSNR ↑', 'SSIM ↑', 'LPIPS ↓'],
    rows: [
      ['-', '-', '-', '6.000M', '25.176', '0.751', '0.209'],
      ['是', '-', '-', '1.000M', '24.504', '0.720', '0.276'],
      ['是', '是', '-', '5.254M', '25.158', '0.750', '0.210'],
      ['是', '是', '是', '1.383M', '25.017', '0.747', '0.216'],
      ['是', '是，仅非天空区域', '是', '1.381M', '25.023', '0.747', '0.215'],
    ],
    note: '评估使用 10 个场景、每场景 20 个验证视角。完整配置相对 6.000M 基线减少约 77% 高斯，但 PSNR 与 LPIPS 并非完全不变。',
    page: 29,
    emphasisRows: [4],
  },
  'table-10': {
    number: 10,
    title: '单个世界生成的分阶段耗时',
    scope: '完整表格，NVIDIA H20',
    headers: ['阶段', '全景生成', '轨迹规划', '世界扩展', '重建与对齐', '3DGS', '总计'],
    rows: [
      ['耗时（秒）', '15', '182', '286', '102', '127', '712'],
    ],
    note: '论文将这组 NVIDIA H20 评测描述为单个世界生成的端到端运行时间。712 秒约为 11.9 分钟；它与 WorldLens 生成后资产的实时渲染、碰撞和角色交互属于不同阶段。',
    page: 31,
    emphasisColumns: [6],
  },
  'table-11': {
    number: 11,
    title: '7-Scenes 点图重建',
    scope: '7-Scenes 子表，WorldMirror 1.0/2.0 行',
    headers: ['模型', '输入设置', 'Acc. 均值 ↓', 'Acc. 中位数 ↓', 'Comp. 均值 ↓', 'Comp. 中位数 ↓'],
    rows: [
      ['WorldMirror 1.0', 'L', '0.043', '0.029', '0.055', '0.029'],
      ['WorldMirror 1.0', 'L + 全部先验', '0.021', '0.014', '0.026', '0.016'],
      ['WorldMirror 1.0', 'M', '0.043', '0.026', '0.049', '0.028'],
      ['WorldMirror 1.0', 'M + 全部先验', '0.018', '0.011', '0.023', '0.014'],
      ['WorldMirror 1.0', 'H', '0.079', '0.052', '0.087', '0.051'],
      ['WorldMirror 1.0', 'H + 全部先验', '0.042', '0.024', '0.041', '0.024'],
      ['WorldMirror 2.0', 'L', '0.041', '0.027', '0.052', '0.027'],
      ['WorldMirror 2.0', 'L + 全部先验', '0.019', '0.012', '0.024', '0.014'],
      ['WorldMirror 2.0', 'M', '0.033', '0.020', '0.046', '0.026'],
      ['WorldMirror 2.0', 'M + 全部先验', '0.013', '0.008', '0.017', '0.011'],
      ['WorldMirror 2.0', 'H', '0.037', '0.025', '0.040', '0.023'],
      ['WorldMirror 2.0', 'H + 全部先验', '0.012', '0.008', '0.016', '0.010'],
    ],
    note: 'L/M/H 分别为 182×252、378×518、756×1036。“全部先验”表示额外输入相机位姿、内参和深度。Acc. 与 Comp. 都是误差，越低越好。',
    page: 34,
    emphasisRows: [4, 10],
  },
  'table-12': {
    number: 12,
    title: '相机姿态、深度与新视角合成',
    scope: '完整左右子表合并；缺少对应任务报告时记为 -',
    headers: ['方法', 'AUC@30 ↑', 'RTA@30 ↑', 'AbsRel ↓', 'δ<1.25 ↑', 'NVS PSNR ↑', 'NVS SSIM ↑', 'NVS LPIPS ↓'],
    rows: [
      ['Fast3R', '61.68', '81.86', '0.353', '0.666', '-', '-', '-'],
      ['CUT3R', '81.47', '95.10', '0.260', '0.704', '-', '-', '-'],
      ['FLARE', '80.01', '95.23', '0.445', '0.551', '15.84', '0.545', '0.500'],
      ['VGGT', '77.62', '93.13', '0.256', '0.789', '-', '-', '-'],
      ['π3', '85.90', '95.62', '0.151', '0.805', '-', '-', '-'],
      ['AnySplat', '-', '-', '-', '-', '18.57', '0.626', '0.255'],
      ['WorldMirror 1.0 (L)', '80.55', '93.68', '0.225', '0.751', '20.38', '0.658', '0.163'],
      ['WorldMirror 1.0 (M)', '86.13', '95.47', '0.178', '0.812', '21.34', '0.709', '0.181'],
      ['WorldMirror 1.0 (H)', '66.29', '89.62', '0.195', '0.797', '17.78', '0.659', '0.379'],
      ['WorldMirror 2.0 (L)', '83.43', '94.79', '0.199', '0.770', '20.14', '0.679', '0.149'],
      ['WorldMirror 2.0 (M)', '86.48', '95.55', '0.167', '0.806', '20.07', '0.680', '0.186'],
      ['WorldMirror 2.0 (H)', '86.89', '95.34', '0.162', '0.815', '19.98', '0.726', '0.235'],
    ],
    note: '相机姿态与深度在 RealEstate10K 上评估；NVS 是 RealEstate10K 与 DL3DV 的平均。基线方法按 M 分辨率评估，WorldMirror 报告 L/M/H。正文给出的姿态/深度 L=189×259、M=378×518、H=756×1036；“-”表示该方法未在对应子表报告，不代表不支持。',
    page: 34,
    emphasisRows: [8, 11],
  },
  'table-14': {
    number: 14,
    title: 'WorldMirror 2.0 推理效率',
    scope: '完整表格，518×378，NVIDIA H20',
    headers: ['配置', 'GPU 数', '32 视图显存', '32 视图时间', '64 视图显存', '64 视图时间', '128 视图显存', '128 视图时间', '256 视图显存', '256 视图时间'],
    rows: [
      ['Baseline（FP32，单卡）', '1', '24.95 GB', '2.45 s', '38.56 GB', '6.27 s', '59.26 GB', '18.00 s', 'OOM', 'OOM'],
      ['+ BF16', '1', '15.10 GB', '2.11 s', '25.06 GB', '5.65 s', '41.73 GB', '16.96 s', '75.05 GB', '56.96 s'],
      ['+ SP（2 卡）', '2', '26.32 GB', '1.59 s', '41.31 GB', '3.73 s', '64.75 GB', '10.53 s', 'OOM', 'OOM'],
      ['+ SP（4 卡）', '4', '25.55 GB', '1.09 s', '39.71 GB', '2.38 s', '61.53 GB', '6.27 s', 'OOM', 'OOM'],
      ['+ SP + BF16（4 卡）', '4', '15.81 GB', '0.96 s', '26.44 GB', '2.21 s', '44.47 GB', '5.65 s', '80.54 GB', '17.69 s'],
      ['+ SP + BF16 + FSDP（4 卡）', '4', '14.04 GB', '0.93 s', '24.67 GB', '2.20 s', '42.71 GB', '5.60 s', '78.78 GB', '17.52 s'],
    ],
    note: '显存是每张 GPU 的占用，时间是墙钟时间。5.60 秒只对应 128 视图重建步骤，不代表 712 秒的完整世界生成管线已经实时化。',
    page: 37,
    emphasisRows: [5],
    emphasisColumns: [6, 7],
  },
};

export const PaperTable: React.FC<{ tableId: PaperTableId; defaultOpen?: boolean }> = ({ tableId, defaultOpen = false }) => {
  const table = tables[tableId];

  return (
    <details className="paper-table" open={defaultOpen}>
      <summary>
        <span>论文表 {table.number}</span>
        <strong>{table.title}</strong>
        <small>{table.scope}</small>
        <em className="paper-table-hint">点击此处展开/收起论文原表；表格过宽时可左右滑动查看完整数据</em>
      </summary>
      <div className="paper-table-body">
        <div className="paper-table-scroll" tabIndex={0} aria-label={`论文表 ${table.number}：${table.title}`}>
          <table>
            <thead>
              <tr>
                {table.headers.map((header, columnIndex) => (
                  <th key={header} className={table.emphasisColumns?.includes(columnIndex) ? 'is-emphasis' : ''}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr key={`${tableId}-${rowIndex}`} className={table.emphasisRows?.includes(rowIndex) ? 'is-emphasis' : ''}>
                  {row.map((cell, columnIndex) => (
                    columnIndex === 0
                      ? <th key={columnIndex} scope="row">{cell}</th>
                      : <td key={columnIndex} className={table.emphasisColumns?.includes(columnIndex) ? 'is-emphasis' : ''}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>{table.note}</p>
        <a href="https://arxiv.org/abs/2604.14268" target="_blank" rel="noreferrer">原论文第 {table.page} 页 ↗</a>
      </div>
    </details>
  );
};

type OfficialGifProps = {
  src: string;
  title: string;
  caption: string;
  alt: string;
};

export const OfficialGif: React.FC<OfficialGifProps> = ({ src, title, caption, alt }) => (
  <figure className="official-gif">
    <img src={src} alt={alt} loading="lazy" decoding="async" />
    <figcaption>
      <strong>{title}</strong>
      <span>{caption}</span>
      <a href="https://github.com/Tencent-Hunyuan/HY-World-2.0" target="_blank" rel="noreferrer">腾讯混元官方仓库素材 ↗</a>
    </figcaption>
  </figure>
);

type EvidenceMediaDrawerProps = {
  mediaType: '论文原图' | '官方架构图' | '官方 GIF';
  src: string;
  title: string;
  caption: string;
  alt: string;
  sourceUrl?: string;
  sourceLabel?: string;
};

export const EvidenceMediaDrawer: React.FC<EvidenceMediaDrawerProps> = ({
  mediaType,
  src,
  title,
  caption,
  alt,
  sourceUrl = 'https://arxiv.org/abs/2604.14268',
  sourceLabel = '查看原始来源 ↗',
}) => (
  <details className="evidence-media-drawer">
    <summary>
      <div><span>{mediaType}</span><strong>{title}</strong><small>灰色提示：点击展开图片或 GIF；素材用于核对真实结构与效果，不替代论文定量结果。</small></div>
      <b>点击展开</b>
    </summary>
    <figure>
      <img src={src} alt={alt} loading="lazy" decoding="async" />
      <figcaption><p>{caption}</p><a href={sourceUrl} target="_blank" rel="noreferrer">{sourceLabel}</a></figcaption>
    </figure>
  </details>
);
