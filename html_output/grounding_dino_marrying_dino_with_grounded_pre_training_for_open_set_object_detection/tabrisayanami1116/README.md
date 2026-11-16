# Grounding DINO 中文交互导读

从苹果照片出发，学习开放类别检测和指代定位。沿着 DETR 的框和查询，讲清分组文本注意力、位置打分和 Top-K、跨模态解码、词级分类监督，以及怎样解读模型成绩。共十章、十一个可操作模块。

## 启动

```sh
npm ci
npm run dev
npm run build
```

## 论文与实现来源

- Shilong Liu 等，Grounding DINO: Marrying DINO with Grounded Pre-Training for Open-Set Object Detection，ECCV 2024。[论文 v5](https://arxiv.org/abs/2303.05499v5) · [会议论文](https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/06319.pdf)
- 框与词的输出见 §3。图像四尺度、双向融合、查询初始化与六层解码见 §3.1–3.3、图 3、式 (1)、附录 A.2。短语掩码见 §3.4、图 4。匹配和损失权重见 §3.5、§4.1。训练数据见附录 B。点积、配对、损失和框细化模块的小数为教学算例。
- 第十章据表 2、4、5、7 绘制。长尾观察见表 3，同为 Swin-T、预训练用 O365 和 GoldG 时，Grounding DINO-T 的 LVIS minival AP 为 25.6、稀有类 AP 为 14.4，GLIP-T (C) 分别为 24.9 和 17.7。平均 AP 和稀有类 AP 可以给出不同结果。
- 第六、九章使用 [Grounding DINO Tiny 公开权重](https://huggingface.co/IDEA-Research/grounding-dino-tiny/tree/a2bb814dd30d776dcf7e30523b00659f4f141c71)。实验分析两张照片以及合影的左右翻转版本。

## 图像与许可

| 文件 | 来源与处理 |
| --- | --- |
| `public/images/twins.jpg` | [双人合影](https://commons.wikimedia.org/wiki/File%3AMark_and_Scott_Kelly_-_Astronaut_Twins.jpg)，NASA／Robert Markowitz，NASA on The Commons。按比例缩小并转存为 JPEG。 |
| `public/images/twins-mirror.jpg` | 同一张合影左右翻转并另存，标注按镜像对应。 |
| `public/images/apples.jpg` | [苹果照片](https://www.pexels.com/photo/red-apple-with-two-green-apples-62687/)，Pixabay 发布于 Pexels，[Pexels 许可](https://www.pexels.com/license/)。文件经缩放和 JPEG 转存。 |

## 实测记录

- `experiments/cases.json` 保存固定英文提示、人工矩形标注和每个提示的期望目标。框坐标采用输入照片的像素 `[x1,y1,x2,y2]`。
- `experiments/results.json` 保存 14 次 CPU 推理的全部 12,600 个查询。每行依次为查询索引、像素框、最大 token sigmoid 分数、有效 token 的原始 logits。文件同时保存模型版本、权重与图片 SHA-256、输入尺寸、软件版本和 CPU 时间。
- `src/modules/lab-data.json` 保留原始记录中分数大于 0.10 的预测，以及每次推理排名第一的预测，用于浏览器交互。
- 第九章使用框阈值 0.35、文字阈值 0.25。保留框按得分排序，依次与剩余人工框做几何匹配，IoU 达到 0.50 算命中。其余保留框算额外框，剩余人工框算漏检。输出的英文短语和框的位置都可在页面上核对。

合影的左右指代都保留两框。原图的最高分在描述相反的一侧，翻转后的最高分都在正确侧。两个方向中，各自的首选人物在翻转前后保持相同。这是本次图像对照的观察。

“red apple.” 的最高分框圈住红苹果，但两颗绿苹果也超过 0.35。“red apple. green apple.” 仍保留三个框，记录中的标签区分了颜色。不在照片里的自行车没有过阈值的框，“banana.” 却留下三个框，最高分约 0.445。

### 复跑

Python 3.12，先安装匹配的 CPU PyTorch 与 torchvision。记录环境为 torch 2.15.0+cpu、torchvision 0.29.2+cpu、Transformers 4.57.1、Pillow 12.3.0。脚本下载固定修订的 safetensors。也可以用 `--local-model` 指定已下载的同一修订。

```sh
python -m pip install -r experiments/requirements.txt
python experiments/run_inference.py --out experiments/reproduce
python experiments/make_preview_data.py experiments/reproduce/results.json experiments/reproduce/lab-data.json
```

推理脚本核对每次在 0.35 阈值留下的分数和像素框与 Transformers 的后处理一致。不同环境的浮点结果和用时可能略有变化。
