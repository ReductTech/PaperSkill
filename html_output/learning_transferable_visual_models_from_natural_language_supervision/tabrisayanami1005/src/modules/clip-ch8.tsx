import { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Canvas, Chips, Feedback, card, photo, arrow } from './clip-scenes';
const nodes=['图像编码器','文字编码器','各自线性投影','各自L2归一化','相似度'];
const boxes=[
 {x:200,y:38,w:180,h:76,kind:0},{x:200,y:220,w:180,h:76,kind:1},
 {x:445,y:38,w:130,h:76,kind:2},{x:445,y:220,w:130,h:76,kind:2},
 {x:640,y:38,w:140,h:76,kind:3},{x:640,y:220,w:140,h:76,kind:3},
 {x:875,y:128,w:175,h:85,kind:4}
];
export const ClipCh8=(_props:WidgetProps)=>{
 const [node,setNode]=useState(0);const [backbone,setBackbone]=useState(0);
 const descriptions=[
  backbone===0?'图像编码器把像素变成特征 x，论文可使用改进的 ResNet（残差卷积网络）。它逐层提取并汇总视觉模式；特征宽度 dᵢ 随配置变化，不是固定的类别数。下一模块会展开卷积、残差连接和池化。':'图像编码器也可使用 ViT（视觉 Transformer）：把图片切成小块，用按内容分配权重的注意力机制混合各块信息。ViT-L/14@336px 是论文最佳配置，不等于所有 CLIP。下一模块会与 ResNet 并排比较。',
  '文字编码器将文本先转成 token 序列，再用 Transformer——一种以注意力为核心、逐层混合信息的神经网络——得到特征 y。BPE 分词把常见字符串合并成子词单元，不一定一个 token 就是一个汉字或英文单词。论文将文本小写化，加起始符 SOS 和结束符 EOS；取最后一层 EOS 位置的表示，再作层归一化与投影，汇总整段文字。注意力的具体计算在 8.3 展开。',
  '两条分支分别有自己的可学习矩阵 Wᵢ 与 Wₜ，不是共用一个投影，更不是先把图文混合。它们把 dᵢ 维与 dₜ 维特征各自变成 dₑ 维：a=xWᵢ，b=yWₜ。矩阵可以看成一个数表，每个输出坐标都是输入坐标的加权求和；同维度只是能够点积，语义对齐还要靠训练。',
  '两条分支各自除以向量长度：u=a/‖a‖₂，v=b/‖b‖₂。投影统一维度，归一化统一长度；两者职责不同。这里只考虑非零向量，真实数值实现需处理极小长度。完成后 u·v 就是余弦相似度。',
  '图像和文字在末端通过 u·v 比较，训练还乘以学习到的正数 exp(t)=1/τ，再计算双向损失。图片不会在编码过程中读取另一条文字的中间特征，这叫双编码器结构；因此文字候选向量可以预先缓存。这里没有逐词生成回答的步骤。'
 ];
 return <><p>沿上、下两条线分别阅读：图像和文字各自编码、投影、归一化，最后才比较。图中 x、y 是编码后的特征，a、b 是投影后特征，u、v 是归一化后的特征；不要把不同阶段的符号混用。</p>
 <Canvas height={340} ariaLabel={`双编码器独立处理图像与文字，当前查看${nodes[node]}`} onPointerDown={e=>{
  const r=e.currentTarget.getBoundingClientRect();const x=(e.clientX-r.left)*1080/r.width,y=(e.clientY-r.top)*340/r.height;
  const found=boxes.find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);if(found)setNode(found.kind);
 }} draw={ctx=>{
  photo(ctx,25,37,115,'猫');card(ctx,25,234,130,49,'猫的照片',C.dark);
  [76,258].forEach(y=>{arrow(ctx,160,y,188,y);arrow(ctx,391,y,433,y);arrow(ctx,586,y,628,y);});
  arrow(ctx,791,76,863,147);arrow(ctx,791,258,863,194);
  const names=[backbone===0?'ResNet':'ViT','文字编码器','Wᵢ','Wₜ','u：长度1','v：长度1','u·v'];
  boxes.forEach((b,i)=>card(ctx,b.x,b.y,b.w,b.h,names[i],b.kind===node?C.orange:C.blue));
  ctx.font='19px "Microsoft YaHei",sans-serif';ctx.fillStyle=C.muted;
  ctx.fillText('x：dᵢ维',212,142);ctx.fillText('y：dₜ维',212,324);
  ctx.fillText('a：dₑ维',447,142);ctx.fillText('b：dₑ维',447,324);
  ctx.fillText('图像单位向量',646,142);ctx.fillText('文字单位向量',646,324);
  ctx.fillText('比较两条分支',898,240);
 }}/><Chips options={nodes} value={node} onChange={setNode} label="查看结构节点（图上点击的等效操作）"/><Chips options={['ResNet 图像分支','ViT 图像分支']} value={backbone} onChange={setBackbone} label="图像编码器类型"/><p>结构示意。两条线代表独立的计算路径，各阶段的特征维度随模型配置变化。</p><Feedback>{descriptions[node]}</Feedback><p>定位原文：第 3–4 页 §2.2–2.3、图 3。两条分支分别投影与归一化；匹配损失通过反向传播训练两侧参数。</p></>;
};
