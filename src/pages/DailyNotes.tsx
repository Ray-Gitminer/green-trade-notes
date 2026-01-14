import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Save } from "lucide-react";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";

export default function DailyNotes() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [notes, setNotes] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");

  useEffect(() => { if (user) fetchNotes(); }, [user]);

  const fetchNotes = async () => {
    if (!user) return;
    const { data } = await supabase.from("daily_notes").select("*").eq("user_id", user.id).order("note_date", { ascending: false }).limit(30);
    setNotes(data || []);
  };

  const handleSave = async () => {
    if (!user || !content.trim()) return;
    await supabase.from("daily_notes").insert({ user_id: user.id, note_date: new Date().toISOString().split("T")[0], category, content });
    toast({ title: t("notes.noteSaved") });
    setContent("");
    fetchNotes();
  };

  const categoryColors: Record<string, string> = { market_outlook: "text-primary", psychology: "text-psychology", lessons_learned: "text-accent", general: "text-muted-foreground" };
  const categoryLabels: Record<string, string> = {
    market_outlook: t("notes.marketOutlook"),
    psychology: t("notes.psychology"),
    lessons_learned: t("notes.lessonsLearned"),
    general: t("notes.general"),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-6 w-6" />{t("notes.title")}
        </h1>
        <p className="text-muted-foreground">{t("notes.subtitle")}</p>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle>{t("notes.newNote")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="market_outlook">{t("notes.marketOutlook")}</SelectItem>
              <SelectItem value="psychology">{t("notes.psychology")}</SelectItem>
              <SelectItem value="lessons_learned">{t("notes.lessonsLearned")}</SelectItem>
              <SelectItem value="general">{t("notes.general")}</SelectItem>
            </SelectContent>
          </Select>
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={t("notes.placeholder")} className="min-h-32" />
          <Button onClick={handleSave} className="gradient-emerald"><Save className="h-4 w-4 mr-2" />{t("notes.saveNote")}</Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {notes.map((note) => (
          <Card key={note.id} className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${categoryColors[note.category]}`}>{categoryLabels[note.category] || note.category}</span>
                <span className="text-xs text-muted-foreground">{format(new Date(note.note_date), "PPP", { locale: language === "th" ? th : enUS })}</span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
            </CardContent>
          </Card>
        ))}
        {notes.length === 0 && <p className="text-muted-foreground text-center py-8">{t("notes.noNotes")}</p>}
      </div>
    </div>
  );
}
