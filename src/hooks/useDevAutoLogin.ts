/**
 * 开发环境自动登录 Hook
 * 仅在本地开发时使用，避免重复输入账号密码
 */
import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';

const DEV_EMAIL = import.meta.env.VITE_DEV_LOGIN_EMAIL;
const DEV_PASSWORD = import.meta.env.VITE_DEV_LOGIN_PASSWORD;

export function useDevAutoLogin() {
  const { login, isAuthenticated, isLoading } = useAuthStore();
  const hasAttempted = useRef(false);

  useEffect(() => {
    // 只在开发环境、有配置环境变量、未登录且未尝试过登录时执行
    if (
      import.meta.env.DEV &&
      DEV_EMAIL &&
      DEV_PASSWORD &&
      !isAuthenticated &&
      !isLoading &&
      !hasAttempted.current
    ) {
      hasAttempted.current = true;

      // 延迟执行，确保其他初始化完成
      const timer = setTimeout(() => {
        console.log('[DevAutoLogin] 正在使用开发账号自动登录...');
        login(DEV_EMAIL, DEV_PASSWORD).catch((err) => {
          console.error('[DevAutoLogin] 自动登录失败:', err.message);
        });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [login, isAuthenticated, isLoading]);
}
