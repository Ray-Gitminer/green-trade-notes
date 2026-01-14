import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Save, User } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
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
    toast({ title: "Settings saved!" });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div><h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><SettingsIcon className="h-6 w-6" />Settings</h1><p className="text-muted-foreground">Manage your account and preferences</p></div>

      <Card className="glass-card">
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Email</Label><Input value={user?.email || ""} disabled className="bg-muted" /></div>
          <div><Label>Display Name</Label><Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="Your name" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Account Balance ($)</Label><Input type="number" value={form.account_balance} onChange={(e) => setForm({ ...form, account_balance: e.target.value })} /></div>
            <div><Label>Default Risk (%)</Label><Input type="number" step="0.1" value={form.default_risk_percent} onChange={(e) => setForm({ ...form, default_risk_percent: e.target.value })} /></div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between"><div><Label>Open Trade Alerts</Label><p className="text-xs text-muted-foreground">Reminders to review open positions</p></div><Switch checked={notifications.open_trade_alerts} onCheckedChange={(v) => setNotifications({ ...notifications, open_trade_alerts: v })} /></div>
          <div className="flex items-center justify-between"><div><Label>End of Day Journal</Label><p className="text-xs text-muted-foreground">Daily journaling prompts</p></div><Switch checked={notifications.end_of_day_journal} onCheckedChange={(v) => setNotifications({ ...notifications, end_of_day_journal: v })} /></div>
          <div className="flex items-center justify-between"><div><Label>Goal Check-ins</Label><p className="text-xs text-muted-foreground">Weekly progress updates</p></div><Switch checked={notifications.goal_checkins} onCheckedChange={(v) => setNotifications({ ...notifications, goal_checkins: v })} /></div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full gradient-emerald"><Save className="h-4 w-4 mr-2" />Save Settings</Button>
    </div>
  );
}
