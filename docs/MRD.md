# MRD：思维导图 + AI 实时写作（基于 PRD.md）

更新时间：2026-03-13

## 0. 摘要（TL;DR）

- 你要做的「用思维导图控制逻辑深度，AI 负责成文」在竞品里常见的方向是两条：A) 思维导图/白板/图形工具加 AI（更偏“生成导图、扩写节点、整理结构”）；B) 文档编辑器加 AI（更偏“帮我写/改写/润色/扩写”，但缺少“结构可视化输入”）。
- 与本 PRD 最接近的现成形态不是“导图直接生成长文并保持段落与节点一一映射”，而是：导图产品提供 AI 辅助（含 web 搜索/引用、模板、导出），写作产品提供段落级重写能力；用户多通过“导出/复制大纲 -> 去写作工具扩写”完成闭环。导图到长文的闭环仍有产品机会，但要解决“上下文一致、可控重写边界、证据来源/引用、成本配额”四件事。
- 可验证的竞品趋势：AI 输入越来越多样（文本/链接/文件），并引入“在线搜索/引用来源”以提升可信度；计费多采用“额度/动作次数/Token”而不是“每日固定次数”。（见第 4、5、7 节）

## 1. 背景与目标

本 MRD 目标：

- 基于 `PRD.md` 的产品形态，客观整理“竞品已经做了什么”（以官方页面、帮助文档、发布说明为证据优先）。
- 输出可执行的 PRD 优化建议：哪些能力应提升优先级、哪些表述需要更具体、哪些地方需要补充约束与边界条件（尤其是生成一致性与成本控制）。

非目标：

- 不做“营销式”对比，不假设竞品没有做（若未找到官方证据会明确标注“未确认”）。
- 不做付费墙后的深度功能实测（除非你后续希望我按某些竞品逐个注册试用并截图/记录）。

## 2. 市场定义与细分

围绕你的 PRD，这个市场可拆成 3 个相邻赛道：

- 赛道 A：思维导图/白板/图形协作工具 + AI
  - 核心价值：结构化表达、协作、模板、导出；AI 多用于“生成导图/扩写节点/整理归纳/在线搜索”。
- 赛道 B：文档/写作工具 + AI
  - 核心价值：文本生产效率与编辑；AI 多用于“帮我写、改写、扩写、润色、总结”，并逐步在主流办公套件中原生集成。
- 赛道 C：结构化输入到内容产出的工作流工具
  - 核心价值：把“信息源/大纲/结构”转成“可发布的成品”（文章/Slides/脚本），常见做法是多格式导入 + 生成/导出。

你的产品意图更接近“赛道 C”，但交互形态（导图为主输入）与差异化（锁定、分段生成、上下文连贯）借鉴 A 与 B 的成熟能力。

## 3. 目标用户与使用场景（JTBD）

从 PRD 的目标用户（公众号作者、博客创作者、自媒体、长文写作）出发，典型任务链：

- 选题与结构：把观点拆成可验证的论点与逻辑链路（导图/大纲的强项）。
- 扩写成文：把节点扩成段落，补足过渡、例子、背景（AI 写作的强项）。
- 反复迭代：局部重写但不破坏整体结构与已确定段落（“可控重写边界”的痛点）。
- 发布/复用：导出 Markdown/纯文本，或适配公众号排版。

这也对应你 PRD 里的三条核心流程：分段生成、全文重写、局部重写。

## 4. 竞品盘点（以“已确认能力”为主）

说明：

- “已确认”仅来自公开官方资料或官方发布说明。
- “未确认”不等于没有，只代表本次检索未看到官方证据。

### 4.1 导图/结构化工具（更接近你的左侧“导图输入”）

#### XMind（XMind AI）

已确认能力（与本 PRD 强相关）：

- 提供 AI 生成思维导图（XMind 官方描述为“Create Mind Maps with AI”）。并明确提到可用“Online Search”获取“latest online information”，并可点击跳转来源页面。  
  参考：XMind Help Center 的 Online Search（`https://xmind-help.github.io/en/search.html`）、XMind AI Explain（`https://xmind.com/user-guide/ai-explain`）。  
- 提供导图基础能力与版本/协作能力（本次只用于对齐“导图编辑器”的成熟度预期）。  
- 提供订阅定价与免费试用信息（用于对标定价带宽）。  
  参考：XMind Pricing（`https://xmind.app/pricing//`）。

对你的启示：

- “在线搜索 + 可追溯链接”已在导图类产品出现，说明用户不仅要“写出来”，还要“可信”。你的 PRD 目前没有“引用来源/证据输入”的机制，容易被“写得浅/编得多”反噬。

未确认（本次未见官方证据）：

- “从导图节点直接生成完整长文并保持节点-段落映射”的原生体验。
- “锁定段落并在全文重写时不改动”的明确机制。

#### EdrawMind（亿图脑图 / EdrawMind AI）

已确认能力：

- 官方 AI 页面明确列出 “AI Article Generation”等能力条目（表述为“content generation”方向）。  
- 官方定价页/购买页说明 AI 使用采用 Token 额度（AI tokens 可单独购买，且不同订阅也会包含一定 tokens/额度）。  
  参考：AI 文章生成（`https://edrawmind.wondershare.com/ai-article-generation.html`）、AI tokens（`https://edrawmind.wondershare.com/store/ai-tokens.html`）、Individuals Plan（`https://edrawmind.wondershare.com/store/individuals.html`）。
- 官方发布说明提到“AI web search / reference sources”等能力（强调从 web 搜索并给出引用来源）。  
  参考：EdrawMind What’s New（`https://edrawmind.wondershare.com/whats-new.html`）。

对你的启示：

- Token/额度计费是导图类产品接入 AI 的主流做法之一；你 PRD 的“每日 3 次”属于粗粒度限制，易导致“单次生成很长就不敢用/很短又浪费次数”的体验割裂。

未确认：

- 段落锁定与“全文重写保留锁定块”的产品级机制。
- “选中节点 -> 只生成对应段落”的显式交互闭环（可能存在但本次未找到明确官方描述）。

#### GitMind

已确认能力：

- 支持从多种输入生成导图，包括文件/链接等（AI mind map generator 方向）。  
  参考：GitMind AI Mind Mapping（`https://gitmind.com/faq/ai-mind-mapping.html`）、GitMind Pricing（`https://gitmind.com/pricing`）。

对你的启示：

- 多输入源（文件/链接）能显著提升“写得深”的概率，因为它把“信息”引入系统，而不是只靠模型发挥。你的 PRD 目前只提“导图节点文本”，建议尽早引入“节点引用/资料库”。

#### Mindomo

已确认能力：

- 支持导出 Markdown（帮助文档明确“导出为 Markdown 文件”）。  
  参考：Mindomo Help Center 导出（`https://help.mindomo.com/basics/export-mind-maps/`）。

对你的启示：

- Markdown 导出是导图工具常见能力，且非常适合作为“导图 -> 写作工具”的中间格式。你 PRD 的导出在 P1，但在“工作流闭环”上更像 P0/P1 边界能力。

#### ProcessOn

已确认能力：

- 官方页面展示其支持的图形类型中包含“思维导图”，并强调在线协作与模板等。  
  参考：ProcessOn 官网（`https://www.processon.com/`）。

对你的启示：

- 在线协作与模板在国内导图/作图工具里是默认盘；如果你的产品不做协作，也需要把“单人写作效率”做得足够极致，否则很难从成熟协作工具中切走用户。

未确认：

- ProcessOn 是否提供与你 PRD 同类的“导图到长文”生成闭环（本次未找到官方明确描述）。

### 4.2 结构到内容产出工具（更接近你的“导图输入 -> 输出内容”）

#### Mapify

已确认能力：

- 官方定价页明确包含导出到 PDF/Markdown/SVG，以及 “Present as slides”，并展示以 AI credits 为核心的用量模型。  
  参考：Mapify Pricing（`https://mapify.so/pricing/`）。

对你的启示：

- Mapify 证明“多模态输入 -> 结构化输出 -> 再去文档工具深加工”是一个可行的产品路径。你的 PRD 可以反过来：把“长文产出”做成导图的一个“输出视图”，同时保留导出到 Notion/Docs 的通道，降低迁移成本。

未确认：

- 段落锁定与“全文重写保留锁定块”的机制。

### 4.3 写作/办公套件（更接近你的右侧“段落生成 + 编辑 + 重写”）

#### Google Docs（Gemini in Google Workspace）

已确认能力：

- Google Workspace 的 Gemini 功能包含“Help me write”，用于在 Google Docs 中起草/编辑内容（官方宣传口径）。  
  参考：Gemini in Google Docs（`https://workspace.google.com/products/docs/ai/`）。

对你的启示：

- 文档编辑器原生集成 AI 已成为大厂标配。你若定位在“写作体验”，必须把“结构输入 + 可控重写”做到明显更好，才有替代理由。

#### Microsoft 365 Copilot

已确认能力：

- Microsoft 365 Copilot 定位为贯穿 Office 应用的 AI 助手（官方介绍）。  
  参考：Microsoft 支持文档（`https://support.microsoft.com/en-us/office/get-started-at-microsoft365-com-91b69f9c-9410-4eba-8b4f-8dab3efa43d1`）。

对你的启示：

- 大厂办公套件拥有分发优势；你的机会不是“再做一个 AI 写作”，而是把“结构控制与可视化”做成他们难以快速复制的体验壁垒（例如节点-段落绑定、锁定与增量生成）。

## 5. 竞品共性与趋势（可作为 MRD 结论）

### 5.1 输入侧趋势：从“手写节点”走向“多源喂料 + 可追溯”

已确认趋势信号：

- 导图类工具开始提供“web search / reference sources / 可点击来源”的能力（XMind、EdrawMind）。  
- 结构化工具开始支持从链接/文件/视频等输入自动生成导图（Mapify、GitMind）。

对你的 PRD 影响：

- 仅靠用户节点文本 + 模型补全，容易产生“深度不足/幻觉”。建议把“引用资料”做成一等公民（见第 7 节）。

### 5.2 输出侧趋势：段落级编辑能力已普及，但“结构-段落绑定”缺口明显

已确认趋势信号：

- 大厂文档工具提供“帮我写/编辑”能力（Google Docs、Microsoft 365）。

对你的 PRD 影响：

- 你必须把“结构与段落之间的关系”产品化：每个段落来自哪个节点、重写时影响范围、锁定如何生效、重写是否保持段落边界与语气一致。

### 5.3 计费趋势：额度/Token/动作次数比“每日次数”更细粒度

已确认信号：

- EdrawMind 明确使用 token 额度（不同订阅档位包含不同 token 数）。  
  参考：EdrawMind Pricing 页面。

对你的 PRD 影响：

- 建议把“生成成本”抽象为 credits 或 tokens，并在 UI 上明确消耗预估与上限，避免成本失控与体验不可预期。

## 6. 市场规模与宏观背景（仅引用公开报告的可见信息）

说明：市场报告口径差异很大（定义、地域、预测模型不同）。本节用于帮助判断“趋势是否足够强”，不作为精确财务建模依据。

- Grand View Research 将“生成式 AI 在内容创作”描述为快速增长的市场方向（公开页面展示预测区间与 CAGR 信息）。  
  参考：Grand View Research（`https://www.grandviewresearch.com/industry-analysis/generative-ai-content-creation-market-report`）。

结论（谨慎）：AI 写作属于更大一类“生成式 AI + 内容生产”浪潮内的子场景，需求侧会持续增长；但供给侧竞争极强，差异化必须落在“结构化输入 -> 可控产出”的工作流优势上。

## 7. 对 PRD 的客观优化建议（按优先级）

以下建议只针对你现有 `PRD.md` 的可落地改动，不引入“先做大而全”的膨胀范围。

### 7.1 P0：把“可控重写边界”写清楚，并让数据结构支撑

建议补充到 PRD（P0）：

- 明确定义“节点 -> 段落”的映射规则：一个节点对应一个 block？还是允许一个节点生成多个 blocks？当节点有子节点时，父节点段落如何与子节点段落衔接？
- 增量生成策略：分段生成时，模型上下文应包含“整棵导图结构 + 已锁定 blocks + 相邻 blocks 的摘要”，而不是整个全文 raw text（降低 token 成本并提高一致性）。
- 锁定机制边界：锁定后是否允许“语言润色但不改事实”？还是完全不可改？是否允许锁定块参与上下文但不可被覆盖？

为什么是 P0：这是你与“普通 AI 写作”拉开差距的核心，且决定后续工程实现与可维护性。

### 7.2 P0：增加“资料与引用”能力的最小闭环（不必等到导入）

建议新增 P0 或 P1（取决于你想主打的“深度”程度）：

- 节点级“参考资料”字段：支持粘贴 URL、或粘贴原文片段作为引用输入。
- 生成时可选“基于资料写作（grounded）”：优先引用节点资料，允许在输出中列出“引用来源列表”。

客观依据：竞品已在导图侧引入 web search 与 reference sources（XMind、EdrawMind），用户对“可信/可追溯”的预期在上升。

### 7.3 P1：补齐“从资料到结构”的反向能力，提升起步效率

你的 PRD 是“导图 -> 文章”，但竞品已经在“资料 -> 导图”上成熟。建议作为 P1：

- 从标题/主题一句话生成初始导图（中心主题 + 一级观点 + 二级论点）。
- 从粘贴文章/链接/PDF 摘要生成导图（先只支持“粘贴文本”也可以）。

客观依据：XMind、GitMind、Mapify 都在强化“输入->导图”的能力。

### 7.4 P1：导出能力提前做“结构化导出”，为生态打通

你 PRD 的导出是 P1（Markdown/纯文本）。建议明确两类导出：

- 文章导出：Markdown/纯文本（你已覆盖）。
- 结构导出：导图为 Markdown 大纲（利于外部写作工具继续加工）。

客观依据：Mindomo 等工具将 Markdown 作为导出格式，且 Mapify 支持导出到 Notion/Docs。

### 7.5 定价与成本：把“每日次数”升级为“额度模型”并预留扩展

建议对 PRD 的商业模式部分做更工程可行的改写：

- 免费版：按 credits/token 或按“AI 动作次数”计（例如“生成段落/重写段落/生成全文”各消耗不同额度）。
- 付费版：提供更高额度 + 导出/导入等功能。
- 在 UI 中展示本次操作预计消耗与剩余额度，减少不确定性。

客观依据：EdrawMind 已公开 token 额度逻辑；且大模型成本天然与输出长度相关，“次数”很难公平覆盖不同长度场景。

## 8. 下一步建议（你确认方向后我可以继续做）

1. 你希望优先做“公众号长文”还是“通用长文”？不同方向会影响导出、排版、风格与模板的优先级。
2. 是否需要我把第 7 节的建议直接回写到 `PRD.md`（以增量方式改成更可执行的版本）？
3. 是否要做“竞品深度实测”：选 3-5 个（XMind / EdrawMind / Mapify / GitMind / Whimsical 等）逐个注册体验，输出更细的 UX 流程与功能差异表。

## 9. 附录：本次检索的主要公开来源（节选）

- XMind Pricing：`https://xmind.app/pricing//`
- XMind Help Center Online Search：`https://xmind-help.github.io/en/search.html`
- XMind AI Explain：`https://xmind.com/user-guide/ai-explain`
- EdrawMind Article Generation：`https://edrawmind.wondershare.com/ai-article-generation.html`
- EdrawMind What’s New（AI web search/reference sources）：`https://edrawmind.wondershare.com/whats-new.html`
- EdrawMind AI tokens：`https://edrawmind.wondershare.com/store/ai-tokens.html`
- Mapify Pricing（AI credits、导出、Slides）：`https://mapify.so/pricing/`
- GitMind AI Mind Mapping：`https://gitmind.com/faq/ai-mind-mapping.html`
- GitMind Pricing：`https://gitmind.com/pricing`
- Mindomo Export（含 Markdown）：`https://help.mindomo.com/basics/export-mind-maps/`
- ProcessOn 官网：`https://www.processon.com/`
- Gemini in Google Docs：`https://workspace.google.com/products/docs/ai/`
- Microsoft 365 Copilot（官方支持文档）：`https://support.microsoft.com/en-us/office/get-started-at-microsoft365-com-91b69f9c-9410-4eba-8b4f-8dab3efa43d1`
- Grand View Research（generative AI in content creation）：`https://www.grandviewresearch.com/industry-analysis/generative-ai-content-creation-market-report`
