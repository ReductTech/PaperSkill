# 功能一：自动准备环境

1. 在执行其他步骤前，确认参与者已登录自己的 GitHub 账号，并记录其 GitHub 用户名；
2. 如果参与者没有 GitHub 账号，立即暂停自动流程，引导其自行完成账号注册、邮箱验证和登录，收到登录完成确认后再继续。Agent 可以打开官方注册或登录页面，但不得代填或保存密码、验证码；
3. 获取或更新 `https://github.com/ReductTech/PaperSkill`；
4. 根据参与者权限使用官方仓库或个人 Fork；
5. 检查 Node.js 20+、npm、Git、Git 身份和 GitHub 连接；命令行尚未获得 GitHub 授权时，调用官方登录流程并等待参与者确认；
6. 找到当前 Agent 的 Skill 根目录；
7. 在 Windows 上优先运行：

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\setup-participant.ps1 `
     -AgentSkillsDirectory "<Agent Skill 根目录>" `
     -InstallMissingTools `
     -ReplaceExistingSkill
   ```

8. 其他系统执行等价检查和复制操作；
9. 将仓库中的 `paper-skill/` 视为唯一来源，核对安装目录中的版本和完整文件指纹均与仓库一致；即使版本号相同，只要文件内容不同也必须用仓库副本替换；
10. 重新加载 Agent 后确认能够识别 `paper-skill`。

GitHub 账号注册、邮箱验证、登录或 Fork 授权、管理员权限、缺失的 Git 身份和 Agent 重载需要参与者操作；其中 GitHub 账号登录必须在本阶段最先完成，不得推迟到提交阶段。
