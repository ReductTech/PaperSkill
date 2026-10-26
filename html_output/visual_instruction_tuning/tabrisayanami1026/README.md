# LLaVA：图片怎样变成一句回答

原始论文：Visual Instruction Tuning（NeurIPS 2023）。以 arXiv 2304.08485v2 为内容依据，讨论原始 LLaVA，未混入 LLaVA-1.5 或 NeXT。

## 打开导读

当前预览：<http://127.0.0.1:5183/>。请在浏览器打开，不要双击 index.html。

以后需要重启时，在此目录打开 PowerShell：

```powershell
npm install
npm run dev -- --host 127.0.0.1 --port 5183
```

这个地址用于本地预览。

## 阅读主线

10章、20个可操作模块，按“任务→输入数字→连接层→上下文与注意力→数据→生成→损失与更新→两阶段训练→小实验→论文结果”展开。用同一张房屋在左、船在右的插画解释每一步。

第3章可逐行计算投影；第4章区分注意力与答案概率；第6章解释生成与标准前缀训练；第7章计算一次真实的教学梯度；第8章切换训练阶段检查冻结参数；第9章展示小型分类实验；第10章核对评测口径。

## 运行实验与核对

```powershell
python experiments/shortcut_experiment.py
node experiments/verify_math.cjs
npm run build
```

Python实验只用标准库。结果保存在 `experiments/results.json`，含五个随机种子、两种训练条件、全部权重与损失曲线。页面中保存了本次运行结果的快照；更改实验后需要同步 `src/modules/llava-experiment-data.tsx` 才会改变页面数据。

小实验是人工二维特征上的线性分类，不读取图像像素，不运行CLIP/Vicuna，不生成句子，也不是LLaVA论文复现。页面中的文字生成概率和简化特征均标为教学示例。

详细边界见《来源与实验说明.md》，验收结果见《验证记录.md》。

## 素材来源

房屋、船只、生活类比及计算图均由本教程的Canvas代码绘制。论文事实与表格数据链接到原论文对应章节；不附带论文全文或原图。延伸视频通过哔哩哔哩公开链接访问，封面使用平台提供的远程地址。
