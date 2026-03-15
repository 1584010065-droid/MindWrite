# 错误处理与监控文档

## 1. 错误处理策略

### 1.1 错误分类

#### 用户错误（UserError）
用户操作不当导致的错误，需要友好提示。

```typescript
enum UserErrorType {
  INVALID_INPUT = 'INVALID_INPUT',
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  CONTENT_TOO_LONG = 'CONTENT_TOO_LONG',
}

class UserError extends Error {
  constructor(
    public type: UserErrorType,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'UserError';
  }
}
```

#### 系统错误（SystemError）
系统内部错误，需要记录日志并提示用户稍后重试。

```typescript
enum SystemErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  API_ERROR = 'API_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

class SystemError extends Error {
  constructor(
    public type: SystemErrorType,
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'SystemError';
  }
}
```

#### AI 错误（AIError）
AI 相关错误，需要特殊处理。

```typescript
enum AIErrorType {
  GENERATION_FAILED = 'GENERATION_FAILED',
  TIMEOUT = 'TIMEOUT',
  CONTENT_VIOLATION = 'CONTENT_VIOLATION',
  RATE_LIMIT = 'RATE_LIMIT',
  INSUFFICIENT_CONTEXT = 'INSUFFICIENT_CONTEXT',
}

class AIError extends Error {
  constructor(
    public type: AIErrorType,
    message: string,
    public requestId?: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIError';
  }
}
```

### 1.2 错误处理流程

```typescript
// 统一错误处理器
class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCallbacks: Map<string, (error: Error) => void> = new Map();

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  handleError(error: unknown, context?: string): void {
    // 记录错误日志
    this.logError(error, context);

    // 根据错误类型处理
    if (error instanceof UserError) {
      this.handleUserError(error);
    } else if (error instanceof SystemError) {
      this.handleSystemError(error);
    } else if (error instanceof AIError) {
      this.handleAIError(error);
    } else {
      this.handleUnknownError(error);
    }

    // 触发错误回调
    this.triggerCallbacks(error);
  }

  private handleUserError(error: UserError): void {
    switch (error.type) {
      case UserErrorType.INVALID_INPUT:
        toast.error('输入内容无效，请检查后重试');
        break;
      case UserErrorType.INSUFFICIENT_CREDITS:
        toast.error('点数不足，请充值后继续使用');
        break;
      case UserErrorType.PERMISSION_DENIED:
        toast.error('权限不足，无法执行此操作');
        break;
      case UserErrorType.CONTENT_TOO_LONG:
        toast.error('内容过长，请精简后重试');
        break;
      default:
        toast.error(error.message);
    }
  }

  private handleSystemError(error: SystemError): void {
    toast.error('系统错误，请稍后重试');
    // 发送到监控系统
    this.reportToMonitoring(error);
  }

  private handleAIError(error: AIError): void {
    switch (error.type) {
      case AIErrorType.GENERATION_FAILED:
        toast.error('AI 生成失败，请重试');
        break;
      case AIErrorType.TIMEOUT:
        toast.error('生成超时，请尝试缩小范围');
        break;
      case AIErrorType.CONTENT_VIOLATION:
        toast.error('内容不符合规范，请修改后重试');
        break;
      case AIErrorType.RATE_LIMIT:
        toast.error('请求过于频繁，请稍后再试');
        break;
      default:
        toast.error('AI 服务异常，请稍后重试');
    }

    // 发送到监控系统
    this.reportToMonitoring(error);
  }

  private handleUnknownError(error: unknown): void {
    console.error('Unknown error:', error);
    toast.error('未知错误，请联系客服');
    this.reportToMonitoring(error);
  }

  private logError(error: unknown, context?: string): void {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    };

    console.error('Error occurred:', errorInfo);
    
    // 保存到本地日志
    this.saveToLocalStorage(errorInfo);
  }

  private reportToMonitoring(error: Error): void {
    // 发送到 Sentry 或其他监控系统
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error);
    }
  }

  private saveToLocalStorage(errorInfo: any): void {
    try {
      const logs = JSON.parse(localStorage.getItem('error_logs') || '[]');
      logs.push(errorInfo);
      // 只保留最近 100 条日志
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      localStorage.setItem('error_logs', JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save error log:', e);
    }
  }

  private triggerCallbacks(error: Error): void {
    this.errorCallbacks.forEach((callback) => {
      try {
        callback(error);
      } catch (e) {
        console.error('Error in callback:', e);
      }
    });
  }

  onError(callback: (error: Error) => void): () => void {
    const id = Date.now().toString();
    this.errorCallbacks.set(id, callback);
    return () => {
      this.errorCallbacks.delete(id);
    };
  }
}

// 使用示例
const errorHandler = ErrorHandler.getInstance();

try {
  // 业务逻辑
} catch (error) {
  errorHandler.handleError(error, 'MindMapEditor.handleNodeCreate');
}
```

### 1.3 错误边界（Error Boundary）

```typescript
// components/ErrorBoundary.tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // 发送到监控系统
    const errorHandler = ErrorHandler.getInstance();
    errorHandler.handleError(error, 'ErrorBoundary');
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>出错了</h2>
          <p>抱歉，页面遇到了一些问题。</p>
          <button onClick={() => window.location.reload()}>
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 2. 监控方案

### 2.1 前端监控

#### 性能监控
```typescript
// utils/performanceMonitor.ts
class PerformanceMonitor {
  private static instance: PerformanceMonitor;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // 监控页面加载性能
  measurePageLoad(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        const metrics = {
          dns: perfData.domainLookupEnd - perfData.domainLookupStart,
          tcp: perfData.connectEnd - perfData.connectStart,
          request: perfData.responseStart - perfData.requestStart,
          response: perfData.responseEnd - perfData.responseStart,
          dom: perfData.domComplete - perfData.domInteractive,
          total: perfData.loadEventEnd - perfData.fetchStart,
        };

        this.reportMetrics('page_load', metrics);
      }, 0);
    });
  }

  // 监控组件渲染性能
  measureComponentRender(componentName: string, renderTime: number): void {
    this.reportMetrics('component_render', {
      component: componentName,
      renderTime,
    });
  }

  // 监控 AI 调用性能
  measureAICall(requestId: string, duration: number, tokenUsed: number): void {
    this.reportMetrics('ai_call', {
      requestId,
      duration,
      tokenUsed,
    });
  }

  // 监控用户操作性能
  measureUserAction(action: string, duration: number): void {
    this.reportMetrics('user_action', {
      action,
      duration,
    });
  }

  private reportMetrics(type: string, data: any): void {
    // 发送到监控系统
    console.log(`[Performance] ${type}:`, data);
    
    // 可以发送到 Google Analytics 或其他监控服务
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', type, data);
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
```

#### 错误监控
```typescript
// utils/errorMonitor.ts
class ErrorMonitor {
  private static instance: ErrorMonitor;
  private errorQueue: any[] = [];
  private isReporting: boolean = false;

  static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  // 捕获全局错误
  captureGlobalErrors(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
      this.reportError({
        type: 'javascript_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        type: 'promise_rejection',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
      });
    });
  }

  // 报告错误
  reportError(error: any): void {
    const errorData = {
      ...error,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    this.errorQueue.push(errorData);
    this.flushErrors();
  }

  // 批量发送错误
  private async flushErrors(): Promise<void> {
    if (this.isReporting || this.errorQueue.length === 0) return;

    this.isReporting = true;

    try {
      // 发送到错误监控服务
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   body: JSON.stringify(this.errorQueue),
      // });

      console.log('Errors reported:', this.errorQueue);
      this.errorQueue = [];
    } catch (error) {
      console.error('Failed to report errors:', error);
    } finally {
      this.isReporting = false;
    }
  }
}

export const errorMonitor = ErrorMonitor.getInstance();
```

### 2.2 AI 调用监控

```typescript
// services/ai/aiMonitor.ts
class AIMonitor {
  private static instance: AIMonitor;
  private callHistory: any[] = [];

  static getInstance(): AIMonitor {
    if (!AIMonitor.instance) {
      AIMonitor.instance = new AIMonitor();
    }
    return AIMonitor.instance;
  }

  // 记录 AI 调用
  logCall(requestId: string, params: any): void {
    this.callHistory.push({
      requestId,
      params,
      startTime: Date.now(),
    });
  }

  // 记录 AI 响应
  logResponse(requestId: string, response: any): void {
    const call = this.callHistory.find(c => c.requestId === requestId);
    if (call) {
      call.endTime = Date.now();
      call.duration = call.endTime - call.startTime;
      call.response = response;
      call.tokenUsed = response.tokenUsed;

      // 发送监控数据
      this.reportCall(call);
    }
  }

  // 记录 AI 错误
  logError(requestId: string, error: any): void {
    const call = this.callHistory.find(c => c.requestId === requestId);
    if (call) {
      call.endTime = Date.now();
      call.duration = call.endTime - call.startTime;
      call.error = error;

      // 发送错误监控
      this.reportError(call);
    }
  }

  private reportCall(call: any): void {
    console.log('[AI Call]', {
      requestId: call.requestId,
      duration: call.duration,
      tokenUsed: call.tokenUsed,
    });

    // 发送到监控系统
    performanceMonitor.measureAICall(
      call.requestId,
      call.duration,
      call.tokenUsed
    );
  }

  private reportError(call: any): void {
    console.error('[AI Error]', {
      requestId: call.requestId,
      error: call.error,
      duration: call.duration,
    });

    // 发送错误监控
    errorMonitor.reportError({
      type: 'ai_error',
      requestId: call.requestId,
      error: call.error,
      duration: call.duration,
    });
  }
}

export const aiMonitor = AIMonitor.getInstance();
```

### 2.3 用户行为监控

```typescript
// utils/userBehaviorMonitor.ts
class UserBehaviorMonitor {
  private static instance: UserBehaviorMonitor;
  private events: any[] = [];

  static getInstance(): UserBehaviorMonitor {
    if (!UserBehaviorMonitor.instance) {
      UserBehaviorMonitor.instance = new UserBehaviorMonitor();
    }
    return UserBehaviorMonitor.instance;
  }

  // 记录用户行为
  trackEvent(eventName: string, properties?: any): void {
    const event = {
      eventName,
      properties,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    this.events.push(event);
    this.flushEvents();
  }

  // 批量发送事件
  private async flushEvents(): Promise<void> {
    if (this.events.length < 10) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      // 发送到分析服务
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   body: JSON.stringify(eventsToSend),
      // });

      console.log('Events tracked:', eventsToSend);
    } catch (error) {
      console.error('Failed to track events:', error);
      // 重新添加到队列
      this.events.unshift(...eventsToSend);
    }
  }
}

export const userBehaviorMonitor = UserBehaviorMonitor.getInstance();
```

## 3. 日志管理

### 3.1 日志级别

```typescript
enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

class Logger {
  private static instance: Logger;
  private logs: any[] = [];
  private maxLogs: number = 1000;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  debug(message: string, context?: any): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: any): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: any): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: any): void {
    this.log(LogLevel.ERROR, message, context);
  }

  private log(level: LogLevel, message: string, context?: any): void {
    const logEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    this.logs.push(logEntry);

    // 控制台输出
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(message, context);
        break;
      case LogLevel.INFO:
        console.info(message, context);
        break;
      case LogLevel.WARN:
        console.warn(message, context);
        break;
      case LogLevel.ERROR:
        console.error(message, context);
        break;
    }

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.splice(0, this.logs.length - this.maxLogs);
    }

    // 保存到本地存储
    this.saveToLocalStorage();
  }

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('app_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save logs:', error);
    }
  }

  getLogs(): any[] {
    return this.logs;
  }

  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('app_logs');
  }
}

export const logger = Logger.getInstance();
```

### 3.2 日志导出

```typescript
// utils/logExporter.ts
class LogExporter {
  // 导出日志为 JSON
  exportAsJSON(): string {
    const logs = logger.getLogs();
    return JSON.stringify(logs, null, 2);
  }

  // 导出日志为 CSV
  exportAsCSV(): string {
    const logs = logger.getLogs();
    const headers = ['timestamp', 'level', 'message', 'context', 'url'];
    const rows = logs.map(log => [
      log.timestamp,
      log.level,
      log.message,
      JSON.stringify(log.context),
      log.url,
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    return csv;
  }

  // 下载日志文件
  downloadLogs(format: 'json' | 'csv' = 'json'): void {
    const content = format === 'json' ? this.exportAsJSON() : this.exportAsCSV();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindwrite-logs-${Date.now()}.${format}`;
    a.click();
    
    URL.revokeObjectURL(url);
  }
}

export const logExporter = new LogExporter();
```

## 4. 告警机制

### 4.1 告警规则

```typescript
interface AlertRule {
  name: string;
  condition: (metrics: any) => boolean;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

const alertRules: AlertRule[] = [
  {
    name: 'high_error_rate',
    condition: (metrics) => metrics.errorRate > 0.05,
    severity: 'high',
    message: '错误率超过 5%',
  },
  {
    name: 'slow_ai_response',
    condition: (metrics) => metrics.avgAIResponseTime > 30000,
    severity: 'medium',
    message: 'AI 平均响应时间超过 30 秒',
  },
  {
    name: 'low_credits',
    condition: (metrics) => metrics.avgCreditsBalance < 10,
    severity: 'low',
    message: '用户平均点数余额低于 10',
  },
];
```

### 4.2 告警通知

```typescript
class AlertManager {
  private static instance: AlertManager;
  private alerts: any[] = [];

  static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  checkAlerts(metrics: any): void {
    alertRules.forEach(rule => {
      if (rule.condition(metrics)) {
        this.triggerAlert(rule, metrics);
      }
    });
  }

  private triggerAlert(rule: AlertRule, metrics: any): void {
    const alert = {
      rule: rule.name,
      severity: rule.severity,
      message: rule.message,
      metrics,
      timestamp: new Date().toISOString(),
    };

    this.alerts.push(alert);
    this.notifyAlert(alert);
  }

  private notifyAlert(alert: any): void {
    console.warn('[Alert]', alert.message, alert);

    // 发送通知（可以集成邮件、短信、Slack 等）
    // this.sendEmail(alert);
    // this.sendSlack(alert);
  }
}

export const alertManager = AlertManager.getInstance();
```

## 5. 监控仪表板

### 5.1 关键指标

```typescript
interface DashboardMetrics {
  // 用户指标
  activeUsers: number;
  newUsers: number;
  retentionRate: number;

  // 功能使用指标
  articlesCreated: number;
  nodesCreated: number;
  aiCalls: number;

  // 性能指标
  avgPageLoadTime: number;
  avgAIResponseTime: number;
  errorRate: number;

  // 业务指标
  avgCreditsUsed: number;
  avgCreditsBalance: number;
  conversionRate: number;
}
```

### 5.2 监控数据收集

```typescript
class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: any = {};

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  collectMetrics(): DashboardMetrics {
    return {
      activeUsers: this.getActiveUsers(),
      newUsers: this.getNewUsers(),
      retentionRate: this.getRetentionRate(),
      articlesCreated: this.getArticlesCreated(),
      nodesCreated: this.getNodesCreated(),
      aiCalls: this.getAICalls(),
      avgPageLoadTime: this.getAvgPageLoadTime(),
      avgAIResponseTime: this.getAvgAIResponseTime(),
      errorRate: this.getErrorRate(),
      avgCreditsUsed: this.getAvgCreditsUsed(),
      avgCreditsBalance: this.getAvgCreditsBalance(),
      conversionRate: this.getConversionRate(),
    };
  }

  private getActiveUsers(): number {
    // 实现逻辑
    return 0;
  }

  // 其他指标的实现...
}
```

## 6. 监控工具集成

### 6.1 Sentry 集成

```typescript
// utils/sentry.ts
import * as Sentry from '@sentry/react';

export const initSentry = () => {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }
};
```

### 6.2 Google Analytics 集成

```typescript
// utils/analytics.ts
export const initAnalytics = () => {
  if (import.meta.env.PROD) {
    // 初始化 Google Analytics
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${import.meta.env.VITE_GA_ID}`;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', import.meta.env.VITE_GA_ID);
  }
};
```

## 7. 监控最佳实践

### 7.1 监控原则
- **全面覆盖**: 覆盖所有关键功能和用户路径
- **实时监控**: 及时发现和响应问题
- **数据驱动**: 基于数据做决策
- **持续优化**: 定期优化监控策略

### 7.2 监控指标选择
- **业务指标**: 与业务目标直接相关的指标
- **技术指标**: 系统性能和稳定性指标
- **用户体验指标**: 用户满意度和使用体验指标

### 7.3 告警策略
- **合理阈值**: 设置合理的告警阈值
- **分级告警**: 根据严重程度分级处理
- **避免噪音**: 避免过多的无效告警
- **快速响应**: 建立快速响应机制
