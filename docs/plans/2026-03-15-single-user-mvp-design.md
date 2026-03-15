# 单人闭环 MVP 设计文档（思维导图 → 文章）

日期：2026-03-15

## 目标与范围
- 完成单人用户闭环：一句话生成导图 → 导图编辑 + 文章实时对照 → 导出 PDF → 用户信息页。
- 暂不实现：登录/账户系统、充值系统、协作、多模型市场、图片输入。
- AI 接入：豆包（OpenAI 兼容 Responses API，文本输入/输出）。

## 信息架构与页面职责
1. `/generate` 一句话生成导图（chatbot 形式）
   - 输入一句话，调用豆包生成导图结构。
   - 生成成功后保存 `MindMapDraft`，引导进入 `/workspace`。

2. `/workspace` 核心工作区
   - 左：思维导图编辑器（React Flow）
   - 右：富文本文章（TipTap）
   - 功能：选中节点生成段落、全文生成、节点↔段落高亮、锁定机制。

3. `/export` 导出页面
   - 展示最终文章内容
   - 支持导出 PDF

4. `/profile` 用户信息页面
   - 昵称、头像、写作偏好、导出默认设置、模型选择
   - 本地保存，无需登录

## 数据模型（本地）
- `MindMapNode`: `id, parentId, text, order, formatting, resources[]`
- `MindMap`: `rootId, nodes[]`
- `ArticleBlock`: `id, nodeId, contentRichText, isLocked, isUserEdited`
- `Article`: `title, blocks[]`
- `UserProfile`: `nickname, avatar, writingPreference, exportPreset, modelSelection`
- `AppState`: `currentMindMapId, currentArticleId, uiState`

## 关键数据流
1. 一句话生成导图
   - 输入 → 调用豆包 → 解析为 `MindMap` → 本地保存 → 跳转 `/workspace`

2. 选中节点生成段落 / 全文生成
   - 选中 `nodeIds` → Prompt → 调用豆包 → 解析为 `ArticleBlock[]`
   - 仅替换未锁定 blocks
   - 若 `isUserEdited=true`，覆盖前二次确认

3. 映射高亮
   - 点击导图节点 → 高亮对应 block
   - 点击 block → 高亮对应节点

4. 导出
   - 富文本 → HTML → PDF 下载

## 技术架构（拍板）
- React 18 + TypeScript + Vite
- Zustand 作为状态管理，拆分 `mindmapStore` / `articleStore` / `userStore` / `uiStore`
- React Router 多路由结构（4 页面）
- React Flow 作为思维导图引擎
- TipTap 作为富文本编辑器
- AI 接入豆包（OpenAI 兼容 Responses API）
- 本地存储：IndexedDB（内容与用户信息），LocalStorage（轻量 UI 状态）

## UI 视觉方向
- 风格：人文感 + 简洁感 + 温暖色调
- 背景：暖白/米色
- 主色：陶土/棕系柔和色
- 字体：中文优先，偏书写感
- 组件：轻线条、轻阴影、避免强对比
- 动效：淡入/滑入，节制但有呼吸感

## 错误处理
- AI 调用失败：提示可重试，保留现有内容
- 解析失败：提示更改输入或重试，保留原输出
- 覆盖风险：用户编辑过的 block 需二次确认
- 导出失败：提示失败并提供复制富文本/HTML 备选

## 测试策略（MVP）
- 单元测试：`mindMapParser`、`blockMapper`、`aiService`
- 集成测试：生成导图 → workspace；选中节点生成；全文生成锁定验证
- 手动验收：4 页面流程可走通，PDF 可导出，本地刷新数据不丢

## 非目标
- 登录/账户体系与充值系统
- 图片输入
- 多人协作
- 云端同步
