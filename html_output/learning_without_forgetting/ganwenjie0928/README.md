# Learning without Forgetting · 正式发布源

`web/final` 是 PaperSkillWork 内冻结的 release source，直接启动即呈现 00–07 v3 主线。它与历史基础版 `web/canonical`、持续研发版 `web/enhanced` 分开管理；本目录不是 PaperSkill 的最终导出目录。上游导出必须由 PaperSkill 官方 `npm run import` 生成至 `html_output/learning_without_forgetting/<version>/`。

冻结来源及时间见 [`FINAL_SOURCE.json`](./FINAL_SOURCE.json)。本版冻结自 `web/enhanced` commit `0d996a1419fafc194098c5075bf29021005e770c`。正式入口 `src/main.tsx` 渲染 `src/App.tsx`，启动无需 query 参数。

## 本地运行

```powershell
cd papers/lwf/web/final
npm ci
npm run dev
```

开发服务器默认地址为 `http://localhost:5173`。构建、单元与浏览器验收：

```powershell
npm run build
npm test
npm run test:browser
```

## 00–07 学习主线

| 章节 | 学习目标 |
| --- | --- |
| 00 | 问题设定与旧数据不可用的约束 |
| 01 | Teacher、Student、共享主体与任务 head |
| 02 | Teacher 在当前输入上产生旧响应 |
| 03 | 一次训练周期中的 forward、loss、backward 与更新 |
| 04 | 响应保持、优化目标与输入覆盖边界 |
| 05 | 连续任务阶段中的 Teacher / Student 交接 |
| 06 | 实验协议、证据与结论边界 |
| 07 | GrandTrail 端到端生命周期回放 |

Reference Hub 可由章节入口打开，支持搜索与定位相关资料；GrandTrail 提供上一步、下一步、播放、暂停、从头回放及步骤对应的参考资料入口。窄屏界面采用移动布局，动效遵从 `prefers-reduced-motion`。

## 维护与冻结

实验内容先在 `web/enhanced` 修改，并完成人工学习体验与证据审查；验收后再把审核后的内容重新冻结到 `web/final`，同步更新来源提交和时间。每次冻结后在此目录运行 `npm ci`、build、unit 与 browser acceptance。不要直接把 `web/final` 当作 `html_output` 提交。

上游环境准备、官方导入、验证、构建和 preflight 顺序见 [`docs/UPSTREAM_RELEASE.md`](../../../../docs/UPSTREAM_RELEASE.md)。
