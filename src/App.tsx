import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import GeneratePage from "./pages/GeneratePage";
import WorkspacePage from "./pages/WorkspacePage";
import ExportPage from "./pages/ExportPage";
import ProfilePage from "./pages/ProfilePage";
import { useAuthStore } from "./stores/authStore";

export default function App() {
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-clay/20 border-t-clay" />
          <p className="text-sm text-dusk">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* 公开路由 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />

      {/* 受保护路由 */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/generate" replace />} />
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="/export" element={<ExportPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* 404 重定向 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}