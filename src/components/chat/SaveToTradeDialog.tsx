import { useState, useEffect, useMemo } from "react";
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
import { Loader2, Plus, FileText, Target, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

interface ParsedTradeData {
  pair?: string;
  type?: "BUY" | "SELL";
  entry?: number;
  sl?: number;
  tp?: number;
  rr?: string;
  confidence?: number;
}

// Parse trade data from Ryuta's response
function parseTradeData(text: string): ParsedTradeData | null {
  const tradeBlockMatch = text.match(/```trade\s*([\s\S]*?)```/);
  if (!tradeBlockMatch) return null;
  
  const block = tradeBlockMatch[1];
  const data: ParsedTradeData = {};
  
  const pairMatch = block.match(/PAIR:\s*([A-Z]{6,})/i);
  if (pairMatch) data.pair = pairMatch[1].toUpperCase();
  
  const typeMatch = block.match(/TYPE:\s*(BUY|SELL)/i);
  if (typeMatch) data.type = typeMatch[1].toUpperCase() as "BUY" | "SELL";
  
  const entryMatch = block.match(/ENTRY:\s*([\d.]+)/);
  if (entryMatch) data.entry = parseFloat(entryMatch[1]);
  
  const slMatch = block.match(/SL:\s*([\d.]+)/);
  if (slMatch) data.sl = parseFloat(slMatch[1]);
  
  const tpMatch = block.match(/TP:\s*([\d.]+)/);
  if (tpMatch) data.tp = parseFloat(tpMatch[1]);
  
  const rrMatch = block.match(/RR:\s*([\d.:]+)/);
  if (rrMatch) data.rr = rrMatch[1];
  
  const confMatch = block.match(/CONFIDENCE:\s*(\d)/);
  if (confMatch) data.confidence = parseInt(confMatch[1]);
  
  return Object.keys(data).length > 0 ? data : null;
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

  // Parse trade data from analysis
  const parsedData = useMemo(() => parseTradeData(analysisText), [analysisText]);

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
      
      // Build update object with parsed data
      const updateData: Record<string, any> = { analysis: newAnalysis };
      
      if (parsedData) {
        if (parsedData.entry) updateData.entry_price = parsedData.entry;
        if (parsedData.sl) updateData.stop_loss = parsedData.sl;
        if (parsedData.tp) updateData.take_profit = parsedData.tp;
        if (parsedData.confidence) updateData.confidence_level = parsedData.confidence;
      }
      
      const { error } = await supabase
        .from("trades")
        .update(updateData)
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
          ? `วิเคราะห์ของ Ryuta ${parsedData ? "พร้อม Entry/SL/TP " : ""}ถูกเพิ่มลงในเทรดแล้ว` 
          : `Ryuta's analysis ${parsedData ? "with Entry/SL/TP " : ""}has been added`
      });
      onClose();
    } else {
      // Navigate to new trade page with analysis and parsed data in URL state
      navigate("/new-trade", { 
        state: { 
          ryutaAnalysis: analysisText,
          ryutaTradeData: parsedData
        } 
      });
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

        {/* Show parsed trade data if available */}
        {parsedData && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4 text-primary" />
              {language === "th" ? "ข้อมูลที่ Ryuta แนะนำ:" : "Ryuta's Recommendations:"}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {parsedData.pair && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Pair:</span>
                  <Badge variant="outline">{parsedData.pair}</Badge>
                </div>
              )}
              {parsedData.type && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant={parsedData.type === "BUY" ? "default" : "destructive"} className="gap-1">
                    {parsedData.type === "BUY" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {parsedData.type}
                  </Badge>
                </div>
              )}
              {parsedData.entry && (
                <div><span className="text-muted-foreground">Entry:</span> <span className="font-mono">{parsedData.entry}</span></div>
              )}
              {parsedData.sl && (
                <div><span className="text-muted-foreground">SL:</span> <span className="font-mono text-destructive">{parsedData.sl}</span></div>
              )}
              {parsedData.tp && (
                <div><span className="text-muted-foreground">TP:</span> <span className="font-mono text-green-500">{parsedData.tp}</span></div>
              )}
              {parsedData.rr && (
                <div><span className="text-muted-foreground">R:R:</span> <span className="font-mono">{parsedData.rr}</span></div>
              )}
              {parsedData.confidence && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Confidence:</span>
                  <span className="font-mono">{parsedData.confidence}/5</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4 pt-2">
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
