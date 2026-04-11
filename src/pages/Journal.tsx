import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { format } from "date-fns";
import { BookOpen, Plus, AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";

const ENTRY_CONDITIONS = [
  { key: "break_m5", label: "เบรค M5" },
  { key: "daily_frame", label: "กรอบวัน" },
  { key: "sw_frame", label: "กรอบ SW" },
  { key: "sig", label: "SIG" },
  { key: "ath_frame", label: "กรอบ ATH" },
];

const TRADING_SESSIONS = [
  { value: "asia", label: "เช้าเอเชีย" },
  { value: "london", label: "บ่ายลอนดอน" },
  { value: "us", label: "ค่ำอเมริกา" },
];

const SESSION_LABEL: Record<string, string> = {
  asia: "เช้าเอเชีย",
  london: "บ่ายลอนดอน",
  us: "ค่ำอเมริกา",
};

const defaultForm = {
  trade_date: format(new Date(), "yyyy-MM-dd"),
  entry_conditions: { break_m5: false, daily_frame: false, sw_frame: false, sig: false, ath_frame: false },
  entry_conditions_other: "",
  trading_session: "",
  lot_size: "",
  trade_type: "buy" as "buy" | "sell",
  entry_price: "",
  take_profit: "",
  stop_loss: "",
  profit_loss: "",
  emotional_state: "",
  confidence_level: "",
  pair: "XAUUSD",
};

export default function Journal() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [showForm, setShowForm] = useState(false);

  const fetchTrades = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .order("trade_date", { ascending: false });
    setTrades(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { if (user) fetchTrades(); }, [user, fetchTrades]);

  const handleConditionToggle = (key: string) => {
    setForm(prev => ({
      ...prev,
      entry_conditions: { ...prev.entry_conditions, [key]: !prev.entry_conditions[key as keyof typeof prev.entry_conditions] }
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("trades").insert({
      user_id: user.id,
      pair: form.pair,
      trade_type: form.trade_type,
      trade_date: form.trade_date,
      entry_price: form.entry_price ? parseFloat(form.entry_price) : null,
      take_profit: form.take_profit ? parseFloat(form.take_profit) : null,
      stop_loss: form.stop_loss ? parseFloat(form.stop_loss) : null,
      lot_size: form.lot_size ? parseFloat(form.lot_size) : null,
      profit_loss: form.profit_loss ? parseFloat(form.profit_loss) : null,
      emotional_state: form.emotional_state || null,
      confidence_level: form.confidence_level ? parseInt(form.confidence_level) : null,
      entry_conditions: form.entry_conditions,
      trading_session: form.trading_session || null,
      status: "closed",
    } as any);
    setSaving(false);
    if (error) { toast.error("บันทึกไม่สำเร็จ"); return; }
    toast.success("บันทึกเทรดสำเร็จ");
    setForm(defaultForm);
    setShowForm(false);
    fetchTrades();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("trades").delete().eq("id", id);
    if (error) { toast.error("ลบไม่สำเร็จ"); return; }
    toast.success("ลบเทรดสำเร็จ");
    fetchTrades();
  };

  const totalPL = trades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
  const tradeCount = trades.length;

  const conditionsText = (conditions: any) => {
    if (!conditions || typeof conditions !== "object") return "-";
    return ENTRY_CONDITIONS.filter(c => conditions[c.key]).map(c => c.label).join(", ") || "-";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            บันทึกการเทรด ระบบแม่ปลาปากกาเขียว
          </h1>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? "ปิดฟอร์ม" : "เพิ่มบันทึกเทรด"}
        </Button>
      </div>

      {/* Alert / Reminders */}
      <Card className="border-yellow-600/50 bg-yellow-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
            <div className="text-sm space-y-1">
              <p className="text-yellow-400 font-semibold">เตือนสติ</p>
              <p className="text-yellow-300/80">• รอเทรดกราฟเมื่อเข้าเงื่อนไขเท่านั้น (รอบ กรอบ ซิก) ไม่ตรงไม่เทรด เทรดไม่เกิน 3 ครั้ง / วัน</p>
              <p className="text-yellow-300/80">• ถ้าได้ตามเป้าพอใจกำไร <span className="text-red-400 font-bold">*****ออกตลาดได้เลย</span> เปิดกราฟ ไปทำอะไรทำ เช่น ออกกำลังกาย ทำงานบ้าน ออกไปใช้เงิน</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entry Form */}
      {showForm && (
        <Card className="glass-card border-primary/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-primary">กรอกข้อมูลเทรด</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Row 1: Date & Pair */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">วัน/เดือน/ปี</label>
                <Input type="date" value={form.trade_date} onChange={e => setForm(p => ({ ...p, trade_date: e.target.value }))} className="bg-transparent border-emerald-800/40" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">คู่เงิน</label>
                <Input value={form.pair} onChange={e => setForm(p => ({ ...p, pair: e.target.value }))} placeholder="XAUUSD" className="bg-transparent border-emerald-800/40" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Buy / Sell</label>
                <Select value={form.trade_type} onValueChange={v => setForm(p => ({ ...p, trade_type: v as any }))}>
                  <SelectTrigger className="bg-transparent border-emerald-800/40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">ช่วงเวลา</label>
                <Select value={form.trading_session} onValueChange={v => setForm(p => ({ ...p, trading_session: v }))}>
                  <SelectTrigger className="bg-transparent border-emerald-800/40"><SelectValue placeholder="เลือก..." /></SelectTrigger>
                  <SelectContent>
                    {TRADING_SESSIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Entry Conditions */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">เงื่อนไขการเข้าเทรด (รอบ กรอบ ซิก)</label>
              <div className="flex flex-wrap gap-4">
                {ENTRY_CONDITIONS.map(c => (
                  <label key={c.key} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={form.entry_conditions[c.key as keyof typeof form.entry_conditions]}
                      onCheckedChange={() => handleConditionToggle(c.key)}
                      className="border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                    <span className="text-sm">{c.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Row 3: Order Details */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">ล็อตไซด์</label>
                <Input value={form.lot_size} onChange={e => setForm(p => ({ ...p, lot_size: e.target.value }))} placeholder="0.01" className="bg-transparent border-emerald-800/40" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">ราคาเข้า</label>
                <Input value={form.entry_price} onChange={e => setForm(p => ({ ...p, entry_price: e.target.value }))} placeholder="0.00" className="bg-transparent border-emerald-800/40" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">TP</label>
                <Input value={form.take_profit} onChange={e => setForm(p => ({ ...p, take_profit: e.target.value }))} placeholder="0.00" className="bg-transparent border-emerald-800/40" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">SL</label>
                <Input value={form.stop_loss} onChange={e => setForm(p => ({ ...p, stop_loss: e.target.value }))} placeholder="0.00" className="bg-transparent border-emerald-800/40" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">ผลกำไร/ขาดทุน ($)</label>
                <Input value={form.profit_loss} onChange={e => setForm(p => ({ ...p, profit_loss: e.target.value }))} placeholder="0.00" className="bg-transparent border-emerald-800/40" />
              </div>
            </div>

            {/* Row 4: Emotion & Confidence */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">อารมณ์ขณะเทรด</label>
                <Input value={form.emotional_state} onChange={e => setForm(p => ({ ...p, emotional_state: e.target.value }))} placeholder="เช่น สงบ, ตื่นเต้น, กลัว..." className="bg-transparent border-emerald-800/40" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">ความมั่นใจในการวิเคราะห์ (%)</label>
                <Input type="number" min="0" max="100" value={form.confidence_level} onChange={e => setForm(p => ({ ...p, confidence_level: e.target.value }))} placeholder="0-100" className="bg-transparent border-emerald-800/40" />
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={saving} className="w-full bg-primary hover:bg-primary/90">
              {saving ? "กำลังบันทึก..." : "บันทึกเทรด"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Journal Table */}
      <Card className="glass-card">
        <CardContent className="p-0 overflow-x-auto">
          <Table style={{ minWidth: 1100 }}>
            <TableHeader>
              <TableRow className="bg-emerald-900/80 border-emerald-700/60">
                <TableHead className="text-emerald-50 font-semibold text-center border border-emerald-700/60">วัน/เดือน/ปี</TableHead>
                <TableHead className="text-emerald-50 font-semibold text-center border border-emerald-700/60">เงื่อนไขเข้าเทรด</TableHead>
                <TableHead className="text-emerald-50 font-semibold text-center border border-emerald-700/60">ช่วงเวลา</TableHead>
                <TableHead className="text-emerald-50 font-semibold text-center border border-emerald-700/60">ล็อตไซด์</TableHead>
                <TableHead className="text-emerald-50 font-semibold text-center border border-emerald-700/60">Buy/Sell</TableHead>
                <TableHead className="text-emerald-50 font-semibold text-center border border-emerald-700/60">ราคาเข้า</TableHead>
                <TableHead className="text-emerald-50 font-semibold text-center border border-emerald-700/60">TP</TableHead>
                <TableHead className="text-emerald-50 font-semibold text-center border border-emerald-700/60">SL</TableHead>
                <TableHead className="text-emerald-50 font-semibold text-center border border-emerald-700/60">ผลกำไร/ขาดทุน</TableHead>
                <TableHead className="text-emerald-50 font-semibold text-center border border-emerald-700/60">อารมณ์/ความมั่นใจ</TableHead>
                <TableHead className="text-emerald-50 font-semibold text-center border border-emerald-700/60 w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade) => (
                <TableRow key={trade.id} className="border-emerald-800/30 hover:bg-emerald-950/20">
                  <TableCell className="text-center border border-emerald-800/30 text-sm">
                    {trade.trade_date ? format(new Date(trade.trade_date), "dd/MM/yyyy") : "-"}
                  </TableCell>
                  <TableCell className="border border-emerald-800/30 text-xs">
                    {conditionsText(trade.entry_conditions)}
                  </TableCell>
                  <TableCell className="text-center border border-emerald-800/30 text-sm">
                    {trade.trading_session ? (SESSION_LABEL[trade.trading_session as string] || trade.trading_session) : "-"}
                  </TableCell>
                  <TableCell className="text-center border border-emerald-800/30 text-sm">{trade.lot_size ?? "-"}</TableCell>
                  <TableCell className="text-center border border-emerald-800/30">
                    <span className={`text-sm font-semibold ${trade.trade_type === "buy" ? "text-emerald-400" : "text-red-400"}`}>
                      {trade.trade_type === "buy" ? "Buy" : "Sell"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center border border-emerald-800/30 text-sm">{trade.entry_price ?? "-"}</TableCell>
                  <TableCell className="text-center border border-emerald-800/30 text-sm">{trade.take_profit ?? "-"}</TableCell>
                  <TableCell className="text-center border border-emerald-800/30 text-sm">{trade.stop_loss ?? "-"}</TableCell>
                  <TableCell className={`text-center border border-emerald-800/30 text-sm font-semibold ${(trade.profit_loss || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {trade.profit_loss !== null ? `${trade.profit_loss >= 0 ? "+" : ""}$${Number(trade.profit_loss).toFixed(2)}` : "-"}
                  </TableCell>
                  <TableCell className="text-center border border-emerald-800/30 text-xs">
                    {trade.emotional_state || "-"}{trade.confidence_level ? ` (${trade.confidence_level}%)` : ""}
                  </TableCell>
                  <TableCell className="text-center border border-emerald-800/30">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-950/30" onClick={() => handleDelete(trade.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {trades.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">ยังไม่มีบันทึกเทรด</TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-emerald-900/60 border-emerald-700/60">
                <TableCell colSpan={8} className="text-right font-semibold text-emerald-50 border border-emerald-700/60">
                  ผลรวม ({tradeCount} เทรด)
                </TableCell>
                <TableCell className={`text-center font-bold border border-emerald-700/60 ${totalPL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {totalPL >= 0 ? "+" : ""}${totalPL.toFixed(2)}
                </TableCell>
                <TableCell colSpan={2} className="border border-emerald-700/60" />
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
