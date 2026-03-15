import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import GeneratePage from "./pages/GeneratePage";
import WorkspacePage from "./pages/WorkspacePage";
import ExportPage from "./pages/ExportPage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/generate" replace />} />
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="/export" element={<ExportPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </AppShell>
  );
}
