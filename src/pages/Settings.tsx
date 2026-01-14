import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Save, User, Globe } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ display_name: "", account_balance: "", default_risk_percent: "" });
  const [notifications, setNotifications] = useState({ open_trade_alerts: true, end_of_day_journal: true, goal_checkins: true });

  useEffect(() => { if (user) fetchProfile(); }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
    if (data) {
      setProfile(data);
      setForm({ display_name: data.display_name || "", account_balance: data.account_balance?.toString() || "10000", default_risk_percent: data.default_risk_percent?.toString() || "1" });
      const settings = data.notification_settings as { open_trade_alerts?: boolean; end_of_day_journal?: boolean; goal_checkins?: boolean } | null;
      setNotifications({ open_trade_alerts: settings?.open_trade_alerts ?? true, end_of_day_journal: settings?.end_of_day_journal ?? true, goal_checkins: settings?.goal_checkins ?? true });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ display_name: form.display_name, account_balance: parseFloat(form.account_balance) || 10000, default_risk_percent: parseFloat(form.default_risk_percent) || 1, notification_settings: notifications }).eq("user_id", user.id);
    toast({ title: t("settings.settingsSaved") });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" />{t("settings.title")}
        </h1>
        <p className="text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />{t("settings.language")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={language} onValueChange={(v) => setLanguage(v as "th" | "en")}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="th">🇹🇭 {t("settings.thai")}</SelectItem>
              <SelectItem value="en">🇺🇸 {t("settings.english")}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />{t("settings.profile")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{t("settings.email")}</Label>
            <Input value={user?.email || ""} disabled className="bg-muted" />
          </div>
          <div>
            <Label>{t("settings.displayName")}</Label>
            <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder={t("settings.yourName")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("newTrade.accountBalance")}</Label>
              <Input type="number" value={form.account_balance} onChange={(e) => setForm({ ...form, account_balance: e.target.value })} />
            </div>
            <div>
              <Label>{t("newTrade.riskPercent")}</Label>
              <Input type="number" step="0.1" value={form.default_risk_percent} onChange={(e) => setForm({ ...form, default_risk_percent: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{t("settings.notifications")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t("settings.openTradeAlerts")}</Label>
              <p className="text-xs text-muted-foreground">{t("settings.openTradeAlertsDesc")}</p>
            </div>
            <Switch checked={notifications.open_trade_alerts} onCheckedChange={(v) => setNotifications({ ...notifications, open_trade_alerts: v })} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>{t("settings.endOfDayJournal")}</Label>
              <p className="text-xs text-muted-foreground">{t("settings.endOfDayJournalDesc")}</p>
            </div>
            <Switch checked={notifications.end_of_day_journal} onCheckedChange={(v) => setNotifications({ ...notifications, end_of_day_journal: v })} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>{t("settings.goalCheckins")}</Label>
              <p className="text-xs text-muted-foreground">{t("settings.goalCheckinsDesc")}</p>
            </div>
            <Switch checked={notifications.goal_checkins} onCheckedChange={(v) => setNotifications({ ...notifications, goal_checkins: v })} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full gradient-emerald">
        <Save className="h-4 w-4 mr-2" />{t("settings.saveSettings")}
      </Button>
    </div>
  );
}
