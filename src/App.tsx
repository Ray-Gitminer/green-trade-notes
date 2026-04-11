import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewTrade from "./pages/NewTrade";
import Journal from "./pages/Journal";
import Analytics from "./pages/Analytics";
import Templates from "./pages/Templates";
import Backtesting from "./pages/Backtesting";
import RiskJournal from "./pages/RiskJournal";
import Goals from "./pages/Goals";
import DailyNotes from "./pages/DailyNotes";
import KnowledgeLibrary from "./pages/KnowledgeLibrary";
import Settings from "./pages/Settings";
import ChartAnalysis from "./pages/ChartAnalysis";
import NotFound from "./pages/NotFound";
import LineCallback from "./pages/LineCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/new-trade"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <NewTrade />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/journal"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Journal />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Analytics />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Templates />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/backtesting"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Backtesting />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/risk-journal"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <RiskJournal />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/goals"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Goals />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notes"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DailyNotes />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/knowledge"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <KnowledgeLibrary />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chart-analysis"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ChartAnalysis />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
