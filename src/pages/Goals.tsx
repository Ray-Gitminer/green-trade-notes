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
import { Target, Plus, TrendingUp } from "lucide-react";

export default function Goals() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [goals, setGoals] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ profit_target: "", win_rate_target: "", trade_count_target: "" });
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => { if (user) fetchGoals(); }, [user]);

  const fetchGoals = async () => {
    if (!user) return;
    const { data } = await supabase.from("trading_goals").select("*").eq("user_id", user.id).order("year", { ascending: false }).order("month", { ascending: false });
    setGoals(data || []);
  };

  const handleSave = async () => {
    if (!user) return;
    await supabase.from("trading_goals").upsert({ user_id: user.id, month: currentMonth, year: currentYear, profit_target: parseFloat(form.profit_target) || 0, win_rate_target: parseFloat(form.win_rate_target) || 0, trade_count_target: parseInt(form.trade_count_target) || 0 }, { onConflict: "user_id,month,year,is_paper_goal" });
    toast({ title: t("goals.goalsSaved") });
    setOpen(false);
    fetchGoals();
  };

  const currentGoal = goals.find(g => g.month === currentMonth && g.year === currentYear);
  const profitProgress = currentGoal ? Math.min((currentGoal.profit_achieved / currentGoal.profit_target) * 100, 100) : 0;

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
              <div><Label>{t("goals.profitTarget")}</Label><Input type="number" value={form.profit_target} onChange={(e) => setForm({ ...form, profit_target: e.target.value })} /></div>
              <div><Label>{t("goals.winRateTarget")}</Label><Input type="number" value={form.win_rate_target} onChange={(e) => setForm({ ...form, win_rate_target: e.target.value })} /></div>
              <div><Label>{t("goals.tradeCountTarget")}</Label><Input type="number" value={form.trade_count_target} onChange={(e) => setForm({ ...form, trade_count_target: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full gradient-emerald">{t("goals.saveGoals")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {currentGoal ? (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />{monthName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">{t("goals.profitTarget")}</span>
                <span className="text-sm font-medium">${currentGoal.profit_achieved?.toFixed(2) || 0} / ${currentGoal.profit_target}</span>
              </div>
              <Progress value={profitProgress} className="h-3" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-secondary/50">
                <p className="text-2xl font-bold text-primary">{currentGoal.win_rate_target}%</p>
                <p className="text-xs text-muted-foreground">{t("goals.winRateTarget")}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-secondary/50">
                <p className="text-2xl font-bold text-accent">{currentGoal.trade_count_target}</p>
                <p className="text-xs text-muted-foreground">{t("goals.tradeCountTarget")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
