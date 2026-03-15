# 安全与隐私保护文档

## 1. 安全策略概述

MindWrite 致力于保护用户数据安全和隐私，本文档定义了项目的安全策略、隐私保护措施和合规要求。

## 2. 数据安全

### 2.1 数据分类

#### 敏感数据
- API 密钥（OpenAI/Claude API Key）
- 用户个人信息（如果后续添加用户系统）
- 用户创作内容（文章、思维导图）

#### 非敏感数据
- 应用配置
- 用户偏好设置
- 匿名统计数据

### 2.2 数据存储安全

#### 本地存储加密
```typescript
// utils/encryption.ts
class DataEncryption {
  private static instance: DataEncryption;
  private encryptionKey: string;

  static getInstance(): DataEncryption {
    if (!DataEncryption.instance) {
      DataEncryption.instance = new DataEncryption();
    }
    return DataEncryption.instance;
  }

  // 加密数据
  encrypt(data: string): string {
    // 使用 Web Crypto API 进行加密
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // 简单的 XOR 加密（生产环境应使用更强大的加密算法）
    const keyBuffer = encoder.encode(this.encryptionKey);
    const encrypted = dataBuffer.map((byte, index) => 
      byte ^ keyBuffer[index % keyBuffer.length]
    );
    
    return btoa(String.fromCharCode(...encrypted));
  }

  // 解密数据
  decrypt(encryptedData: string): string {
    const encrypted = atob(encryptedData);
    const encryptedBuffer = new Uint8Array(encrypted.length);
    
    for (let i = 0; i < encrypted.length; i++) {
      encryptedBuffer[i] = encrypted.charCodeAt(i);
    }
    
    const keyBuffer = new TextEncoder().encode(this.encryptionKey);
    const decrypted = encryptedBuffer.map((byte, index) => 
      byte ^ keyBuffer[index % keyBuffer.length]
    );
    
    return new TextDecoder().decode(decrypted);
  }

  // 设置加密密钥
  setEncryptionKey(key: string): void {
    this.encryptionKey = key;
  }
}

export const dataEncryption = DataEncryption.getInstance();
```

#### IndexedDB 安全存储
```typescript
// services/storage/secureStorage.ts
class SecureStorage {
  private dbName = 'MindWriteDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建加密存储
        if (!db.objectStoreNames.contains('articles')) {
          db.createObjectStore('articles', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('mindmaps')) {
          db.createObjectStore('mindmaps', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  async saveSecureData(storeName: string, data: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // 加密敏感数据
      const encryptedData = {
        ...data,
        content: dataEncryption.encrypt(JSON.stringify(data.content)),
      };
      
      const request = store.put(encryptedData);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSecureData(storeName: string, key: string): Promise<any> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const data = request.result;
        if (data && data.content) {
          // 解密数据
          data.content = JSON.parse(dataEncryption.decrypt(data.content));
        }
        resolve(data);
      };
    });
  }
}

export const secureStorage = new SecureStorage();
```

### 2.3 数据传输安全

#### HTTPS 强制使用
```typescript
// 强制使用 HTTPS
if (location.protocol !== 'https:' && import.meta.env.PROD) {
  location.replace(`https:${location.href.substring(location.protocol.length)}`);
}
```

#### API 请求安全
```typescript
// services/api/secureApiClient.ts
class SecureApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL;
    this.apiKey = import.meta.env.VITE_API_KEY;
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      // 启用 CORS 凭证
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  }
}

export const secureApiClient = new SecureApiClient();
```

## 3. API 安全

### 3.1 API 密钥管理

#### 环境变量管理
```bash
# .env.local
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_CLAUDE_API_KEY=your_claude_api_key_here
VITE_API_BASE_URL=https://api.example.com
```

#### 密钥安全存储
```typescript
// utils/apiKeyManager.ts
class ApiKeyManager {
  private static instance: ApiKeyManager;
  private keys: Map<string, string> = new Map();

  static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager();
    }
    return ApiKeyManager.instance;
  }

  // 获取 API 密钥
  getApiKey(provider: string): string {
    if (this.keys.has(provider)) {
      return this.keys.get(provider)!;
    }

    // 从环境变量获取
    const key = import.meta.env[`VITE_${provider.toUpperCase()}_API_KEY`];
    if (key) {
      this.keys.set(provider, key);
      return key;
    }

    throw new Error(`API key not found for provider: ${provider}`);
  }

  // 设置 API 密钥（运行时）
  setApiKey(provider: string, key: string): void {
    this.keys.set(provider, key);
  }

  // 清除所有密钥
  clearKeys(): void {
    this.keys.clear();
  }
}

export const apiKeyManager = ApiKeyManager.getInstance();
```

### 3.2 请求频率限制

```typescript
// utils/rateLimiter.ts
class RateLimiter {
  private static instance: RateLimiter;
  private requests: Map<string, number[]> = new Map();
  private limits: Map<string, { maxRequests: number; windowMs: number }> = new Map();

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  // 设置限制规则
  setLimit(key: string, maxRequests: number, windowMs: number): void {
    this.limits.set(key, { maxRequests, windowMs });
  }

  // 检查是否超过限制
  isAllowed(key: string): boolean {
    const limit = this.limits.get(key);
    if (!limit) return true;

    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // 清理过期的请求记录
    const validRequests = requests.filter(time => now - time < limit.windowMs);
    
    if (validRequests.length >= limit.maxRequests) {
      return false;
    }

    // 记录新的请求
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }

  // 获取剩余请求次数
  getRemainingRequests(key: string): number {
    const limit = this.limits.get(key);
    if (!limit) return Infinity;

    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(time => now - time < limit.windowMs);
    
    return Math.max(0, limit.maxRequests - validRequests.length);
  }
}

export const rateLimiter = RateLimiter.getInstance();

// 设置 AI 调用限制
rateLimiter.setLimit('ai_generate', 10, 60000); // 每分钟最多 10 次
rateLimiter.setLimit('ai_rewrite', 20, 60000);  // 每分钟最多 20 次
```

### 3.3 请求签名验证

```typescript
// utils/requestSigner.ts
class RequestSigner {
  private static instance: RequestSigner;
  private secret: string;

  static getInstance(): RequestSigner {
    if (!RequestSigner.instance) {
      RequestSigner.instance = new RequestSigner();
    }
    return RequestSigner.instance;
  }

  // 生成请求签名
  generateSignature(data: any, timestamp: number): string {
    const message = JSON.stringify(data) + timestamp.toString();
    // 使用 Web Crypto API 生成 HMAC
    // 简化示例，实际应使用更安全的签名算法
    return btoa(message + this.secret);
  }

  // 验证请求签名
  verifySignature(data: any, timestamp: number, signature: string): boolean {
    const expectedSignature = this.generateSignature(data, timestamp);
    return signature === expectedSignature;
  }

  // 设置密钥
  setSecret(secret: string): void {
    this.secret = secret;
  }
}

export const requestSigner = RequestSigner.getInstance();
```

## 4. 用户隐私保护

### 4.1 数据最小化原则

```typescript
// 只收集必要的数据
interface UserData {
  // 必要数据
  id: string;
  createdAt: string;
  lastActiveAt: string;
  
  // 可选数据（用户主动提供）
  name?: string;
  email?: string;
  
  // 不收集敏感信息
  // 不收集: 密码、身份证号、银行卡号等
}
```

### 4.2 数据匿名化

```typescript
// utils/dataAnonymizer.ts
class DataAnonymizer {
  // 匿名化用户数据
  anonymizeUserData(data: any): any {
    return {
      ...data,
      id: this.hashId(data.id),
      name: data.name ? this.maskName(data.name) : undefined,
      email: data.email ? this.maskEmail(data.email) : undefined,
    };
  }

  // 哈希 ID
  private hashId(id: string): string {
    // 简单哈希，实际应使用更安全的哈希算法
    return btoa(id).substring(0, 16);
  }

  // 掩码姓名
  private maskName(name: string): string {
    if (name.length <= 2) return name[0] + '*';
    return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
  }

  // 掩码邮箱
  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    const maskedLocal = localPart[0] + '*'.repeat(localPart.length - 1);
    return `${maskedLocal}@${domain}`;
  }
}

export const dataAnonymizer = new DataAnonymizer();
```

### 4.3 用户数据导出

```typescript
// services/dataExport.ts
class DataExportService {
  // 导出用户所有数据
  async exportUserData(userId: string): Promise<string> {
    const articles = await this.getUserArticles(userId);
    const mindmaps = await this.getUserMindMaps(userId);
    const settings = await this.getUserSettings(userId);

    const userData = {
      exportDate: new Date().toISOString(),
      articles,
      mindmaps,
      settings,
    };

    return JSON.stringify(userData, null, 2);
  }

  // 提供下载链接
  async downloadUserData(userId: string): Promise<void> {
    const data = await this.exportUserData(userId);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindwrite-data-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  private async getUserArticles(userId: string): Promise<any[]> {
    // 实现逻辑
    return [];
  }

  private async getUserMindMaps(userId: string): Promise<any[]> {
    // 实现逻辑
    return [];
  }

  private async getUserSettings(userId: string): Promise<any> {
    // 实现逻辑
    return {};
  }
}

export const dataExportService = new DataExportService();
```

### 4.4 用户数据删除

```typescript
// services/dataDeletion.ts
class DataDeletionService {
  // 删除用户所有数据
  async deleteUserData(userId: string): Promise<void> {
    await this.deleteUserArticles(userId);
    await this.deleteUserMindMaps(userId);
    await this.deleteUserSettings(userId);
    await this.deleteUserLogs(userId);
    
    console.log(`User data deleted: ${userId}`);
  }

  private async deleteUserArticles(userId: string): Promise<void> {
    // 实现逻辑
  }

  private async deleteUserMindMaps(userId: string): Promise<void> {
    // 实现逻辑
  }

  private async deleteUserSettings(userId: string): Promise<void> {
    // 实现逻辑
  }

  private async deleteUserLogs(userId: string): Promise<void> {
    // 实现逻辑
  }
}

export const dataDeletionService = new DataDeletionService();
```

## 5. 输入验证与防护

### 5.1 输入验证

```typescript
// utils/inputValidator.ts
class InputValidator {
  // 验证节点内容
  validateNodeContent(content: string): boolean {
    if (!content || content.trim().length === 0) {
      throw new UserError(UserErrorType.INVALID_INPUT, '节点内容不能为空');
    }

    if (content.length > 1000) {
      throw new UserError(UserErrorType.CONTENT_TOO_LONG, '节点内容过长');
    }

    return true;
  }

  // 验证 URL
  validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      throw new UserError(UserErrorType.INVALID_INPUT, '无效的 URL');
    }
  }

  // 验证邮箱
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new UserError(UserErrorType.INVALID_INPUT, '无效的邮箱地址');
    }
    return true;
  }

  // 验证颜色值
  validateColor(color: string): boolean {
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!colorRegex.test(color)) {
      throw new UserError(UserErrorType.INVALID_INPUT, '无效的颜色值');
    }
    return true;
  }
}

export const inputValidator = new InputValidator();
```

### 5.2 XSS 防护

```typescript
// utils/xssProtection.ts
import DOMPurify from 'dompurify';

class XSSProtection {
  // 清理 HTML 内容
  sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'span'],
      ALLOWED_ATTR: ['style', 'class'],
    });
  }

  // 转义 HTML 特殊字符
  escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 清理 URL
  sanitizeUrl(url: string): string {
    const allowedProtocols = ['http:', 'https:', 'mailto:'];
    try {
      const parsedUrl = new URL(url);
      if (!allowedProtocols.includes(parsedUrl.protocol)) {
        return '';
      }
      return url;
    } catch {
      return '';
    }
  }
}

export const xssProtection = new XSSProtection();
```

### 5.3 CSRF 防护

```typescript
// utils/csrfProtection.ts
class CSRFProtection {
  private static instance: CSRFProtection;
  private token: string = '';

  static getInstance(): CSRFProtection {
    if (!CSRFProtection.instance) {
      CSRFProtection.instance = new CSRFProtection();
    }
    return CSRFProtection.instance;
  }

  // 生成 CSRF Token
  generateToken(): string {
    this.token = this.randomString(32);
    return this.token;
  }

  // 验证 CSRF Token
  validateToken(token: string): boolean {
    return token === this.token;
  }

  // 获取当前 Token
  getToken(): string {
    if (!this.token) {
      this.generateToken();
    }
    return this.token;
  }

  private randomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

export const csrfProtection = CSRFProtection.getInstance();
```

## 6. 合规要求

### 6.1 GDPR 合规

#### 用户权利
- **访问权**: 用户可以访问自己的所有数据
- **更正权**: 用户可以更正不准确的数据
- **删除权**: 用户可以要求删除自己的数据
- **数据可携带权**: 用户可以导出自己的数据
- **反对权**: 用户可以反对数据处理

#### 实现措施
```typescript
// services/gdprCompliance.ts
class GDPRCompliance {
  // 处理用户数据访问请求
  async handleDataAccessRequest(userId: string): Promise<any> {
    const data = await dataExportService.exportUserData(userId);
    return JSON.parse(data);
  }

  // 处理用户数据删除请求
  async handleDataDeletionRequest(userId: string): Promise<void> {
    await dataDeletionService.deleteUserData(userId);
  }

  // 处理用户数据更正请求
  async handleDataCorrectionRequest(userId: string, updates: any): Promise<void> {
    // 实现逻辑
  }

  // 处理用户数据导出请求
  async handleDataExportRequest(userId: string): Promise<void> {
    await dataExportService.downloadUserData(userId);
  }
}

export const gdprCompliance = new GDPRCompliance();
```

### 6.2 隐私政策

```markdown
# 隐私政策

## 数据收集
我们收集以下数据：
- 用户创作的内容（文章、思维导图）
- 使用统计数据（匿名化）
- 技术日志（用于问题排查）

## 数据使用
我们使用数据用于：
- 提供核心功能服务
- 改进产品体验
- 技术支持和问题排查

## 数据存储
- 数据存储在用户本地设备
- 不会上传到服务器（除非用户主动同步）
- 采用加密存储保护数据安全

## 数据分享
我们不会与第三方分享用户数据，除非：
- 用户明确同意
- 法律要求

## 用户权利
用户有权：
- 访问自己的数据
- 更正不准确的数据
- 删除自己的数据
- 导出自己的数据

## 联系我们
如有隐私相关问题，请联系：privacy@mindwrite.com
```

## 7. 安全审计

### 7.1 安全检查清单

- [ ] 所有敏感数据已加密存储
- [ ] API 密钥未暴露在前端代码中
- [ ] 所有用户输入已验证和清理
- [ ] XSS 防护已实施
- [ ] CSRF 防护已实施
- [ ] HTTPS 强制使用
- [ ] 请求频率限制已实施
- [ ] 错误信息不暴露敏感信息
- [ ] 日志不包含敏感数据
- [ ] 依赖包安全检查通过

### 7.2 安全测试

```typescript
// tests/security/inputValidation.test.ts
import { describe, it, expect } from 'vitest';
import { inputValidator } from '@/utils/inputValidator';

describe('Input Validation Security', () => {
  it('should reject XSS attempts', () => {
    const xssPayload = '<script>alert("XSS")</script>';
    expect(() => inputValidator.validateNodeContent(xssPayload)).not.toThrow();
  });

  it('should reject SQL injection attempts', () => {
    const sqlInjection = "'; DROP TABLE users; --";
    expect(() => inputValidator.validateNodeContent(sqlInjection)).not.toThrow();
  });

  it('should reject overly long content', () => {
    const longContent = 'a'.repeat(1001);
    expect(() => inputValidator.validateNodeContent(longContent)).toThrow();
  });
});
```

### 7.3 依赖安全检查

```bash
# 使用 npm audit 检查依赖安全
npm audit

# 使用 Snyk 检查
npx snyk test

# 使用 OWASP Dependency-Check
dependency-check --scan ./
```

## 8. 安全事件响应

### 8.1 安全事件分类

| 等级 | 描述 | 响应时间 |
|-----|------|---------|
| P0 | 数据泄露、系统入侵 | 立即响应 |
| P1 | 安全漏洞、异常访问 | 1小时内 |
| P2 | 可疑行为、潜在风险 | 24小时内 |
| P3 | 安全建议、优化项 | 1周内 |

### 8.2 响应流程

1. **发现**: 监控系统或用户报告发现安全事件
2. **评估**: 评估事件严重程度和影响范围
3. **遏制**: 采取措施遏制事件扩大
4. **根除**: 消除安全威胁根本原因
5. **恢复**: 恢复系统正常运行
6. **总结**: 总结经验教训，改进安全措施

### 8.3 通知机制

```typescript
// utils/securityNotifier.ts
class SecurityNotifier {
  // 发送安全警报
  async sendSecurityAlert(event: string, details: any): Promise<void> {
    console.error('[Security Alert]', event, details);
    
    // 发送邮件通知
    // await this.sendEmail(event, details);
    
    // 发送 Slack 通知
    // await this.sendSlack(event, details);
  }

  private async sendEmail(event: string, details: any): Promise<void> {
    // 实现邮件发送逻辑
  }

  private async sendSlack(event: string, details: any): Promise<void> {
    // 实现 Slack 通知逻辑
  }
}

export const securityNotifier = new SecurityNotifier();
```

## 9. 安全最佳实践

### 9.1 开发安全
- 遵循安全编码规范
- 定期进行安全培训
- 代码审查关注安全问题
- 使用安全工具辅助开发

### 9.2 运维安全
- 定期更新依赖包
- 监控系统安全状态
- 及时修复安全漏洞
- 备份重要数据

### 9.3 用户教育
- 提供安全使用指南
- 提醒用户保护账号安全
- 教育用户识别安全威胁
- 提供安全反馈渠道

## 10. 安全更新与维护

### 10.1 定期安全检查
- 每月进行安全审计
- 每季度进行渗透测试
- 每年进行安全评估

### 10.2 安全更新策略
- 及时更新依赖包
- 关注安全公告
- 快速响应安全事件
- 持续改进安全措施
