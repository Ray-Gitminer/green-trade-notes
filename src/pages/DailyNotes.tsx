import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Save } from "lucide-react";
import { format } from "date-fns";

export default function DailyNotes() {
  const { user } = useAuth();
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
    toast({ title: "Note saved!" });
    setContent("");
    fetchNotes();
  };

  const categoryColors: Record<string, string> = { market_outlook: "text-primary", psychology: "text-psychology", lessons_learned: "text-accent", general: "text-muted-foreground" };

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><FileText className="h-6 w-6" />Daily Notes</h1><p className="text-muted-foreground">Journal your market insights and trading psychology</p></div>

      <Card className="glass-card">
        <CardHeader><CardTitle>New Note</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="market_outlook">Market Outlook</SelectItem>
              <SelectItem value="psychology">Psychology</SelectItem>
              <SelectItem value="lessons_learned">Lessons Learned</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="What's on your mind today?" className="min-h-32" />
          <Button onClick={handleSave} className="gradient-emerald"><Save className="h-4 w-4 mr-2" />Save Note</Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {notes.map((note) => (
          <Card key={note.id} className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium capitalize ${categoryColors[note.category]}`}>{note.category.replace("_", " ")}</span>
                <span className="text-xs text-muted-foreground">{format(new Date(note.note_date), "MMM dd, yyyy")}</span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
            </CardContent>
          </Card>
        ))}
        {notes.length === 0 && <p className="text-muted-foreground text-center py-8">No notes yet. Start journaling!</p>}
      </div>
    </div>
  );
}
