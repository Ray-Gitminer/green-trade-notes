import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from "recharts";
import { TrendingUp, BarChart3, Clock, Target } from "lucide-react";
import { format } from "date-fns";

const SESSION_LABEL: Record<string, string> = {
  asia: "เช้าเอเชีย",
  london: "บ่ายลอนดอน",
  us: "ค่ำอเมริกา",
};

interface TradeSummaryProps {
  trades: any[];
}

export default function TradeSummary({ trades }: TradeSummaryProps) {
  const stats = useMemo(() => {
    const totalLots = trades.reduce((sum, t) => sum + (t.lot_size || 0), 0);
    const totalTrades = trades.length;
    const buyTrades = trades.filter(t => t.trade_type === "buy").length;
    const sellTrades = trades.filter(t => t.trade_type === "sell").length;
    const winTrades = trades.filter(t => (t.profit_loss || 0) > 0).length;
    const loseTrades = trades.filter(t => (t.profit_loss || 0) < 0).length;
    const breakEven = trades.filter(t => (t.profit_loss || 0) === 0).length;

    return { totalLots, totalTrades, buyTrades, sellTrades, winTrades, loseTrades, breakEven };
  }, [trades]);

  // Growth curve data
  const growthData = useMemo(() => {
    const sorted = [...trades].sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());
    let cumulative = 0;
    return sorted.map((t, i) => {
      cumulative += (t.profit_loss || 0);
      return {
        name: t.trade_date ? format(new Date(t.trade_date), "dd/MM") : `#${i + 1}`,
        profit: cumulative,
      };
    });
  }, [trades]);

  // Strategy breakdown (using entry_conditions)
  const strategyData = useMemo(() => {
    const counts: Record<string, { count: number; wins: number; profit: number }> = {};
    const conditionLabels: Record<string, string> = {
      break_m5: "เบรค M5",
      daily_frame: "กรอบวัน",
      sw_frame: "กรอบ SW",
      sig: "SIG",
      ath_frame: "กรอบ ATH",
    };

    trades.forEach(t => {
      const ec = t.entry_conditions;
      if (!ec || typeof ec !== "object") {
        // ไม่ได้ระบุกลยุทธ์
        const label = "ไม่ได้ระบุ";
        if (!counts[label]) counts[label] = { count: 0, wins: 0, profit: 0 };
        counts[label].count++;
        if ((t.profit_loss || 0) > 0) counts[label].wins++;
        counts[label].profit += (t.profit_loss || 0);
        return;
      }
      const usedKeys = Object.keys(ec).filter(key => ec[key] && key !== "other");
      if (ec.other) {
        const label = `อื่นๆ: ${ec.other}`;
        if (!counts[label]) counts[label] = { count: 0, wins: 0, profit: 0 };
        counts[label].count++;
        if ((t.profit_loss || 0) > 0) counts[label].wins++;
        counts[label].profit += (t.profit_loss || 0);
      }
      if (usedKeys.length === 0 && !ec.other) {
        const label = "ไม่ได้ระบุ";
        if (!counts[label]) counts[label] = { count: 0, wins: 0, profit: 0 };
        counts[label].count++;
        if ((t.profit_loss || 0) > 0) counts[label].wins++;
        counts[label].profit += (t.profit_loss || 0);
      }
      usedKeys.forEach(key => {
        const label = conditionLabels[key] || key;
        if (!counts[label]) counts[label] = { count: 0, wins: 0, profit: 0 };
        counts[label].count++;
        if ((t.profit_loss || 0) > 0) counts[label].wins++;
        counts[label].profit += (t.profit_loss || 0);
      });
    });

    return Object.entries(counts).map(([name, data]) => ({
      name,
      count: data.count,
      winRate: data.count > 0 ? ((data.wins / data.count) * 100).toFixed(1) : "0",
      winRateNum: data.count > 0 ? (data.wins / data.count) * 100 : 0,
      profit: data.profit,
      pct: stats.totalTrades > 0 ? ((data.count / stats.totalTrades) * 100).toFixed(1) : "0",
    })).sort((a, b) => b.winRateNum - a.winRateNum);
  }, [trades, stats.totalTrades]);

  // Session profitability
  const sessionData = useMemo(() => {
    const sessions: Record<string, { count: number; profit: number; wins: number }> = {};
    trades.forEach(t => {
      const s = t.trading_session || "unknown";
      if (!sessions[s]) sessions[s] = { count: 0, profit: 0, wins: 0 };
      sessions[s].count++;
      sessions[s].profit += (t.profit_loss || 0);
      if ((t.profit_loss || 0) > 0) sessions[s].wins++;
    });
    return Object.entries(sessions)
      .filter(([key]) => key !== "unknown")
      .map(([key, data]) => ({
        name: SESSION_LABEL[key] || key,
        count: data.count,
        profit: data.profit,
        winRate: data.count > 0 ? ((data.wins / data.count) * 100).toFixed(1) : "0",
      }));
  }, [trades]);

  if (trades.length === 0) return null;

  const chartConfig = {
    profit: { label: "กำไรสะสม ($)", color: "hsl(var(--primary))" },
    count: { label: "จำนวนครั้ง", color: "hsl(var(--primary))" },
  };

  return (
    <div className="space-y-4">
      {/* Monthly Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="glass-card">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-primary">{stats.totalLots.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">ล็อตไซด์รวม</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-foreground">{stats.totalTrades}</p>
            <p className="text-xs text-muted-foreground">จำนวนเทรด</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-emerald-400">{stats.buyTrades}</p>
            <p className="text-xs text-muted-foreground">Buy</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-red-400">{stats.sellTrades}</p>
            <p className="text-xs text-muted-foreground">Sell</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-emerald-400">{stats.winTrades}</p>
            <p className="text-xs text-muted-foreground">ชนะ</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-red-400">{stats.loseTrades}</p>
            <p className="text-xs text-muted-foreground">แพ้</p>
          </CardContent>
        </Card>
      </div>

      {/* Growth Chart */}
      {growthData.length > 1 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />แนวโน้มการเติบโต (Equity Curve)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="profit" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Strategy Breakdown */}
      {strategyData.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />กลยุทธ์ที่ใช้
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {strategyData.map((s, i) => (
                <div key={s.name} className="p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                      <p className="font-medium text-sm">{s.name}</p>
                    </div>
                    <p className={`font-bold text-sm ${s.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {s.profit >= 0 ? "+" : ""}${s.profit.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <span>ใช้ {s.count} ครั้ง ({s.pct}%)</span>
                    <span>Win Rate: {s.winRate}%</span>
                  </div>
                  <div className="w-full bg-secondary/50 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(parseFloat(s.winRate), 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Profitability */}
      {sessionData.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />กำไรตามช่วงเวลา
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessionData.map(s => (
                <div key={s.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div>
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.count} เทรด | Win Rate: {s.winRate}%</p>
                  </div>
                  <p className={`font-bold text-sm ${s.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {s.profit >= 0 ? "+" : ""}${s.profit.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
