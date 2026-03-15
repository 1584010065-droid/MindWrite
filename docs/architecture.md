# 项目架构设计文档

## 1. 项目概述

MindWrite 是一款基于思维导图的结构化写作工具，通过 AI 实时将思维导图转换为长文。本文档定义了项目的技术架构、目录结构、组件设计和核心流程。

## 2. 技术栈

### 2.1 核心技术
- **前端框架**: React 18 + TypeScript
- **UI框架**: Tailwind CSS + shadcn/ui
- **状态管理**: Zustand
- **思维导图**: React Flow
- **富文本编辑**: TipTap (支持格式编辑)
- **AI集成**: OpenAI API / Claude API
- **部署**: Vercel
- **存储**: IndexedDB (MVP) → Supabase (后期)

### 2.2 开发工具
- **包管理器**: pnpm
- **构建工具**: Vite
- **代码规范**: ESLint + Prettier
- **类型检查**: TypeScript strict mode
- **测试框架**: Vitest + React Testing Library

## 3. 目录结构

```
mindwrite/
├── docs/                    # 项目文档
│   ├── PRD.md              # 产品需求文档
│   ├── MRD.md              # 市场需求文档
│   ├── user-stories.md     # 用户故事
│   └── architecture.md     # 架构设计文档
├── src/
│   ├── components/         # React 组件
│   │   ├── ui/            # 基础 UI 组件 (shadcn/ui)
│   │   ├── mindmap/       # 思维导图相关组件
│   │   │   ├── MindMapEditor.tsx
│   │   │   ├── MindMapNode.tsx
│   │   │   ├── NodeEditor.tsx
│   │   │   └── NodeToolbar.tsx
│   │   ├── article/       # 文章预览相关组件
│   │   │   ├── ArticlePreview.tsx
│   │   │   ├── ArticleBlock.tsx
│   │   │   ├── BlockEditor.tsx
│   │   │   └── BlockToolbar.tsx
│   │   ├── layout/        # 布局组件
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MainLayout.tsx
│   │   └── common/        # 通用组件
│   │       ├── Loading.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── Modal.tsx
│   ├── stores/            # Zustand 状态管理
│   │   ├── mindmapStore.ts
│   │   ├── articleStore.ts
│   │   ├── aiStore.ts
│   │   ├── creditsStore.ts
│   │   └── uiStore.ts
│   ├── services/          # 业务逻辑服务
│   │   ├── ai/           # AI 相关服务
│   │   │   ├── aiService.ts
│   │   │   ├── promptBuilder.ts
│   │   │   └── responseParser.ts
│   │   ├── storage/      # 存储服务
│   │   │   ├── indexedDBService.ts
│   │   │   └── localStorageService.ts
│   │   └── export/       # 导出服务
│   │       ├── markdownExporter.ts
│   │       └── textExporter.ts
│   ├── hooks/             # 自定义 React Hooks
│   │   ├── useMindMap.ts
│   │   ├── useArticle.ts
│   │   ├── useAI.ts
│   │   └── useCredits.ts
│   ├── utils/             # 工具函数
│   │   ├── idGenerator.ts
│   │   ├── textFormatter.ts
│   │   ├── validation.ts
│   │   └── constants.ts
│   ├── types/             # TypeScript 类型定义
│   │   ├── mindmap.ts
│   │   ├── article.ts
│   │   ├── ai.ts
│   │   └── common.ts
│   ├── styles/            # 全局样式
│   │   ├── globals.css
│   │   └── themes.css
│   ├── App.tsx            # 应用入口
│   └── main.tsx           # 渲染入口
├── public/                # 静态资源
├── tests/                 # 测试文件
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example           # 环境变量示例
├── .eslintrc.js           # ESLint 配置
├── .prettierrc            # Prettier 配置
├── tsconfig.json          # TypeScript 配置
├── vite.config.ts         # Vite 配置
├── package.json           # 项目依赖
└── README.md              # 项目说明
```

## 4. 核心组件设计

### 4.1 思维导图编辑器 (MindMapEditor)

**职责**:
- 管理思维导图的渲染和交互
- 处理节点的创建、编辑、删除、拖拽
- 支持节点的格式编辑（粗体、斜体、颜色、下划线）
- 管理节点的参考资料

**核心状态**:
```typescript
interface MindMapState {
  nodes: Map<Id, MindMapNode>;
  selectedNodeIds: Set<Id>;
  editingNodeId: Id | null;
  rootNodeId: Id;
}
```

**关键方法**:
- `createNode(parentId?: Id)`: 创建新节点
- `updateNode(nodeId: Id, updates: Partial<MindMapNode>)`: 更新节点
- `deleteNode(nodeId: Id)`: 删除节点
- `moveNode(nodeId: Id, newParentId: Id, index: number)`: 移动节点
- `toggleNodeFormat(nodeId: Id, format: TextStyle)`: 切换节点格式

### 4.2 文章预览区 (ArticlePreview)

**职责**:
- 展示文章的 Block 列表
- 处理 Block 的编辑和格式化
- 管理 Block 的锁定状态
- 展示引用来源

**核心状态**:
```typescript
interface ArticleState {
  blocks: ArticleBlock[];
  selectedBlockId: Id | null;
  editingBlockId: Id | null;
}
```

**关键方法**:
- `updateBlock(blockId: Id, content: TextSegment[])`: 更新 Block 内容
- `toggleBlockLock(blockId: Id)`: 切换 Block 锁定状态
- `highlightBlock(blockId: Id)`: 高亮显示 Block

### 4.3 AI 服务 (AIService)

**职责**:
- 管理 AI API 调用
- 构建 Prompt 和上下文
- 解析 AI 响应
- 处理错误和重试

**核心方法**:
- `generateBlocks(nodeIds: Id[], options: GenerateOptions)`: 生成选中节点的段落
- `rewriteBlock(blockId: Id, options: RewriteOptions)`: 重写指定 Block
- `generateFullArticle()`: 生成全文
- `buildContext(nodeIds: Id[])`: 构建 AI 上下文

### 4.4 点数管理 (CreditsService)

**职责**:
- 管理用户点数余额
- 计算操作消耗点数
- 记录点数使用历史
- 提供购买入口

**核心状态**:
```typescript
interface CreditsState {
  balance: number;
  dailyLimit: number;
  usedToday: number;
  history: CreditTransaction[];
}
```

## 5. 状态管理架构

### 5.1 状态划分原则

1. **局部状态**: 组件内部使用的临时状态（如输入框内容）
2. **共享状态**: 多个组件共享的状态（如思维导图节点、文章 Blocks）
3. **持久化状态**: 需要保存到本地的状态（如文章内容、用户设置）

### 5.2 Zustand Store 设计

```typescript
// mindmapStore.ts
interface MindMapStore {
  nodes: Map<Id, MindMapNode>;
  selectedNodeIds: Set<Id>;
  actions: {
    createNode: (parentId?: Id) => Id;
    updateNode: (nodeId: Id, updates: Partial<MindMapNode>) => void;
    deleteNode: (nodeId: Id) => void;
    moveNode: (nodeId: Id, newParentId: Id, index: number) => void;
    selectNodes: (nodeIds: Id[]) => void;
  };
}

// articleStore.ts
interface ArticleStore {
  blocks: ArticleBlock[];
  selectedBlockId: Id | null;
  actions: {
    updateBlock: (blockId: Id, content: TextSegment[]) => void;
    toggleBlockLock: (blockId: Id) => void;
    deleteBlock: (blockId: Id) => void;
  };
}

// aiStore.ts
interface AIStore {
  isGenerating: boolean;
  currentTask: AITask | null;
  error: AIError | null;
  actions: {
    generateBlocks: (nodeIds: Id[], options: GenerateOptions) => Promise<void>;
    rewriteBlock: (blockId: Id, options: RewriteOptions) => Promise<void>;
    cancelGeneration: () => void;
  };
}

// creditsStore.ts
interface CreditsStore {
  balance: number;
  dailyLimit: number;
  usedToday: number;
  actions: {
    consumeCredits: (amount: number) => boolean;
    checkBalance: (required: number) => boolean;
    refreshBalance: () => Promise<void>;
  };
}
```

## 6. 数据流设计

### 6.1 核心数据流

```
用户操作 → 组件 → Store Action → Service → API/Storage
                ↓
              更新状态
                ↓
              组件重渲染
```

### 6.2 AI 生成流程

```
1. 用户选中节点 → 触发 generateBlocks
2. 检查点数余额 → creditsStore.checkBalance
3. 构建上下文 → aiService.buildContext
4. 调用 AI API → aiService.generateBlocks
5. 解析响应 → aiService.parseResponse
6. 更新 Blocks → articleStore.updateBlocks
7. 扣除点数 → creditsStore.consumeCredits
8. 保存到本地 → storageService.save
```

### 6.3 本地存储策略

```typescript
// 自动保存策略
const AUTO_SAVE_INTERVAL = 30000; // 30秒

// 存储结构
interface StorageData {
  articles: Map<Id, Article>;
  mindmaps: Map<Id, MindMapNode>;
  settings: UserSettings;
  credits: CreditsState;
}

// 存储优先级
1. IndexedDB (主要存储)
2. LocalStorage (备份存储)
3. 内存缓存 (快速访问)
```

## 7. API 设计

### 7.1 AI API 接口

```typescript
interface AIAPI {
  generateBlocks(request: GenerateRequest): Promise<GenerateResponse>;
  rewriteBlock(request: RewriteRequest): Promise<RewriteResponse>;
  generateFullArticle(request: FullArticleRequest): Promise<FullArticleResponse>;
}

interface GenerateRequest {
  requestId: Id;
  nodeIds: Id[];
  context: AIContext;
  options: GenerateOptions;
}

interface GenerateResponse {
  requestId: Id;
  blocks: ArticleBlock[];
  citations?: Citation[];
  tokenUsed: number;
}
```

### 7.2 存储 API 接口

```typescript
interface StorageAPI {
  saveArticle(article: Article): Promise<void>;
  loadArticle(articleId: Id): Promise<Article | null>;
  deleteArticle(articleId: Id): Promise<void>;
  listArticles(): Promise<Article[]>;
}
```

## 8. 性能优化策略

### 8.1 渲染优化
- 使用 React.memo 优化组件渲染
- 虚拟滚动处理大量节点
- 懒加载非关键组件

### 8.2 数据优化
- IndexedDB 索引优化
- 数据分页加载
- 缓存常用数据

### 8.3 AI 调用优化
- 请求去重
- 结果缓存
- 流式响应处理

## 9. 错误处理

### 9.1 错误分类
- **用户错误**: 输入验证失败、权限不足
- **系统错误**: 网络错误、API 错误、存储错误
- **AI 错误**: 生成失败、超时、内容违规

### 9.2 错误处理策略
```typescript
interface ErrorHandler {
  handleUserError(error: UserError): void;
  handleSystemError(error: SystemError): void;
  handleAIError(error: AIError): void;
  retry<T>(fn: () => Promise<T>, maxRetries: number): Promise<T>;
}
```

## 10. 安全考虑

### 10.1 数据安全
- 本地数据加密存储
- API 密钥安全存储
- 敏感信息脱敏

### 10.2 API 安全
- 请求签名验证
- 频率限制
- CORS 配置

## 11. 扩展性设计

### 11.1 插件系统
- 预留插件接口
- 支持自定义导出格式
- 支持自定义 AI 模型

### 11.2 配置化
- 主题配置
- 快捷键配置
- AI 参数配置

## 12. 监控与日志

### 12.1 性能监控
- 页面加载时间
- AI 调用耗时
- 用户操作响应时间

### 12.2 错误监控
- 错误日志收集
- 用户行为追踪
- 异常告警

## 13. 部署架构

### 13.1 开发环境
- 本地开发服务器
- 热更新
- 开发工具集成

### 13.2 生产环境
- Vercel 部署
- CDN 加速
- 环境变量管理

## 14. 后续演进

### 14.1 V1.0 规划
- 云端存储迁移
- 用户认证系统
- 多设备同步

### 14.2 V1.1 规划
- 插件系统
- 多模型支持
- 协作功能
