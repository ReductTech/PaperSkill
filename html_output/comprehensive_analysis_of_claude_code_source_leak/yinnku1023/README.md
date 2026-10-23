# Claude Code 源码泄露分析

通过 ReductTech/PaperSkill 的官方 PPT 模板、来源缓存校验、章节组装器和项目校验器生成。

## 来源

- 原文：[Comprehensive Analysis of Claude Code Source Leak!](https://www.sabrina.dev/p/claude-code-source-leak-analysis)
- 作者：Sabrina Ramonov；发布日期：2026-04-02。
- 原文是技术博客分析文章，不是学术论文。教程以简短评述引出原创工程教学例子，不复刻全文、源码或原文图片。
- 文章中的安全判断未由本教程独立复现，代码线索不能证明功能当前可用。逐页讲解备注保存原文章节与适用边界。

## 教学模型

交互均使用浏览器中的确定性规则。文件风险属性、后台门槛、请求次数与算术缺陷是明确设定的教学例子，不能作为 Claude Code 的实测结果或生产安全保证。SVG 图形全部原创，无第三方字体、图片、视频或运行时 CDN。没有网络命令执行、登录或数据收集。

## 运行

`npm install`

`npm run dev`

`npm run build`

完整保留 src、public、配置与锁文件；不提交 node_modules 和 dist。
