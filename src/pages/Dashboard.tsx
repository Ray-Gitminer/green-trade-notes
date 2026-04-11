import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  PlusCircle,
  BookOpen,
  LineChart,
} from "lucide-react";
import { format } from "date-fns";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface Trade {
  id: string;
  pair: string;
  trade_type: string;
  profit_loss: number | null;
  status: string;
  trade_date: string;
  is_paper_trade: boolean;
}

interface DashboardStats {
  totalTrades: number;
  winRate: number;
  netProfit: number;
  profitFactor: number;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTrades: 0,
    winRate: 0,
    netProfit: 0,
    profitFactor: 0,
  });
  const [equityData, setEquityData] = useState<{ date: string; equity: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const { data: tradesData, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_paper_trade", false)
        .order("trade_date", { ascending: true });

      if (error) throw error;

      setTrades(tradesData || []);

      const closedTrades = (tradesData || []).filter(t => t.status === "closed");
      const wins = closedTrades.filter(t => (t.profit_loss || 0) > 0);
      const losses = closedTrades.filter(t => (t.profit_loss || 0) < 0);
      const totalProfit = wins.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
      const totalLoss = Math.abs(losses.reduce((sum, t) => sum + (t.profit_loss || 0), 0));

      setStats({
        totalTrades: closedTrades.length,
        winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
        netProfit: closedTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0),
        profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0,
      });

      let runningEquity = 10000;
      const equity = (tradesData || [])
        .filter(t => t.status === "closed")
        .map(t => {
          runningEquity += t.profit_loss || 0;
          return {
            date: format(new Date(t.trade_date), "MMM dd"),
            equity: runningEquity,
          };
        });

      setEquityData(equity.length > 0 ? equity : [{ date: "Start", equity: 10000 }]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const recentTrades = trades
    .filter(t => t.status === "closed")
    .slice(-5)
    .reverse();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground">{t("dashboard.welcome")}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate("/new-trade")}
            className="gradient-emerald hover:opacity-90"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            {t("nav.newTrade")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard.totalTrades")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalTrades}</div>
            <p className="text-xs text-muted-foreground mt-1">{t("dashboard.closedPositions")}</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard.winRate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">
                {stats.winRate.toFixed(1)}%
              </span>
              <Target className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("dashboard.successRatio")}</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard.netProfit")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span
                className={`text-2xl font-bold ${
                  stats.netProfit >= 0 ? "text-profit" : "text-loss"
                }`}
              >
                ${stats.netProfit.toFixed(2)}
              </span>
              {stats.netProfit >= 0 ? (
                <TrendingUp className="h-5 w-5 text-primary" />
              ) : (
                <TrendingDown className="h-5 w-5 text-destructive" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("dashboard.totalPL")}</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard.profitFactor")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">
                {stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)}
              </span>
              <BarChart3 className="h-5 w-5 text-accent" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("dashboard.winLossRatio")}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            {t("dashboard.equityCurve")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#equityGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Chart Analysis Quick Access */}
      <Card className="glass-card border-emerald-800/40">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <LineChart className="h-5 w-5 text-primary" />
            📊 วิเคราะห์กราฟ
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="text-primary border-emerald-700/50 hover:bg-emerald-900/30"
            onClick={() => navigate("/chart-analysis")}
          >
            เปิดตาราง
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            ตารางปากกาเขียว — บันทึก Sig, TP, กรอบวัน ทุก Timeframe พร้อม Timeline รายชั่วโมง
          </p>
          <Button
            onClick={() => navigate("/chart-analysis")}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            <LineChart className="h-4 w-4" />
            บันทึกการวิเคราะห์วันนี้
          </Button>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              {t("dashboard.quickActions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-20 flex-col gap-2 border-border hover:bg-secondary"
              onClick={() => navigate("/new-trade")}
            >
              <PlusCircle className="h-6 w-6 text-primary" />
              <span className="text-sm">{t("nav.newTrade")}</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2 border-border hover:bg-secondary"
              onClick={() => navigate("/journal")}
            >
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-sm">{t("nav.journal")}</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2 border-border hover:bg-secondary"
              onClick={() => navigate("/goals")}
            >
              <Target className="h-6 w-6 text-accent" />
              <span className="text-sm">{t("nav.goals")}</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2 border-border hover:bg-secondary"
              onClick={() => navigate("/analytics")}
            >
              <BarChart3 className="h-6 w-6 text-accent" />
              <span className="text-sm">{t("nav.analytics")}</span>
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">
              {t("dashboard.recentTrades")}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary"
              onClick={() => navigate("/journal")}
            >
              {t("dashboard.viewAll")}
            </Button>
          </CardHeader>
          <CardContent>
            {recentTrades.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {t("dashboard.noTrades")}
              </p>
            ) : (
              <div className="space-y-3">
                {recentTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={trade.trade_type === "buy" ? "default" : "destructive"}
                        className={
                          trade.trade_type === "buy"
                            ? "bg-primary/20 text-primary"
                            : "bg-destructive/20 text-destructive"
                        }
                      >
                        {t(`tradeType.${trade.trade_type}`)}
                      </Badge>
                      <div>
                        <p className="font-medium text-foreground">{trade.pair}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(trade.trade_date), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-semibold ${
                        (trade.profit_loss || 0) >= 0 ? "text-profit" : "text-loss"
                      }`}
                    >
                      {(trade.profit_loss || 0) >= 0 ? "+" : ""}$
                      {(trade.profit_loss || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
