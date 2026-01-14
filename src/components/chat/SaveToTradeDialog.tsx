import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, FileText } from "lucide-react";

interface SaveToTradeDialogProps {
  open: boolean;
  onClose: () => void;
  analysisText: string;
}

interface Trade {
  id: string;
  pair: string;
  trade_type: string;
  trade_date: string | null;
  status: string | null;
}

export default function SaveToTradeDialog({ open, onClose, analysisText }: SaveToTradeDialogProps) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedTradeId, setSelectedTradeId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (open && user) {
      fetchTrades();
    }
  }, [open, user]);

  const fetchTrades = async () => {
    if (!user) return;
    setFetching(true);
    
    const { data, error } = await supabase
      .from("trades")
      .select("id, pair, trade_type, trade_date, status")
      .eq("user_id", user.id)
      .in("status", ["planned", "open"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setTrades(data);
      if (data.length > 0) {
        setSelectedTradeId(data[0].id);
      }
    }
    setFetching(false);
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (mode === "existing") {
      if (!selectedTradeId) {
        toast({
          title: language === "th" ? "กรุณาเลือกเทรด" : "Please select a trade",
          variant: "destructive"
        });
        return;
      }
      
      setLoading(true);
      
      // Get existing analysis
      const { data: existingTrade } = await supabase
        .from("trades")
        .select("analysis")
        .eq("id", selectedTradeId)
        .single();
      
      const existingAnalysis = existingTrade?.analysis || "";
      const separator = existingAnalysis ? "\n\n--- Ryuta Analysis ---\n" : "--- Ryuta Analysis ---\n";
      const newAnalysis = existingAnalysis + separator + analysisText;
      
      const { error } = await supabase
        .from("trades")
        .update({ analysis: newAnalysis })
        .eq("id", selectedTradeId);
      
      setLoading(false);
      
      if (error) {
        toast({
          title: language === "th" ? "เกิดข้อผิดพลาด" : "Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: language === "th" ? "บันทึกแล้ว!" : "Saved!",
        description: language === "th" 
          ? "วิเคราะห์ของ Ryuta ถูกเพิ่มลงในเทรดแล้ว" 
          : "Ryuta's analysis has been added to the trade"
      });
      onClose();
    } else {
      // Navigate to new trade page with analysis in URL state
      navigate("/new-trade", { state: { ryutaAnalysis: analysisText } });
      onClose();
    }
  };

  const formatTradeLabel = (trade: Trade) => {
    const date = trade.trade_date 
      ? new Date(trade.trade_date).toLocaleDateString(language === "th" ? "th-TH" : "en-US", { month: "short", day: "numeric" })
      : "";
    const type = trade.trade_type.toUpperCase();
    const status = trade.status ? `[${t(`status.${trade.status}`)}]` : "";
    return `${trade.pair} ${type} ${date} ${status}`.trim();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {language === "th" ? "บันทึกลงเทรด" : "Save to Trade"}
          </DialogTitle>
          <DialogDescription>
            {language === "th" 
              ? "บันทึกการวิเคราะห์ของ Ryuta ลงในเทรดที่มีอยู่หรือสร้างเทรดใหม่"
              : "Save Ryuta's analysis to an existing trade or create a new one"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as "existing" | "new")}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="existing" id="existing" />
              <Label htmlFor="existing" className="cursor-pointer">
                {language === "th" ? "เพิ่มลงเทรดที่มีอยู่" : "Add to existing trade"}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new" className="cursor-pointer">
                {language === "th" ? "สร้างเทรดใหม่" : "Create new trade"}
              </Label>
            </div>
          </RadioGroup>

          {mode === "existing" && (
            <div className="space-y-2">
              <Label>{language === "th" ? "เลือกเทรด" : "Select Trade"}</Label>
              {fetching ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : trades.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  {language === "th" 
                    ? "ไม่มีเทรดที่วางแผนหรือเปิดอยู่ กรุณาสร้างเทรดใหม่"
                    : "No planned or open trades. Please create a new trade."}
                </p>
              ) : (
                <Select value={selectedTradeId} onValueChange={setSelectedTradeId}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === "th" ? "เลือกเทรด" : "Select trade"} />
                  </SelectTrigger>
                  <SelectContent>
                    {trades.map(trade => (
                      <SelectItem key={trade.id} value={trade.id}>
                        {formatTradeLabel(trade)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {mode === "new" && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
              <Plus className="h-4 w-4 inline mr-1" />
              {language === "th" 
                ? "ระบบจะพาไปหน้าสร้างเทรดใหม่พร้อมการวิเคราะห์ของ Ryuta"
                : "You'll be taken to create a new trade with Ryuta's analysis"}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || (mode === "existing" && (fetching || trades.length === 0))}
              className="gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "new" ? (
                <>
                  <Plus className="h-4 w-4" />
                  {language === "th" ? "สร้างเทรดใหม่" : "Create New Trade"}
                </>
              ) : (
                t("common.save")
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
