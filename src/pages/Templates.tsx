import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileStack, Plus, Trash2 } from "lucide-react";

export default function Templates() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", category: "general", pair: "" });

  useEffect(() => { if (user) fetchTemplates(); }, [user]);

  const fetchTemplates = async () => {
    if (!user) return;
    const { data } = await supabase.from("trade_templates").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setTemplates(data || []);
  };

  const handleSave = async () => {
    if (!user || !form.name) return;
    await supabase.from("trade_templates").insert({ user_id: user.id, ...form });
    toast({ title: t("templates.templateSaved") });
    setOpen(false);
    setForm({ name: "", description: "", category: "general", pair: "" });
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("trade_templates").delete().eq("id", id);
    fetchTemplates();
  };

  const categoryLabels: Record<string, string> = {
    scalping: t("templates.scalping"),
    swing: t("templates.swing"),
    breakout: t("templates.breakout"),
    reversal: t("templates.reversal"),
    general: t("notes.general"),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileStack className="h-6 w-6" />{t("templates.title")}
          </h1>
          <p className="text-muted-foreground">{t("templates.subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-emerald"><Plus className="h-4 w-4 mr-2" />{t("templates.newTemplate")}</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>{t("templates.createTemplate")}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t("templates.name")}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div>
                <Label>{t("templates.category")}</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scalping">{t("templates.scalping")}</SelectItem>
                    <SelectItem value="swing">{t("templates.swing")}</SelectItem>
                    <SelectItem value="breakout">{t("templates.breakout")}</SelectItem>
                    <SelectItem value="reversal">{t("templates.reversal")}</SelectItem>
                    <SelectItem value="general">{t("notes.general")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{t("templates.defaultPair")}</Label><Input value={form.pair} onChange={(e) => setForm({ ...form, pair: e.target.value })} placeholder="e.g. EUR/USD" /></div>
              <div><Label>{t("templates.description")}</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full gradient-emerald">{t("templates.saveTemplate")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((tpl) => (
          <Card key={tpl.id} className="glass-card">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg">{tpl.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{categoryLabels[tpl.category] || tpl.category}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(tpl.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{tpl.description || t("templates.noDescription")}</p>
              {tpl.pair && <p className="text-sm mt-2">{t("newTrade.pair")}: <span className="text-foreground font-medium">{tpl.pair}</span></p>}
            </CardContent>
          </Card>
        ))}
        {templates.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">{t("templates.noTemplates")}</p>}
      </div>
    </div>
  );
}
