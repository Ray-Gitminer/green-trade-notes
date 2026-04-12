import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import TradeSummary from "@/components/journal/TradeSummary";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import { BookOpen, Plus, AlertTriangle, Trash2, FileDown, Pencil, CalendarIcon, Eye, Download, X, Filter, ImageIcon, Share2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { exportJournalPDF } from "@/utils/journalPdfExport";
import { cn } from "@/lib/utils";

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
  const [editingId, setEditingId] = useState<string | null>(null);

  // Date filter
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [showFilter, setShowFilter] = useState(false);

  // PDF preview
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

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

  // Filtered trades based on date range
  const filteredTrades = useMemo(() => {
    if (!filterStartDate && !filterEndDate) return trades;
    return trades.filter(t => {
      if (!t.trade_date) return false;
      const d = new Date(t.trade_date);
      if (filterStartDate && filterEndDate) {
        return isWithinInterval(d, { start: filterStartDate, end: filterEndDate });
      }
      if (filterStartDate) return d >= filterStartDate;
      if (filterEndDate) return d <= filterEndDate;
      return true;
    });
  }, [trades, filterStartDate, filterEndDate]);

  const handleConditionToggle = (key: string) => {
    setForm(prev => ({
      ...prev,
      entry_conditions: { ...prev.entry_conditions, [key]: !prev.entry_conditions[key as keyof typeof prev.entry_conditions] }
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    const confidenceVal = form.confidence_level ? Math.min(100, Math.max(0, parseInt(form.confidence_level))) : null;
    const conditions = {
      ...form.entry_conditions,
      ...(form.entry_conditions_other ? { other: form.entry_conditions_other } : {}),
    };
    const payload = {
      pair: form.pair,
      trade_type: form.trade_type,
      trade_date: form.trade_date,
      entry_price: form.entry_price ? parseFloat(form.entry_price) : null,
      take_profit: form.take_profit ? parseFloat(form.take_profit) : null,
      stop_loss: form.stop_loss ? parseFloat(form.stop_loss) : null,
      lot_size: form.lot_size ? parseFloat(form.lot_size) : null,
      profit_loss: form.profit_loss ? parseFloat(form.profit_loss) : null,
      emotional_state: form.emotional_state || null,
      confidence_level: confidenceVal,
      entry_conditions: conditions,
      trading_session: form.trading_session || null,
      status: "closed",
    } as any;

    let error;
    if (editingId) {
      ({ error } = await supabase.from("trades").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("trades").insert({ ...payload, user_id: user.id }));
    }
    setSaving(false);
    if (error) { console.error("Trade save error:", error); toast.error(`บันทึกไม่สำเร็จ: ${error.message}`); return; }
    toast.success(editingId ? "แก้ไขเทรดสำเร็จ" : "บันทึกเทรดสำเร็จ");
    setForm(defaultForm);
    setEditingId(null);
    setShowForm(false);
    fetchTrades();
  };

  const handleEdit = (trade: any) => {
    const ec = trade.entry_conditions || {};
    setForm({
      trade_date: trade.trade_date ? format(new Date(trade.trade_date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      entry_conditions: {
        break_m5: !!ec.break_m5,
        daily_frame: !!ec.daily_frame,
        sw_frame: !!ec.sw_frame,
        sig: !!ec.sig,
        ath_frame: !!ec.ath_frame,
      },
      entry_conditions_other: ec.other || "",
      trading_session: trade.trading_session || "",
      lot_size: trade.lot_size != null ? String(trade.lot_size) : "",
      trade_type: trade.trade_type as "buy" | "sell",
      entry_price: trade.entry_price != null ? String(trade.entry_price) : "",
      take_profit: trade.take_profit != null ? String(trade.take_profit) : "",
      stop_loss: trade.stop_loss != null ? String(trade.stop_loss) : "",
      profit_loss: trade.profit_loss != null ? String(trade.profit_loss) : "",
      emotional_state: trade.emotional_state || "",
      confidence_level: trade.confidence_level != null ? String(trade.confidence_level) : "",
      pair: trade.pair || "XAUUSD",
    });
    setEditingId(trade.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("trades").delete().eq("id", id);
    if (error) { toast.error("ลบไม่สำเร็จ"); return; }
    toast.success("ลบเทรดสำเร็จ");
    fetchTrades();
  };

  const handlePreviewPDF = async () => {
    if (!filteredTrades.length) { toast.error("ยังไม่มีข้อมูลเทรดสำหรับส่งออก"); return; }
    toast.info("กำลังสร้างตัวอย่าง PDF...");
    try {
      const doc = await exportJournalPDF(filteredTrades);
      const pdfOutput = doc.output("blob");
      const blob = new Blob([pdfOutput], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfBlob(blob);
      setPdfPreviewUrl(url);
      setShowPdfPreview(true);
    } catch (e) { console.error(e); toast.error("สร้าง PDF ไม่สำเร็จ"); }
  };

  const handleDownloadPDF = async () => {
    if (pdfBlob) {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(pdfBlob);
      link.download = `trade-journal-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("ดาวน์โหลด PDF สำเร็จ");
      return;
    }
    if (!filteredTrades.length) { toast.error("ยังไม่มีข้อมูลเทรดสำหรับส่งออก"); return; }
    toast.info("กำลังสร้าง PDF...");
    try {
      const doc = await exportJournalPDF(filteredTrades);
      doc.save(`trade-journal-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("ส่งออก PDF สำเร็จ");
    } catch (e) { console.error(e); toast.error("สร้าง PDF ไม่สำเร็จ"); }
  };

  const closePdfPreview = () => {
    setShowPdfPreview(false);
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setPdfPreviewUrl(null);
    setPdfBlob(null);
  };

  const handleExportImages = async () => {
    if (!filteredTrades.length) { toast.error("ยังไม่มีข้อมูลเทรดสำหรับส่งออก"); return; }
    toast.info("กำลังสร้างรูปภาพ...");
    try {
      const doc = await exportJournalPDF(filteredTrades);
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        (doc as any).setPage(i);
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const scale = 2;
        const canvas = document.createElement("canvas");
        canvas.width = pageW * scale * (96 / 72);
        canvas.height = pageH * scale * (96 / 72);
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#0f1714";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const imgData = doc.output("datauristring", { filename: `page-${i}.pdf` });
        // Use jsPDF's built-in canvas output per page
        const svgStr = (doc as any).__private__?.getPageSvg?.(i);
        // Fallback: render full PDF as image via iframe
      }
      // Better approach: use pdf.js or convert via blob
      const pdfBlob = new Blob([doc.output("arraybuffer")], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Use canvas-based rendering
      const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
      GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;
      const loadingTask = getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const scale = 2;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        
        canvas.toBlob((blob) => {
          if (!blob) return;
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `trade-journal-${format(new Date(), "yyyy-MM-dd")}-page${i}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, "image/png");
      }
      
      URL.revokeObjectURL(pdfUrl);
      toast.success("ส่งออกรูปภาพสำเร็จ");
    } catch (e) { console.error(e); toast.error("สร้างรูปภาพไม่สำเร็จ"); }
  };

  const handleShareImages = async () => {
    if (!filteredTrades.length) { toast.error("ยังไม่มีข้อมูลเทรดสำหรับส่งออก"); return; }
    toast.info("กำลังสร้างรูปภาพสำหรับแชร์...");
    try {
      const doc = await exportJournalPDF(filteredTrades);
      const pdfBlob = new Blob([doc.output("arraybuffer")], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
      GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;
      const loadingTask = getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      
      const files: File[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const scale = 2;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        
        const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
        files.push(new File([blob], `trade-journal-page${i}.png`, { type: "image/png" }));
      }
      
      URL.revokeObjectURL(pdfUrl);
      
      if (navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({ files, title: "บันทึกการเทรด", text: `สรุปการเทรด ${format(new Date(), "dd/MM/yyyy")}` });
        toast.success("แชร์สำเร็จ");
      } else {
        toast.error("เบราว์เซอร์ไม่รองรับการแชร์ไฟล์ กรุณาดาวน์โหลดแทน");
      }
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      console.error(e); toast.error("แชร์ไม่สำเร็จ");
    }
  };

  const clearFilter = () => {
    setFilterStartDate(undefined);
    setFilterEndDate(undefined);
  };

  const totalPL = filteredTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
  const tradeCount = filteredTrades.length;

  const conditionsText = (conditions: any) => {
    if (!conditions || typeof conditions !== "object") return "-";
    const labels = ENTRY_CONDITIONS.filter(c => conditions[c.key]).map(c => c.label);
    if (conditions.other) labels.push(`อื่นๆ: ${conditions.other}`);
    return labels.join(", ") || "-";
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
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowFilter(!showFilter)} className="border-primary/50 text-primary hover:bg-primary/10">
            <Filter className="h-4 w-4 mr-2" />
            กรองวันที่
          </Button>
          <Button variant="outline" onClick={handlePreviewPDF} className="border-primary/50 text-primary hover:bg-primary/10">
            <Eye className="h-4 w-4 mr-2" />
            ดูตัวอย่าง PDF
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF} className="border-primary/50 text-primary hover:bg-primary/10">
            <FileDown className="h-4 w-4 mr-2" />
            ดาวน์โหลด PDF
          </Button>
          <Button onClick={() => { const next = !showForm; setShowForm(next); if (!next) { setEditingId(null); setForm(defaultForm); } else { window.scrollTo({ top: 0, behavior: 'smooth' }); } }} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? "ปิดฟอร์ม" : "เพิ่มบันทึกเทรด"}
          </Button>
        </div>
      </div>

      {/* Entry Form - at top */}
      {showForm && (
        <Card className="glass-card border-primary/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-primary">{editingId ? "แก้ไขข้อมูลเทรด" : "กรอกข้อมูลเทรด"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
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

            <div>
              <label className="text-xs text-muted-foreground mb-2 block">เงื่อนไขการเข้าเทรด (รอบ กรอบ ซิก)</label>
              <div className="flex flex-wrap gap-4 items-center">
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
                <div className="flex items-center gap-2">
                  <span className="text-sm">อื่นๆ:</span>
                  <Input
                    value={form.entry_conditions_other}
                    onChange={e => setForm(p => ({ ...p, entry_conditions_other: e.target.value }))}
                    placeholder="ระบุเงื่อนไขเพิ่มเติม..."
                    className="bg-transparent border-emerald-800/40 w-48 h-8 text-sm"
                  />
                </div>
              </div>
            </div>

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
              {saving ? "กำลังบันทึก..." : editingId ? "บันทึกการแก้ไข" : "บันทึกเทรด"}
            </Button>
          </CardContent>
        </Card>
      )}

      {showFilter && (
        <Card className="glass-card border-primary/30">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">วันที่เริ่มต้น</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal border-emerald-800/40", !filterStartDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterStartDate ? format(filterStartDate, "dd/MM/yyyy") : "เลือกวันที่"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={filterStartDate} onSelect={setFilterStartDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">วันที่สิ้นสุด</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal border-emerald-800/40", !filterEndDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterEndDate ? format(filterEndDate, "dd/MM/yyyy") : "เลือกวันที่"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={filterEndDate} onSelect={setFilterEndDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <Button variant="ghost" onClick={clearFilter} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4 mr-1" />
                ล้างตัวกรอง
              </Button>
              {(filterStartDate || filterEndDate) && (
                <span className="text-xs text-muted-foreground">
                  แสดง {filteredTrades.length} จาก {trades.length} เทรด
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Trade Summary & Analytics */}
      <TradeSummary trades={filteredTrades} />

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
                <TableHead className="text-emerald-50 font-semibold text-center border border-emerald-700/60 w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrades.map((trade) => (
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
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30" onClick={() => handleEdit(trade)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-950/30" onClick={() => handleDelete(trade.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTrades.length === 0 && (
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

      {/* PDF Preview Dialog */}
      <Dialog open={showPdfPreview} onOpenChange={(open) => { if (!open) closePdfPreview(); }}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <DialogTitle className="text-primary">ตัวอย่าง PDF บันทึกการเทรด</DialogTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleDownloadPDF} className="border-primary/50 text-primary hover:bg-primary/10">
                <Download className="h-4 w-4 mr-2" />
                ดาวน์โหลด
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 p-4 pt-0 min-h-0 overflow-auto bg-white rounded-b-lg">
            {pdfPreviewUrl ? (
              <object data={pdfPreviewUrl} type="application/pdf" className="w-full h-full rounded-lg border border-border">
                <div className="flex flex-col items-center justify-center h-full py-16">
                  <FileDown className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">เบราว์เซอร์ไม่รองรับการแสดง PDF</p>
                  <Button onClick={handleDownloadPDF} className="bg-primary hover:bg-primary/90">
                    <Download className="h-4 w-4 mr-2" />
                    ดาวน์โหลด PDF
                  </Button>
                </div>
              </object>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
