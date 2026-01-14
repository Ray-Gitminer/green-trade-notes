import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function Analytics() {
  const { user } = useAuth();
  const [pairData, setPairData] = useState<any[]>([]);
  const [dayData, setDayData] = useState<any[]>([]);
  const [stats, setStats] = useState({ bestPair: "", worstPair: "", avgHoldTime: 0 });

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;
    const { data } = await supabase.from("trades").select("*").eq("user_id", user.id).eq("is_paper_trade", false).eq("status", "closed");
    if (!data) return;

    const byPair: Record<string, number> = {};
    const byDay: Record<string, number> = {};
    data.forEach(t => {
      byPair[t.pair] = (byPair[t.pair] || 0) + (t.profit_loss || 0);
      const day = new Date(t.trade_date).toLocaleDateString("en", { weekday: "short" });
      byDay[day] = (byDay[day] || 0) + (t.profit_loss || 0);
    });

    setPairData(Object.entries(byPair).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 })));
    setDayData(Object.entries(byDay).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 })));

    const sorted = Object.entries(byPair).sort((a, b) => b[1] - a[1]);
    setStats({ bestPair: sorted[0]?.[0] || "-", worstPair: sorted[sorted.length - 1]?.[0] || "-", avgHoldTime: 0 });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><BarChart3 className="h-6 w-6" />Trade Analytics</h1><p className="text-muted-foreground">Deep dive into your trading performance</p></div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="glass-card"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Best Pair</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /><span className="text-xl font-bold">{stats.bestPair}</span></div></CardContent></Card>
        <Card className="glass-card"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Worst Pair</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-destructive" /><span className="text-xl font-bold">{stats.worstPair}</span></div></CardContent></Card>
        <Card className="glass-card"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Pairs Traded</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-accent" /><span className="text-xl font-bold">{pairData.length}</span></div></CardContent></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass-card"><CardHeader><CardTitle>P/L by Pair</CardTitle></CardHeader><CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pairData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} /><Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} /><Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </CardContent></Card>

        <Card className="glass-card"><CardHeader><CardTitle>P/L by Day of Week</CardTitle></CardHeader><CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} /><Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} /><Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </CardContent></Card>
      </div>
    </div>
  );
}
