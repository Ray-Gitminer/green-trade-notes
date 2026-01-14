import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Calculator } from "lucide-react";

const PAIRS = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD", "NZD/USD", "EUR/GBP", "EUR/JPY", "GBP/JPY", "XAU/USD"];
const SIGNALS = ["Strong Buy", "Buy", "Neutral", "Sell", "Strong Sell"];
const EMOTIONS = ["confident", "calm", "anxious", "fomo", "revenge", "tired", "excited", "neutral"];

export default function NewTrade() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isPaperTrade, setIsPaperTrade] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  
  // Check for Ryuta analysis and parsed trade data passed from chat
  const ryutaAnalysis = (location.state as { ryutaAnalysis?: string })?.ryutaAnalysis || "";
  const ryutaTradeData = (location.state as { ryutaTradeData?: { 
    pair?: string; 
    type?: "BUY" | "SELL"; 
    entry?: number; 
    sl?: number; 
    tp?: number;
    confidence?: number;
  } })?.ryutaTradeData;
  
  // Map Ryuta pair format to our format (e.g., XAUUSD -> XAU/USD)
  const formatPairFromRyuta = (pair?: string): string => {
    if (!pair) return "";
    // Try to match common pairs
    const pairMap: Record<string, string> = {
      "XAUUSD": "XAU/USD",
      "EURUSD": "EUR/USD",
      "GBPUSD": "GBP/USD",
      "USDJPY": "USD/JPY",
      "AUDUSD": "AUD/USD",
      "USDCAD": "USD/CAD",
      "NZDUSD": "NZD/USD",
      "EURGBP": "EUR/GBP",
      "EURJPY": "EUR/JPY",
      "GBPJPY": "GBP/JPY"
    };
    return pairMap[pair.toUpperCase()] || pair;
  };

  const [formData, setFormData] = useState({
    pair: formatPairFromRyuta(ryutaTradeData?.pair),
    tradeType: ryutaTradeData?.type?.toLowerCase() || "buy",
    entryPrice: ryutaTradeData?.entry?.toString() || "",
    stopLoss: ryutaTradeData?.sl?.toString() || "",
    takeProfit: ryutaTradeData?.tp?.toString() || "",
    accountBalance: "10000",
    riskPercent: "1",
    emotionalState: "neutral",
    confidenceLevel: [ryutaTradeData?.confidence || 7],
    preTradeNotes: "",
    analysis: ryutaAnalysis ? `--- Ryuta Analysis ---\n${ryutaAnalysis}` : "",
    mnSignal: "", mnNotes: "",
    wSignal: "", wNotes: "",
    dSignal: "", dNotes: "",
    h4Signal: "", h4Notes: "",
    h1Signal: "", h1Notes: "",
  });

  // Fetch profile to get account balance and default risk %
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("account_balance, default_risk_percent")
        .eq("user_id", user.id)
        .single();
      
      if (data) {
        setFormData(prev => ({
          ...prev,
          accountBalance: data.account_balance?.toString() || "10000",
          riskPercent: data.default_risk_percent?.toString() || "1"
        }));
      }
      setProfileLoaded(true);
    };
    fetchProfile();
  }, [user]);

  // Auto-calculate lot size whenever relevant values change
  const calculateLotSize = () => {
    const balance = parseFloat(formData.accountBalance) || 0;
    const riskPct = parseFloat(formData.riskPercent) || 0;
    const entry = parseFloat(formData.entryPrice) || 0;
    const sl = parseFloat(formData.stopLoss) || 0;
    const tp = parseFloat(formData.takeProfit) || 0;
    
    if (!entry || !sl || balance <= 0 || riskPct <= 0) {
      return { lotSize: 0, riskAmount: 0, rrRatio: 0, slPips: 0, slDollars: 0, tpDollars: 0, slPoints: 0, tpPoints: 0 };
    }
    
    const slDistance = Math.abs(entry - sl);
    const tpDistance = Math.abs(tp - entry);
    const riskAmount = balance * (riskPct / 100);
    
    // Determine pip value and lot value based on pair type
    const pair = formData.pair;
    const isJPYPair = pair.includes("JPY");
    const isGoldPair = pair.includes("XAU");
    
    let slPips: number;
    let tpPips: number;
    let slPoints: number;
    let tpPoints: number;
    let pipValuePerLot: number;
    
    if (isGoldPair) {
      // XAU/USD: 1 pip = $0.10 price move, pip value = $5 per pip per standard lot (0.5 per 0.1 lot)
      slPoints = Math.round(slDistance * 100);
      tpPoints = Math.round(tpDistance * 100);
      slPips = slDistance * 10;
      tpPips = tpDistance * 10;
      pipValuePerLot = 5;
    } else if (isJPYPair) {
      // JPY pairs: 1 point = 0.001, 10 points = 1 pip
      slPoints = Math.round(slDistance * 1000);
      tpPoints = Math.round(tpDistance * 1000);
      slPips = slDistance * 100;
      tpPips = tpDistance * 100;
      pipValuePerLot = 10;
    } else {
      // Standard pairs: 1 point = 0.00001, 10 points = 1 pip
      slPoints = Math.round(slDistance * 100000);
      tpPoints = Math.round(tpDistance * 100000);
      slPips = slDistance * 10000;
      tpPips = tpDistance * 10000;
      pipValuePerLot = 10;
    }
    
    // Lot size = Risk Amount / (SL points)
    // NOTE: Use the rounded lot size for downstream $ calculations so numbers match what we display.
    const rawLotSize = slPoints > 0 ? riskAmount / slPoints : 0;
    const lotSize = Math.round(rawLotSize * 100) / 100;

    // Calculate dollar amounts: Lot Size × Points (based on displayed lot size)
    const slDollars = lotSize * slPoints;
    const tpDollars = lotSize * tpPoints;

    const rrRatio = slDistance > 0 ? tpDistance / slDistance : 0;
    
    return { 
      lotSize,
      riskAmount: Math.round(riskAmount * 100) / 100,
      rrRatio: Math.round(rrRatio * 100) / 100,
      slPips: Math.round(slPips * 10) / 10,
      slDollars: Math.round(slDollars * 100) / 100,
      tpDollars: Math.round(tpDollars * 100) / 100,
      slPoints,
      tpPoints
    };
  };

  const { lotSize, riskAmount, rrRatio, slPips, slDollars, tpDollars, slPoints, tpPoints } = calculateLotSize();

  const handleSubmit = async () => {
    if (!user || !formData.pair) {
      toast({ title: t("common.error"), description: t("newTrade.errorSelectPair"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("trades").insert({
        user_id: user.id,
        pair: formData.pair,
        trade_type: formData.tradeType,
        is_paper_trade: isPaperTrade,
        entry_price: parseFloat(formData.entryPrice) || null,
        stop_loss: parseFloat(formData.stopLoss) || null,
        take_profit: parseFloat(formData.takeProfit) || null,
        lot_size: lotSize || null,
        risk_amount: riskAmount || null,
        risk_reward_ratio: rrRatio || null,
        emotional_state: formData.emotionalState,
        confidence_level: formData.confidenceLevel[0],
        pre_trade_notes: formData.preTradeNotes,
        analysis: formData.analysis,
        mn_signal: formData.mnSignal, mn_notes: formData.mnNotes,
        w_signal: formData.wSignal, w_notes: formData.wNotes,
        d_signal: formData.dSignal, d_notes: formData.dNotes,
        h4_signal: formData.h4Signal, h4_notes: formData.h4Notes,
        h1_signal: formData.h1Signal, h1_notes: formData.h1Notes,
        status: "planned",
      });
      if (error) throw error;
      toast({ title: t("newTrade.tradeCreated"), description: `${formData.pair} ${t("newTrade.tradeSaved")}` });
      navigate("/journal");
    } catch (error) {
      toast({ title: t("common.error"), description: "Failed to save trade", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("newTrade.title")}</h1>
          <p className="text-muted-foreground">{t("newTrade.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-muted-foreground">{t("newTrade.paperTrade")}</Label>
          <Switch checked={isPaperTrade} onCheckedChange={setIsPaperTrade} />
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="glass-card">
          <CardHeader><CardTitle>{t("newTrade.tradeSetup")}</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("newTrade.pair")}</Label>
              <Select value={formData.pair} onValueChange={(v) => setFormData({ ...formData, pair: v })}>
                <SelectTrigger><SelectValue placeholder={t("newTrade.selectPair")} /></SelectTrigger>
                <SelectContent>{PAIRS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("newTrade.direction")}</Label>
              <Select value={formData.tradeType} onValueChange={(v) => setFormData({ ...formData, tradeType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">{t("newTrade.buyLong")}</SelectItem>
                  <SelectItem value="sell">{t("newTrade.sellShort")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("newTrade.entryPrice")}</Label>
              <Input type="number" step="0.00001" value={formData.entryPrice} onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("newTrade.stopLoss")}</Label>
              <Input type="number" step="0.00001" value={formData.stopLoss} onChange={(e) => setFormData({ ...formData, stopLoss: e.target.value })} />
              {slPoints > 0 && (
                <p className="text-xs text-destructive">📍 {slPoints} points | 💰 -{slDollars.toLocaleString()} USD</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t("newTrade.takeProfit")}</Label>
              <Input type="number" step="0.00001" value={formData.takeProfit} onChange={(e) => setFormData({ ...formData, takeProfit: e.target.value })} />
              {tpPoints > 0 && (
                <p className="text-xs text-profit">📍 {tpPoints} points | 💰 +{tpDollars.toLocaleString()} USD</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" />{t("newTrade.riskCalculator")}</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t("newTrade.accountBalance")}</Label>
              <Input type="number" value={formData.accountBalance} onChange={(e) => setFormData({ ...formData, accountBalance: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("newTrade.riskPercent")}</Label>
              <Input type="number" step="0.1" value={formData.riskPercent} onChange={(e) => setFormData({ ...formData, riskPercent: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("newTrade.calculatedLotSize")}</Label>
              <div className="h-10 flex items-center px-3 rounded-md bg-primary/10 text-primary font-bold text-lg">
                {lotSize > 0 ? lotSize.toFixed(2) : "—"}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">{t("newTrade.riskAmount")}: <span className="text-foreground font-medium">${riskAmount}</span></div>
            <div className="text-sm text-muted-foreground">{t("newTrade.rrRatio")}: <span className="text-foreground font-medium">{rrRatio > 0 ? `${rrRatio}:1` : "—"}</span></div>
            <div className="text-sm text-muted-foreground">SL Pips: <span className="text-foreground font-medium">{slPips > 0 ? slPips : "—"}</span></div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle>{t("newTrade.psychologyCheck")}</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("newTrade.emotionalState")}</Label>
              <Select value={formData.emotionalState} onValueChange={(v) => setFormData({ ...formData, emotionalState: v })}>
                <SelectTrigger><SelectValue>{t(`emotion.${formData.emotionalState}`)}</SelectValue></SelectTrigger>
                <SelectContent>{EMOTIONS.map(e => <SelectItem key={e} value={e}>{t(`emotion.${e}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("newTrade.confidenceLevel")}: {formData.confidenceLevel[0]}/10</Label>
              <Slider value={formData.confidenceLevel} onValueChange={(v) => setFormData({ ...formData, confidenceLevel: v })} min={1} max={10} step={1} className="mt-2" />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>{t("newTrade.preTradeNotes")}</Label>
              <Textarea placeholder={t("newTrade.preTradeNotesPlaceholder")} value={formData.preTradeNotes} onChange={(e) => setFormData({ ...formData, preTradeNotes: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle>{t("newTrade.analysis")}</CardTitle></CardHeader>
          <CardContent>
            <Textarea placeholder={t("newTrade.analysisPlaceholder")} className="min-h-32" value={formData.analysis} onChange={(e) => setFormData({ ...formData, analysis: e.target.value })} />
          </CardContent>
        </Card>

        <Button onClick={handleSubmit} disabled={loading} className="w-full gradient-emerald">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {t("newTrade.savePlan")}
        </Button>
      </div>
    </div>
  );
}
