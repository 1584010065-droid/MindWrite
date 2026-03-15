# 性能优化策略文档

## 1. 性能目标

### 1.1 核心指标

| 指标 | 目标值 | 测量方法 |
|-----|-------|---------|
| 页面加载时间（PLT） | < 3s | Lighthouse |
| 首次内容绘制（FCP） | < 1.5s | Lighthouse |
| 最大内容绘制（LCP） | < 2.5s | Lighthouse |
| 首次输入延迟（FID） | < 100ms | Lighthouse |
| 累积布局偏移（CLS） | < 0.1 | Lighthouse |
| AI 响应时间 | < 20s | 手动测试 |
| 节点操作响应 | < 100ms | Performance API |

### 1.2 性能预算

```typescript
// 性能预算配置
const performanceBudget = {
  // 资源大小限制
  maxBundleSize: 500 * 1024, // 500KB
  maxAssetSize: 200 * 1024,  // 200KB
  maxImageSize: 100 * 1024,  // 100KB
  
  // 时间限制
  maxLoadTime: 3000,         // 3s
  maxRenderTime: 100,        // 100ms
  maxAIResponseTime: 20000,  // 20s
  
  // 请求数量限制
  maxRequests: 20,           // 最多 20 个请求
  maxCriticalRequests: 5,    // 关键请求最多 5 个
};
```

## 2. 前端性能优化

### 2.1 代码分割

#### 路由级代码分割
```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Loading } from '@/components/common/Loading';

// 懒加载路由组件
const Home = lazy(() => import('@/pages/Home'));
const Editor = lazy(() => import('@/pages/Editor'));
const Settings = lazy(() => import('@/pages/Settings'));

export const App = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
```

#### 组件级代码分割
```typescript
// src/components/MindMapEditor.tsx
import { lazy, Suspense } from 'react';

// 懒加载重型组件
const ReactFlow = lazy(() => import('react-flow-renderer'));
const TipTapEditor = lazy(() => import('@tiptap/react'));

export const MindMapEditor = () => {
  return (
    <div className="mindmap-editor">
      <Suspense fallback={<div>Loading...</div>}>
        <ReactFlow />
      </Suspense>
      <Suspense fallback={<div>Loading...</div>}>
        <TipTapEditor />
      </Suspense>
    </div>
  );
};
```

### 2.2 资源优化

#### 图片优化
```typescript
// utils/imageOptimizer.ts
class ImageOptimizer {
  // 压缩图片
  async compressImage(file: File, quality: number = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // 计算压缩后的尺寸
          const maxWidth = 800;
          const maxHeight = 600;
          let { width, height } = img;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  // 懒加载图片
  lazyLoadImage(img: HTMLImageElement): void {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          observer.unobserve(img);
        }
      });
    });
    
    observer.observe(img);
  }
}

export const imageOptimizer = new ImageOptimizer();
```

#### 字体优化
```css
/* src/styles/fonts.css */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap; /* 使用 font-display: swap 避免阻塞渲染 */
  src: url('/fonts/inter-regular.woff2') format('woff2');
}

@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('/fonts/inter-semibold.woff2') format('woff2');
}
```

### 2.3 渲染优化

#### 虚拟滚动
```typescript
// components/VirtualList.tsx
import { FixedSizeList } from 'react-window';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

export const VirtualList = <T,>({
  items,
  itemHeight,
  renderItem,
}: VirtualListProps<T>) => {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          {renderItem(items[index], index)}
        </div>
      )}
    </FixedSizeList>
  );
};
```

#### React.memo 优化
```typescript
// components/MindMapNode.tsx
import React from 'react';

interface MindMapNodeProps {
  node: MindMapNode;
  onUpdate: (nodeId: string, updates: Partial<MindMapNode>) => void;
}

export const MindMapNode = React.memo<MindMapNodeProps>(
  ({ node, onUpdate }) => {
    // 组件实现
  },
  (prevProps, nextProps) => {
    // 自定义比较函数
    return (
      prevProps.node.id === nextProps.node.id &&
      prevProps.node.content === nextProps.node.content &&
      prevProps.node.children.length === nextProps.node.children.length
    );
  }
);
```

#### useMemo 和 useCallback
```typescript
// components/MindMapEditor.tsx
import { useMemo, useCallback } from 'react';

export const MindMapEditor = () => {
  const { nodes, actions } = useMindMapStore();
  
  // 缓存计算结果
  const sortedNodes = useMemo(() => {
    return nodes.sort((a, b) => a.order - b.order);
  }, [nodes]);
  
  // 缓存回调函数
  const handleNodeUpdate = useCallback(
    (nodeId: string, updates: Partial<MindMapNode>) => {
      actions.updateNode(nodeId, updates);
    },
    [actions]
  );
  
  return (
    <div>
      {sortedNodes.map((node) => (
        <MindMapNode
          key={node.id}
          node={node}
          onUpdate={handleNodeUpdate}
        />
      ))}
    </div>
  );
};
```

### 2.4 状态管理优化

#### 状态选择器优化
```typescript
// stores/mindmapStore.ts
import { create } from 'zustand';
import { shallow } from 'zustand/shallow';

interface MindMapStore {
  nodes: Map<string, MindMapNode>;
  selectedNodeIds: Set<string>;
  actions: {
    createNode: (parentId?: string) => string;
    updateNode: (nodeId: string, updates: Partial<MindMapNode>) => void;
  };
}

export const useMindMapStore = create<MindMapStore>((set, get) => ({
  nodes: new Map(),
  selectedNodeIds: new Set(),
  actions: {
    createNode: (parentId) => {
      // 实现逻辑
    },
    updateNode: (nodeId, updates) => {
      // 实现逻辑
    },
  },
}));

// 使用选择器优化
export const useNode = (nodeId: string) => {
  return useMindMapStore(
    (state) => state.nodes.get(nodeId),
    shallow
  );
};

export const useNodeActions = () => {
  return useMindMapStore((state) => state.actions);
};
```

## 3. AI 调用优化

### 3.1 请求优化

#### 请求去重
```typescript
// services/ai/requestDeduplicator.ts
class RequestDeduplicator {
  private static instance: RequestDeduplicator;
  private pendingRequests: Map<string, Promise<any>> = new Map();

  static getInstance(): RequestDeduplicator {
    if (!RequestDeduplicator.instance) {
      RequestDeduplicator.instance = new RequestDeduplicator();
    }
    return RequestDeduplicator.instance;
  }

  async deduplicate<T>(key: string, request: () => Promise<T>): Promise<T> {
    // 如果有相同的请求正在进行，返回该请求
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // 创建新请求
    const promise = request().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}

export const requestDeduplicator = RequestDeduplicator.getInstance();
```

#### 请求缓存
```typescript
// services/ai/responseCache.ts
class ResponseCache {
  private static instance: ResponseCache;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private ttl: number = 300000; // 5 分钟

  static getInstance(): ResponseCache {
    if (!ResponseCache.instance) {
      ResponseCache.instance = new ResponseCache();
    }
    return ResponseCache.instance;
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // 检查是否过期
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const responseCache = ResponseCache.getInstance();
```

### 3.2 上下文优化

#### 上下文压缩
```typescript
// services/ai/contextCompressor.ts
class ContextCompressor {
  // 压缩导图结构
  compressMindMap(node: MindMapNode): string {
    const lines: string[] = [];
    this.traverseNode(node, lines, 0);
    return lines.join('\n');
  }

  private traverseNode(node: MindMapNode, lines: string[], depth: number): void {
    const indent = '  '.repeat(depth);
    const content = this.extractText(node.content);
    lines.push(`${indent}- ${content}`);
    
    node.children.forEach((child) => {
      this.traverseNode(child, lines, depth + 1);
    });
  }

  private extractText(content: TextSegment[]): string {
    return content.map((segment) => segment.text).join('');
  }

  // 提取摘要
  extractSummary(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) return text;
    
    // 简单截断，实际可以使用更智能的摘要算法
    return text.substring(0, maxLength) + '...';
  }
}

export const contextCompressor = new ContextCompressor();
```

### 3.3 流式响应

```typescript
// services/ai/streamingService.ts
class StreamingService {
  async streamGenerate(
    request: GenerateRequest,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is null');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onComplete();
          break;
        }

        const chunk = decoder.decode(value);
        onChunk(chunk);
      }
    } catch (error) {
      onError(error as Error);
    }
  }
}

export const streamingService = new StreamingService();
```

## 4. 存储优化

### 4.1 IndexedDB 优化

#### 批量操作
```typescript
// services/storage/batchStorage.ts
class BatchStorage {
  private static instance: BatchStorage;
  private batchQueue: Map<string, any[]> = new Map();
  private flushTimer: NodeJS.Timeout | null = null;

  static getInstance(): BatchStorage {
    if (!BatchStorage.instance) {
      BatchStorage.instance = new BatchStorage();
    }
    return BatchStorage.instance;
  }

  // 批量保存
  batchSave(storeName: string, data: any): void {
    if (!this.batchQueue.has(storeName)) {
      this.batchQueue.set(storeName, []);
    }
    
    this.batchQueue.get(storeName)!.push(data);
    
    // 延迟批量写入
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
    
    this.flushTimer = setTimeout(() => {
      this.flush();
    }, 1000); // 1 秒后批量写入
  }

  private async flush(): Promise<void> {
    const batch = new Map(this.batchQueue);
    this.batchQueue.clear();
    
    for (const [storeName, items] of batch) {
      await this.writeBatch(storeName, items);
    }
  }

  private async writeBatch(storeName: string, items: any[]): Promise<void> {
    // 实现批量写入逻辑
  }
}

export const batchStorage = BatchStorage.getInstance();
```

#### 索引优化
```typescript
// services/storage/indexedDBSetup.ts
const setupIndexedDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MindWriteDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // 创建对象存储
      if (!db.objectStoreNames.contains('articles')) {
        const articleStore = db.createObjectStore('articles', { keyPath: 'id' });
        articleStore.createIndex('createdAt', 'createdAt', { unique: false });
        articleStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('mindmaps')) {
        const mindmapStore = db.createObjectStore('mindmaps', { keyPath: 'id' });
        mindmapStore.createIndex('articleId', 'articleId', { unique: false });
      }
    };
  });
};
```

### 4.2 缓存策略

#### 内存缓存
```typescript
// utils/memoryCache.ts
class MemoryCache {
  private static instance: MemoryCache;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private maxSize: number = 100;
  private ttl: number = 300000; // 5 分钟

  static getInstance(): MemoryCache {
    if (!MemoryCache.instance) {
      MemoryCache.instance = new MemoryCache();
    }
    return MemoryCache.instance;
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // 检查是否过期
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set<T>(key: string, data: T): void {
    // 检查缓存大小
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    this.cache.forEach((value, key) => {
      if (value.timestamp < oldestTimestamp) {
        oldestTimestamp = value.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const memoryCache = MemoryCache.getInstance();
```

## 5. 网络优化

### 5.1 请求优化

#### 并发控制
```typescript
// utils/concurrencyLimiter.ts
class ConcurrencyLimiter {
  private static instance: ConcurrencyLimiter;
  private queue: (() => Promise<any>)[] = [];
  private running: number = 0;
  private maxConcurrency: number = 3;

  static getInstance(): ConcurrencyLimiter {
    if (!ConcurrencyLimiter.instance) {
      ConcurrencyLimiter.instance = new ConcurrencyLimiter();
    }
    return ConcurrencyLimiter.instance;
  }

  async run<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.running >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const task = this.queue.shift()!;
    
    try {
      await task();
    } finally {
      this.running--;
      this.process();
    }
  }
}

export const concurrencyLimiter = ConcurrencyLimiter.getInstance();
```

#### 请求重试
```typescript
// utils/requestRetry.ts
class RequestRetry {
  async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (i < maxRetries - 1) {
          await this.sleep(delay * Math.pow(2, i)); // 指数退避
        }
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const requestRetry = new RequestRetry();
```

## 6. 性能监控

### 6.1 性能指标收集

```typescript
// utils/performanceCollector.ts
class PerformanceCollector {
  private static instance: PerformanceCollector;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceCollector {
    if (!PerformanceCollector.instance) {
      PerformanceCollector.instance = new PerformanceCollector();
    }
    return PerformanceCollector.instance;
  }

  // 记录性能指标
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name)!.push(value);
  }

  // 获取平均性能
  getAverageMetric(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;
    
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  // 获取性能统计
  getPerformanceStats(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const stats: Record<string, any> = {};
    
    this.metrics.forEach((values, name) => {
      stats[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      };
    });
    
    return stats;
  }

  // 清除指标
  clearMetrics(): void {
    this.metrics.clear();
  }
}

export const performanceCollector = PerformanceCollector.getInstance();
```

### 6.2 性能报告

```typescript
// utils/performanceReporter.ts
class PerformanceReporter {
  // 生成性能报告
  generateReport(): string {
    const stats = performanceCollector.getPerformanceStats();
    const report = {
      timestamp: new Date().toISOString(),
      metrics: stats,
      recommendations: this.generateRecommendations(stats),
    };
    
    return JSON.stringify(report, null, 2);
  }

  // 生成优化建议
  private generateRecommendations(stats: Record<string, any>): string[] {
    const recommendations: string[] = [];
    
    if (stats.pageLoadTime?.avg > 3000) {
      recommendations.push('页面加载时间过长，建议优化资源加载');
    }
    
    if (stats.aiResponseTime?.avg > 20000) {
      recommendations.push('AI 响应时间过长，建议优化上下文大小');
    }
    
    if (stats.renderTime?.avg > 100) {
      recommendations.push('渲染时间过长，建议使用 React.memo 优化组件');
    }
    
    return recommendations;
  }
}

export const performanceReporter = new PerformanceReporter();
```

## 7. 性能测试

### 7.1 性能测试脚本

```typescript
// tests/performance/loadTest.ts
class LoadTest {
  // 模拟用户操作
  async simulateUserOperations(operations: number): Promise<void> {
    const startTime = Date.now();
    
    for (let i = 0; i < operations; i++) {
      // 模拟创建节点
      await this.createNode();
      
      // 模拟编辑节点
      await this.editNode();
      
      // 模拟生成内容
      await this.generateContent();
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Completed ${operations} operations in ${duration}ms`);
    console.log(`Average: ${duration / operations}ms per operation`);
  }

  private async createNode(): Promise<void> {
    // 实现逻辑
  }

  private async editNode(): Promise<void> {
    // 实现逻辑
  }

  private async generateContent(): Promise<void> {
    // 实现逻辑
  }
}
```

### 7.2 性能基准测试

```typescript
// tests/performance/benchmark.ts
class Benchmark {
  // 运行基准测试
  async runBenchmark(name: string, fn: () => Promise<void>, iterations: number = 100): Promise<void> {
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      await fn();
      const endTime = performance.now();
      
      times.push(endTime - startTime);
    }
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    console.log(`Benchmark: ${name}`);
    console.log(`  Average: ${avg.toFixed(2)}ms`);
    console.log(`  Min: ${min.toFixed(2)}ms`);
    console.log(`  Max: ${max.toFixed(2)}ms`);
  }
}
```

## 8. 性能优化最佳实践

### 8.1 开发阶段
- 使用 React DevTools Profiler 分析组件性能
- 使用 Chrome DevTools 分析渲染性能
- 使用 Lighthouse 进行性能审计
- 定期进行性能测试

### 8.2 构建阶段
- 启用代码分割和懒加载
- 压缩和优化资源文件
- 使用 Tree Shaking 移除未使用代码
- 生成 Source Map 用于调试

### 8.3 运行阶段
- 监控关键性能指标
- 及时发现和解决性能问题
- 优化用户体验
- 定期进行性能优化

### 8.4 持续优化
- 定期审查性能预算
- 更新依赖包版本
- 优化算法和数据结构
- 改进缓存策略

## 9. 性能优化清单

### 9.1 前端优化
- [ ] 实施代码分割
- [ ] 启用懒加载
- [ ] 优化图片资源
- [ ] 使用 CDN
- [ ] 启用 Gzip 压缩
- [ ] 优化字体加载
- [ ] 减少 HTTP 请求
- [ ] 使用浏览器缓存

### 9.2 React 优化
- [ ] 使用 React.memo
- [ ] 使用 useMemo 和 useCallback
- [ ] 避免不必要的重渲染
- [ ] 使用虚拟滚动
- [ ] 优化状态管理
- [ ] 使用 React.lazy

### 9.3 AI 优化
- [ ] 实施请求去重
- [ ] 启用响应缓存
- [ ] 优化上下文大小
- [ ] 使用流式响应
- [ ] 实施并发控制

### 9.4 存储优化
- [ ] 使用 IndexedDB
- [ ] 实施批量操作
- [ ] 创建合适的索引
- [ ] 使用内存缓存
- [ ] 定期清理过期数据

### 9.5 监控优化
- [ ] 收集性能指标
- [ ] 设置性能预算
- [ ] 实施性能告警
- [ ] 定期性能测试
- [ ] 生成性能报告
