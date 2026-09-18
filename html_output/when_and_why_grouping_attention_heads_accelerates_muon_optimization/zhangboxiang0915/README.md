# Muon 应该逐 head 做吗？

基于 When and Why Grouping Attention Heads Accelerates Muon Optimization（arXiv:2605.08933）的中文交互教程，使用 PaperSkill 官方 React + TypeScript 模板。

## 本地运行

```powershell
npm install
npm run dev -- --host 127.0.0.1
```

构建：`npm run build`。默认预览地址以终端输出为准，通常为 http://127.0.0.1:5173/。

## 内容与证据

十章按问题、实验反转、粒度冲突、机制、Gain–Cost、分组操作、阶段变化、实际范数、实验结果、结论组织。包含六项核心交互和 Figure 1–4 原图。

- 原论文：https://arxiv.org/abs/2605.08933
- Figure 2 的阶段探索为定性示意，不生成任意 step 的实测 loss。
- 天平采用附录 E 的解析例子，不是训练模拟器。
- D_all 和 D_grp 是理想假设下的一步下降下界。
- 3.2722 对应 GPT-2 Small + FineWeb 的 Q/K random g=6，是本文最佳已测试配置。
- Bilibili 视频仅为 Muon 背景补充，不支持本文分组结论。

已通过 PaperSkill 结构检查、生产构建及桌面/手机核心交互检查。论文准确性仍等待使用者按菜单功能 3 人工核验。

源码包含 React、TypeScript、Vite。无模型推理服务，无账号系统。构建与依赖目录不应提交到公共仓库。