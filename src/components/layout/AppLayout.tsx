import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  PlusCircle,
  BookOpen,
  Target,
  FileText,
  Library,
  BarChart3,
  FileStack,
  FlaskConical,
  Brain,
  Settings,
  LogOut,
  Menu,
  X,
  MessageCircle,
} from "lucide-react";
import RyutaChat from "@/components/chat/RyutaChat";

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/new-trade", label: "New Trade", icon: PlusCircle },
  { path: "/journal", label: "Trade Journal", icon: BookOpen },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/templates", label: "Templates", icon: FileStack },
  { path: "/backtesting", label: "Backtesting", icon: FlaskConical },
  { path: "/risk-journal", label: "Risk Journal", icon: Brain },
  { path: "/goals", label: "Goals", icon: Target },
  { path: "/notes", label: "Daily Notes", icon: FileText },
  { path: "/knowledge", label: "Knowledge Library", icon: Library },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background candlestick-pattern">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-sm border-b border-border z-50 flex items-center justify-between px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-foreground"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
        <h1 className="text-lg font-bold text-primary">Mae Pla 🐟</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setChatOpen(true)}
          className="text-primary"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-sidebar border-r border-sidebar-border z-40 transition-transform duration-300",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
            🐟 Mae Pla Green Pen
          </h1>
          <p className="text-xs text-muted-foreground mt-1">แม่ปลา ปากกาเขียว</p>
        </div>

        <ScrollArea className="flex-1 h-[calc(100vh-180px)]">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground glow-emerald"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border bg-sidebar">
          <div className="text-xs text-muted-foreground mb-3 truncate">
            {user?.email}
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-8">{children}</div>
      </main>

      {/* Ryuta Chat Button (Desktop) */}
      <Button
        onClick={() => setChatOpen(true)}
        className="hidden lg:flex fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg glow-emerald z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Ryuta Chat Panel */}
      <RyutaChat open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
