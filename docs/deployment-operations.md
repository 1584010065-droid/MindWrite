# 部署与运维文档

## 1. 部署架构

### 1.1 整体架构

```
用户浏览器
    ↓
CDN (Vercel Edge Network)
    ↓
前端应用 (React SPA)
    ↓
外部 API (OpenAI/Claude API)
    ↓
本地存储 (IndexedDB/LocalStorage)
```

### 1.2 部署环境

| 环境 | 用途 | 域名 | 分支 |
|-----|------|------|------|
| 开发环境 | 本地开发和测试 | localhost | feature/* |
| 预览环境 | PR 预览和测试 | *.vercel.app | develop |
| 生产环境 | 正式发布 | mindwrite.app | main |

## 2. Vercel 部署配置

### 2.1 项目配置

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.openai.com https://api.anthropic.com;"
        }
      ]
    }
  ]
}
```

### 2.2 环境变量配置

```bash
# .env.production
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_CLAUDE_API_KEY=your_claude_api_key
VITE_API_BASE_URL=https://api.openai.com
VITE_SENTRY_DSN=your_sentry_dsn
VITE_GA_ID=your_google_analytics_id
```

### 2.3 构建配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          flow: ['react-flow-renderer'],
          editor: ['@tiptap/react', '@tiptap/starter-kit'],
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
```

## 3. CI/CD 流程

### 3.1 GitHub Actions 配置

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

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
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run linter
        run: pnpm lint
      
      - name: Run tests
        run: pnpm test:coverage
      
      - name: Build
        run: pnpm build
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  deploy-preview:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          github-comment: true

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### 3.2 部署流程

```
1. 代码提交到 GitHub
   ↓
2. GitHub Actions 触发 CI
   ↓
3. 运行测试和构建
   ↓
4. 部署到 Vercel 预览环境（PR）
   或部署到生产环境（main 分支）
   ↓
5. 自动配置 CDN 和 HTTPS
   ↓
6. 部署完成通知
```

## 4. 监控与日志

### 4.1 应用监控

#### Vercel Analytics
```typescript
// src/main.tsx
import { Analytics } from '@vercel/analytics/react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>
);
```

#### 性能监控
```typescript
// utils/performanceMonitoring.ts
export const initPerformanceMonitoring = () => {
  if (typeof window !== 'undefined') {
    // 监控 Web Vitals
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log);
      getFID(console.log);
      getFCP(console.log);
      getLCP(console.log);
      getTTFB(console.log);
    });
  }
};
```

### 4.2 错误监控

#### Sentry 集成
```typescript
// src/main.tsx
import * as Sentry from '@sentry/react';

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay(),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
```

### 4.3 日志管理

#### 结构化日志
```typescript
// utils/logger.ts
class Logger {
  private static instance: Logger;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  log(level: string, message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      environment: import.meta.env.MODE,
      version: import.meta.env.VITE_APP_VERSION,
    };

    // 开发环境输出到控制台
    if (import.meta.env.DEV) {
      console.log(JSON.stringify(logEntry, null, 2));
    }

    // 生产环境发送到日志服务
    if (import.meta.env.PROD) {
      this.sendToLogService(logEntry);
    }
  }

  private async sendToLogService(logEntry: any) {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry),
      });
    } catch (error) {
      console.error('Failed to send log:', error);
    }
  }
}

export const logger = Logger.getInstance();
```

## 5. 备份与恢复

### 5.1 数据备份策略

#### 用户数据备份
```typescript
// services/backup.ts
class BackupService {
  // 自动备份用户数据
  async autoBackup(): Promise<void> {
    const articles = await this.getAllArticles();
    const mindmaps = await this.getAllMindMaps();
    const settings = await this.getSettings();

    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        articles,
        mindmaps,
        settings,
      },
    };

    // 保存到本地
    await this.saveBackup(backup);

    // 可选：上传到云端
    // await this.uploadToCloud(backup);
  }

  // 恢复用户数据
  async restore(backupData: any): Promise<void> {
    // 验证备份数据
    if (!this.validateBackup(backupData)) {
      throw new Error('Invalid backup data');
    }

    // 恢复数据
    await this.restoreArticles(backupData.data.articles);
    await this.restoreMindMaps(backupData.data.mindmaps);
    await this.restoreSettings(backupData.data.settings);
  }

  // 导出备份文件
  async exportBackup(): Promise<void> {
    const backup = await this.createBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `mindwrite-backup-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  private async saveBackup(backup: any): Promise<void> {
    localStorage.setItem('mindwrite_backup', JSON.stringify(backup));
  }

  private validateBackup(backup: any): boolean {
    return backup && backup.version && backup.data;
  }

  // 其他方法的实现...
}

export const backupService = new BackupService();
```

### 5.2 自动备份调度

```typescript
// utils/backupScheduler.ts
class BackupScheduler {
  private static instance: BackupScheduler;
  private intervalId: NodeJS.Timeout | null = null;

  static getInstance(): BackupScheduler {
    if (!BackupScheduler.instance) {
      BackupScheduler.instance = new BackupScheduler();
    }
    return BackupScheduler.instance;
  }

  // 启动自动备份
  startAutoBackup(intervalMs: number = 3600000): void {
    // 默认每小时备份一次
    this.intervalId = setInterval(() => {
      backupService.autoBackup();
    }, intervalMs);
  }

  // 停止自动备份
  stopAutoBackup(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const backupScheduler = BackupScheduler.getInstance();
```

## 6. 性能优化

### 6.1 CDN 配置

```json
// vercel.json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*).js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*).css",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 6.2 资源优化

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          flow: ['react-flow-renderer'],
          editor: ['@tiptap/react', '@tiptap/starter-kit'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

## 7. 安全配置

### 7.1 安全头配置

```json
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.openai.com https://api.anthropic.com;"
        }
      ]
    }
  ]
}
```

### 7.2 HTTPS 强制

```typescript
// src/main.tsx
if (location.protocol !== 'https:' && import.meta.env.PROD) {
  location.replace(`https:${location.href.substring(location.protocol.length)}`);
}
```

## 8. 运维流程

### 8.1 发布流程

```
1. 代码合并到 main 分支
   ↓
2. 自动触发 CI/CD
   ↓
3. 运行测试和构建
   ↓
4. 部署到生产环境
   ↓
5. 自动化测试验证
   ↓
6. 监控系统检查
   ↓
7. 发布完成通知
```

### 8.2 回滚流程

```bash
# 使用 Vercel CLI 回滚
vercel rollback

# 或在 Vercel Dashboard 中选择之前的部署版本进行回滚
```

### 8.3 紧急修复流程

```
1. 发现紧急问题
   ↓
2. 创建 hotfix 分支
   ↓
3. 修复问题并测试
   ↓
4. 合并到 main 分支
   ↓
5. 自动部署到生产环境
   ↓
6. 验证修复效果
   ↓
7. 通知相关人员
```

## 9. 容量规划

### 9.1 资源需求

| 资源 | MVP 阶段 | V1.0 阶段 |
|-----|---------|----------|
| CDN 带宽 | 10GB/月 | 100GB/月 |
| 存储空间 | 本地存储 | 10GB 云存储 |
| API 调用 | 1000次/月 | 10000次/月 |

### 9.2 扩展计划

- **水平扩展**: 使用 CDN 分发静态资源
- **垂直扩展**: 升级服务器配置（如果需要后端）
- **数据库扩展**: 使用分布式数据库（如果需要云端存储）

## 10. 成本控制

### 10.1 成本估算

| 项目 | MVP 阶段 | V1.0 阶段 |
|-----|---------|----------|
| Vercel 托管 | 免费 | $20/月 |
| 域名 | $10/年 | $10/年 |
| API 调用 | $50/月 | $200/月 |
| 监控服务 | 免费 | $10/月 |
| **总计** | **$60/月** | **$240/月** |

### 10.2 成本优化

- 使用免费额度
- 优化 API 调用频率
- 实现缓存机制
- 监控资源使用情况

## 11. 故障处理

### 11.1 故障分类

| 等级 | 描述 | 响应时间 | 处理时间 |
|-----|------|---------|---------|
| P0 | 服务完全不可用 | 5分钟 | 30分钟 |
| P1 | 核心功能不可用 | 15分钟 | 2小时 |
| P2 | 次要功能异常 | 1小时 | 4小时 |
| P3 | 轻微问题 | 4小时 | 24小时 |

### 11.2 故障处理流程

```
1. 发现故障
   ↓
2. 评估故障等级
   ↓
3. 通知相关人员
   ↓
4. 定位问题原因
   ↓
5. 实施修复方案
   ↓
6. 验证修复效果
   ↓
7. 恢复服务
   ↓
8. 总结经验教训
```

### 11.3 故障通知

```typescript
// utils/incidentNotifier.ts
class IncidentNotifier {
  async notifyIncident(level: string, message: string, details: any): Promise<void> {
    // 发送邮件通知
    await this.sendEmail(level, message, details);
    
    // 发送 Slack 通知
    await this.sendSlack(level, message, details);
    
    // 记录到监控系统
    logger.log('INCIDENT', message, { level, details });
  }

  private async sendEmail(level: string, message: string, details: any): Promise<void> {
    // 实现邮件发送逻辑
  }

  private async sendSlack(level: string, message: string, details: any): Promise<void> {
    // 实现 Slack 通知逻辑
  }
}

export const incidentNotifier = new IncidentNotifier();
```

## 12. 运维最佳实践

### 12.1 监控最佳实践
- 监控关键指标
- 设置合理告警阈值
- 定期检查监控数据
- 及时响应告警

### 12.2 部署最佳实践
- 使用自动化部署
- 实施蓝绿部署
- 保持部署记录
- 快速回滚机制

### 12.3 安全最佳实践
- 定期更新依赖
- 监控安全漏洞
- 实施安全审计
- 保护敏感信息

### 12.4 性能最佳实践
- 监控性能指标
- 优化关键路径
- 实施缓存策略
- 定期性能测试

## 13. 运维工具

### 13.1 推荐工具

- **部署**: Vercel CLI
- **监控**: Vercel Analytics + Sentry
- **日志**: 自定义日志系统
- **备份**: 本地备份 + 云端备份
- **安全**: npm audit + Snyk

### 13.2 工具配置

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署项目
vercel --prod

# 查看部署状态
vercel ls

# 查看日志
vercel logs
```

## 14. 文档维护

### 14.1 文档更新
- 每次部署后更新部署记录
- 每月更新运维文档
- 每季度更新架构文档

### 14.2 知识库
- 维护运维知识库
- 记录常见问题和解决方案
- 分享最佳实践
