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
import { Library, Plus, Upload, Trash2 } from "lucide-react";

export default function KnowledgeLibrary() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "general" });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => { if (user) fetchItems(); }, [user]);

  const fetchItems = async () => {
    if (!user) return;
    const { data } = await supabase.from("knowledge_items").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setItems(data || []);
  };

  const handleUpload = async () => {
    if (!user || !form.title) return;
    let imageUrl = null;
    if (file) {
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("knowledge-library").upload(fileName, file);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("knowledge-library").getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }
    }
    await supabase.from("knowledge_items").insert({ user_id: user.id, title: form.title, description: form.description, category: form.category, image_url: imageUrl });
    toast({ title: t("knowledge.itemAdded") });
    setOpen(false);
    setForm({ title: "", description: "", category: "general" });
    setFile(null);
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("knowledge_items").delete().eq("id", id);
    fetchItems();
  };

  const categoryLabels: Record<string, string> = {
    technical_analysis: t("knowledge.technicalAnalysis"),
    risk_management: t("knowledge.riskManagement"),
    psychology: t("notes.psychology"),
    strategies: t("knowledge.strategies"),
    general: t("notes.general"),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Library className="h-6 w-6" />{t("knowledge.title")}
          </h1>
          <p className="text-muted-foreground">{t("knowledge.subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-emerald"><Plus className="h-4 w-4 mr-2" />{t("knowledge.addItem")}</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>{t("knowledge.addKnowledgeItem")}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>{t("knowledge.title_field")}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div>
                <Label>{t("templates.category")}</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical_analysis">{t("knowledge.technicalAnalysis")}</SelectItem>
                    <SelectItem value="risk_management">{t("knowledge.riskManagement")}</SelectItem>
                    <SelectItem value="psychology">{t("notes.psychology")}</SelectItem>
                    <SelectItem value="strategies">{t("knowledge.strategies")}</SelectItem>
                    <SelectItem value="general">{t("notes.general")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{t("templates.description")}</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>{t("knowledge.imageOptional")}</Label><Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} /></div>
              <Button onClick={handleUpload} className="w-full gradient-emerald"><Upload className="h-4 w-4 mr-2" />{t("knowledge.upload")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Card key={item.id} className="glass-card overflow-hidden">
            {item.image_url && <div className="aspect-video bg-muted"><img src={item.image_url} alt={item.title} className="w-full h-full object-cover" /></div>}
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <p className="text-xs text-muted-foreground">{categoryLabels[item.category] || item.category}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </CardHeader>
            {item.description && <CardContent><p className="text-sm text-muted-foreground">{item.description}</p></CardContent>}
          </Card>
        ))}
        {items.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">{t("knowledge.noItems")}</p>}
      </div>
    </div>
  );
}
