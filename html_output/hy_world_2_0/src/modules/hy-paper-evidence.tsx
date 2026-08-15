import React from 'react';

export type PaperTableId = 'table-1' | 'table-4' | 'table-9' | 'table-11' | 'table-14';

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
