import React from 'react';
import type { WidgetProps } from './registry';

export const Reflection: React.FC<WidgetProps> = () => (
  <section className="reflection-card">
    <p>作者实际上采用了一种力大砖飞的方式进行了探究，将视频复制多份在VAE编码，实际上去完全舍弃了VAE的压缩功能，造成了巨大的性能负担。从个人角度看，完整的复制多份进行编码显然是过于简单粗暴，成为了作者PE-Field和PE-Field 4D的核心短板，在已有的其他研究中Wan的Attention Head实际上是稳定的功能上异构的。参考<a href="https://arxiv.org/abs/2605.09681" target="_blank" rel="noreferrer">ForcingKV</a>的论文，完全可以只让“动态头”来处理前后景的区分，并且由线形插值的方式处理摄像头位置，而不用如此奢侈的方式。</p>
  </section>
);

export default Reflection;
