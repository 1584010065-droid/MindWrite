# 开发规范文档

## 1. 代码风格规范

### 1.1 TypeScript 规范

#### 命名规范
- **文件命名**: 使用 PascalCase，如 `MindMapEditor.tsx`
- **组件命名**: 使用 PascalCase，如 `MindMapEditor`
- **函数命名**: 使用 camelCase，如 `createNode`
- **常量命名**: 使用 UPPER_SNAKE_CASE，如 `AUTO_SAVE_INTERVAL`
- **类型命名**: 使用 PascalCase，如 `MindMapNode`
- **接口命名**: 使用 PascalCase，如 `ArticleBlock`

#### 类型定义
```typescript
// 优先使用 interface 定义对象类型
interface MindMapNode {
  id: Id;
  content: TextSegment[];
  children: MindMapNode[];
}

// 使用 type 定义联合类型、交叉类型
type NodeSource = 
  | { id: Id; type: "url"; value: string }
  | { id: Id; type: "text"; value: string };

// 避免使用 any，使用 unknown 或具体类型
function processData(data: unknown): void {
  // 类型守卫
  if (typeof data === 'string') {
    // ...
  }
}
```

#### 函数定义
```typescript
// 优先使用箭头函数
const createNode = (parentId?: Id): Id => {
  // ...
};

// 对于复杂函数，使用函数声明
function buildContext(nodeIds: Id[]): AIContext {
  // ...
}

// 使用默认参数
const generateBlocks = (
  nodeIds: Id[],
  options: GenerateOptions = {}
): Promise<void> => {
  // ...
};
```

### 1.2 React 组件规范

#### 组件结构
```typescript
// 组件文件结构
import React from 'react';
import { useStore } from '@/stores';
import { Button } from '@/components/ui';

interface MindMapEditorProps {
  articleId: Id;
  onSave?: () => void;
}

export const MindMapEditor: React.FC<MindMapEditorProps> = ({
  articleId,
  onSave,
}) => {
  // 1. Hooks 声明
  const { nodes, actions } = useMindMapStore();
  const [isEditing, setIsEditing] = useState(false);
  
  // 2. 副作用
  useEffect(() => {
    // ...
  }, [articleId]);
  
  // 3. 事件处理函数
  const handleNodeCreate = useCallback(() => {
    // ...
  }, [dependencies]);
  
  // 4. 渲染函数
  const renderNode = useCallback((node: MindMapNode) => {
    // ...
  }, []);
  
  // 5. 主渲染
  return (
    <div className="mindmap-editor">
      {/* ... */}
    </div>
  );
};
```

#### Hooks 使用规范
```typescript
// 自定义 Hook 命名以 use 开头
const useMindMap = (articleId: Id) => {
  const store = useMindMapStore();
  
  useEffect(() => {
    store.actions.loadArticle(articleId);
  }, [articleId]);
  
  return store;
};

// 依赖数组必须完整
useEffect(() => {
  // ...
}, [nodeId, store.actions]); // 包含所有依赖

// 使用 useCallback 缓存回调
const handleClick = useCallback(() => {
  // ...
}, [dependency1, dependency2]);
```

### 1.3 CSS 规范

#### Tailwind CSS 使用
```typescript
// 使用语义化的 class 组合
const buttonStyles = `
  px-4 py-2 
  bg-blue-500 hover:bg-blue-600 
  text-white rounded-lg 
  transition-colors duration-200
`;

// 使用 class-variance-authority (CVA) 管理变体
const buttonVariants = cva("button", {
  variants: {
    intent: {
      primary: "bg-blue-500 text-white",
      secondary: "bg-gray-500 text-white",
    },
    size: {
      small: "px-2 py-1 text-sm",
      medium: "px-4 py-2 text-base",
    },
  },
});
```

## 2. Git 提交规范

### 2.1 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 2.2 提交类型

- **feat**: 新功能
- **fix**: 修复 bug
- **docs**: 文档更新
- **style**: 代码格式调整（不影响功能）
- **refactor**: 重构（既不是新功能也不是修复 bug）
- **perf**: 性能优化
- **test**: 测试相关
- **chore**: 构建过程或辅助工具的变动
- **ci**: CI 配置文件和脚本的变动
- **revert**: 回滚之前的 commit

### 2.3 提交示例

```bash
# 新功能
feat(mindmap): add node formatting support

Add support for bold, italic, underline, and color formatting
for mind map nodes.

Closes #123

# 修复 bug
fix(ai): prevent duplicate block generation

Fixed an issue where the same block could be generated multiple
times when the user rapidly clicks the generate button.

Fixes #456

# 文档更新
docs(readme): update installation instructions

Updated the README with the latest installation steps and
dependencies.

# 重构
refactor(storage): migrate from localStorage to IndexedDB

Migrated the storage backend from localStorage to IndexedDB
for better performance and larger storage capacity.
```

### 2.4 分支管理策略

```
main (生产分支)
  ├── develop (开发分支)
  │   ├── feature/mindmap-editor (功能分支)
  │   ├── feature/ai-integration (功能分支)
  │   └── bugfix/block-lock-issue (修复分支)
  └── hotfix/critical-bug (紧急修复分支)
```

#### 分支命名规范
- **功能分支**: `feature/功能名称`
- **修复分支**: `bugfix/问题描述`
- **紧急修复**: `hotfix/问题描述`
- **发布分支**: `release/版本号`

## 3. 代码审查流程

### 3.1 Pull Request 规范

#### PR 标题格式
```
[类型] 简短描述
```

#### PR 描述模板
```markdown
## 变更类型
- [ ] 新功能
- [ ] Bug 修复
- [ ] 重构
- [ ] 文档更新
- [ ] 其他

## 变更说明
简要描述本次变更的内容和原因。

## 相关 Issue
Closes #issue_number

## 测试计划
- [ ] 单元测试已通过
- [ ] 集成测试已通过
- [ ] 手动测试已完成

## 截图（如适用）
添加相关截图。

## 检查清单
- [ ] 代码符合项目规范
- [ ] 已添加必要的注释
- [ ] 已更新相关文档
- [ ] 没有引入新的警告
```

### 3.2 代码审查要点

#### 功能性
- [ ] 功能是否按需求实现
- [ ] 边界情况是否处理
- [ ] 错误处理是否完善

#### 代码质量
- [ ] 代码是否清晰易读
- [ ] 命名是否语义化
- [ ] 是否有重复代码
- [ ] 是否有过度设计

#### 性能
- [ ] 是否有性能问题
- [ ] 是否有不必要的重渲染
- [ ] 是否有内存泄漏风险

#### 安全性
- [ ] 是否有安全漏洞
- [ ] 敏感信息是否正确处理
- [ ] 用户输入是否验证

#### 测试
- [ ] 测试覆盖率是否足够
- [ ] 测试用例是否有效
- [ ] 边界情况是否测试

## 4. 项目配置规范

### 4.1 ESLint 配置

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
```

### 4.2 Prettier 配置

```javascript
// .prettierrc
module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  arrowParens: 'always',
  endOfLine: 'lf',
};
```

### 4.3 TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 5. 文档规范

### 5.1 代码注释

#### 函数注释
```typescript
/**
 * 创建新的思维导图节点
 * @param parentId - 父节点 ID，如果不提供则创建根节点
 * @returns 新创建的节点 ID
 * @example
 * const nodeId = createNode('parent-123');
 */
const createNode = (parentId?: Id): Id => {
  // ...
};
```

#### 复杂逻辑注释
```typescript
// 构建上下文时，我们需要：
// 1. 获取选中节点的完整路径
// 2. 获取相邻节点的摘要
// 3. 获取锁定块的内容
const buildContext = (nodeIds: Id[]): AIContext => {
  // ...
};
```

### 5.2 README 规范

```markdown
# 项目名称

简短的项目描述。

## 功能特性

- 功能 1
- 功能 2

## 快速开始

### 安装依赖
\`\`\`bash
pnpm install
\`\`\`

### 开发模式
\`\`\`bash
pnpm dev
\`\`\`

### 构建生产版本
\`\`\`bash
pnpm build
\`\`\`

## 项目结构

简要说明项目目录结构。

## 技术栈

列出主要技术栈。

## 贡献指南

链接到贡献指南文档。

## 许可证

MIT
```

## 6. 测试规范

### 6.1 测试文件命名

```
src/components/MindMapEditor.tsx
tests/unit/MindMapEditor.test.tsx
tests/integration/mindmap.test.ts
tests/e2e/mindmap.spec.ts
```

### 6.2 测试用例编写

```typescript
describe('MindMapEditor', () => {
  it('should create a new node when Enter key is pressed', () => {
    // Arrange
    const { getByText } = render(<MindMapEditor />);
    
    // Act
    fireEvent.keyDown(getByText('中心主题'), { key: 'Enter' });
    
    // Assert
    expect(getByText('新节点')).toBeInTheDocument();
  });

  it('should not allow generating content for empty nodes', () => {
    // ...
  });
});
```

## 7. 性能优化规范

### 7.1 组件优化

```typescript
// 使用 React.memo 避免不必要的重渲染
export const MindMapNode = React.memo<MindMapNodeProps>(
  ({ node, onUpdate }) => {
    // ...
  },
  (prevProps, nextProps) => {
    return prevProps.node.id === nextProps.node.id &&
           prevProps.node.content === nextProps.node.content;
  }
);

// 使用 useMemo 缓存计算结果
const sortedNodes = useMemo(() => {
  return nodes.sort((a, b) => a.order - b.order);
}, [nodes]);

// 使用 useCallback 缓存回调函数
const handleNodeUpdate = useCallback((nodeId: Id, updates: Partial<MindMapNode>) => {
  actions.updateNode(nodeId, updates);
}, [actions]);
```

### 7.2 数据优化

```typescript
// 使用 Map 提高查找性能
const nodesMap = new Map<Id, MindMapNode>();

// 使用虚拟滚动处理大量数据
import { FixedSizeList } from 'react-window';

// 使用防抖和节流
const debouncedSave = useMemo(
  () => debounce((data) => storageService.save(data), 1000),
  []
);
```

## 8. 安全规范

### 8.1 敏感信息处理

```typescript
// 不要在代码中硬编码敏感信息
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// 使用环境变量
// .env.local
VITE_OPENAI_API_KEY=your_api_key_here

// .gitignore
.env.local
.env.*.local
```

### 8.2 用户输入验证

```typescript
// 验证用户输入
const validateNodeContent = (content: string): boolean => {
  if (content.length > 1000) {
    throw new Error('节点内容过长');
  }
  return true;
};

// XSS 防护
import DOMPurify from 'dompurify';

const sanitizeContent = (content: string): string => {
  return DOMPurify.sanitize(content);
};
```

## 9. 错误处理规范

### 9.1 错误分类

```typescript
enum ErrorType {
  USER_ERROR = 'USER_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  AI_ERROR = 'AI_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

class AppError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public code?: string
  ) {
    super(message);
  }
}
```

### 9.2 错误处理

```typescript
// 统一错误处理
const handleError = (error: unknown) => {
  if (error instanceof AppError) {
    switch (error.type) {
      case ErrorType.USER_ERROR:
        toast.error(error.message);
        break;
      case ErrorType.AI_ERROR:
        toast.error('AI 生成失败，请重试');
        break;
      default:
        toast.error('系统错误，请联系管理员');
    }
  } else {
    console.error('Unknown error:', error);
    toast.error('未知错误');
  }
};

// 使用 Error Boundary
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

## 10. 开发工具配置

### 10.1 VS Code 配置

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### 10.2 推荐扩展

```json
// .vscode/extensions.json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

## 11. 持续集成规范

### 11.1 GitHub Actions 配置

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

## 12. 发布流程规范

### 12.1 版本号规范

使用语义化版本号：`MAJOR.MINOR.PATCH`

- **MAJOR**: 不兼容的 API 变更
- **MINOR**: 向后兼容的功能新增
- **PATCH**: 向后兼容的问题修复

### 12.2 发布检查清单

- [ ] 所有测试通过
- [ ] 代码审查完成
- [ ] 文档已更新
- [ ] 版本号已更新
- [ ] CHANGELOG 已更新
- [ ] 构建成功
- [ ] 部署成功
- [ ] 生产环境验证通过
