import React from 'react';
import netStructSvg from '../../img/net-struct.svg?raw';
import type { WidgetProps } from './registry';

// 模块 9.1：YOLO26 中的 MambaPSA 与 BiViM（静态结构示意）。
// 交互式变体对比已移除；保留结构图与说明，各变体的精确数值见第 10 章对比。
export const Ch9M1: React.FC<WidgetProps> = () => {
  return (
    <figure className="paper-figure net-struct-fig">
      <div className="net-struct-svg" dangerouslySetInnerHTML={{ __html: netStructSvg }} />
      <figcaption>
        图：YOLO26 网络结构（MambaPSA 变体）。蓝 / 黄 / 绿虚线区 = Backbone / Neck (PAN-FPN) / Head。
        红色模块与红色箭头 = 本论文的 Mamba 改动点：<b>MambaPSA</b> 替换主干末尾的 C2PSA；<b>BiViM</b> 插在颈部 N3/N4/N5 之后，
        图中三个层级并排示意，实际仅在其中一个层级生效。
      </figcaption>
    </figure>
  );
};
