import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FlaskConical, Plus } from "lucide-react";

export default function Backtesting() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [strategies, setStrategies] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", rules: "", entry_criteria: "", exit_criteria: "", status: "testing" });

  useEffect(() => { if (user) fetchStrategies(); }, [user]);

  const fetchStrategies = async () => {
    if (!user) return;
    const { data } = await supabase.from("strategies").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setStrategies(data || []);
  };

  const handleSave = async () => {
    if (!user || !form.name) return;
    await supabase.from("strategies").insert({ user_id: user.id, ...form });
    toast({ title: t("backtesting.strategySaved") });
    setOpen(false);
    setForm({ name: "", description: "", rules: "", entry_criteria: "", exit_criteria: "", status: "testing" });
    fetchStrategies();
  };

  const statusColors: Record<string, string> = { testing: "bg-paper/20 text-paper", validated: "bg-primary/20 text-primary", rejected: "bg-destructive/20 text-destructive", ready_for_live: "bg-accent/20 text-accent" };
  const statusLabels: Record<string, string> = {
    testing: t("backtesting.statusTesting"),
    validated: t("backtesting.statusValidated"),
    rejected: t("backtesting.statusRejected"),
    ready_for_live: t("backtesting.statusReadyForLive"),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FlaskConical className="h-6 w-6" />{t("backtesting.title")}
          </h1>
          <p className="text-muted-foreground">{t("backtesting.subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-emerald"><Plus className="h-4 w-4 mr-2" />{t("backtesting.newStrategy")}</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader><DialogTitle>{t("backtesting.createStrategy")}</DialogTitle></DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div><Label>{t("templates.name")}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div>
                <Label>{t("backtesting.status")}</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="testing">{t("backtesting.statusTesting")}</SelectItem>
                    <SelectItem value="validated">{t("backtesting.statusValidated")}</SelectItem>
                    <SelectItem value="rejected">{t("backtesting.statusRejected")}</SelectItem>
                    <SelectItem value="ready_for_live">{t("backtesting.statusReadyForLive")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{t("templates.description")}</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>{t("backtesting.entryCriteria")}</Label><Textarea value={form.entry_criteria} onChange={(e) => setForm({ ...form, entry_criteria: e.target.value })} /></div>
              <div><Label>{t("backtesting.exitCriteria")}</Label><Textarea value={form.exit_criteria} onChange={(e) => setForm({ ...form, exit_criteria: e.target.value })} /></div>
              <div><Label>{t("backtesting.rules")}</Label><Textarea value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full gradient-emerald">{t("backtesting.saveStrategy")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {strategies.map((s) => (
          <Card key={s.id} className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{s.name}</CardTitle>
                <Badge className={statusColors[s.status]}>{statusLabels[s.status] || s.status.replace("_", " ")}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{s.description || t("templates.noDescription")}</p>
              {s.entry_criteria && <p className="text-xs"><span className="text-muted-foreground">{t("backtesting.entryCriteria")}:</span> {s.entry_criteria}</p>}
            </CardContent>
          </Card>
        ))}
        {strategies.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">{t("backtesting.noStrategies")}</p>}
      </div>
    </div>
  );
}
