/**
 * OAuth 回调处理页面
 */
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const handleOAuthCallback = useAuthStore((state) => state.handleOAuthCallback);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    if (error) {
      // OAuth 失败，重定向到登录页
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true });
      return;
    }

    if (accessToken && refreshToken) {
      // 处理 OAuth 回调
      handleOAuthCallback(accessToken, refreshToken)
        .then(() => {
          navigate('/generate', { replace: true });
        })
        .catch(() => {
          navigate('/login?error=oauth_failed', { replace: true });
        });
    } else {
      navigate('/login?error=missing_tokens', { replace: true });
    }
  }, [searchParams, navigate, handleOAuthCallback]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-clay/20 border-t-clay" />
        <p className="text-sm text-dusk">正在完成登录...</p>
      </div>
    </div>
  );
}