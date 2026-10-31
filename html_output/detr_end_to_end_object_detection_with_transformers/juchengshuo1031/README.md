# DETR 中文交互式导读

作者署名：剧承硕（ChengshuoJu）。

论文：End-to-End Object Detection with Transformers，ECCV 2020。
原文：https://arxiv.org/abs/2005.12872

## 内容
端到端动机、整体架构、object query 与并行解码、匈牙利匹配、集合预测损失、实验结果、局限性。

## 运行
```sh
npm install
npm run build
npm run dev
```

## 图片来源
全部图形为本项目自绘或程序生成。结构与数值依据原论文；未直接使用论文原图。详见 IMAGE_INVENTORY.md。

## 核验状态
用户已确认论文内容。合成匹配与槽位示意不是实测结果。
本地生成阶段语法、类型和结构校验通过，替代静态构建通过。标准 Vite 构建在执行环境中因子进程权限 EPERM 未通过；桌面与手机端完整视觉验收尚未完成。

最新验收：用户已在独立终端确认仓库校验、范围检查和正式构建通过，并确认最终桌面与移动端预览。最终提交的 preflight 仍需在可运行 Git/npm 子进程的环境中完成。
