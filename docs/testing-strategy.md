# 测试策略文档

## 1. 测试目标

确保 MindWrite MVP 版本的功能正确性、性能稳定性和用户体验质量，通过多层次的测试策略覆盖所有关键功能点。

## 2. 测试层次

### 2.1 单元测试（Unit Testing）

#### 测试范围
- 工具函数
- 状态管理逻辑
- 数据转换函数
- 业务逻辑计算

#### 测试工具
- **Vitest**: 快速的单元测试框架
- **React Testing Library**: React 组件测试
- **@testing-library/jest-dom**: DOM 匹配器

#### 测试用例示例

```typescript
// utils/idGenerator.test.ts
import { describe, it, expect } from 'vitest';
import { generateId, isValidId } from './idGenerator';

describe('idGenerator', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('should generate valid IDs', () => {
    const id = generateId();
    expect(isValidId(id)).toBe(true);
  });
});

// stores/mindmapStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useMindMapStore } from './mindmapStore';

describe('mindmapStore', () => {
  beforeEach(() => {
    useMindMapStore.setState({
      nodes: new Map(),
      selectedNodeIds: new Set(),
    });
  });

  it('should create a new node', () => {
    const store = useMindMapStore.getState();
    const nodeId = store.actions.createNode();
    
    expect(store.nodes.has(nodeId)).toBe(true);
    expect(store.nodes.get(nodeId)?.content).toEqual([]);
  });

  it('should delete a node', () => {
    const store = useMindMapStore.getState();
    const nodeId = store.actions.createNode();
    
    store.actions.deleteNode(nodeId);
    
    expect(store.nodes.has(nodeId)).toBe(false);
  });
});
```

#### 覆盖率目标
- **工具函数**: 100%
- **状态管理**: 90%
- **业务逻辑**: 80%
- **总体覆盖率**: > 70%

### 2.2 集成测试（Integration Testing）

#### 测试范围
- 组件间交互
- 状态管理与组件的集成
- 服务层与 API 的集成
- 存储层与数据持久化

#### 测试工具
- **React Testing Library**: 组件集成测试
- **MSW (Mock Service Worker)**: API Mock
- **@testing-library/user-event**: 用户交互模拟

#### 测试用例示例

```typescript
// components/MindMapEditor.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MindMapEditor } from './MindMapEditor';

describe('MindMapEditor', () => {
  it('should create a new node when Enter key is pressed', async () => {
    const user = userEvent.setup();
    render(<MindMapEditor />);

    const rootNode = screen.getByText('中心主题');
    await user.click(rootNode);
    await user.keyboard('{Enter}');

    expect(screen.getByText('新节点')).toBeInTheDocument();
  });

  it('should update node content when edited', async () => {
    const user = userEvent.setup();
    render(<MindMapEditor />);

    const node = screen.getByText('中心主题');
    await user.dblClick(node);
    
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '新的主题');
    
    expect(screen.getByText('新的主题')).toBeInTheDocument();
  });
});

// services/ai/aiService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { AIService } from './aiService';

const server = setupServer(
  rest.post('/api/generate', (req, res, ctx) => {
    return res(ctx.json({
      blocks: [{ id: '1', content: '生成的内容' }],
      tokenUsed: 100,
    }));
  })
);

describe('AIService', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should generate blocks successfully', async () => {
    const aiService = new AIService();
    const result = await aiService.generateBlocks(['node1'], {});

    expect(result.blocks).toHaveLength(1);
    expect(result.tokenUsed).toBe(100);
  });

  it('should handle API errors', async () => {
    server.use(
      rest.post('/api/generate', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    const aiService = new AIService();
    await expect(aiService.generateBlocks(['node1'], {})).rejects.toThrow();
  });
});
```

### 2.3 端到端测试（E2E Testing）

#### 测试范围
- 完整的用户流程
- 跨页面交互
- 真实环境下的功能验证

#### 测试工具
- **Playwright**: E2E 测试框架
- **真实浏览器**: Chrome、Firefox、Safari

#### 测试用例示例

```typescript
// e2e/mindmap.spec.ts
import { test, expect } from '@playwright/test';

test.describe('MindMap Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should create and edit nodes', async ({ page }) => {
    // 创建新节点
    await page.click('[data-testid="root-node"]');
    await page.keyboard.press('Enter');
    
    // 编辑节点内容
    await page.dblclick('[data-testid="new-node"]');
    await page.fill('[data-testid="node-input"]', '测试节点');
    await page.keyboard.press('Escape');
    
    // 验证节点内容
    await expect(page.locator('[data-testid="new-node"]')).toContainText('测试节点');
  });

  test('should generate article from mindmap', async ({ page }) => {
    // 创建思维导图
    await page.click('[data-testid="root-node"]');
    await page.keyboard.press('Enter');
    await page.dblclick('[data-testid="new-node"]');
    await page.fill('[data-testid="node-input"]', '测试主题');
    
    // 生成文章
    await page.click('[data-testid="generate-button"]');
    
    // 等待生成完成
    await page.waitForSelector('[data-testid="article-block"]', { timeout: 30000 });
    
    // 验证文章生成
    const blocks = await page.locator('[data-testid="article-block"]').count();
    expect(blocks).toBeGreaterThan(0);
  });
});
```

## 3. 功能测试清单

### 3.1 思维导图编辑器

#### 节点操作
- [ ] 创建节点（Enter/Tab）
- [ ] 编辑节点（双击）
- [ ] 删除节点（Delete/Backspace）
- [ ] 拖拽节点重排
- [ ] 折叠/展开节点
- [ ] 多选节点

#### 格式编辑
- [ ] 粗体
- [ ] 斜体
- [ ] 下划线
- [ ] 文字颜色

#### 参考资料管理
- [ ] 添加 URL 资料
- [ ] 添加文本资料
- [ ] 编辑资料
- [ ] 删除资料

### 3.2 文章预览区

#### Block 操作
- [ ] 展示 Block 列表
- [ ] 编辑 Block 内容
- [ ] 锁定/解锁 Block
- [ ] 删除 Block

#### 格式编辑
- [ ] 粗体
- [ ] 斜体
- [ ] 下划线
- [ ] 文字颜色

### 3.3 AI 生成功能

#### 分段生成
- [ ] 选中节点生成
- [ ] 显示影响范围
- [ ] 显示生成进度
- [ ] 处理生成错误

#### 全文重写
- [ ] 全文重写功能
- [ ] 保留锁定 Block
- [ ] 显示影响范围

#### 局部重写
- [ ] Block 级别重写
- [ ] 重写选项（扩展、缩短）
- [ ] 重写预览

### 3.4 锁定机制

- [ ] 锁定 Block
- [ ] 解锁 Block
- [ ] 锁定 Block 不被 AI 覆盖
- [ ] 锁定状态持久化

### 3.5 节点-文段映射

- [ ] 节点到 Block 的映射
- [ ] 点击节点高亮 Block
- [ ] 点击 Block 高亮节点
- [ ] 节点移动时 Block 跟随

### 3.6 点数管理

- [ ] 点数余额展示
- [ ] 点数消耗计算
- [ ] 点数不足提示
- [ ] 点数消耗记录

### 3.7 导出功能

- [ ] Markdown 导出
- [ ] 纯文本导出
- [ ] 导图大纲导出

## 4. 性能测试

### 4.1 性能指标

| 指标 | 目标值 | 测试方法 |
|-----|-------|---------|
| 页面加载时间 | < 3s | Lighthouse |
| 首次内容绘制（FCP） | < 1.5s | Lighthouse |
| 最大内容绘制（LCP） | < 2.5s | Lighthouse |
| AI 响应时间 | < 20s | 手动测试 |
| 节点操作响应 | < 100ms | Performance API |

### 4.2 性能测试场景

#### 大数据量测试
- 300 个节点的思维导图
- 300 个 Block 的文章
- 100 条参考资料

#### 并发测试
- 多个 AI 生成请求并发
- 多个用户操作并发

#### 内存测试
- 长时间使用的内存占用
- 内存泄漏检测

### 4.3 性能测试工具

- **Lighthouse**: 性能审计
- **Chrome DevTools**: 性能分析
- **React DevTools Profiler**: 组件性能

## 5. 兼容性测试

### 5.1 浏览器兼容性

| 浏览器 | 版本 | 测试状态 |
|--------|------|---------|
| Chrome | 最新版 | 必须支持 |
| Firefox | 最新版 | 必须支持 |
| Safari | 最新版 | 必须支持 |
| Edge | 最新版 | 必须支持 |

### 5.2 设备兼容性

- **桌面**: Windows、macOS、Linux
- **移动端**: iOS Safari、Android Chrome（响应式设计）

### 5.3 屏幕尺寸

- 1920x1080（桌面）
- 1366x768（笔记本）
- 768x1024（平板）
- 375x667（手机）

## 6. 安全测试

### 6.1 安全测试项

- [ ] XSS 攻击防护
- [ ] CSRF 防护
- [ ] API 密钥安全
- [ ] 用户数据加密
- [ ] 输入验证

### 6.2 安全测试工具

- **OWASP ZAP**: 安全扫描
- **npm audit**: 依赖安全检查
- **Snyk**: 漏洞扫描

## 7. 可访问性测试

### 7.1 可访问性标准

- **WCAG 2.1 AA**: 核心标准
- **键盘导航**: 完全支持
- **屏幕阅读器**: 基本支持

### 7.2 测试项

- [ ] 键盘导航
- [ ] 屏幕阅读器兼容
- [ ] 颜色对比度
- [ ] 焦点管理
- [ ] ARIA 标签

### 7.3 测试工具

- **axe DevTools**: 可访问性检查
- **WAVE**: 可访问性评估
- **NVDA**: 屏幕阅读器测试

## 8. 测试数据准备

### 8.1 测试数据类型

#### 思维导图数据
```typescript
const testMindMap = {
  id: 'test-root',
  content: [{ text: '测试主题' }],
  children: [
    {
      id: 'test-node-1',
      content: [{ text: '子主题 1' }],
      children: [],
    },
    {
      id: 'test-node-2',
      content: [{ text: '子主题 2' }],
      children: [],
    },
  ],
};
```

#### 文章数据
```typescript
const testArticle = {
  id: 'test-article',
  title: '测试文章',
  blocks: [
    {
      id: 'test-block-1',
      content: [{ text: '第一段内容' }],
      sourceNodeId: 'test-node-1',
    },
  ],
};
```

### 8.2 Mock 数据

#### AI 响应 Mock
```typescript
const mockAIResponse = {
  blocks: [
    {
      id: 'generated-block-1',
      content: [{ text: 'AI 生成的内容' }],
    },
  ],
  tokenUsed: 150,
};
```

## 9. 测试环境

### 9.1 开发环境
- 本地开发服务器
- Mock API
- 测试数据库

### 9.2 测试环境
- CI/CD 环境
- 真实 API（测试账号）
- 测试数据集

### 9.3 生产环境
- 真实用户环境
- 监控和日志
- 真实数据

## 10. 测试流程

### 10.1 开发阶段
1. 编写单元测试
2. 运行测试确保通过
3. 提交代码前运行所有测试

### 10.2 集成阶段
1. 运行集成测试
2. 进行手动测试
3. 修复发现的问题

### 10.3 发布阶段
1. 运行完整测试套件
2. 进行性能测试
3. 进行安全测试
4. 进行兼容性测试

## 11. 缺陷管理

### 11.1 缺陷分类

| 等级 | 描述 | 响应时间 |
|-----|------|---------|
| P0 | 阻塞性缺陷，影响核心功能 | 立即修复 |
| P1 | 严重缺陷，影响重要功能 | 24小时内 |
| P2 | 一般缺陷，影响次要功能 | 3天内 |
| P3 | 轻微缺陷，不影响使用 | 下个版本 |

### 11.2 缺陷报告模板

```markdown
## 缺陷描述
简要描述缺陷现象。

## 复现步骤
1. 步骤一
2. 步骤二
3. 步骤三

## 期望结果
描述期望的正确行为。

## 实际结果
描述实际的错误行为。

## 环境信息
- 浏览器: Chrome 120
- 操作系统: macOS 14
- 版本: v1.0.0

## 截图/日志
添加相关截图或日志。
```

## 12. 测试报告

### 12.1 测试报告内容

- 测试概览
- 测试覆盖率
- 缺陷统计
- 性能测试结果
- 兼容性测试结果
- 风险评估

### 12.2 测试报告模板

```markdown
# 测试报告

## 测试概览
- 测试时间: 2026-03-15
- 测试版本: v1.0.0
- 测试人员: 测试团队

## 测试覆盖率
- 单元测试覆盖率: 75%
- 集成测试覆盖率: 60%
- E2E 测试覆盖率: 40%

## 缺陷统计
- P0 缺陷: 0
- P1 缺陷: 2
- P2 缺陷: 5
- P3 缺陷: 10

## 性能测试结果
- 页面加载时间: 2.5s
- AI 响应时间: 15s
- 节点操作响应: 80ms

## 兼容性测试结果
- Chrome: 通过
- Firefox: 通过
- Safari: 通过
- Edge: 通过

## 风险评估
- 低风险: 可以发布
```

## 13. 自动化测试

### 13.1 CI/CD 集成

```yaml
# .github/workflows/test.yml
name: Test

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
      - run: pnpm test:unit
      - run: pnpm test:integration
      - run: pnpm test:e2e
```

### 13.2 测试脚本

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:watch": "vitest watch"
  }
}
```

## 14. 测试最佳实践

### 14.1 测试原则
- **FIRST 原则**: Fast、Independent、Repeatable、Self-validating、Timely
- **单一职责**: 每个测试只验证一个功能点
- **清晰命名**: 测试名称清晰描述测试内容

### 14.2 测试代码质量
- 保持测试代码简洁
- 避免测试中的逻辑
- 使用有意义的断言
- 及时维护测试代码

### 14.3 测试数据管理
- 使用工厂模式创建测试数据
- 避免硬编码测试数据
- 定期更新测试数据
