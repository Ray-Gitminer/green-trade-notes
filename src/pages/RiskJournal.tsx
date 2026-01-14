import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Brain, Plus, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function RiskJournal() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [openSession, setOpenSession] = useState(false);
  const [openDecision, setOpenDecision] = useState(false);
  const [sessionForm, setSessionForm] = useState({ session_type: "pre_session", mood: "neutral", sleep_quality: "average", focus_level: [7], notes: "" });
  const [decisionForm, setDecisionForm] = useState({ situation: "", emotional_state: "neutral", decision_made: "", was_rule_based: true, is_fomo: false, outcome: "" });

  useEffect(() => { if (user) { fetchSessions(); fetchDecisions(); } }, [user]);

  const fetchSessions = async () => { if (!user) return; const { data } = await supabase.from("risk_journal_sessions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20); setSessions(data || []); };
  const fetchDecisions = async () => { if (!user) return; const { data } = await supabase.from("risk_decisions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20); setDecisions(data || []); };

  const saveSession = async () => {
    if (!user) return;
    await supabase.from("risk_journal_sessions").insert({ user_id: user.id, session_date: new Date().toISOString().split("T")[0], ...sessionForm, focus_level: sessionForm.focus_level[0] });
    toast({ title: t("riskJournal.sessionLogged") });
    setOpenSession(false);
    fetchSessions();
  };

  const saveDecision = async () => {
    if (!user || !decisionForm.situation) return;
    await supabase.from("risk_decisions").insert({ user_id: user.id, ...decisionForm });
    toast({ title: t("riskJournal.decisionLogged") });
    setOpenDecision(false);
    fetchDecisions();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Brain className="h-6 w-6 text-psychology" />{t("riskJournal.title")}</h1><p className="text-muted-foreground">{t("riskJournal.subtitle")}</p></div>
        <div className="flex gap-2">
          <Dialog open={openSession} onOpenChange={setOpenSession}>
            <DialogTrigger asChild><Button variant="outline"><Plus className="h-4 w-4 mr-2" />{t("riskJournal.sessionCheckin")}</Button></DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>{t("riskJournal.sessionCheckin")}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>{t("riskJournal.sessionType")}</Label><Select value={sessionForm.session_type} onValueChange={(v) => setSessionForm({ ...sessionForm, session_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pre_session">{t("riskJournal.preSession")}</SelectItem><SelectItem value="post_session">{t("riskJournal.postSession")}</SelectItem></SelectContent></Select></div>
                <div><Label>{t("riskJournal.mood")}</Label><Select value={sessionForm.mood} onValueChange={(v) => setSessionForm({ ...sessionForm, mood: v })}><SelectTrigger><SelectValue>{t(`mood.${sessionForm.mood}`)}</SelectValue></SelectTrigger><SelectContent>{["happy", "neutral", "stressed", "tired", "excited", "anxious"].map(m => <SelectItem key={m} value={m}>{t(`mood.${m}`)}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>{t("riskJournal.focusLevel")}: {sessionForm.focus_level[0]}/10</Label><Slider value={sessionForm.focus_level} onValueChange={(v) => setSessionForm({ ...sessionForm, focus_level: v })} min={1} max={10} /></div>
                <div><Label>{t("riskJournal.notes")}</Label><Textarea value={sessionForm.notes} onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })} /></div>
                <Button onClick={saveSession} className="w-full gradient-emerald">{t("riskJournal.saveSession")}</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openDecision} onOpenChange={setOpenDecision}>
            <DialogTrigger asChild><Button className="gradient-emerald"><AlertTriangle className="h-4 w-4 mr-2" />{t("riskJournal.logDecision")}</Button></DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>{t("riskJournal.logDecision")}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>{t("riskJournal.situation")}</Label><Textarea value={decisionForm.situation} onChange={(e) => setDecisionForm({ ...decisionForm, situation: e.target.value })} placeholder={t("riskJournal.situationPlaceholder")} /></div>
                <div><Label>{t("riskJournal.decisionMade")}</Label><Textarea value={decisionForm.decision_made} onChange={(e) => setDecisionForm({ ...decisionForm, decision_made: e.target.value })} placeholder={t("riskJournal.decisionPlaceholder")} /></div>
                <div><Label>{t("riskJournal.outcome")}</Label><Textarea value={decisionForm.outcome} onChange={(e) => setDecisionForm({ ...decisionForm, outcome: e.target.value })} placeholder={t("riskJournal.outcomePlaceholder")} /></div>
                <Button onClick={saveDecision} className="w-full gradient-emerald">{t("riskJournal.saveDecision")}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="sessions">
        <TabsList className="bg-muted"><TabsTrigger value="sessions">{t("riskJournal.sessionLogs")}</TabsTrigger><TabsTrigger value="decisions">{t("riskJournal.riskDecisions")}</TabsTrigger></TabsList>
        <TabsContent value="sessions" className="mt-4">
          <div className="space-y-3">
            {sessions.map((s) => (
              <Card key={s.id} className="glass-card"><CardContent className="p-4 flex items-center justify-between"><div><p className="font-medium">{t(`sessionType.${s.session_type}`)}</p><p className="text-sm text-muted-foreground">{format(new Date(s.created_at), "MMM dd, yyyy HH:mm")}</p></div><div className="text-right"><p className="text-sm">{t("riskJournal.mood")}: {t(`mood.${s.mood}`)}</p><p className="text-sm text-muted-foreground">{t("riskJournal.focusLevel")}: {s.focus_level}/10</p></div></CardContent></Card>
            ))}
            {sessions.length === 0 && <p className="text-muted-foreground text-center py-8">{t("riskJournal.noSessions")}</p>}
          </div>
        </TabsContent>
        <TabsContent value="decisions" className="mt-4">
          <div className="space-y-3">
            {decisions.map((d) => (
              <Card key={d.id} className="glass-card"><CardContent className="p-4"><p className="font-medium mb-1">{d.situation}</p><p className="text-sm text-muted-foreground">{t("riskJournal.decisionMade")}: {d.decision_made}</p>{d.outcome && <p className="text-sm text-primary mt-1">{t("riskJournal.outcome")}: {d.outcome}</p>}</CardContent></Card>
            ))}
            {decisions.length === 0 && <p className="text-muted-foreground text-center py-8">{t("riskJournal.noDecisions")}</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
