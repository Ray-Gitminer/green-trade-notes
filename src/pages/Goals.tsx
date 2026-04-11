import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Target, Plus, TrendingUp, BarChart3, Trophy } from "lucide-react";

export default function Goals() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [goals, setGoals] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ profit_target: "", win_rate_target: "", trade_count_target: "" });
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => { if (user) { fetchGoals(); fetchTrades(); } }, [user]);

  const fetchGoals = async () => {
    if (!user) return;
    const { data } = await supabase.from("trading_goals").select("*").eq("user_id", user.id).order("year", { ascending: false }).order("month", { ascending: false });
    setGoals(data || []);
  };

  const fetchTrades = async () => {
    if (!user) return;
    const startDate = new Date(currentYear, currentMonth - 1, 1).toISOString();
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString();
    const { data } = await supabase.from("trades").select("*").eq("user_id", user.id).gte("trade_date", startDate).lte("trade_date", endDate);
    setTrades(data || []);
  };

  const handleSave = async () => {
    if (!user) return;
    await supabase.from("trading_goals").upsert({ user_id: user.id, month: currentMonth, year: currentYear, profit_target: parseFloat(form.profit_target) || 0, win_rate_target: parseFloat(form.win_rate_target) || 0, trade_count_target: parseInt(form.trade_count_target) || 0 }, { onConflict: "user_id,month,year,is_paper_goal" });
    toast({ title: t("goals.goalsSaved") });
    setOpen(false);
    fetchGoals();
  };

  const currentGoal = goals.find(g => g.month === currentMonth && g.year === currentYear);

  // Calculate actual stats from trades
  const totalProfit = trades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
  const totalTrades = trades.length;
  const winTrades = trades.filter(t => (t.profit_loss || 0) > 0).length;
  const actualWinRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;

  const profitProgress = currentGoal?.profit_target > 0 ? Math.min((totalProfit / currentGoal.profit_target) * 100, 100) : 0;
  const winRateProgress = currentGoal?.win_rate_target > 0 ? Math.min((actualWinRate / currentGoal.win_rate_target) * 100, 100) : 0;
  const tradeCountProgress = currentGoal?.trade_count_target > 0 ? Math.min((totalTrades / currentGoal.trade_count_target) * 100, 100) : 0;

  const monthName = new Date(currentYear, currentMonth - 1).toLocaleDateString(language === "th" ? "th-TH" : "en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Target className="h-6 w-6" />{t("goals.title")}
          </h1>
          <p className="text-muted-foreground">{t("goals.subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-emerald"><Plus className="h-4 w-4 mr-2" />{t("goals.setGoals")}</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>{t("goals.monthlyGoals")}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t("goals.profitTarget")} ($)</Label><Input type="number" value={form.profit_target} onChange={(e) => setForm({ ...form, profit_target: e.target.value })} /></div>
              <div><Label>{t("goals.winRateTarget")} (%)</Label><Input type="number" value={form.win_rate_target} onChange={(e) => setForm({ ...form, win_rate_target: e.target.value })} /></div>
              <div><Label>{t("goals.tradeCountTarget")}</Label><Input type="number" value={form.trade_count_target} onChange={(e) => setForm({ ...form, trade_count_target: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full gradient-emerald">{t("goals.saveGoals")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {currentGoal ? (
        <div className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />{monthName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profit Progress */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{t("goals.profitTarget")}</span>
                  <span className="text-sm font-medium">${totalProfit.toFixed(2)} / ${currentGoal.profit_target}</span>
                </div>
                <Progress value={profitProgress} className="h-3" />
                <p className="text-xs text-right mt-1 text-muted-foreground">{profitProgress.toFixed(1)}%</p>
              </div>

              {/* Win Rate Progress */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{t("goals.winRateTarget")}</span>
                  <span className="text-sm font-medium">{actualWinRate.toFixed(1)}% / {currentGoal.win_rate_target}%</span>
                </div>
                <Progress value={winRateProgress} className="h-3" />
                <p className="text-xs text-right mt-1 text-muted-foreground">{winRateProgress.toFixed(1)}%</p>
              </div>

              {/* Trade Count Progress */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{t("goals.tradeCountTarget")}</span>
                  <span className="text-sm font-medium">{totalTrades} / {currentGoal.trade_count_target} เทรด</span>
                </div>
                <Progress value={tradeCountProgress} className="h-3" />
                <p className="text-xs text-right mt-1 text-muted-foreground">{tradeCountProgress.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>

          {/* Actual Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-primary">{totalTrades}</p>
                <p className="text-xs text-muted-foreground">จำนวนเทรด</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <Trophy className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-emerald-400">{winTrades}</p>
                <p className="text-xs text-muted-foreground">ชนะ</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-accent">{actualWinRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Win Rate จริง</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${totalProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>${totalProfit.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">กำไรสุทธิ</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t("goals.noGoals")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
