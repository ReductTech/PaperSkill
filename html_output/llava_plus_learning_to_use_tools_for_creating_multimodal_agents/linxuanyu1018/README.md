# LLaVA-Plus 中文交互教程

10章、12个主体交互，围绕图像参与规划、技能选择、统一调用格式、训练监督和实验边界展开。

## 运行

安装 Node.js 后，在项目目录运行：

```sh
npm install
npm run build
npm run dev -- --host 127.0.0.1 --port 5175 --strictPort
```

## 内容与使用边界

论文：https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/06341.pdf

这是教学网页。分割与生成图像来自论文预设示例；浏览器中不运行 LLaVA、SAM 或 ControlNet。坐标选点、监督概率和损失用于解释机制，不冒充新实验。结果页保留原表4–7及报告组、不确定性和历史榜单日期。详细定位见 SOURCE_COVERAGE.md，图像裁剪来源见 public/images/provenance.json。

保留框架要求的 width=1600 视口设置。页面支持目录折叠、键盘预设和窄窗口布局；减少动态效果的系统偏好下，操作结果仍会重绘。

## 检查与预览

见 VERIFICATION.md；预览截图位于 preview/。
